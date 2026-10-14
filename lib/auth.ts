import { createClient } from './supabase/client'

function toJapaneseAuthError(error: { message: string }, action: 'signIn' | 'signUp') {
  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return new Error('メールアドレスまたはパスワードが正しくありません')
  }
  if (message.includes('email not confirmed')) {
    return new Error('メールアドレスの確認が完了していません。受信メールをご確認ください')
  }
  if (message.includes('already registered') || message.includes('user already exists')) {
    return new Error('このメールアドレスはすでに登録されています')
  }
  if (message.includes('password') && (message.includes('least') || message.includes('weak'))) {
    return new Error('パスワードの条件を満たしていません。6文字以上で入力してください')
  }
  if (message.includes('invalid email') || message.includes('validate email')) {
    return new Error('メールアドレスの形式が正しくありません')
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return new Error('試行回数が上限に達しました。しばらくしてから再度お試しください')
  }
  if (message.includes('network') || message.includes('fetch')) {
    return new Error('通信に失敗しました。ネットワークを確認して再度お試しください')
  }

  return new Error(
    action === 'signIn'
      ? 'ログインに失敗しました。入力内容をご確認のうえ、再度お試しください'
      : 'アカウントを作成できませんでした。入力内容をご確認のうえ、再度お試しください',
  )
}

// サインアップ
export async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  return error ? toJapaneseAuthError(error, 'signUp') : null
}

// サインイン後に公開ユーザーレコードを作成・同期
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) return toJapaneseAuthError(signInError, 'signIn')
  if (!data.user) return new Error('ログイン情報を確認してください')

  const { error: userError } = await supabase
    .from('users')
    .upsert({ id: data.user.id }, { onConflict: 'id' })

  return userError ? toJapaneseAuthError(userError, 'signIn') : null
}

// サインアウト
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return error
}
