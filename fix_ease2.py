with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('ease: "easeOut"', '')
text = text.replace('duration: 0.8,', 'duration: 0.8')
with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
