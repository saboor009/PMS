export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13.5, fontWeight: 600, color: '#344054' }}>{label}</label>}
      <input
        {...props}
        className="input-field"
        style={{ ...style }}
      />
      {error && <span style={{ fontSize: 12, color: '#F04438' }}>{error}</span>}
    </div>
  )
}

export function Select({ label, children, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13.5, fontWeight: 600, color: '#344054' }}>{label}</label>}
      <select
        {...props}
        style={{
          padding: '9px 13px', borderRadius: 8, border: '1px solid #D0D5DD',
          fontSize: 13.5, color: '#101828', fontFamily: 'inherit',
          background: '#fff', cursor: 'pointer', outline: 'none', ...style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: '#F04438' }}>{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13.5, fontWeight: 600, color: '#344054' }}>{label}</label>}
      <textarea
        {...props}
        className="input-field"
        style={{ resize: 'vertical', minHeight: 80, ...style }}
      />
      {error && <span style={{ fontSize: 12, color: '#F04438' }}>{error}</span>}
    </div>
  )
}
