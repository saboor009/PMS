import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Calendar, CheckSquare, Download, Edit3, FileText, FolderKanban, MessageSquare, Paperclip, Plus, Send, Trash2, UserCheck, Users, X } from 'lucide-react'
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
  const [chatFile, setChatFile] = useState(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingMessage, setEditingMessage] = useState('')
  const [downloadingAttachment, setDownloadingAttachment] = useState(null)
  const [editingProjectDetails, setEditingProjectDetails] = useState(false)
  const [projectDraft, setProjectDraft] = useState({ title: '', description: '' })
  const [savingProjectDetails, setSavingProjectDetails] = useState(false)
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
  const progress = project.status === 'completed' ? 100 : (tasks.length ? Math.round((completed / tasks.length) * 100) : project.progress || 0)
  const isProjectManager = project.owner?._id === user?._id
  const canManageProjects = can(user, 'manageProjects')
  const canManageThisProject = canManageProjects || isProjectManager
  const canDeleteProjects = can(user, 'deleteProjects')
  const canCreateTasks = can(user, 'createTasks')
  const canAssignProjectManager = hasRoleAtLeast(user, 'manager')
  const availableMembers = users.filter(member => !(project.members || []).some(existing => existing._id === member._id))

  const getMentionQuery = () => {
    const match = message.match(/(^|\s)@([\w.-]*)$/)
    return match ? match[2].toLowerCase() : null
  }

  const getMentionIds = () => {
    const tokens = [...message.matchAll(/@([\w.-]+)/g)].map(match => match[1].toLowerCase())
    return (project.members || [])
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
    if (!message.trim() && !chatFile) return
    setSendingMessage(true)
    try {
      const formData = new FormData()
      formData.append('project', id)
      formData.append('body', message)
      formData.append('mentions', JSON.stringify(getMentionIds()))
      if (chatFile) formData.append('file', chatFile)
      const res = await api.post('/comments', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setComments(prev => [...prev, res.data.comment])
      setMessage('')
      setChatFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send')
    } finally {
      setSendingMessage(false)
    }
  }

  const startEditComment = comment => {
    setEditingCommentId(comment._id)
    setEditingMessage(comment.body || '')
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingMessage('')
  }

  const saveEditedComment = async comment => {
    if (!editingMessage.trim() && !comment.attachments?.length) return toast.error('Message cannot be empty')
    try {
      const res = await api.put(`/comments/${comment._id}`, { body: editingMessage })
      setComments(prev => prev.map(item => item._id === comment._id ? { ...item, ...res.data.comment, author: item.author, attachments: item.attachments } : item))
      cancelEditComment()
      toast.success('Message updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update message')
    }
  }

  const downloadCommentAttachment = async (comment, attachment) => {
    setDownloadingAttachment(attachment._id)
    try {
      const res = await api.get(`/comments/${comment._id}/attachments/${attachment._id}/download`, { responseType: 'blob' })
      const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: attachment.mimeType || 'application/octet-stream' }))
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = attachment.originalName || attachment.fileName || 'message-file'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(fileUrl)
      toast.success('Download started')
    } catch (err) {
      toast.error(await getDownloadErrorMessage(err))
    } finally {
      setDownloadingAttachment(null)
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

  const startEditProjectDetails = () => {
    setProjectDraft({ title: project.title || '', description: project.description || '' })
    setEditingProjectDetails(true)
  }

  const cancelEditProjectDetails = () => {
    setEditingProjectDetails(false)
    setProjectDraft({ title: '', description: '' })
  }

  const saveProjectDetails = async e => {
    e.preventDefault()
    if (!projectDraft.title.trim()) return toast.error('Project name is required')
    setSavingProjectDetails(true)
    try {
      const res = await api.put(`/projects/${id}`, {
        title: projectDraft.title.trim(),
        description: projectDraft.description.trim(),
      })
      setProject(prev => ({ ...prev, ...res.data.project }))
      setEditingProjectDetails(false)
      toast.success('Project updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project')
    } finally {
      setSavingProjectDetails(false)
    }
  }

  const completeProject = async () => {
    try {
      const res = await api.put(`/projects/${id}`, { status: 'completed', progress: 100 })
      setProject(prev => ({ ...prev, ...res.data.project }))
      toast.success('Project marked completed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete project')
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

  const mentionQuery = getMentionQuery()
  const mentionSuggestions = mentionQuery === null
    ? []
    : (project.members || []).filter(member => {
      const name = member.name?.toLowerCase() || ''
      const username = member.username?.toLowerCase() || ''
      return name.includes(mentionQuery) || username.includes(mentionQuery)
    }).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={() => navigate('/projects')} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#2F85C8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <ArrowLeft size={15} /> Projects
      </button>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 8, background: project.coverColor || '#2F85C8' }} />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div>
            {editingProjectDetails ? (
              <form onSubmit={saveProjectDetails} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <input value={projectDraft.title} onChange={e => setProjectDraft(prev => ({ ...prev, title: e.target.value }))} style={{ border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 18, fontWeight: 800, color: '#101828', fontFamily: 'inherit', outline: 'none' }} />
                <textarea value={projectDraft.description} onChange={e => setProjectDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Add description..." rows={3} style={{ border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 14, color: '#475467', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn-primary" disabled={savingProjectDetails} style={{ padding: '8px 12px' }}>{savingProjectDetails ? 'Saving...' : 'Save'}</button>
                  <button type="button" onClick={cancelEditProjectDetails} className="btn-secondary" disabled={savingProjectDetails} style={{ padding: '8px 12px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#101828' }}>{project.title}</h1>
                    <StatusBadge status={project.status} />
                    <PriorityBadge priority={project.priority} />
                    {canManageThisProject && (
                      <button type="button" onClick={startEditProjectDetails} title="Edit project" style={{ width: 32, height: 32, border: '1px solid #DBEAFE', borderRadius: 8, background: '#fff', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Edit3 size={15} />
                      </button>
                    )}
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
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Metric icon={CheckSquare} label="Tasks" value={`${completed}/${tasks.length} done`} />
            <Metric icon={Users} label="Members" value={`${project.members?.length || 0} members`} />
            <Metric icon={UserCheck} label="Project Manager" value={project.owner?.name || 'Unassigned'} />
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
              const isEditing = editingCommentId === comment._id
              return (
                <div key={comment._id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }}>
                  <Avatar name={comment.author?.name} avatar={comment.author?.avatar} size={30} />
                  <div style={{ maxWidth: '78%', background: mine ? '#EFF6FF' : '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#101828' }}>{comment.author?.name || 'User'}</span>
                      <span style={{ fontSize: 10.5, color: '#98A2B3' }}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {comment.isEdited && <span style={{ fontSize: 10.5, color: '#98A2B3' }}>edited</span>}
                      {mine && !isEditing && (
                        <button type="button" onClick={() => startEditComment(comment)} title="Edit message" style={{ width: 22, height: 22, border: 'none', borderRadius: 7, background: 'transparent', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <textarea value={editingMessage} onChange={e => setEditingMessage(e.target.value)} rows={3} style={{ width: 260, maxWidth: '100%', border: '1.5px solid #DBEAFE', borderRadius: 8, padding: '8px 9px', fontSize: 13, fontFamily: 'inherit', color: '#344054', outline: 'none', resize: 'vertical' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button type="button" onClick={cancelEditComment} style={{ border: '1px solid #D0D5DD', background: '#fff', color: '#475467', borderRadius: 7, padding: '5px 8px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                          <button type="button" onClick={() => saveEditedComment(comment)} style={{ border: 'none', background: '#2F85C8', color: '#fff', borderRadius: 7, padding: '5px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      comment.body && <p style={{ margin: 0, fontSize: 13, color: '#344054', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{comment.body}</p>
                    )}
                    {comment.attachments?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: comment.body ? 8 : 0 }}>
                        {comment.attachments.map(attachment => (
                          <button key={attachment._id} type="button" onClick={() => downloadCommentAttachment(comment, attachment)} disabled={downloadingAttachment === attachment._id} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: '1px solid #BFDBFE', background: '#fff', color: '#101828', borderRadius: 8, padding: '7px 8px', cursor: downloadingAttachment === attachment._id ? 'wait' : 'pointer', textAlign: 'left', opacity: downloadingAttachment === attachment._id ? 0.7 : 1 }}>
                            <FileText size={14} style={{ color: '#2F85C8', flexShrink: 0 }} />
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700 }}>{attachment.originalName || attachment.fileName}</span>
                            <Download size={13} style={{ color: '#F97316', flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={sendMessage} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #F2F4F7', paddingTop: 12 }}>
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
            {chatFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #99F6E4', background: '#F0FDFA', color: '#0F766E', borderRadius: 8, padding: '7px 9px' }}>
                <Paperclip size={13} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700 }}>{chatFile.name}</span>
                <button type="button" onClick={() => setChatFile(null)} title="Remove file" style={{ width: 22, height: 22, border: 'none', borderRadius: 7, background: '#CCFBF1', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message or @mention the project team..." style={{ flex: 1, minWidth: 0, border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <label title="Attach file" style={{ width: 38, height: 38, borderRadius: 9, border: '1.5px solid #DBEAFE', background: '#fff', color: '#2F85C8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sendingMessage ? 'not-allowed' : 'pointer', opacity: sendingMessage ? 0.6 : 1, flexShrink: 0 }}>
                <Paperclip size={15} />
                <input type="file" onChange={e => { setChatFile(e.target.files?.[0] || null); e.target.value = '' }} disabled={sendingMessage} style={{ display: 'none' }} />
              </label>
              <button type="submit" className="btn-primary" disabled={sendingMessage || (!message.trim() && !chatFile)} style={{ padding: '9px 12px' }}><Send size={14} /></button>
            </div>
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
          {canManageThisProject && project.status !== 'completed' && (
            <button onClick={completeProject} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}>
              <CheckSquare size={14} /> Mark Completed
            </button>
          )}
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#667085', fontWeight: 700 }}>Team</p>
          <AvatarGroup users={project.members || []} size={30} max={6} />
          {project.owner && <p style={{ margin: '14px 0 0', fontSize: 12.5, color: '#667085' }}>Project Manager: <strong style={{ color: '#101828' }}>{project.owner.name}</strong>{isProjectManager && <span style={{ marginLeft: 6, color: '#2F85C8', fontWeight: 800 }}>(you)</span>}</p>}
          {canAssignProjectManager && (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11.5, color: '#98A2B3', fontWeight: 700 }}>Project Manager</label>
              <select value={project.owner?._id || ''} onChange={e => changeProjectManager(e.target.value)} style={{ width: '100%', border: '1.5px solid #DBEAFE', borderRadius: 9, padding: '8px 10px', fontSize: 12.5, color: '#344054', outline: 'none', background: '#fff' }}>
                {(project.members || []).map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
              </select>
            </div>
          )}
          {canManageThisProject && (
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
          canAssignOverride={canManageThisProject}
          assignableUsers={project.members || []}
          onClose={() => setCreateTaskOpen(false)}
          onCreated={() => { setCreateTaskOpen(false); fetchProjectData() }}
        />
      )}
    </div>
  )
}

async function getDownloadErrorMessage(err) {
  const data = err.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text)
      return parsed.message || 'Download failed'
    } catch {
      return 'Download failed'
    }
  }
  return data?.message || 'Download failed'
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
