'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const ZONES = [
  { id: 'raquette', label: 'Raquette', cx: 250, cy: 390 },
  { id: 'milieu_raquette', label: 'Mi-raquette', cx: 250, cy: 310 },
  { id: 'mi_distance_gauche', label: 'Mi-dist G', cx: 130, cy: 300 },
  { id: 'mi_distance_droite', label: 'Mi-dist D', cx: 370, cy: 300 },
  { id: 'mi_distance_face', label: 'Mi-dist Face', cx: 250, cy: 230 },
  { id: 'trois_pts_corner_gauche', label: 'Corner G', cx: 60, cy: 400 },
  { id: 'trois_pts_corner_droit', label: 'Corner D', cx: 440, cy: 400 },
  { id: 'trois_pts_aile_gauche', label: '3pts Aile G', cx: 85, cy: 250 },
  { id: 'trois_pts_aile_droit', label: '3pts Aile D', cx: 415, cy: 250 },
  { id: 'trois_pts_face', label: '3pts Face', cx: 250, cy: 130 },
]

function getPct(tirs, zone) {
  const t = tirs.find(t => t.zone === zone)
  if (!t || t.tentes === 0) return null
  return Math.round((t.reussis / t.tentes) * 100)
}

function getColor(pct) {
  if (pct === null) return 'rgba(200,200,200,0.15)'
  if (pct >= 60) return 'rgba(34,197,94,0.25)'
  if (pct >= 40) return 'rgba(234,179,8,0.25)'
  return 'rgba(239,68,68,0.25)'
}

function getBorder(pct) {
  if (pct === null) return '#9ca3af'
  if (pct >= 60) return '#16a34a'
  if (pct >= 40) return '#ca8a04'
  return '#dc2626'
}

export default function Entrainement() {
  const [profil, setProfil] = useState(null)
  const [tirs, setTirs] = useState([])
  const [recommandations, setRecommandations] = useState([])
  const [objectifs, setObjectifs] = useState([])
  const [dribble, setDribble] = useState([])
  const [defense, setDefense] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data: p } = await supabase.from('profil_joueur').select('*').eq('joueur_id', 1).single()
      const { data: t } = await supabase.from('tirs').select('*').eq('joueur_id', 1).order('date', { ascending: false })
      const { data: r } = await supabase.from('recommandations').select('*').eq('joueur_id', 1)
      const { data: o } = await supabase.from('objectifs_seance').select('*').eq('joueur_id', 1)
      const { data: d } = await supabase.from('stats_dribble').select('*').eq('joueur_id', 1).order('date', { ascending: false })
      const { data: def } = await supabase.from('stats_defense').select('*').eq('joueur_id', 1).order('date', { ascending: false })
      setProfil(p)
      setTirs(t || [])
      setRecommandations(r || [])
      setObjectifs(o || [])
      setDribble(d || [])
      setDefense(def || [])
    }
    fetchData()
  }, [])

  async function toggleObjectif(id, fait) {
    await supabase.from('objectifs_seance').update({ fait: !fait }).eq('id', id)
    setObjectifs(objectifs.map(o => o.id === id ? { ...o, fait: !fait } : o))
  }

  if (!profil) return <div style={{ padding: 32, color: '#6b7280' }}>Chargement...</div>

  const moyDef = (key) => defense.length === 0 ? 0 : (defense.reduce((a, d) => a + (d[key] || 0), 0) / defense.length).toFixed(1)
  const moyDrib = (key) => dribble.length === 0 ? 0 : (dribble.reduce((a, d) => a + (d[key] || 0), 0) / dribble.length).toFixed(1)

  function StatCard({ label, val, color }) {
    return (
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 26, fontWeight: 700, color: color || '#111' }}>{val}</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* POINTS FORTS / FAIBLES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#16a34a', marginBottom: 12 }}>Points forts</p>
          <p style={{ fontSize: 14, color: '#111', lineHeight: 1.7 }}>{profil.points_forts}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#dc2626', marginBottom: 12 }}>Points à améliorer</p>
          <p style={{ fontSize: 14, color: '#111', lineHeight: 1.7 }}>{profil.points_faibles}</p>
        </div>
      </div>

      {/* OBJECTIFS SEANCE */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>Objectifs de la séance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objectifs.map(o => (
            <div key={o.id} onClick={() => toggleObjectif(o.id, o.fait)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: o.fait ? '#f0fdf4' : '#f9fafb', borderRadius: 10, border: `1px solid ${o.fait ? '#bbf7d0' : '#e5e7eb'}`, cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${o.fait ? '#16a34a' : '#d1d5db'}`, background: o.fait ? '#16a34a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {o.fait && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: o.fait ? '#16a34a' : '#111', textDecoration: o.fait ? 'line-through' : 'none' }}>{o.texte}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE ATTAQUE */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>Zone Attaque</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Clique sur une zone pour voir le détail</p>

        {/* TERRAIN SVG AUX NORMES */}
        <svg viewBox="0 0 500 460" width="100%" style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: 'white', marginBottom: 20 }}>

          {/* Contour demi-terrain */}
          <rect x="20" y="20" width="460" height="420" fill="white" stroke="#111" strokeWidth="2.5"/>

          {/* Ligne de fond (baseline) */}
          <line x1="20" y1="440" x2="480" y2="440" stroke="#111" strokeWidth="2.5"/>

          {/* RAQUETTE — rectangle aux normes FIBA */}
          <rect x="180" y="250" width="140" height="190" fill="none" stroke="#111" strokeWidth="2"/>

          {/* Petits traits sur les côtés de la raquette */}
          <line x1="170" y1="340" x2="180" y2="340" stroke="#111" strokeWidth="1.5"/>
          <line x1="170" y1="360" x2="180" y2="360" stroke="#111" strokeWidth="1.5"/>
          <line x1="170" y1="380" x2="180" y2="380" stroke="#111" strokeWidth="1.5"/>
          <line x1="480" y1="340" x2="480" y2="340" stroke="#111" strokeWidth="1.5"/>
          <line x1="320" y1="340" x2="330" y2="340" stroke="#111" strokeWidth="1.5"/>
          <line x1="320" y1="360" x2="330" y2="360" stroke="#111" strokeWidth="1.5"/>
          <line x1="320" y1="380" x2="330" y2="380" stroke="#111" strokeWidth="1.5"/>

          {/* Ligne de lancer franc */}
          <line x1="180" y1="250" x2="320" y2="250" stroke="#111" strokeWidth="2"/>

          {/* Demi-cercle lancer franc — haut (solid) */}
          <path d="M 180 250 A 70 70 0 0 1 320 250" fill="none" stroke="#111" strokeWidth="2"/>
          {/* Demi-cercle lancer franc — bas (tirets) */}
          <path d="M 180 250 A 70 70 0 0 0 320 250" fill="none" stroke="#111" strokeWidth="2" strokeDasharray="8 6"/>

          {/* Ligne 3 points — droites corners */}
          <line x1="88" y1="440" x2="88" y2="360" stroke="#111" strokeWidth="2"/>
          <line x1="412" y1="440" x2="412" y2="360" stroke="#111" strokeWidth="2"/>

          {/* Arc 3 points */}
          <path d="M 88 360 A 172 172 0 0 1 412 360" fill="none" stroke="#111" strokeWidth="2"/>

          {/* Panier — cercle */}
          <circle cx="250" cy="418" r="12" fill="none" stroke="#111" strokeWidth="2.5"/>
          {/* Backboard */}
          <line x1="222" y1="432" x2="278" y2="432" stroke="#111" strokeWidth="3"/>
          {/* Tige panier */}
          <line x1="250" y1="406" x2="250" y2="432" stroke="#111" strokeWidth="2"/>

          {/* Petit rectangle sous le panier */}
          <rect x="222" y="432" width="56" height="8" fill="none" stroke="#111" strokeWidth="1.5"/>

          {/* ZONES CLIQUABLES — cercles */}
          {ZONES.map(zone => {
            const pct = getPct(tirs, zone.id)
            const isSelected = selectedZone === zone.id
            return (
              <g key={zone.id} onClick={() => setSelectedZone(isSelected ? null : zone.id)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={zone.cx} cy={zone.cy} r="30"
                  fill={getColor(pct)}
                  stroke={isSelected ? '#2563eb' : getBorder(pct)}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text x={zone.cx} y={zone.cy - 8} textAnchor="middle" fontSize="8.5" fill="#374151" fontWeight="600" style={{ pointerEvents: 'none' }}>
                  {zone.label}
                </text>
                <text x={zone.cx} y={zone.cy + 10} textAnchor="middle" fontSize="14" fill="#111" fontWeight="800" style={{ pointerEvents: 'none' }}>
                  {pct !== null ? `${pct}%` : '—'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 12, color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, background: 'rgba(34,197,94,0.25)', border: '1px solid #16a34a', borderRadius: 3, display: 'inline-block' }}></span>≥ 60% — Bonne zone</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, background: 'rgba(234,179,8,0.25)', border: '1px solid #ca8a04', borderRadius: 3, display: 'inline-block' }}></span>40–59% — À travailler</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, background: 'rgba(239,68,68,0.25)', border: '1px solid #dc2626', borderRadius: 3, display: 'inline-block' }}></span>&lt; 40% — Zone faible</span>
        </div>

        {/* Résumé zones */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Résumé par zone</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ZONES.map(zone => {
              const pct = getPct(tirs, zone.id)
              return (
                <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, width: 120, color: '#374151', flexShrink: 0 }}>{zone.label}</span>
                  <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct || 0}%`, height: '100%', background: getBorder(pct), borderRadius: 10 }}></div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right' }}>{pct !== null ? `${pct}%` : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Détail zone sélectionnée */}
        {selectedZone && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Détail — {ZONES.find(z => z.id === selectedZone)?.label}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontSize: 11, fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280', fontSize: 11, fontWeight: 600 }}>Réussis</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280', fontSize: 11, fontWeight: 600 }}>Tentés</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280', fontSize: 11, fontWeight: 600 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {tirs.filter(t => t.zone === selectedZone).map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', color: '#6b7280' }}>{t.date}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{t.reussis}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{t.tentes}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{Math.round((t.reussis / t.tentes) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dribble stats */}
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Gestion du ballon — Dribble</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Balles perdues (moy.)', val: moyDrib('balles_perdues'), color: '#dc2626' },
            { label: 'Tirs contres (moy.)', val: moyDrib('tirs_contres'), color: '#ea580c' },
            { label: 'Fautes provoquées (moy.)', val: moyDrib('fautes_provoquees'), color: '#16a34a' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 26, fontWeight: 700, color }}>{val}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE DEFENSE */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>Zone Défense</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Suivi des stats défensives</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Fois dépassé (moy.)', val: moyDef('fois_depasse'), color: '#dc2626' },
            { label: 'Paniers encaissés (moy.)', val: moyDef('paniers_encaisses'), color: '#dc2626' },
            { label: 'Fautes commises (moy.)', val: moyDef('fautes_commises'), color: '#ea580c' },
            { label: 'Interceptions (moy.)', val: moyDef('interceptions'), color: '#16a34a' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 26, fontWeight: 700, color }}>{val}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Historique</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {['Date', 'Dépassé', 'Paniers enc.', 'Fautes', 'Interceptions'].map(h => (
                <th key={h} style={{ textAlign: h === 'Date' ? 'left' : 'center', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defense.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{d.date}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{d.fois_depasse}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{d.paniers_encaisses}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{d.fautes_commises}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{d.interceptions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECOMMANDATIONS */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>Vidéos & Lectures recommandées</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommandations.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div style={{ width: 40, height: 40, background: '#dbeafe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>▶</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>{r.titre}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{r.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}