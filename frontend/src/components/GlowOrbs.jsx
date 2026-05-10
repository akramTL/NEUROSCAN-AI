export default function GlowOrbs() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 0, pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-20%', left: '-10%',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        animation: 'orb-float 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-10%',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        animation: 'orb-float 15s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute',
        top: '40%', left: '50%',
        width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        animation: 'orb-float 18s ease-in-out infinite 3s',
      }} />
    </div>
  )
}
