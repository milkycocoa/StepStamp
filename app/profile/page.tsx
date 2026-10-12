'use client'

import { ArrowLeft, ImagePlus, LogOut, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signOut } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/bottom-nav'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [name, setName] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<File | null>(null)
  const [removeIcon, setRemoveIcon] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedIconPreview, setSelectedIconPreview] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [nameError, setNameError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedIcon) {
      setSelectedIconPreview('')
      return
    }

    const previewUrl = URL.createObjectURL(selectedIcon)
    setSelectedIconPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [selectedIcon])

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        router.replace('/signin')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('name, icon_url')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      setName(data?.name ?? '')
      setIconUrl(data?.icon_url ?? '')
    } catch (error) {
      console.error('プロフィールの取得に失敗しました', error)
      setErrorMessage('プロフィールを読み込めませんでした。時間をおいて再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください。')
      return
    }

    setSelectedIcon(file)
    setRemoveIcon(false)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('名前を入力してください。')
      return
    }

    setNameError('')
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        router.replace('/signin')
        return
      }

      let nextIconUrl = removeIcon ? null : iconUrl || null
      if (selectedIcon) {
        setIsUploading(true)
        const extension = selectedIcon.name.split('.').pop()?.toLowerCase() || 'image'
        const filePath = `icons/${user.id}/${Date.now()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedIcon, {
            contentType: selectedIcon.type,
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        nextIconUrl = data.publicUrl
      }

      const { error: saveError } = await supabase
        .from('users')
        .upsert(
          { id: user.id, name: trimmedName, icon_url: nextIconUrl },
          { onConflict: 'id' },
        )

      if (saveError) throw saveError

      setName(trimmedName)
      setIconUrl(nextIconUrl ?? '')
      setSelectedIcon(null)
      setRemoveIcon(false)
      setSuccessMessage('プロフィールを保存しました。')
    } catch (error) {
      console.error('プロフィールの保存に失敗しました', error)
      setErrorMessage('プロフィールを保存できませんでした。内容を確認して再度お試しください。')
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    const error = await signOut()
    if (error) {
      console.error('ログアウトに失敗しました', error)
      setErrorMessage('ログアウトできませんでした。時間をおいて再度お試しください。')
      return
    }
    router.push('/signin')
  }

  const previewUrl = removeIcon ? '' : selectedIconPreview || iconUrl

  return (
    <main className="app-shell">
      <div className="phone">
        <div className="content inner-page">
          <button className="back-button" onClick={() => router.push('/')}>
            <ArrowLeft /> 戻る
          </button>

          <p className="eyebrow">アカウント設定</p>
          <h1 className="page-title">プロフィール編集</h1>

          {isLoading ? (
            <p className="history-empty">プロフィールを読み込み中です…</p>
          ) : (
            <>
              <div className="profile-avatar">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="プロフィールアイコン"
                    className="avatar-img"
                    width={94}
                    height={94}
                    unoptimized
                  />
                ) : (
                  <UserRound />
                )}
              </div>

              <button
                className="avatar-change"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <ImagePlus size={15} /> アイコンを変更
              </button>
              {(iconUrl || selectedIcon) && !removeIcon && (
                <button
                  className="avatar-remove"
                  onClick={() => {
                    setSelectedIcon(null)
                    setRemoveIcon(true)
                    setSuccessMessage('')
                  }}
                  disabled={isSubmitting}
                >
                  <X size={14} /> アイコンを削除
                </button>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="visually-hidden"
                onChange={handleIconChange}
              />

              <label className="profile-label">名前
                <input
                  value={name}
                  maxLength={20}
                  className={nameError ? 'input-error' : ''}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError('')
                    setSuccessMessage('')
                  }}
                  disabled={isSubmitting}
                />
              </label>

              {nameError && <p className="error" role="alert">{nameError}</p>}
              {selectedIcon && <p className="profile-hint">選択したアイコンは保存時に反映されます。</p>}
              {removeIcon && <p className="profile-hint">アイコンは保存時に削除されます。</p>}
              {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
              {successMessage && <p className="success-message" role="status">{successMessage}</p>}

              <button
                className="primary full-button"
                onClick={() => void handleSave()}
                disabled={isSubmitting || !name.trim()}
              >
                {isUploading ? 'アイコンをアップロード中…' : isSubmitting ? '保存中…' : '保存する'}
              </button>

              <button className="logout" onClick={() => void handleSignOut()} disabled={isSubmitting}>
                <LogOut />ログアウト
              </button>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    </main>
  )
}
