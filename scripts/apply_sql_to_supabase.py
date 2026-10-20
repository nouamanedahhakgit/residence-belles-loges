import urllib.request
import json
import time

token = 'sbp_v0_e6e30b67538bedc018d0e57cbc2c5ff5afd7b1f7'
project_ref = 'fqoosiimrywjlvpwohem'

def execute_sql(sql_content, step_name):
    print(f'Executing {step_name}...')
    url = f'https://api.supabase.com/v1/projects/{project_ref}/database/query'
    payload = json.dumps({'query': sql_content}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f'Success {step_name}! Status:', resp.status)
            res = resp.read().decode('utf-8')
            if len(res) < 500:
                print('Response:', res)
            return True
    except urllib.error.HTTPError as e:
        print(f'Error executing {step_name}: HTTP {e.code}')
        err_msg = e.read().decode('utf-8')
        print('Details:', err_msg)
        return False

# 1. Run Schema
with open('c:/Users/n_dah/OneDrive/Documents/GITHUB/residence-belles-loges/supabase/schema.sql', 'r', encoding='utf-8') as f:
    schema_sql = f.read()

ok_schema = execute_sql(schema_sql, 'schema.sql')

if ok_schema:
    time.sleep(2)
    # 2. Run Seed
    with open('c:/Users/n_dah/OneDrive/Documents/GITHUB/residence-belles-loges/supabase/seed.sql', 'r', encoding='utf-8') as f:
        seed_sql = f.read()

    execute_sql(seed_sql, 'seed.sql')
