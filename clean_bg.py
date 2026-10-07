with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# Remove the old grid overlay since LivingManuscript handles the background styling entirely
text = re.sub(r'<div\s+className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-25".*?</div>', '', text, flags=re.DOTALL)

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
