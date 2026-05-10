import { Loader2 } from 'lucide-react'

const CLASS = {
  pending:    'badge-pending',
  processing: 'badge-processing',
  completed:  'badge-completed',
  failed:     'badge-failed',
}

const LABEL = {
  pending:    'Pending',
  processing: 'Processing',
  completed:  'Completed',
  failed:     'Failed',
}

export default function StatusBadge({ status }) {
  if (!status) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
  return (
    <span className={CLASS[status] ?? 'badge-pending'} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {status === 'processing' && <Loader2 size={11} className="spin" />}
      {LABEL[status] ?? status}
    </span>
  )
}
