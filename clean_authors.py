import requests

s = requests.Session()
s.post('http://localhost:8000/api/auth/login', json={'email': 'admin@lizam.sa', 'password': 'Lizam@2026'})

r = s.get('http://localhost:8000/api/admin/authors')
authors = r.json()['items']

# Find duplicates by name_en
seen = {}
to_delete = []
for a in authors:
    key = a.get('name_en', '') or a.get('name_ar', '')
    if key in seen:
        to_delete.append(a['id'])
        print('DUP:', a['name_en'], '->', a['id'])
    else:
        seen[key] = a['id']

print(f"\nDeleting {len(to_delete)} duplicates...")
for aid in to_delete:
    s.delete(f'http://localhost:8000/api/admin/authors/{aid}/permanent')
    print('deleted:', aid)

print('Done. Remaining:', len(authors) - len(to_delete))
