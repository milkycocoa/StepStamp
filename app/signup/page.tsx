'use client'

import { useState } from 'react'
import { Footprints } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    const error = await signUp(email, password)
    if (error) {
      setErrorMsg(error.message)
    } else {
      router.push('/') // サインアップ成功後トップへ
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>パスワード
              <input
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
            <button className="primary auth-submit" onClick={handleSubmit}>
              アカウントを作成
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
