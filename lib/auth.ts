import { supabase } from './supabase'

// サインアップ
export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password })
  return error
}

// サインイン後に公開ユーザーレコードを作成・同期
export async function signIn(email: string, password: string) {
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) return signInError
  if (!data.user) return new Error('ログイン情報を確認してください')

  const { error: userError } = await supabase
    .from('users')
    .upsert({ id: data.user.id }, { onConflict: 'id' })

  return userError
}

// サインアウト
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return error
}
