import urllib.request
import json
import os
import openpyxl
from datetime import datetime

# Chemins
EXCEL_PATH = r'c:\Users\n_dah\OneDrive\Documents\GITHUB\residence-belles-loges\data\Résidence BELLES LOGES-2026.xlsx'
ONEDRIVE_PATH = r'c:\Users\n_dah\OneDrive\Résidence BELLES LOGES-2026.xlsx'
ENV_PATH = r'c:\Users\n_dah\OneDrive\Documents\GITHUB\residence-belles-loges\.env'

def get_supabase_config():
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        env = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))
    return env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']

def query_supabase(table, select='*', params=''):
    url, key = get_supabase_config()
    endpoint = f'{url}/rest/v1/{table}?select={select}{params}'
    req = urllib.request.Request(endpoint, headers={'apikey': key, 'Authorization': f'Bearer {key}'})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def sync_supabase_to_excel():
    print(f'[{datetime.now().strftime("%H:%M:%S")}] Récupération des données depuis Supabase...')
    
    lots = query_supabase('lots')
    copros = query_supabase('coproprietaires')
    cotisations = query_supabase('cotisations_annuelles')

    copro_by_id = {c['id']: c for c in copros}
    lot_by_id = {l['id']: l for l in lots}
    
    # Mapper par code de lot ou numero de lot
    # ex: 'Magasin N° 1' -> lot
    cotis_map = {} # (lot_code, annee) -> cotis
    for c in cotisations:
        l = lot_by_id.get(c['lot_id'])
        if l:
            cotis_map[(l['code_lot'], c['annee'])] = c
            cotis_map[(l['numero_lot'], c['annee'])] = c

    print(f'Chargement du fichier Excel : {EXCEL_PATH}')
    wb = openpyxl.load_workbook(EXCEL_PATH)

    # 1. Mettre à jour 'Cotisation 2026'
    if 'Cotisation 2026' in wb.sheetnames:
        ws = wb['Cotisation 2026']
        print('Mise à jour de la feuille Cotisation 2026...')
        for r in range(7, 40):
            lot_val = str(ws.cell(r, 6).value or '').strip()
            # Chercher dans cotis_map
            match_c = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2026 and (k_lot in lot_val or lot_val in k_lot):
                    match_c = val
                    break
            
            if match_c:
                # Colonnes 7 à 18 sont Janvier à Décembre
                for m_idx in range(12):
                    col = 7 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    montant = match_c.get(col_key, 0)
                    ws.cell(r, col).value = montant
                
                # Mettre à jour le téléphone si manquant
                l_info = lot_by_id.get(match_c['lot_id'])
                if l_info:
                    cp = copro_by_id.get(l_info.get('coproprietaire_id'))
                    if cp and cp.get('telephone') and not ws.cell(r, 3).value:
                        ws.cell(r, 3).value = cp['telephone']

    # 2. Mettre à jour 'Cotisation 2025'
    if 'Cotisation 2025' in wb.sheetnames:
        ws = wb['Cotisation 2025']
        print('Mise à jour de la feuille Cotisation 2025...')
        for r in range(7, 40):
            lot_val = str(ws.cell(r, 7).value or '').strip()
            match_c = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2025 and (k_lot in lot_val or lot_val in k_lot):
                    match_c = val
                    break
            
            if match_c:
                # Colonnes 8 à 19 sont Janvier à Décembre
                for m_idx in range(12):
                    col = 8 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    ws.cell(r, col).value = match_c.get(col_key, 0)

    # 3. Mettre à jour 'Cotisation 2024'
    if 'Cotisation 2024' in wb.sheetnames:
        ws = wb['Cotisation 2024']
        print('Mise à jour de la feuille Cotisation 2024...')
        for r in range(7, 40):
            lot_val = str(ws.cell(r, 7).value or '').strip()
            match_c = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2024 and (k_lot in lot_val or lot_val in k_lot):
                    match_c = val
                    break
            
            if match_c:
                for m_idx in range(12):
                    col = 8 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    ws.cell(r, col).value = match_c.get(col_key, 0)

    # Sauvegarder dans le repo
    wb.save(EXCEL_PATH)
    print(f'[OK] Sauvegarde dans : {EXCEL_PATH}')

    # Sauvegarder aussi une copie directement dans OneDrive si accessible
    try:
        wb.save(ONEDRIVE_PATH)
        print(f'[OK] Copie synchronisee dans votre OneDrive : {ONEDRIVE_PATH}')
    except Exception as e:
        print(f'Note OneDrive: {e}')

if __name__ == '__main__':
    sync_supabase_to_excel()
