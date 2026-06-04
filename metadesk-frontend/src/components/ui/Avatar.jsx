const PALETTES = [
  { face: '#F8C7A5', hair: '#1F2937', shirt: '#2F85C8', accessory: 'none' },
  { face: '#D7A37C', hair: '#111827', shirt: '#8B5CF6', accessory: 'glasses' },
  { face: '#F1B995', hair: '#7C2D12', shirt: '#10B981', accessory: 'cap' },
  { face: '#C98F65', hair: '#3F2A1D', shirt: '#EC4899', accessory: 'none' },
  { face: '#FFD7B5', hair: '#0F172A', shirt: '#F59E0B', accessory: 'glasses' },
]

function hashFor(name = '') {
  return name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function hasCustomStyle(avatarStyle = {}) {
  return Object.keys(avatarStyle).some(key => avatarStyle[key] !== PALETTES[0][key])
}

function styleFor(name = '', avatarStyle = {}) {
  const base = PALETTES[hashFor(name) % PALETTES.length]
  return hasCustomStyle(avatarStyle) ? { ...base, ...avatarStyle } : base
}

export function CartoonAvatar({ name = '', avatarStyle = {}, size = 32, style = {} }) {
  const avatar = styleFor(name, avatarStyle)
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={name}
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0, background: '#EFF6FF', ...style }}
    >
      <circle cx="40" cy="40" r="40" fill="#EAF4FF" />
      <path d="M18 74c3-17 13-26 22-26s19 9 22 26H18z" fill={avatar.shirt} />
      <circle cx="40" cy="34" r="20" fill={avatar.face} />
      <path d="M21 31c3-16 13-23 25-21 10 2 16 10 14 24-8-8-20-5-30-12-2 4-5 7-9 9z" fill={avatar.hair} />
      <circle cx="33" cy="36" r="2.4" fill="#111827" />
      <circle cx="47" cy="36" r="2.4" fill="#111827" />
      <path d="M34 47c4 3 8 3 12 0" stroke="#7C2D12" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {avatar.accessory === 'glasses' && (
        <g stroke="#111827" strokeWidth="2" fill="none">
          <circle cx="33" cy="36" r="6" />
          <circle cx="47" cy="36" r="6" />
          <path d="M39 36h2" />
        </g>
      )}
      {avatar.accessory === 'cap' && (
        <g>
          <path d="M22 25c5-11 31-12 36 0v5H22v-5z" fill={avatar.shirt} />
          <path d="M50 29h18c-2 5-9 7-18 6v-6z" fill={avatar.shirt} />
        </g>
      )}
      {size <= 24 && (
        <text x="40" y="68" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
          {initials}
        </text>
      )}
    </svg>
  )
}

export default function Avatar({ name = '', avatar, avatarStyle, size = 32, style = {} }) {
  if (avatar) return (
    <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }} />
  )
  return <CartoonAvatar name={name} avatarStyle={avatarStyle} size={size} style={style} />
}

export function AvatarGroup({ users = [], max = 4, size = 28 }) {
  const visible = users.slice(0, max)
  const extra = users.length - max
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((u, i) => (
        <div key={u._id || i} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: visible.length - i, border: '2px solid #fff', borderRadius: '50%' }}>
          <Avatar name={u.name} avatar={u.avatar} avatarStyle={u.avatarStyle} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%', background: '#E2EDF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#2F85C8',
          marginLeft: -8, border: '2px solid #fff', flexShrink: 0,
        }}>
          +{extra}
        </div>
      )}
    </div>
  )
}
