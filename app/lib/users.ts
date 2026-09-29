import { supabase } from './supabase'

// プロフィール取得（Read）
export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// プロフィール更新（Update）
export async function updateUser(userId: string, name: string, iconUrl: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ name, icon_url: iconUrl })
    .eq('id', userId)
  return { data, error }
}
