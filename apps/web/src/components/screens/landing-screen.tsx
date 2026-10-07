import { SignInButton } from '@clerk/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import App from '@/app'
import { InkClouds } from '@/components/ui/ink-clouds'

export interface LandingScreenProps {
  onAuditionGuest?: () => void
}

export function LandingScreen({ onAuditionGuest }: LandingScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isGuest, setIsGuest] = useState(false)

  const handleAuditionAsGuest = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.setItem('sonus_guest_mode', 'true')
    setIsGuest(true)
    if (onAuditionGuest) {
      onAuditionGuest()
    }
  }

  const handleExitGuest = () => {
    sessionStorage.removeItem('sonus_guest_mode')
    setIsGuest(false)
  }

  if (isGuest) {
    return <App isGuest={true} onExitGuest={handleExitGuest} />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8  } }
  }

  return (
    <div 
      className="bg-[#FAF7F0] text-[#2C2A29] selection:bg-[#2C2A29] selection:text-[#FAF7F0] min-h-screen flex flex-col relative parchment-texture" 
    >
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center relative z-10 w-full pointer-events-none">
        {/* Hero Content Container with staggered animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-7xl mx-auto px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pointer-events-none -mt-16"
        >
          {/* Hero Text (Left Column) */}
          <div className="lg:col-span-7 space-y-8 pointer-events-auto text-[#2C2A29]">
            <div className="space-y-4">
              <motion.h1 
                variants={itemVariants}
                className="hero-title-interactive font-serif tracking-tight leading-none cursor-default select-none group text-8xl md:text-[11rem]"
              >
                Sonus
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="font-serif text-xl md:text-2xl max-w-xl leading-relaxed pt-2 text-[#4d4541]"
              >
                Connect your microphone or instrument to track pitch precision, overtone resonance, and timing consistency with laboratory accuracy.
              </motion.p>
            </div>
          </div>

          {/* GOOGLE SIGN-IN CARD / MUSICIAN PORTAL (Right Column) */}
          <motion.div variants={itemVariants} className="lg:col-span-5 relative pointer-events-auto" id="signin">
            {/* The Ink is placed ONLY behind the login container */}
            <div className="absolute -inset-16 z-0 overflow-visible opacity-80 pointer-events-none">
              <InkClouds className="w-full h-full" />
            </div>

            <div className="bg-[#F4F1EA]/95 backdrop-blur-md border border-[#2C2A29] p-8 sm:p-10 shadow-none relative z-10">
              {/* Decorative Architectural Notch */}
              <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#9A2A2A]"></div>
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#9A2A2A]"></div>
              
              <div className="space-y-2 mb-6">
                <h2 className="font-serif text-2xl font-semibold text-[#2C2A29]">
                  Start Your Practice Session
                </h2>
                <p className="font-serif text-[#7E7570] leading-snug">
                  Immediate calibration for solo performers, ensembles, and teachers.
                </p>
              </div>

              {/* Clerk Sign In Button replacing static Google button */}
              <SignInButton mode="modal">
                <button className="w-full flex items-center justify-center gap-3 bg-white border border-[#2C2A29] hover:bg-[#EBE8E1] py-3 px-4 transition-all duration-150 group cursor-pointer" type="button">
                  <span className="font-mono text-xs tracking-wider uppercase text-[#2C2A29] font-medium group-hover:text-[#9A2A2A]">
                    Sign In
                  </span>
                </button>
              </SignInButton>

              {/* Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-[#2C2A29]/20"></div>
                <span className="bg-[#F4F1EA] px-3 font-mono text-xs text-[#7E7570] uppercase tracking-wider relative z-10">
                  or
                </span>
              </div>

              {/* Direct Entry Form (mock logic since Clerk handles real auth) */}
              <div className="space-y-4">
                {/* Secondary Quick Action Button - GUEST MODE */}
                <button 
                  onClick={handleAuditionAsGuest}
                  className="w-full bg-transparent hover:bg-[#EBE8E1] text-[#4d4541] hover:text-[#2C2A29] font-mono text-xs tracking-wider py-2.5 transition-colors border border-dashed border-[#2C2A29]/30 flex items-center justify-center gap-2 cursor-pointer" 
                  type="button"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9A2A2A]"></span>
                  Practice as Guest (Instant A440 Calibration)
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
