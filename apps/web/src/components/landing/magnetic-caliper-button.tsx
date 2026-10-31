import React, { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export type MagneticCaliperButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function MagneticCaliperButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
}: MagneticCaliperButtonProps): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const prefersReduced = useReducedMotion()

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReduced || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    // Subtle magnetic pull (dampened to 18%)
    setPosition({ x: distanceX * 0.18, y: distanceY * 0.18 })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const variantStyles = {
    primary:
      'bg-[#242321] text-[#FAF8F3] dark:bg-[#24221F] dark:text-[#EDE8DF] border border-[#242321] dark:border-[#C5A059]/60 hover:bg-[#3D3A36] dark:hover:bg-[#2E2A24] dark:hover:border-[#C5A059] hover:shadow-[0_4px_16px_rgba(197,160,89,0.18)]',
    secondary:
      'bg-[#FAF8F3] text-[#242321] dark:bg-[#1E1C1A] dark:text-[#EDE8DF] border border-[#C5A059] hover:bg-[#EFECE6] dark:hover:bg-[#2A2723]',
    outline:
      'bg-transparent text-[#242321] dark:text-[#EDE8DF] border border-[#E2DDD3] dark:border-[#38342E] hover:border-[#C5A059] dark:hover:border-[#C5A059]',
  }

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.5 }}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-sans font-semibold tracking-wide transition-all duration-200 active:scale-96 shadow-sm ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  )
}
