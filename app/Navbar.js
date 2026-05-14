'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const links = [
    { href: '/basket', label: 'Basketball' },
    { href: '/entrainement', label: 'Entraînement Individuel' },
    { href: '/prepa', label: 'Préparation Physique' },
    { href: '/mental', label: 'Préparation Mentale' },
    { href: '/communication', label: 'Communication' },
  ]
  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      height: '56px'
    }}>
      <span style={{ fontWeight: '700', color: '#111', fontSize: '16px' }}>CoachApp</span>
      {links.map(({ href, label }) => (
        <Link key={href} href={href} style={{
          color: pathname === href ? '#111' : '#6b7280',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: pathname === href ? '700' : '400',
          borderBottom: pathname === href ? '2px solid #111' : '2px solid transparent',
          paddingBottom: '4px'
        }}>{label}</Link>
      ))}
    </nav>
  )
}