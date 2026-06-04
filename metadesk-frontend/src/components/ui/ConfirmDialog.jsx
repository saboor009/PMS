import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? '#FFF1F2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: danger ? '#EF4444' : '#F59E0B' }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #DBEAFE', background: '#fff', color: '#1A4A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: danger ? '#EF4444' : 'linear-gradient(135deg,#2F85C8,#1A4A8A)', color: '#fff', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
