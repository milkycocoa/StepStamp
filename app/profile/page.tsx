'use client'

import { ArrowLeft, LogOut, UserRound } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconUrl, setIconUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('name, icon_url')
        .eq('id', user.id)
        .single()
      if (data) {
        setName(data.name ?? "")
        setIconUrl(data.icon_url ?? "")
      }
    }
    fetchProfile()
  }, [])

  // アイコン変更ボタン
  const handleIconClick = () => {
    fileInputRef.current?.click()
  }

  // ファイル選択時
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const filePath = `icons/${user.id}.png`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error(error)
      return
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    setIconUrl(data.publicUrl)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("名前を入力してください")
      return
    }

    setNameError("")
    setIsSubmitting(true)

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    // プロフィール保存
    await supabase
      .from('users')
      .update({
        name,
        icon_url: iconUrl,
      })
      .eq('id', user.id)

    setTimeout(() => {
      setIsSubmitting(false)
      router.push('/')
    }, 1000)
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

          <div className="profile-avatar">
            {iconUrl ? (
              <img src={iconUrl} alt="icon" className="avatar-img" />
            ) : (
              <UserRound />
            )}
          </div>

          <button className="avatar-change" onClick={handleIconClick}>
            アイコンを変更
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleIconUpload}
          />

          <label className="profile-label">名前
            <input
              value={name}
              maxLength={20}
              className={nameError ? "input-error" : ""}
              onChange={(e) => {
                setName(e.target.value)
                setNameError("")
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
