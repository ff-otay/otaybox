const fs = require('fs');
const path = require('path');

const dir = 'd:\\otay-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const pagesWithCovers = {
    'faq.html': 'FAQ — ÔTAY BOX',
    'cgv.html': 'Conditions Générales de Vente',
    'confidentialite.html': 'Politique de confidentialité',
    'retours.html': 'Conditions de retour et d’échange',
    'livraison.html': 'Politique de livraison',
    'collaborer.html': 'Collaborer avec ÔTAY BOX'
};

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace emojis
    content = content.replace(/📧\s*/g, '<i class="fa-regular fa-envelope"></i> ');
    content = content.replace(/📞\s*/g, '<i class="fa-solid fa-phone"></i> ');
    content = content.replace(/🌿\s*/g, '');

    // Fix footer links (remove social links from the ÔTAY BOX column)
    const oldLinks = /<ul class="footer-links">\s*<li><a href="index\.html#about">À propos<\/a><\/li>\s*<li><a href="collaborer\.html">Collaborer avec nous<\/a><\/li>\s*<li><a href="index\.html#contact">Contact<\/a><\/li>[\s\S]*?<\/ul>/g;
    const newLinks = `<ul class="footer-links">
                    <li><a href="index.html#about">À propos</a></li>
                    <li><a href="collaborer.html">Collaborer avec nous</a></li>
                    <li><a href="index.html#contact">Contact</a></li>
                </ul>`;
    content = content.replace(oldLinks, newLinks);

    // Add cover photos to specific pages
    if (pagesWithCovers[f]) {
        const title = pagesWithCovers[f];
        
        // Update padding-top for .legal-page
        content = content.replace(/\.legal-page\s*\{\s*padding-top:\s*calc\(var\(--nav-height\)\s*\+\s*3rem\);/, '.legal-page { padding-top: var(--nav-height);');
        
        // Find the original H1
        const h1Regex = new RegExp(`<h1>${title.replace(/[.*+?^$\/{}()|[\\]\\\\]/g, '\\$&')}</h1>`);
        content = content.replace(h1Regex, '');
        
        // Insert cover
        const coverHTML = `
        <div class="legal-cover" style="width: 100%; height: 350px; background-image: url('assets/hero-image.webp'); background-size: cover; background-position: center 30%; margin-bottom: 3rem; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(47, 42, 37, 0.4);"></div>
            <h1 style="position: relative; color: #fff; font-size: 3rem; text-align: center; font-family: var(--font-heading); margin: 0; padding: 0 20px; z-index: 1;">${title}</h1>
        </div>
        <div class="container legal-content fade-in">`;
        
        content = content.replace('        <div class="container legal-content fade-in">', coverHTML);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${f}`);
}
