import { useState } from 'react'
import { Save, Lock, Palette } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

const AVATAR_COLORS = {
  face: ['#F8C7A5', '#D7A37C', '#F1B995', '#C98F65', '#FFD7B5'],
  hair: ['#111827', '#1F2937', '#3F2A1D', '#7C2D12', '#6B21A8'],
  shirt: ['#2F85C8', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
}
const ACCESSORIES = ['none', 'glasses', 'cap']

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name:user?.name||'', username:user?.username||'', email:user?.email||'', team:user?.team||'', designation:user?.designation||'', bio:user?.bio||'' })
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(user?.notificationPrefs || {})
  const [avatarStyle, setAvatarStyle] = useState(user?.avatarStyle || {})
  const set = f => e => setForm(p=>({...p,[f]:e.target.value}))
  const setPw = f => e => setPwd(p=>({...p,[f]:e.target.value}))
  const setAvatar = (field, value) => setAvatarStyle(p=>({...p,[field]:value}))

  const saveProfile = async e => {
    e.preventDefault(); setLoading(true)
    try { const r=await api.put('/auth/profile',{...form,avatarStyle}); updateUser(r.data.user); toast.success('Profile updated!') }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setLoading(false) }
  }

  const changePassword = async e => {
    e.preventDefault()
    if(pwd.newPassword!==pwd.confirm) return toast.error('Passwords do not match')
    if(pwd.newPassword.length<8) return toast.error('Minimum 8 characters')
    setPwdLoading(true)
    try { await api.put('/auth/change-password',{currentPassword:pwd.currentPassword,newPassword:pwd.newPassword}); toast.success('Password changed!'); setPwd({currentPassword:'',newPassword:'',confirm:''}) }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setPwdLoading(false) }
  }

  const NOTIF_FIELDS = [{ key:'taskAssigned',label:'Task assigned to you'},{ key:'deadlineReminder',label:'Deadline reminders'},{ key:'projectUpdate',label:'Project updates'},{ key:'commentMention',label:'Comment mentions'},{ key:'fileUploaded',label:'File uploads'}]

  const saveNotifPrefs = async () => {
    try { await api.put('/auth/profile',{ notificationPrefs:notifPrefs }); toast.success('Preferences saved') }
    catch { toast.error('Failed') }
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="card" style={{padding:24}}>
          <h3 style={{margin:'0 0 20px',fontSize:15,fontWeight:700,color:'#0F1E3D'}}>Personal Information</h3>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <div style={{position:'relative'}}>
              <Avatar name={form.name || user?.name} avatarStyle={avatarStyle} size={72}/>
            </div>
            <div>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:'#0F1E3D'}}>{user?.name}</p>
              <p style={{margin:'2px 0',fontSize:13,color:'#6B7280'}}>{user?.designation}</p>
              <p style={{margin:0,fontSize:12,color:'#9CA3AF'}}>{user?.email}</p>
            </div>
          </div>
          <form onSubmit={saveProfile} style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{padding:14,border:'1px solid #E8EFFC',borderRadius:12,background:'#F8FAFC'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
                <Palette size={15} style={{color:'#2F85C8'}}/>
                <span style={{fontSize:13,fontWeight:800,color:'#0F1E3D'}}>Cartoon Avatar</span>
              </div>
              {Object.entries(AVATAR_COLORS).map(([field, colors])=>(
                <div key={field} style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
                  <span style={{width:42,fontSize:11.5,fontWeight:700,color:'#667085',textTransform:'capitalize'}}>{field}</span>
                  <div style={{display:'flex',gap:7}}>
                    {colors.map(color=><button type="button" key={color} onClick={()=>setAvatar(field,color)} title={color} style={{width:24,height:24,borderRadius:'50%',background:color,border:(avatarStyle[field]||'')===color?'3px solid #0F1E3D':'2px solid #fff',boxShadow:'0 0 0 1px #D0D5DD',cursor:'pointer'}} />)}
                  </div>
                </div>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <span style={{width:42,fontSize:11.5,fontWeight:700,color:'#667085'}}>Extra</span>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {ACCESSORIES.map(option=><button type="button" key={option} onClick={()=>setAvatar('accessory',option)} style={{border:'none',borderRadius:99,padding:'5px 10px',fontSize:11.5,fontWeight:700,cursor:'pointer',background:(avatarStyle.accessory||'none')===option?'#EFF6FF':'#fff',color:(avatarStyle.accessory||'none')===option?'#2F85C8':'#667085'}}>{option}</button>)}
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Your name"/>
              <Input label="Username" value={form.username} onChange={set('username')} placeholder="username"/>
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input label="Team / Department" value={form.team} onChange={set('team')} placeholder="e.g. Engineering"/>
              <Input label="Job Title" value={form.designation} onChange={set('designation')} placeholder="e.g. Developer"/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={{fontSize:13,fontWeight:600,color:'#1A4A8A'}}>Bio</label>
              <textarea value={form.bio} onChange={set('bio')} placeholder="Tell your team about yourself..." rows={3} style={{padding:'9px 12px',borderRadius:10,border:'1.5px solid #DBEAFE',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical'}}/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{alignSelf:'flex-end'}}><Save size={15}/>{loading?'Saving...':'Save Changes'}</button>
          </form>
        </div>

        <div className="card" style={{padding:24}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:'#0F1E3D',display:'flex',alignItems:'center',gap:8}}><Lock size={16}/>Change Password</h3>
          <form onSubmit={changePassword} style={{display:'flex',flexDirection:'column',gap:12}}>
            <Input label="Current Password" type="password" value={pwd.currentPassword} onChange={setPw('currentPassword')} placeholder="Enter current password"/>
            <Input label="New Password" type="password" value={pwd.newPassword} onChange={setPw('newPassword')} placeholder="Min. 8 characters"/>
            <Input label="Confirm New Password" type="password" value={pwd.confirm} onChange={setPw('confirm')} placeholder="Repeat new password"/>
            <button type="submit" disabled={pwdLoading} className="btn-primary" style={{alignSelf:'flex-end'}}>{pwdLoading?'Updating...':'Update Password'}</button>
          </form>
        </div>
      </div>

      <div className="card" style={{padding:24}}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:'#0F1E3D'}}>Notification Preferences</h3>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {NOTIF_FIELDS.map(({key,label})=>(
            <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:13.5,color:'#374151'}}>{label}</span>
              <button type="button" onClick={()=>setNotifPrefs(p=>({...p,[key]:!p[key]}))} style={{width:44,height:24,borderRadius:99,border:'none',cursor:'pointer',background:notifPrefs[key]?'#2F85C8':'#E5E7EB',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                <div style={{position:'absolute',top:2,left:notifPrefs[key]?'calc(100% - 22px)':2,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 3px rgba(0,0,0,0.2)',transition:'left 0.2s'}}/>
              </button>
            </div>
          ))}
          <button onClick={saveNotifPrefs} className="btn-primary" style={{marginTop:8,alignSelf:'flex-start'}}><Save size={14}/>Save Preferences</button>
        </div>
      </div>
    </div>
  )
}
