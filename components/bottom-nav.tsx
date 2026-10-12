'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Footprints, History, Sparkles, UserRound } from 'lucide-react'

const items = [
  { href: '/', label: 'ホーム', Icon: Footprints },
  { href: '/stamps', label: 'スタンプ', Icon: Sparkles },
  { href: '/steps', label: '歩数一覧', Icon: History },
  { href: '/profile', label: 'プロフィール', Icon: UserRound },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="nav" aria-label="メインナビゲーション">
      {items.map(({ href, label, Icon }) => (
        <Link
          className={`nav-item ${pathname === href ? 'active' : ''}`}
          href={href}
          key={href}
          aria-current={pathname === href ? 'page' : undefined}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  )
}
