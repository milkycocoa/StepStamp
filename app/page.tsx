"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
  const [view, setView] = useState<View>("home")
  const [steps, setSteps] = useState(8432)
  const [input, setInput] = useState("")
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState("EK")
  const [stepError, setStepError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const acquired = Math.min(7, Math.max(1, Math.floor(steps / 1000)))
  const progress = Math.min(100, Math.round((steps / 12000) * 100))

  const saveSteps = () => {
    const value = Number(input.replace(/,/g, ""))
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return
    setSteps(value)
    setInput("")
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
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

function HomeContent({
  name,
  steps,
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
}: any) {

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

    saveSteps()

    setTimeout(() => {
      setIsSubmitting(false)
    }, 2200)
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
              {steps.toLocaleString()}<span>歩</span>
            </div>
            <p className="goal">
              目標 12,000歩まであと {Math.max(0, 12000 - steps).toLocaleString()}歩
            </p>
          </div>

          <div
            className="ring"
            style={{
              background: `conic-gradient(var(--deep) 0 ${progress}%, #d7eee4 ${progress}% 100%)`
            }}
          >
            <strong>{progress}%</strong>
          </div>
        </div>

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
