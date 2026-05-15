'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { useRouter } from 'next/navigation'

export default function Admin() {
  const [user, setUser] = useState(null)
  const [equipes, setEquipes] = useState([])
  const [joueurs, setJoueurs] = useState([])
  const [equipeActive, setEquipeActive] = useState(null)
  const [activeSection, setActiveSection] = useState('joueurs')

  // Saisie match
  const [matchAdversaire, setMatchAdversaire] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [statsJoueurs, setStatsJoueurs] = useState({})

  // Nouveau joueur
  const [newNom, setNewNom] = useState('')
  const [newPrenom, setNewPrenom] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newNumero, setNewNumero] = useState('')
  const [newEquipe, setNewEquipe] = useState('')

  // Message
  const [msgJoueur, setMsgJoueur] = useState('')
  const [msgTexte, setMsgTexte] = useState('')

  // Document
  const [docJoueur, setDocJoueur] = useState('')
  const [docTitre, setDocTitre] = useState('')
  const [docType, setDocType] = useState('document')
  const [docUrl, setDocUrl] = useState('')
  const [docDesc, setDocDesc] = useState('')

  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role === 'joueur') { router.push('/basket'); return }
    setUser(u)
    fetchData()
  }, [])

  async function fetchData() {
    const { data: eq } = await supabase.from('equipes').select('*')
    const { data: jo } = await supabase.from('joueuses').select('*')
    setEquipes(eq || [])
    setJoueurs(jo || [])
    if (eq && eq.length > 0) setEquipeActive(eq[0].id)
  }

  async function ajouterJoueur() {
    if (!newNom || !newPrenom) return
    const { data } = await supabase.from('joueuses').insert([{
      nom: newNom, prenom: newPrenom, role: newRole, numero: parseInt(newNumero) || 0
    }]).select().single()
    if (data && newEquipe) {
      await supabase.from('joueur_equipe').insert([{ joueur_id: data.id, equipe_id: parseInt(newEquipe) }])
    }
    setNewNom(''); setNewPrenom(''); setNewRole(''); setNewNumero(''); setNewEquipe('')
    fetchData()
    alert('Joueuse ajoutée ✅')
  }

  async function saisirMatch() {
    if (!matchAdversaire || !matchDate) return
    const entries = Object.entries(statsJoueurs)
    for (const [joueurId, stats] of entries) {
      await supabase.from('matchs').insert([{
        joueur_id: parseInt(joueurId),
        adversaire: matchAdversaire,
        date: matchDate,
        points: parseInt(stats.points) || 0,
        passes: parseInt(stats.passes) || 0,
        rebonds: parseInt(stats.rebonds) || 0,
        evaluation: parseInt(stats.evaluation) || 0,
        lancer_franc: parseInt(stats.lancer_franc) || 0,
        balle_perdue: parseInt(stats.balle_perdue) || 0,
        interception: parseInt(stats.interception) || 0,
        contre: parseInt(stats.contre) || 0,
        video_url: stats.video_url || ''
      }])
    }
    setMatchAdversaire(''); setMatchDate(''); setStatsJoueurs({})
    alert('Match saisi pour toutes les joueuses ✅')
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

  function updateStat(joueurId, field, value) {
    setStatsJoueurs(prev => ({ ...prev, [joueurId]: { ...prev[joueurId], [field]: value } }))
  }

  const inputStyle = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontFamily: 'sans-serif', fontSize: 13, color: '#111', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const btnStyle = { padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  const tabStyle = (s) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeSection === s ? '#111' : '#f3f4f6', color: activeSection === s ? 'white' : '#6b7280' })

  if (!user) return <div style={{ padding: 32 }}>Chargement...</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif', padding: 32 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>Espace Admin</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Connecté en tant que {user.prenom} {user.nom} — {user.role}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('user'); router.push('/login') }} style={{ ...btnStyle, background: '#f3f4f6', color: '#6b7280' }}>
          Déconnexion
        </button>
      </div>

      {/* NAVIGATION */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {(user.role === 'coach') && <button style={tabStyle('joueurs')} onClick={() => setActiveSection('joueurs')}>Gérer les joueuses</button>}
        {(user.role === 'coach') && <button style={tabStyle('match')} onClick={() => setActiveSection('match')}>Saisir un match</button>}
        {(user.role === 'coach') && <button style={tabStyle('message')} onClick={() => setActiveSection('message')}>Envoyer un message</button>}
        {(user.role === 'coach') && <button style={tabStyle('document')} onClick={() => setActiveSection('document')}>Envoyer un document</button>}
        {(user.role === 'coach' || user.role === 'pp') && <button style={tabStyle('prepa')} onClick={() => setActiveSection('prepa')}>Modifier Prépa Physique</button>}
        {(user.role === 'coach' || user.role === 'pm') && <button style={tabStyle('mental')} onClick={() => setActiveSection('mental')}>Modifier Prépa Mentale</button>}
      </div>

      {/* SECTION JOUEURS */}
      {activeSection === 'joueurs' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Ajouter une joueuse</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nom</label><input style={inputStyle} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Prénom</label><input style={inputStyle} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Marie"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Rôle</label><input style={inputStyle} value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Meneuse"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Numéro</label><input style={inputStyle} type="number" value={newNumero} onChange={e => setNewNumero(e.target.value)} placeholder="7"/></div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Équipe</label>
              <select style={inputStyle} value={newEquipe} onChange={e => setNewEquipe(e.target.value)}>
                <option value="">Choisir une équipe</option>
                {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
          </div>
          <button style={btnStyle} onClick={ajouterJoueur}>Ajouter la joueuse</button>

          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Joueuses enregistrées</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['ID', 'Nom', 'Prénom', 'Rôle', 'Numéro'].map(h => (
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Adversaire</label><input style={inputStyle} value={matchAdversaire} onChange={e => setMatchAdversaire(e.target.value)} placeholder="vs Lyon"/></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date</label><input style={inputStyle} type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)}/></div>
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Stats par joueuse</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Joueuse', 'PTS', 'PD', 'REB', 'ÉVA', 'LF', 'BP', 'INT', 'CTR', 'Vidéo URL'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {joueurs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{j.prenom} {j.nom}</td>
                    {['points','passes','rebonds','evaluation','lancer_franc','balle_perdue','interception','contre'].map(field => (
                      <td key={field} style={{ padding: '4px 6px' }}>
                        <input type="number" placeholder="0" style={{ ...inputStyle, width: 50, padding: '6px 8px' }}
                          value={statsJoueurs[j.id]?.[field] || ''}
                          onChange={e => updateStat(j.id, field, e.target.value)}/>
                      </td>
                    ))}
                    <td style={{ padding: '4px 6px' }}>
                      <input type="text" placeholder="https://..." style={{ ...inputStyle, width: 160 }}
                        value={statsJoueurs[j.id]?.video_url || ''}
                        onChange={e => updateStat(j.id, 'video_url', e.target.value)}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button style={{ ...btnStyle, marginTop: 20 }} onClick={saisirMatch}>Enregistrer le match pour toutes ✅</button>
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
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Titre</label>
              <input style={inputStyle} value={docTitre} onChange={e => setDocTitre(e.target.value)} placeholder="Analyse défense vs Lyon"/>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>URL</label>
              <input style={inputStyle} value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://..."/>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={docDesc} onChange={e => setDocDesc(e.target.value)} placeholder="Instructions pour la joueuse..."/>
            </div>
          </div>
          <button style={{ ...btnStyle, marginTop: 16 }} onClick={envoyerDocument}>Envoyer le document</button>
        </div>
      )}

      {/* SECTION PREPA PHYSIQUE */}
      {activeSection === 'prepa' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Modifier Prépa Physique</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sélectionne une joueuse pour modifier ses données physiques</p>
          <select style={{ ...inputStyle, maxWidth: 300 }}>
            <option value="">Choisir une joueuse</option>
            {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 20 }}>🚧 Section en construction — modification des routines, séances et testing à venir</p>
        </div>
      )}

      {/* SECTION MENTAL */}
      {activeSection === 'mental' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Modifier Prépa Mentale</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sélectionne une joueuse pour modifier son profil mental</p>
          <select style={{ ...inputStyle, maxWidth: 300 }}>
            <option value="">Choisir une joueuse</option>
            {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 20 }}>🚧 Section en construction — modification des objectifs mentaux et profil à venir</p>
        </div>
      )}

    </div>
  )
}