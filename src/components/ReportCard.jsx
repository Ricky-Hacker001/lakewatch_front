import { useState, useEffect } from 'react'
import axios from 'axios'
import StatusBadge from './StatusBadge'

export const TYPE_META = {
  'Illegal Dumping':          { icon: '🗑️', cls: 'type-dumping' },
  'Construction Encroachment':{ icon: '🏗️', cls: 'type-construction' },
  'Industrial Sludge':        { icon: '⚗️', cls: 'type-sludge' },
  'Other':                    { icon: '⚠️', cls: 'type-other' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ReportCard({ report, onClick, onUpdate }) {
  const meta = TYPE_META[report.violation_type] ?? TYPE_META['Other']
  const [confirmed, setConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    try {
      const confirmedMap = JSON.parse(localStorage.getItem('lw_confirmed_reports') || '{}')
      if (confirmedMap[report.id]) {
        setConfirmed(true)
      }
    } catch (e) {
      console.error(e)
    }
  }, [report.id])

  const handleConfirm = async (e) => {
    e.stopPropagation()
    if (confirmed || confirmLoading) return
    setConfirmLoading(true)
    try {
      const { data } = await axios.post(`/api/reports/${report.id}/confirm`)
      
      // Save confirmation state locally to prevent duplicate clicks
      const confirmedMap = JSON.parse(localStorage.getItem('lw_confirmed_reports') || '{}')
      confirmedMap[report.id] = true
      localStorage.setItem('lw_confirmed_reports', JSON.stringify(confirmedMap))
      
      setConfirmed(true)
      if (onUpdate) {
        onUpdate(data)
      }
    } catch (err) {
      console.error('Failed to confirm report:', err)
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <article
      className="glass-card p-4 cursor-pointer animate-fade-in flex flex-col justify-between"
      style={{
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        minHeight: 360
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor  = 'rgba(34,197,94,0.35)'
        e.currentTarget.style.transform    = 'translateY(-3px)'
        e.currentTarget.style.boxShadow    = '0 12px 36px rgba(0,0,0,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor  = 'rgba(34,197,94,0.12)'
        e.currentTarget.style.transform    = 'translateY(0)'
        e.currentTarget.style.boxShadow    = 'none'
      }}
    >
      <div>
        {/* Thumbnail */}
        <div
          className="w-full rounded-xl mb-3 overflow-hidden flex-shrink-0 relative"
          style={{ height: 140, background: 'rgba(34,197,94,0.05)' }}
        >
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt={report.violation_type}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span style={{ fontSize: 36 }}>{meta.icon}</span>
              <span style={{ fontSize: 11, color: '#475569' }}>No photo</span>
            </div>
          )}

          {/* Buffer zone flag badge on top left of photo */}
          {report.buffer_zone_flag === 1 && (
            <span
              className="absolute top-2.5 left-2.5 badge badge-high-priority animate-pulse-slow shadow-lg"
              style={{ padding: '4px 9px', fontSize: '0.68rem', background: 'rgba(8,16,32,0.85)', backdropFilter: 'blur(4px)' }}
            >
              ⚠️ Buffer Violation
            </span>
          )}
        </div>

        {/* Type + status */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`type-badge ${meta.cls}`}>{meta.icon} {report.violation_type}</span>
          <StatusBadge status={report.status} />
        </div>

        {/* Description */}
        <p
          className="text-sm mb-3"
          style={{
            color: '#94a3b8',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {report.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer controls & info */}
      <div className="mt-4 pt-3 border-t border-emerald-950/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs" style={{ color: '#475569' }}>
            📅 {fmtDate(report.timestamp)}
          </span>
          <span className="font-mono text-xs" style={{ color: '#4ade80', fontSize: 10 }}>
            #{report.id}
          </span>
        </div>

        {/* Confirmation Button */}
        <button
          disabled={confirmed || confirmLoading}
          onClick={handleConfirm}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            confirmed
              ? 'bg-emerald-900/10 border border-emerald-500/20 text-emerald-500/80 cursor-default'
              : 'bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span>{confirmed ? '✓ Confirmed' : '👍 I confirm this too'}</span>
          {report.upvotes > 0 && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: confirmed ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.18)',
                color: '#4ade80'
              }}
            >
              {report.upvotes}
            </span>
          )}
        </button>
      </div>
    </article>
  )
}
