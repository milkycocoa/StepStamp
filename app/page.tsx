"use client"

import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { DAILY_STEP_GOAL, MAX_DAILY_STAMPS, STEPS_PER_STAMP, syncStampsForDate } from "@/lib/stamps"
import {
  Check,
  Footprints,
  Lock,
  Pencil,
  Sparkles,
  UserRound,
} from "lucide-react"
import BottomNav from "@/components/bottom-nav"

function getErrorLogMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  if (typeof error !== "object" || error === null) return String(error)

  const details = error as Record<string, unknown>
  const fields = ["name", "message", "code", "details", "hint"] as const
  const message = fields
    .map((field) => {
      const value = details[field]
      return typeof value === "string" && value ? `${field}=${value}` : ""
    })
    .filter(Boolean)
    .join(", ")

  return message || "Unknown error object"
}

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [steps, setSteps] = useState(0)
  const [isLoadingSteps, setIsLoadingSteps] = useState(true)
  const [stepLoadError, setStepLoadError] = useState("")
  const [input, setInput] = useState("")
  const [saved, setSaved] = useState(false)
  const [stepError, setStepError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [account, setAccount] = useState<{ name: string; iconUrl: string } | null>(null)

  const acquired = Math.min(MAX_DAILY_STAMPS, Math.floor(steps / STEPS_PER_STAMP))
  const progress = Math.min(100, Math.round((steps / DAILY_STEP_GOAL) * 100))

  useEffect(() => {
    let isCurrent = true

    const loadAccount = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError) throw authError
        const user = session?.user
        if (!user) {
          if (isCurrent) setAccount(null)
          return
        }

        const { data, error } = await supabase
          .from("users")
          .select("name, icon_url")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error
        if (isCurrent) {
          setAccount({
            name: data?.name?.trim() || user.email || "アカウント",
            iconUrl: data?.icon_url ?? "",
          })
        }
      } catch (error) {
        console.error("アカウント情報の取得に失敗しました", error)
      }
    }

    void loadAccount()
    return () => {
      isCurrent = false
    }
  }, [supabase])

  useEffect(() => {
    let isCurrent = true

    const loadTodaySteps = async () => {
      setIsLoadingSteps(true)
      setStepLoadError("")

      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError) throw authError
        const user = session?.user
        if (!user) {
          if (isCurrent) setSteps(0)
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
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (isCurrent) setSteps(data?.step_count ?? 0)
      } catch (error) {
        console.warn("今日の歩数の取得に失敗しました:", getErrorLogMessage(error))
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
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      const user = session?.user

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

      if (existingStep) {
        setStepError("今日の歩数はすでに記録されています。変更する場合は歩数一覧から編集してください")
        return false
      }

      const saveResult = await supabase.from("steps").insert({
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

      try {
        const { error: stampError } = await syncStampsForDate(user.id, date, value, supabase)
        if (stampError) throw stampError
      } catch (stampError) {
        console.error("歩数保存後のスタンプ更新に失敗しました", stampError)
        setStepError("歩数は記録しましたが、スタンプを更新できませんでした。スタンプ画面を開いて再度お試しください")
      }

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
          <button
            className="account-button"
            onClick={() => router.push(account ? "/profile" : "/signin")}
            aria-label={account ? "プロフィールを編集" : "ログイン"}
          >
            <span className="account-avatar">
              {account?.iconUrl ? (
                <Image
                  src={account.iconUrl}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                />
              ) : (
                <UserRound size={19} />
              )}
            </span>
            <span className="account-name">{account?.name ?? "ログイン"}</span>
          </button>
        </header>
        <HomeContent
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
        <BottomNav />
      </div>
    </main>
  )
}

type HomeContentProps = {
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
                : `目標 ${DAILY_STEP_GOAL.toLocaleString()}歩まであと ${Math.max(0, DAILY_STEP_GOAL - steps).toLocaleString()}歩`}
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
        <button className="link" onClick={() => router.push('/stamps')}>
          すべて見る →
        </button>
      </div>

      <p className="today-stamp-count">今日のスタンプ：{acquired} / {MAX_DAILY_STAMPS}個</p>
      <StampRow acquired={acquired} />

      <div className="info">
        <div className="info-mark">i</div>
        <p>
          {STEPS_PER_STAMP.toLocaleString()}歩達成するごとにスタンプを獲得できます。<br />
          {acquired >= MAX_DAILY_STAMPS
            ? <>今日の上限に達しました。</>
            : <>あと <strong>{(STEPS_PER_STAMP - (steps % STEPS_PER_STAMP)).toLocaleString()}歩</strong> で次のスタンプです。</>}
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

function StampRow({ acquired }: { acquired: number }) {
  return (
    <div className="daily-stamp-row" aria-label={`今日のスタンプ ${acquired}個、最大${MAX_DAILY_STAMPS}個`}>
      {Array.from({ length: MAX_DAILY_STAMPS }, (_, index) => (
        <div className={`daily-stamp ${index < acquired ? "acquired" : ""}`} key={index}>
          {index < acquired ? <Sparkles size={15} /> : <Lock size={13} />}
        </div>
      ))}
    </div>
  )
}
