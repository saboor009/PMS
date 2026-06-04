import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, CalendarCheck, Check, Trash2, UserCheck, ClipboardList } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/accessControl'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { format, addDays, subDays } from 'date-fns'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [assignedTodos, setAssignedTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState('mine')
  const { user } = useAuth()
  const canAssignTodos = can(user, 'manageDailyTodos')

  const fetchTodos = () => {
    setLoading(true)
    const dateParam = date.toISOString()
    const mine = api.get('/todos?date=' + dateParam).then(r => setTodos(r.data.todos || []))
    const assigned = canAssignTodos
      ? api.get('/todos/assigned?date=' + dateParam).then(r => setAssignedTodos(r.data.todos || []))
      : Promise.resolve(setAssignedTodos([]))
    Promise.all([mine, assigned]).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTodos() }, [date])

  const toggle = async (id, isCompleted) => {
    try {
      await api.put('/todos/' + id, { isCompleted, date: date.toISOString() })
      setTodos(p => p.map(t => t._id === id ? { ...t, isCompleted, completedAt: isCompleted ? new Date() : null } : t))
    } catch {
      toast.error('Failed')
    }
  }

  const remove = async id => {
    try {
      await api.delete('/todos/' + id)
      setTodos(p => p.filter(t => t._id !== id))
      setAssignedTodos(p => p.filter(t => t._id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed')
    }
  }

  const done = todos.filter(t => t.isCompleted).length
  const pct = todos.length ? Math.round(done / todos.length * 100) : 0
  const assignedDone = assignedTodos.filter(t => t.isCompleted).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setDate(p => subDays(p, 1))} style={navBtn}><ChevronLeft size={16} /></button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F1E3D' }}>{format(date, 'EEEE')}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{format(date, 'MMMM d, yyyy')}</p>
          </div>
          <button onClick={() => setDate(p => addDays(p, 1))} style={navBtn}><ChevronRight size={16} /></button>
          <button onClick={() => setDate(new Date())} style={{ padding: '6px 12px', borderRadius: 9, border: '1.5px solid #DBEAFE', background: '#fff', color: '#2F85C8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Today</button>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15} /> Add To-Do</button>
      </div>

      {canAssignTodos && (
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 4, border: '1.5px solid #DBEAFE', width: 'fit-content' }}>
          {[
            { key: 'mine', label: 'My To-Dos', count: todos.length },
            { key: 'assigned', label: 'Assigned by Me', count: assignedTodos.length },
          ].map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: tab === item.key ? '#0F1E3D' : 'transparent', color: tab === item.key ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.label}
              <span style={{ fontSize: 11, borderRadius: 99, padding: '0 6px', background: tab === item.key ? 'rgba(255,255,255,0.2)' : '#EFF6FF', color: tab === item.key ? '#fff' : '#2F85C8' }}>{item.count}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'mine' && todos.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3D' }}>My Completion</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#2F85C8' }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,#2F85C8,#5BB8E8)', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6B7280' }}>{done} of {todos.length} tasks completed</p>
        </div>
      )}

      {tab === 'assigned' && (
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Summary icon={ClipboardList} label="Assigned" value={assignedTodos.length} color="#2F85C8" />
          <Summary icon={Check} label="Completed" value={assignedDone} color="#12B76A" />
          <Summary icon={UserCheck} label="Pending" value={assignedTodos.length - assignedDone} color="#F79009" />
        </div>
      )}

      {loading ? <PageLoader /> : tab === 'mine' ? (
        <TodoList todos={todos} emptyTitle="No todos for this day" onToggle={toggle} onDelete={remove} />
      ) : (
        <AssignedTodoList todos={assignedTodos} onDelete={remove} />
      )}

      {showCreate && <CreateTodoModal canAssignTodos={canAssignTodos} date={date} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchTodos() }} />}
    </div>
  )
}

function TodoList({ todos, emptyTitle, onToggle, onDelete }) {
  if (todos.length === 0) return <EmptyState icon={CalendarCheck} title={emptyTitle} description="Add tasks to stay on track" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {todos.map(t => (
        <div key={t._id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: t.isCompleted ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          <button onClick={() => onToggle(t._id, !t.isCompleted)} style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid', borderColor: t.isCompleted ? '#2F85C8' : '#DBEAFE', background: t.isCompleted ? '#2F85C8' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
            {t.isCompleted && <Check size={13} color="#fff" />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#0F1E3D', textDecoration: t.isCompleted ? 'line-through' : 'none' }}>{t.title}</p>
            {t.recurrence === 'daily' && <span style={{ display: 'inline-flex', marginTop: 4, background: '#EFF6FF', color: '#2F85C8', borderRadius: 99, padding: '2px 7px', fontSize: 10.5, fontWeight: 800 }}>Daily</span>}
            {t.notes && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>{t.notes}</p>}
            {t.completedAt && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#22C55E' }}>Completed at {format(new Date(t.completedAt), 'HH:mm')}</p>}
            {t.assignedBy && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}><Avatar name={t.assignedBy.name} avatarStyle={t.assignedBy.avatarStyle} size={16} /><span style={{ fontSize: 11, color: '#9CA3AF' }}>Assigned by {t.assignedBy.name}</span></div>}
          </div>
          <DeleteButton onClick={() => onDelete(t._id)} />
        </div>
      ))}
    </div>
  )
}

function AssignedTodoList({ todos, onDelete }) {
  if (todos.length === 0) return <EmptyState icon={UserCheck} title="No assigned to-dos" description="Create a to-do for an employee to track completion here." />

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            {['Employee', 'To-Do', 'Status', 'Completed', 'Actions'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF6FF' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {todos.map((todo, i) => (
            <tr key={todo._id} style={{ borderBottom: i < todos.length - 1 ? '1px solid #F0F6FF' : 'none' }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Avatar name={todo.assignedTo?.name} avatarStyle={todo.assignedTo?.avatarStyle} size={30} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F1E3D' }}>{todo.assignedTo?.name || 'Employee'}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#98A2B3' }}>{todo.assignedTo?.designation || todo.assignedTo?.team || ''}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', maxWidth: 360 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828' }}>{todo.title}</p>
                {todo.notes && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#98A2B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.notes}</p>}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ background: todo.isCompleted ? '#F6FEF9' : '#FFF6ED', color: todo.isCompleted ? '#027A48' : '#B54708', borderRadius: 99, padding: '4px 9px', fontSize: 11.5, fontWeight: 800 }}>
                  {todo.isCompleted ? 'Completed' : 'Pending'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{todo.completedAt ? format(new Date(todo.completedAt), 'MMM d, HH:mm') : '-'}</td>
              <td style={{ padding: '12px 16px' }}><DeleteButton onClick={() => onDelete(todo._id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CreateTodoModal({ canAssignTodos, date, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', notes: '', assignTo: '', recurrence: 'once' })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    if (canAssignTodos) api.get('/users').then(r => setUsers(r.data.users || [])).catch(() => {})
  }, [canAssignTodos])

  const submit = async e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title required')
    setLoading(true)
    try {
      await api.post('/todos', { title: form.title, notes: form.notes, date: date.toISOString(), assignTo: form.assignTo || undefined, recurrence: form.recurrence })
      toast.success(form.recurrence === 'daily' ? 'Daily to-do created' : form.assignTo ? 'Assigned to-do created' : 'Added!')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add To-Do" width={460}>
      <form onSubmit={submit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Title *" value={form.title} onChange={set('title')} placeholder="What needs to be done?" />
        {canAssignTodos && (
          <Select label="Assign to" value={form.assignTo} onChange={set('assignTo')}>
            <option value="">Myself</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} {u.designation ? `- ${u.designation}` : ''}</option>)}
          </Select>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A4A8A' }}>Notes (optional)</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." rows={3} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #DBEAFE', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A4A8A' }}>Repeat</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'once', label: format(date, 'EEEE, MMMM d') },
              { key: 'daily', label: 'Every day' },
            ].map(option => (
              <button key={option.key} type="button" onClick={() => setForm(p => ({ ...p, recurrence: option.key }))} style={{ padding: '9px 10px', borderRadius: 10, border: `1.5px solid ${form.recurrence === option.key ? '#2F85C8' : '#DBEAFE'}`, background: form.recurrence === option.key ? '#EFF6FF' : '#fff', color: form.recurrence === option.key ? '#1A4A8A' : '#6B7280', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #DBEAFE', background: '#fff', color: '#1A4A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add To-Do'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Summary({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}16`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} /></div>
      <div>
        <p style={{ margin: 0, fontSize: 11.5, color: '#98A2B3', fontWeight: 700 }}>{label}</p>
        <p style={{ margin: '1px 0 0', fontSize: 18, color: '#101828', fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  )
}

function DeleteButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, borderRadius: 6, display: 'flex' }} onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}>
      <Trash2 size={15} />
    </button>
  )
}

const navBtn = {
  width: 32,
  height: 32,
  borderRadius: 9,
  border: '1.5px solid #DBEAFE',
  background: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#2F85C8',
}
