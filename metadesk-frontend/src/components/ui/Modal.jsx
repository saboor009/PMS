import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(16,24,40,0.4)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: width,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(16,24,40,0.18)',
          animation: 'fadeUp 0.2s ease',
        }}
      >
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 16px', borderBottom: '1px solid #F2F4F7', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#101828' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: '1px solid #EAECF0',
              background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475467', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF3F2'; e.currentTarget.style.color = '#F04438'; e.currentTarget.style.borderColor = '#FECDCA' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#475467'; e.currentTarget.style.borderColor = '#EAECF0' }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
