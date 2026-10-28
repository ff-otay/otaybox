const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('product.html', 'utf8');

const requiredElements = [
    'class="category-cover-hero"',
    'id="category-cover-hero"',
    'class="category-cover-overlay"',
    'id="cat-cover-badge"',
    'id="cat-cover-icon"',
    'id="cat-cover-badge-text"',
    'id="cat-cover-title"',
    'id="cat-cover-desc"',
    'id="cat-cover-link"',
    'categoryMetadata',
    'product-cat-pill',
    'assets/herbal_infusions_tea_1779202539010.webp',
    'assets/tea_accessory_mug_1779202706641.png',
    'assets/cover-conf.jpg',
    'assets/cover-cgv.jpg',
    'assets/yukon-haughton-Fkt0y2UZg88-unsplash.webp',
    'assets/hero-image.webp'
];

requiredElements.forEach(el => {
    assert(html.includes(el), `Élément requis manquant dans product.html : ${el}`);
});

console.log('[SUCCÈS] Tous les éléments et photos de couverture de catégories sont parfaitement configurés dans product.html !');
