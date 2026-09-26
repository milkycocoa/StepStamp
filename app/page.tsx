"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Bell,
  Check,
  Footprints,
  History,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react"

type View = "home" | "stamps" | "history" | "profile"
type StepEntry = { id: number; date: string; steps: number }

const initialHistory: StepEntry[] = [
  { id: 1, date: "2025-09-22", steps: 10234 },
  { id: 2, date: "2025-09-21", steps: 8432 },
  { id: 3, date: "2025-09-20", steps: 9120 },
  { id: 4, date: "2025-09-19", steps: 5600 },
]
const stampDays = ["月", "火", "水", "木", "金", "土", "日"]

export default function HomePage() {
  const [mode, setMode] = useState<"signup" | "login" | "app">("signup")
  const [view, setView] = useState<View>("home")
  const [steps, setSteps] = useState(8432)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState(initialHistory)
  const [saved, setSaved] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState("EK")

  const acquired = Math.min(7, Math.max(1, Math.floor(steps / 1000)))
  const progress = Math.min(100, Math.round((steps / 12000) * 100))
  const total = useMemo(() => history.reduce((sum, entry) => sum + entry.steps, 0), [history])

  const saveSteps = () => {
    const value = Number(input.replace(/,/g, ""))
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return
    setSteps(value)
    setHistory((current) => [{ id: Date.now(), date: "2025-09-26", steps: value }, ...current.filter((entry) => entry.date !== "2025-09-26")])
    setInput("")
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const enterApp = () => setMode("app")

  if (mode !== "app") {
    return (
      <main className="app-shell auth-shell">
        <div className="phone auth-phone">
          <div className="auth-content">
            <div className="auth-logo"><Footprints size={27} /></div>
            <p className="auth-kicker">歩いて、集めて、続けよう。</p>
            <h1>StepStamp</h1>
            <p className="auth-copy">毎日の歩数を、達成感に変える<br />スタンプラリーアプリ</p>
            <div className="auth-form">
              <label>メールアドレス<input type="email" placeholder="you@example.com" /></label>
              <label>パスワード<input type="password" placeholder="6文字以上" /></label>
              <button className="primary auth-submit" onClick={enterApp}>{mode === "signup" ? "アカウントを作成" : "ログイン"}</button>
            </div>
            <p className="auth-switch">{mode === "signup" ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"} <button onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "ログイン" : "新規登録"}</button></p>
            <p className="prototype-note">プロトタイプ：入力内容は保存されません</p>
          </div>
        </div>
      </main>
    )
  }

  const pageTitle = { home: "", stamps: "スタンプラリー", history: "歩数一覧", profile: "プロフィール編集" }[view]

  return (
    <main className="app-shell">
      <div className="phone">
        <header className="header">
          <div className="brand"><div className="logo"><Footprints size={21} /></div><span className="brand-name">StepStamp</span></div>
          <button className="icon-btn" aria-label="通知"><Bell size={19} /></button>
        </header>
        {view === "home" && <HomeContent name={name} steps={steps} progress={progress} acquired={acquired} input={input} setInput={setInput} saveSteps={saveSteps} saved={saved} setView={setView} />}
        {view === "stamps" && <StampsContent acquired={acquired} progress={progress} setView={setView} />}
        {view === "history" && <HistoryContent history={history} total={total} editingId={editingId} setEditingId={setEditingId} setHistory={setHistory} setView={setView} />}
        {view === "profile" && <ProfileContent name={name} setName={setName} setView={setView} setMode={setMode} />}
        <nav className="nav" aria-label="メインナビゲーション">
          <NavItem active={view === "home"} icon={<Footprints />} label="ホーム" onClick={() => setView("home")} />
          <NavItem active={view === "stamps"} icon={<Sparkles />} label="スタンプ" onClick={() => setView("stamps")} />
          <NavItem active={view === "history"} icon={<History />} label="歩数一覧" onClick={() => setView("history")} />
          <NavItem active={view === "profile"} icon={<UserRound />} label="プロフィール" onClick={() => setView("profile")} />
        </nav>
      </div>
    </main>
  )
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{icon}{label}</button>
}

function HomeContent({ name, steps, progress, acquired, input, setInput, saveSteps, saved, setView }: any) {
  return <div className="content"><p className="greeting">おかえりなさい、{name}さん</p><h1 className="title">今日も一歩ずつ。</h1><section className="hero"><div className="hero-top"><div><p className="eyebrow">本日の歩数</p><div className="step-count">{steps.toLocaleString()}<span>歩</span></div><p className="goal">目標 12,000歩まであと {Math.max(0, 12000 - steps).toLocaleString()}歩</p></div><div className="ring" style={{ background: `conic-gradient(var(--deep) 0 ${progress}%, #d7eee4 ${progress}% 100%)` }}><strong>{progress}%</strong></div></div><div className="entry"><input className="step-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) saveSteps() }} placeholder="今日の歩数を入力" inputMode="numeric" aria-label="今日の歩数" /><button className="primary" onClick={saveSteps}>記録する</button></div>{saved && <p className="success-message"><Check size={14} />歩数を記録しました。スタンプを確認しましょう。</p>}</section><div className="section-head"><h2>今週のスタンプラリー</h2><button className="link" onClick={() => setView("stamps")}>すべて見る →</button></div><StampRow acquired={acquired} /><div className="info"><div className="info-mark">i</div><p>1,000歩達成するごとにスタンプを獲得できます。<br />あと <strong>{Math.max(0, 1000 - (steps % 1000)).toLocaleString()}歩</strong> で次のスタンプです。</p></div><section className="features"><div className="section-head"><h2>StepStampでできること</h2></div><div className="feature-grid"><div className="feature"><Footprints className="feature-icon" /><h3>歩数を記録</h3><p>毎日の歩数をかんたん入力</p></div><div className="feature"><Sparkles className="feature-icon" /><h3>スタンプを集める</h3><p>達成感を楽しみながら継続</p></div><div className="feature"><Pencil className="feature-icon" /><h3>履歴を確認</h3><p>これまでの歩みを振り返る</p></div></div></section></div>
}

function StampRow({ acquired, large = false }: { acquired: number; large?: boolean }) { return <div className={`stamp-row ${large ? "stamp-grid" : ""}`}>{stampDays.map((day, index) => <div className={`stamp ${index < acquired ? "acquired" : ""}`} key={day}><div className="stamp-dot">{index < acquired ? <Sparkles /> : <Lock />}</div><span>{day}曜日</span>{index < acquired && <small>達成</small>}</div>)}</div> }
function StampsContent({ acquired, progress, setView }: any) { return <div className="content inner-page"><button className="back-button" onClick={() => setView("home")}><ArrowLeft /> 戻る</button><p className="eyebrow">今週のチャレンジ</p><h1 className="page-title">スタンプラリー</h1><div className="rally-summary"><div><span>達成率</span><strong>{Math.round((acquired / 7) * 100)}%</strong></div><div className="mini-progress"><i style={{ width: `${(acquired / 7) * 100}%` }} /></div><p>{acquired} / 7個のスタンプを獲得中</p></div><StampRow acquired={acquired} large /><div className="info"><div className="info-mark">i</div><p>歩数を入力して、1,000歩ごとのスタンプを集めよう。</p></div></div> }
function HistoryContent({ history, total, editingId, setEditingId, setHistory, setView }: any) { return <div className="content inner-page"><button className="back-button" onClick={() => setView("home")}><ArrowLeft /> 戻る</button><p className="eyebrow">あなたの記録</p><h1 className="page-title">歩数一覧</h1><div className="history-total"><span>累計歩数</span><strong>{total.toLocaleString()}<small>歩</small></strong></div><div className="section-head history-heading"><h2>履歴</h2><span>{history.length}日分</span></div><div className="history-list">{history.map((entry: StepEntry) => <div className="history-card" key={entry.id}><div><strong>{new Date(entry.date).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}</strong><span>{entry.date === "2025-09-26" ? "今日" : ""}</span></div>{editingId === entry.id ? <input className="inline-edit" autoFocus defaultValue={entry.steps} onBlur={(event) => { const value = Number(event.target.value); if (value >= 0) setHistory((items: StepEntry[]) => items.map((item) => item.id === entry.id ? { ...item, steps: value } : item)); setEditingId(null) }} /> : <b>{entry.steps.toLocaleString()} 歩</b>}<div className="history-actions"><button aria-label="編集" onClick={() => setEditingId(entry.id)}><Pencil /></button><button aria-label="削除" onClick={() => window.confirm("この歩数記録を削除しますか？") && setHistory((items: StepEntry[]) => items.filter((item) => item.id !== entry.id))}><Trash2 /></button></div></div>)}</div></div> }
function ProfileContent({ name, setName, setView, setMode }: any) { return <div className="content inner-page"><button className="back-button" onClick={() => setView("home")}><ArrowLeft /> 戻る</button><p className="eyebrow">アカウント設定</p><h1 className="page-title">プロフィール編集</h1><div className="profile-avatar"><UserRound /></div><button className="avatar-change">アイコンを変更</button><label className="profile-label">名前<input value={name} maxLength={20} onChange={(event) => setName(event.target.value)} /></label><button className="primary full-button" onClick={() => setView("home")}>保存する</button><button className="logout" onClick={() => setMode("login")}><LogOut />ログアウト</button></div> }
