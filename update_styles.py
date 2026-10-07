import re

# 1. Update landing-screen.tsx for mix-blend-difference
with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    landing = f.read()

landing = landing.replace(
    '<div className="lg:col-span-7 space-y-8 pointer-events-auto">',
    '<div className="lg:col-span-7 space-y-8 pointer-events-auto mix-blend-difference text-white">'
)

landing = landing.replace(
    'className="hero-title-interactive font-headline-lg text-headline-lg tracking-tight text-primary leading-tight cursor-default select-none group text-6xl md:text-8xl"',
    'className="hero-title-interactive font-headline-lg text-headline-lg tracking-tight leading-tight cursor-default select-none group text-6xl md:text-8xl"'
)

landing = landing.replace(
    'className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed pt-2"',
    'className="font-body-lg text-body-lg max-w-xl leading-relaxed pt-2"'
)

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(landing)


# 2. Update interactive-ink-shader.tsx to restrict drops to edges
with open('apps/web/src/components/ui/interactive-ink-shader.tsx', 'r', encoding='utf-8') as f:
    shader = f.read()

old_drops = """  const [drops] = useState(() => Array.from({ length: 5 }, () => ({
    x: Math.random() * 0.8 + 0.1, 
    y: Math.random() * 0.8 + 0.1
  })))"""

new_drops = """  const [drops] = useState(() => [
    { x: 0.1 + Math.random() * 0.15, y: 0.1 + Math.random() * 0.15 }, // Top left
    { x: 0.75 + Math.random() * 0.15, y: 0.1 + Math.random() * 0.15 }, // Top right
    { x: 0.1 + Math.random() * 0.15, y: 0.75 + Math.random() * 0.15 }, // Bottom left
    { x: 0.75 + Math.random() * 0.15, y: 0.75 + Math.random() * 0.15 }, // Bottom right
    { x: 0.65 + Math.random() * 0.1, y: 0.45 + Math.random() * 0.2 }  // Mid right (behind login)
  ])"""

shader = shader.replace(old_drops, new_drops)

with open('apps/web/src/components/ui/interactive-ink-shader.tsx', 'w', encoding='utf-8') as f:
    f.write(shader)
