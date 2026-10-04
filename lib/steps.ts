import { supabase } from './supabase'

// 歩数登録（Create）
export async function addStep(userId: string, date: string, stepCount: number) {
  const { data, error } = await supabase
    .from('steps')
    .insert({ user_id: userId, date, step_count: stepCount })
  return { data, error }
}

// 歩数一覧取得（Read）
export async function getSteps(userId: string) {
  const { data, error } = await supabase
    .from('steps')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false }) // 新しい順
  return { data, error }
}

// 歩数編集（Update）
export async function updateStep(userId: string, date: string, stepCount: number) {
  const { data, error } = await supabase
    .from('steps')
    .update({ step_count: stepCount })
    .eq('user_id', userId)
    .eq('date', date)
  return { data, error }
}

// 歩数削除（Delete）
export async function deleteStep(userId: string, date: string) {
  const { data, error } = await supabase
    .from('steps')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)
  return { data, error }
}
