import json

for path in [
    'c:/Users/n_dah/OneDrive/Documents/GITHUB/residence-belles-loges/data/bundle_data.json',
    'c:/Users/n_dah/OneDrive/Documents/GITHUB/residence-belles-loges/src/data/initialData.js'
]:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('"nom": "NMJ CAPITAL",\n    "tel": ""', '"nom": "NMJ CAPITAL",\n    "tel": "0669281802"')
    content = content.replace('"nom": "NMJ CAPITAL",\n    "tel": "",\n    "sec_tel": "",\n    "whatsapp": false', '"nom": "NMJ CAPITAL",\n    "tel": "0669281802",\n    "sec_tel": "",\n    "whatsapp": true')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated bundle_data.json and initialData.js successfully!')
