const fs = require('fs');
const path = require('path');

const dir = 'd:\\otay-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Reverse double encoding
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    let fixed = Buffer.from(content, 'binary').toString('utf8');

    // Replace emojis
    fixed = fixed.replace(/📧\s*/g, '<i class="fa-regular fa-envelope"></i> ');
    fixed = fixed.replace(/📞\s*/g, '<i class="fa-solid fa-phone"></i> ');
    fixed = fixed.replace(/🌿\s*/g, '');

    // Replace footer links (ÔTAY BOX column)
    const oldLinks = /<ul class="footer-links">\s*<li><a href="index\.html#about">À propos<\/a><\/li>\s*<li><a href="collaborer\.html">Collaborer avec nous<\/a><\/li>\s*<li><a href="index\.html#contact">Contact<\/a><\/li>[\s\S]*?<\/ul>/g;
    
    const newLinks = `<ul class="footer-links">
                    <li><a href="index.html#about">À propos</a></li>
                    <li><a href="collaborer.html">Collaborer avec nous</a></li>
                    <li><a href="index.html#contact">Contact</a></li>
                </ul>`;
                
    fixed = fixed.replace(oldLinks, newLinks);

    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Processed ${f}`);
}
