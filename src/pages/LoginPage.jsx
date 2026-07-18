import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('citizen') // 'citizen' or 'authority'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // If already logged in, redirect based on role
    const token = localStorage.getItem('lw_token')
    const role = localStorage.getItem('lw_role')
    if (token) {
      if (role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/auth/login', { username, password })
      localStorage.setItem('lw_token', data.token)
      localStorage.setItem('lw_role', data.role)
      
      if (data.role === 'admin') {
        localStorage.setItem('lw_admin_token', data.token)
        localStorage.setItem('lw_admin_role', data.role)
        window.dispatchEvent(new Event('storage'))
        navigate('/admin')
      } else {
        localStorage.removeItem('lw_admin_token')
        localStorage.removeItem('lw_admin_role')
        window.dispatchEvent(new Event('storage'))
        navigate('/')
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid username or password. Please try again.')
      } else {
        setError('Connection error. Failed to log in.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAutoFill = (type) => {
    if (type === 'citizen') {
      setUsername('user@lakewatch.org')
      setPassword('password')
      setActiveTab('citizen')
    } else {
      setUsername('admin@lakewatch.org')
      setPassword('password')
      setActiveTab('authority')
    }
  }

  return (
    <main className="bg-animated min-h-[90vh] flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 max-w-md w-full animate-slide-up shadow-2xl">
        
        {/* Tab Selector */}
        <div className="flex bg-slate-950/60 p-1 rounded-2xl mb-8 border border-slate-800/60">
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={activeTab === 'citizen'
              ? { background: 'linear-gradient(135deg,#22c55e,#14b8a6)', color: '#ffffff', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' }
              : { color: '#64748b' }
            }
            onClick={() => {
              setActiveTab('citizen')
              setUsername('')
              setPassword('')
              setError('')
            }}
          >
            👤 Citizen Portal
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={activeTab === 'authority'
              ? { background: 'linear-gradient(135deg,#22c55e,#14b8a6)', color: '#ffffff', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' }
              : { color: '#64748b' }
            }
            onClick={() => {
              setActiveTab('authority')
              setUsername('')
              setPassword('')
              setError('')
            }}
          >
            🛡 Authority Portal
          </button>
        </div>

        {/* Portal Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6"
          style={{ 
            background: 'rgba(34,197,94,0.08)', 
            border: '1px solid rgba(34,197,94,0.2)',
            boxShadow: '0 4px 20px rgba(34,197,94,0.05)'
          }}
        >
          {activeTab === 'citizen' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 010 7.75" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-bold text-center gradient-text mb-2">
          {activeTab === 'citizen' ? 'Citizen Sign In' : 'Authority Sign In'}
        </h2>
        <p className="text-xs text-center mb-6" style={{ color: '#64748b' }}>
          {activeTab === 'citizen'
            ? 'Report environment violations, check status, and protect water bodies.'
            : 'Access dashboard analytics, review complaints, and update statuses.'}
        </p>

        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-xs font-semibold text-center border animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder={activeTab === 'citizen' ? 'user@lakewatch.org' : 'admin@lakewatch.org'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
            style={{ padding: '12px' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo Details Quick Autofill */}
        <div className="mt-8 pt-5 border-t border-slate-800/40 text-center">
          <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider font-semibold">Demo Accounts</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleAutoFill('citizen')}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-emerald-400"
            >
              Fill Citizen Info
            </button>
            <button
              type="button"
              onClick={() => handleAutoFill('authority')}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-emerald-400"
            >
              Fill Admin Info
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
