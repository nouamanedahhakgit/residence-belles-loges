import urllib.request
import json

token = 'sbp_v0_e6e30b67538bedc018d0e57cbc2c5ff5afd7b1f7'
project_ref = 'fqoosiimrywjlvpwohem'

req = urllib.request.Request(
    f'https://api.supabase.com/v1/projects/{project_ref}/api-keys',
    headers={'Authorization': f'Bearer {token}'}
)

with urllib.request.urlopen(req) as resp:
    keys = json.load(resp)
    
anon_key = None
service_key = None

for k in keys:
    name = k.get('name')
    val = k.get('api_key')
    print('Key name:', name)
    if name == 'anon':
        anon_key = val
    elif name == 'service_role':
        service_key = val

project_url = f'https://{project_ref}.supabase.co'
print('Project URL:', project_url)
print('Anon key prefix:', anon_key[:15] if anon_key else 'None')

# Write to .env
env_content = f'''# Supabase Configuration for Residence Belles Loges (SRBL)
VITE_SUPABASE_URL={project_url}
VITE_SUPABASE_ANON_KEY={anon_key}
VITE_ENABLE_LOCAL_FALLBACK=true
'''

with open('c:/Users/n_dah/OneDrive/Documents/GITHUB/residence-belles-loges/.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

print('.env updated successfully with real Supabase credentials!')
