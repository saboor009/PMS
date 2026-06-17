import { useState, useEffect } from 'react'
import { Plus, Search, FolderKanban, Calendar, Users, Trash2, UserCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/accessControl'
import { AvatarGroup } from '../components/ui/Avatar'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_FILTERS = ['all','planning','active','on_hold','completed','archived']
const COLORS = ['#2F85C8','#8B5CF6','#EC4899','#10B981','#F59E0B','#EF4444','#06B6D4','#6366F1']

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [manualCreateOpen, setManualCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreateProjects = can(user, 'createProjects')
  const showCreate = manualCreateOpen || (searchParams.get('create') === '1' && canCreateProjects)

  const fetchProjects = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    api.get(`/projects?${params}`).then(r => setProjects(r.data.projects || [])).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [search, statusFilter])

  const closeCreate = () => {
    setManualCreateOpen(false)
    if (searchParams.get('create')) setSearchParams({})
  }

  const deleteProject = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${deleteTarget._id}`)
      setProjects(prev => prev.filter(project => project._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Project deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 220, flex: 1, maxWidth: 340 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              style={{ width: '100%', padding: '9px 12px 9px 33px', borderRadius: 10, border: '1.5px solid #DBEAFE', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: statusFilter === s ? '#0F1E3D' : '#fff', color: statusFilter === s ? '#fff' : '#6B7280', boxShadow: statusFilter === s ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
                {s === 'all' ? 'All' : s.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        {canCreateProjects && <button onClick={() => setManualCreateOpen(true)} className="btn-primary"><Plus size={15} /> New Project</button>}
      </div>

      {loading ? <PageLoader /> : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found" description={search ? 'Try a different search.' : 'Create your first project.'} action={canCreateProjects && <button onClick={() => setManualCreateOpen(true)} className="btn-primary"><Plus size={14} /> New Project</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {projects.map(p => <ProjectCard key={p._id} project={p} canDelete={can(user, 'deleteProjects')} onDelete={() => setDeleteTarget(p)} />)}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={closeCreate} onCreated={() => { closeCreate(); fetchProjects() }} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteProject}
        title="Delete Project"
        message={`Delete "${deleteTarget?.title || 'this project'}"? This will also remove its tasks from active views.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

function ProjectCard({ project: p, canDelete, onDelete }) {
  const navigate = useNavigate()

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s' }}
      onClick={() => navigate(`/projects/${p._id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,30,61,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
      <div style={{ height: 6, background: p.coverColor || '#2F85C8' }} />
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F1E3D', lineHeight: 1.3 }}>{p.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 8, flexShrink: 0 }}>
            <StatusBadge status={p.status} />
            {canDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                title="Delete project"
                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #FEE2E2', background: '#fff', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        {p.description && <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6B7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <PriorityBadge priority={p.priority} />
          {p.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B7280' }}><Calendar size={11} />{format(new Date(p.deadline),'MMM d, yyyy')}</span>}
          {p.owner?.name && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B7280' }}><UserCheck size={11} />{p.owner.name}</span>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11.5, color: '#6B7280' }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: p.coverColor || '#2F85C8' }}>{p.progress || 0}%</span>
          </div>
          <div style={{ height: 5, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${p.progress || 0}%`, height: '100%', background: p.coverColor || '#2F85C8', borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AvatarGroup users={p.members || []} size={24} max={4} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><Users size={12} />{(p.members||[]).length} members</span>
        </div>
      </div>
    </div>
  )
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'planning', deadline: '', coverColor: COLORS[0] })
  const [users, setUsers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users || [])).catch(() => {})
  }, [])

  const toggleMember = id => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(memberId => memberId !== id) : [...prev, id])
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      await api.post('/projects', { ...form, members: selectedMembers })
      toast.success('Project created!')
      onCreated()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create') } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title="New Project" width={520}>
      <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Project Title *" value={form.title} onChange={set('title')} placeholder="e.g. Website Redesign" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A4A8A' }}>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="What is this project about?" rows={3} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #DBEAFE', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Priority" value={form.priority} onChange={set('priority')}>
            {['low','medium','high','critical'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={set('status')}>
            {['planning','active','on_hold','completed'].map(v => <option key={v} value={v}>{v.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
          </Select>
        </div>
        <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A4A8A', display: 'block', marginBottom: 8 }}>Project Members</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8, maxHeight: 170, overflowY: 'auto', paddingRight: 2 }}>
            {users.map(member => {
              const selected = selectedMembers.includes(member._id)
              return (
                <button type="button" key={member._id} onClick={() => toggleMember(member._id)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${selected ? '#2F85C8' : '#DBEAFE'}`, background: selected ? '#EFF6FF' : '#fff', borderRadius: 10, padding: 9, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${selected ? '#2F85C8' : '#BAD6F4'}`, background: selected ? '#2F85C8' : '#fff', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{selected ? 'x' : ''}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#0F1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.designation || member.email}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A4A8A', display: 'block', marginBottom: 8 }}>Cover Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => <button type="button" key={c} onClick={() => setForm(p => ({ ...p, coverColor: c }))} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: form.coverColor === c ? '3px solid #0F1E3D' : '3px solid transparent', cursor: 'pointer' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #DBEAFE', background: '#fff', color: '#1A4A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Project'}</button>
        </div>
      </form>
    </Modal>
  )
}
