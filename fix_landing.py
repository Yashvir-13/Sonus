with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add pointer-events-none to main so background catches hover events
text = text.replace('<main className="flex-grow flex items-center justify-center relative z-10 w-full">', '<main className="flex-grow flex items-center justify-center relative z-10 w-full pointer-events-none">')

# 2. Increase font size and push Sonus up.
text = text.replace('text-6xl md:text-8xl', 'text-8xl md:text-[11rem] md:leading-none -mt-16')

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
