export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0c10',
      color: '#e8ecf2',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', color: '#ff6b1a', marginBottom: '16px' }}>
        ⚡ CoachApp
      </h1>
      <p style={{ color: '#6b7280', fontSize: '18px' }}>
        Saison 2024-2025
      </p>
    </div>
  )
}