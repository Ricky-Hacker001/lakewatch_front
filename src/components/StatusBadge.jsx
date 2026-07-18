/**
 * StatusBadge — renders a coloured pill badge for New / Under Review / Resolved
 */
const CONFIG = {
  'New':          { cls: 'badge-new',      dot: '#60a5fa' },
  'Under Review': { cls: 'badge-review',   dot: '#fbbf24' },
  'Resolved':     { cls: 'badge-resolved', dot: '#4ade80' },
  'Escalated':    { cls: 'badge-escalated', dot: '#ef4444' },
}

export default function StatusBadge({ status }) {
  const { cls, dot } = CONFIG[status] ?? CONFIG['New']
  return (
    <span className={`badge ${cls}`}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  )
}
