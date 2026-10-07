with open('apps/web/src/components/ui/living-manuscript.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\\`\\${top}%\\`', '`${top}%`')
text = text.replace('\\`linear-gradient', '`linear-gradient')
text = text.replace('0.04) 100%\\n                )\\`', '0.04) 100%\\n                )`')

with open('apps/web/src/components/ui/living-manuscript.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
