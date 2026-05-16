export function getUser() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('user')
  if (!stored) return null
  return JSON.parse(stored)
}

export function getJoueurId() {
  const user = getUser()
  if (!user) return null
  return user.joueur_id || null
}