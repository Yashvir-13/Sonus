with open('apps/web/src/components/ui/living-manuscript.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const [drops, setDrops]', 'const [, setDrops]')

with open('apps/web/src/components/ui/living-manuscript.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
