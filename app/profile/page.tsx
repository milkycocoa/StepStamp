'use client'

import { ArrowLeft, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = () => {
    // 空欄禁止
    if (!name.trim()) {
      setNameError("名前を入力してください")
      return
    }

    // エラーなし
    setNameError("")
    setIsSubmitting(true)

    // ★ 本来はここで Supabase に保存する処理を書く
    // await updateProfile({ name })

    setTimeout(() => {
      setIsSubmitting(false)
      router.push('/')   // 保存後に戻る
    }, 1500)
  }

  return (
    <main className="app-shell">
      <div className="phone">
        <div className="content inner-page">
          <button className="back-button" onClick={() => router.push('/')}>
            <ArrowLeft /> 戻る
          </button>

          <p className="eyebrow">アカウント設定</p>
          <h1 className="page-title">プロフィール編集</h1>

          <div className="profile-avatar"><UserRound /></div>
          <button className="avatar-change">アイコンを変更</button>

          <label className="profile-label">名前
            <input
              value={name}
              maxLength={20}
              className={nameError ? "input-error" : ""}
              onChange={(e) => {
                setName(e.target.value)
                setNameError("")   // 入力したらエラーを消す
              }}
            />
          </label>

          {nameError && <p className="error">{nameError}</p>}

          <button
            className="primary full-button"
            onClick={handleSave}
            disabled={isSubmitting || !!nameError}
          >
            {isSubmitting ? "保存中…" : "保存する"}
          </button>

          <button
            className="logout"
            onClick={async () => {
              await signOut()
              router.push('/signin')
            }}
          >
            <LogOut />ログアウト
          </button>
        </div>
      </div>
    </main>
  )
}
