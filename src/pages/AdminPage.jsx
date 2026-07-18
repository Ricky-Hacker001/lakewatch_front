import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBadge from '../components/StatusBadge'
import { TYPE_META } from '../components/ReportCard'

// ── ChartJS Imports ──────────────────────────────────────────────────────────
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

const VIOLATION_TYPES = ['All Types', 'Illegal Dumping', 'Construction Encroachment', 'Industrial Sludge', 'Other']
const STATUSES        = ['All Statuses', 'New', 'Under Review', 'Escalated', 'Resolved']
const PRIORITIES      = ['All Priorities', 'High Priority Only', 'Escalated Only']

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Custom styles for Dark Theme ChartJS
const chartOptionsBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 9 } }
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 9 }, stepSize: 1 }
    }
  }
}

function Toast({ toast }) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div
      className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-sm font-semibold animate-slide-up z-50 flex items-center gap-2"
      style={{
        background:   ok ? 'rgba(34,197,94,0.18)'  : 'rgba(239,68,68,0.18)',
        border:   `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        color:        ok ? '#4ade80'                : '#f87171',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {ok ? '✓' : '✗'}&nbsp;{toast.msg}
    </div>
  )
}

function StatCard({ icon, label, value, valueColor, bg }) {
  return (
    <div className="glass-card p-5" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-3xl font-extrabold" style={{ color: valueColor }}>{value}</span>
      </div>
      <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [reports,          setReports]          = useState([])
  const [loading,          setLoading]          = useState(true)
  const [statusFilter,     setStatusFilter]     = useState('All Statuses')
  const [typeFilter,       setTypeFilter]       = useState('All Types')
  const [priorityFilter,   setPriorityFilter]   = useState('All Priorities')
  const [updating,         setUpdating]         = useState(null)
  const [toast,            setToast]            = useState(null)
  
  // Details Modal State
  const [selectedReport,   setSelectedReport]   = useState(null)
  const [remarksText,      setRemarksText]      = useState('')
  const [savingRemarks,    setSavingRemarks]    = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem('lw_admin_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/reports')
      setReports(data)
    } catch {
      showToast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      const { data } = await axios.patch(`/api/reports/${id}/status`, { status })
      setReports(prev => prev.map(r => r.id === id ? data : r))
      showToast(`Status updated to "${status}"`)
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(data)
      }
    } catch {
      showToast('Failed to update status', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const saveRemarks = async () => {
    if (!selectedReport) return
    setSavingRemarks(true)
    try {
      const { data } = await axios.patch(`/api/reports/${selectedReport.id}/remarks`, {
        admin_remarks: remarksText
      })
      setReports(prev => prev.map(r => r.id === selectedReport.id ? data : r))
      setSelectedReport(data)
      showToast('Remarks updated successfully')
    } catch {
      showToast('Failed to update remarks', 'error')
    } finally {
      setSavingRemarks(false)
    }
  }

  // Client-side filtering & sorting
  const filtered = reports.filter(r => {
    if (statusFilter !== 'All Statuses' && r.status !== statusFilter) return false
    if (typeFilter !== 'All Types' && r.violation_type !== typeFilter) return false
    if (priorityFilter === 'High Priority Only' && r.buffer_zone_flag !== 1) return false
    if (priorityFilter === 'Escalated Only' && r.status !== 'Escalated') return false
    return true
  })

  // Sort priority buffer violations first, then newest
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const aPri = (a.buffer_zone_flag === 1 && a.status === 'Escalated') ? 1 : 0
    const bPri = (b.buffer_zone_flag === 1 && b.status === 'Escalated') ? 1 : 0
    if (aPri !== bPri) return bPri - aPri
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const stats = {
    total:        reports.length,
    highPriority: reports.filter(r => r.buffer_zone_flag === 1).length,
    escalated:    reports.filter(r => r.status === 'Escalated').length,
    resolved:     reports.filter(r => r.status === 'Resolved').length,
  }

  // CSV Exporter
  const exportToCSV = () => {
    const headers = ['Report ID', 'Violation Type', 'Status', 'Latitude', 'Longitude', 'Timestamp', 'Confirmations', 'Description', 'Admin Remarks']
    const rows = sortedAndFiltered.map(r => [
      r.id,
      r.violation_type,
      r.status,
      r.latitude,
      r.longitude,
      r.timestamp,
      r.upvotes,
      (r.description || '').replace(/"/g, '""').replace(/\n/g, ' '),
      (r.admin_remarks || '').replace(/"/g, '""').replace(/\n/g, ' ')
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lakewatch-reports-${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Compute Analytics Datasets ─────────────────────────────────────────────
  
  // 1. Violation Types Chart Data
  const typeCounts = { 'Illegal Dumping': 0, 'Construction Encroachment': 0, 'Industrial Sludge': 0, 'Other': 0 }
  reports.forEach(r => {
    if (typeCounts[r.violation_type] !== undefined) {
      typeCounts[r.violation_type]++
    }
  })
  const typeChartData = {
    labels: Object.keys(typeCounts),
    datasets: [{
      label: 'Incidents by Category',
      data: Object.values(typeCounts),
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(249,115,22,0.7)', 'rgba(168,85,247,0.7)', 'rgba(99,102,241,0.7)'],
      borderColor: ['#ef4444', '#f97316', '#a855f7', '#6366f1'],
      borderWidth: 1.5
    }]
  }

  // 2. Status Chart Data
  const statusCounts = { 'New': 0, 'Under Review': 0, 'Escalated': 0, 'Resolved': 0 }
  reports.forEach(r => {
    if (statusCounts[r.status] !== undefined) {
      statusCounts[r.status]++
    }
  })
  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Incidents by Status',
      data: Object.values(statusCounts),
      backgroundColor: ['rgba(59,130,246,0.6)', 'rgba(245,158,11,0.6)', 'rgba(239,68,68,0.6)', 'rgba(34,197,94,0.6)'],
      borderColor: ['#3b82f6', '#f59e0b', '#ef4444', '#22c55e'],
      borderWidth: 1.5
    }]
  }

  // 3. Trends Over Time Data (group by YYYY-MM-DD)
  const dateCounts = {}
  reports.forEach(r => {
    const day = r.timestamp.slice(0, 10)
    dateCounts[day] = (dateCounts[day] || 0) + 1
  })
  const sortedDates = Object.keys(dateCounts).sort()
  const trendChartData = {
    labels: sortedDates.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Reports Filed',
      data: sortedDates.map(d => dateCounts[d]),
      fill: true,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.08)',
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: '#22c55e'
    }]
  }

  const openDetails = (report) => {
    setSelectedReport(report)
    setRemarksText(report.admin_remarks || '')
  }

  const COL_HEADERS = ['ID', 'Photo', 'Type', 'Description', 'Coordinates', 'Date', 'Priority', 'Status', 'Actions']

  return (
    <main className="bg-animated min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-extrabold gradient-text mb-1">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Review and update encroachment reports · LakeWatch Anekal
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={sortedAndFiltered.length === 0}
              className="btn-secondary flex items-center gap-1.5"
              style={{ padding: '9px 18px', fontSize: 13 }}
            >
              📥 Export as CSV
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: 13 }}
              onClick={fetchReports}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📊" label="Total Reports"  value={stats.total}        valueColor="#f0fdf4" bg="rgba(240,253,244,0.04)" />
          <StatCard icon="⚠️" label="High Priority"  value={stats.highPriority} valueColor="#fb923c" bg="rgba(249,115,22,0.06)"  />
          <StatCard icon="🚨" label="Escalated"      value={stats.escalated}    valueColor="#f87171" bg="rgba(239,68,68,0.06)"  />
          <StatCard icon="🟢" label="Resolved"       value={stats.resolved}     valueColor="#4ade80" bg="rgba(34,197,94,0.06)"   />
        </div>

        {/* ── Analytics Visualizations ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Doughnut Chart */}
          <div className="glass-card p-5" style={{ height: 260 }}>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Reports by Type</h3>
            <div className="relative h-[180px]">
              <Doughnut
                data={typeChartData}
                options={{
                  ...chartOptionsBase,
                  plugins: {
                    ...chartOptionsBase.plugins,
                    legend: { ...chartOptionsBase.plugins.legend, position: 'right' }
                  }
                }}
              />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-card p-5" style={{ height: 260 }}>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Reports by Status</h3>
            <div className="relative h-[180px]">
              <Bar data={statusChartData} options={chartOptionsBase} />
            </div>
          </div>

          {/* Line Chart */}
          <div className="glass-card p-5" style={{ height: 260 }}>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Incidents Filing Trend</h3>
            <div className="relative h-[180px]">
              <Line
                data={trendChartData}
                options={{
                  ...chartOptionsBase,
                  plugins: {
                    ...chartOptionsBase.plugins,
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            id="admin-status-filter"
            className="select-field"
            style={{ width: 'auto', minWidth: 165 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>

          <select
            id="admin-type-filter"
            className="select-field"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 210 }}
          >
            {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <select
            id="admin-priority-filter"
            className="select-field"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 210 }}
          >
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>

          {(statusFilter !== 'All Statuses' || typeFilter !== 'All Types' || priorityFilter !== 'All Priorities') && (
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: 13 }}
              onClick={() => {
                setStatusFilter('All Statuses');
                setTypeFilter('All Types');
                setPriorityFilter('All Priorities');
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
                  {COL_HEADERS.map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#475569' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{ background: 'rgba(255,255,255,0.05)', width: `${55 + j * 5}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {!loading && sortedAndFiltered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="text-5xl mb-4">🌊</div>
                      <p style={{ color: '#64748b' }}>No reports match your filters.</p>
                    </td>
                  </tr>
                )}

                {!loading && sortedAndFiltered.map(r => {
                  const meta = TYPE_META[r.violation_type] ?? TYPE_META['Other']
                  const isHighPriorityEscalated = r.buffer_zone_flag === 1 && r.status === 'Escalated'
                  return (
                    <tr
                      key={r.id}
                      onClick={() => openDetails(r)}
                      className="cursor-pointer"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isHighPriorityEscalated ? 'rgba(239,68,68,0.03)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = isHighPriorityEscalated 
                          ? 'rgba(239,68,68,0.06)' 
                          : 'rgba(34,197,94,0.03)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isHighPriorityEscalated 
                          ? 'rgba(239,68,68,0.03)' 
                          : 'transparent'
                      }}
                    >
                      {/* ID */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs" style={{ color: '#4ade80' }}>{r.id}</span>
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-4">
                        <div
                          className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(34,197,94,0.07)' }}
                        >
                          {r.photo_url
                            ? <img src={r.photo_url} alt="Report" className="w-full h-full object-cover" />
                            : <span style={{ fontSize: 20 }}>{meta.icon}</span>
                          }
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className={`type-badge ${meta.cls}`}>{meta.icon} {r.violation_type}</span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-4" style={{ maxWidth: 220 }}>
                        <p
                          className="text-xs"
                          style={{
                            color: '#94a3b8',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {r.description || <span style={{ color: '#475569' }}>—</span>}
                        </p>
                      </td>

                      {/* Coordinates */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs" style={{ color: '#64748b' }}>
                          {r.latitude.toFixed(4)},&nbsp;{r.longitude.toFixed(4)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4">
                        <span className="text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                          {fmtDate(r.timestamp)}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        {r.buffer_zone_flag === 1 ? (
                          <span className="badge badge-high-priority animate-pulse-slow">⚠️ Buffer Violation</span>
                        ) : (
                          <span className="text-xs text-slate-600">Standard</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-4">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* PDF Action */}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <a
                          href={`/api/reports/${r.id}/pdf`}
                          download
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/40 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400"
                        >
                          📄 Complaint PDF
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: '#475569' }}>
          Showing <strong style={{ color: '#94a3b8' }}>{sortedAndFiltered.length}</strong> of{' '}
          <strong style={{ color: '#94a3b8' }}>{reports.length}</strong> reports
        </p>
      </div>

      {/* ── Details & Admin Remarks Modal ────────────────────────────────────── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-emerald-400 mb-2">Complaint Details</h2>
            <div className="text-xs font-mono text-slate-500 mb-6">ID: #{selectedReport.id}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Violation Category</label>
                  <span className={`type-badge ${TYPE_META[selectedReport.violation_type]?.cls || 'type-other'}`}>
                    {TYPE_META[selectedReport.violation_type]?.icon} {selectedReport.violation_type}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">GPS Coordinates</label>
                  <span className="font-mono text-sm text-slate-300">{selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}</span>
                  {selectedReport.buffer_zone_flag === 1 && (
                    <div className="mt-1 text-xs text-orange-400 font-semibold animate-pulse-slow">
                      ⚠️ Inside Lake Buffer Zone (100m)
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Timestamp</label>
                  <span className="text-sm text-slate-300">{fmtDate(selectedReport.timestamp)}</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Upvote Confirmations</label>
                  <span className="text-sm text-slate-300 font-semibold">👍 {selectedReport.upvotes} citizens confirmed</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Change Status</label>
                  <select
                    id="modal-change-status"
                    className="select-field text-xs py-2"
                    style={{ minWidth: 160 }}
                    value={selectedReport.status}
                    disabled={updating === selectedReport.id}
                    onChange={e => updateStatus(selectedReport.id, e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Photo Evidence */}
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Photo Evidence</label>
                <div
                  className="rounded-xl overflow-hidden flex-1 flex items-center justify-center bg-slate-900/40 border border-slate-800"
                  style={{ minHeight: 180 }}
                >
                  {selectedReport.photo_url ? (
                    <img src={selectedReport.photo_url} alt="Evidence" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <span className="text-4xl block mb-2">{TYPE_META[selectedReport.violation_type]?.icon}</span>
                      <span className="text-xs text-slate-600">No photographic evidence attached.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Citizen Description</label>
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-sm text-slate-300 leading-relaxed">
                {selectedReport.description || 'No description provided.'}
              </div>
            </div>

            {/* Admin Remarks Section */}
            <div className="mb-6 pt-4 border-t border-slate-800/40">
              <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block mb-1.5">Action log / Admin Remarks</label>
              <textarea
                value={remarksText}
                onChange={e => setRemarksText(e.target.value)}
                placeholder="Log actions taken here (e.g. 'Notified BBMP Office on 14 July' or 'Assigned surveyor to map boundaries')..."
                className="input-field text-sm font-sans"
                rows={3}
              />
              <button
                onClick={saveRemarks}
                disabled={savingRemarks}
                className="btn-primary mt-2 text-xs"
                style={{ padding: '8px 16px' }}
              >
                {savingRemarks ? 'Saving...' : '✓ Save Remarks'}
              </button>
            </div>

            {/* Action Row */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/40">
              <a
                href={`/api/reports/${selectedReport.id}/pdf`}
                download
                className="btn-primary flex items-center gap-1.5 text-xs"
                style={{ padding: '9px 18px' }}
              >
                📄 Generate Complaint PDF
              </a>
              <button
                onClick={() => setSelectedReport(null)}
                className="btn-secondary text-xs"
                style={{ padding: '9px 18px' }}
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      <Toast toast={toast} />
    </main>
  )
}
