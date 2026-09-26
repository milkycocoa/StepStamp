"use client"

import { useState } from "react"
import { Bell, Footprints, History, Lock, Pencil, Plus, Sparkles, UserRound } from "lucide-react"

const stamps = ["月", "火", "水", "木", "金", "土"]

export default function HomePage() {
  const [steps, setSteps] = useState(8432)
  const [input, setInput] = useState("")
  const [saved, setSaved] = useState(false)

  const saveSteps = () => {
    const value = Number(input.replace(/,/g, ""))
    if (Number.isFinite(value) && value >= 0) {
      setSteps(value)
      setInput("")
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    }
  }

  return (
    <main className="app-shell">
      <div className="phone">
        <header className="header">
          <div className="brand"><div className="logo"><Footprints size={21} strokeWidth={2.6} /></div><span className="brand-name">StepStamp</span></div>
          <button className="icon-btn" aria-label="通知"><Bell size={19} /></button>
        </header>
        <div className="content">
          <p className="greeting">おかえりなさい、EKさん</p>
          <h1 className="title">今日も一歩ずつ。</h1>
          <section className="hero" aria-labelledby="today-steps">
            <div className="hero-top">
              <div><p className="eyebrow" id="today-steps">本日の歩数</p><div className="step-count">{steps.toLocaleString()}<span>歩</span></div><p className="goal">目標 12,000歩まであと {Math.max(0, 12000 - steps).toLocaleString()}歩</p></div>
              <div className="ring" aria-label={`目標の${Math.min(100, Math.round(steps / 12000 * 100))}%`}><strong>{Math.min(100, Math.round(steps / 12000 * 100))}%</strong></div>
            </div>
            <div className="entry"><input className="step-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) saveSteps() }} placeholder="今日の歩数を入力" inputMode="numeric" aria-label="今日の歩数" /><button className="primary" onClick={saveSteps}>記録する</button></div>
            {saved && <p style={{ color: "#3eb58b", fontSize: 12, margin: "10px 0 0" }}>歩数を記録しました。スタンプを確認しましょう。</p>}
          </section>
          <div className="section-head"><h2>今週のスタンプラリー</h2><button className="link">すべて見る →</button></div>
          <div className="stamp-row">{stamps.map((day, index) => <div className={`stamp ${index < 4 ? "acquired" : ""}`} key={day}><div className="stamp-dot">{index < 4 ? <Sparkles size={14} /> : <Lock size={13} />}</div><span>{day}曜日</span></div>)}</div>
          <div className="info"><div className="info-mark">i</div><p>1,000歩達成するごとにスタンプを獲得できます。<br />あと <strong>{Math.max(0, 1000 - (steps % 1000)).toLocaleString()}歩</strong> で次のスタンプです。</p></div>
          <section className="features"><div className="section-head"><h2>StepStampでできること</h2></div><div className="feature-grid"><div className="feature"><Footprints className="feature-icon" size={18} /><h3>歩数を記録</h3><p>毎日の歩数をかんたん入力</p></div><div className="feature"><Sparkles className="feature-icon" size={18} /><h3>スタンプを集める</h3><p>達成感を楽しみながら継続</p></div><div className="feature"><Pencil className="feature-icon" size={18} /><h3>履歴を確認</h3><p>これまでの歩みを振り返る</p></div></div></section>
        </div>
        <nav className="nav" aria-label="メインナビゲーション"><button className="nav-item active"><Footprints size={18} />ホーム</button><button className="nav-item"><Sparkles size={18} />スタンプ</button><button className="nav-item"><History size={18} />歩数一覧</button><button className="nav-item"><UserRound size={18} />プロフィール</button></nav>
      </div>
    </main>
  )
}
