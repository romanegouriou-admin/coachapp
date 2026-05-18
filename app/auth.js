export function getUser() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('user')
  if (!stored) return null
  return JSON.parse(stored)
}

export function getJoueurId() {
  if (typeof window === 'undefined') return null
  // Si l'admin veut voir la page d'une joueuse spécifique
  const params = new URLSearchParams(window.location.search)
  const joueurParam = params.get('joueur')
  if (joueurParam) return parseInt(joueurParam)
  // Sinon on prend le joueur connecté
  const user = getUser()
  if (!user) return null
  return user.joueur_id || null
}