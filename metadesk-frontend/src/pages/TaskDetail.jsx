import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, FolderKanban, Paperclip, Plus, Trash2, Upload, UserCircle, X } from 'lucide-react'
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
  const [users, setUsers] = useState([])
  const [assigneeToAdd, setAssigneeToAdd] = useState('')
  const [loading, setLoading] = useState(true)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/tasks/${id}`), api.get('/users')])
      .then(([taskRes, usersRes]) => {
        setTask(taskRes.data.task)
        setFiles(taskRes.data.files || [])
        setUsers(usersRes.data.users || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async status => {
    try {
      const res = await api.put(`/tasks/${id}`, { status })
      setTask(prev => ({ ...prev, ...res.data.task, status }))
      toast.success('Task updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
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

          {task.project && (
            <button onClick={() => navigate(`/projects/${task.project._id}`)} className="card" style={{ padding: 16, border: '1px solid #DBEAFE', background: '#F8FAFF', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#2F85C8', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>
                <FolderKanban size={15} /> Project
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#101828', fontWeight: 700 }}>{task.project.title}</p>
            </button>
          )}

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
