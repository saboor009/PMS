import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Calendar, CheckSquare, FolderKanban, MessageSquare, Plus, Send, Trash2, Users, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import { AvatarGroup } from '../components/ui/Avatar'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { can, hasRoleAtLeast } from '../utils/accessControl'
import { CreateTaskModal } from './Tasks'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [comments, setComments] = useState([])
  const [users, setUsers] = useState([])
  const [memberToAdd, setMemberToAdd] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchProjectData = useCallback(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`),
      api.get(`/comments?project=${id}`),
      api.get('/users'),
    ])
      .then(([projectRes, tasksRes, commentsRes, usersRes]) => {
        setProject(projectRes.data.project)
        setTasks(tasksRes.data.tasks || [])
        setComments(commentsRes.data.comments || [])
        setUsers(usersRes.data.users || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  if (loading) return <PageLoader />
  if (!project) return <EmptyState icon={FolderKanban} title="Project not found" description="This project is unavailable or you do not have access." />

  const completed = tasks.filter(t => t.status === 'done').length
  const progress = project.progress ?? (tasks.length ? Math.round((completed / tasks.length) * 100) : 0)
  const canManageProjects = can(user, 'manageProjects')
  const canDeleteProjects = can(user, 'deleteProjects')
  const canCreateTasks = can(user, 'createTasks')
  const canAssignProjectManager = hasRoleAtLeast(user, 'ceo')
  const availableMembers = users.filter(member => !(project.members || []).some(existing => existing._id === member._id))

  const sendMessage = async e => {
    e.preventDefault()
    if (!message.trim()) return
    try {
      const res = await api.post('/comments', { project: id, body: message })
      setComments(prev => [...prev, res.data.comment])
      setMessage('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send')
    }
  }

  const addMember = async e => {
    e.preventDefault()
    if (!memberToAdd) return
    try {
      const res = await api.post(`/projects/${id}/members`, { userId: memberToAdd })
      setProject(prev => ({ ...prev, ...res.data.project, owner: res.data.project.owner || prev.owner }))
      setMemberToAdd('')
      toast.success('Member added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    }
  }

  const removeMember = async userId => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      setProject(prev => ({ ...prev, members: (prev.members || []).filter(member => member._id !== userId) }))
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const changeProjectManager = async ownerId => {
    if (!ownerId || ownerId === project.owner?._id) return
    try {
      const res = await api.put(`/projects/${id}`, { owner: ownerId })
      setProject(prev => ({ ...prev, ...res.data.project }))
      toast.success('Project manager updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project manager')
    }
  }

  const deleteProject = async () => {
    setDeleting(true)
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={() => navigate('/projects')} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#2F85C8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <ArrowLeft size={15} /> Projects
      </button>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 8, background: project.coverColor || '#2F85C8' }} />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#101828' }}>{project.title}</h1>
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              {canDeleteProjects && (
                <button onClick={() => setConfirmDeleteOpen(true)} title="Delete project" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #FEE2E2', background: '#FFF1F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p style={{ margin: 0, color: '#475467', fontSize: 14, lineHeight: 1.6 }}>
              {project.description || 'No description added yet.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Metric icon={CheckSquare} label="Tasks" value={`${completed}/${tasks.length} done`} />
            <Metric icon={Users} label="Members" value={`${project.members?.length || 0} members`} />
            <Metric icon={Calendar} label="Deadline" value={project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No deadline'} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>Project Tasks</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#667085', fontWeight: 600 }}>{tasks.length} total</span>
              {canCreateTasks && (
                <button onClick={() => setCreateTaskOpen(true)} className="btn-primary" style={{ padding: '8px 11px' }}>
                  <Plus size={14} /> New Task
                </button>
              )}
            </div>
          </div>
          {tasks.length === 0 ? (
            <p style={{ margin: 0, padding: '18px 0', color: '#98A2B3', fontSize: 13, textAlign: 'center' }}>No tasks in this project yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => (
                <div key={task._id} onClick={() => navigate(`/tasks/${task._id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 9, border: '1px solid #EEF2F7', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#98A2B3' }}>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}</p>
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFF6FF', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={17} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>Project Chat</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#98A2B3' }}>Coordinate with the project team</p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>{comments.length}</span>
          </div>

          <div style={{ height: 310, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 2px 12px' }}>
            {comments.length === 0 ? (
              <div style={{ border: '1px dashed #BAD6F4', borderRadius: 10, padding: 24, color: '#98A2B3', textAlign: 'center', fontSize: 13 }}>No project messages yet</div>
            ) : comments.map(comment => {
              const mine = comment.author?._id === user?._id
              return (
                <div key={comment._id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }}>
                  <Avatar name={comment.author?.name} avatar={comment.author?.avatar} size={30} />
                  <div style={{ maxWidth: '78%', background: mine ? '#EFF6FF' : '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#101828' }}>{comment.author?.name || 'User'}</span>
                      <span style={{ fontSize: 10.5, color: '#98A2B3' }}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#344054', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{comment.body}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, borderTop: '1px solid #F2F4F7', paddingTop: 12 }}>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message the project team..." style={{ flex: 1, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <button type="submit" className="btn-primary" style={{ padding: '9px 12px' }}><Send size={14} /></button>
          </form>
        </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#101828' }}>Progress</h2>
          <div style={{ fontSize: 34, fontWeight: 800, color: project.coverColor || '#2F85C8', lineHeight: 1 }}>{progress}%</div>
          <div style={{ height: 7, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden', margin: '12px 0 18px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: project.coverColor || '#2F85C8' }} />
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#667085', fontWeight: 700 }}>Team</p>
          <AvatarGroup users={project.members || []} size={30} max={6} />
          {project.owner && <p style={{ margin: '14px 0 0', fontSize: 12.5, color: '#667085' }}>Owner: <strong style={{ color: '#101828' }}>{project.owner.name}</strong></p>}
          {canAssignProjectManager && (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11.5, color: '#98A2B3', fontWeight: 700 }}>Project Manager</label>
              <select value={project.owner?._id || ''} onChange={e => changeProjectManager(e.target.value)} style={{ width: '100%', border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, color: '#344054', outline: 'none', background: '#fff' }}>
                {(project.members || []).map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
              </select>
            </div>
          )}
          {canManageProjects && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #EEF2F7' }}>
              <form onSubmit={addMember} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)} style={{ flex: 1, minWidth: 0, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, color: '#344054', outline: 'none', background: '#fff' }}>
                  <option value="">Add member...</option>
                  {availableMembers.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '8px 10px' }}><Plus size={14} /></button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(project.members || []).map(member => (
                  <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderTop: '1px solid #F2F4F7' }}>
                    <Avatar name={member.name} avatar={member.avatar} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#98A2B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.designation || member.team || 'Member'}</p>
                    </div>
                    {member._id !== project.owner?._id && (
                      <button onClick={() => removeMember(member._id)} title="Remove member" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #FEE2E2', background: '#fff', color: '#F04438', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        message={`Delete "${project.title}"? This will also remove its tasks from active views.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
      {createTaskOpen && (
        <CreateTaskModal
          initialProjectId={id}
          onClose={() => setCreateTaskOpen(false)}
          onCreated={() => { setCreateTaskOpen(false); fetchProjectData() }}
        />
      )}
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF2F7' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11.5, color: '#98A2B3', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#101828', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  )
}
