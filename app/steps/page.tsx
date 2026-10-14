'use client'

import { ArrowLeft, Check, Pencil, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/bottom-nav'

type StepEntry = { date: string; step_count: number }

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  })
}

function getLocalDate() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

export default function StepsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [history, setHistory] = useState<StepEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [busyDate, setBusyDate] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      const user = session?.user
      if (!user) {
        setErrorMessage('歩数一覧を見るにはログインしてください。')
        return
      }

      const { data, error } = await supabase
        .from('steps')
        .select('date, step_count')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setHistory(data ?? [])
    } catch (error) {
      console.error('歩数一覧の取得に失敗しました', error)
      setErrorMessage('歩数一覧を読み込めませんでした。時間をおいて再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const total = history.reduce((sum, entry) => sum + entry.step_count, 0)

  const startEditing = (entry: StepEntry) => {
    setEditingDate(entry.date)
    setEditValue(String(entry.step_count))
    setErrorMessage('')
  }

  const saveEdit = async (date: string) => {
    const value = Number(editValue)
    if (!editValue.trim() || !Number.isSafeInteger(value) || value < 1) {
      setErrorMessage('1以上の歩数を入力してください')
      return
    }

    setBusyDate(date)
    setErrorMessage('')
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      const user = session?.user
      if (!user) {
        setErrorMessage('ログイン状態を確認できませんでした。再度ログインしてください。')
        return
      }

      const { data, error } = await supabase
        .from('steps')
        .update({ step_count: value })
        .eq('user_id', user.id)
        .eq('date', date)
        .select('date, step_count')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setErrorMessage('記録が見つからないため、更新できませんでした。')
        return
      }

      setHistory((items) => items.map((item) => item.date === date ? data : item))
      setEditingDate(null)
    } catch (error) {
      console.error('歩数記録の更新に失敗しました', error)
      setErrorMessage('歩数を更新できませんでした。時間をおいて再度お試しください。')
    } finally {
      setBusyDate(null)
    }
  }

  const removeEntry = async (date: string) => {
    if (!window.confirm('この歩数記録を削除しますか？')) return

    setBusyDate(date)
    setErrorMessage('')
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      const user = session?.user
      if (!user) {
        setErrorMessage('ログイン状態を確認できませんでした。再度ログインしてください。')
        return
      }

      const { data, error } = await supabase
        .from('steps')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date)
        .select('date')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setErrorMessage('記録が見つからないため、削除できませんでした。')
        return
      }

      setHistory((items) => items.filter((item) => item.date !== date))
      if (editingDate === date) setEditingDate(null)
    } catch (error) {
      console.error('歩数記録の削除に失敗しました', error)
      setErrorMessage('歩数を削除できませんでした。時間をおいて再度お試しください。')
    } finally {
      setBusyDate(null)
    }
  }

  return (
    <main className="app-shell">
      <div className="phone">
        <div className="content inner-page">
          <button className="back-button" onClick={() => router.push('/')}>
            <ArrowLeft /> 戻る
          </button>
          <p className="eyebrow">あなたの記録</p>
          <h1 className="page-title">歩数一覧</h1>
          <div className="history-total">
            <span>累計歩数</span>
            <strong>{total.toLocaleString()}<small>歩</small></strong>
          </div>
          <div className="section-head history-heading">
            <h2>履歴</h2>
            <span>{history.length}日分</span>
          </div>

          {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
          {isLoading ? (
            <p className="history-empty">歩数記録を読み込み中です…</p>
          ) : history.length === 0 && !errorMessage ? (
            <p className="history-empty">歩数記録はまだありません。</p>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div className="history-card" key={entry.date}>
                  <div>
                    <strong>{formatDate(entry.date)}</strong>
                    <span>{entry.date === getLocalDate() ? '今日' : ''}</span>
                  </div>
                  {editingDate === entry.date ? (
                    <input
                      className="inline-edit"
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`${formatDate(entry.date)}の歩数`}
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      disabled={busyDate === entry.date}
                    />
                  ) : (
                    <b>{entry.step_count.toLocaleString()} 歩</b>
                  )}
                  <div className="history-actions">
                    {editingDate === entry.date ? (
                      <>
                        <button
                          aria-label="保存"
                          onClick={() => void saveEdit(entry.date)}
                          disabled={busyDate === entry.date}
                        ><Check /></button>
                        <button
                          aria-label="編集をキャンセル"
                          onClick={() => setEditingDate(null)}
                          disabled={busyDate === entry.date}
                        ><X /></button>
                      </>
                    ) : (
                      <button
                        aria-label={`${formatDate(entry.date)}の記録を編集`}
                        onClick={() => startEditing(entry)}
                        disabled={busyDate === entry.date}
                      ><Pencil /></button>
                    )}
                    <button
                      aria-label={`${formatDate(entry.date)}の記録を削除`}
                      onClick={() => void removeEntry(entry.date)}
                      disabled={busyDate === entry.date}
                    ><Trash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </main>
  )
}
