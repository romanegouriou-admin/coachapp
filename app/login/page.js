'use client'
import { useState } from 'react'
import { supabase } from '../supabase.js'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    setError('')
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', email)
      .eq('mot_de_passe', password)
      .single()

    if (error || !data) {
      setError('Email ou mot de passe incorrect')
      return
    }

    if (data.role === 'joueur') {
      const { data: joueur } = await supabase
        .from('joueuses')
        .select('id')
        .eq('utilisateur_id', data.id)
        .single()
      if (joueur) data.joueur_id = joueur.id
    }

    localStorage.setItem('user', JSON.stringify(data))

    if (data.role === 'coach' || data.role === 'pp' || data.role === 'pm') {
      router.push('/admin')
    } else {
      router.push('/basket')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, border: '1px solid #e5e7eb', width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>CoachApp</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Connecte-toi pour accéder à ton espace</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ton@email.com"
            style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontFamily: 'sans-serif', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontFamily: 'sans-serif', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</p>}

        <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#111', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Se connecter
        </button>
      </div>
    </div>
  )
}