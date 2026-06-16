import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, FolderKanban, MessageSquare, Paperclip, Plus, Send, Trash2, Upload, UserCircle, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar, { AvatarGroup } from '../components/ui/Avatar'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { can } from '../utils/accessControl'

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [files, setFiles] = useState([])
  const [comments, setComments] = useState([])
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [assigneeToAdd, setAssigneeToAdd] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/tasks/${id}`), api.get('/users'), api.get('/projects'), api.get(`/comments?task=${id}`)])
      .then(([taskRes, usersRes, projectsRes, commentsRes]) => {
        setTask(taskRes.data.task)
        setFiles(taskRes.data.files || [])
        setUsers(usersRes.data.users || [])
        setProjects(projectsRes.data.projects || [])
        setComments(commentsRes.data.comments || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const getProjectMembers = () => {
    const projectId = task?.project?._id
    if (!projectId) return []
    const project = projects.find(item => item._id === projectId)
    return project?.members || []
  }

  const getMentionQuery = () => {
    const match = message.match(/(^|\s)@([\w.-]*)$/)
    return match ? match[2].toLowerCase() : null
  }

  const getMentionIds = () => {
    const tokens = [...message.matchAll(/@([\w.-]+)/g)].map(match => match[1].toLowerCase())
    return getProjectMembers()
      .filter(member => {
        const username = member.username?.toLowerCase()
        const compactName = member.name?.replace(/\s+/g, '').toLowerCase()
        return tokens.includes(username) || tokens.includes(compactName)
      })
      .map(member => member._id)
  }

  const insertMention = member => {
    const handle = member.username || member.name?.replace(/\s+/g, '') || 'member'
    setMessage(prev => prev.replace(/(^|\s)@([\w.-]*)$/, `$1@${handle} `))
  }

  const sendMessage = async e => {
    e.preventDefault()
    if (!message.trim()) return
    try {
      const res = await api.post('/comments', { task: id, body: message, mentions: getMentionIds() })
      setComments(prev => [...prev, res.data.comment])
      setMessage('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send')
    }
  }

  const updateStatus = async status => {
    try {
      const res = await api.put(`/tasks/${id}`, { status })
      setTask(prev => ({ ...prev, ...res.data.task, status }))
      toast.success('Task updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const updateProject = async projectId => {
    try {
      const res = await api.put(`/tasks/${id}`, { project: projectId || null })
      setTask(prev => ({ ...prev, ...res.data.task }))
      toast.success(projectId ? 'Task moved to project' : 'Task moved to standalone')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move task')
    }
  }

  const addSubtask = async e => {
    e.preventDefault()
    if (!subtaskTitle.trim()) return
    try {
      const res = await api.post(`/tasks/${id}/subtasks`, { title: subtaskTitle })
      setTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), res.data.subtask] }))
      setSubtaskTitle('')
      toast.success('Subtask added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subtask')
    }
  }

  const toggleSubtask = async subtask => {
    try {
      const nextValue = !subtask.isCompleted
      await api.put(`/tasks/${id}/subtasks/${subtask._id}`, { isCompleted: nextValue })
      setTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s => s._id === subtask._id ? { ...s, isCompleted: nextValue } : s),
      }))
    } catch {
      toast.error('Failed to update subtask')
    }
  }

  const uploadFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const res = await api.post(`/tasks/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFiles(prev => [res.data.file, ...prev])
      toast.success('File submitted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const addAssignee = async e => {
    e.preventDefault()
    if (!assigneeToAdd) return
    try {
      const res = await api.post(`/tasks/${id}/assignees`, { userId: assigneeToAdd })
      setTask(prev => ({ ...prev, ...res.data.task }))
      setAssigneeToAdd('')
      toast.success('Assignee added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add assignee')
    }
  }

  const removeAssignee = async userId => {
    try {
      await api.delete(`/tasks/${id}/assignees/${userId}`)
      setTask(prev => ({ ...prev, assignedTo: (prev.assignedTo || []).filter(member => member._id !== userId) }))
      toast.success('Assignee removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove assignee')
    }
  }

  const deleteTask = async () => {
    setDeleting(true)
    try {
      await api.delete(`/tasks/${id}`)
      toast.success('Task deleted')
      navigate('/tasks')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader />
  if (!task) return <EmptyState icon={CheckCircle2} title="Task not found" description="This task is unavailable or you do not have access." />

  const subtasks = task.subtasks || []
  const doneSubtasks = subtasks.filter(s => s.isCompleted).length
  const completion = subtasks.length ? Math.round((doneSubtasks / subtasks.length) * 100) : 0
  const dueIsPast = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done'
  const canCompleteTasks = can(user, 'assignTasks')
  const canAssignTasks = can(user, 'assignTasks')
  const canDeleteTasks = can(user, 'deleteTasks')
  const availableAssignees = users.filter(member => !(task.assignedTo || []).some(existing => existing._id === member._id))
  const projectMembers = getProjectMembers()
  const mentionQuery = getMentionQuery()
  const mentionSuggestions = mentionQuery === null
    ? []
    : projectMembers.filter(member => {
      const name = member.name?.toLowerCase() || ''
      const username = member.username?.toLowerCase() || ''
      return name.includes(mentionQuery) || username.includes(mentionQuery)
    }).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => navigate('/tasks')} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#2F85C8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <ArrowLeft size={15} /> Tasks
      </button>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 9 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#101828', lineHeight: 1.25 }}>{task.title}</h1>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <p style={{ margin: 0, color: '#475467', fontSize: 14, lineHeight: 1.55, maxWidth: 880 }}>
              {task.description || 'No description added yet.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <select value={task.status} onChange={e => updateStatus(e.target.value)} style={{ border: '1.5px solid #DBEAFE', background: '#fff', color: '#101828', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              {canCompleteTasks && <option value="done">Done</option>}
            </select>
            {canDeleteTasks && (
              <button onClick={() => setConfirmDeleteOpen(true)} title="Delete task" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #FEE2E2', background: '#FFF1F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 12, marginTop: 20 }}>
          <Summary icon={Calendar} label="Due date" value={task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'} danger={dueIsPast} />
          <Summary icon={CheckCircle2} label="Subtasks" value={`${doneSubtasks}/${subtasks.length} complete`} />
          <Summary icon={Paperclip} label="Submitted files" value={`${files.length} files`} />
          <Summary icon={Clock} label="Hours" value={`${task.loggedHours || 0}${task.estimatedHours ? ` / ${task.estimatedHours}` : ''}`} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>Subtasks</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#98A2B3' }}>{completion}% checklist progress</p>
              </div>
              <div style={{ width: 120, height: 6, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${completion}%`, height: '100%', background: '#12B76A' }} />
              </div>
            </div>

            <form onSubmit={addSubtask} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)} placeholder="Add a subtask..." style={{ flex: 1, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <button className="btn-primary" type="submit" style={{ padding: '9px 13px' }}><Plus size={14} /> Add</button>
            </form>

            {subtasks.length === 0 ? (
              <div style={{ border: '1px dashed #BAD6F4', borderRadius: 10, padding: 22, textAlign: 'center', color: '#98A2B3', fontSize: 13 }}>No subtasks yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subtasks.map(subtask => (
                  <button key={subtask._id} onClick={() => toggleSubtask(subtask)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 12px', borderRadius: 9, border: '1px solid #EEF2F7', background: subtask.isCompleted ? '#F6FEF9' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <CheckCircle2 size={17} style={{ color: subtask.isCompleted ? '#12B76A' : '#D0D5DD', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: subtask.isCompleted ? '#667085' : '#101828', textDecoration: subtask.isCompleted ? 'line-through' : 'none' }}>{subtask.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>Employee File Submission</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#98A2B3' }}>Upload proof, drafts, screenshots, or deliverables for this task.</p>
              </div>
              <label className="btn-primary" style={{ padding: '9px 13px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.65 : 1 }}>
                <Upload size={14} /> {uploading ? 'Uploading...' : 'Submit file'}
                <input type="file" onChange={uploadFile} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>

            {files.length === 0 ? (
              <div style={{ border: '1px dashed #BAD6F4', borderRadius: 10, padding: 22, textAlign: 'center', color: '#98A2B3', fontSize: 13 }}>No files submitted yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {files.map(file => (
                  <a key={file._id} href={file.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, padding: 12, border: '1px solid #EEF2F7', borderRadius: 10, color: 'inherit', textDecoration: 'none', background: '#fff' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={17} /></div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.originalName || file.fileName}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#98A2B3' }}>{file.uploadedBy?.name || 'Uploaded'} • {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</p>
                    </div>
                  </a>
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
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>Task Chat</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#98A2B3' }}>{task.project?._id ? 'Mention project members with @' : 'Messages for this task'}</p>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>{comments.length}</span>
            </div>

            <div style={{ height: 310, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 2px 12px' }}>
              {comments.length === 0 ? (
                <div style={{ border: '1px dashed #BAD6F4', borderRadius: 10, padding: 24, color: '#98A2B3', textAlign: 'center', fontSize: 13 }}>No task messages yet</div>
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

            <form onSubmit={sendMessage} style={{ position: 'relative', display: 'flex', gap: 8, borderTop: '1px solid #F2F4F7', paddingTop: 12 }}>
              {mentionSuggestions.length > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 48, bottom: 50, background: '#fff', border: '1px solid #DBEAFE', borderRadius: 10, boxShadow: '0 12px 28px rgba(16, 24, 40, 0.12)', padding: 6, zIndex: 2 }}>
                  {mentionSuggestions.map(member => (
                    <button key={member._id} type="button" onClick={() => insertMention(member)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', border: 'none', borderRadius: 8, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <Avatar name={member.name} avatar={member.avatar} size={26} />
                      <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder={task.project?._id ? 'Message or @mention a project member...' : 'Message this task...'} style={{ flex: 1, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <button type="submit" className="btn-primary" style={{ padding: '9px 12px' }}><Send size={14} /></button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#101828' }}>People</h2>
            <Detail icon={UserCircle} label="Created by" value={task.createdBy?.name || 'Unknown'} />
            <div style={{ paddingTop: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#98A2B3', fontWeight: 700 }}>Assignees</p>
              {task.assignedTo?.length ? <AvatarGroup users={task.assignedTo} size={32} max={6} /> : <p style={{ margin: 0, color: '#98A2B3', fontSize: 13 }}>No assignees</p>}
            </div>
            {canAssignTasks && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EEF2F7' }}>
                <form onSubmit={addAssignee} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <select value={assigneeToAdd} onChange={e => setAssigneeToAdd(e.target.value)} style={{ flex: 1, minWidth: 0, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, color: '#344054', outline: 'none', background: '#fff' }}>
                    <option value="">Add assignee...</option>
                    {availableAssignees.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 10px' }}><Plus size={14} /></button>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(task.assignedTo || []).map(member => (
                    <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderTop: '1px solid #F2F4F7' }}>
                      <Avatar name={member.name} avatar={member.avatar} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#98A2B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.designation || 'Assignee'}</p>
                      </div>
                      <button onClick={() => removeAssignee(member._id)} title="Remove assignee" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #FEE2E2', background: '#fff', color: '#F04438', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16, border: '1px solid #DBEAFE', background: '#F8FAFF' }}>
            <button onClick={() => task.project?._id && navigate(`/projects/${task.project._id}`)} style={{ width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: task.project?._id ? 'pointer' : 'default', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#2F85C8', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>
                <FolderKanban size={15} /> Project
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#101828', fontWeight: 700 }}>{task.project?.title || 'Standalone task'}</p>
            </button>
            {canAssignTasks && (
              <select value={task.project?._id || ''} onChange={e => updateProject(e.target.value)} style={{ width: '100%', marginTop: 12, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, color: '#344054', outline: 'none', background: '#fff' }}>
                <option value="">Standalone task</option>
                {projects.map(project => <option key={project._id} value={project._id}>{project.title}</option>)}
              </select>
            )}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#101828' }}>Current User</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={user?.name} avatar={user?.avatar} size={36} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828' }}>{user?.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#98A2B3' }}>Submitting as task member</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={deleteTask}
        title="Delete Task"
        message={`Delete "${task.title}"?`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

function Summary({ icon: Icon, label, value, danger = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: danger ? '#FEF3F2' : '#F8FAFC', border: `1px solid ${danger ? '#FECDCA' : '#EEF2F7'}`, borderRadius: 10 }}>
      <Icon size={16} style={{ color: danger ? '#F04438' : '#2F85C8', flexShrink: 0 }} />
      <div>
        <p style={{ margin: 0, fontSize: 11.5, color: '#98A2B3', fontWeight: 700 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: danger ? '#B42318' : '#101828', fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F2F4F7' }}>
      <Icon size={15} style={{ color: '#98A2B3', flexShrink: 0 }} />
      <div>
        <p style={{ margin: 0, fontSize: 11.5, color: '#98A2B3', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#101828', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  )
}
