"use client"

import { gsap } from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useRef, useState } from "react"

gsap.registerPlugin(ScrambleTextPlugin)

export interface HoverScrambleProps {
  duration?: number
  speed?: number
  scrambleChars?: string
  className?: string
  children: string
}

const HoverScramble: React.FC<HoverScrambleProps> = ({
  duration = 0.8,
  speed = 0.6,
  scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  className = "",
  children,
}) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  const handleMouseEnter = () => {
    if (!textRef.current || isHovering) return

    setIsHovering(true)

    tweenRef.current = gsap.to(textRef.current, {
      duration,
      scrambleText: {
        text: children,
        chars: scrambleChars,
        speed,
        revealDelay: 0,
      },
      ease: "none",
    })
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (tweenRef.current) {
      tweenRef.current.kill()
    }
    if (textRef.current) {
      textRef.current.textContent = children
    }
  }

  return (
    <span
      ref={textRef}
      className={`inline-block font-mono tracking-tight ${className}`}
      style={{ minWidth: `${children.length}ch` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  )
}

export default HoverScramble
