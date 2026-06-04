import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { roleLabel } from '../../utils/accessControl'
import api from '../../services/api'

const PAGE_TITLES = {
  '/dashboard':        { title: 'Dashboard', sub: true },
  '/projects':         { title: 'Projects' },
  '/tasks':            { title: 'Tasks' },
  '/messages':         { title: 'Messages' },
  '/notifications':    { title: 'Notifications' },
  '/team':             { title: 'Team' },
  '/todos':            { title: 'Daily To-Dos' },
  '/employee-summary': { title: 'Employee Summary' },
  '/profile':          { title: 'Profile' },
  '/settings':         { title: 'Settings' },
}

const greet = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Navbar({ notificationCount = 0, onMenuClick, isMobile = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ tasks: [], projects: [] })
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  const path = '/' + location.pathname.split('/')[1]
  const page = PAGE_TITLES[path] || { title: 'Metadesk' }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MG'

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim() || isMobile) {
      setResults({ tasks: [], projects: [] })
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          api.get(`/tasks?search=${query}`).catch(() => ({ data: { tasks: [] } })),
          api.get(`/projects?search=${query}`).catch(() => ({ data: { projects: [] } })),
        ])
        setResults({
          tasks: (tasksRes.data.tasks || []).slice(0, 4),
          projects: (projectsRes.data.projects || []).slice(0, 3),
        })
        setShowResults(true)
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query, isMobile])

  const goTo = (path) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
  }

  const hasResults = results.tasks.length > 0 || results.projects.length > 0

  return (
    <header style={{
      height: isMobile ? 58 : 64,
      background: '#FFFFFF',
      borderBottom: '1px solid #EAECF0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: '1px solid #EAECF0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475467',
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 16 : 17,
            fontWeight: 700,
            color: '#101828',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {page.title}
          </h1>
          {page.sub && (
            <p style={{
              margin: 0,
              fontSize: 12,
              color: '#2F85C8',
              fontWeight: 500,
              marginTop: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {greet()}, {user?.name?.split(' ')[0] || 'there'}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, minWidth: 0 }}>
        {!isMobile && (
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: '#98A2B3', pointerEvents: 'none', zIndex: 1 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={e => {
                  if (query) setShowResults(true)
                  e.target.style.borderColor = '#2F85C8'
                  e.target.style.background = '#fff'
                  e.target.style.width = '260px'
                }}
                onBlur={e => {
                  if (!showResults) {
                    e.target.style.borderColor = '#EAECF0'
                    e.target.style.background = '#F9FAFB'
                    e.target.style.width = '220px'
                  }
                }}
                placeholder="Search tasks, projects..."
                style={{
                  padding: '8px 32px',
                  borderRadius: 8,
                  border: '1px solid #EAECF0',
                  fontSize: 13,
                  color: '#101828',
                  background: '#F9FAFB',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: 220,
                  transition: 'all 0.2s',
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setShowResults(false) }}
                  style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#98A2B3', display: 'flex', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showResults && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #EAECF0',
                boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
                zIndex: 50,
                overflow: 'hidden',
                minWidth: 300,
              }}>
                {searching ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: '#98A2B3', textAlign: 'center' }}>Searching...</div>
                ) : !hasResults ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: '#98A2B3', textAlign: 'center' }}>No results for "{query}"</div>
                ) : (
                  <>
                    {results.projects.length > 0 && (
                      <>
                        <div style={{ padding: '8px 14px 4px', fontSize: 10.5, fontWeight: 700, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Projects</div>
                        {results.projects.map(p => (
                          <div key={p._id} onClick={() => goTo('/projects')} style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.coverColor || '#2F85C8', flexShrink: 0 }} />
                            <span style={{ fontSize: 13.5, color: '#101828', fontWeight: 500 }}>{p.title}</span>
                            <span style={{ fontSize: 11, color: '#98A2B3', marginLeft: 'auto', textTransform: 'capitalize' }}>{p.status?.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {results.tasks.length > 0 && (
                      <>
                        <div style={{ padding: '8px 14px 4px', fontSize: 10.5, fontWeight: 700, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '0.6px', borderTop: results.projects.length > 0 ? '1px solid #F2F4F7' : 'none' }}>Tasks</div>
                        {results.tasks.map(t => (
                          <div key={t._id} onClick={() => goTo('/tasks')} style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.status === 'done' ? '#12B76A' : t.status === 'in_progress' ? '#2F85C8' : '#98A2B3', flexShrink: 0 }} />
                            <span style={{ fontSize: 13.5, color: '#101828', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                            <span style={{ fontSize: 11, color: '#98A2B3', flexShrink: 0 }}>{t.project?.title || 'Standalone'}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <div style={{ padding: '8px 14px', borderTop: '1px solid #F2F4F7' }}>
                      <button onClick={() => goTo('/tasks')} style={{ fontSize: 12.5, color: '#2F85C8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        View all results
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 9,
            border: '1px solid #EAECF0',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475467',
            transition: 'all 0.15s',
          }}
          title="Notifications"
        >
          <Bell size={17} />
          {notificationCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#F04438',
              border: '2px solid #fff',
            }} />
          )}
        </button>

        {!isMobile && <div style={{ width: 1, height: 28, background: '#EAECF0' }} />}

        <div
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: isMobile ? 0 : '4px 8px', borderRadius: 9, transition: 'background 0.15s' }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2F85C8, #1A4A8A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            overflow: 'hidden',
            border: '2px solid #EFF6FF',
            flexShrink: 0,
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          {!isMobile && (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: '#98A2B3' }}>{roleLabel(user?.role)}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
