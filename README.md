# 🏢 Plateforme de Gestion Syndicale - Résidence BELLES LOGES (Casablanca)

Plateforme web moderne de gestion syndicale, de suivi des cotisations, de génération automatique des **Appels de Fonds en PDF** et de **relances WhatsApp avec liens directs (`wa.me`)**.

Conçue spécifiquement pour la **Résidence BELLES LOGES** (*Rue Attabari, Quartier Les Princesses, Casablanca*), conformément à la **Loi n° 18-00** régissant le statut de la copropriété des immeubles bâtis au Maroc.

---

## 🌟 Fonctionnalités Principales

### 1. 📊 Grille Matricielle Interactive (Remplacement complet d'Excel)
- **33 Lots gérés** : 4 Magasins (RDC - 150 DH/mois) et 29 Appartements (Étages 1 à 5 - 300 DH/mois).
- **Historique complet** : Suivi des exercices **2024, 2025 et 2026** pré-chargé depuis le fichier Excel d'origine.
- **Édition inline instantanée** : Cliquez sur n'importe quel mois pour modifier le montant avec recalcul instantané du total payé, du reste à payer et des arriérés.
- **Filtres par statut** : À jour, Partiel/En retard, Impayé total, Avec arriérés.
- **Export Excel (.xlsx)** : Téléchargez la situation financière à tout moment au format Excel compatible.

### 2. 📄 Générateur d'Appels de Fonds & Reçus en PDF (Vectoriel HD)
- **Fini les copier-coller dans Excel** : Génération instantanée en 1 clic de l'Appel de Fond officiel conforme à la feuille *Appel DE Fond* de l'Excel.
- **Conversion automatique des chiffres en lettres en français** : Ex: `3600 DH` ➔ `"TROIS MILLE SIX CENTS DIRHAMS"`.
- **Mentions légales & Coordonnées bancaires complètes** :
  - **Bénéficiaire :** SYNDICAT RESIDENCE BELLES LOGES
  - **Banque :** BMCE Bank of Africa
  - **RIB Officiel :** `011 780 0000402100011545 25`
- **Gestion multi-lots** : Regroupe automatiquement plusieurs lots appartenant au même propriétaire (ex: Magasin 2 + Magasin 3).
- **Génération de Reçus de Paiement (Format A5)** avec numéro de reçu et visa syndic.

### 3. 📱 Hub WhatsApp Intelligent (`wa.me` Direct Links)
- **Filtrage par statut** : Voyez immédiatement les copropriétaires en retard ou ayant des arriérés antérieurs.
- **Normalisation automatique des numéros marocains & internationaux** :
  - Convertit les numéros `0669...` ou `0705...` en format international `+2126...` compatible WhatsApp.
  - Gère les numéros multiples (ex: `0661214852 / 0664908843`).
- **Templates personnalisés en Français & en Darija Marocaine** :
  1. 📢 **Appel de Fond Officiel**
  2. ⏰ **Rappel Courtois**
  3. ⚠️ **Relance Urgente (Arriérés)**
  4. ✅ **Confirmation & Reçu de Paiement**
- **Envoi en 1 clic** : Ouvre directement WhatsApp Mobile ou WhatsApp Web avec le message pré-rempli contenant le nom, le lot, le montant exact dû, le RIB et le lien vers le document PDF.

---

## 🗄️ Architecture de la Base de Données Supabase

Le dossier `supabase/` contient tout le nécessaire pour déployer la base PostgreSQL :

1. `supabase/schema.sql` :
   - Table `residence_info` (Paramètres généraux et RIB)
   - Table `coproprietaires` (22 copropriétaires uniques, téléphones, flags WhatsApp)
   - Table `lots` (33 lots avec étages, types et codes normalisés `M01-M04`, `A01-A29`)
   - Table `cotisations_annuelles` (Matrice 12 mois, arriérés, totaux générés)
   - Table `paiements` (Historique des règlements par virement, chèque ou espèces)
   - Table `appels_de_fond` (Historique des appels émis)
   - Table `historique_whatsapp` (Journal des messages envoyés)
   - Vue `vue_situation_lots` (Vue en temps réel avec statut calculé)
   - Politiques de sécurité **Row Level Security (RLS)**

2. `supabase/seed.sql` :
   - **86 Ko de données SQL** contenant l'intégralité des paiements et soldes extraits du fichier Excel original (`Résidence BELLES LOGES-2026.xlsx`).

---

## 🚀 Guide de Déploiement

### Étape 1 : Configurer Supabase
1. Créez un projet gratuit sur [Supabase](https://supabase.com).
2. Ouvrez **SQL Editor** et exécutez le script `supabase/schema.sql`.
3. Exécutez ensuite le script `supabase/seed.sql`.
4. Allez dans **Project Settings > API** et copiez :
   - L'URL du projet (`Project URL`)
   - La clé anonyme publique (`anon public key`)

### Étape 2 : Configurer les Variables d'Environnement
Créez un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Note : Si vous ne configurez pas Supabase immédiatement, l'application fonctionne à 100% en mode local grâce aux données pré-intégrées).*

### Étape 3 : Déploiement sur Netlify
Le projet inclut déjà `netlify.toml` et `public/_redirects` pour un déploiement sans friction :
1. Poussez ce dépôt sur votre compte **GitHub**.
2. Connectez-vous sur [Netlify](https://www.netlify.com).
3. Cliquez sur **"Add new site" > "Import an existing project"** et sélectionnez votre dépôt GitHub.
4. Dans les paramètres de build :
   - **Build command :** `npm run build`
   - **Publish directory :** `dist`
5. Dans **Site configuration > Environment variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Cliquez sur **Deploy** ! Votre application est en ligne en ~1 minute.

---

## 💻 Développement Local

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Construction de la version de production
npm run build
```

---

## 📜 Mentions Légales
- **Copropriété :** SYNDICAT RÉSIDENCE BELLES LOGES
- **Adresse :** Rue Attabari, Quartier Les Princesses, Casablanca, Maroc
- **Cadre juridique :** Loi n° 18-00 relative au statut de la copropriété des immeubles bâtis (Dahir n° 1-02-298).
