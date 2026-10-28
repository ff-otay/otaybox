/**
 * ÔTAY BOX - Module API & Abstraction de Données
 * Gère la communication avec Supabase (PostgreSQL / Auth / Storage)
 * avec bascule automatique sur stockage local persistant en mode démonstration/test.
 */

(function(window) {
    'use strict';

    // Catalogue officiel de référence (garantit l'intégrité des prix côté client et serveur)
    const OFFICIAL_CATALOG = [
        { id: 1, sku: 'OTB-PRD-001', name: 'Box Jardin de douceur', category: 'coffrets', subtitle: 'Coffret bien-être signature', price: 59.000, img: 'assets/produit.webp' },
        { id: 6, sku: 'OTB-PRD-006', name: 'Infusette cuillère cœur', category: 'accessoires', subtitle: 'Accessoire en inox', price: 20.000, img: 'assets/Infusette.webp' },
        { id: 9, sku: 'OTB-PRD-009', name: '3 Tisanes collection Jardin de douceur', category: 'tisanes', subtitle: 'Douceur bien-être', price: 24.000, img: 'assets/produit3.webp' },
        { id: 2, sku: 'OTB-PRD-002', name: 'Bubble Mug en céramique', category: 'accessoires', subtitle: 'Accessoire artisanal', price: 25.000, img: 'assets/produit1.webp' }
    ];

    let supabaseClient = null;

    function isConfigured() {
        const cfg = window.OTAY_CONFIG || {};
        return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_URL.startsWith('https://'));
    }

    function getSupabase() {
        if (!supabaseClient && isConfigured() && window.supabase) {
            try {
                supabaseClient = window.supabase.createClient(
                    window.OTAY_CONFIG.SUPABASE_URL,
                    window.OTAY_CONFIG.SUPABASE_ANON_KEY
                );
            } catch (e) {
                console.warn('Erreur initialisation Supabase client:', e);
            }
        }
        return supabaseClient;
    }

    // -------------------------------------------------------------------------
    // Stockage Local de Simulation / Fallback (garantit le bon fonctionnement immédiat)
    // -------------------------------------------------------------------------
    const STORAGE_KEYS = {
        ORDERS: 'otay_db_orders',
        QUOTES: 'otay_db_quotes',
        INVOICES: 'otay_db_invoices',
        SETTINGS: 'otay_db_settings',
        AUTH: 'otay_admin_session'
    };

    function getLocalOrders() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
        } catch {
            return [];
        }
    }

    function saveLocalOrders(orders) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    function getLocalQuotes() {
        let quotes = [];
        try {
            quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES)) || [];
        } catch {
            quotes = [];
        }
        // Initialiser avec le devis de référence Clinique Ennasr si vide
        if (quotes.length === 0) {
            quotes = [{
                id: 'quote-ref-001',
                quote_number: 'OTB-DEV-2026-001',
                client_name: 'Clinique Ennasr',
                client_email: 'direction@clinique-ennasr.tn',
                client_phone: '+216 71 800 000',
                expected_delivery: 'Première semaine de décembre 2026',
                issue_date: '2026-10-22',
                validity_date: '2026-11-22',
                quantity_reference: 100,
                unit_price_after_discount: 70.820,
                subtotal: 7580.000,
                discount: 552.000,
                shipping_fee: 0.000,
                total: 7028.000,
                status: 'Validé',
                conditions: [
                    "Tarif établi pour une commande de 100 coffrets.",
                    "La personnalisation du coffret et de le mug est incluse dans le prix indiqué.",
                    "Livraison prévue durant la première semaine de décembre 2026.",
                    "La production sera lancée après validation du visuel de personnalisation et confirmation de la commande.",
                    "Modalité de paiement : 50% avance à la confirmation de commande, 50% à la livraison (discutable)."
                ],
                items: [
                    { designation: 'Coffret ÔTAY BOX – Jardin de Douceur', description: '3 infusions, mug, infusette et guide rituel', quantity: 100, unit_price: 69.000, total_price: 6900.000 },
                    { designation: 'Personnalisation au logo du client', description: 'Coffret et mug', quantity: 100, unit_price: 6.800, total_price: 680.000 },
                    { designation: 'Carte de réduction offerte par Mindyness', description: '(Coaching et bien-être)', quantity: 100, unit_price: 0.000, total_price: 0.000 },
                    { designation: 'Remise commerciale pour quantité de 8 %', description: '', quantity: 100, unit_price: -5.520, total_price: -552.000 }
                ],
                created_at: '2026-10-22T10:00:00Z'
            }];
            localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
        }
        return quotes;
    }

    function saveLocalQuotes(quotes) {
        localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    }

    function getLocalInvoices() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES)) || [];
        } catch {
            return [];
        }
    }

    function saveLocalInvoices(inv) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(inv));
    }

    // -------------------------------------------------------------------------
    // API Principale Exposée
    // -------------------------------------------------------------------------
    const OtayAPI = {
        catalog: OFFICIAL_CATALOG,

        /**
         * Récupère les règles de livraison actuelles
         */
        async getShippingRules() {
            const client = getSupabase();
            if (client) {
                try {
                    const { data, error } = await client.from('settings').select('value').eq('key', 'shipping').single();
                    if (!error && data && data.value) {
                        return {
                            standardFee: Number(data.value.standard_fee) || 9.000,
                            freeThreshold: Number(data.value.free_threshold) || 150.000
                        };
                    }
                } catch (e) {
                    console.warn('Erreur lecture shipping Supabase:', e);
                }
            }
            const cfg = window.OTAY_CONFIG || {};
            return {
                standardFee: Number(cfg.SHIPPING_STANDARD_FEE) || 9.000,
                freeThreshold: Number(cfg.SHIPPING_FREE_THRESHOLD) || 150.000
            };
        },

        /**
         * Calcul des montants avec vérification stricte par rapport au catalogue officiel
         */
        calculateOrderTotals(cartItems, shippingRules) {
            let subtotal = 0;
            const verifiedItems = [];

            cartItems.forEach(item => {
                const rawId = item.id;
                const prod = OFFICIAL_CATALOG.find(p => String(p.id) === String(rawId));
                if (prod) {
                    const qty = Math.max(1, parseInt(item.qty || item.quantity || 1));
                    const lineTotal = prod.price * qty;
                    subtotal += lineTotal;
                    verifiedItems.push({
                        id: prod.id,
                        sku: prod.sku,
                        name: prod.name,
                        price: prod.price,
                        qty: qty,
                        total: lineTotal,
                        img: prod.img
                    });
                }
            });

            const shippingFee = (subtotal >= shippingRules.freeThreshold) ? 0.000 : shippingRules.standardFee;
            const total = subtotal + shippingFee;

            return {
                items: verifiedItems,
                subtotal: subtotal,
                shippingFee: shippingFee,
                total: total,
                isFreeShipping: subtotal >= shippingRules.freeThreshold,
                missingForFreeShipping: Math.max(0, shippingRules.freeThreshold - subtotal)
            };
        },

        /**
         * Enregistrement sécurisé d'une nouvelle commande client
         */
        async submitOrder(formData, cartItems) {
            const rules = await this.getShippingRules();
            const calculation = this.calculateOrderTotals(cartItems, rules);

            if (calculation.items.length === 0) {
                throw new Error("Votre panier est vide ou ne contient aucun article valide.");
            }

            const client = getSupabase();
            if (client) {
                // Appel de la procédure RPC sécurisée avec validation serveur
                const itemsPayload = calculation.items.map(i => ({ id: i.id, quantity: i.qty }));
                const { data, error } = await client.rpc('create_verified_order', {
                    p_client_name: formData.clientName,
                    p_client_phone: formData.clientPhone,
                    p_client_email: formData.clientEmail || null,
                    p_governorate: formData.governorate,
                    p_city: formData.city,
                    p_address: formData.address,
                    p_delivery_notes: formData.deliveryNotes || null,
                    p_items: itemsPayload,
                    p_origin: formData.origin || 'otaybox.tn'
                });

                if (error) {
                    throw new Error("Erreur serveur lors de l'enregistrement : " + error.message);
                }

                const resultPayload = {
                    success: true,
                    orderId: data.order_id,
                    orderNumber: data.order_number,
                    subtotal: data.subtotal,
                    shippingFee: data.shipping_fee,
                    total: data.total,
                    items: calculation.items,
                    customer: formData
                };

                // Notification automatique de commande avec await pour garantir l'envoi avant redirection
                try {
                    await this.notifyNewOrder(resultPayload);
                } catch (notifErr) {
                    console.warn('Notification log non bloquant:', notifErr);
                }

                return resultPayload;
            }

            // Mode simulation / local si Supabase n'est pas encore lié
            const orders = getLocalOrders();
            const seq = orders.length + 1;
            const year = new Date().getFullYear();
            const orderNumber = `OTB-CMD-${year}-${String(seq).padStart(4, '0')}`;
            const orderId = 'loc-ord-' + Date.now();

            const newOrder = {
                id: orderId,
                order_number: orderNumber,
                origin: formData.origin || 'otaybox.tn',
                client_name: formData.clientName.trim(),
                client_phone: formData.clientPhone.trim(),
                client_email: (formData.clientEmail || '').trim(),
                governorate: formData.governorate.trim(),
                city: formData.city.trim(),
                address: formData.address.trim(),
                delivery_notes: (formData.deliveryNotes || '').trim(),
                country: formData.country || 'Tunisie',
                postal_code: formData.postalCode || '',
                recipient_name: formData.recipientName || '',
                payer_name: formData.payerName || '',
                currency: formData.currency || 'TND',
                subtotal: calculation.subtotal,
                shipping_fee: calculation.shippingFee,
                discount: 0.000,
                total: calculation.total,
                order_status: 'Nouvelle',
                delivery_status: 'Non préparée',
                payment_status: 'En attente',
                payment_method: formData.paymentMethod || 'Paiement à la livraison',
                carrier: '',
                tracking_number: '',
                internal_notes: '',
                items: calculation.items.map(i => ({
                    product_id: i.id,
                    sku: i.sku,
                    product_name: i.name,
                    unit_price: i.price,
                    quantity: i.qty,
                    total_price: i.total
                })),
                history: [
                    {
                        user_email: 'Client Web',
                        action: 'Création de la commande',
                        new_value: 'Nouvelle',
                        notes: 'Commande passée en ligne sur otaybox.tn',
                        created_at: new Date().toISOString()
                    }
                ],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            orders.unshift(newOrder);
            saveLocalOrders(orders);

            const resultPayload = {
                success: true,
                orderId: newOrder.id,
                orderNumber: newOrder.order_number,
                subtotal: newOrder.subtotal,
                shippingFee: newOrder.shipping_fee,
                total: newOrder.total,
                items: calculation.items,
                customer: formData
            };

            // Notification automatique de commande avec await pour garantir l'envoi avant redirection
            try {
                await this.notifyNewOrder(resultPayload);
            } catch (notifErr) {
                console.warn('Notification log non bloquant:', notifErr);
            }

            return resultPayload;
        },

        /**
         * Récupère les paramètres de notification (Email, Téléphone, Telegram, Webhook)
         */
        async getNotificationSettings() {
            const client = getSupabase();
            if (client) {
                try {
                    const { data } = await client.from('settings').select('value').eq('key', 'order_notifications').single();
                    if (data && data.value) return data.value;
                } catch (e) {
                    // Fallback
                }
            }
            try {
                const local = localStorage.getItem('otay_notification_settings');
                if (local) return JSON.parse(local);
            } catch (e) {}

            return {
                enabled: true,
                admin_email: (window.OTAY_CONFIG && window.OTAY_CONFIG.ADMIN_NOTIFICATION_EMAIL) || 'contact@otaybox.tn',
                admin_phone: '+216 54 050 380',
                ntfy_topic: 'otaybox-commandes-2026',
                email_webhook_url: '',
                telegram_bot_token: '',
                telegram_chat_id: '',
                whatsapp_notify: false
            };
        },

        /**
         * Sauvegarde les paramètres de notification
         */
        async saveNotificationSettings(settings) {
            try {
                localStorage.setItem('otay_notification_settings', JSON.stringify(settings));
            } catch (e) {}

            const client = getSupabase();
            if (client) {
                try {
                    await client.from('settings').upsert({
                        key: 'order_notifications',
                        value: settings,
                        updated_at: new Date().toISOString()
                    });
                } catch (e) {
                    console.warn('Sauvegarde settings notification non bloquante:', e);
                }
            }
            return settings;
        },

        /**
         * Envoie une notification instantanée à l'administratrice (Email / Téléphone)
         */
        async notifyNewOrder(orderData) {
            try {
                const settings = await this.getNotificationSettings();
                if (!settings || !settings.enabled) return { notified: false, reason: 'disabled' };

                const itemsList = (orderData.items || []).map(i => `• ${i.qty || i.quantity || 1}x ${i.name || i.product_name || i.title} (${((i.price || i.unit_price || 0)).toFixed ? (i.price || i.unit_price).toFixed(3) : i.price} TND)`).join('\n');
                const customer = orderData.customer || {};
                const totalFormatted = (typeof orderData.total === 'number') ? orderData.total.toFixed(3) + ' TND' : orderData.total;

                // Notification sobre et sécurisée : aucune donnée personnelle du client (vie privée garantie)
                const notificationText = 
`🔔 NOUVELLE COMMANDE ÔTAY BOX !
━━━━━━━━━━━━━━━━━━━━
📦 Commande : #${orderData.orderNumber}
💰 Montant total : ${totalFormatted}
🛍️ Articles :
${itemsList}

🔗 Dashboard sécurisé : https://otaybox.tn/admin/`;

                const results = { ntfy: false, telegram: false, email: false, resend: false };

                // 1. Notification Smartphone instantanée Push (ntfy.sh - 100% gratuit, sans token, alerte sonore directe sur mobile)
                try {
                    const ntfyTopic = settings.ntfy_topic || 'otaybox-commandes-2026';
                    const ntfyRes = await fetch(`https://ntfy.sh/${encodeURIComponent(ntfyTopic)}`, {
                        method: 'POST',
                        headers: {
                            'Title': `Nouvelle commande OTAY BOX (#${orderData.orderNumber})`,
                            'Priority': 'urgent',
                            'Tags': 'package,tea,bell',
                            'Click': 'https://otaybox.tn/admin/'
                        },
                        body: `Nouvelle commande #${orderData.orderNumber}\nMontant : ${totalFormatted}\nArticles :\n${itemsList}`,
                        keepalive: true
                    });
                    results.ntfy = ntfyRes.ok;
                } catch (pushErr) {
                    console.warn('Erreur notification push mobile (ntfy):', pushErr);
                }

                // 2. Notification Smartphone via Telegram Bot (Optionnel, instantané avec alerte sonore)
                if (settings.telegram_bot_token && settings.telegram_chat_id) {
                    try {
                        const tgRes = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: settings.telegram_chat_id,
                                text: notificationText
                            }),
                            keepalive: true
                        });
                        results.telegram = tgRes.ok;
                    } catch (tgErr) {
                        console.warn('Erreur envoi notification Telegram:', tgErr);
                    }
                }

                // 3. Notification Sécurisée via Supabase Edge Function & Resend (Sans clé API dans le JS public, sans données personnelles du client)
                const client = getSupabase();
                const anonKey = (window.OTAY_CONFIG && window.OTAY_CONFIG.SUPABASE_ANON_KEY) || '';
                const supabaseUrl = (window.OTAY_CONFIG && window.OTAY_CONFIG.SUPABASE_URL) || '';

                const safeOrderPayload = {
                    order_number: orderData.orderNumber || (customer && customer.order_number) || 'COMMANDE',
                    id: orderData.orderId || orderData.orderNumber,
                    origin: (customer && customer.origin) || 'otaybox.tn',
                    subtotal: orderData.subtotal,
                    shipping_fee: orderData.shippingFee,
                    total: orderData.total,
                    payment_method: 'Paiement à la livraison',
                    payment_status: 'En attente',
                    items: (orderData.items || []).map(i => ({
                        product_name: i.name || i.product_name || i.title,
                        quantity: i.qty || i.quantity || 1,
                        unit_price: i.price || i.unit_price || 0,
                        total_price: (i.total || ((i.price || i.unit_price || 0) * (i.qty || i.quantity || 1)))
                    }))
                };

                if (client && client.functions) {
                    try {
                        const { data: fnData, error: fnError } = await client.functions.invoke('send-order-notification', {
                            body: { order: safeOrderPayload }
                        });

                        if (fnError) {
                            console.warn("Supabase Edge Function send-order-notification:", fnError.message || fnError);
                            results.resend = false;
                        } else {
                            results.resend = true;
                            results.edge_function = true;
                        }
                    } catch (fnErr) {
                        console.warn("Erreur appel Supabase Edge Function:", fnErr);
                        results.resend = false;
                    }
                }

                // Fallback direct avec keepalive si client.functions n'a pas pu envoyer ou n'était pas initialisé
                if (!results.resend && supabaseUrl && anonKey) {
                    try {
                        const fnUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/send-order-notification`;
                        const rawRes = await fetch(fnUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': anonKey,
                                'Authorization': `Bearer ${anonKey}`
                            },
                            body: JSON.stringify({ order: safeOrderPayload }),
                            keepalive: true
                        });
                        results.resend = rawRes.ok;
                        results.edge_function = rawRes.ok;
                    } catch (fnErr) {
                        console.warn("Erreur appel direct Edge Function:", fnErr);
                        results.resend = false;
                    }
                }

                // 4. Notification Email via Webhook externe optionnel (Formspree / Make)
                if (settings.email_webhook_url) {
                    try {
                        const emailRes = await fetch(settings.email_webhook_url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subject: `[ÔTAY BOX] Nouvelle Commande #${orderData.orderNumber} - ${totalFormatted}`,
                                message: notificationText,
                                email: settings.admin_email || 'contact@otaybox.tn',
                                order: safeOrderPayload
                            })
                        });
                        results.email = emailRes.ok;
                    } catch (emErr) {
                        console.warn('Erreur envoi notification Email Webhook:', emErr);
                    }
                }

                return { notified: true, results, text: notificationText };
            } catch (err) {
                console.warn('Erreur non bloquante dans notifyNewOrder:', err);
                return { notified: false, error: err.message };
            }
        },

        getSupabaseClient() {
            return getSupabase();
        },

        /**
         * Authentification administrateur
         */
        async adminLogin(email, password) {
            const client = getSupabase();
            if (client) {
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message && error.message.includes('Email not confirmed')) {
                        throw new Error("Votre adresse e-mail n'est pas encore confirmée. Dans votre console Supabase > Authentication > Users, cliquez sur 'Confirm email' ou cochez 'Auto Confirm' pour votre compte.");
                    }
                    if (error.message && error.message.includes('Invalid login credentials')) {
                        throw new Error("Identifiants incorrects. Assurez-vous d'avoir créé votre compte administrateur dans Supabase (Authentication > Users > Add User avec 'Auto Confirm').");
                    }
                    throw new Error(error.message);
                }
                localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
                    email: data.user.email,
                    id: data.user.id,
                    token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    logged_at: Date.now()
                }));
                return data.user;
            }

            // Mode démonstration locale si Supabase n'est pas configuré
            if (email === 'admin@otaybox.tn' && password === 'OtayBox2026!') {
                const session = {
                    email: 'admin@otaybox.tn',
                    id: 'admin-local-1',
                    name: 'Administratrice ÔTAY BOX',
                    logged_at: Date.now()
                };
                localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
                return session;
            }
            throw new Error("Identifiants incorrects. En mode test local, utilisez : admin@otaybox.tn / OtayBox2026!");
        },

        async adminLogout() {
            const client = getSupabase();
            if (client) {
                await client.auth.signOut();
            }
            localStorage.removeItem(STORAGE_KEYS.AUTH);
        },

        getAdminSession() {
            try {
                const sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH));
                return sess || null;
            } catch {
                return null;
            }
        },

        requireAdmin() {
            const session = this.getAdminSession();
            if (!session) {
                window.location.href = 'login.html';
                return null;
            }
            return session;
        },

        async requireAdminAsync() {
            const localSession = this.getAdminSession();
            const client = getSupabase();

            if (client && client.auth) {
                try {
                    const { data, error } = await client.auth.getSession();
                    if (!error && data && data.session) {
                        return data.session.user;
                    }
                    // Si un refresh token est disponible, tenter de restaurer la session
                    if (localSession && localSession.token && localSession.refresh_token) {
                        const { data: refreshData, error: refreshError } = await client.auth.setSession({
                            access_token: localSession.token,
                            refresh_token: localSession.refresh_token
                        });
                        if (!refreshError && refreshData && refreshData.session) {
                            return refreshData.session.user;
                        }
                    }
                    // Session Supabase non trouvée ou expirée
                    localStorage.removeItem(STORAGE_KEYS.AUTH);
                    window.location.href = 'login.html?reason=session_expired';
                    return null;
                } catch (e) {
                    console.warn("Erreur vérification session Supabase:", e);
                }
            }

            if (!localSession) {
                window.location.href = 'login.html';
                return null;
            }
            return localSession;
        },

        /**
         * Récupération des statistiques réelles du Dashboard
         */
        async getDashboardStats() {
            const orders = await this.getOrders();
            const quotes = await this.getQuotes();
            const invoices = await this.getInvoices();

            const stats = {
                totalOrders: orders.length,
                newOrders: orders.filter(o => o.order_status === 'Nouvelle').length,
                toConfirmOrders: orders.filter(o => o.order_status === 'À confirmer').length,
                preparingOrders: orders.filter(o => o.order_status === 'En préparation').length,
                shippedOrders: orders.filter(o => o.order_status === 'Expédiée').length,
                deliveredOrders: orders.filter(o => o.order_status === 'Livrée').length,
                cancelledOrders: orders.filter(o => o.order_status === 'Annulée').length,
                
                // Chiffre d'affaires : commandes payées ou livrées (non annulées)
                revenue: orders
                    .filter(o => o.payment_status === 'Payé' || (o.delivery_status === 'Livrée' && o.order_status !== 'Annulée'))
                    .reduce((sum, o) => sum + Number(o.total || 0), 0),
                
                totalQuotes: quotes.length,
                totalInvoices: invoices.length,
                ileycomOrders: orders.filter(o => o.origin === 'ileycom').length,
                intlOrders: orders.filter(o => o.origin === 'international_direct').length
            };

            return stats;
        },

        /**
         * Liste des commandes avec filtres et recherche
         */
        async getOrders(filters = {}) {
            const client = getSupabase();
            if (client) {
                try {
                    let query = client.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
                    if (filters.order_status) query = query.eq('order_status', filters.order_status);
                    if (filters.delivery_status) query = query.eq('delivery_status', filters.delivery_status);
                    if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
                    if (filters.origin) query = query.eq('origin', filters.origin);

                    const { data, error } = await query;
                    if (!error && data) return data;
                    if (error) {
                        console.error('Erreur Supabase getOrders:', error);
                        if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
                            throw new Error("Accès refusé par la sécurité Supabase (RLS). Votre session administrateur n'est pas authentifiée. Veuillez vous reconnecter sur login.html.");
                        }
                    }
                } catch (e) {
                    console.warn('Erreur chargement Supabase orders:', e);
                    if (e.message && e.message.includes('Accès refusé')) {
                        throw e;
                    }
                }
            }

            let orders = getLocalOrders();
            if (filters.order_status) orders = orders.filter(o => o.order_status === filters.order_status);
            if (filters.delivery_status) orders = orders.filter(o => o.delivery_status === filters.delivery_status);
            if (filters.payment_status) orders = orders.filter(o => o.payment_status === filters.payment_status);
            if (filters.origin) orders = orders.filter(o => o.origin === filters.origin);

            if (filters.search) {
                const s = filters.search.toLowerCase().trim();
                orders = orders.filter(o =>
                    (o.order_number && o.order_number.toLowerCase().includes(s)) ||
                    (o.client_name && o.client_name.toLowerCase().includes(s)) ||
                    (o.client_phone && o.client_phone.includes(s)) ||
                    (o.city && o.city.toLowerCase().includes(s))
                );
            }

            return orders;
        },

        /**
         * Fiche détaillée d'une commande
         */
        async getOrderById(idOrNumber) {
            const client = getSupabase();
            if (client) {
                try {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
                    const col = isUuid ? 'id' : 'order_number';
                    const { data, error } = await client
                        .from('orders')
                        .select('*, order_items(*), order_history(*)')
                        .eq(col, idOrNumber)
                        .single();
                    if (!error && data) return data;
                    if (error && (error.code === '42501' || (error.message && error.message.includes('permission denied')))) {
                        throw new Error("Accès refusé par la sécurité Supabase (RLS). Votre session administrateur n'est pas authentifiée. Veuillez vous reconnecter.");
                    }
                } catch (e) {
                    console.warn('Erreur getOrderById Supabase:', e);
                    if (e.message && e.message.includes('Accès refusé')) throw e;
                }
            }

            const orders = getLocalOrders();
            return orders.find(o => o.id === idOrNumber || o.order_number === idOrNumber) || null;
        },

        /**
         * Mise à jour d'une commande (statuts, transporteur, notes)
         */
        async updateOrder(id, updates, adminEmail = 'Administratrice') {
            const client = getSupabase();
            if (client) {
                try {
                    const { data, error } = await client
                        .from('orders')
                        .update({ ...updates, updated_at: new Date().toISOString() })
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    return data;
                } catch (e) {
                    console.warn('Erreur updateOrder Supabase:', e);
                }
            }

            const orders = getLocalOrders();
            const idx = orders.findIndex(o => o.id === id || o.order_number === id);
            if (idx === -1) throw new Error("Commande introuvable.");

            const ord = orders[idx];
            const changes = [];

            if (updates.order_status && updates.order_status !== ord.order_status) {
                changes.push({ action: 'Changement statut commande', old_value: ord.order_status, new_value: updates.order_status });
                ord.order_status = updates.order_status;
            }
            if (updates.delivery_status && updates.delivery_status !== ord.delivery_status) {
                changes.push({ action: 'Changement statut livraison', old_value: ord.delivery_status, new_value: updates.delivery_status });
                ord.delivery_status = updates.delivery_status;
                if (updates.delivery_status === 'Expédiée' || updates.delivery_status === 'Remise au transporteur') {
                    ord.shipped_at = ord.shipped_at || new Date().toISOString();
                } else if (updates.delivery_status === 'Livrée') {
                    ord.delivered_at = ord.delivered_at || new Date().toISOString();
                }
            }
            if (updates.payment_status && updates.payment_status !== ord.payment_status) {
                changes.push({ action: 'Changement statut paiement', old_value: ord.payment_status, new_value: updates.payment_status });
                ord.payment_status = updates.payment_status;
            }
            if (updates.carrier !== undefined) ord.carrier = updates.carrier;
            if (updates.tracking_number !== undefined) ord.tracking_number = updates.tracking_number;
            if (updates.internal_notes !== undefined) ord.internal_notes = updates.internal_notes;

            ord.updated_at = new Date().toISOString();
            if (!ord.history) ord.history = [];
            changes.forEach(c => {
                ord.history.push({
                    user_email: adminEmail,
                    action: c.action,
                    old_value: c.old_value,
                    new_value: c.new_value,
                    created_at: new Date().toISOString()
                });
            });

            orders[idx] = ord;
            saveLocalOrders(orders);
            return ord;
        },

        /**
         * Devis : Récupération
         */
        async getQuotes() {
            const client = getSupabase();
            if (client) {
                try {
                    const { data, error } = await client.from('quotes').select('*, quote_items(*)').order('created_at', { ascending: false });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('Erreur getQuotes Supabase:', e);
                }
            }
            return getLocalQuotes();
        },

        async getQuoteById(idOrNumber) {
            const quotes = await this.getQuotes();
            return quotes.find(q => q.id === idOrNumber || q.quote_number === idOrNumber) || null;
        },

        /**
         * Devis : Création avec numérotation unique OTB-DEV-YYYY-XXX
         */
        async createQuote(quoteData) {
            const client = getSupabase();
            if (client) {
                try {
                    const { data: seqData } = await client.rpc('get_next_quote_seq');
                    // si RPC non présent, fallback insert
                } catch {}
            }

            const quotes = getLocalQuotes();
            const year = new Date().getFullYear();
            const nextNum = String(quotes.length + 1).padStart(3, '0');
            const quoteNumber = `OTB-DEV-${year}-${nextNum}`;

            const newQuote = {
                id: 'quote-' + Date.now(),
                quote_number: quoteNumber,
                order_id: quoteData.order_id || null,
                client_name: quoteData.client_name.trim(),
                client_email: (quoteData.client_email || '').trim(),
                client_phone: (quoteData.client_phone || '').trim(),
                expected_delivery: quoteData.expected_delivery || 'Première semaine de décembre 2026',
                issue_date: quoteData.issue_date || new Date().toISOString().split('T')[0],
                validity_date: quoteData.validity_date || '',
                quantity_reference: quoteData.quantity_reference || null,
                unit_price_after_discount: quoteData.unit_price_after_discount || null,
                subtotal: Number(quoteData.subtotal) || 0,
                discount: Number(quoteData.discount) || 0,
                shipping_fee: Number(quoteData.shipping_fee) || 0,
                total: Number(quoteData.total) || 0,
                status: quoteData.status || 'Validé',
                conditions: quoteData.conditions || [
                    "Tarif établi selon les spécifications mentionnées.",
                    "La personnalisation est incluse dans le prix indiqué le cas échéant.",
                    "La production sera lancée après validation du bon à tirer et confirmation de la commande.",
                    "Modalité de paiement : 50% avance à la confirmation de commande, 50% à la livraison."
                ],
                items: quoteData.items || [],
                created_at: new Date().toISOString()
            };

            quotes.unshift(newQuote);
            saveLocalQuotes(quotes);
            return newQuote;
        },

        /**
         * Factures : Récupération
         */
        async getInvoices() {
            const client = getSupabase();
            if (client) {
                try {
                    const { data, error } = await client.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('Erreur getInvoices Supabase:', e);
                }
            }
            return getLocalInvoices();
        },

        async getInvoiceById(idOrNumber) {
            const invoices = await this.getInvoices();
            return invoices.find(inv => inv.id === idOrNumber || inv.invoice_number === idOrNumber) || null;
        },

        /**
         * Factures : Création séquentielle OTB-FAC-YYYY-XXX
         */
        async createInvoice(invoiceData) {
            const invoices = getLocalInvoices();
            const year = new Date().getFullYear();
            const nextNum = String(invoices.length + 1).padStart(3, '0');
            const invoiceNumber = `OTB-FAC-${year}-${nextNum}`;

            const newInvoice = {
                id: 'inv-' + Date.now(),
                invoice_number: invoiceNumber,
                order_id: invoiceData.order_id || null,
                quote_id: invoiceData.quote_id || null,
                client_name: invoiceData.client_name.trim(),
                client_email: (invoiceData.client_email || '').trim(),
                client_phone: (invoiceData.client_phone || '').trim(),
                client_address: (invoiceData.client_address || '').trim(),
                client_fiscal_id: (invoiceData.client_fiscal_id || '').trim(),
                issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
                due_date: invoiceData.due_date || '',
                subtotal: Number(invoiceData.subtotal) || 0,
                tax_rate: Number(invoiceData.tax_rate) || 0,
                tax_amount: Number(invoiceData.tax_amount) || 0,
                shipping_fee: Number(invoiceData.shipping_fee) || 0,
                discount: Number(invoiceData.discount) || 0,
                total: Number(invoiceData.total) || 0,
                status: invoiceData.status || 'Émise',
                legal_notes: invoiceData.legal_notes || 'TVA non applicable selon la législation en vigueur.',
                items: invoiceData.items || [],
                created_at: new Date().toISOString()
            };

            invoices.unshift(newInvoice);
            saveLocalInvoices(invoices);
            return newInvoice;
        },

        /**
         * Export CSV des commandes
         */
        exportOrdersToCSV(orders) {
            const headers = [
                'N° Commande', 'Date', 'Origine', 'Client', 'Téléphone', 'Email',
                'Gouvernorat', 'Ville', 'Adresse', 'Total (TND)', 'Statut Commande',
                'Statut Livraison', 'Statut Paiement', 'Mode Paiement', 'Transporteur', 'Suivi'
            ];

            const rows = orders.map(o => [
                `"${o.order_number || ''}"`,
                `"${(o.created_at || '').substring(0, 10)}"`,
                `"${o.origin || ''}"`,
                `"${(o.client_name || '').replace(/"/g, '""')}"`,
                `"${o.client_phone || ''}"`,
                `"${o.client_email || ''}"`,
                `"${(o.governorate || '').replace(/"/g, '""')}"`,
                `"${(o.city || '').replace(/"/g, '""')}"`,
                `"${(o.address || '').replace(/"/g, '""')}"`,
                Number(o.total || 0).toFixed(3),
                `"${o.order_status || ''}"`,
                `"${o.delivery_status || ''}"`,
                `"${o.payment_status || ''}"`,
                `"${o.payment_method || ''}"`,
                `"${(o.carrier || '').replace(/"/g, '""')}"`,
                `"${(o.tracking_number || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OTAY_BOX_Commandes_${new Date().toISOString().substring(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    window.OtayAPI = OtayAPI;

})(window);
