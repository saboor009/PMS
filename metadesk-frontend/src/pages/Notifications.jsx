import { useState, useEffect } from 'react'
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  Clock,
  FolderKanban,
  MessageSquare,
  Paperclip,
  Reply,
  Send,
  UserPlus,
  Workflow,
} from 'lucide-react'
import api from '../services/api'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const TYPE_STYLES = {
  task_assigned: { icon: CalendarCheck, bg: '#EEF6FF', color: '#2563EB' },
  task_status_changed: { icon: Workflow, bg: '#EEF6FF', color: '#2F85C8' },
  task_completed: { icon: CheckCircle2, bg: '#ECFDF5', color: '#059669' },
  project_update: { icon: FolderKanban, bg: '#F5F3FF', color: '#7C3AED' },
  comment_added: { icon: MessageSquare, bg: '#EEF6FF', color: '#2563EB' },
  comment_reply: { icon: Reply, bg: '#F5F3FF', color: '#7C3AED' },
  comment_mention: { icon: MessageSquare, bg: '#ECFEFF', color: '#0891B2' },
  file_uploaded: { icon: Paperclip, bg: '#FFF7ED', color: '#EA580C' },
  direct_message: { icon: Send, bg: '#ECFEFF', color: '#0891B2' },
  account_request: { icon: UserPlus, bg: '#F0FDF4', color: '#16A34A' },
  task_deadline: { icon: Clock, bg: '#FEF2F2', color: '#DC2626' },
  project_assigned: { icon: FolderKanban, bg: '#F5F3FF', color: '#7C3AED' },
}

function NotificationIcon({ type }) {
  const style = TYPE_STYLES[type] || { icon: Bell, bg: '#EFF6FF', color: '#2F85C8' }
  const Icon = style.icon

  return (
    <div style={{width:40,height:40,borderRadius:12,background:style.bg,display:'flex',alignItems:'center',justifyContent:'center',color:style.color,flexShrink:0}}>
      <Icon size={18} strokeWidth={2.2} />
    </div>
  )
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { api.get('/notifications').then(r=>setNotifs(r.data.notifications||[])).catch(console.error).finally(()=>setLoading(false)) }, [])

  const markRead = async id => {
    try { await api.put('/notifications/'+id+'/read'); setNotifs(p=>p.map(n=>n._id===id?{...n,isRead:true}:n)) }
    catch { toast.error('Failed') }
  }

  const markAll = async () => {
    try { await api.put('/notifications/mark-all-read'); setNotifs(p=>p.map(n=>({...n,isRead:true}))); toast.success('All marked as read') }
    catch { toast.error('Failed') }
  }

  const targetFor = notification => {
    if (notification.link) return notification.link
    if (notification.type === 'direct_message') return '/messages'
    if (notification.type === 'account_request') return '/team?tab=requests'
    if (notification.type?.startsWith('project')) return '/projects'
    if (notification.type?.startsWith('task')) return '/tasks'
    return null
  }

  const openNotification = async notification => {
    if (!notification.isRead) await markRead(notification._id)
    const target = targetFor(notification)
    if (target) navigate(target)
  }

  const unread = notifs.filter(n=>!n.isRead).length

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:'#0F1E3D'}}>Notifications</h2>
          {unread>0&&<span style={{background:'#EF4444',color:'#fff',fontSize:11,fontWeight:700,borderRadius:99,padding:'2px 8px'}}>{unread} new</span>}
        </div>
        {unread>0&&<button onClick={markAll} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:'1.5px solid #DBEAFE',background:'#fff',color:'#1A4A8A',fontSize:12.5,fontWeight:600,cursor:'pointer'}}><CheckCheck size={14}/>Mark all read</button>}
      </div>

      {loading?<PageLoader/>:notifs.length===0?<EmptyState icon={Bell} title="No notifications" description="You're all caught up!"/>:(
        <div className="card" style={{overflow:'hidden'}}>
          {notifs.map((n,i)=>(
            <div key={n._id} onClick={()=>openNotification(n)} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 20px',background:n.isRead?'#fff':'#F0F6FF',borderBottom:i<notifs.length-1?'1px solid #F5F9FF':'none',cursor:targetFor(n)?'pointer':'default',transition:'background 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=n.isRead?'#FAFCFF':'#EAF2FF'}} onMouseLeave={e=>{e.currentTarget.style.background=n.isRead?'#fff':'#F0F6FF'}}>
              <NotificationIcon type={n.type} />
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13.5,fontWeight:n.isRead?400:600,color:'#0F1E3D',lineHeight:1.4}}>{n.message}</p>
                <p style={{margin:'4px 0 0',fontSize:11.5,color:'#9CA3AF'}}>{formatDistanceToNow(new Date(n.createdAt),{addSuffix:true})}</p>
              </div>
              {!n.isRead&&<div style={{width:8,height:8,borderRadius:'50%',background:'#2F85C8',flexShrink:0,marginTop:6}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
