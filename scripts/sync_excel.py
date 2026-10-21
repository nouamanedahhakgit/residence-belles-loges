import urllib.request
import urllib.parse
import json
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
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

def format_phone_for_whatsapp(raw_tel):
    if not raw_tel:
        return ''
    clean = ''.join(c for c in str(raw_tel) if c.isdigit())
    if clean.startswith('0') and len(clean) == 10:
        return '212' + clean[1:]
    elif clean.startswith('00'):
        return clean[2:]
    elif clean.startswith('212'):
        return clean
    elif len(clean) >= 9:
        return clean
    return ''

def sync_supabase_to_excel():
    print(f'[{datetime.now().strftime("%H:%M:%S")}] Récupération des données depuis Supabase...')
    
    lots = query_supabase('lots')
    copros = query_supabase('coproprietaires')
    cotisations = query_supabase('cotisations_annuelles')

    copro_by_id = {c['id']: c for c in copros}
    lot_by_id = {l['id']: l for l in lots}
    
    cotis_map = {}
    for c in cotisations:
        l = lot_by_id.get(c['lot_id'])
        if l:
            cotis_map[(l['code_lot'], c['annee'])] = (c, l)
            cotis_map[(l['numero_lot'], c['annee'])] = (c, l)

    print(f'Chargement du fichier Excel : {EXCEL_PATH}')
    wb = openpyxl.load_workbook(EXCEL_PATH)

    # Styles d'en-tête
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    link_font = Font(name="Calibri", size=10, bold=True, color="0284C7", underline="single")
    wa_font = Font(name="Calibri", size=10, bold=True, color="16A34A", underline="single")
    align_center = Alignment(horizontal="center", vertical="center")

    # 1. Mettre à jour 'Cotisation 2026'
    if 'Cotisation 2026' in wb.sheetnames:
        ws = wb['Cotisation 2026']
        print('Mise à jour de la feuille Cotisation 2026 avec Liens WhatsApp & PDF Statiques...')

        # Titres des nouvelles colonnes
        ws.cell(6, 23).value = 'Lien PDF Statique'
        ws.cell(6, 23).fill = header_fill
        ws.cell(6, 23).font = header_font
        ws.cell(6, 23).alignment = align_center

        ws.cell(6, 24).value = '📲 ENVOYER WHATSAPP (1-CLIC)'
        ws.cell(6, 24).fill = PatternFill(start_color="166534", end_color="166534", fill_type="solid")
        ws.cell(6, 24).font = header_font
        ws.cell(6, 24).alignment = align_center

        ws.cell(6, 25).value = 'Message WhatsApp Prêt'
        ws.cell(6, 25).fill = header_fill
        ws.cell(6, 25).font = header_font
        ws.cell(6, 25).alignment = align_center

        ws.cell(6, 26).value = 'Lien Espace Client Direct'
        ws.cell(6, 26).fill = header_fill
        ws.cell(6, 26).font = header_font
        ws.cell(6, 26).alignment = align_center

        for r in range(7, 40):
            lot_val = str(ws.cell(r, 6).value or '').strip()
            nom_copro = str(ws.cell(r, 2).value or '').strip()

            match_data = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2026 and (k_lot in lot_val or lot_val in k_lot):
                    match_data = val
                    break
            
            if match_data:
                match_c, l_info = match_data
                lot_code = l_info['code_lot']

                # Mettre à jour les mois 1 à 12
                tot_paye = 0
                for m_idx in range(12):
                    col = 7 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    montant = match_c.get(col_key, 0)
                    ws.cell(r, col).value = montant
                    tot_paye += Number(montant) if str(montant).isdigit() else 0
                
                # Téléphone
                cp = copro_by_id.get(l_info.get('coproprietaire_id'))
                phone_raw = ws.cell(r, 3).value or (cp.get('telephone') if cp else '')
                if phone_raw and not ws.cell(r, 3).value:
                    ws.cell(r, 3).value = phone_raw

                # Calcul du reste et arriérés
                exige = 1800 if l_info['type_lot'] == 'magasin' else 3600
                reste_2026 = max(0, exige - tot_paye)
                arrieres = float(match_c.get('arrieres_anterieurs', 0) or 0)
                total_du = reste_2026 + arrieres

                # URLs statiques
                static_pdf_url = f'https://srbl.netlify.app/pdf/appel-{lot_code}.pdf'
                magic_client_url = f'https://srbl.netlify.app/?client={lot_code}'

                # Message WhatsApp pré-rédigé
                arrieres_txt = f' (dont arriérés : {int(arrieres)} DH)' if arrieres > 0 else ''
                msg_text = (
                    f"🏢 *SYNDICAT RÉSIDENCE BELLES LOGES*\n"
                    f"📍 Rue Attabari, Quartier Les Princesses, Casablanca\n\n"
                    f"Bonjour *{nom_copro}*,\n\n"
                    f"Veuillez trouver ci-dessous l'appel de cotisations syndicales pour votre bien (*{lot_val}* / {lot_code}) :\n\n"
                    f"📅 *Période :* Année 2026\n"
                    f"💰 *Total à régler :* *{int(total_du)} DH*{arrieres_txt}\n\n"
                    f"📄 *Télécharger votre document officiel (PDF) :*\n"
                    f"👉 {static_pdf_url}\n\n"
                    f"🏦 *Coordonnées bancaires pour le virement :*\n"
                    f"• *Bénéficiaire :* SYNDICAT RESIDENCE BELLES LOGES\n"
                    f"• *Banque :* BMCE / BANK OF AFRICA\n"
                    f"• *RIB :* `011 780 0000402100011545 25`\n\n"
                    f"_Motif : {lot_code} - {nom_copro}_\n\n"
                    f"Merci pour votre précieuse collaboration.\n"
                    f"*Le Bureau du Syndic*"
                )

                clean_phone = format_phone_for_whatsapp(phone_raw)
                encoded_msg = urllib.parse.quote(msg_text)
                wa_url = f'https://wa.me/{clean_phone}?text={encoded_msg}' if clean_phone else ''

                # Colonne 23: Lien PDF Statique
                ws.cell(r, 23).value = f'=HYPERLINK("{static_pdf_url}", "📄 Voir PDF ({lot_code})")'
                ws.cell(r, 23).font = link_font

                # Colonne 24: Lien WhatsApp 1-Clic
                if clean_phone:
                    ws.cell(r, 24).value = f'=HYPERLINK("{wa_url}", "📲 Envoyer WhatsApp Direct")'
                    ws.cell(r, 24).font = wa_font
                else:
                    ws.cell(r, 24).value = 'Pas de tél'
                    ws.cell(r, 24).font = Font(name="Calibri", size=9, italic=True, color="94A3B8")

                # Colonne 25: Message texte complet
                ws.cell(r, 25).value = msg_text

                # Colonne 26: Espace Client Direct
                ws.cell(r, 26).value = f'=HYPERLINK("{magic_client_url}", "👤 Espace Client ({lot_code})")'
                ws.cell(r, 26).font = link_font

        # Largeurs de colonnes
        ws.column_dimensions['W'].width = 20
        ws.column_dimensions['X'].width = 30
        ws.column_dimensions['Y'].width = 45
        ws.column_dimensions['Z'].width = 25

    # 2. Mettre à jour 'Cotisation 2025'
    if 'Cotisation 2025' in wb.sheetnames:
        ws = wb['Cotisation 2025']
        for r in range(7, 40):
            lot_val = str(ws.cell(r, 7).value or '').strip()
            match_data = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2025 and (k_lot in lot_val or lot_val in k_lot):
                    match_data = val
                    break
            
            if match_data:
                match_c, l_info = match_data
                for m_idx in range(12):
                    col = 8 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    ws.cell(r, col).value = match_c.get(col_key, 0)

    # 3. Mettre à jour 'Cotisation 2024'
    if 'Cotisation 2024' in wb.sheetnames:
        ws = wb['Cotisation 2024']
        for r in range(7, 40):
            lot_val = str(ws.cell(r, 7).value or '').strip()
            match_data = None
            for (k_lot, k_yr), val in cotis_map.items():
                if k_yr == 2024 and (k_lot in lot_val or lot_val in k_lot):
                    match_data = val
                    break
            
            if match_data:
                match_c, l_info = match_data
                for m_idx in range(12):
                    col = 8 + m_idx
                    col_key = f'm{m_idx+1:02d}'
                    ws.cell(r, col).value = match_c.get(col_key, 0)

    # Sauvegarder dans le repo
    wb.save(EXCEL_PATH)
    print(f'[OK] Sauvegarde dans : {EXCEL_PATH}')

    # Sauvegarder aussi dans OneDrive
    try:
        wb.save(ONEDRIVE_PATH)
        print(f'[OK] Copie synchronisée dans votre OneDrive : {ONEDRIVE_PATH}')
    except Exception as e:
        print(f'Note OneDrive: {e}')

if __name__ == '__main__':
    sync_supabase_to_excel()
