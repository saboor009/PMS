import { useState, useEffect } from 'react'
import { Search, Users } from 'lucide-react'
import api from '../services/api'
import Avatar from '../components/ui/Avatar'
import { PageLoader } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

export default function EmployeeSummary() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/users?includeStats=true')
      .then(r => setEmployees(r.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const isReadyForNewWork = e => (e.openTasks || 0) <= 2 && (e.overdueTasks || 0) === 0

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all'
      || (filter === 'ready' && isReadyForNewWork(e))
      || (filter === 'assigned' && (e.openTasks || 0) > 0)
      || (filter === 'due' && ((e.tasksDueSoon || 0) > 0 || (e.overdueTasks || 0) > 0))
    return matchSearch && matchFilter
  })

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{position:'relative',minWidth:220,flex:1,maxWidth:320}}>
          <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees..." style={{width:'100%',padding:'9px 12px 9px 33px',borderRadius:10,border:'1.5px solid #DBEAFE',fontSize:13,outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[
            { key:'all', label:'All' },
            { key:'ready', label:'Ready for Work' },
            { key:'assigned', label:'Assigned' },
            { key:'due', label:'Due Soon' },
          ].map(f=><button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',background:filter===f.key?'#0F1E3D':'#fff',color:filter===f.key?'#fff':'#6B7280',boxShadow:filter===f.key?'none':'0 1px 3px rgba(0,0,0,0.08)'}}>{f.label}</button>)}
        </div>
      </div>

      {loading?<PageLoader/>:filtered.length===0?<EmptyState icon={Users} title="No employees found"/>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {filtered.map(e=>(
              <div key={e._id} className="card" style={{padding:'18px 20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <Avatar name={e.name} avatar={e.avatar} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:13.5,fontWeight:700,color:'#0F1E3D',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.name}</p>
                    <p style={{margin:'2px 0 0',fontSize:12,color:'#6B7280'}}>{e.designation||e.role}</p>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[{label:'Open Tasks',value:e.openTasks||0,color:'#2F85C8'},{label:'Active Projects',value:e.activeProjects||0,color:'#8B5CF6'},{label:'Due Soon',value:e.tasksDueSoon||0,color:'#D97706'},{label:'Overdue',value:e.overdueTasks||0,color:'#EF4444'}].map(s=>(
                    <div key={s.label} style={{background:'#F8FAFC',borderRadius:9,padding:'10px 12px'}}>
                      <p style={{margin:0,fontSize:11,color:'#6B7280',fontWeight:500}}>{s.label}</p>
                      <p style={{margin:'2px 0 0',fontSize:20,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {isReadyForNewWork(e)&&<p style={{margin:'12px 0 0',fontSize:12,color:'#16A34A',fontWeight:600}}>Ready for new work</p>}
              </div>
          ))}
        </div>
      )}
    </div>
  )
}
