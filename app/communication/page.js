'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'
import { getJoueurId } from '../auth.js'
import ProtectedPage from '../ProtectedPage.js'

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: subtitle ? 4 : 20 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{subtitle}</p>}
      {children}
    </div>
  )
}

const typeIcon = { questionnaire: '📋', video: '▶', document: '📄', photo: '🖼️' }
const typeLabel = { questionnaire: 'Questionnaire', video: 'Vidéo', document: 'Document', photo: 'Photo' }
const typeColor = { questionnaire: '#dbeafe', video: '#fef9c3', document: '#f0fdf4', photo: '#fdf4ff' }
const typeText = { questionnaire: '#2563eb', video: '#ca8a04', document: '#16a34a', photo: '#7c3aed' }

export default function Communication() {
  const [messages, setMessages] = useState([])
  const [docs, setDocs] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const joueurId = getJoueurId() || 1
    fetchData(joueurId)
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.joueur_id === joueurId) {
          setMessages(prev => [...prev, payload.new])
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchData(joueurId) {
    const { data: m } = await supabase.from('messages').select('*').eq('joueur_id', joueurId).order('created_at')
    const { data: d } = await supabase.from('documents').select('*').eq('joueur_id', joueurId).order('created_at', { ascending: false })
    setMessages(m || [])
    setDocs(d || [])
  }

  async function envoyerMessage() {
    const joueurId = getJoueurId() || 1
    const val = input.trim()
    if (!val) return
    setInput('')
    await supabase.from('messages').insert([{ joueur_id: joueurId, expediteur: 'joueur', contenu: val }])
  }

  async function marquerLu(id) {
    await supabase.from('documents').update({ lu: true }).eq('id', id)
    setDocs(docs.map(d => d.id === id ? { ...d, lu: true } : d))
  }

  const nonLus = docs.filter(d => !d.lu)
  const lus = docs.filter(d => d.lu)

  return (
    <ProtectedPage>
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' }}>

      <Section title="Messagerie" subtitle="Échange direct avec le coach">
        <div style={{ height: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 4px 12px', marginBottom: 16 }}>
          {messages.map((m, i) => {
            const estJoueur = m.expediteur === 'joueur'
            const date = new Date(m.created_at)
            const heure = `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: estJoueur ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                  borderBottomRightRadius: estJoueur ? 4 : 12,
                  borderBottomLeftRadius: estJoueur ? 12 : 4,
                  background: estJoueur ? '#111' : '#f3f4f6',
                  color: estJoueur ? 'white' : '#111',
                  fontSize: 14, lineHeight: 1.5
                }}>
                  {m.contenu}
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {estJoueur ? 'Toi' : 'Coach'} · {heure}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && envoyerMessage()}
            placeholder="Écris un message..."
            style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontFamily: 'sans-serif', fontSize: 14, color: '#111', outline: 'none' }}
          />
          <button onClick={envoyerMessage} style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Envoyer
          </button>
        </div>
      </Section>

      <Section title="Prendre rendez-vous" subtitle="Réserve un créneau avec le coach">
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <iframe src="https://calendly.com" width="100%" height="500" frameBorder="0" style={{ display: 'block' }}/>
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
          Tu peux aussi accéder directement à <a href="https://calendly.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>calendly.com</a>
        </p>
      </Section>

      <Section title="À consulter" subtitle="Documents, questionnaires et vidéos envoyés par le coach">
        {nonLus.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1 }}>Non lus</span>
              <span style={{ background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{nonLus.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {nonLus.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#fafafa', border: '2px solid #e5e7eb', borderRadius: 10 }}>
                  <div style={{ width: 42, height: 42, background: typeColor[d.type] || '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {typeIcon[d.type] || '📎'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{d.titre}</span>
                      <span style={{ background: typeColor[d.type] || '#f3f4f6', color: typeText[d.type] || '#6b7280', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{typeLabel[d.type] || d.type}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>{d.description}</p>
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" onClick={() => marquerLu(d.id)} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '8px 16px', background: '#111', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Ouvrir
                    </button>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
        {lus.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Déjà consultés</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lus.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, opacity: 0.7 }}>
                  <div style={{ width: 38, height: 38, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {typeIcon[d.type] || '📎'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{d.titre}</span>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{d.description}</p>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>✓ Consulté</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

    </div>
    </ProtectedPage>
  )
}