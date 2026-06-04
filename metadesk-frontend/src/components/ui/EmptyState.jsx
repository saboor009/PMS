export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      {Icon && (
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon size={28} style={{ color: '#2F85C8' }} />
        </div>
      )}
      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0F1E3D' }}>{title}</h3>
      {description && <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280', maxWidth: 300 }}>{description}</p>}
      {action}
    </div>
  )
}
