'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { getJoueurId } from '../auth.js'
import ProtectedPage from '../ProtectedPage.js'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function Section({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 20 }}>{title}</h2>
      {children}
    </div>
  )
}

function StatCard({ label, val, unit, color }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
      <p style={{ fontSize: 26, fontWeight: 700, color: color || '#111' }}>{val}<span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>{unit}</span></p>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
    </div>
  )
}

function VideoBtn({ url }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dbeafe', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>▶ Vidéo</span>
    </a>
  )
}

function ExoCell({ nom, image_url, video_url }) {
  return (
    <td style={{ padding: '12px', fontWeight: 600, color: '#111' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{nom}</div>
      {image_url && <img src={image_url} alt={nom} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 6 }}/>}
      <VideoBtn url={video_url}/>
    </td>
  )
}

export default function Prepa() {
  const [routine, setRoutine] = useState([])
  const [pathologies, setPathologies] = useState([])
  const [testing, setTesting] = useState([])
  const [seances, setSeances] = useState([])
  const [activeSeance, setActiveSeance] = useState('renfo')

  useEffect(() => {
    async function fetchData() {
      const joueurId = getJoueurId() || 1
      const { data: r } = await supabase.from('routine_avant_match').select('*').eq('joueur_id', joueurId).order('ordre')
      const { data: p } = await supabase.from('pathologies').select('*').eq('joueur_id', joueurId)
      const { data: t } = await supabase.from('testing').select('*').eq('joueur_id', joueurId).order('date')
      const { data: s } = await supabase.from('seances').select('*').eq('joueur_id', joueurId).order('ordre')
      setRoutine(r || [])
      setPathologies(p || [])
      setTesting(t || [])
      setSeances(s || [])
    }
    fetchData()
  }, [])

  const dernier = testing[testing.length - 1] || {}
  const seancesFiltrees = seances.filter(s => s.type === activeSeance)

  const tabStyle = (type) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: activeSeance === type ? '#111' : '#f3f4f6',
    color: activeSeance === type ? 'white' : '#6b7280',
    transition: 'all 0.15s'
  })

  return (
    <ProtectedPage>
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' }}>

      <Section title="Routine avant-match">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {['#', 'Exercice', 'Séries', 'Rép. / Durée', 'Matériel', 'Note'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routine.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                <td style={{ padding: '12px', color: '#6b7280', fontWeight: 700 }}>{r.ordre}</td>
                <ExoCell nom={r.exercice} image_url={r.image_url} video_url={r.video_url}/>
                <td style={{ padding: '12px', textAlign: 'center' }}>{r.series}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{r.repetitions !== '—' ? r.repetitions : r.duree}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{r.materiel}</td>
                <td style={{ padding: '12px', color: '#6b7280', fontSize: 12 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Protocoles selon pathologies">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pathologies.map((p, i) => (
            <div key={i} style={{ padding: 16, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {p.image_url && <img src={p.image_url} alt={p.nom} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}/>}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 0.8 }}>⚠ {p.nom}</span>
                    <VideoBtn url={p.video_url}/>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>{p.protocole}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{p.exercices}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Testing physique">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Derniers résultats — {dernier.date}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatCard label="Saut 2 jambes" val={dernier.saut_deux_jambes} unit="cm" color="#2563eb"/>
          <StatCard label="Saut 1 jambe G" val={dernier.saut_une_jambe_gauche} unit="cm"/>
          <StatCard label="Saut 1 jambe D" val={dernier.saut_une_jambe_droite} unit="cm"/>
          <StatCard label="Squat 1RM" val={dernier.squat_1rm} unit="kg" color="#16a34a"/>
          <StatCard label="Dév. couché 1RM" val={dernier.developpe_couche_1rm} unit="kg" color="#16a34a"/>
          <StatCard label="Illinois" val={dernier.illinois_sec} unit="s" color="#dc2626"/>
          <StatCard label="VMA" val={dernier.vma} unit="km/h" color="#7c3aed"/>
        </div>
        {testing.length > 1 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Évolution</p>
            <Line data={{
              labels: testing.map(t => t.date),
              datasets: [
                { label: 'Saut 2J (cm)', data: testing.map(t => t.saut_deux_jambes), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.4, pointBackgroundColor: '#2563eb' },
                { label: 'Squat 1RM (kg)', data: testing.map(t => t.squat_1rm), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.08)', tension: 0.4, pointBackgroundColor: '#16a34a' },
                { label: 'VMA (km/h)', data: testing.map(t => t.vma), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', tension: 0.4, pointBackgroundColor: '#7c3aed' },
              ]
            }} options={{
              responsive: true,
              plugins: { legend: { labels: { font: { size: 12 } } } },
              scales: { y: { beginAtZero: false } }
            }}/>
          </>
        )}
      </Section>

      <Section title="Séances">
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button style={tabStyle('renfo')} onClick={() => setActiveSeance('renfo')}>Renforcement Full Body</button>
          <button style={tabStyle('endurance')} onClick={() => setActiveSeance('endurance')}>Endurance</button>
          <button style={tabStyle('fractionne')} onClick={() => setActiveSeance('fractionne')}>Fractionné</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {['#', 'Exercice', 'Séries', 'Rép. / Durée', 'Intensité', 'Matériel', 'Note'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seancesFiltrees.map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                <td style={{ padding: '12px', color: '#6b7280', fontWeight: 700 }}>{s.ordre}</td>
                <ExoCell nom={s.exercice} image_url={s.image_url} video_url={s.video_url}/>
                <td style={{ padding: '12px', textAlign: 'center' }}>{s.series}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{s.repetitions !== '—' && s.repetitions ? s.repetitions : s.duree}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{s.intensite}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{s.materiel}</td>
                <td style={{ padding: '12px', color: '#6b7280', fontSize: 12 }}>{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

    </div>
    </ProtectedPage>
  )
}