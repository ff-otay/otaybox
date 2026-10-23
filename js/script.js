/**
 * ÔTAY BOX - main script
 * Handles theme toggle, navbar effects, scroll animations, mobile menu, and cart
 */

// Apply saved theme IMMEDIATELY to prevent flash of wrong theme
(function() {
    const saved = localStorage.getItem('otay-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

// Global Product Data
const productsData = [
    { id: 1, title: "Box Jardin de douceur", category: "infusions", sub: "Tisane artisanale", price: "59,00 TND", stars: 5, reviews: 56, img: "assets/produit.webp" },
    { id: 6, title: "Infusette cuillère cœur", category: "accessoires", sub: "Accessoire en inox", price: "20,00 TND", stars: 5, reviews: 15, img: "assets/Infusette.webp" },
    { id: 9, title: "3 Tisanes collection Jardin de douceur", category: "infusions", sub: "Douceur bien-être", price: "24,00 TND", stars: 5, reviews: 29, img: "assets/produit3.webp" },
    { id: 2, title: "Bubble Mug en céramique", category: "accessoires", sub: "Accessoire artisanal", price: "25,00 TND", stars: 5, reviews: 23, img: "assets/produit1.webp" }
];

// Global Cart Management
window.otayCart = {
    items: JSON.parse(localStorage.getItem('otayCart')) || [],
    save() {
        localStorage.setItem('otayCart', JSON.stringify(this.items));
        this.updateUI();
    },
    add(product, quantity = 1) {
        const existing = this.items.find(item => String(item.id) === String(product.id));
        if (existing) {
            existing.qty += quantity;
        } else {
            this.items.push({
                id: product.id,
                title: product.title || product.name,
                name: product.name || product.title,
                price: product.price,
                img: product.img || product.image || 'assets/produit.webp',
                qty: quantity
            });
        }
        this.save();
    },
    remove(id) {
        this.items = this.items.filter(item => String(item.id) !== String(id));
        this.save();
    },
    updateUI() {
        const counts = document.querySelectorAll('.cart-count');
        const totalQty = this.items.reduce((sum, item) => sum + item.qty, 0);
        counts.forEach(c => {
            c.textContent = totalQty;
            c.style.transform = 'scale(1.5)';
            setTimeout(() => { c.style.transform = 'scale(1)'; }, 300);
        });
        
        const cartDropdownList = document.getElementById('cart-items');
        const cartEmpty = document.querySelector('.cart-empty');
        if (cartDropdownList && cartEmpty) {
            cartDropdownList.innerHTML = '';
            if (this.items.length === 0) {
                cartEmpty.style.display = 'block';
                cartDropdownList.style.display = 'none';
            } else {
                cartEmpty.style.display = 'none';
                cartDropdownList.style.display = 'block';
                this.items.forEach(item => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';
                    li.style.padding = '8px 0';
                    li.style.borderBottom = '1px solid rgba(47, 42, 37, 0.05)';
                    
                    li.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.img}" alt="${item.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.85rem; font-weight: 500; color: #2F2A25; line-height: 1.2; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</span>
                                <span style="font-size: 0.75rem; color: #8C857E;">${item.qty} x ${item.price}</span>
                            </div>
                        </div>
                    `;
                    const removeBtn = document.createElement('button');
                    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                    removeBtn.style.border = 'none';
                    removeBtn.style.background = 'transparent';
                    removeBtn.style.cursor = 'pointer';
                    removeBtn.style.color = '#8C857E';
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.otayCart.remove(item.id);
                    });
                    li.appendChild(removeBtn);
                    cartDropdownList.appendChild(li);
                });
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Floating WhatsApp Button ---
    const waBtn = document.createElement('a');
    waBtn.href = "https://wa.me/21654050380?text=" + encodeURIComponent("Bonjour 🌿 J'aimerais des renseignements sur vos coffrets et infusions ÔTAY BOX.");
    waBtn.target = "_blank";
    waBtn.className = "global-wa-btn";
    waBtn.setAttribute('aria-label', 'Contacter ÔTAY BOX sur WhatsApp');
    waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
    document.body.appendChild(waBtn);

    window.otayCart.updateUI();

    // --- Lazy Image Fade-In ---
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => img.classList.add('loaded'));
        }
    });

    // --- Current Year in Footer ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Theme Toggle Setup ---
    const themeBtns = document.querySelectorAll('.theme-toggle');
    const htmlElement = document.documentElement;

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('otay-theme', newTheme);
        });
    });

    // Remove old inline onclick handlers
    document.querySelectorAll('.search-btn, .profile-btn, .cart-btn').forEach(btn => {
        btn.removeAttribute('onclick');
    });

    // Handle profile button click
    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profil.html';
        });
    });

    // Handle cart button click
    document.querySelectorAll('.cart-btn').forEach(btn => {
        if (btn.id !== 'cart-toggle') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'cart.html';
            });
        }
    });

    // --- Global Search ---
    const searchBtns = document.querySelectorAll('.search-btn');
    searchBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(250, 248, 245, 0.98)';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';

            overlay.innerHTML = `
                <button class="close-search" style="position:absolute; top:30px; right:40px; background:none; border:none; font-size:2rem; cursor:pointer; color:#2F2A25;"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="font-family:'Playfair Display',serif; font-size:2.5rem; color:#2F2A25; margin-bottom:2rem;">Que recherchez-vous ?</h2>
                <form id="global-search-form" style="width: 80%; max-width: 600px; display:flex; gap:10px;">
                    <input type="text" id="global-search-input" placeholder="Thé, mug, bougie..." style="flex:1; padding:15px 25px; font-size:1.2rem; border:2px solid #5B705F; border-radius:50px; background:transparent; outline:none; color:#2F2A25;">
                    <button type="submit" style="background:#5B705F; color:#fff; border:none; padding:15px 30px; border-radius:50px; font-size:1.1rem; cursor:pointer;"><i class="fa-solid fa-magnifying-glass"></i></button>
                </form>
            `;
            document.body.appendChild(overlay);

            setTimeout(() => {
                document.getElementById('global-search-input').focus();
            }, 100);

            overlay.querySelector('.close-search').addEventListener('click', () => {
                overlay.remove();
            });

            document.getElementById('global-search-form').addEventListener('submit', (ev) => {
                ev.preventDefault();
                const q = document.getElementById('global-search-input').value.trim();
                if (q) {
                    window.location.href = 'boutique.html?search=' + encodeURIComponent(q);
                }
            });
        });
    });

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const menuBtn = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const menuIcon = menuBtn ? menuBtn.querySelector('i') : null;

    function closeMobileMenu() {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (menuIcon) {
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileMenu) mobileMenu.classList.toggle('active');
            if (menuIcon && mobileMenu) {
                if (mobileMenu.classList.contains('active')) {
                    menuIcon.classList.remove('fa-bars');
                    menuIcon.classList.add('fa-xmark');
                } else {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            e.target !== menuBtn &&
            !menuBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Inject extra actions into mobile menu
    if (mobileMenu && !mobileMenu.querySelector('.mobile-extra')) {
        const extraDiv = document.createElement('div');
        extraDiv.className = 'mobile-extra';
        extraDiv.style.display = 'flex';
        extraDiv.style.justifyContent = 'center';
        extraDiv.style.gap = '1.5rem';
        extraDiv.style.marginTop = '1rem';
        extraDiv.style.borderTop = '1px solid var(--border-color)';
        extraDiv.style.paddingTop = '1rem';
        
        extraDiv.innerHTML = `
            <a href="#" class="icon-btn search-btn-mobile" aria-label="Rechercher"><i class="fa-solid fa-magnifying-glass"></i></a>
            <a href="profil.html" class="icon-btn" aria-label="Mon compte"><i class="fa-regular fa-user"></i></a>
            <button class="icon-btn theme-toggle-mobile" aria-label="Basculer le thème">
                <i class="fa-solid fa-sun light-icon"></i>
                <i class="fa-solid fa-moon dark-icon"></i>
            </button>
        `;
        mobileMenu.appendChild(extraDiv);
        
        // Theme toggle logic for mobile button
        const mobileThemeBtn = extraDiv.querySelector('.theme-toggle-mobile');
        mobileThemeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('otay-theme', newTheme);
        });
        
        // Search toggle logic for mobile button
        const mobileSearchBtn = extraDiv.querySelector('.search-btn-mobile');
        mobileSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMobileMenu();
        });
    }

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // --- Like / Wishlist Buttons ---
    const likedProducts = JSON.parse(localStorage.getItem('otayLiked') || '[]');

    function saveLiked() {
        localStorage.setItem('otayLiked', JSON.stringify(likedProducts));
    }

    // Attach like logic to static heart buttons (boutique page dynamically adds them)
    // We use delegation on document for dynamically created buttons
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.prod-heart-btn');
        if (!heartBtn) return;
        e.stopPropagation();
        const card = heartBtn.closest('.product-card-mock');
        const productTitle = card ? card.querySelector('h3')?.textContent || '' : '';
        const icon = heartBtn.querySelector('i');
        if (!icon) return;

        if (icon.classList.contains('fa-regular')) {
            // Like it
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
            heartBtn.style.color = '#E2725B';
            if (productTitle && !likedProducts.includes(productTitle)) {
                likedProducts.push(productTitle);
                saveLiked();
            }
        } else {
            // Unlike it
            icon.classList.remove('fa-solid');
            icon.classList.add('fa-regular');
            heartBtn.style.color = '';
            const idx = likedProducts.indexOf(productTitle);
            if (idx > -1) {
                likedProducts.splice(idx, 1);
                saveLiked();
            }
        }
    });

    // --- Scroll Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initial animations for items above the fold
    setTimeout(() => {
        const initialElements = document.querySelectorAll('.fade-in:not(.scroll-anim)');
        initialElements.forEach(el => el.classList.add('visible'));
    }, 100);

    // Setup observer for scrolling elements
    const animElements = document.querySelectorAll('.scroll-anim');
    animElements.forEach(el => {
        el.classList.add('slide-up'); // Ensure they start offset
        scrollObserver.observe(el);
    });

    // Global WhatsApp Button removed from here (moved to top of DOMContentLoaded)

    // Keep individual product WhatsApp buttons working if they exist
    const productWhatsappBtn = document.querySelector('.btn-whatsapp');
    if (productWhatsappBtn) {
        productWhatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.getElementById('product-title')?.textContent || 'Produit ÔTAY';
            window.open(`https://wa.me/21654050380?text=` + encodeURIComponent(`Bonjour 🌿 Je souhaite commander : ${title}`));
        });
    }

    // --- Contact Form → WhatsApp ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const message = document.getElementById('message')?.value || '';
            const waMessage = `Bonjour 🌿 ÔTAY BOX – Nouveau message de contact\n\n👤 Nom: ${name}\n📧 Email: ${email}\n💬 Message: ${message}`;
            window.open('https://wa.me/21654050380?text=' + encodeURIComponent(waMessage), '_blank');
            contactForm.reset();
        });
    }

    // --- Cart Checkout → WhatsApp ---
    const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutWhatsappBtn) {
        checkoutWhatsappBtn.addEventListener('click', () => {
            const items = window.otayCart.items;
            if (items.length === 0) {
                alert('Votre panier est vide !');
                return;
            }
            let orderMsg = 'Bonjour 🌿 Je souhaite passer commande :\n\n';
            let total = 0;
            items.forEach(item => {
                const priceVal = parseFloat(item.price.replace(',', '.').replace(/[^\d.-]/g, ''));
                total += priceVal * item.qty;
                orderMsg += `📦 ${item.title} x${item.qty} — ${item.price}\n`;
            });
            orderMsg += `\n💰 Total: ${total.toFixed(2).replace('.', ',')} TND`;
            orderMsg += `\n\nMerci de me confirmer la disponibilité et les modalités de livraison ! 🙏`;
            window.open('https://wa.me/21654050380?text=' + encodeURIComponent(orderMsg), '_blank');
        });
    }

    // --- Favorites WhatsApp Share ---
    const favWhatsappBtn = document.getElementById('fav-whatsapp-btn');
    if (favWhatsappBtn) {
        favWhatsappBtn.addEventListener('click', () => {
            const liked = JSON.parse(localStorage.getItem('otayLiked') || '[]');
            if (liked.length === 0) {
                alert('Vous n\'avez aucun favori pour le moment !');
                return;
            }
            let favMsg = 'Bonjour 🌿 Voici mes produits favoris ÔTAY BOX :\n\n';
            liked.forEach(item => {
                favMsg += `❤️ ${item}\n`;
            });
            favMsg += `\nJe souhaite en savoir plus sur ces produits ! 🙏`;
            window.open('https://wa.me/21654050380?text=' + encodeURIComponent(favMsg), '_blank');
        });
    }

    // --- Order via WhatsApp (Box Detail Page) ---
    const boxOrderBtn = document.getElementById('box-whatsapp-order');
    if (boxOrderBtn) {
        boxOrderBtn.addEventListener('click', function() {
            const qty = parseInt(document.getElementById('qty')?.textContent || '1');
            if (window.openWhatsAppOrderModal) {
                window.openWhatsAppOrderModal('Box Jardin de Douceur', qty);
            }
        });
    }

    // --- Static add-to-cart buttons (boutique page) ---
    const staticCartBtns = document.querySelectorAll('.add-to-cart-btn-static');
    staticCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-check"></i> Ajouté';
            this.style.backgroundColor = 'var(--accent)';
            this.style.color = '#fff';
            this.style.borderColor = 'var(--accent)';
            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.style = '';
            }, 2000);
        });
    });
    // --- Product Gallery Interaction ---
    window.updateMainImage = function (src) {
        const mainImg = document.getElementById('main-product-img');
        const thumbs = document.querySelectorAll('.thumb');

        if (mainImg) {
            mainImg.src = src;

            // Update active state
            thumbs.forEach(thumb => {
                if (thumb.src === src) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
    };

    // --- Quantity Selector ---
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const qtySpan = document.getElementById('qty');

    if (minusBtn && plusBtn && qtySpan) {
        let qty = 1;
        minusBtn.addEventListener('click', () => {
            if (qty > 1) {
                qty--;
                qtySpan.textContent = qty;
            }
        });
        plusBtn.addEventListener('click', () => {
            qty++;
            qtySpan.textContent = qty;
        });
    }

    // --- Simplified Slider Logic (Optional/Legacy check) ---
    const track = document.querySelector(".slider-track");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");

    if (track && prevBtn && nextBtn) {
        let index = 0;
        const slideWidth = 220;

        nextBtn.addEventListener("click", () => {
            const slides = track.querySelectorAll(".slide");
            if (index < slides.length - 1) {
                index++;
                track.style.transform = `translateX(-${index * slideWidth}px)`;
            }
        });

        prevBtn.addEventListener("click", () => {
            if (index > 0) {
                index--;
                track.style.transform = `translateX(-${index * slideWidth}px)`;
            }
        });
    }

    // --- Inject Global WhatsApp Order Modal ---
    const modalHTML = `
    <div id="wa-order-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
        <div style="background: #FAF8F5; width: 90%; max-width: 500px; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; max-height: 90vh; overflow-y: auto;">
            <button id="wa-modal-close" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #2F2A25;">&times;</button>
            
            <div id="wa-form-container">
                <h2 style="font-family: 'Playfair Display', serif; color: #2F2A25; margin-bottom: 0.5rem; text-align: center;">Finalisez votre commande</h2>
                <p style="color: #615B55; font-size: 0.9rem; margin-bottom: 2rem; text-align: center;">Veuillez remplir vos coordonnées pour nous envoyer votre commande via WhatsApp.</p>
                
                <form id="wa-order-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2F2A25; font-size: 0.9rem;">Produit sélectionné</label>
                        <input type="text" id="wa-product-name" readonly style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: #eee; font-size: 0.9rem; color: #615B55;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2F2A25; font-size: 0.9rem;">Quantité</label>
                        <input type="text" id="wa-product-qty" readonly style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: #eee; font-size: 0.9rem; color: #615B55;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2F2A25; font-size: 0.9rem;">Nom et prénom <span style="color: #E2725B;">*</span></label>
                        <input type="text" id="wa-client-name" required placeholder="Votre nom complet" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.9rem;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2F2A25; font-size: 0.9rem;">Numéro de téléphone <span style="color: #E2725B;">*</span></label>
                        <input type="tel" id="wa-client-phone" required placeholder="Ex: 50 123 456" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.9rem;">
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2F2A25; font-size: 0.9rem;">Adresse de livraison <span style="color: #E2725B;">*</span></label>
                        <textarea id="wa-client-address" required placeholder="Votre adresse complète..." rows="3" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.9rem; resize: vertical;"></textarea>
                    </div>
                    <button type="submit" style="width: 100%; background: #25D366; color: #fff; padding: 12px; border: none; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.3s;">
                        <i class="fa-brands fa-whatsapp"></i> Envoyer ma commande
                    </button>
                </form>
            </div>
            
            <div id="wa-success-container" style="display: none; text-align: center; padding: 2rem 0;">
                <div style="font-size: 4rem; color: #5B705F; margin-bottom: 1rem;"><i class="fa-solid fa-check-circle"></i></div>
                <h3 style="font-family: 'Playfair Display', serif; color: #2F2A25; font-size: 1.5rem; margin-bottom: 1rem;">Votre demande de commande a bien été envoyée</h3>
                <p style="color: #615B55; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem;">Nous allons vous contacter prochainement pour confirmer votre commande et organiser la livraison.</p>
                <button id="wa-back-btn" style="background: #5B705F; color: #fff; padding: 10px 24px; border: none; border-radius: 50px; font-weight: 500; cursor: pointer;">Retourner à la boutique</button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const waModal = document.getElementById('wa-order-modal');
    const waCloseBtn = document.getElementById('wa-modal-close');
    const waFormContainer = document.getElementById('wa-form-container');
    const waSuccessContainer = document.getElementById('wa-success-container');
    const waForm = document.getElementById('wa-order-form');
    const waBackBtn = document.getElementById('wa-back-btn');
    
    window.openWhatsAppOrderModal = function(productName, qty) {
        document.getElementById('wa-product-name').value = productName;
        document.getElementById('wa-product-qty').value = qty;
        waFormContainer.style.display = 'block';
        waSuccessContainer.style.display = 'none';
        waModal.style.display = 'flex';
    };
    
    waCloseBtn.addEventListener('click', () => {
        waModal.style.display = 'none';
    });
    
    waBackBtn.addEventListener('click', () => {
        waModal.style.display = 'none';
    });
    
    // Close on overlay click
    waModal.addEventListener('click', (e) => {
        if (e.target === waModal) {
            waModal.style.display = 'none';
        }
    });
    
    waForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const prod = document.getElementById('wa-product-name').value;
        const qty = document.getElementById('wa-product-qty').value;
        const name = document.getElementById('wa-client-name').value;
        const phone = document.getElementById('wa-client-phone').value;
        const address = document.getElementById('wa-client-address').value;
        
        const message = `Bonjour ÔTAY BOX
Je souhaite commander :
Produit : ${prod}
Quantité : ${qty}
Nom : ${name}
Téléphone : ${phone}
Adresse : ${address}
Merci.`;

        // Open WhatsApp
        window.open('https://wa.me/21654050380?text=' + encodeURIComponent(message), '_blank');
        
        // Show success
        waFormContainer.style.display = 'none';
        waSuccessContainer.style.display = 'block';
    });
});
