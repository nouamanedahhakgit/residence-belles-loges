import json
import os

os.makedirs('supabase', exist_ok=True)

with open('data/bundle_data.json', 'r', encoding='utf-8') as f:
    bundle = json.load(f)

# 1. Generate schema.sql
schema_sql = '''-- ====================================================================
-- SCHEMA DE GESTION SYNDICALE - RESIDENCE BELLES LOGES (CASABLANCA)
-- Conforme a la loi 18-00 relative a la copropriete au Maroc
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE DES INFORMATIONS DE LA RESIDENCE
CREATE TABLE IF NOT EXISTS public.residence_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL DEFAULT 'SYNDICAT RESIDENCE BELLES LOGES',
    adresse TEXT NOT NULL DEFAULT 'RUE ATTABARI, QUARTIER LES PRINCESSES, CASABLANCA',
    ville TEXT NOT NULL DEFAULT 'Casablanca',
    pays TEXT NOT NULL DEFAULT 'Maroc',
    rib TEXT NOT NULL DEFAULT '011 780 0000402100011545 25',
    banque TEXT NOT NULL DEFAULT 'BMCE Bank of Africa',
    titulaire_compte TEXT NOT NULL DEFAULT 'SYNDICAT RESIDENCE BELLES LOGES',
    cotisation_appartement NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    cotisation_magasin NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    loi_reference TEXT NOT NULL DEFAULT 'Loi 18-00 relative a la copropriete des immeubles batis',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES COPROPRIETAIRES
CREATE TABLE IF NOT EXISTS public.coproprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet TEXT NOT NULL,
    telephone TEXT,
    telephone_secondaire TEXT,
    email TEXT,
    whatsapp_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES LOTS (APPARTEMENTS & MAGASINS)
CREATE TABLE IF NOT EXISTS public.lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_lot TEXT NOT NULL UNIQUE, -- ex: 'M01', 'M02', 'A01', ..., 'A29'
    numero_lot TEXT NOT NULL,      -- ex: 'Magasin N° 1', 'Appartement N°1'
    type_lot TEXT NOT NULL CHECK (type_lot IN ('appartement', 'magasin')),
    etage TEXT NOT NULL,           -- 'RDC', '1', '2', '3', '4', '5'
    coproprietaire_id UUID REFERENCES public.coproprietaires(id) ON DELETE SET NULL,
    date_acquisition DATE,
    cotisation_mensuelle NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE DES COTISATIONS ANNUELLES & MOIS (MATRICE 12 MOIS)
CREATE TABLE IF NOT EXISTS public.cotisations_annuelles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    m01 NUMERIC(10, 2) DEFAULT 0.00,
    m02 NUMERIC(10, 2) DEFAULT 0.00,
    m03 NUMERIC(10, 2) DEFAULT 0.00,
    m04 NUMERIC(10, 2) DEFAULT 0.00,
    m05 NUMERIC(10, 2) DEFAULT 0.00,
    m06 NUMERIC(10, 2) DEFAULT 0.00,
    m07 NUMERIC(10, 2) DEFAULT 0.00,
    m08 NUMERIC(10, 2) DEFAULT 0.00,
    m09 NUMERIC(10, 2) DEFAULT 0.00,
    m10 NUMERIC(10, 2) DEFAULT 0.00,
    m11 NUMERIC(10, 2) DEFAULT 0.00,
    m12 NUMERIC(10, 2) DEFAULT 0.00,
    montant_exige_annuel NUMERIC(10, 2) NOT NULL DEFAULT 3600.00,
    arrieres_anterieurs NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lot_id, annee)
);

-- 6. TABLE DES PAIEMENTS INDIVIDUELS (AVEC METHODE & RECU)
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    mois INT[] NOT NULL,
    montant NUMERIC(10, 2) NOT NULL,
    mode_paiement TEXT NOT NULL DEFAULT 'virement' CHECK (mode_paiement IN ('virement', 'cheque', 'especes', 'versement')),
    reference_paiement TEXT,
    date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
    remarques TEXT,
    recu_genere BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE DES APPELS DE FONDS GENERES
CREATE TABLE IF NOT EXISTS public.appels_de_fond (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_reference TEXT NOT NULL UNIQUE,
    coproprietaire_id UUID REFERENCES public.coproprietaires(id) ON DELETE CASCADE,
    lot_ids UUID[] NOT NULL,
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    libelle_periode TEXT NOT NULL,
    montant_total NUMERIC(10, 2) NOT NULL,
    montant_en_lettres TEXT NOT NULL,
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance DATE,
    statut TEXT NOT NULL DEFAULT 'emis' CHECK (statut IN ('emis', 'envoye_whatsapp', 'paye', 'partiel', 'annule')),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE DU JOURNAL WHATSAPP
CREATE TABLE IF NOT EXISTS public.historique_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
    coproprietaire_id UUID REFERENCES public.coproprietaires(id) ON DELETE SET NULL,
    destinataire_tel TEXT NOT NULL,
    destinataire_nom TEXT NOT NULL,
    type_message TEXT NOT NULL CHECK (type_message IN ('appel_fond', 'relance_courtoise', 'mise_en_demeure', 'recu_paiement', 'autre')),
    message_texte TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'envoye' CHECK (statut IN ('prepare', 'envoye', 'echec')),
    envoye_le TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VUE STATUT DES COTISATIONS & SOLDE PAR LOT
CREATE OR REPLACE VIEW public.vue_situation_lots AS
SELECT 
    c.id AS cotisation_id,
    c.annee,
    l.id AS lot_id,
    l.code_lot,
    l.numero_lot,
    l.type_lot,
    l.etage,
    l.cotisation_mensuelle,
    p.id AS coproprietaire_id,
    p.nom_complet,
    p.telephone,
    p.telephone_secondaire,
    p.whatsapp_active,
    c.m01, c.m02, c.m03, c.m04, c.m05, c.m06,
    c.m07, c.m08, c.m09, c.m10, c.m11, c.m12,
    (c.m01 + c.m02 + c.m03 + c.m04 + c.m05 + c.m06 + c.m07 + c.m08 + c.m09 + c.m10 + c.m11 + c.m12) AS total_paye,
    c.montant_exige_annuel,
    c.arrieres_anterieurs,
    -- Solde annuel courant: paye - exige
    ((c.m01 + c.m02 + c.m03 + c.m04 + c.m05 + c.m06 + c.m07 + c.m08 + c.m09 + c.m10 + c.m11 + c.m12) - c.montant_exige_annuel) AS solde_annuel,
    -- Solde global incluant arrieres
    ((c.m01 + c.m02 + c.m03 + c.m04 + c.m05 + c.m06 + c.m07 + c.m08 + c.m09 + c.m10 + c.m11 + c.m12) - c.montant_exige_annuel - c.arrieres_anterieurs) AS solde_global,
    -- Statut du lot
    CASE 
        WHEN ((c.m01 + c.m02 + c.m03 + c.m04 + c.m05 + c.m06 + c.m07 + c.m08 + c.m09 + c.m10 + c.m11 + c.m12) - c.montant_exige_annuel - c.arrieres_anterieurs) >= 0 THEN 'a_jour'
        WHEN (c.m01 + c.m02 + c.m03 + c.m04 + c.m05 + c.m06 + c.m07 + c.m08 + c.m09 + c.m10 + c.m11 + c.m12) > 0 THEN 'partiel'
        ELSE 'impaye'
    END AS statut_paiement
FROM public.cotisations_annuelles c
JOIN public.lots l ON l.id = c.lot_id
LEFT JOIN public.coproprietaires p ON p.id = l.coproprietaire_id;

-- 10. POLITIQUES RLS
ALTER TABLE public.residence_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coproprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations_annuelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_de_fond ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces public residence" ON public.residence_info FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public coproprietaires" ON public.coproprietaires FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public lots" ON public.lots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public cotisations" ON public.cotisations_annuelles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public paiements" ON public.paiements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public appels" ON public.appels_de_fond FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public whatsapp" ON public.historique_whatsapp FOR ALL USING (true) WITH CHECK (true);
'''

with open('supabase/schema.sql', 'w', encoding='utf-8') as f:
    f.write(schema_sql)

# 2. Generate seed.sql
lines = []
lines.append('-- ====================================================================')
lines.append('-- DONNEES INITIALES (SEED) - RESIDENCE BELLES LOGES')
lines.append('-- Genere a partir du fichier officiel Excel: Residence BELLES LOGES')
lines.append('-- ====================================================================')
lines.append('')
lines.append('-- 1. Info Residence')
res_nom = bundle['residence']['nom'].replace("'", "''")
res_adr = bundle['residence']['adresse'].replace("'", "''")
res_rib = bundle['residence']['rib'].replace("'", "''")
res_cpt = bundle['residence']['compte'].replace("'", "''")
lines.append(f"INSERT INTO public.residence_info (nom, adresse, ville, rib, banque, titulaire_compte, cotisation_appartement, cotisation_magasin) VALUES ('{res_nom}', '{res_adr}', 'Casablanca', '{res_rib}', 'BMCE Bank of Africa', '{res_cpt}', 300, 150) ON CONFLICT DO NOTHING;")
lines.append('')

lines.append('-- 2. Copropriétaires')
for c in bundle['coproprietaires']:
    nom = c['nom'].replace("'", "''")
    tel = c['tel'].replace("'", "''")
    sec_tel = c['sec_tel'].replace("'", "''")
    lines.append(f"INSERT INTO public.coproprietaires (id, nom_complet, telephone, telephone_secondaire, whatsapp_active) VALUES ('{c['id']}', '{nom}', '{tel}', '{sec_tel}', {'TRUE' if c['whatsapp'] else 'FALSE'}) ON CONFLICT (id) DO UPDATE SET nom_complet=EXCLUDED.nom_complet, telephone=EXCLUDED.telephone;")
lines.append('')

lines.append('-- 3. Lots')
for l in bundle['lots']:
    nom = l['nom'].replace("'", "''")
    code = l['code'].replace("'", "''")
    date_acq = f"'{l['date_acq']}'" if l['date_acq'] else 'NULL'
    cid = f"'{l['copro_id']}'" if l['copro_id'] else 'NULL'
    lines.append(f"INSERT INTO public.lots (id, code_lot, numero_lot, type_lot, etage, coproprietaire_id, date_acquisition, cotisation_mensuelle) VALUES ('{l['id']}', '{code}', '{nom}', '{l['type']}', '{l['etage']}', {cid}, {date_acq}, {l['cotisation']}) ON CONFLICT (code_lot) DO UPDATE SET coproprietaire_id=EXCLUDED.coproprietaire_id, etage=EXCLUDED.etage;")
lines.append('')

lines.append('-- 4. Cotisations Annuelles')
for ct in bundle['cotisations']:
    m_sql = ', '.join([str(m) for m in ct['months']])
    lines.append(f"INSERT INTO public.cotisations_annuelles (lot_id, annee, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, montant_exige_annuel, arrieres_anterieurs) VALUES ('{ct['lot_id']}', {ct['annee']}, {m_sql}, {ct['montant_annuel']}, {ct['arrieres']}) ON CONFLICT (lot_id, annee) DO UPDATE SET m01=EXCLUDED.m01, m02=EXCLUDED.m02, m03=EXCLUDED.m03, m04=EXCLUDED.m04, m05=EXCLUDED.m05, m06=EXCLUDED.m06, m07=EXCLUDED.m07, m08=EXCLUDED.m08, m09=EXCLUDED.m09, m10=EXCLUDED.m10, m11=EXCLUDED.m11, m12=EXCLUDED.m12, montant_exige_annuel=EXCLUDED.montant_exige_annuel, arrieres_anterieurs=EXCLUDED.arrieres_anterieurs;")
lines.append('')

with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Generated supabase/schema.sql and supabase/seed.sql successfully!')
