with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { LivingManuscript } from '@/components/ui/living-manuscript'", "import { HarmonicSeismograph } from '@/components/ui/harmonic-seismograph'")
text = text.replace('<LivingManuscript />', '<HarmonicSeismograph />')

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
