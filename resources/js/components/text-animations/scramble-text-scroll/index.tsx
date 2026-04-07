import React, { useEffect, useRef } from "react"

interface ScrambledTextProps {
  text: string
  className?: string
  speed?: number
  step?: number
  threshold?: number
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  text,
  className = "",
  speed = 30,
  step = 1,
  threshold = 0.6,
}) => {
  const textRef = useRef<HTMLParagraphElement | null>(null)
  const isAnimating = useRef(false)

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}<>?/"

  const scramble = () => {
    if (!textRef.current || isAnimating.current) return

    isAnimating.current = true
    let iteration = 0

    const interval = setInterval(() => {
      if (!textRef.current) return

      textRef.current.innerText = text
        .split("")
        .map((letter, index) => {
          if (index < iteration) return text[index]
          return chars[Math.floor(Math.random() * chars.length)]
        })
        .join("")

      iteration += step

      if (iteration >= text.length) {
        clearInterval(interval)
        if (textRef.current) {
          textRef.current.innerText = text
        }
        isAnimating.current = false
      }
    }, speed)
  }

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scramble()
          }
        })
      },
      { threshold }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [text, threshold])

  return (
    <span ref={textRef} className={`inline-block ${className}`} style={{ lineHeight: '1.2', paddingBottom: '0.1em' }}>
      {text}
    </span>
  )
}

export default ScrambledText
