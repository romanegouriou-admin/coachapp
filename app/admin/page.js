'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { useRouter } from 'next/navigation'
import { getUser } from '../auth.js'

function calcEVA(s) {
  const pts = (parseInt(s.t2i_marques) || 0) * 2 + (parseInt(s.t2e_marques) || 0) * 2 + (parseInt(s.t3_marques) || 0) * 3 + (parseInt(s.lf_marques) || 0)
  const t2i_rates = (parseInt(s.t2i_tentes) || 0) - (parseInt(s.t2i_marques) || 0)
  const t2e_rates = (parseInt(s.t2e_tentes) || 0) - (parseInt(s.t2e_marques) || 0)
  const t3_rates = (parseInt(s.t3_tentes) || 0) - (parseInt(s.t3_marques) || 0)
  const lf_rates = (parseInt(s.lf_tentes) || 0) - (parseInt(s.lf_marques) || 0)
  const reb = (parseInt(s.reb_off) || 0) + (parseInt(s.reb_def) || 0)
  const eva = pts - t2i_rates - t2e_rates - t3_rates - lf_rates + reb + (parseInt(s.assists) || 0) - (parseInt(s.balle_perdue) || 0) + (parseInt(s.interception) || 0) + (parseInt(s.contre) || 0)
  return { pts, eva }
}
function EquipeStats({ equipes, joueurs }) {
  const [equipeId, setEquipeId] = useState('')
  const [stats, setStats] = useState([])

  async function chargerStats(id) {
    setEquipeId(id)
    const { data: je } = await supabase.from('joueur_equipe').select('joueur_id').eq('equipe_id', id)
    const ids = (je || []).map(j => j.joueur_id)
    const { data: matchs } = await supabase.from('matchs').select('*').in('joueur_id', ids)
    const statsParJoueur = joueurs.filter(j => ids.includes(j.id)).map(j => {
      const ms = (matchs || []).filter(m => m.joueur_id === j.id)
      const moy = (key) => ms.length === 0 ? 0 : (ms.reduce((a, m) => a + (m[key] || 0), 0) / ms.length).toFixed(1)
      return { ...j, matchs: ms.length, pts: moy('points'), reb: moy('rebonds'), pd: moy('passes'), eva: moy('evaluation'), bp: moy('balle_perdue'), int: moy('interception') }
    }).sort((a, b) => b.eva - a.eva)
    setStats(statsParJoueur)
  }

  const inputStyle = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontFamily: 'sans-serif', fontSize: 13, color: '#111', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Stats équipe</h2>
      <div style={{ maxWidth: 300, marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
        <select style={inputStyle} value={equipeId} onChange={e => chargerStats(e.target.value)}>
          <option value="">Choisir une équipe</option>
          {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
        </select>
      </div>

      {stats.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
              {['Rang', 'Joueuse', 'Matchs', 'PTS moy', 'REB moy', 'PD moy', 'BP moy', 'INT moy', 'ÉVA moy'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Joueuse' ? 'left' : 'center', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((j, i) => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f3f4f6', background: i === 0 ? '#fffbeb' : 'white' }}>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: i === 0 ? '#ca8a04' : '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '12px', fontWeight: 600 }}>{j.prenom} {j.nom}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{j.matchs}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{j.pts}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{j.reb}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{j.pd}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{j.bp}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{j.int}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, fontSize: 16 }}>{j.eva}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
export default function Admin() {
  const [user, setUser] = useState(null)
  const [equipes, setEquipes] = useState([])
  const [joueurs, setJoueurs] = useState([])
  const [activeSection, setActiveSection] = useState('joueurs')

  const [matchAdversaire, setMatchAdversaire] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchEquipe, setMatchEquipe] = useState('')
  const [statsJoueurs, setStatsJoueurs] = useState({})

  const [newNom, setNewNom] = useState('')
  const [newPrenom, setNewPrenom] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newNumero, setNewNumero] = useState('')
  const [newEquipes, setNewEquipes] = useState([])

  const [msgJoueur, setMsgJoueur] = useState('')
  const [msgTexte, setMsgTexte] = useState('')

  const [docJoueur, setDocJoueur] = useState('')
  const [docTitre, setDocTitre] = useState('')
  const [docType, setDocType] = useState('document')
  const [docUrl, setDocUrl] = useState('')
  const [docDesc, setDocDesc] = useState('')

  const [equipeSelectee, setEquipeSelectee] = useState('')
  const [joueurSelecte, setJoueurSelecte] = useState('')

  const router = useRouter()

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    if (u.role === 'joueur') { router.push('/basket'); return }
    setUser(u)
    fetchData()
  }, [])

  async function fetchData() {
    const { data: eq } = await supabase.from('equipes').select('*')
    const { data: jo } = await supabase.from('joueuses').select('*')
    setEquipes(eq || [])
    setJoueurs(jo || [])
  }

  function updateStat(joueurId, field, value) {
    setStatsJoueurs(prev => ({ ...prev, [joueurId]: { ...prev[joueurId], [field]: value } }))
  }

  function toggleEquipe(id) {
    setNewEquipes(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  async function ajouterJoueur() {
    if (!newNom || !newPrenom) return
    const { data } = await supabase.from('joueuses').insert([{
      nom: newNom, prenom: newPrenom, role: newRole, numero: parseInt(newNumero) || 0
    }]).select().single()
    if (data && newEquipes.length > 0) {
      for (const equipeId of newEquipes) {
        await supabase.from('joueur_equipe').insert([{ joueur_id: data.id, equipe_id: parseInt(equipeId) }])
      }
    }
    setNewNom(''); setNewPrenom(''); setNewRole(''); setNewNumero(''); setNewEquipes([])
    fetchData()
    alert('Joueuse ajoutée ✅')
  }

  async function saisirMatch() {
    if (!matchAdversaire || !matchDate) return
    for (const joueur of joueurs) {
      const s = statsJoueurs[joueur.id] || {}
      const { pts, eva } = calcEVA(s)
      await supabase.from('matchs').insert([{
        joueur_id: joueur.id,
        adversaire: matchAdversaire,
        date: matchDate,
        points: pts,
        passes: parseInt(s.assists) || 0,
        rebonds: (parseInt(s.reb_off) || 0) + (parseInt(s.reb_def) || 0),
        evaluation: eva,
        lancer_franc: parseInt(s.lf_marques) || 0,
        balle_perdue: parseInt(s.balle_perdue) || 0,
        interception: parseInt(s.interception) || 0,
        contre: parseInt(s.contre) || 0,
        video_url: s.video_url || '',
        t2i_marques: parseInt(s.t2i_marques) || 0,
        t2i_tentes: parseInt(s.t2i_tentes) || 0,
        t2e_marques: parseInt(s.t2e_marques) || 0,
        t2e_tentes: parseInt(s.t2e_tentes) || 0,
        t3_marques: parseInt(s.t3_marques) || 0,
        t3_tentes: parseInt(s.t3_tentes) || 0,
        lf_marques: parseInt(s.lf_marques) || 0,
        lf_tentes: parseInt(s.lf_tentes) || 0,
        reb_off: parseInt(s.reb_off) || 0,
        reb_def: parseInt(s.reb_def) || 0,
        assists: parseInt(s.assists) || 0,
      }])
    }
    setMatchAdversaire(''); setMatchDate(''); setStatsJoueurs({})
    alert('Match saisi ✅')
  }

  async function envoyerMessage() {
    if (!msgJoueur || !msgTexte) return
    await supabase.from('messages').insert([{ joueur_id: parseInt(msgJoueur), expediteur: 'coach', contenu: msgTexte }])
    setMsgJoueur(''); setMsgTexte('')
    alert('Message envoyé ✅')
  }

  async function envoyerDocument() {
    if (!docJoueur || !docTitre) return
    await supabase.from('documents').insert([{
      joueur_id: parseInt(docJoueur), titre: docTitre, type: docType, url: docUrl, description: docDesc, lu: false
    }])
    setDocJoueur(''); setDocTitre(''); setDocUrl(''); setDocDesc('')
    alert('Document envoyé ✅')
  }

  const inputStyle = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontFamily: 'sans-serif', fontSize: 13, color: '#111', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const btnStyle = { padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  const tabStyle = (s) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeSection === s ? '#111' : '#f3f4f6', color: activeSection === s ? 'white' : '#6b7280' })

  if (!user) return <div style={{ padding: 32 }}>Chargement...</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif', padding: 32 }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>Espace Admin</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Connecté en tant que {user.prenom} {user.nom} — <span style={{ fontWeight: 600 }}>{user.role}</span></p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {user.role === 'coach' && <button style={tabStyle('joueurs')} onClick={() => setActiveSection('joueurs')}>Gérer les joueuses</button>}
        {user.role === 'coach' && <button style={tabStyle('match')} onClick={() => setActiveSection('match')}>Saisir un match</button>}
        {user.role === 'coach' && <button style={tabStyle('message')} onClick={() => setActiveSection('message')}>Envoyer un message</button>}
        {user.role === 'coach' && <button style={tabStyle('document')} onClick={() => setActiveSection('document')}>Envoyer un document</button>}
        {(user.role === 'coach' || user.role === 'pp') && <button style={tabStyle('prepa')} onClick={() => setActiveSection('prepa')}>Prépa Physique</button>}
        {(user.role === 'coach' || user.role === 'pm') && <button style={tabStyle('mental')} onClick={() => setActiveSection('mental')}>Prépa Mentale</button>}
        {user.role === 'coach' && <button style={tabStyle('voir')} onClick={() => setActiveSection('voir')}>Voir une joueuse</button>}
{user.role === 'coach' && <button style={tabStyle('equipe')} onClick={() => setActiveSection('equipe')}>Stats équipe</button>}
      {activeSection === 'equipe' && (
  <EquipeStats equipes={equipes} joueurs={joueurs} supabase={supabase}/>
)}</div>

      {/* SECTION JOUEURS */}
      {activeSection === 'joueurs' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Ajouter une joueuse</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nom</label><input style={inputStyle} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Prénom</label><input style={inputStyle} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Marie"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Poste</label><input style={inputStyle} value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Meneuse"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Numéro</label><input style={inputStyle} type="number" value={newNumero} onChange={e => setNewNumero(e.target.value)} placeholder="7"/></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 8 }}>Équipes</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {equipes.map(eq => (
                <div key={eq.id} onClick={() => toggleEquipe(String(eq.id))}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${newEquipes.includes(String(eq.id)) ? '#111' : '#e5e7eb'}`, background: newEquipes.includes(String(eq.id)) ? '#111' : 'white', color: newEquipes.includes(String(eq.id)) ? 'white' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {eq.nom}
                </div>
              ))}
            </div>
          </div>
          <button style={btnStyle} onClick={ajouterJoueur}>Ajouter la joueuse</button>

          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Joueuses enregistrées</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['ID', 'Nom', 'Prénom', 'Poste', 'Numéro'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {joueurs.map((j, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{j.id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{j.nom}</td>
                    <td style={{ padding: '10px 12px' }}>{j.prenom}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{j.role}</td>
                    <td style={{ padding: '10px 12px' }}>{j.numero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION MATCH */}
      {activeSection === 'match' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Saisir un match</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
              <select style={inputStyle} value={matchEquipe} onChange={e => setMatchEquipe(e.target.value)}>
                <option value="">Toutes</option>
                {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Adversaire</label>
              <input style={inputStyle} value={matchAdversaire} onChange={e => setMatchAdversaire(e.target.value)} placeholder="vs Lyon"/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date</label>
              <input style={inputStyle} type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)}/>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>Joueuse</th>
                  <th colSpan="2" style={{ padding: '8px 10px', textAlign: 'center', color: '#2563eb', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>T2 Intérieur</th>
                  <th colSpan="2" style={{ padding: '8px 10px', textAlign: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>T2 Extérieur</th>
                  <th colSpan="2" style={{ padding: '8px 10px', textAlign: 'center', color: '#ea580c', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>3 Points</th>
                  <th colSpan="2" style={{ padding: '8px 10px', textAlign: 'center', color: '#16a34a', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>LF</th>
                  <th colSpan="2" style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>Rebonds</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>ASS</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11 }}>BP</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11 }}>INT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11 }}>CT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#111', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb' }}>PTS</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#111', fontWeight: 700, fontSize: 11 }}>ÉVA</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 700, fontSize: 11, borderLeft: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Vidéo URL</th>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                  <th></th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10, borderLeft: '1px solid #e5e7eb' }}>Mq</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>Tt</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10, borderLeft: '1px solid #e5e7eb' }}>Mq</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>Tt</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10, borderLeft: '1px solid #e5e7eb' }}>Mq</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>Tt</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10, borderLeft: '1px solid #e5e7eb' }}>Mq</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>Tt</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10, borderLeft: '1px solid #e5e7eb' }}>Off</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>Def</th>
                  <th></th><th></th><th></th><th></th>
                  <th style={{ borderLeft: '1px solid #e5e7eb' }}></th>
                  <th></th><th style={{ borderLeft: '1px solid #e5e7eb' }}></th>
                </tr>
              </thead>
              <tbody>
                {joueurs.map((j) => {
                  const s = statsJoueurs[j.id] || {}
                  const { pts, eva } = calcEVA(s)
                  const pct2i = s.t2i_tentes > 0 ? Math.round((s.t2i_marques / s.t2i_tentes) * 100) : null
                  const pct2e = s.t2e_tentes > 0 ? Math.round((s.t2e_marques / s.t2e_tentes) * 100) : null
                  const pct3 = s.t3_tentes > 0 ? Math.round((s.t3_marques / s.t3_tentes) * 100) : null
                  const pctlf = s.lf_tentes > 0 ? Math.round((s.lf_marques / s.lf_tentes) * 100) : null
                  return (
                    <tr key={j.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>{j.prenom} {j.nom}</td>
                      {/* T2i */}
                      <td style={{ padding: '4px 4px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t2i_marques || ''} onChange={e => updateStat(j.id, 't2i_marques', e.target.value)}/>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t2i_tentes || ''} onChange={e => updateStat(j.id, 't2i_tentes', e.target.value)}/>
                        {pct2i !== null && <div style={{ fontSize: 10, color: '#2563eb', textAlign: 'center', fontWeight: 600 }}>{pct2i}%</div>}
                      </td>
                      {/* T2e */}
                      <td style={{ padding: '4px 4px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t2e_marques || ''} onChange={e => updateStat(j.id, 't2e_marques', e.target.value)}/>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t2e_tentes || ''} onChange={e => updateStat(j.id, 't2e_tentes', e.target.value)}/>
                        {pct2e !== null && <div style={{ fontSize: 10, color: '#7c3aed', textAlign: 'center', fontWeight: 600 }}>{pct2e}%</div>}
                      </td>
                      {/* T3 */}
                      <td style={{ padding: '4px 4px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t3_marques || ''} onChange={e => updateStat(j.id, 't3_marques', e.target.value)}/>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.t3_tentes || ''} onChange={e => updateStat(j.id, 't3_tentes', e.target.value)}/>
                        {pct3 !== null && <div style={{ fontSize: 10, color: '#ea580c', textAlign: 'center', fontWeight: 600 }}>{pct3}%</div>}
                      </td>
                      {/* LF */}
                      <td style={{ padding: '4px 4px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.lf_marques || ''} onChange={e => updateStat(j.id, 'lf_marques', e.target.value)}/>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.lf_tentes || ''} onChange={e => updateStat(j.id, 'lf_tentes', e.target.value)}/>
                        {pctlf !== null && <div style={{ fontSize: 10, color: '#16a34a', textAlign: 'center', fontWeight: 600 }}>{pctlf}%</div>}
                      </td>
                      {/* Rebonds */}
                      <td style={{ padding: '4px 4px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.reb_off || ''} onChange={e => updateStat(j.id, 'reb_off', e.target.value)}/>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s.reb_def || ''} onChange={e => updateStat(j.id, 'reb_def', e.target.value)}/>
                      </td>
                      {/* ASS BP INT CT */}
                      {['assists','balle_perdue','interception','contre'].map(field => (
                        <td key={field} style={{ padding: '4px 4px' }}>
                          <input type="number" placeholder="0" style={{ ...inputStyle, width: 44, padding: '5px 6px', fontSize: 12 }} value={s[field] || ''} onChange={e => updateStat(j.id, field, e.target.value)}/>
                        </td>
                      ))}
                      {/* PTS EVA auto */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#111', borderLeft: '1px solid #f3f4f6', fontSize: 16 }}>{pts}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: eva >= 0 ? '#16a34a' : '#dc2626', fontSize: 16 }}>{eva}</td>
                      {/* Video */}
                      <td style={{ padding: '4px 6px', borderLeft: '1px solid #f3f4f6' }}>
                        <input type="text" placeholder="https://..." style={{ ...inputStyle, width: 140, fontSize: 12 }} value={s.video_url || ''} onChange={e => updateStat(j.id, 'video_url', e.target.value)}/>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button style={{ ...btnStyle, marginTop: 20 }} onClick={saisirMatch}>Enregistrer le match ✅</button>
        </div>
      )}

      {/* SECTION MESSAGE */}
      {activeSection === 'message' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Envoyer un message</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Joueuse</label>
              <select style={inputStyle} value={msgJoueur} onChange={e => setMsgJoueur(e.target.value)}>
                <option value="">Choisir une joueuse</option>
                {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Message</label>
              <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={msgTexte} onChange={e => setMsgTexte(e.target.value)} placeholder="Écris ton message..."/>
            </div>
            <button style={btnStyle} onClick={envoyerMessage}>Envoyer le message</button>
          </div>
        </div>
      )}

      {/* SECTION DOCUMENT */}
      {activeSection === 'document' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Envoyer un document</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 700 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Joueuse</label>
              <select style={inputStyle} value={docJoueur} onChange={e => setDocJoueur(e.target.value)}>
                <option value="">Choisir une joueuse</option>
                {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Type</label>
              <select style={inputStyle} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="document">Document</option>
                <option value="video">Vidéo</option>
                <option value="questionnaire">Questionnaire</option>
                <option value="photo">Photo</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Titre</label>
              <input style={inputStyle} value={docTitre} onChange={e => setDocTitre(e.target.value)} placeholder="Analyse défense vs Lyon"/>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>URL ou lien fichier</label>
              <input style={inputStyle} value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://drive.google.com/... ou https://youtube.com/..."/>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={docDesc} onChange={e => setDocDesc(e.target.value)} placeholder="Instructions pour la joueuse..."/>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#16a34a' }}>
            💡 Pour partager des photos ou fichiers, upload-les sur Google Drive et colle le lien de partage ici.
          </div>
          <button style={{ ...btnStyle, marginTop: 16 }} onClick={envoyerDocument}>Envoyer le document</button>
        </div>
      )}

      {/* SECTION PREPA */}
      {activeSection === 'prepa' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Prépa Physique</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sélectionne une équipe ou une joueuse</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
              <select style={inputStyle} value={equipeSelectee} onChange={e => setEquipeSelectee(e.target.value)}>
                <option value="">Toutes</option>
                {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Joueuse</label>
              <select style={inputStyle} value={joueurSelecte} onChange={e => setJoueurSelecte(e.target.value)}>
                <option value="">Choisir</option>
                {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              </select>
            </div>
          </div>
          {joueurSelecte && (
            <div style={{ padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>✅ Modification de la prépa physique — à venir prochainement</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION MENTAL */}
      {activeSection === 'mental' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Prépa Mentale</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sélectionne une équipe ou une joueuse</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
              <select style={inputStyle} value={equipeSelectee} onChange={e => setEquipeSelectee(e.target.value)}>
                <option value="">Toutes</option>
                {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Joueuse</label>
              <select style={inputStyle} value={joueurSelecte} onChange={e => setJoueurSelecte(e.target.value)}>
                <option value="">Choisir</option>
                {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              </select>
            </div>
          </div>
          {joueurSelecte && (
            <div style={{ padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>✅ Modification de la prépa mentale — à venir prochainement</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION VOIR UNE JOUEUSE */}
      {activeSection === 'voir' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Voir les pages d'une joueuse</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sélectionne une joueuse pour voir exactement ce qu'elle voit</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
              <select style={inputStyle} value={equipeSelectee} onChange={e => setEquipeSelectee(e.target.value)}>
                <option value="">Toutes</option>
                {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Joueuse</label>
              <select style={inputStyle} value={joueurSelecte} onChange={e => setJoueurSelecte(e.target.value)}>
                <option value="">Choisir</option>
                {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              </select>
            </div>
          </div>
          {joueurSelecte && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Basketball', href: '/basket' },
                { label: 'Entraînement', href: '/entrainement' },
                { label: 'Prépa Physique', href: '/prepa' },
                { label: 'Prépa Mentale', href: '/mental' },
                { label: 'Communication', href: '/communication' },
              ].map(({ label, href }) => (
                <a key={href} href={`${href}?joueur=${joueurSelecte}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ ...btnStyle, background: '#f3f4f6', color: '#111' }}>{label} →</button>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}