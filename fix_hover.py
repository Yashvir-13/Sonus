with open('apps/web/src/styles/index.css', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('color: #65d5d5;', 'color: #9A2A2A;')
text = text.replace('rgba(101, 213, 213, 0.15)', 'rgba(154, 42, 42, 0.15)')

with open('apps/web/src/styles/index.css', 'w', encoding='utf-8') as f:
    f.write(text)
