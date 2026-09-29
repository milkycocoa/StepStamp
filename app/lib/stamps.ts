import { supabase } from './supabase'

// スタンプ取得（Read）
export async function getStamps(userId: string) {
  const { data, error } = await supabase
    .from('stamps')
    .select('*')
    .eq('user_id', userId)
    .order('acquired_at', { ascending: false }) // 新しい順に取得
  return { data, error }
}
