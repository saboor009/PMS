import { useState, useEffect } from 'react'
import { Plus, Search, List, LayoutGrid, Clock, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/accessControl'
import { AvatarGroup } from '../components/ui/Avatar'
import { PriorityBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'

const TABS=[{key:'all',label:'All'},{key:'todo',label:'To Do'},{key:'in_progress',label:'In Progress'},{key:'review',label:'In Review'},{key:'done',label:'Done'}]
const COLS=[{key:'todo',label:'To Do',color:'#6B7280',bg:'#F8FAFC'},{key:'in_progress',label:'In Progress',color:'#2F85C8',bg:'#EFF6FF'},{key:'review',label:'In Review',color:'#D97706',bg:'#FFFBEB'},{key:'done',label:'Done',color:'#16A34A',bg:'#F0FDF4'}]

export default function Tasks() {
  const [tasks,setTasks]=useState([])
  const [loading,setLoading]=useState(true)
  const [view,setView]=useState('list')
  const [tab,setTab]=useState('all')
  const [search,setSearch]=useState('')
  const [showCreate,setShowCreate]=useState(false)
  const {user}=useAuth()
  const navigate=useNavigate()
  const canCreateTasks=can(user,'createTasks')
  const canCompleteTasks=can(user,'assignTasks')
  const load=()=>{setLoading(true);const p=new URLSearchParams();if(tab!=='all')p.set('status',tab);if(search)p.set('search',search);api.get('/tasks?'+p).then(r=>setTasks(r.data.tasks||[])).catch(console.error).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[tab,search])
  const changeStatus=async(id,status)=>{try{await api.put('/tasks/'+id,{status});setTasks(p=>p.map(t=>t._id===id?{...t,status}:t));toast.success('Updated')}catch(err){toast.error(err.response?.data?.message||'Failed')}}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{position:'relative',minWidth:200,flex:1,maxWidth:320}}>
          <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..." style={{width:'100%',padding:'9px 12px 9px 33px',borderRadius:10,border:'1.5px solid #DBEAFE',fontSize:13,outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',background:'#fff',borderRadius:10,border:'1.5px solid #DBEAFE',overflow:'hidden'}}>
          {[{v:'list',label:'List'},{v:'board',label:'Board'}].map(({v,label})=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:'7px 14px',border:'none',cursor:'pointer',background:view===v?'#EFF6FF':'transparent',color:view===v?'#2F85C8':'#6B7280',fontSize:12.5,fontWeight:600}}>{label}</button>
          ))}
        </div>
        {canCreateTasks&&<button onClick={()=>setShowCreate(true)} className="btn-primary"><Plus size={15}/> New Task</button>}
      </div>
      <div style={{display:'flex',gap:4,background:'#fff',borderRadius:12,padding:4,border:'1.5px solid #DBEAFE',width:'fit-content'}}>
        {TABS.map(s=>{const cnt=s.key==='all'?tasks.length:tasks.filter(t=>t.status===s.key).length;return(<button key={s.key} onClick={()=>setTab(s.key)} style={{padding:'6px 14px',borderRadius:9,border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,background:tab===s.key?'#0F1E3D':'transparent',color:tab===s.key?'#fff':'#6B7280',display:'flex',alignItems:'center',gap:5}}>{s.label}<span style={{fontSize:11,fontWeight:700,background:tab===s.key?'rgba(255,255,255,0.2)':'#EFF6FF',color:tab===s.key?'#fff':'#2F85C8',borderRadius:99,padding:'0 6px'}}>{cnt}</span></button>)})}
      </div>
      {loading?<PageLoader/>:tasks.length===0?<EmptyState icon={CheckSquare} title="No tasks" description="Create your first task" action={canCreateTasks&&<button onClick={()=>setShowCreate(true)} className="btn-primary"><Plus size={14}/> New Task</button>}/>:
        view==='list'?(
          <div className="card" style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F8FAFC'}}>{['Task','Project','Priority','Status','Due Date','Assignees'].map(h=><th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11.5,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #EFF6FF'}}>{h}</th>)}</tr></thead>
              <tbody>{tasks.map((t,i)=>(<tr key={t._id} onClick={()=>navigate(`/tasks/${t._id}`)} style={{borderBottom:i<tasks.length-1?'1px solid #F0F6FF':'none',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFCFF'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><td style={{padding:'12px 16px',maxWidth:220}}><p style={{margin:0,fontSize:13,fontWeight:600,color:'#0F1E3D',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p></td><td style={{padding:'12px 16px'}}><span style={{fontSize:12,color:'#6B7280'}}>{t.project?.title||'—'}</span></td><td style={{padding:'12px 16px'}}><PriorityBadge priority={t.priority}/></td><td style={{padding:'12px 16px'}}><select value={t.status} onClick={e=>e.stopPropagation()} onChange={e=>changeStatus(t._id,e.target.value)} style={{border:'none',background:'transparent',fontSize:12,fontWeight:600,cursor:'pointer',color:'#374151',outline:'none'}}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">In Review</option>{canCompleteTasks&&<option value="done">Done</option>}</select></td><td style={{padding:'12px 16px'}}>{t.dueDate?<span style={{fontSize:12,color:isPast(new Date(t.dueDate))&&t.status!=='done'?'#EF4444':'#6B7280',display:'flex',alignItems:'center',gap:4}}><Clock size={11}/>{format(new Date(t.dueDate),'MMM d')}</span>:<span style={{color:'#D1D5DB',fontSize:12}}>—</span>}</td><td style={{padding:'12px 16px'}}><AvatarGroup users={t.assignedTo||[]} size={24} max={3}/></td></tr>))}</tbody>
            </table>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {COLS.map(({key,label,color,bg})=>{const col=tasks.filter(t=>t.status===key);return(<div key={key} style={{background:bg,borderRadius:14,padding:12,minHeight:200}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:'50%',background:color}}/><span style={{fontSize:11.5,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</span></div><span style={{fontSize:11,fontWeight:700,color,background:color+'18',borderRadius:99,padding:'1px 7px'}}>{col.length}</span></div><div style={{display:'flex',flexDirection:'column',gap:8}}>{col.map(t=>(<div key={t._id} onClick={()=>navigate(`/tasks/${t._id}`)} style={{background:'#fff',borderRadius:10,padding:'10px 11px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.04)',cursor:'pointer'}}><p style={{margin:0,fontSize:12.5,fontWeight:600,color:'#0F1E3D',lineHeight:1.3}}>{t.title}</p>{t.project&&<p style={{margin:'3px 0 0',fontSize:10.5,color:'#9CA3AF'}}>{t.project.title}</p>}<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}><PriorityBadge priority={t.priority}/>{t.dueDate&&<span style={{fontSize:10.5,color:isPast(new Date(t.dueDate))?'#EF4444':'#9CA3AF'}}>{format(new Date(t.dueDate),'MMM d')}</span>}</div>{t.assignedTo?.length>0&&<div style={{marginTop:7}}><AvatarGroup users={t.assignedTo} size={20} max={3}/></div>}</div>))}</div></div>)})}
          </div>
        )
      }
      {showCreate&&<CreateTaskModal onClose={()=>setShowCreate(false)} onCreated={()=>{setShowCreate(false);load()}}/>}
    </div>
  )
}

function CreateTaskModal({onClose,onCreated}){
  const[form,setForm]=useState({title:'',description:'',priority:'medium',dueDate:''})
  const[projects,setProjects]=useState([])
  const[project,setProject]=useState('')
  const[loading,setLoading]=useState(false)
  const set=f=>e=>setForm(p=>({...p,[f]:e.target.value}))
  useEffect(()=>{api.get('/projects').then(r=>setProjects(r.data.projects||[])).catch(()=>{})},[])
  const submit=async e=>{e.preventDefault();if(!form.title.trim())return toast.error('Title required');setLoading(true);try{await api.post('/tasks',{...form,project:project||null});toast.success('Task created!');onCreated()}catch(err){toast.error(err.response?.data?.message||'Failed')}finally{setLoading(false)}}
  return(<Modal open onClose={onClose} title="New Task" width={480}><form onSubmit={submit} style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:14}}><Input label="Title *" value={form.title} onChange={set('title')} placeholder="e.g. Design login page"/><div style={{display:'flex',flexDirection:'column',gap:5}}><label style={{fontSize:13,fontWeight:600,color:'#1A4A8A'}}>Description</label><textarea value={form.description} onChange={set('description')} placeholder="Details..." rows={3} style={{padding:'9px 12px',borderRadius:10,border:'1.5px solid #DBEAFE',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical'}}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Select label="Priority" value={form.priority} onChange={set('priority')}>{['low','medium','high','critical'].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}</Select><Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')}/></div><Select label="Project (optional)" value={project} onChange={e=>setProject(e.target.value)}><option value="">Standalone task</option>{projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}</Select><div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button type="button" onClick={onClose} style={{padding:'9px 20px',borderRadius:10,border:'1.5px solid #DBEAFE',background:'#fff',color:'#1A4A8A',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button><button type="submit" disabled={loading} className="btn-primary">{loading?'Creating...':'Create Task'}</button></div></form></Modal>)
}
