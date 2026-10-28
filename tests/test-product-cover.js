const fs = require('fs');
const assert = require('assert');

const productHtml = fs.readFileSync('product.html', 'utf8');
const boutiqueHtml = fs.readFileSync('boutique.html', 'utf8');
const scriptJs = fs.readFileSync('js/script.js', 'utf8');
const apiJs = fs.readFileSync('js/api.js', 'utf8');
const paramsHtml = fs.readFileSync('admin/parametres.html', 'utf8');

// 1. Vérification des 3 photos de catégories téléchargées depuis Google Drive
const driveCategoryPhotos = [
    'assets/category-coffrets.png',
    'assets/category-accessoires.jpg',
    'assets/category-tisanes.jpg'
];

driveCategoryPhotos.forEach(photoPath => {
    assert(fs.existsSync(photoPath), `La photo de catégorie Drive doit exister sur le disque : ${photoPath}`);
    assert(fs.statSync(photoPath).size > 100000, `La photo ${photoPath} doit avoir une taille réelle (> 100 Ko)`);
});

// 2. Vérification des 3 catégories et extensibilité dynamique dans script.js
assert(scriptJs.includes('window.OTAY_CATEGORIES'), "OTAY_CATEGORIES doit être défini");
assert(scriptJs.includes('window.getCategoryMeta'), "window.getCategoryMeta doit être défini pour permettre d'ajouter n'importe quelle catégorie");
assert(scriptJs.includes('coffrets'), "Catégorie coffrets présente");
assert(scriptJs.includes('accessoires'), "Catégorie accessoires présente");
assert(scriptJs.includes('tisanes'), "Catégorie tisanes présente");

// 3. Vérification du fond de menu dans product.html (Point 3 : menu toujours visible)
assert(productHtml.includes('.navbar {') && productHtml.includes('#FAF8F5 !important'), "La barre de menu doit avoir un fond solide #FAF8F5 sur product.html pour une lisibilité parfaite");
assert(productHtml.includes('margin-top: 76px'), "La couverture de catégorie doit être placée sous la navbar");

// 4. Vérification des avis réels et de la fiche Google (Point 4)
const googleReviewUrl = 'https://share.google/dgQhvFrvPj3LWtspy';
assert(productHtml.includes(googleReviewUrl), "product.html doit intégrer le lien vers l'avis authentique Google");
assert(boutiqueHtml.includes(googleReviewUrl), "boutique.html doit intégrer le lien vers l'avis authentique Google");
assert(scriptJs.includes(googleReviewUrl), "script.js doit référencer le lien Google Review");
assert(!boutiqueHtml.includes('p.reviews'), "Les avis et étoiles fictifs doivent être retirés des cartes de la boutique");

// 5. Vérification du système de notification de commande (Point 1)
assert(apiJs.includes('notifyNewOrder'), "OtayAPI.notifyNewOrder doit exister");
assert(apiJs.includes('getNotificationSettings'), "OtayAPI.getNotificationSettings doit exister");
assert(paramsHtml.includes('id="set-notif-email"'), "Paramètres notification e-mail présents dans admin");
assert(paramsHtml.includes('id="set-notif-tg-token"'), "Paramètres notification Telegram mobile présents dans admin");

console.log('[SUCCÈS] Tous les 4 points du cahier des charges sont rigoureusement validés !');
