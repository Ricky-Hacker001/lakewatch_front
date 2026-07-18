import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function DropletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C12 2 4 10 4 15C4 19.42 7.58 22 12 22C16.42 22 20 19.42 20 15C20 10 12 2 12 2Z"
        fill="url(#drop)"
      />
      <defs>
        <linearGradient id="drop" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState('')

  const checkAuth = () => {
    const token = localStorage.getItem('lw_token')
    const role = localStorage.getItem('lw_role')
    setIsLoggedIn(!!token)
    setIsAdmin(role === 'admin')
    setUserRole(role || '')
  }

  useEffect(() => {
    checkAuth()
    // Listen for custom login/logout storage updates
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('lw_token')
    localStorage.removeItem('lw_role')
    localStorage.removeItem('lw_admin_token')
    localStorage.removeItem('lw_admin_role')
    setIsLoggedIn(false)
    setIsAdmin(false)
    setUserRole('')
    setMobileOpen(false)
    navigate('/login')
  }

  // Base links visible to logged in users
  const navLinks = []
  if (isLoggedIn) {
    navLinks.push({ to: '/', label: 'Map View' })
    navLinks.push({ to: '/report', label: 'Report Incident' })
    if (isAdmin) {
      navLinks.push({ to: '/admin', label: 'Admin Panel' })
    }
  } else {
    // When not logged in, only show login link
    navLinks.push({ to: '/login', label: 'Sign In' })
  }

  return (
    <nav
      className="sticky top-0 z-[1000]"
      style={{
        background: 'rgba(6, 13, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(34, 197, 94, 0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="p-1.5 rounded-lg transition-all duration-200 group-hover:scale-110"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <DropletIcon />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base gradient-text">🌿 LakeWatch</div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Anekal · SDG 15</div>
            </div>
          </Link>

          {/* User Role Badge */}
          {isLoggedIn && (
            <div className="hidden sm:block ml-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-900 border border-slate-800 text-slate-400">
              {isAdmin ? '🛡 Authority' : '👤 Citizen'}
            </div>
          )}

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={active
                    ? { background: 'rgba(34,197,94,0.14)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.28)' }
                    : { color: '#64748b', border: '1px solid transparent' }
                  }
                >
                  {label}
                </Link>
              )
            })}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ml-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              >
                Sign Out
              </button>
            )}

            {isLoggedIn && (
              <Link
                to="/report"
                className="btn-primary ml-3"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                + Report
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              {mobileOpen ? (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3.293 3.293a1 1 0 011.414 0L9 7.586l4.293-4.293a1 1 0 111.414 1.414L10.414 9l4.293 4.293a1 1 0 01-1.414 1.414L9 10.414l-4.293 4.293a1 1 0 01-1.414-1.414L7.586 9 3.293 4.707a1 1 0 010-1.414z"
                />
              ) : (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M2 4a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1z"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 animate-fade-in"
          style={{ borderTop: '1px solid rgba(34, 197, 94, 0.08)' }}
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all duration-150"
              style={pathname === to
                ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                : { color: '#94a3b8' }
              }
            >
              {label}
            </Link>
          ))}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 mb-1 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              Sign Out
            </button>
          )}

          {isLoggedIn && (
            <Link
              to="/report"
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-2 w-full"
              style={{ justifyContent: 'center' }}
            >
              + New Report
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
