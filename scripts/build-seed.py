"""Regenerate the public content seed. Existing hosted rows are never overwritten."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'supabase/content.json').read_text())
statements = ['-- Public history snapshot. No credentials or private business data.', 'begin;']
for kind, records in data.items():
    rows = []
    for original in records:
        row = dict(original)
        if kind in ('companies', 'timeline'):
            row['reference_links'] = row.pop('references')
        if kind == 'articles':
            row = {
                'id': original['id'], 'title': original['title'],
                'publisher': original['publisher'], 'author': original.get('author', ''),
                'date_label': original.get('date', ''), 'date_sort': original.get('date', ''),
                'source_url': original['url'], 'categories': original['categories'],
                'article_type': original['type'], 'summary': original['summary'],
                'source_note': original.get('context', ''), 'evidence': original.get('evidence', ''),
                'metadata': original, 'status': 'published'
            }
        rows.append(row)
    columns = ','.join(rows[0])
    payload = json.dumps(rows, ensure_ascii=False).replace("'", "''")
    table = 'public.bfc_' + kind
    statements.append(f"insert into {table} ({columns}) select {columns} from jsonb_populate_recordset(null::{table}, '{payload}'::jsonb) on conflict (id) do nothing;")
statements.append('commit;')
(root / 'supabase/seed.sql').write_text('\n'.join(statements) + '\n')
print({k: len(v) for k, v in data.items()})
