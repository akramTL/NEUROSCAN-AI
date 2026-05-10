import { motion } from 'framer-motion'

export default function GlassCard({
  children, style = {},
  glow = false,
  glowColor = 'rgba(99,102,241,0.3)',
  animate = true,
  delay = 0,
  onClick,
}) {
  const base = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: glow
      ? `0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4), 0 0 40px ${glowColor}`
      : '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
    padding: '20px 24px',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }

  if (!animate) {
    return (
      <div style={base} onClick={onClick}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      style={base}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -3,
        borderColor: 'rgba(99,102,241,0.35)',
        boxShadow: `0 0 0 1px rgba(99,102,241,0.3), 0 12px 40px rgba(99,102,241,0.15)${glow ? `, 0 0 60px ${glowColor}` : ''}`,
        transition: { duration: 0.2 },
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
