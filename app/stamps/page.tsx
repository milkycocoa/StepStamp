'use client'

import { ArrowLeft, Lock, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MAX_DAILY_STAMPS,
  STEPS_PER_STAMP,
  getStamps,
  syncStampsForDate,
} from '@/lib/stamps'
import BottomNav from '@/components/bottom-nav'

type RallyDay = {
  date: string
  weekday: string
  stepCount: number
  stampCount: number
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getCurrentWeek() {
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      date: formatDate(date),
      weekday: new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(date),
    }
  })

  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  return { days, startAt: monday.toISOString(), endAt: nextMonday.toISOString() }
}

function StampRow({ days }: { days: RallyDay[] }) {
  return (
    <div className="stamp-row stamp-grid">
      {days.map((day) => (
        <div className={`stamp ${day.stampCount > 0 ? 'acquired' : ''}`} key={day.date}>
          <div className="stamp-dot">
            {day.stampCount > 0 ? <Sparkles /> : <Lock />}
          </div>
          <span>{day.weekday}曜日</span>
          <small>{day.stampCount}/{MAX_DAILY_STAMPS}個</small>
          <div className="daily-stamp-track" aria-label={`${day.stampCount} / ${MAX_DAILY_STAMPS}個`}>
            {Array.from({ length: MAX_DAILY_STAMPS }, (_, index) => (
              <i className={index < day.stampCount ? 'earned' : ''} key={index} />
            ))}
          </div>
          <small>
            {day.stampCount >= MAX_DAILY_STAMPS
              ? '上限達成'
              : `あと${Math.max(0, STEPS_PER_STAMP - (day.stepCount % STEPS_PER_STAMP)).toLocaleString()}歩`}
          </small>
        </div>
      ))}
    </div>
  )
}

export default function StampPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [days, setDays] = useState<RallyDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadRally = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        setErrorMessage('スタンプラリーを見るにはログインしてください。')
        return
      }

      const week = getCurrentWeek()
      const { data: stepEntries, error: stepsError } = await supabase
        .from('steps')
        .select('date, step_count')
        .eq('user_id', user.id)
        .gte('date', week.days[0].date)
        .lte('date', week.days[6].date)

      if (stepsError) throw stepsError
      const stepCountByDate = new Map(
        (stepEntries ?? []).map((entry) => [entry.date, entry.step_count]),
      )

      for (const day of week.days) {
        const { error } = await syncStampsForDate(
          user.id,
          day.date,
          stepCountByDate.get(day.date) ?? 0,
          supabase,
        )
        if (error) throw error
      }

      const { data: stamps, error: stampsError } = await getStamps(
        user.id,
        week.startAt,
        week.endAt,
        supabase,
      )
      if (stampsError) throw stampsError

      const stampCountByDate = new Map<string, number>()
      for (const stamp of stamps ?? []) {
        const date = formatDate(new Date(stamp.acquired_at))
        stampCountByDate.set(date, (stampCountByDate.get(date) ?? 0) + 1)
      }

      setDays(week.days.map((day) => ({
        ...day,
        stepCount: stepCountByDate.get(day.date) ?? 0,
        stampCount: stampCountByDate.get(day.date) ?? 0,
      })))
    } catch (error) {
      const details = error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error)
      console.error('スタンプラリーの取得に失敗しました:', details)
      setErrorMessage('スタンプラリーを読み込めませんでした。時間をおいて再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadRally()
  }, [loadRally])

  const totalStamps = days.reduce((total, day) => total + day.stampCount, 0)
  const weeklyStampGoal = MAX_DAILY_STAMPS * 7
  const weeklyGoalProgress = Math.min(100, Math.round((totalStamps / weeklyStampGoal) * 100))

  return (
    <main className="app-shell">
      <div className="phone">
        <div className="content inner-page">
          <button className="back-button" onClick={() => router.push('/')}>
            <ArrowLeft /> 戻る
          </button>
          <p className="eyebrow">今週のチャレンジ</p>
          <h1 className="page-title">スタンプラリー</h1>
          <div className="rally-summary">
            <div>
              <span>週の目標達成率（最大{weeklyStampGoal}個）</span>
              <strong>{weeklyGoalProgress}%</strong>
            </div>
            <div className="mini-progress">
              <i style={{ width: `${weeklyGoalProgress}%` }} />
            </div>
            <p>今週 {totalStamps} / {weeklyStampGoal}個のスタンプを獲得</p>
          </div>
          {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
          {isLoading ? (
            <p className="history-empty">スタンプを読み込み中です…</p>
          ) : days.length > 0 ? (
            <StampRow days={days} />
          ) : (
            <p className="history-empty">今週の歩数記録はまだありません。</p>
          )}
          <div className="info">
            <div className="info-mark">i</div>
            <p>1日の目標は{(MAX_DAILY_STAMPS * STEPS_PER_STAMP).toLocaleString()}歩です。{STEPS_PER_STAMP.toLocaleString()}歩ごとに1つ、1日最大{MAX_DAILY_STAMPS}個のスタンプを獲得できます。</p>
          </div>
        </div>
        <BottomNav />
      </div>
    </main>
  )
}
