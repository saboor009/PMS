import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', department: '', jobTitle: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (!/^[a-z0-9_]+$/.test(form.username)) return toast.error('Username: lowercase letters, numbers, underscores only')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0F1E3D 0%, #1A4A8A 50%, #2F85C8 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-900 mb-2">Request Submitted!</h2>
          <p className="text-brand-500 text-sm mb-6">Your access request has been sent. A manager will review and approve your account shortly.</p>
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-700 text-sm">Back to Sign In →</Link>
        </div>
      </div>
    )
  }

  const fields = [
    { label: 'Full Name', field: 'fullName', type: 'text', placeholder: 'John Doe', required: true },
    { label: 'Username', field: 'username', type: 'text', placeholder: 'john_doe', required: true },
    { label: 'Email Address', field: 'email', type: 'email', placeholder: 'john@company.com', required: true },
    { label: 'Department', field: 'department', type: 'text', placeholder: 'Engineering', required: false },
    { label: 'Job Title', field: 'jobTitle', type: 'text', placeholder: 'Software Developer', required: false },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0F1E3D 0%, #1A4A8A 50%, #2F85C8 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/metadesk-logo.png" alt="Metadesk Global" width="170" className="mx-auto mb-3" style={{ height: 'auto' }} />
          <p className="text-white font-bold text-2xl">Metadesk <span className="text-blue-300 font-normal text-lg">Global</span></p>
          <p className="text-blue-200 text-sm mt-1">Create your account request</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-brand-900 mb-6">Request Access</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.map(({ label, field, type, placeholder, required }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-brand-700 mb-1">{label}</label>
                <input type={type} required={required} value={form[field]} onChange={set(field)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-200 text-brand-900 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-brand-200 text-brand-900 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #2F85C8, #1A4A8A)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Request'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-500 mt-5">
            Already approved?{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-700">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
