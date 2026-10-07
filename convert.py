import re

with open('C:/Users/yashv/.gemini/antigravity/brain/6b48f2b5-944c-4d99-b62a-72d1e62e3ff7/scratch/living_manuscript.html', 'r', encoding='utf-8') as f:
    text = f.read()

body_match = re.search(r'<body[^>]*>(.*?)</body>', text, re.DOTALL | re.IGNORECASE)
if body_match:
    body = body_match.group(1)
    
    # Very naive conversion
    body = body.replace('class=', 'className=')
    body = body.replace('<!--', '{/*')
    body = body.replace('-->', '*/}')
    
    # We will just write the JSX to a file and fix style manually or replace them.
    # The only style attributes in the body are style="top: 10%;", etc.
    body = re.sub(r'style="([^"]+)"', lambda m: f"style={{{{{m.group(1).split(':')[0]}: '{m.group(1).split(':')[1].strip().replace(';','')}'}}}}", body)
    
    with open('C:/Users/yashv/.gemini/antigravity/brain/6b48f2b5-944c-4d99-b62a-72d1e62e3ff7/scratch/converted.tsx', 'w', encoding='utf-8') as out:
        out.write(body)
