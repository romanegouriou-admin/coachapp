import Navbar from './Navbar'
import './globals.css'

export const metadata = {
  title: 'CoachApp',
  description: 'Suivi joueurs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <Navbar />
        <main style={{ padding: '32px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}