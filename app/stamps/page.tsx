'use client'

import { Lock, Sparkles, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const stampDays = ["月", "火", "水", "木", "金", "土", "日"]

function StampRow({ acquired, large = false }: { acquired: number; large?: boolean }) {
  return (
    <div className={`stamp-row ${large ? "stamp-grid" : ""}`}>
      {stampDays.map((day, index) => (
        <div className={`stamp ${index < acquired ? "acquired" : ""}`} key={day}>
          <div className="stamp-dot">{index < acquired ? <Sparkles /> : <Lock />}</div>
          <span>{day}曜日</span>
          {index < acquired && <small>達成</small>}
        </div>
      ))}
    </div>
  )
}

export default function StampPage() {
  const router = useRouter()

  // TODO: 実際はSupabaseから取得する
  const acquired = 4
  const progress = 60

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
              <span>達成率</span>
              <strong>{Math.round((acquired / 7) * 100)}%</strong>
            </div>
            <div className="mini-progress">
              <i style={{ width: `${(acquired / 7) * 100}%` }} />
            </div>
            <p>{acquired} / 7個のスタンプを獲得中</p>
          </div>
          <StampRow acquired={acquired} large />
          <div className="info">
            <div className="info-mark">i</div>
            <p>歩数を入力して、1,000歩ごとのスタンプを集めよう。</p>
          </div>
        </div>
      </div>
    </main>
  )
}
