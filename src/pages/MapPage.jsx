import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MapView from '../components/MapView'
import ReportCard from '../components/ReportCard'

const VIOLATION_TYPES = [
  'All Types',
  'Illegal Dumping',
  'Construction Encroachment',
  'Industrial Sludge',
  'Other',
]
const STATUSES = ['All Statuses', 'New', 'Under Review', 'Resolved']

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card px-4 py-3 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="rounded-xl mb-3" style={{ height: 140, background: 'rgba(34,197,94,0.05)' }} />
      <div className="h-3 rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)', width: '80%' }} />
      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', width: '55%' }} />
    </div>
  )
}

export default function MapPage() {
  const navigate = useNavigate()
  const [reports,      setReports]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeFilter,   setTypeFilter]   = useState('All Types')

  useEffect(() => {
    const token = localStorage.getItem('lw_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'All Statuses') params.status = statusFilter
      if (typeFilter   !== 'All Types')    params.type   = typeFilter
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/reports`, { params });
      setReports(data)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [statusFilter, typeFilter]) // eslint-disable-line

  const stats = {
    total:    reports.length,
    new:      reports.filter(r => r.status === 'New').length,
    review:   reports.filter(r => r.status === 'Under Review').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  }

  const filtered = statusFilter === 'All Statuses' && typeFilter === 'All Types'

  return (
    <main className="bg-animated min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">

        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Protecting Anekal's Lakes</span>
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Community-driven encroachment monitoring · SDG&nbsp;15: Life on Land
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Reports" value={stats.total}    color="#f0fdf4" />
          <StatCard label="New"           value={stats.new}      color="#60a5fa" />
          <StatCard label="Under Review"  value={stats.review}   color="#fbbf24" />
          <StatCard label="Resolved"      value={stats.resolved} color="#4ade80" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            id="status-filter"
            className="select-field"
            style={{ width: 'auto', minWidth: 165 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>

          <select
            id="type-filter"
            className="select-field"
            style={{ width: 'auto', minWidth: 210 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          {!filtered && (
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: 13 }}
              onClick={() => { setStatusFilter('All Statuses'); setTypeFilter('All Types') }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="glass-card overflow-hidden mb-6"
          style={{ height: '56vh', minHeight: 320 }}
        >
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <p style={{ color: '#64748b', fontSize: 14 }}>Loading map…</p>
            </div>
          ) : (
            <MapView reports={reports} />
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#94a3b8' }}>
          {loading ? 'Loading…' : `${reports.length} report${reports.length !== 1 ? 's' : ''}${!filtered ? ' · filtered' : ''}`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card p-14 text-center animate-fade-in">
            <div className="text-5xl mb-4">🌊</div>
            <p style={{ color: '#64748b' }}>No reports match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reports.map(r => (
              <ReportCard
                key={r.id}
                report={r}
                onUpdate={updatedReport => {
                  setReports(prev => prev.map(item => item.id === updatedReport.id ? updatedReport : item))
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
