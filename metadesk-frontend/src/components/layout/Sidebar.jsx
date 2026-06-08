import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, MessageSquare,
  Bell, Users, CalendarCheck, BarChart2, UserCircle, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, PlusCircle, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { can, roleLabel } from '../../utils/accessControl'

const Logo = () => (
  <img src="/metadesk-icon.png" alt="Metadesk Global" width="32" height="32" style={{ flexShrink: 0, display: 'block' }} />
)

const ROLE_STYLE = {
  ceo:      { bg: '#FEF3C7', color: '#92400E', label: 'CEO' },
  owner:    { bg: '#FEF3C7', color: '#92400E', label: 'CEO' },
  admin:    { bg: '#F5F3FF', color: '#5925DC', label: 'Admin' },
  manager:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Manager' },
  employee: { bg: '#F0FDF4', color: '#166534', label: 'Employee' },
}

const MAIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard' },
  { icon: FolderKanban,    label: 'Projects',      path: '/projects' },
  { icon: CheckSquare,     label: 'Tasks',         path: '/tasks' },
  { icon: MessageSquare,   label: 'Messages',      path: '/messages',      badge: 'messages' },
  { icon: Bell,            label: 'Notifications', path: '/notifications', badge: 'notifications' },
  { icon: Users,           label: 'Team',          path: '/team' },
  { icon: CalendarCheck,   label: 'Daily To-Dos',  path: '/todos' },
]
const MGR_NAV = [
  { icon: BarChart2, label: 'Employee Summary', path: '/employee-summary' },
]
const BOTTOM_NAV = [
  { icon: UserCircle, label: 'Profile',  path: '/profile' },
  { icon: Settings,   label: 'Settings', path: '/settings' },
]

function NavItem({ icon: Icon, label, path, badgeCount = 0, collapsed, onNavigate }) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      style={{ overflow: 'hidden' }}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            strokeWidth={isActive ? 2.5 : 1.8}
            style={{ flexShrink: 0, color: 'inherit' }}
          />
          {!collapsed && (
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}>
              {label}
            </span>
          )}
          {badgeCount > 0 && !collapsed && (
            <span style={{
              background: '#2F85C8', color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 99,
              padding: '1px 7px', minWidth: 20, textAlign: 'center', flexShrink: 0,
            }}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
          {badgeCount > 0 && collapsed && (
            <div style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: '#F04438', border: '2px solid #fff',
            }} />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, mobile = false, open = false, onToggle, onNavigate, badges = {} }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const allNav = can(user, 'viewEmployeeSummary') ? [...MAIN_NAV, ...MGR_NAV] : MAIN_NAV
  const canCreateProjects = can(user, 'createProjects')
  const role = ROLE_STYLE[user?.role] || ROLE_STYLE.employee
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MG'

  return (
    <aside style={{
      width: mobile ? 280 : (collapsed ? 72 : 248),
      background: '#FFFFFF',
      borderRight: '1px solid #EAECF0',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50,
      transition: 'width 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1)',
      transform: mobile && !open ? 'translateX(-100%)' : 'translateX(0)',
      boxShadow: mobile && open ? '18px 0 50px rgba(15,23,42,0.16)' : 'none',
      overflow: 'visible', flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0 12px' : '0 16px',
        gap: 10, flexShrink: 0, position: 'relative',
        borderBottom: '1px solid #F2F4F7',
      }}>
        <Logo />
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#101828', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Metadesk
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#2F85C8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Global
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={mobile ? 'Close navigation' : (collapsed ? 'Expand navigation' : 'Collapse navigation')}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: collapsed && !mobile ? '1px solid #EAECF0' : 'none',
            background: collapsed && !mobile ? '#fff' : 'transparent',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#667085', flexShrink: 0, transition: 'all 0.15s',
            position: collapsed && !mobile ? 'absolute' : 'static',
            right: collapsed && !mobile ? -16 : 'auto',
            top: collapsed && !mobile ? 16 : 'auto',
            boxShadow: collapsed && !mobile ? '0 4px 12px rgba(16,24,40,0.08)' : 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F2F4F7'; e.currentTarget.style.color = '#2F85C8' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#667085' }}
        >
          {mobile ? <X size={17} /> : collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
        {!collapsed && (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#98A2B3', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
            Main Menu
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {allNav.map(item => (
            <NavItem
              key={item.path}
              {...item}
              badgeCount={item.badge ? badges[item.badge] || 0 : 0}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {canCreateProjects && (
          <button
            onClick={() => { navigate('/projects?create=1'); onNavigate?.() }}
            title={collapsed ? 'Create project' : undefined}
            style={{
              width: '100%', marginTop: 10, border: '1px solid #BBD7F2',
              background: '#EFF6FF', color: '#1D6EB0', borderRadius: 10,
              padding: collapsed ? '10px 0' : '10px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 9, fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
            }}
          >
            <PlusCircle size={17} />
            {!collapsed && <span>Create Project</span>}
          </button>
        )}

        <div style={{ height: 1, background: '#F2F4F7', margin: '12px 4px' }} />

        {!collapsed && (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#98A2B3', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
            Account
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {BOTTOM_NAV.map(item => (
            <NavItem key={item.path} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #F2F4F7', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10, background: '#F9FAFB',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2F85C8, #1A4A8A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11.5, fontWeight: 700, color: '#fff', overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>

          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <span style={{ background: role.bg, color: role.color, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px', display: 'inline-block', marginTop: 1 }}>
                  {role.label || roleLabel(user?.role)}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  width: 28, height: 28, borderRadius: 7, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#98A2B3', flexShrink: 0, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#F04438' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#98A2B3' }}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
