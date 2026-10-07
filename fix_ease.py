with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('ease: [0.16, 1, 0.3, 1]', 'ease: "easeOut"')
with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
