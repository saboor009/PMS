import { useState, useEffect } from 'react'
import { FolderKanban, CheckSquare, Users, TrendingUp, Clock, AlertCircle, ChevronRight, ArrowUpRight, StickyNote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/accessControl'
import { AvatarGroup } from '../components/ui/Avatar'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { formatDistanceToNow, isPast, format } from 'date-fns'

const KANBAN_COLS = [
  { key: 'todo',        label: 'To Do',       color: '#98A2B3', bg: '#F9FAFB', dot: '#98A2B3' },
  { key: 'in_progress', label: 'In Progress',  color: '#2F85C8', bg: '#EFF6FF', dot: '#2F85C8' },
  { key: 'review',      label: 'In Review',    color: '#F79009', bg: '#FFFBEB', dot: '#F79009' },
  { key: 'done',        label: 'Done',         color: '#12B76A', bg: '#F6FEF9', dot: '#12B76A' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [personalNote, setPersonalNote] = useState('')
  const [expandedColumns, setExpandedColumns] = useState({})
  const { user } = useAuth()
  const navigate = useNavigate()
  const canViewEmployeeSummary = can(user, 'viewEmployeeSummary')
  const personalNoteKey = `metadesk-personal-note-${user?._id || user?.email || 'me'}`

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPersonalNote(localStorage.getItem(personalNoteKey) || '')
  }, [personalNoteKey])

  const updatePersonalNote = e => {
    const value = e.target.value
    setPersonalNote(value)
    localStorage.setItem(personalNoteKey, value)
  }

  const toggleColumn = key => {
    setExpandedColumns(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) return <PageLoader />

  const { stats, recentProjects = [], kanbanTasks = [], upcomingTasks = [], employeeStats } = data || {}

  const tasksByStatus = KANBAN_COLS.reduce((acc, col) => {
    acc[col.key] = kanbanTasks.filter(t => t.status === col.key)
    return acc
  }, {})

  const STAT_CARDS = [
    { label: 'Total Projects',   value: stats?.totalProjects ?? 0,  change: '+2 this week', icon: FolderKanban, iconBg: '#EFF6FF', iconColor: '#2F85C8', link: '/projects' },
    { label: 'Active Tasks',     value: stats?.totalTasks ?? 0,     change: 'Open tasks',   icon: CheckSquare,  iconBg: '#F5F3FF', iconColor: '#7F56D9', link: '/tasks' },
    { label: 'Team Members',     value: stats?.totalMembers ?? 0,   change: 'Active users', icon: Users,        iconBg: '#FFF6ED', iconColor: '#F79009', link: '/team' },
    { label: 'Tasks Completed',  value: stats?.doneTasks ?? 0,      change: 'This month',   icon: TrendingUp,   iconBg: '#F6FEF9', iconColor: '#12B76A', link: '/tasks' },
  ]
  const showTopStats = !canViewEmployeeSummary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stat cards */}
      {showTopStats && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STAT_CARDS.map(({ label, value, change, icon: Icon, iconBg, iconColor, link }) => (
          <div key={label} className="card stat-card" onClick={() => navigate(link)}
            style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} style={{ color: iconColor }} />
              </div>
              <ArrowUpRight size={16} style={{ color: '#D0D5DD' }} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#101828', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#475467', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: '#98A2B3', marginTop: 2 }}>{change}</div>
            </div>
          </div>
        ))}
      </div>}

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Kanban board */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#101828' }}>Task Board</h2>
            <button onClick={() => navigate('/tasks')} style={{ fontSize: 12.5, color: '#2F85C8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {KANBAN_COLS.map(({ key, label, color, bg, dot }) => {
              const columnTasks = tasksByStatus[key] || []
              const isExpanded = !!expandedColumns[key]
              const visibleTasks = isExpanded ? columnTasks : columnTasks.slice(0, 3)
              const hiddenCount = columnTasks.length - 3

              return (
              <div key={key} style={{ background: bg, borderRadius: 10, padding: 12, minHeight: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, background: '#fff', borderRadius: 99, padding: '1px 7px', border: `1px solid ${color}30` }}>
                    {columnTasks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {visibleTasks.map(task => (
                    <div key={task._id} style={{
                      background: '#fff', borderRadius: 8, padding: '10px 11px',
                      border: '1px solid #F2F4F7', cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                      transition: 'box-shadow 0.15s',
                    }}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 8px rgba(16,24,40,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 2px rgba(16,24,40,0.04)'}
                    >
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#101828', lineHeight: 1.35 }}>{task.title}</p>
                      {task.project && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#98A2B3' }}>{task.project.title}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span style={{ fontSize: 10.5, color: isPast(new Date(task.dueDate)) ? '#F04438' : '#98A2B3', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={9} />{format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {task.assignedTo?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <AvatarGroup users={task.assignedTo} size={20} max={3} />
                        </div>
                      )}
                    </div>
                  ))}
                  {columnTasks.length > 3 && (
                    <button
                      type="button"
                      onClick={() => toggleColumn(key)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#7C8BA1',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        margin: '3px 0 0',
                        padding: '4px 0',
                        textAlign: 'center',
                      }}
                    >
                      {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        {canViewEmployeeSummary && employeeStats && (
          <TeamLoadSummary employeeStats={employeeStats} onViewAll={() => navigate('/employee-summary')} />
        )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Personal note */}
          <div className="card" style={{ padding: '18px 20px', background: '#FFFCF0', borderColor: '#FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StickyNote size={16} strokeWidth={2.2} />
                </div>
                <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#101828' }}>Personal Sticky Note</h2>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#A16207' }}>Private</span>
            </div>
            <textarea
              value={personalNote}
              onChange={updatePersonalNote}
              placeholder="Write a quick reminder for yourself..."
              rows={5}
              maxLength={600}
              style={{
                width: '100%',
                minHeight: 112,
                resize: 'vertical',
                border: '1px solid #FDE68A',
                borderRadius: 10,
                padding: '11px 12px',
                background: '#FFFDF5',
                color: '#101828',
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#A16207' }}>Autosaved on this device</span>
              <span style={{ fontSize: 11, color: '#A16207' }}>{personalNote.length}/600</span>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#101828' }}>Recent Projects</h2>
              <button onClick={() => navigate('/projects')} style={{ fontSize: 12, color: '#2F85C8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See all</button>
            </div>
            {recentProjects.length === 0
              ? <p style={{ fontSize: 13, color: '#98A2B3', textAlign: 'center', padding: '16px 0' }}>No projects yet</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recentProjects.map(p => (
                  <div key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p._id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: p.coverColor || '#2F85C8', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2F85C8', flexShrink: 0 }}>{p.progress || 0}%</span>
                    </div>
                    <div style={{ height: 4, background: '#F2F4F7', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ width: `${p.progress || 0}%`, height: '100%', background: p.coverColor || '#2F85C8', borderRadius: 99 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AvatarGroup users={p.members || []} size={18} max={3} />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Deadlines */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#101828' }}>Upcoming Deadlines</h2>
              <AlertCircle size={15} style={{ color: '#F04438' }} />
            </div>
            {upcomingTasks.length === 0
              ? <p style={{ fontSize: 13, color: '#98A2B3', textAlign: 'center', padding: '16px 0' }}>No upcoming deadlines 🎉</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {upcomingTasks.map(t => {
                  const overdue = isPast(new Date(t.dueDate))
                  return (
                    <div key={t._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 8,
                      background: overdue ? '#FEF3F2' : '#F9FAFB',
                      border: `1px solid ${overdue ? '#FECDCA' : '#F2F4F7'}`,
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: '#101828', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: overdue ? '#F04438' : '#98A2B3', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {overdue ? 'Overdue' : formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}
                      </span>
                    </div>
                  )
                })}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamLoadSummary({ employeeStats, onViewAll }) {
  const employees = employeeStats.employees || []

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#101828' }}>Team Load</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#98A2B3' }}>{employeeStats.total || employees.length} active team members</p>
        </div>
        <button onClick={onViewAll} style={{ fontSize: 12.5, fontWeight: 700, color: '#2F85C8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          View all <ChevronRight size={13} />
        </button>
      </div>

      {employees.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: 18, rowGap: 10 }}>
          {employees.map(employee => {
            const style = loadStyle(employee.load)
            return (
              <div key={employee._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '10px 0', borderBottom: '1px solid #F2F4F7' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employee.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#98A2B3' }}>{employee.openTasks} open tasks</p>
                </div>
                <span style={{ color: style.color, borderRadius: 99, padding: '2px 0', fontSize: 11.5, fontWeight: 800, textTransform: 'capitalize', flexShrink: 0 }}>
                  {employee.load}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function loadStyle(load) {
  if (load === 'overloaded') return { bg: '#FEF3F2', color: '#B42318' }
  if (load === 'busy') return { bg: '#FFF6ED', color: '#B54708' }
  return { bg: '#F6FEF9', color: '#027A48' }
}
