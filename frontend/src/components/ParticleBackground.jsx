import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist/120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0, pointerEvents: 'none',
        opacity: 0.6,
      }}
    />
  )
}
