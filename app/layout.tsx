import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "StepStamp | 歩いて、集めて、続けよう",
  description: "毎日の歩数をスタンプに変えるヘルスケアアプリ",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>
}
