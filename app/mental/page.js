'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { Line, Radar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Tooltip, Legend, Filler)

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: subtitle ? 4 : 20 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{subtitle}</p>}
      {children}
    </div>
  )
}

export default function Mental() {
  const [objectifs, setObjectifs] = useState([])
  const [suivi, setSuivi] = useState([])
  const [profil, setProfil] = useState(null)
  const [radar, setRadar] = useState(null)
  const [semaine, setSemaine] = useState({ stress: 5, motivation: 5, confiance: 5, energie: 5, commentaire: '' })
  const [envoye, setEnvoye] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: o } = await supabase.from('objectifs_mentaux').select('*').eq('joueur_id', 1)
      const { data: s } = await supabase.from('suivi_mental').select('*').eq('joueur_id', 1).order('date')
      const { data: p } = await supabase.from('profil_mental').select('*').eq('joueur_id', 1).single()
      const { data: r } = await supabase.from('radar_mental').select('*').eq('joueur_id', 1).single()
      setObjectifs(o || [])
      setSuivi(s || [])
      setProfil(p)
      setRadar(r)
    }
    fetchData()
  }, [])

  async function envoyerSemaine() {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('suivi_mental').insert([{ joueur_id: 1, date: today, ...semaine }])
    setEnvoye(true)
    const { data: s } = await supabase.from('suivi_mental').select('*').eq('joueur_id', 1).order('date')
    setSuivi(s || [])
  }

  const sliderStyle = { width: '100%', accentColor: '#111' }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* SUIVI MENTAL HEBDO */}
      <Section title="Suivi mental hebdomadaire" subtitle="Comment tu te sens cette semaine ?">
        {!envoye ? (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Cette semaine</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
              {[
                { key: 'stress', label: 'Niveau de stress', low: 'Très stressé', high: 'Très calme' },
                { key: 'motivation', label: 'Motivation', low: 'Aucune', high: 'Maximum' },
                { key: 'confiance', label: 'Confiance en soi', low: 'Très faible', high: 'Très élevée' },
                { key: 'energie', label: 'Énergie', low: 'Épuisé', high: 'Plein d\'énergie' },
              ].map(({ key, label, low, high }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{semaine[key]}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={semaine[key]}
                    onChange={e => setSemaine({ ...semaine, [key]: parseInt(e.target.value) })}
                    style={sliderStyle}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    <span>{low}</span><span>{high}</span>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              placeholder="Un commentaire pour le coach ? (optionnel)"
              value={semaine.commentaire}
              onChange={e => setSemaine({ ...semaine, commentaire: e.target.value })}
              style={{ width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontFamily: 'sans-serif', fontSize: 13, color: '#111', resize: 'vertical', minHeight: 70, outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={envoyerSemaine} style={{ marginTop: 12, padding: '10px 24px', background: '#111', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Envoyer ✓
            </button>
          </div>
        ) : (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 24, fontSize: 14, color: '#16a34a', fontWeight: 600 }}>
            ✅ Suivi de la semaine envoyé au coach !
          </div>
        )}

        {suivi.length > 1 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Évolution sur la saison</p>
            <Line data={{
              labels: suivi.map(s => s.date),
              datasets: [
                { label: 'Motivation', data: suivi.map(s => s.motivation), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', tension: 0.4, pointBackgroundColor: '#2563eb' },
                { label: 'Confiance', data: suivi.map(s => s.confiance), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.06)', tension: 0.4, pointBackgroundColor: '#16a34a' },
                { label: 'Stress', data: suivi.map(s => s.stress), borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.06)', tension: 0.4, pointBackgroundColor: '#dc2626' },
                { label: 'Énergie', data: suivi.map(s => s.energie), borderColor: '#ea580c', backgroundColor: 'rgba(234,88,12,0.06)', tension: 0.4, pointBackgroundColor: '#ea580c' },
              ]
            }} options={{
              responsive: true,
              plugins: { legend: { labels: { font: { size: 12 } } } },
              scales: { y: { min: 0, max: 10, ticks: { stepSize: 2 } } }
            }}/>
          </>
        )}
      </Section>

      {/* OBJECTIFS MENTAUX */}
      <Section title="Objectifs mentaux de la saison" subtitle="Progression sur les axes de travail définis avec le coach">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {objectifs.map((o, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{o.objectif}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{o.progression}%</span>
              </div>
              <div style={{ height: 32, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${o.progression}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #1d4ed8, #2563eb)',
                  borderRadius: 6,
                  transition: 'width 1s ease',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{o.progression}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PROFIL MENTAL */}
      {profil && (
        <Section title="Profil mental" subtitle="Analyse de ta personnalité sportive">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'inline-block', background: '#111', color: 'white', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 16, letterSpacing: 0.5 }}>
                {profil.type_personnalite}
              </div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 20 }}>{profil.description}</p>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Forces</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profil.forces.split(' — ').map((f, i) => (
                    <span key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Axes de travail</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profil.faiblesses.split(' — ').map((f, i) => (
                    <span key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
            {radar && (
              <div>
                <Radar data={{
                  labels: ['Confiance', 'Concentration', 'Gestion stress', 'Motivation', 'Résilience', 'Esprit équipe', 'Leadership'],
                  datasets: [{
                    label: 'Profil mental',
                    data: [radar.confiance, radar.concentration, radar.stress, radar.motivation, radar.resilience, radar.esprit_equipe, radar.leadership],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.1)',
                    pointBackgroundColor: '#2563eb',
                    pointRadius: 4,
                  }]
                }} options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      min: 0, max: 100,
                      ticks: { stepSize: 20, font: { size: 10 }, backdropColor: 'transparent' },
                      pointLabels: { font: { size: 11 } },
                      grid: { color: '#e5e7eb' }
                    }
                  }
                }}/>
              </div>
            )}
          </div>
        </Section>
      )}

    </div>
  )
}