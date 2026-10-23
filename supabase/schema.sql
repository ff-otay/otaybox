-- =============================================================================
-- ÔTAY BOX - SCHÉMA DE BASE DE DONNÉES SUPABASE (PostgreSQL)
-- Compatible Forfait Gratuit Supabase (0 €/mois)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table des Paramètres Globaux (Configuration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des paramètres par défaut
INSERT INTO settings (key, value, description) VALUES
('shipping', '{"standard_fee": 9.000, "free_threshold": 150.000}', 'Frais de livraison standard et seuil de gratuité en TND')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
('notifications', '{"admin_email": "contact@otaybox.tn", "notify_on_new_order": true}', 'Destinataire et options des alertes e-mail')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
('company', '{
    "name": "ÔTAY BOX",
    "slogan": "Rituels de bien-être, instants de douceur",
    "phone": "+216 54 050 380",
    "email": "contact@otaybox.tn",
    "website": "https://otaybox.tn",
    "ileycom_url": "https://ileycom.com/store/otay-box/",
    "matricule_fiscal": "",
    "registre_commerce": "",
    "regime_tva": "Exonéré / Non assujetti",
    "adresse": "Tunis, Tunisie"
}', 'Informations d''entreprise et mentions légales tunisiennes')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Table des Produits Officiels (Source de Vérité pour les Prix)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subtitle TEXT,
    price NUMERIC(10, 3) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion du catalogue officiel existant
INSERT INTO products (id, sku, name, category, subtitle, price, image_url, is_active) VALUES
(1, 'OTB-PRD-001', 'Box Jardin de douceur', 'infusions', 'Tisane artisanale', 59.000, 'assets/produit.webp', TRUE),
(6, 'OTB-PRD-006', 'Infusette cuillère cœur', 'accessoires', 'Accessoire en inox', 20.000, 'assets/Infusette.webp', TRUE),
(9, 'OTB-PRD-009', '3 Tisanes collection Jardin de douceur', 'infusions', 'Douceur bien-être', 24.000, 'assets/produit3.webp', TRUE),
(2, 'OTB-PRD-002', 'Bubble Mug en céramique', 'accessoires', 'Accessoire artisanal', 25.000, 'assets/produit1.webp', TRUE)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    subtitle = EXCLUDED.subtitle,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url;

-- -----------------------------------------------------------------------------
-- 3. Séquences pour la Numérotation Unique
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS quote_seq START WITH 2; -- Le n°1 est déjà attribué à la Clinique Ennasr
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1;

-- -----------------------------------------------------------------------------
-- 4. Table des Commandes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    origin TEXT NOT NULL DEFAULT 'otaybox.tn', -- 'otaybox.tn', 'ileycom', 'international_direct'
    
    -- Client
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    
    -- Livraison nationale (Tunisie)
    governorate TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_notes TEXT,
    
    -- Livraison internationale directe (le cas échéant)
    country TEXT DEFAULT 'Tunisie',
    postal_code TEXT,
    recipient_name TEXT,
    payer_name TEXT,
    currency TEXT DEFAULT 'TND',
    
    -- Financier
    subtotal NUMERIC(10, 3) NOT NULL,
    shipping_fee NUMERIC(10, 3) NOT NULL DEFAULT 9.000,
    discount NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    total NUMERIC(10, 3) NOT NULL,
    
    -- Les 3 Statuts Indépendants
    order_status TEXT NOT NULL DEFAULT 'Nouvelle',
    delivery_status TEXT NOT NULL DEFAULT 'Non préparée',
    payment_status TEXT NOT NULL DEFAULT 'En attente',
    payment_method TEXT NOT NULL DEFAULT 'Paiement à la livraison',
    
    -- Expédition & Transporteur
    carrier TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Suivi interne
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_client_phone ON orders(client_phone);
CREATE INDEX IF NOT EXISTS idx_orders_client_name ON orders(client_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_statuses ON orders(order_status, delivery_status, payment_status);

-- -----------------------------------------------------------------------------
-- 5. Table des Articles de Commande (Lignes de Panier)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    sku TEXT,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10, 3) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    discount NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    total_price NUMERIC(10, 3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 6. Table de l'Historique d'Audit des Commandes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_email TEXT DEFAULT 'Système',
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);

-- -----------------------------------------------------------------------------
-- 7. Table des Devis (Conforme au modèle Clinique Ennasr)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT UNIQUE NOT NULL, -- ex: OTB-DEV-2026-001
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    expected_delivery TEXT, -- ex: "Première semaine de décembre 2026"
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_date DATE,
    conditions JSONB, -- tableau des conditions commerciales
    subtotal NUMERIC(10, 3) NOT NULL,
    discount NUMERIC(10, 3) DEFAULT 0.000,
    shipping_fee NUMERIC(10, 3) DEFAULT 0.000,
    total NUMERIC(10, 3) NOT NULL,
    unit_price_after_discount NUMERIC(10, 3),
    quantity_reference INTEGER, -- ex: 100 coffrets
    status TEXT NOT NULL DEFAULT 'Validé', -- 'Brouillon', 'Envoyé', 'Validé', 'Refusé', 'Facturé'
    pdf_url TEXT,
    snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    designation TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 3) NOT NULL,
    total_price NUMERIC(10, 3) NOT NULL,
    position INTEGER DEFAULT 0
);

-- Insertion du Devis de Référence : Clinique Ennasr (OTB-DEV-2026-001)
DO $$
DECLARE
    v_quote_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM quotes WHERE quote_number = 'OTB-DEV-2026-001') THEN
        INSERT INTO quotes (
            id, quote_number, client_name, client_email, client_phone,
            expected_delivery, issue_date, validity_date, conditions,
            subtotal, discount, shipping_fee, total, unit_price_after_discount,
            quantity_reference, status
        ) VALUES (
            gen_random_uuid(),
            'OTB-DEV-2026-001',
            'Clinique Ennasr',
            'direction@clinique-ennasr.tn',
            '+216 71 800 000',
            'Première semaine de décembre 2026',
            '2026-10-22',
            '2026-11-22',
            '[
                "Tarif établi pour une commande de 100 coffrets.",
                "La personnalisation du coffret et de le mug est incluse dans le prix indiqué.",
                "Livraison prévue durant la première semaine de décembre 2026.",
                "La production sera lancée après validation du visuel de personnalisation et confirmation de la commande.",
                "Modalité de paiement : 50% avance à la confirmation de commande, 50% à la livraison (discutable)."
            ]'::jsonb,
            7580.000,
            552.000,
            0.000,
            7028.000,
            70.820,
            100,
            'Validé'
        ) RETURNING id INTO v_quote_id;

        INSERT INTO quote_items (quote_id, designation, description, quantity, unit_price, total_price, position) VALUES
        (v_quote_id, 'Coffret ÔTAY BOX – Jardin de Douceur', '3 infusions, mug, infusette et guide rituel', 100, 69.000, 6900.000, 1),
        (v_quote_id, 'Personnalisation au logo du client', 'Coffret et mug', 100, 6.800, 680.000, 2),
        (v_quote_id, 'Carte de réduction offerte par Mindyness', '(Coaching et bien-être)', 100, 0.000, 0.000, 3),
        (v_quote_id, 'Remise commerciale pour quantité de 8 %', NULL, 100, -5.520, -552.000, 4);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. Table des Factures Professionnelles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL, -- ex: OTB-FAC-2026-001
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_fiscal_id TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(10, 3) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 3) DEFAULT 0.000,
    shipping_fee NUMERIC(10, 3) DEFAULT 0.000,
    discount NUMERIC(10, 3) DEFAULT 0.000,
    total NUMERIC(10, 3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Émise', -- 'Émise', 'Payée', 'Annulée'
    legal_notes TEXT,
    pdf_url TEXT,
    snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    designation TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 3) NOT NULL,
    total_price NUMERIC(10, 3) NOT NULL,
    position INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 9. Fonction RPC Sécurisée : Création et Vérification de Commande Côté Serveur
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_verified_order(
    p_client_name TEXT,
    p_client_phone TEXT,
    p_client_email TEXT,
    p_governorate TEXT,
    p_city TEXT,
    p_address TEXT,
    p_delivery_notes TEXT,
    p_items JSONB,
    p_origin TEXT DEFAULT 'otaybox.tn'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_num TEXT;
    v_seq_val BIGINT;
    v_subtotal NUMERIC(10, 3) := 0;
    v_shipping_fee NUMERIC(10, 3) := 9.000;
    v_free_threshold NUMERIC(10, 3) := 150.000;
    v_total NUMERIC(10, 3);
    v_item JSONB;
    v_prod_id INTEGER;
    v_qty INTEGER;
    v_db_price NUMERIC(10, 3);
    v_db_name TEXT;
    v_db_sku TEXT;
    v_line_total NUMERIC(10, 3);
    v_shipping_settings JSONB;
BEGIN
    -- Validation minimale des champs obligatoires
    IF TRIM(COALESCE(p_client_name, '')) = '' THEN
        RAISE EXCEPTION 'Le nom du client est obligatoire.';
    END IF;
    IF TRIM(COALESCE(p_client_phone, '')) = '' THEN
        RAISE EXCEPTION 'Le numéro de téléphone est obligatoire.';
    END IF;
    IF TRIM(COALESCE(p_governorate, '')) = '' THEN
        RAISE EXCEPTION 'Le gouvernorat de livraison est obligatoire.';
    END IF;
    IF TRIM(COALESCE(p_city, '')) = '' THEN
        RAISE EXCEPTION 'La délégation/ville est obligatoire.';
    END IF;
    IF TRIM(COALESCE(p_address, '')) = '' THEN
        RAISE EXCEPTION 'L''adresse de livraison est obligatoire.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Le panier ne peut pas être vide.';
    END IF;

    -- Récupération dynamique des paramètres de livraison depuis la table settings
    SELECT value INTO v_shipping_settings FROM settings WHERE key = 'shipping';
    IF v_shipping_settings IS NOT NULL THEN
        v_shipping_fee := COALESCE((v_shipping_settings->>'standard_fee')::NUMERIC, 9.000);
        v_free_threshold := COALESCE((v_shipping_settings->>'free_threshold')::NUMERIC, 150.000);
    END IF;

    -- Recalcul strict de chaque ligne de produit depuis la table products officielle
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'id')::INTEGER;
        v_qty := (v_item->>'quantity')::INTEGER;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantité invalide pour le produit %', v_prod_id;
        END IF;

        SELECT price, name, sku INTO v_db_price, v_db_name, v_db_sku
        FROM products
        WHERE id = v_prod_id AND is_active = TRUE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produit ID % non disponible ou introuvable.', v_prod_id;
        END IF;

        v_line_total := v_db_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;
    END LOOP;

    -- Règle de livraison gratuite
    IF v_subtotal >= v_free_threshold THEN
        v_shipping_fee := 0.000;
    END IF;

    v_total := v_subtotal + v_shipping_fee;

    -- Génération du numéro de commande unique séquentiel
    SELECT nextval('order_seq') INTO v_seq_val;
    v_order_num := 'OTB-CMD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_seq_val::TEXT, 4, '0');

    -- Insertion de la commande dans la table orders
    INSERT INTO orders (
        order_number, origin,
        client_name, client_phone, client_email,
        governorate, city, address, delivery_notes,
        subtotal, shipping_fee, discount, total,
        order_status, delivery_status, payment_status, payment_method
    ) VALUES (
        v_order_num, COALESCE(p_origin, 'otaybox.tn'),
        TRIM(p_client_name), TRIM(p_client_phone), NULLIF(TRIM(p_client_email), ''),
        TRIM(p_governorate), TRIM(p_city), TRIM(p_address), NULLIF(TRIM(p_delivery_notes), ''),
        v_subtotal, v_shipping_fee, 0.000, v_total,
        'Nouvelle', 'Non préparée', 'En attente', 'Paiement à la livraison'
    ) RETURNING id INTO v_order_id;

    -- Insertion des lignes d'articles vérifiées
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'id')::INTEGER;
        v_qty := (v_item->>'quantity')::INTEGER;

        SELECT price, name, sku INTO v_db_price, v_db_name, v_db_sku
        FROM products WHERE id = v_prod_id;

        INSERT INTO order_items (
            order_id, product_id, sku, product_name,
            unit_price, quantity, discount, total_price
        ) VALUES (
            v_order_id, v_prod_id, v_db_sku, v_db_name,
            v_db_price, v_qty, 0.000, (v_db_price * v_qty)
        );
    END LOOP;

    -- Journalisation dans l'historique
    INSERT INTO order_history (order_id, user_email, action, new_value, notes)
    VALUES (v_order_id, 'Client Web', 'Création de la commande', 'Nouvelle', 'Commande passée en ligne sur otaybox.tn');

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'order_number', v_order_num,
        'subtotal', v_subtotal,
        'shipping_fee', v_shipping_fee,
        'total', v_total
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. Politiques de Sécurité RLS (Row Level Security)
-- -----------------------------------------------------------------------------
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Les produits actifs sont visibles publiquement en lecture seule
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

-- Les paramètres de livraison sont consultables publiquement
DROP POLICY IF EXISTS "Public can view shipping settings" ON settings;
CREATE POLICY "Public can view shipping settings" ON settings
    FOR SELECT TO anon, authenticated
    USING (key IN ('shipping', 'company'));

-- Tous les accès administratifs aux commandes, devis et factures nécessitent d'être authentifié
DROP POLICY IF EXISTS "Admins full access settings" ON settings;
CREATE POLICY "Admins full access settings" ON settings
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access products" ON products;
CREATE POLICY "Admins full access products" ON products
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access orders" ON orders;
CREATE POLICY "Admins full access orders" ON orders
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access order_items" ON order_items;
CREATE POLICY "Admins full access order_items" ON order_items
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access order_history" ON order_history;
CREATE POLICY "Admins full access order_history" ON order_history
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access quotes" ON quotes;
CREATE POLICY "Admins full access quotes" ON quotes
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access quote_items" ON quote_items;
CREATE POLICY "Admins full access quote_items" ON quote_items
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access invoices" ON invoices;
CREATE POLICY "Admins full access invoices" ON invoices
    FOR ALL TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins full access invoice_items" ON invoice_items;
CREATE POLICY "Admins full access invoice_items" ON invoice_items
    FOR ALL TO authenticated USING (TRUE);

-- Autoriser l'exécution de la fonction RPC de commande par le public
GRANT EXECUTE ON FUNCTION create_verified_order TO anon, authenticated;
