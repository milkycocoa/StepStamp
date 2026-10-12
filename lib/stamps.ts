import { supabase } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export const STEPS_PER_STAMP = 1000
export const DAILY_STEP_GOAL = 10000
export const MAX_DAILY_STAMPS = 10

// スタンプ取得（Read）
export async function getStamps(
  userId: string,
  startAt?: string,
  endAt?: string,
  client: SupabaseClient = supabase,
  stampType = 'daily',
) {
  let query = client
    .from('stamps')
    .select('*')
    .eq('user_id', userId)
    .eq('stamp_type', stampType)
    .order('acquired_at', { ascending: false })

  if (startAt) query = query.gte('acquired_at', startAt)
  if (endAt) query = query.lt('acquired_at', endAt)

  const { data, error } = await query
  return { data, error }
}

export async function syncStampsForDate(
  userId: string,
  date: string,
  stepCount: number,
  client: SupabaseClient,
) {
  const [year, month, day] = date.split('-').map(Number)
  const dayStart = new Date(year, month - 1, day)
  const dayEnd = new Date(year, month - 1, day + 1)
  const desiredCount = Math.min(
    MAX_DAILY_STAMPS,
    Math.floor(stepCount / STEPS_PER_STAMP),
  )
  const { data: existingStamps, error: readError } = await client
    .from('stamps')
    .select('id, acquired_at')
    .eq('user_id', userId)
    .eq('stamp_type', 'daily')
    .gte('acquired_at', dayStart.toISOString())
    .lt('acquired_at', dayEnd.toISOString())
    .order('acquired_at', { ascending: true })

  if (readError) return { error: readError }

  const existingCount = existingStamps?.length ?? 0
  if (existingCount < desiredCount) {
    const acquiredAt = new Date(year, month - 1, day, 12)
    const newStamps = Array.from(
      { length: desiredCount - existingCount },
      (_, index) => ({
        user_id: userId,
        stamp_type: 'daily',
        acquired_at: new Date(acquiredAt.getTime() + (existingCount + index) * 1000).toISOString(),
      }),
    )
    const { error } = await client.from('stamps').insert(newStamps)
    return { error }
  }

  if (existingCount > desiredCount) {
    const stampsToRemove = existingStamps!.slice(desiredCount)
    for (const stamp of stampsToRemove) {
      const { error } = await client
        .from('stamps')
        .delete()
        .eq('id', stamp.id)
        .eq('user_id', userId)

      if (error) return { error }
    }
  }

  return { error: null }
}
