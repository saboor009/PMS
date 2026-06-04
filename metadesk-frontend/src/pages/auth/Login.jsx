import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      background: '#06111D',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <BackgroundPattern />

      <div style={{
        width: 'min(1152px, 100%)',
        minHeight: 660,
        display: 'grid',
        gridTemplateColumns: '1fr 1.05fr',
        borderRadius: 26,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 28px 80px rgba(0,0,0,0.35)',
        background: '#fff',
      }}>
        <section style={{ padding: '36px 64px', display: 'flex', flexDirection: 'column' }}>
          <BrandHeader dark={false} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420 }}>
            <p style={{ margin: '0 0 12px', color: '#245BFF', fontSize: 13, fontWeight: 800, letterSpacing: '4px' }}>WORKSPACE ACCESS</p>
            <h1 style={{ margin: '0 0 14px', color: '#030712', fontSize: 36, lineHeight: 1.08, fontWeight: 800 }}>Welcome back</h1>
            <p style={{ margin: '0 0 34px', color: '#52627A', fontSize: 15.5, lineHeight: 1.6 }}>
              Sign in to manage projects, standalone tasks, team updates, messages, and deadlines.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field
                label="Email Address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@metadeskglobal.com"
                required
              />

              <div>
                <label style={labelStyle}>Password</label>
                <div style={inputWrapStyle}>
                  <Lock size={17} style={{ color: '#91A1B7', flexShrink: 0 }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Enter your password"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ border: 'none', background: 'transparent', color: '#91A1B7', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#52627A', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 14, height: 14 }} />
                  Remember me
                </label>
                <Link to="/register" style={{ color: '#245BFF', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Create an account</Link>
              </div>

              <button type="submit" disabled={loading} style={{
                height: 48,
                border: 'none',
                borderRadius: 22,
                background: '#2B63F1',
                color: '#fff',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 18px 34px rgba(43,99,241,0.25)',
                opacity: loading ? 0.75 : 1,
              }}>
                {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
              </button>
            </form>
          </div>

          <p style={{ margin: '24px 0 0', color: '#98A6C0', fontSize: 12 }}>© 2026 Metadesk Global. All rights reserved.</p>
        </section>

        <section style={{
          position: 'relative',
          padding: 40,
          color: '#fff',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1AA4F2 0%, #2E67ED 54%, #10245A 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.16), transparent 32%)' }} />
          <div style={{ position: 'absolute', left: -60, top: 0, width: 100, height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.36), rgba(255,255,255,0))', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', width: 530, height: 530, border: '1px solid rgba(255,255,255,0.16)', borderRadius: '50%', top: 28 }} />
          <div style={{ position: 'absolute', width: 430, height: 430, border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', bottom: -170 }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520 }}>
            <div style={{ display: 'inline-flex', padding: '8px 22px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 800, letterSpacing: '3px', marginBottom: 88 }}>
              INNOVATION & TECHNOLOGY
            </div>
            <div style={{ width: 224, height: 96, margin: '0 auto 36px', borderRadius: 14, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 70px rgba(3,7,18,0.12)' }}>
              <img src="/metadesk-icon.png" alt="" width="64" height="64" style={{ display: 'block' }} />
            </div>
            <h2 style={{ margin: '0 0 22px', fontSize: 36, lineHeight: 1.24, fontWeight: 800 }}>
              Project work, team communication, and delivery in one place.
            </h2>
            <p style={{ margin: '0 auto 82px', maxWidth: 430, fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
              A focused internal workspace for Metadesk Global managers and employees.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {['Projects', 'Tasks', 'Messages'].map(item => (
                <div key={item} style={{ padding: '13px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 800 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function BrandHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/metadesk-logo.png" alt="Metadesk Global" width="164" style={{ height: 'auto', display: 'block' }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#245BFF', letterSpacing: '3px', marginTop: 4 }}>INTERNAL PMS</div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={inputWrapStyle}>
        <Icon size={17} style={{ color: '#91A1B7', flexShrink: 0 }} />
        <input {...props} style={inputStyle} />
      </div>
    </div>
  )
}

function BackgroundPattern() {
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '86px 86px' }} />
      <div style={{ position: 'absolute', inset: -120, background: 'repeating-linear-gradient(116deg, transparent 0 250px, rgba(47,133,200,0.18) 252px 258px, transparent 260px 480px)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(12,32,68,0.9), rgba(0,0,0,0.45), rgba(5,45,58,0.7))' }} />
    </div>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 7,
  color: '#98A6C0',
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: '0.7px',
  textTransform: 'uppercase',
}

const inputWrapStyle = {
  height: 48,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #D8E0EC',
  borderRadius: 24,
  padding: '0 18px',
  background: '#fff',
  boxShadow: '0 14px 34px rgba(15,30,61,0.05)',
}

const inputStyle = {
  border: 'none',
  outline: 'none',
  flex: 1,
  minWidth: 0,
  fontFamily: 'inherit',
  fontSize: 13.5,
  color: '#101828',
  background: 'transparent',
}
