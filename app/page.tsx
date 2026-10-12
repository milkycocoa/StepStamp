"use client"

import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Bell,
  Check,
  Footprints,
  History,
  Lock,
  Pencil,
  Sparkles,
  UserRound,
} from "lucide-react"

type View = "home"
const stampDays = ["月", "火", "水", "木", "金", "土", "日"]

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [view, setView] = useState<View>("home")
  const [steps, setSteps] = useState(0)
  const [isLoadingSteps, setIsLoadingSteps] = useState(true)
  const [stepLoadError, setStepLoadError] = useState("")
  const [input, setInput] = useState("")
  const [saved, setSaved] = useState(false)
  const name = "EK"
  const [stepError, setStepError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const acquired = Math.min(7, Math.max(1, Math.floor(steps / 1000)))
  const progress = Math.min(100, Math.round((steps / 12000) * 100))

  useEffect(() => {
    let isCurrent = true

    const loadTodaySteps = async () => {
      setIsLoadingSteps(true)
      setStepLoadError("")

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          setSteps(0)
          return
        }

        const now = new Date()
        const date = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-")
        const { data, error } = await supabase
          .from("steps")
          .select("step_count")
          .eq("user_id", user.id)
          .eq("date", date)
          .maybeSingle()

        if (error) throw error
        if (isCurrent) setSteps(data?.step_count ?? 0)
      } catch (error) {
        console.error("今日の歩数の取得に失敗しました", error)
        if (isCurrent) setStepLoadError("今日の歩数を読み込めませんでした。時間をおいて再度お試しください")
      } finally {
        if (isCurrent) setIsLoadingSteps(false)
      }
    }

    void loadTodaySteps()
    return () => {
      isCurrent = false
    }
  }, [supabase])

  const saveSteps = async () => {
    const value = Number(input.replace(/,/g, ""))
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
      setStepError("1以上の歩数を入力してください")
      return false
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        setStepError("ログイン状態を確認できませんでした。もう一度お試しください")
        return false
      }

      if (!user) {
        setStepError("ログインが必要です。ログインしてからお試しください")
        return false
      }

      const now = new Date()
      const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-")
      const { data: existingStep, error: lookupError } = await supabase
        .from("steps")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("date", date)
        .limit(1)
        .maybeSingle()

      if (lookupError) {
        setStepError("歩数を保存できませんでした。もう一度お試しください")
        return false
      }

      const saveResult = existingStep
        ? await supabase
            .from("steps")
            .update({ step_count: value })
            .eq("user_id", user.id)
            .eq("date", date)
        : await supabase.from("steps").insert({
            user_id: user.id,
            date,
            step_count: value,
          })

      if (saveResult.error) {
        setStepError("歩数を保存できませんでした。もう一度お試しください")
        return false
      }

      setSteps(value)
      setStepLoadError("")
      setInput("")
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
      return true
    } catch {
      setStepError("歩数を保存できませんでした。もう一度お試しください")
      return false
    }
  }

  return (
    <main className="app-shell">
      <div className="phone">
        <header className="header">
          <div className="brand"><div className="logo"><Footprints size={21} /></div><span className="brand-name">StepStamp</span></div>
          <button className="icon-btn" aria-label="通知"><Bell size={19} /></button>
        </header>
        {view === "home" && (
          <HomeContent
            name={name}
            steps={steps}
            isLoadingSteps={isLoadingSteps}
            stepLoadError={stepLoadError}
            progress={progress}
            acquired={acquired}
            input={input}
            setInput={setInput}
            saveSteps={saveSteps}
            saved={saved}
            router={router}
            stepError={stepError}
            setStepError={setStepError}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        )}
        <nav className="nav" aria-label="メインナビゲーション">
          <NavItem active={view === "home"} icon={<Footprints />} label="ホーム" onClick={() => setView("home")} />
          <NavItem active={false} icon={<Sparkles />} label="スタンプ" onClick={() => router.push('/stamps')} />
          <NavItem active={false} icon={<History />} label="歩数一覧" onClick={() => router.push('/steps')} />
          <NavItem active={false} icon={<UserRound />} label="プロフィール" onClick={() => router.push('/profile')} />
        </nav>
      </div>
    </main>
  )
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{icon}{label}</button>
}

type HomeContentProps = {
  name: string
  steps: number
  isLoadingSteps: boolean
  stepLoadError: string
  progress: number
  acquired: number
  input: string
  setInput: Dispatch<SetStateAction<string>>
  saveSteps: () => Promise<boolean>
  saved: boolean
  router: ReturnType<typeof useRouter>
  stepError: string
  setStepError: Dispatch<SetStateAction<string>>
  isSubmitting: boolean
  setIsSubmitting: Dispatch<SetStateAction<boolean>>
}

function HomeContent({
  name,
  steps,
  isLoadingSteps,
  stepLoadError,
  progress,
  acquired,
  input,
  setInput,
  saveSteps,
  saved,
  router,
  stepError,
  setStepError,
  isSubmitting,
  setIsSubmitting
}: HomeContentProps) {

  const handleSave = () => {
    const value = Number(input.replace(/,/g, ""))

    // 空欄
    if (!input) {
      setStepError("歩数を入力してください")
      return
    }

    // 数字以外
    if (!/^\d+$/.test(input)) {
      setStepError("数字のみ入力できます")
      return
    }

    // 0以下
    if (value <= 0) {
      setStepError("1以上の歩数を入力してください")
      return
    }

    // エラーなし
    setStepError("")
    setIsSubmitting(true)

    void saveSteps().finally(() => {
      setIsSubmitting(false)
    })
  }

  return (
    <div className="content">
      <p className="greeting">おかえりなさい、{name}さん</p>
      <h1 className="title">今日も一歩ずつ。</h1>

      <section className="hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">本日の歩数</p>
            <div className="step-count">
              {isLoadingSteps ? "読み込み中…" : steps.toLocaleString()}
              {!isLoadingSteps && <span>歩</span>}
            </div>
            <p className="goal">
              {isLoadingSteps
                ? "歩数を確認しています"
                : `目標 12,000歩まであと ${Math.max(0, 12000 - steps).toLocaleString()}歩`}
            </p>
          </div>

          <div
            className="ring"
            style={{
              background: `conic-gradient(var(--deep) 0 ${progress}%, #d7eee4 ${progress}% 100%)`
            }}
          >
            <strong>{isLoadingSteps ? "…" : `${progress}%`}</strong>
          </div>
        </div>

        {stepLoadError && <p className="error" role="alert">{stepLoadError}</p>}

        {/* 入力欄＋ボタン */}
        <div className="entry">
          <input
            className={stepError ? "step-input input-error" : "step-input"}
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setStepError("")
            }}
            placeholder="今日の歩数を入力"
            inputMode="numeric"
            aria-label="今日の歩数"
          />

          <button
            className="primary"
            onClick={handleSave}
            disabled={isSubmitting || !!stepError}
          >
            {isSubmitting ? "記録中..." : "記録する"}
          </button>
        </div>

        {/* エラー表示 */}
        {stepError && <p className="error">{stepError}</p>}

        {/* 記録成功メッセージ */}
        {saved && (
          <p className="success-message">
            <Check size={14} />歩数を記録しました。スタンプを確認しましょう。
          </p>
        )}
      </section>

      {/* 以下は既存のまま */}
      <div className="section-head">
        <h2>今週のスタンプラリー</h2>
        <button className="link" onClick={() => router.push('/stamp')}>
          すべて見る →
        </button>
      </div>

      <StampRow acquired={acquired} />

      <div className="info">
        <div className="info-mark">i</div>
        <p>
          1,000歩達成するごとにスタンプを獲得できます。<br />
          あと <strong>{Math.max(0, 1000 - (steps % 1000)).toLocaleString()}歩</strong> で次のスタンプです。
        </p>
      </div>

      <section className="features">
        <div className="section-head">
          <h2>StepStampでできること</h2>
        </div>

        <div className="feature-grid">
          <div className="feature">
            <Footprints className="feature-icon" />
            <h3>歩数を記録</h3>
            <p>毎日の歩数をかんたん入力</p>
          </div>

          <div className="feature">
            <Sparkles className="feature-icon" />
            <h3>スタンプを集める</h3>
            <p>達成感を楽しみながら継続</p>
          </div>

          <div className="feature">
            <Pencil className="feature-icon" />
            <h3>履歴を確認</h3>
            <p>これまでの歩みを振り返る</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StampRow({ acquired, large = false }: { acquired: number; large?: boolean }) { return <div className={`stamp-row ${large ? "stamp-grid" : ""}`}>{stampDays.map((day, index) => <div className={`stamp ${index < acquired ? "acquired" : ""}`} key={day}><div className="stamp-dot">{index < acquired ? <Sparkles /> : <Lock />}</div><span>{day}曜日</span>{index < acquired && <small>達成</small>}</div>)}</div> }
