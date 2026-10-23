/**
 * ÔTAY BOX - Configuration Supabase & Paramètres Généraux
 * 
 * Instructions pour l'administratrice :
 * 1. Créez un projet gratuit sur https://supabase.com
 * 2. Dans votre tableau de bord Supabase : Projet Settings > API
 * 3. Copiez "Project URL" et "anon public key" ci-dessous.
 * 4. N'utilisez JAMAIS votre clé "service_role" dans ce fichier public.
 * 
 * Si ces variables restent vides, le site bascule automatiquement
 * sur le mode de démonstration / stockage local sécurisé pour vos tests.
 */

window.OTAY_CONFIG = {
    // URL de votre projet Supabase (ex: 'https://xyzcompany.supabase.co')
    SUPABASE_URL: '',

    // Clé publique anonyme (anon / publishable)
    SUPABASE_ANON_KEY: '',

    // Règle de livraison par défaut en Tunisie (en DT)
    SHIPPING_STANDARD_FEE: 9.000,
    SHIPPING_FREE_THRESHOLD: 150.000,

    // Lien officiel de votre boutique internationale ILEY'COM
    ILEYCOM_STORE_URL: 'https://ileycom.com/store/otay-box/',

    // E-mail de notification des commandes pour l'administratrice
    ADMIN_NOTIFICATION_EMAIL: 'contact@otaybox.tn',

    // Coordonnées de l'entreprise pour factures et devis
    COMPANY: {
        name: 'ÔTAY BOX',
        slogan: 'Rituels de bien-être, instants de douceur',
        phone: '+216 54 050 380',
        email: 'contact@otaybox.tn',
        website: 'https://otaybox.tn',
        address: 'Tunis, Tunisie',
        matricule_fiscal: '', // À compléter dans le Dashboard
        registre_commerce: '',
        regime_tva: 'Non assujetti'
    }
};
