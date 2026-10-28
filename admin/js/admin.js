/**
 * ÔTAY BOX - Script Commun d'Administration
 * Gère le contrôle de session, la navigation, les badges et utilitaires.
 */

(function(window) {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Contrôle d'accès strict avec vérification de la session Supabase
        const session = await window.OtayAPI.requireAdminAsync();
        if (!session) return;

        // 2. Affichage des informations de l'administratrice dans la sidebar
        const emailEl = document.getElementById('admin-sidebar-email');
        if (emailEl) {
            emailEl.textContent = session.email || 'contact@otaybox.tn';
        }

        // 3. Gestionnaire de déconnexion
        const logoutBtns = document.querySelectorAll('.btn-admin-logout');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Voulez-vous vraiment vous déconnecter du Dashboard ?')) {
                    await window.OtayAPI.adminLogout();
                    window.location.href = 'login.html';
                }
            });
        });

        // 4. Menu mobile toggle
        const toggleBtn = document.getElementById('admin-menu-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.remove('open');
                }
            });
        }
    });

    // Utilitaires de rendu
    window.AdminUI = {
        formatDT(val) {
            return Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
        },

        formatDateTime(isoStr) {
            if (!isoStr) return '—';
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return isoStr;
            return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        },

        getOrderStatusBadge(status) {
            const map = {
                'Nouvelle': 'badge-order-nouvelle',
                'À confirmer': 'badge-order-aconfirmer',
                'Confirmée': 'badge-order-confirmee',
                'En préparation': 'badge-order-enpreparation',
                'Expédiée': 'badge-order-expediee',
                'Livrée': 'badge-order-livree',
                'Annulée': 'badge-order-annulee',
                'Retour': 'badge-order-retour'
            };
            const cls = map[status] || 'badge-deliv-nonpreparee';
            return `<span class="status-badge ${cls}"><i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${status}</span>`;
        },

        getDeliveryStatusBadge(status) {
            const map = {
                'Non préparée': 'badge-deliv-nonpreparee',
                'En préparation': 'badge-deliv-enpreparation',
                'Remise au transporteur': 'badge-deliv-remise',
                'En transit': 'badge-deliv-transit',
                'Livrée': 'badge-deliv-livree',
                'Échec de livraison': 'badge-deliv-echec',
                'Retour en cours': 'badge-deliv-retour'
            };
            const cls = map[status] || 'badge-deliv-nonpreparee';
            return `<span class="status-badge ${cls}"><i class="fa-solid fa-truck" style="font-size: 9px;"></i> ${status}</span>`;
        },

        getPaymentStatusBadge(status) {
            const map = {
                'En attente': 'badge-pay-attente',
                'Payé': 'badge-pay-paye',
                'Échec ou non encaissé': 'badge-pay-echec',
                'Remboursé': 'badge-pay-rembourse'
            };
            const cls = map[status] || 'badge-pay-attente';
            return `<span class="status-badge ${cls}"><i class="fa-solid fa-credit-card" style="font-size: 9px;"></i> ${status}</span>`;
        },

        getOriginBadge(origin) {
            if (origin === 'ileycom') {
                return `<span class="status-badge badge-origin-ileycom"><i class="fa-solid fa-globe"></i> ILEY'COM</span>`;
            }
            if (origin === 'international_direct') {
                return `<span class="status-badge badge-origin-intl"><i class="fa-solid fa-plane"></i> Direct International</span>`;
            }
            return `<span class="status-badge badge-origin-site"><i class="fa-solid fa-store"></i> otaybox.tn</span>`;
        }
    };

})(window);
