# Guide de Déploiement et de Maintenance — ÔTAY BOX

Ce document détaille l'architecture mise en place, les étapes d'activation en ligne avec Supabase (forfait gratuit 0 €/mois) et la procédure de maintenance de votre nouvelle solution e-commerce et d'administration.

---

## 1. Vue d'Ensemble de l'Architecture

- **Frontend Public & Dashboard** : 100 % HTML5, CSS3 et JavaScript ES6+ natif (sans framework lourd, préservant votre hébergement actuel sur **GitHub Pages**).
- **Backend & Base de Données** : **Supabase (PostgreSQL relationnel)** avec politiques de sécurité RLS (*Row Level Security*) et fonction serveur sécurisée `create_verified_order`.
- **Mode Dual (Local & Supabase)** :
  - **En local / sans configuration immédiate** : le site et le dashboard fonctionnent instantanément en mode autonome via `localStorage` sécurisé.
  - **En production avec Supabase** : il suffit de coller votre URL et votre clé publique dans `js/supabase-config.js` pour basculer sur votre base PostgreSQL en ligne.
- **Coût mensuel** : **0 € / mois** (forfait gratuit Supabase jusqu'à 500 Mo de base, 50 000 requêtes/mois, 1 Go de fichiers et e-mails transactionnels).

---

## 2. Déploiement de Supabase en 5 Minutes (0 €/mois)

### Étape 1 : Créer le projet Supabase
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et créez un compte gratuit.
2. Cliquez sur **New Project**.
3. Choisissez un nom (ex. `otay-box-db`), définissez un mot de passe fort pour la base de données et sélectionnez la région la plus proche (ex. *Frankfurt* ou *London*).

### Étape 2 : Exécuter le schéma de base de données
1. Dans votre tableau de bord Supabase, cliquez sur **SQL Editor** dans le menu latéral gauche.
2. Cliquez sur **New query**.
3. Ouvrez le fichier [`supabase/schema.sql`](file:///d:/otay-box/supabase/schema.sql) de votre dépôt, copiez l'intégralité de son contenu et collez-le dans l'éditeur.
4. Cliquez sur **Run** (Exécuter).
> Toutes vos tables (`orders`, `order_items`, `order_history`, `quotes`, `invoices`, `settings`, `products`), vos séquences de numérotation, vos règles de sécurité RLS et le devis de référence Clinique Ennasr (`OTB-DEV-2026-001`) sont créés automatiquement.

### Étape 3 : Créer le compte administratrice
1. Dans Supabase, allez dans **Authentication** > **Users**.
2. Cliquez sur **Add user** > **Create user**.
3. Renseignez l'adresse `contact@otaybox.tn` et votre mot de passe secret.
4. Cochez *Auto Confirm User* pour activer le compte immédiatement.

### Étape 4 : Lier le site à Supabase
1. Allez dans **Project Settings** (icône d'engrenage en bas à gauche) > **API**.
2. Copiez la valeur de **Project URL** et celle de **anon public** (ne copiez jamais la clé *service_role*).
3. Ouvrez le fichier [`js/supabase-config.js`](file:///d:/otay-box/js/supabase-config.js) et renseignez-les :
```javascript
window.OTAY_CONFIG = {
    SUPABASE_URL: 'https://votre-id-projet.supabase.co',
    SUPABASE_ANON_KEY: 'votre-cle-anon-publique-ici',
    SHIPPING_STANDARD_FEE: 9.000,
    SHIPPING_FREE_THRESHOLD: 150.000,
    ILEYCOM_STORE_URL: 'https://ileycom.com/store/otay-box/',
    ADMIN_NOTIFICATION_EMAIL: 'contact@otaybox.tn',
    ...
};
```

---

## 3. Accès au Dashboard d'Administration

- **URL d'accès** : [`/admin/login.html`](file:///d:/otay-box/admin/login.html) (ou via le lien discret *Espace Pro / Admin* dans le pied de page du site).
- **Identifiants en mode local / test** :
  - E-mail : `admin@otaybox.tn`
  - Mot de passe : `OtayBox2026!`
- **Identifiants en mode Supabase connecté** : l'e-mail et le mot de passe créés dans Supabase Authentication (`contact@otaybox.tn`).

### Fonctionnalités du Dashboard
1. **Tableau de bord principal** : Indicateurs KPI réels (Total commandes, Nouvelles, À confirmer, En préparation, Expédiées, Livrées, Annulées, Chiffre d'affaires encaissé).
2. **Gestion des commandes** :
   - Recherche instantanée par N° de commande, client, téléphone ou ville.
   - Filtres croisés par statut, origine et période.
   - Export des commandes en un clic au format CSV compatible Excel (`OTAY_BOX_Commandes_YYYY-MM-DD.csv`).
3. **Fiche détaillée de commande** :
   - Coordonnées client, historique des commandes, adresse de livraison et instructions.
   - Tableau des produits et récapitulatif financier.
   - **3 Statuts indépendants** : Statut Commande, Statut Livraison, Statut Paiement.
   - Saisie du transporteur et du numéro de suivi.
   - Notes internes privées et journal d'audit horodaté.
   - Bouton de génération de facture en 1 clic.
4. **Module Devis** :
   - Reproduction fidèle A4 du modèle Clinique Ennasr (`OTB-DEV-2026-001`).
   - Création de devis personnalisés avec prévisualisation vectorielle directe.
   - Bouton de téléchargement PDF immédiat.
   - Numérotation séquentielle automatique (`OTB-DEV-2026-002`, etc.).
5. **Module Factures** :
   - Création depuis une commande ou un devis.
   - Numérotation séquentielle (`OTB-FAC-2026-001`, etc.).
   - Respect des règles comptables tunisiennes et gestion paramétrable du Matricule Fiscal.
6. **Archives & Documents** :
   - Consultation centralisée de tous les devis et factures.
   - Bouton de sauvegarde intégrale des données au format JSON.
7. **International & ILEY'COM** :
   - Lien direct vers votre boutique créateur `https://ileycom.com/store/otay-box/`.
   - Enregistrement manuel des ventes ILEY'COM pour consolider vos statistiques sans double-compte.
   - Formulaire dédié pour les commandes internationales directes.
8. **Paramètres** :
   - Ajustement du tarif standard de livraison (9 DT par défaut) et du seuil de gratuité (150 DT par défaut).
   - Coordonnées officielles de l'entreprise et mentions légales.

---

## 4. Parcours Client & Ventes Internationales

- **Clients en Tunisie** :
  1. Ajout au panier sur `boutique.html`, `product.html` ou `box-detail.html`.
  2. Consultation du panier sur `cart.html` avec calcul dynamique des frais (9 DT ou Offert dès 150 DT).
  3. Formulaire de commande sécurisé sur `checkout.html` (Gouvernorat parmi les 24 gouvernorats tunisiens, délégation, adresse, téléphone).
  4. Recalcul serveur des prix officiels (protection anti-fraude).
  5. Confirmation avec référence unique `OTB-CMD-2026-XXXX` sur `confirmation.html` et notification e-mail.
- **Clients à l'étranger** :
  - Sur toutes les fiches produits, dans le panier et en haut de la boutique, un encart sobre et explicite invite les résidents à l'étranger à commander sur votre boutique ILEY'COM (`https://ileycom.com/store/otay-box/`).
  - Aucun visiteur n'est redirigé sans son accord préalable.

---

## 5. Procédure de Sauvegarde et Récupération

1. **Sauvegarde régulière depuis le Dashboard** :
   - Rendez-vous dans **Documents & PDF** ([`admin/documents.html`](file:///d:/otay-box/admin/documents.html)).
   - Cliquez sur **« Sauvegarder les données (JSON) »**.
   - Un fichier horodaté contenant toutes vos commandes, devis et factures est téléchargé sur votre ordinateur.
2. **Sauvegarde automatique Supabase** :
   - Supabase réalise des sauvegardes automatiques quotidiennes de votre base PostgreSQL. Vous pouvez également exporter un dump SQL à tout moment depuis *Database* > *Backups*.

---

## 6. Tests Automatisés

Une suite de tests complète a été créée dans [`tests/test-suite.js`](file:///d:/otay-box/tests/test-suite.js) et exécutée avec succès (11 / 11 tests réussis à 100 %) :
- Vérification de l'intégrité du catalogue officiel et de ses prix.
- Calcul des frais de port standard (9 DT) et gratuité dès 150 DT.
- Enregistrement et persistance d'une commande avec numéro unique.
- Indépendance des 3 statuts et journalisation de l'audit.
- Rendu vectoriel du modèle A4 Clinique Ennasr.
- Numérotation séquentielle des devis et des factures.
- Exactitude des liens vers la boutique ILEY'COM.
- Gestion stricte des erreurs et rejet des paniers vides.
