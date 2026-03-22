import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement>(opts?: { rootMargin?: string; threshold?: number }) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        root: null,
        rootMargin: opts?.rootMargin ?? '0px 0px -12% 0px',
        threshold: opts?.threshold ?? 0.15,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [opts?.rootMargin, opts?.threshold])

  return { ref, inView }
}
