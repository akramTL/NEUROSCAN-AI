import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export default function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || typeof value !== 'number') return
    const start = performance.now()
    const animate = now => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setDisplay(Math.round(eased * value))
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, inView, duration])

  return <span ref={ref}>{display}</span>
}
