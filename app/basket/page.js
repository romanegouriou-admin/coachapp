'use client'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const moy = (matchs, key) => matchs.length === 0 ? 0 : (matchs.reduce((a, m) => a + m[key], 0) / matchs.length).toFixed(1)

export default function Basket() {
  const [showMatchs, setShowMatchs] = useState(false)
  const [joueur, setJoueur] = useState(null)
  const [matchs, setMatchs] = useState([])

  useEffect(() => {
    async function fetchData() {
      const { data: joueurs } = await supabase.from('joueuses').select('*').eq('id', 1).single()
      const { data: matchsData } = await supabase.from('matchs').select('*').eq('joueur_id', 1).order('date', { ascending: false })
      setJoueur(joueurs)
      setMatchs(matchsData || [])
    }
    fetchData()
  }, [])

  if (!joueur) return <div style={{ padding: 32, color: '#6b7280' }}>Chargement...</div>

  const dernier = matchs[0] || {}

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* ROLE */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', marginBottom: 24, border: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Ton rôle dans l'équipe</span>
        <p style={{ fontSize: 16, color: '#111', marginTop: 8, fontWeight: 500 }}>{joueur.role} — Tu es le chef d'orchestre de l'équipe.</p>
      </div>

      {/* CAMEMBERTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Victoires / Défaites</p>
          <div style={{ width: 160, margin: '0 auto' }}>
            <Doughnut data={{
              labels: ['Victoires', 'Défaites'],
              datasets: [{ data: [8, 4], backgroundColor: ['#16a34a', '#ef4444'], borderWidth: 0 }]
            }} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }, cutout: '70%' }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>8 <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 400 }}>victoires sur 12</span></p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Matchs joués</p>
          <div style={{ width: 160, margin: '0 auto' }}>
            <Doughnut data={{
              labels: ['Joués', 'Restants'],
              datasets: [{ data: [matchs.length, 20 - matchs.length], backgroundColor: ['#2563eb', '#bfdbfe'], borderWidth: 0 }]
            }} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }, cutout: '70%' }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>{matchs.length} <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 400 }}>matchs sur 20</span></p>
        </div>
      </div>

      {/* STATS INDIVIDUELLES */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Statistiques individuelles</h2>
          <button onClick={() => setShowMatchs(!showMatchs)} style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}>
            {showMatchs ? 'Masquer les matchs ▲' : 'Voir tous les matchs ▼'}
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Moyennes sur la saison</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Points', val: moy(matchs, 'points') },
            { label: 'Passes déc.', val: moy(matchs, 'passes') },
            { label: 'Rebonds', val: moy(matchs, 'rebonds') },
            { label: 'Évaluation', val: moy(matchs, 'evaluation') },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{val}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Dernier match — {dernier.adversaire}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Points', val: dernier.points },
            { label: 'Passes déc.', val: dernier.passes },
            { label: 'Rebonds', val: dernier.rebonds },
            { label: 'Évaluation', val: dernier.evaluation },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{val}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Évolution de l'évaluation</p>
        <Bar data={{
          labels: [...matchs].reverse().map(m => m.adversaire),
          datasets: [{ label: 'Évaluation', data: [...matchs].reverse().map(m => m.evaluation), backgroundColor: '#2563eb', borderRadius: 6 }]
        }} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, responsive: true }} />

        {showMatchs && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Détail de tous les matchs</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Match', 'Date', 'PTS', 'PD', 'REB', 'ÉVA', 'BP', 'INT', 'Vidéo'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Match' || h === 'Date' ? 'left' : 'center', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchs.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{m.adversaire}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{m.date}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.points}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.passes}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.rebonds}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.evaluation}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.balle_perdue}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{m.interception}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {m.video_url ? <a href={m.video_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>▶ Voir</a> : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STATS EQUIPE */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 }}>Statistiques de l'équipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Points/match', val: '78.4' },
            { label: 'Rebonds/match', val: '36.2' },
            { label: 'Passes déc.', val: '18.6' },
            { label: 'Balles perdues', val: '12.1' },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{val}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Ton classement dans l'équipe</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Points', rang: '2e', total: 10 },
            { label: 'Passes déc.', rang: '1er', total: 10 },
            { label: 'Rebonds', rang: '5e', total: 10 },
            { label: 'Évaluation', rang: '2e', total: 10 },
          ].map(({ label, rang, total }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{rang}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label} / {total} joueurs</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}