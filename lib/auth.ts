import { supabase } from './supabase'

// サインアップ
export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password })
  return error
}

// サインイン
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error
}

// サインアウト
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return error
}
