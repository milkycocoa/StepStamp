'use client'

import { useState } from 'react'
import { Footprints } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const validate = () => {
    let ok = true

    if (!email) {
      setEmailError('メールアドレスを入力してください')
      ok = false
    } else if (!email.includes('@')) {
      setEmailError('メールアドレスの形式が正しくありません')
      ok = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('パスワードを入力してください')
      ok = false
    } else if (password.length < 6) {
      setPasswordError('パスワードは6文字以上で入力してください')
      ok = false
    } else {
      setPasswordError('')
    }

    return ok
  }

  const handleSubmit = async () => {
    setSubmitError('')
    if (!validate()) return

    setIsSubmitting(true)

    const error = await signUp(email, password)
    if (error) {
      // ★ Supabase のエラーも赤枠に反映する
      setSubmitError(error.message)
      setEmailError(error.message)   // ← これが赤枠の鍵
      setIsSubmitting(false)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="app-shell auth-shell">
      <div className="phone auth-phone">
        <div className="auth-content">
          <div className="auth-logo"><Footprints size={27} /></div>

          <p className="auth-kicker">歩いて、集めて、続けよう。</p>
          <h1>StepStamp</h1>
          <p className="auth-copy">毎日の歩数を、達成感に変える<br />スタンプラリーアプリ</p>

          <div className="auth-form">

            <label>メールアドレス
              <input
                type="email"
                className={emailError ? 'input-error' : ''}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {emailError && <p className="error">{emailError}</p>}

            <label>パスワード
              <input
                type="password"
                className={passwordError ? 'input-error' : ''}
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {passwordError && <p className="error">{passwordError}</p>}

            {submitError && <p className="error">{submitError}</p>}

            <button
              className="primary auth-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中…' : 'アカウントを作成'}
            </button>
          </div>

          <p className="auth-switch">
            すでにアカウントをお持ちですか？{' '}
            <button onClick={() => router.push('/signin')}>ログイン</button>
          </p>
        </div>
      </div>
    </main>
  )
}
