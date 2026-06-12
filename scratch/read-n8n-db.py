import sqlite3
import json

conn = sqlite3.connect('n8n_database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT id, name, nodes FROM workflow_entity')
rows = cursor.fetchall()

print(f"Total workflows: {len(rows)}")
for r_id, name, nodes_str in rows:
    nodes = json.loads(nodes_str)
    print(f"\nWorkflow: {name} (ID: {r_id})")
    print("Nodes:")
    for n in nodes:
        name_node = n.get('name')
        type_node = n.get('type')
        print(f"  - {name_node} ({type_node})")
        # Si tiene prompt, mostrarlo
        params = n.get('parameters', {})
        if 'text' in params:
            print(f"    Prompt Text: {params['text'][:200]}...")
        if 'model' in params:
            print(f"    Model: {params['model']}")
