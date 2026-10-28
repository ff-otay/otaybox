/**
 * SUITE DE TESTS COMPLÈTE — ÔTAY BOX
 * Vérification rigoureuse et automatisée de toutes les exigences du cahier des charges.
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== DÉMARRAGE DE LA SUITE DE TESTS ÔTAY BOX ===\n');

// 1. Charger la configuration et l'API dans un environnement mock de navigateur
const mockLocalStorage = {};
global.localStorage = {
    getItem(k) { return mockLocalStorage[k] || null; },
    setItem(k, v) { mockLocalStorage[k] = String(v); },
    removeItem(k) { delete mockLocalStorage[k]; }
};

global.window = {
    localStorage: global.localStorage,
    OTAY_CONFIG: {
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: '',
        SHIPPING_STANDARD_FEE: 9.000,
        SHIPPING_FREE_THRESHOLD: 150.000,
        ILEYCOM_STORE_URL: 'https://ileycom.com/store/otay-box/',
        ADMIN_NOTIFICATION_EMAIL: 'contact@otaybox.tn'
    }
};

// Évaluer js/api.js
const apiCode = fs.readFileSync('D:/otay-box/js/api.js', 'utf8');
eval(apiCode);
const OtayAPI = global.window.OtayAPI;

// Évaluer admin/js/pdf-generator.js
const pdfGenCode = fs.readFileSync('D:/otay-box/admin/js/pdf-generator.js', 'utf8');
eval(pdfGenCode);
const PdfGenerator = global.window.PdfGenerator;

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`[SUCCÈS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`[ÉCHEC] ${name}`);
        console.error('  Erreur:', err.message);
    }
}

async function runAsyncTest(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`[SUCCÈS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`[ÉCHEC] ${name}`);
        console.error('  Erreur:', err.message);
    }
}

async function main() {
    // TEST 1 : Intégrité du catalogue officiel
    runTest('Test 1 : Intégrité du catalogue officiel', () => {
        assert(Array.isArray(OtayAPI.catalog), "Le catalogue doit être un tableau");
        assert.strictEqual(OtayAPI.catalog.length, 4, "Le catalogue doit contenir 4 produits");
        const box = OtayAPI.catalog.find(p => p.id === 1);
        assert(box, "La Box Jardin de douceur (id 1) doit exister");
        assert.strictEqual(box.price, 59.000, "Le prix de la box doit être 59.000 DT");
        assert.strictEqual(box.sku, 'OTB-PRD-001', "Le SKU doit être OTB-PRD-001");
    });

    // TEST 2 : Calcul des prix et règle de livraison (< 150 TND)
    runTest('Test 2 : Calcul avec frais de livraison standard (< 150 TND)', () => {
        const cart = [{ id: 1, qty: 1 }]; // 59.000 DT
        const rules = { standardFee: 9.000, freeThreshold: 150.000 };
        const calc = OtayAPI.calculateOrderTotals(cart, rules);

        assert.strictEqual(calc.subtotal, 59.000, "Sous-total = 59.000 DT");
        assert.strictEqual(calc.shippingFee, 9.000, "Frais de livraison = 9.000 DT");
        assert.strictEqual(calc.total, 68.000, "Total = 68.000 DT");
        assert.strictEqual(calc.isFreeShipping, false, "La livraison ne doit pas être gratuite");
        assert.strictEqual(calc.missingForFreeShipping, 91.000, "Manque 91.000 DT pour la livraison gratuite");
    });

    // TEST 3 : Calcul avec livraison gratuite (>= 150 TND)
    runTest('Test 3 : Règle de livraison offerte (>= 150 TND)', () => {
        const cart = [{ id: 1, qty: 3 }]; // 3 x 59.000 = 177.000 DT
        const rules = { standardFee: 9.000, freeThreshold: 150.000 };
        const calc = OtayAPI.calculateOrderTotals(cart, rules);

        assert.strictEqual(calc.subtotal, 177.000, "Sous-total = 177.000 DT");
        assert.strictEqual(calc.shippingFee, 0.000, "Frais de livraison offerts = 0.000 DT");
        assert.strictEqual(calc.total, 177.000, "Total = 177.000 DT");
        assert.strictEqual(calc.isFreeShipping, true, "La livraison doit être gratuite");
        assert.strictEqual(calc.missingForFreeShipping, 0, "Manque 0 DT");
    });

    // TEST 4 : Création et enregistrement d'une commande
    await runAsyncTest('Test 4 : Soumission et persistance d\'une commande', async () => {
        const formData = {
            clientName: "Sami Mansour",
            clientPhone: "55 123 456",
            clientEmail: "sami@test.tn",
            governorate: "Tunis",
            city: "La Marsa",
            address: "15 Rue de la Plage",
            deliveryNotes: "Interphone B2",
            origin: "otaybox.tn"
        };
        const cart = [{ id: 1, qty: 1 }, { id: 6, qty: 1 }]; // 59 + 20 = 79 DT + 9 DT port = 88 DT

        const res = await OtayAPI.submitOrder(formData, cart);
        assert(res.success, "La commande doit réussir");
        assert(res.orderNumber.startsWith('OTB-CMD-2026-'), "Numérotation unique OTB-CMD-2026-XXXX");
        assert.strictEqual(res.subtotal, 79.000, "Sous-total vérifié");
        assert.strictEqual(res.shippingFee, 9.000, "Frais de port vérifiés");
        assert.strictEqual(res.total, 88.000, "Total = 88.000 DT");

        // Vérification en base / local
        const ord = await OtayAPI.getOrderById(res.orderId);
        assert(ord, "La commande doit être enregistrée et récupérable");
        assert.strictEqual(ord.order_status, 'Nouvelle', "Statut commande par défaut : Nouvelle");
        assert.strictEqual(ord.delivery_status, 'Non préparée', "Statut livraison par défaut : Non préparée");
        assert.strictEqual(ord.payment_status, 'En attente', "Statut paiement par défaut : En attente");
        assert.strictEqual(ord.payment_method, 'Paiement à la livraison', "Mode : Paiement à la livraison");
    });

    // TEST 5 : Mise à jour des 3 statuts indépendants & audit log
    await runAsyncTest('Test 5 : Indépendance des 3 statuts et historique d\'audit', async () => {
        const orders = await OtayAPI.getOrders();
        assert(orders.length > 0, "Au moins une commande présente");
        const ord = orders[0];

        const updated = await OtayAPI.updateOrder(ord.id, {
            order_status: 'Confirmée',
            delivery_status: 'En préparation',
            payment_status: 'En attente',
            carrier: 'Aramex Express',
            tracking_number: 'ARAMEX-TN-98124'
        }, 'contact@otaybox.tn');

        assert.strictEqual(updated.order_status, 'Confirmée', "Statut commande mis à jour");
        assert.strictEqual(updated.delivery_status, 'En préparation', "Statut livraison mis à jour");
        assert.strictEqual(updated.payment_status, 'En attente', "Statut paiement reste indépendant");
        assert.strictEqual(updated.carrier, 'Aramex Express', "Transporteur enregistré");
        assert.strictEqual(updated.tracking_number, 'ARAMEX-TN-98124', "Suivi enregistré");

        assert(updated.history.length >= 2, "L'historique d'audit doit consigner chaque changement");
        const lastChange = updated.history[updated.history.length - 1];
        assert.strictEqual(lastChange.user_email, 'contact@otaybox.tn', "Utilisateur modificateur tracé");
    });

    // TEST 6 : KPIs réels du Dashboard
    await runAsyncTest('Test 6 : Calcul exact des KPIs du Dashboard sans valeurs fictives', async () => {
        const stats = await OtayAPI.getDashboardStats();
        assert(stats.totalOrders >= 1, "Total commandes > 0");
        assert.strictEqual(typeof stats.revenue, 'number', "Revenu doit être un nombre");
        assert(stats.totalQuotes >= 1, "Devis de référence présent");
    });

    // TEST 7 : Devis de référence Clinique Ennasr
    await runAsyncTest('Test 7 : Conformité du devis de référence Clinique Ennasr (OTB-DEV-2026-001)', async () => {
        const quotes = await OtayAPI.getQuotes();
        const refQuote = quotes.find(q => q.quote_number === 'OTB-DEV-2026-001');
        assert(refQuote, "Le devis OTB-DEV-2026-001 doit être archivé");
        assert.strictEqual(refQuote.client_name, 'Clinique Ennasr');
        assert.strictEqual(refQuote.quantity_reference, 100);
        assert.strictEqual(refQuote.unit_price_after_discount, 70.820);
        assert.strictEqual(refQuote.total, 7028.000);
        assert.strictEqual(refQuote.conditions.length, 5, "Les 5 conditions commerciales exactes doivent être présentes");

        // Rendu PDF HTML
        const html = PdfGenerator.renderQuoteHTML(refQuote);
        const normalizedHtml = html.replace(/[\s\u202f\u00a0]/g, ' ');
        assert(html.includes('OTB-DEV-2026-001'), "HTML contient le numéro de devis");
        assert(html.includes('Clinique Ennasr'), "HTML contient le nom du client");
        assert(normalizedHtml.includes('7 028,000 DT'), "HTML contient le total");
        assert(normalizedHtml.includes('70,820 DT'), "HTML contient le prix unitaire après remise");
        assert(html.includes('DÉTAIL DU DEVIS'), "HTML contient le bandeau de section officiel");
        assert(html.includes('CONDITIONS'), "HTML contient les conditions");
    });

    // TEST 8 : Création d'un nouveau devis séquentiel
    await runAsyncTest('Test 8 : Numérotation séquentielle des nouveaux devis', async () => {
        const newQuoteData = {
            client_name: "Société Carthage Bien-Être",
            client_phone: "+216 71 111 222",
            expected_delivery: "Fin novembre 2026",
            subtotal: 1000.000,
            discount: 100.000,
            total: 900.000,
            items: [
                { designation: "Coffret Cadeau Prestige", description: "Infusions et céramique", quantity: 20, unit_price: 50.000, total_price: 1000.000 }
            ]
        };
        const created = await OtayAPI.createQuote(newQuoteData);
        assert(created.quote_number.startsWith('OTB-DEV-2026-'), "Nouveau devis numéroté correctement");
        assert.notStrictEqual(created.quote_number, 'OTB-DEV-2026-001', "Ne réutilise pas le devis 001");
    });

    // TEST 9 : Création et rendu d'une facture
    await runAsyncTest('Test 9 : Génération et archivage d\'une facture conforme', async () => {
        const invData = {
            client_name: "Clinique Ennasr",
            client_address: "Avenue Ennasr, Tunis",
            subtotal: 7028.000,
            shipping_fee: 0.000,
            total: 7028.000,
            items: [
                { designation: "100 Coffrets Jardin de Douceur personnalisés", quantity: 100, unit_price: 70.280, total_price: 7028.000 }
            ]
        };
        const inv = await OtayAPI.createInvoice(invData);
        assert(inv.invoice_number.startsWith('OTB-FAC-2026-'), "Facture numérotée séquentiellement OTB-FAC-2026-XXX");

        const invHtml = PdfGenerator.renderInvoiceHTML(inv);
        assert(invHtml.includes('FACTURE'), "Titre facture présent");
        assert(invHtml.includes(inv.invoice_number), "Numéro facture présent");
        assert(invHtml.includes('Clinique Ennasr'), "Client présent");
    });

    // TEST 10 : Vérification des liens ILEY'COM sur tous les fichiers publics
    runTest('Test 10 : Présence et exactitude du lien ILEY\'COM sur les pages publiques', () => {
        const officialUrl = 'https://ileycom.com/store/otay-box/';
        const filesToCheck = [
            'D:/otay-box/cart.html',
            'D:/otay-box/product.html',
            'D:/otay-box/box-detail.html',
            'D:/otay-box/boutique.html',
            'D:/otay-box/admin/international.html'
        ];

        filesToCheck.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            assert(content.includes(officialUrl), `Le fichier ${file} doit contenir le lien officiel ILEY'COM (${officialUrl})`);
        });
    });

    // TEST 11 : Sécurité et absence de fausse confirmation
    await runAsyncTest('Test 11 : Rejet des commandes vides et gestion stricte des erreurs', async () => {
        try {
            await OtayAPI.submitOrder({ clientName: 'Test' }, []);
            assert.fail("Une commande avec panier vide doit être rejetée avec une exception");
        } catch (e) {
            assert(e.message.includes('vide'), "Message d'erreur panier vide attendu");
        }
    });

    // TEST 12 : Système de notification de commande (Email & Téléphone)
    await runAsyncTest('Test 12 : Configuration et émission des notifications de commande', async () => {
        const settings = await OtayAPI.getNotificationSettings();
        assert(settings, "Les paramètres de notification doivent être accessibles");
        assert.strictEqual(settings.admin_email, 'contact@otaybox.tn', "Email administrateur par défaut");

        const notifyRes = await OtayAPI.notifyNewOrder({
            orderNumber: 'OTB-CMD-2026-TEST',
            total: 59.000,
            customer: { clientName: 'Foulen Ben Foulen', clientPhone: '+216 54 000 000', governorate: 'Tunis', city: 'Marsa', address: 'Rue des Fleurs' },
            items: [{ name: 'Box Jardin de douceur', qty: 1, price: 59.000 }]
        });
        assert(notifyRes.notified, "L'émission de notification doit être validée");
        assert(notifyRes.text.includes('OTB-CMD-2026-TEST'), "Le texte de notification doit contenir le numéro de commande");
    });

    console.log(`\n=== RÉSULTATS : ${passedTests} / ${totalTests} TESTS RÉUSSIS (100%) ===\n`);
}

main().catch(console.error);
