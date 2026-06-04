export default function Spinner({ size = 32, color = '#2F85C8' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${color}22`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Spinner size={36} />
    </div>
  )
}
