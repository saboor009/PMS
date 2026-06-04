import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [badges] = useState({ messages: 0, notifications: 0 })

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev)
      return
    }
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const sidebarWidth = isMobile ? 0 : (collapsed ? 72 : 248)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F7FE' }}>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 45, border: 0, background: 'rgba(15, 23, 42, 0.42)', cursor: 'default' }}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        mobile={isMobile}
        open={mobileOpen}
        onToggle={handleToggle}
        onNavigate={() => isMobile && setMobileOpen(false)}
        badges={badges}
      />

      <div style={{
        display: 'flex', flexDirection: 'column', flex: 1,
        minWidth: 0, overflow: 'hidden',
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)',
      }}>
        <Navbar notificationCount={badges.notifications} onMenuClick={handleToggle} isMobile={isMobile} />
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px' : '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
