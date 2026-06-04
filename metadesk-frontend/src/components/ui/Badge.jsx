const STATUS = {
  todo:        { bg: '#F2F4F7', color: '#475467', label: 'To Do' },
  in_progress: { bg: '#EFF6FF', color: '#1D6EB0', label: 'In Progress' },
  review:      { bg: '#FFF6ED', color: '#B54708', label: 'In Review' },
  done:        { bg: '#F6FEF9', color: '#027A48', label: 'Done' },
  planning:    { bg: '#F5F3FF', color: '#5925DC', label: 'Planning' },
  active:      { bg: '#F6FEF9', color: '#027A48', label: 'Active' },
  on_hold:     { bg: '#FFF6ED', color: '#B54708', label: 'On Hold' },
  completed:   { bg: '#F6FEF9', color: '#027A48', label: 'Completed' },
  archived:    { bg: '#F2F4F7', color: '#475467', label: 'Archived' },
  pending:     { bg: '#FFF6ED', color: '#B54708', label: 'Pending' },
  approved:    { bg: '#F6FEF9', color: '#027A48', label: 'Approved' },
  declined:    { bg: '#FEF3F2', color: '#B42318', label: 'Declined' },
}

const PRIORITY = {
  low:      { bg: '#F6FEF9', color: '#027A48', border: '#ABEFC6' },
  medium:   { bg: '#FFF6ED', color: '#B54708', border: '#FEC84B' },
  high:     { bg: '#FEF3F2', color: '#B42318', border: '#FECDCA' },
  critical: { bg: '#FDF4FF', color: '#6941C6', border: '#E9D7FE' },
}

const ROLE = {
  ceo:      { bg: '#FEF3C7', color: '#92400E', label: 'CEO' },
  owner:    { bg: '#FEF3C7', color: '#92400E', label: 'CEO' },
  admin:    { bg: '#F5F3FF', color: '#5925DC', label: 'Admin' },
  manager:  { bg: '#EFF6FF', color: '#1D4ED8' },
  employee: { bg: '#F6FEF9', color: '#166534' },
}

export function StatusBadge({ status, style = {} }) {
  const s = STATUS[status] || { bg: '#F2F4F7', color: '#475467', label: status }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', ...style }}>
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority, style = {} }) {
  const p = PRIORITY[priority] || PRIORITY.medium
  return (
    <span style={{ background: p.bg, color: p.color, fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', border: `1px solid ${p.border}`, textTransform: 'capitalize', ...style }}>
      {priority}
    </span>
  )
}

export function RoleBadge({ role, style = {} }) {
  const r = ROLE[role] || ROLE.employee
  return (
    <span style={{ background: r.bg, color: r.color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', textTransform: 'capitalize', ...style }}>
      {r.label || role}
    </span>
  )
}
