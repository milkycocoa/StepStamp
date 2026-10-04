import type { Metadata } from "next"
import "./globals.css"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "StepStamp | 歩いて、集めて、続けよう",
  description: "毎日の歩数をスタンプに変えるヘルスケアアプリ",
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
  await supabase.auth.getSession()

  return <html lang="ja"><body>{children}</body></html>
}

