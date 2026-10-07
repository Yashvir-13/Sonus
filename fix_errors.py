import re

with open('apps/web/src/components/ui/interactive-ink-shader.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')", "const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null")

with open('apps/web/src/components/ui/interactive-ink-shader.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = text2.replace('class=', 'className=')
text2 = text2.replace("import { motion, useReducedMotion } from 'framer-motion'\n", "")
text2 = text2.replace("const prefersReducedMotion = useReducedMotion()\n", "")

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text2)
