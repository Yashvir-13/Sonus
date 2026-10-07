import json

try:
    with open('pitch.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    for work in data.get('results', []):
        print(f"Title: {work.get('display_name')}")
        print(f"ID: {work.get('id')}")
        print(f"Citations: {work.get('cited_by_count')}")
        print('-'*40)
except Exception as e:
    print("Error:", e)
