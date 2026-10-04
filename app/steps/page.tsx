'use client'

import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type StepEntry = { id: number; date: string; steps: number }

const initialHistory: StepEntry[] = [
  { id: 1, date: "2025-09-22", steps: 10234 },
  { id: 2, date: "2025-09-21", steps: 8432 },
  { id: 3, date: "2025-09-20", steps: 9120 },
  { id: 4, date: "2025-09-19", steps: 5600 },
]

export default function StepsPage() {
  const router = useRouter()
  const [history, setHistory] = useState(initialHistory)
  const [editingId, setEditingId] = useState<number | null>(null)
  const total = history.reduce((sum, entry) => sum + entry.steps, 0)

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
        <div className="history-list">
          {history.map((entry) => (
          <div className="history-card" key={entry.id}>
            <div>
              <strong>{new Date(entry.date).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}</strong>
              <span>{entry.date === "2025-09-26" ? "今日" : ""}</span>
            </div>
            {editingId === entry.id ? (
              <input
                className="inline-edit"
                autoFocus
                defaultValue={entry.steps}
                onBlur={(e) => {
                  const value = Number(e.target.value)
                  if (value >= 0) setHistory((items) => items.map((item) => item.id === entry.id ? { ...item, steps: value } : item))
                  setEditingId(null)
                }}
              />
              ) : (
                <b>{entry.steps.toLocaleString()} 歩</b>
              )}
              <div className="history-actions">
                <button aria-label="編集" onClick={() => setEditingId(entry.id)}><Pencil /></button>
                <button aria-label="削除" onClick={() => window.confirm("この歩数記録を削除しますか？") && setHistory((items) => items.filter((item) => item.id !== entry.id))}><Trash2 /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
  )
}
