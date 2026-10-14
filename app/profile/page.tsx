'use client'

import { ArrowLeft, ImagePlus, LogOut, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signOut } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/bottom-nav'

const MAX_NAME_LENGTH = 20
const ALLOWED_ICON_TYPES = ['image/jpeg', 'image/png'] as const

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
  const [isValidatingIcon, setIsValidatingIcon] = useState(false)
  const [selectedIconPreview, setSelectedIconPreview] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [iconError, setIconError] = useState('')
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
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      const user = session?.user
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

  const handleIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_ICON_TYPES.includes(file.type as (typeof ALLOWED_ICON_TYPES)[number])) {
      setSelectedIcon(null)
      setIconError('アイコンはJPEGまたはPNG形式の画像を選択してください。')
      return
    }

    setIconError('')
    setErrorMessage('')
    setSuccessMessage('')
    setIsValidatingIcon(true)

    try {
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
      const isJpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        .every((byte, index) => signature[index] === byte)

      if ((file.type === 'image/jpeg' && !isJpeg) || (file.type === 'image/png' && !isPng)) {
        setSelectedIcon(null)
        setIconError('選択したファイルの内容がJPEGまたはPNG形式ではありません。')
        return
      }

      setSelectedIcon(file)
      setRemoveIcon(false)
    } catch (error) {
      console.error('アイコン画像の検証に失敗しました', error)
      setSelectedIcon(null)
      setIconError('アイコン画像を確認できませんでした。別の画像を選択してください。')
    } finally {
      setIsValidatingIcon(false)
    }
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('名前を入力してください。')
      return
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setNameError(`名前は${MAX_NAME_LENGTH}文字以内で入力してください。`)
      return
    }

    setNameError('')
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      const user = session?.user
      if (!user) {
        router.replace('/signin')
        return
      }

      let nextIconUrl = removeIcon ? null : iconUrl || null
      if (selectedIcon) {
        setIsUploading(true)
        const extension = selectedIcon.type === 'image/jpeg' ? 'jpg' : 'png'
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
                disabled={isSubmitting || isValidatingIcon}
              >
                <ImagePlus size={15} /> {isValidatingIcon ? '画像を確認中…' : 'アイコンを変更'}
              </button>
              {iconError && <p className="error" role="alert">{iconError}</p>}
              {(iconUrl || selectedIcon) && !removeIcon && (
                <button
                  className="avatar-remove"
                  onClick={() => {
                    setSelectedIcon(null)
                    setRemoveIcon(true)
                    setIconError('')
                    setSuccessMessage('')
                  }}
                  disabled={isSubmitting || isValidatingIcon}
                >
                  <X size={14} /> アイコンを削除
                </button>
              )}

              <input
                type="file"
                accept={ALLOWED_ICON_TYPES.join(',')}
                ref={fileInputRef}
                className="visually-hidden"
                onChange={handleIconChange}
              />

              <label className="profile-label">名前
                <input
                  value={name}
                  aria-describedby="profile-name-hint"
                  className={nameError ? 'input-error' : ''}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError('')
                    setSuccessMessage('')
                  }}
                  disabled={isSubmitting}
                />
              </label>

              <p className="profile-hint" id="profile-name-hint">20文字以内</p>
              {nameError && <p className="error" role="alert">{nameError}</p>}
              {selectedIcon && <p className="profile-hint">選択したアイコンは保存時に反映されます。</p>}
              {removeIcon && <p className="profile-hint">アイコンは保存時に削除されます。</p>}
              {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
              {successMessage && <p className="success-message" role="status">{successMessage}</p>}

              <button
                className="primary full-button"
                onClick={() => void handleSave()}
                disabled={isSubmitting || isValidatingIcon}
              >
                {isValidatingIcon ? '画像を確認中…' : isUploading ? 'アイコンをアップロード中…' : isSubmitting ? '保存中…' : '保存する'}
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
