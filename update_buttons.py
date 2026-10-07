import re

with open('apps/web/src/components/screens/landing-screen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'SignInButton' not in content:
    content = content.replace("import App from '@/app'", "import App from '@/app'\nimport { SignInButton } from '@clerk/react'")

# Replace the button
btn_start = '<button className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-charcoal hover:bg-surface-container-high py-3 px-4 transition-all duration-150 group" type="button">'
if btn_start in content:
    content = content.replace(btn_start, '<SignInButton mode="modal">' + btn_start)
    content = content.replace('Continue with Google\n              </span>\n</button>', 'Continue with Google\n              </span>\n</button>\n</SignInButton>')
    
# also the Sign In links at the top
content = content.replace('<a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 hidden sm:inline-block" href="#signin">\n          Sign In\n        </a>', '<SignInButton mode="modal"><button className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 hidden sm:inline-block">Sign In</button></SignInButton>')

with open('apps/web/src/components/screens/landing-screen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
