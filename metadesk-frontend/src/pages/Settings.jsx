import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Lock, Users, Shield, ChevronRight, Save, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const NOTIF_OPTIONS = [
  { key: 'taskAssigned',     label: 'Task assigned to you',     desc: 'Get notified when someone assigns you a task' },
  { key: 'deadlineReminder', label: 'Deadline reminders',       desc: 'Reminders before your tasks are due' },
  { key: 'projectUpdate',    label: 'Project updates',          desc: 'When a project you are in is updated' },
  { key: 'commentMention',   label: 'Comment mentions',         desc: 'When someone @mentions you in a comment' },
  { key: 'fileUploaded',     label: 'File uploads',             desc: 'When files are added to your projects or tasks' },
]

export default function Settings() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [notifPrefs, setNotifPrefs] = useState(user?.notificationPrefs || {})
  const [savingNotif, setSavingNotif] = useState(false)
  const [savedNotif, setSavedNotif] = useState(false)

  const toggleNotif = (key) => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))

  const saveNotifPrefs = async () => {
    setSavingNotif(true)
    try {
      await api.put('/auth/profile', { notificationPrefs: notifPrefs })
      updateUser({ notificationPrefs: notifPrefs })
      setSavedNotif(true)
      setTimeout(() => setSavedNotif(false), 2000)
    } catch { toast.error('Failed to save') } finally { setSavingNotif(false) }
  }

  const QUICK_LINKS = [
    { icon: User,   label: 'Edit Profile',         desc: 'Update your name, email, and personal info', path: '/profile', color: '#2F85C8', bg: '#EFF6FF' },
    { icon: Lock,   label: 'Change Password',       desc: 'Update your account password',               path: '/profile', color: '#7F56D9', bg: '#F5F3FF' },
    { icon: Users,  label: 'Team Directory',        desc: 'View all team members and departments',      path: '/team',    color: '#F79009', bg: '#FFF6ED' },
    { icon: Shield, label: 'Access Requests',       desc: 'Manage pending account requests',            path: '/team',    color: '#12B76A', bg: '#F6FEF9' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      {/* Notification Preferences */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} style={{ color: '#2F85C8' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#101828' }}>Notification Preferences</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#98A2B3' }}>Choose what you want to be notified about</p>
            </div>
          </div>
          <button
            onClick={saveNotifPrefs}
            disabled={savingNotif}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: 'none', cursor: savingNotif ? 'default' : 'pointer',
              background: savedNotif ? '#12B76A' : '#2F85C8', color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {savedNotif ? <><Check size={14} /> Saved</> : savingNotif ? 'Saving...' : <><Save size={14} /> Save</>}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NOTIF_OPTIONS.map(({ key, label, desc }, i) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: i < NOTIF_OPTIONS.length - 1 ? '1px solid #F2F4F7' : 'none',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: '#101828' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#98A2B3' }}>{desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => toggleNotif(key)}
                style={{
                  width: 44, height: 24, borderRadius: 99, border: 'none',
                  cursor: 'pointer', flexShrink: 0, marginLeft: 16,
                  background: notifPrefs[key] ? '#2F85C8' : '#D0D5DD',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: notifPrefs[key] ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 3px rgba(16,24,40,0.15)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#101828' }}>Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {QUICK_LINKS.map(({ icon: Icon, label, desc, path, color, bg }) => (
            <div
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 10, border: '1px solid #F2F4F7', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg + '60' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#F2F4F7'; e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#101828' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#98A2B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
              </div>
              <ChevronRight size={15} style={{ color: '#D0D5DD', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#101828' }}>Metadesk Global PMS</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#98A2B3' }}>Version 1.0.0 · Built with React + Express + MongoDB</p>
        </div>
        <span style={{ background: '#F6FEF9', color: '#027A48', fontSize: 11.5, fontWeight: 600, borderRadius: 99, padding: '4px 10px', border: '1px solid #ABEFC6' }}>
          Up to date
        </span>
      </div>
    </div>
  )
}
