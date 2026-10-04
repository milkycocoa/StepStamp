'use client'

import { ArrowLeft, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('EK')

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
            <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="primary full-button" onClick={() => router.push('/')}>
            保存する
          </button>
          <button className="logout" onClick={async () => {
            await signOut()
            router.push('/signin')
          }}>
            <LogOut />ログアウト
          </button>
        </div>
      </div>
    </main>
  )
}
