const CLASS = {
  AD:  'badge-ad',
  MCI: 'badge-mci',
  CN:  'badge-cn',
}

export default function ResultBadge({ result }) {
  if (!result) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
  return <span className={CLASS[result] ?? 'badge-pending'}>{result}</span>
}
