import { useState, useEffect } from 'react'
import { Search, Users, Check, X, Mail, ShieldCheck, Settings2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { can, permissionsFor, roleLevel } from '../utils/accessControl'

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'ceo', label: 'CEO' },
]

const PERMISSION_GROUPS = [
  {
    title: 'People',
    items: [
      ['approveUsers', 'Approve access'],
      ['manageUsers', 'Manage users'],
      ['managePermissions', 'Edit permissions'],
      ['viewEmployeeSummary', 'Employee summary'],
    ],
  },
  {
    title: 'Projects',
    items: [
      ['createProjects', 'Create projects'],
      ['manageProjects', 'Manage projects'],
      ['deleteProjects', 'Delete projects'],
    ],
  },
  {
    title: 'Tasks',
    items: [
      ['createTasks', 'Create tasks'],
      ['assignTasks', 'Assign tasks'],
      ['deleteTasks', 'Delete tasks'],
      ['manageDailyTodos', 'Assign daily to-dos'],
    ],
  },
]

export default function Team() {
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('directory')
  const [accessOpenId, setAccessOpenId] = useState(null)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const canApproveUsers = can(user, 'approveUsers')
  const canManageUsers = can(user, 'manageUsers')
  const canManagePermissions = can(user, 'managePermissions')

  const fetchUsers = () => api.get('/users?search=' + encodeURIComponent(search)).then(r => setUsers(r.data.users || [])).catch(console.error)
  const fetchPending = () => canApproveUsers ? api.get('/users/pending').then(r => setPending(r.data.users || [])).catch(console.error) : Promise.resolve()

  useEffect(() => {
    if (searchParams.get('tab') === 'requests' && canApproveUsers) setTab('requests')
  }, [searchParams, canApproveUsers])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchUsers(), fetchPending()]).finally(() => setLoading(false))
  }, [search])

  const approve = async id => {
    try {
      await api.post('/users/pending/' + id + '/approve')
      toast.success('Approved')
      fetchPending()
      fetchUsers()
    } catch {
      toast.error('Failed')
    }
  }

  const decline = async id => {
    try {
      await api.post('/users/pending/' + id + '/decline')
      toast.success('Declined')
      fetchPending()
    } catch {
      toast.error('Failed')
    }
  }

  const updateRole = async (id, role) => {
    try {
      const r = await api.put('/users/' + id, { role })
      setUsers(p => p.map(u => u._id === id ? r.data.user : u))
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const togglePermission = async (member, permission) => {
    try {
      const current = permissionsFor(member)
      const next = { ...current, [permission]: !current[permission] }
      const r = await api.put('/users/' + member._id + '/permissions', next)
      setUsers(p => p.map(u => u._id === member._id ? { ...u, permissions: r.data.permissions } : u))
      toast.success('Access updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const toggleActive = async member => {
    try {
      const r = await api.put('/users/' + member._id + '/deactivate')
      setUsers(p => p.map(u => u._id === member._id ? { ...u, isActive: r.data.isActive } : u))
      toast.success(r.data.isActive ? 'User activated' : 'User deactivated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const grouped = users.reduce((acc, u) => {
    const t = u.team || 'Operations'
    if (!acc[t]) acc[t] = []
    acc[t].push(u)
    return acc
  }, {})

  const stats = [
    { label: 'Members', value: users.length, color: '#2F85C8' },
    { label: 'Managers+', value: users.filter(u => roleLevel(u.role) >= roleLevel('manager')).length, color: '#7F56D9' },
    { label: 'Teams', value: Object.keys(grouped).length, color: '#12B76A' },
    { label: 'Requests', value: pending.length, color: '#F79009' },
  ]

  const canControl = member => (
    canManageUsers
    && member._id !== user?._id
    && (roleLevel(user?.role) > roleLevel(member.role) || roleLevel(user?.role) >= roleLevel('ceo'))
  )
  const canEditAccess = member => canManagePermissions && canControl(member) && member.role === 'manager'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#667085', fontWeight: 600 }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 10, padding: 4, border: '1px solid #E4EAF5' }}>
          {(canApproveUsers ? ['directory', 'requests'] : ['directory']).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === t ? '#0F1E3D' : 'transparent', color: tab === t ? '#fff' : '#667085', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t}{t === 'requests' && pending.length > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '0 5px' }}>{pending.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'directory' && (
          <div style={{ position: 'relative', minWidth: 240, flex: '0 1 320px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#98A2B3', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid #DDE7F6', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
          </div>
        )}
      </div>

      {loading ? <PageLoader /> : tab === 'directory' ? (
        users.length === 0 ? <EmptyState icon={Users} title="No members" /> :
        Object.entries(grouped).map(([team, members]) => (
          <section key={team}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '1px' }}>{team}</h3>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#EFF6FF', color: '#2F85C8', borderRadius: 99, padding: '1px 7px' }}>{members.length}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 12, marginBottom: 20 }}>
              {members.map(m => (
                <MemberCard
                  key={m._id}
                  member={m}
                  viewer={user}
                  canControl={canControl(m)}
                  canEditAccess={canEditAccess(m)}
                  accessOpen={accessOpenId === m._id}
                  onAccessToggle={() => setAccessOpenId(id => id === m._id ? null : m._id)}
                  onRoleChange={updateRole}
                  onActiveToggle={toggleActive}
                  onPermissionToggle={togglePermission}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <RequestsTable pending={pending} approve={approve} decline={decline} />
      )}
    </div>
  )
}

function MemberCard({ member, viewer, canControl, canEditAccess, accessOpen, onAccessToggle, onRoleChange, onActiveToggle, onPermissionToggle }) {
  const permissions = permissionsFor(member)

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={member.name} avatar={member.avatar} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
            {!member.isActive && <span style={{ fontSize: 11, fontWeight: 800, color: '#B42318', background: '#FEF3F2', borderRadius: 7, padding: '2px 7px' }}>Inactive</span>}
          </div>
          <p style={{ margin: '3px 0 8px', fontSize: 12.5, color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.designation || member.email}</p>
          <RoleBadge role={member.role} />
        </div>
        <a href={'mailto:' + member.email} style={{ color: '#98A2B3', flexShrink: 0 }} title="Email">
          <Mail size={16} />
        </a>
      </div>

      {canControl && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={member.role} onChange={e => onRoleChange(member._id, e.target.value)} style={{ border: '1px solid #DDE7F6', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontWeight: 700, color: '#344054', background: '#fff' }}>
            {ROLE_OPTIONS.filter(r => roleLevel(viewer?.role) >= roleLevel('ceo') || roleLevel(r.value) < roleLevel('admin')).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={() => onActiveToggle(member)} style={{ border: '1px solid #DDE7F6', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontWeight: 800, color: member.isActive ? '#B42318' : '#027A48', background: '#fff', cursor: 'pointer' }}>
            {member.isActive ? 'Deactivate' : 'Activate'}
          </button>
          {canEditAccess && (
            <button onClick={onAccessToggle} style={{ border: '1px solid #DDE7F6', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontWeight: 800, color: '#1D6EB0', background: accessOpen ? '#EFF6FF' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Settings2 size={14} /> Manage access
            </button>
          )}
        </div>
      )}

      {canEditAccess && accessOpen && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EEF2F7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: '#344054', fontSize: 12.5, fontWeight: 800 }}>
            <ShieldCheck size={15} /> Access controls
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
            {PERMISSION_GROUPS.map(group => (
              <div key={group.title} style={{ background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 10, padding: 10 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{group.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map(([key, label]) => (
                    <button key={key} onClick={() => onPermissionToggle(member, key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', border: 'none', background: 'transparent', padding: '5px 0', cursor: 'pointer', color: '#344054', fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'left' }}>{label}</span>
                      <span style={{ width: 34, height: 20, borderRadius: 99, background: permissions[key] ? '#2F85C8' : '#D0D5DD', display: 'inline-flex', alignItems: 'center', justifyContent: permissions[key] ? 'flex-end' : 'flex-start', padding: 2, flexShrink: 0 }}>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(16,24,40,0.16)' }} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RequestsTable({ pending, approve, decline }) {
  if (pending.length === 0) {
    return <EmptyState icon={Users} title="No pending requests" description="All access requests have been handled" />
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            {['Name', 'Email', 'Designation', 'Team', 'Requested', 'Actions'].map(h => (
              <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF6FF' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pending.map((u, i) => (
            <tr key={u._id} style={{ borderBottom: i < pending.length - 1 ? '1px solid #F0F6FF' : 'none' }}>
              <td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={u.name} size={32} /><span style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3D' }}>{u.name}</span></div></td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12.5, color: '#667085' }}>{u.email}</span></td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12.5, color: '#667085' }}>{u.designation || '-'}</span></td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12.5, color: '#667085' }}>{u.team || '-'}</span></td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, color: '#98A2B3' }}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => approve(u._id)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} />Approve</button>
                  <button onClick={() => decline(u._id)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#FFF1F2', color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} />Decline</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
