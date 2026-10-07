with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { InteractiveInkShader } from '@/components/ui/interactive-ink-shader'", "import { LivingManuscript } from '@/components/ui/living-manuscript'")
text = text.replace('<InteractiveInkShader />', '<LivingManuscript />')

# Also remove the mix-blend-difference from the main content since we are back to a light parchment bg without dense ink!
text = text.replace('mix-blend-difference text-white', 'text-primary')

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
