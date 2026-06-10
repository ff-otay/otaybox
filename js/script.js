/**
 * ÔTAY BOX - main script
 * Handles theme toggle, navbar effects, scroll animations, mobile menu, and cart
 */

// Global Product Data
const productsData = [
    { id: 1, title: "Infusion Douce Nuit", category: "infusions", sub: "Tisane artisanale", price: "12,90 TND", stars: 5, reviews: 56, img: "assets/Sachets d'infusion ÔTAY.png" },
    { id: 2, title: "Mug en céramique « Pause douceur »", category: "accessoires", sub: "Accessoire artisanal", price: "18,90 TND", stars: 5, reviews: 23, img: "assets/Mug Rose Poudré ÔTAY.png" },
    { id: 4, title: "Bougie Fleur de coton", category: "bougies", sub: "Senteur naturelle", price: "16,90 TND", stars: 5, reviews: 17, img: "assets/tea_accessory_mug_1779202706641.png" },
    { id: 5, title: "Savon surgras naturel Amande douce", category: "savons", sub: "Soin bio", price: "7,90 TND", stars: 5, reviews: 31, img: "assets/sweet_treat_honey_1779202724881.png" },
    { id: 6, title: "Infusette Cuillère Cœur", category: "accessoires", sub: "Accessoire en inox", price: "9,90 TND", stars: 5, reviews: 15, img: "assets/Infusette.png" },
    { id: 8, title: "Coffret Fleuriste Rosé", category: "infusions", sub: "Premium Herbal Infusion", price: "24,90 TND", stars: 5, reviews: 12, img: "assets/tea_sachets_1779202622262.png" },
    { id: 9, title: "Miel Artisanal Raw & Bio", category: "savons", sub: "Douceur bien-être", price: "14,50 TND", stars: 5, reviews: 29, img: "assets/sweet_treat_honey_1779202724881.png" },
    { id: 10, title: "Guide Rituel Bien-être", category: "lifestyle", sub: "Inspiration & Conseils", price: "5,00 TND", stars: 5, reviews: 9, img: "assets/wellness_card_art_1779202974836.png" }
];

// Global Cart Management
window.otayCart = {
    items: JSON.parse(localStorage.getItem('otayCart')) || [],
    save() {
        localStorage.setItem('otayCart', JSON.stringify(this.items));
        this.updateUI();
    },
    add(product, quantity = 1) {
        const existing = this.items.find(item => item.id === product.id);
        if (existing) {
            existing.qty += quantity;
        } else {
            this.items.push({ ...product, qty: quantity });
        }
        this.save();
    },
    remove(id) {
        this.items = this.items.filter(item => item.id !== id);
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
    window.otayCart.updateUI();

    // --- Current Year in Footer ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Theme Toggle Setup ---
    const themeBtn = document.querySelector('.theme-toggle');
    const htmlElement = document.documentElement;

    // Check local storage for theme preference, default to dark
    const savedTheme = localStorage.getItem('otay-theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('otay-theme', newTheme);
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
    const menuIcon = menuBtn.querySelector('i');

    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-xmark');
        } else {
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        });
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
        // --- WhatsApp Button ---
        const whatsappBtn = document.querySelector('.btn-whatsapp');

        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                const title = document.getElementById('product-title')?.textContent || 'Produit ÔTAY';

                window.open(
                    `https://wa.me/216XXXXXXXX?text=Bonjour 🌿 Je souhaite commander : ${title}`
                );
            });
        }
    });

    // --- Mini Cart Interaction (Stub removed, logic handled globally) ---
    // If there are any static buttons that need simple UI feedback, we leave this skeleton,
    // but the actual addition is handled where buttons have product data context.
    const staticCartBtns = document.querySelectorAll('.add-to-cart-btn-static');
    staticCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Just UI feedback
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
});
