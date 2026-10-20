# 🏢 Guide Supabase - Résidence BELLES LOGES

Ce dossier contient les fichiers SQL nécessaires pour créer la base de données PostgreSQL dans votre compte Supabase et importer automatiquement l'intégralité des données du fichier Excel officiel.

---

## 📁 Fichiers inclus :
1. `schema.sql` : Création des tables, vues, relations, contraintes et politiques de sécurité (RLS).
2. `seed.sql` : Importation des 33 lots (Magasins & Appartements), 22 copropriétaires, et l'historique complet des cotisations mensuelles 2024, 2025 et 2026.

---

## 🚀 Étape par Étape : Déploiement sur Supabase (5 minutes)

### 1. Créer un projet Supabase
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **"New project"**.
3. Donnez un nom au projet : `residence-belles-loges`.
4. Définissez un mot de passe pour la base de données.
5. Sélectionnez la région la plus proche (ex: **Europe / Frankfurt** ou **London**).
6. Cliquez sur **"Create new project"**.

### 2. Exécuter le Schéma (`schema.sql`)
1. Dans le menu de gauche de Supabase, cliquez sur **"SQL Editor"** (icône `>_`).
2. Cliquez sur **"New query"**.
3. Ouvrez le fichier `supabase/schema.sql`, copiez l'intégralité de son contenu et collez-le dans l'éditeur.
4. Cliquez sur le bouton vert **"Run"** (ou `Ctrl + Entrée`).
   *Vous devez voir le message : `Success. No rows returned`.*

### 3. Injecter les Données du Fichier Excel (`seed.sql`)
1. Toujours dans **"SQL Editor"**, cliquez sur **"New query"**.
2. Ouvrez le fichier `supabase/seed.sql`, copiez tout son contenu et collez-le.
3. Cliquez sur **"Run"**.
   *Toutes les données de la Résidence Belles Loges (2024 à 2026) sont maintenant insérées dans Supabase !*

### 4. Récupérer vos identifiants pour `.env`
1. Dans le menu de gauche de Supabase, cliquez sur la roue crantée **Project Settings** (icône Paramètres).
2. Cliquez sur **"API"** dans la section "Configuration".
3. Copiez les deux valeurs :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API keys** -> clé **`anon` `public`** (ex: `eyJhbGciOi...`)

### 5. Configurer vos variables d'environnement
Créez un fichier `.env` à la racine du projet avec ces valeurs :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique_ici
```

---

## 🔒 Sécurité & Politiques RLS
- Les politiques RLS (`Row Level Security`) configurées dans `schema.sql` autorisent les requêtes publiques authenticated / anon avec contrôle d'intégrité, idéales pour l'application web de gestion syndicale et les liens d'appels de fonds.
