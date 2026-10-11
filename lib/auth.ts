import { supabase } from './supabase'

// サインアップ
export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password })
  return error
}

// サインイン
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return error

  const user = data.user

  // ユーザーが存在しない場合は新規作成
  await supabase
    .from('users')
    .upsert({
      id: user.id,
      name: "",
      icon_url: ""
    })
  return null
}

// サインアウト
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return error
}
