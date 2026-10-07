with open('apps/web/src/components/ui/living-manuscript.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('playNote(0.3)', 'playNote(0.7)')
text = text.replace('rgba(40, 35, 30, ${opacity * 0.7})', 'rgba(40, 35, 30, ${opacity * 1.0})')

with open('apps/web/src/components/ui/living-manuscript.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
