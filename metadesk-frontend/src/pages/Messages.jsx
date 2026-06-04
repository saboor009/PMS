import { useState, useEffect, useRef } from 'react'
import { Search, Send, MessageSquare, Smile } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import { PageLoader } from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { format, isToday, isYesterday } from 'date-fns'

const EMOJIS = ['👍','❤️','😂','😮','😢','🎉','🙏','👏','🔥','✅','💡','🚀']

export default function Messages() {
  const [contacts,setContacts]=useState([])
  const [selected,setSelected]=useState(null)
  const [messages,setMessages]=useState([])
  const [body,setBody]=useState('')
  const [loadingC,setLoadingC]=useState(true)
  const [loadingM,setLoadingM]=useState(false)
  const [search,setSearch]=useState('')
  const [showEmoji,setShowEmoji]=useState(false)
  const { user } = useAuth()
  const bottomRef = useRef(null)
  const [searchParams] = useSearchParams()

  useEffect(()=>{ api.get('/messages/contacts').then(r=>setContacts(r.data.contacts||[])).catch(console.error).finally(()=>setLoadingC(false)) },[])
  useEffect(()=>{
    const userId = searchParams.get('user')
    if(!userId || contacts.length===0 || selected?._id===userId) return
    const contact = contacts.find(c=>c._id===userId)
    if(contact) setSelected(contact)
  },[contacts, searchParams, selected])
  useEffect(()=>{
    if(!selected) return
    setLoadingM(true)
    api.get('/messages/'+selected._id).then(r=>{ setMessages(r.data.messages||[]); api.post('/messages/'+selected._id+'/read').catch(()=>{}) }).catch(console.error).finally(()=>setLoadingM(false))
  },[selected])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const send = async e => {
    e?.preventDefault()
    if(!body.trim()||!selected) return
    const content=body.trim(); setBody('')
    try { const r=await api.post('/messages/'+selected._id,{body:content}); setMessages(p=>[...p,r.data.message]) }
    catch { toast.error('Failed to send') }
  }

  const grouped = messages.reduce((acc,m)=>{
    const d=new Date(m.createdAt)
    const key=isToday(d)?'Today':isYesterday(d)?'Yesterday':format(d,'MMM d, yyyy')
    if(!acc[key]) acc[key]=[]
    acc[key].push(m)
    return acc
  },{})

  const filtered = contacts.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="card" style={{height:'calc(100vh - 120px)',display:'flex',overflow:'hidden',padding:0}}>
      <div style={{width:300,borderRight:'1px solid #EFF6FF',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid #EFF6FF'}}>
          <p style={{margin:'0 0 10px',fontSize:15,fontWeight:700,color:'#0F1E3D'}}>Messages</p>
          <div style={{position:'relative'}}><Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',padding:'8px 10px 8px 30px',borderRadius:9,border:'1.5px solid #DBEAFE',fontSize:12.5,outline:'none',fontFamily:'inherit',background:'#F8FAFC',boxSizing:'border-box'}}/></div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loadingC?<PageLoader/>:filtered.length===0?<p style={{textAlign:'center',color:'#9CA3AF',fontSize:13,padding:24}}>No contacts</p>:
          filtered.map(c=>(
            <div key={c._id} onClick={()=>setSelected(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',cursor:'pointer',background:selected?._id===c._id?'#EFF6FF':'transparent',borderBottom:'1px solid #F8FAFC'}} onMouseEnter={e=>{if(selected?._id!==c._id)e.currentTarget.style.background='#F8FAFC'}} onMouseLeave={e=>{if(selected?._id!==c._id)e.currentTarget.style.background='transparent'}}>
              <div style={{position:'relative'}}><Avatar name={c.name} avatar={c.avatar} avatarStyle={c.avatarStyle} size={40}/><div style={{position:'absolute',bottom:1,right:1,width:9,height:9,borderRadius:'50%',background:'#22C55E',border:'2px solid #fff'}}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:13,fontWeight:600,color:'#0F1E3D'}}>{c.name}</span>{c.lastMessage&&<span style={{fontSize:10.5,color:'#9CA3AF'}}>{format(new Date(c.lastMessage.createdAt),'HH:mm')}</span>}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150}}>{c.lastMessage?.body||c.designation||c.email}</span>{c.unreadCount>0&&<span style={{background:'#2F85C8',color:'#fff',fontSize:10,fontWeight:700,borderRadius:99,padding:'0 6px',minWidth:18,textAlign:'center'}}>{c.unreadCount}</span>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!selected?(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#9CA3AF'}}><MessageSquare size={40} style={{marginBottom:12,opacity:0.4}}/><p style={{fontSize:14,fontWeight:500}}>Select a contact to start messaging</p></div>
      ):(
        <div style={{flex:1,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 20px',borderBottom:'1px solid #EFF6FF',display:'flex',alignItems:'center',gap:12}}><Avatar name={selected.name} avatar={selected.avatar} avatarStyle={selected.avatarStyle} size={38}/><div><p style={{margin:0,fontSize:13.5,fontWeight:700,color:'#0F1E3D'}}>{selected.name}</p><p style={{margin:0,fontSize:12,color:'#6B7280'}}>{selected.designation||selected.role}</p></div></div>
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:4}}>
            {loadingM?<PageLoader/>:Object.entries(grouped).map(([date,msgs])=>(
              <div key={date}>
                <div style={{textAlign:'center',margin:'12px 0'}}><span style={{fontSize:11,fontWeight:600,color:'#9CA3AF',background:'#F8FAFC',padding:'3px 12px',borderRadius:99}}>{date}</span></div>
                {msgs.map(m=>{const mine=m.sender?._id===user?._id||m.sender===user?._id;return(
                  <div key={m._id} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',marginBottom:6}}>
                    {!mine&&<Avatar name={m.sender?.name} avatar={m.sender?.avatar} avatarStyle={m.sender?.avatarStyle} size={28} style={{marginRight:8,alignSelf:'flex-end',flexShrink:0}}/>}
                    <div style={{maxWidth:'68%'}}>
                      <div style={{background:mine?'linear-gradient(135deg,#2F85C8,#1A4A8A)':'#F0F6FF',color:mine?'#fff':'#0F1E3D',padding:'9px 13px',borderRadius:mine?'14px 14px 4px 14px':'14px 14px 14px 4px',fontSize:13.5,lineHeight:1.4}}>{m.body}</div>
                      <div style={{fontSize:10.5,color:'#9CA3AF',marginTop:3,textAlign:mine?'right':'left'}}>{format(new Date(m.createdAt),'HH:mm')}{m.isEdited&&' · edited'}</div>
                    </div>
                  </div>
                )})}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid #EFF6FF'}}>
            {showEmoji&&<div style={{padding:'8px 4px',marginBottom:8,display:'flex',flexWrap:'wrap',gap:6}}>{EMOJIS.map(e=><button key={e} type="button" onClick={()=>{setBody(p=>p+e);setShowEmoji(false)}} style={{fontSize:20,background:'none',border:'none',cursor:'pointer',padding:2,borderRadius:6}}>{e}</button>)}</div>}
            <form onSubmit={send} style={{display:'flex',alignItems:'center',gap:10}}>
              <button type="button" onClick={()=>setShowEmoji(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,borderRadius:8,display:'flex',alignItems:'center'}}><Smile size={20}/></button>
              <input value={body} onChange={e=>setBody(e.target.value)} placeholder={'Message '+selected.name+'...'} style={{flex:1,padding:'10px 14px',borderRadius:12,border:'1.5px solid #DBEAFE',fontSize:13.5,outline:'none',fontFamily:'inherit',background:'#F8FAFC'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}/>
              <button type="submit" disabled={!body.trim()} style={{width:38,height:38,borderRadius:12,border:'none',background:body.trim()?'linear-gradient(135deg,#2F85C8,#1A4A8A)':'#EFF6FF',color:body.trim()?'#fff':'#9CA3AF',cursor:body.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Send size={16}/></button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
