'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUser } from './auth.js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const u = getUser()
    setUser(u)
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isAdmin = user?.role === 'coach' || user?.role === 'pp' || user?.role === 'pm'

  const links = [
    { href: '/basket', label: 'Basketball' },
    { href: '/entrainement', label: 'Entraînement Individuel' },
    { href: '/prepa', label: 'Préparation Physique' },
    { href: '/mental', label: 'Préparation Mentale' },
    { href: '/communication', label: 'Communication' },
  ]

  const linkStyle = (href) => ({
    color: pathname === href ? '#111' : '#6b7280',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: pathname === href ? '700' : '400',
    borderBottom: pathname === href ? '2px solid #111' : '2px solid transparent',
    paddingBottom: '4px',
    whiteSpace: 'nowrap'
  })

  if (pathname === '/login') return null

  return (
    <>
      {/* DESKTOP */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href={isAdmin ? '/admin' : '/basket'} style={{ fontWeight: '700', color: '#111', fontSize: '16px', textDecoration: 'none' }}>
            CoachApp
          </Link>
          {/* Liens desktop — cachés sur mobile */}
          <div className="desktop-links" style={{ display: 'flex', gap: '20px' }}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} style={linkStyle(href)}>{label}</Link>
            ))}
            {isAdmin && <Link href="/admin" style={linkStyle('/admin')}>Admin</Link>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 12, color: '#6b7280', display: 'none' }} className="user-info">
              {user.prenom} · {user.role}
            </span>
          )}
          {user && (
            <button onClick={handleLogout} style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>
              Déconnexion
            </button>
          )}
          {/* Burger menu mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="burger"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#111', padding: 4 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
          background: 'white', zIndex: 99, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 8,
          borderTop: '1px solid #e5e7eb', overflowY: 'auto'
        }}>
          {user && (
            <div style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user.prenom} {user.nom}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{user.role}</p>
            </div>
          )}
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              padding: '14px 16px', borderRadius: 10,
              background: pathname === href ? '#f3f4f6' : 'transparent',
              color: pathname === href ? '#111' : '#6b7280',
              textDecoration: 'none', fontSize: 15, fontWeight: pathname === href ? 700 : 400,
              border: '1px solid transparent',
              borderColor: pathname === href ? '#e5e7eb' : 'transparent'
            }}>{label}</Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} style={{
              padding: '14px 16px', borderRadius: 10,
              background: pathname === '/admin' ? '#f3f4f6' : '#fafafa',
              color: '#111', textDecoration: 'none', fontSize: 15, fontWeight: 600,
              border: '1px solid #e5e7eb'
            }}>Admin</Link>
          )}
          <button onClick={() => { handleLogout(); setMenuOpen(false) }} style={{
            marginTop: 'auto', padding: '14px', background: '#f3f4f6', color: '#6b7280',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            Déconnexion
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .burger { display: block !important; }
          .user-info { display: none !important; }
        }
        @media (min-width: 769px) {
          .user-info { display: block !important; }
        }
      `}</style>
    </>
  )
}