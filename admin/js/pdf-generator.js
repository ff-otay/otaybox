/**
 * ÔTAY BOX - Moteur de Génération PDF Vectoriel Haute Fidélité
 * Reproduit scrupuleusement le modèle officiel A4 du devis Clinique Ennasr (OTB-DEV-2026-001)
 * et décline l'identité visuelle pour les factures professionnelles.
 */

(function(window) {
    'use strict';

    const PdfGenerator = {
        /**
         * Génère le HTML A4 d'un Devis
         */
        renderQuoteHTML(quote) {
            const items = quote.items || [];
            const rowsHtml = items.map(item => `
                <tr>
                    <td class="col-desc">
                        <div class="item-title">${escapeHtml(item.designation)}</div>
                        ${item.description ? `<div class="item-sub">${escapeHtml(item.description)}</div>` : ''}
                    </td>
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-unit">${formatPrice(item.unit_price)}</td>
                    <td class="col-total ${Number(item.total_price) < 0 ? 'text-discount' : ''}">${formatPrice(item.total_price)}</td>
                </tr>
            `).join('');

            const conditionsHtml = (quote.conditions || []).map(c => `<li>• ${escapeHtml(c)}</li>`).join('');

            const qtyRef = quote.quantity_reference || (items.length > 0 ? items[0].quantity : 1);
            const unitPriceAfterDiscount = quote.unit_price_after_discount 
                ? formatPrice(quote.unit_price_after_discount) + ' DT'
                : (Number(quote.total) / (Number(qtyRef) || 1)).toFixed(3) + ' DT';

            return `
                <div class="a4-page devis-document" id="printable-quote">
                    <!-- En-tête -->
                    <div class="doc-header">
                        <div class="brand-logo-wrap">
                            <img src="../assets/logo.png" alt="Logo ÔTAY BOX" class="doc-logo" onerror="this.src='../assets/logo.png';">
                        </div>
                        <div class="doc-meta">
                            <h1 class="doc-type-title">DEVIS</h1>
                            <div class="doc-ref">N°: ${escapeHtml(quote.quote_number)}</div>
                            <div class="doc-date">Date : ${formatDate(quote.issue_date)}</div>
                        </div>
                    </div>

                    <div class="header-divider"></div>

                    <!-- Cartouches coordonnées -->
                    <div class="parties-container">
                        <div class="party-box brand-party">
                            <div class="party-name">ÔTAY BOX</div>
                            <div class="party-contact-row"><i class="fa-solid fa-phone"></i> +216 54 050 380</div>
                            <div class="party-contact-row"><i class="fa-regular fa-envelope"></i> contact@otaybox.tn</div>
                            <div class="party-contact-row"><i class="fa-solid fa-globe"></i> otaybox.tn</div>
                        </div>
                        <div class="party-box client-party">
                            <div class="party-label">CLIENT</div>
                            <div class="party-name client-name">${escapeHtml(quote.client_name)}</div>
                            ${quote.expected_delivery ? `
                                <div class="delivery-mention-label">Livraison prévue :</div>
                                <div class="delivery-mention-val">${escapeHtml(quote.expected_delivery)}</div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Section Titre Détail -->
                    <div class="section-banner-title">DÉTAIL DU DEVIS</div>

                    <!-- Tableau des prestations -->
                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th class="col-desc">DÉSIGNATION</th>
                                <th class="col-qty">QTÉ</th>
                                <th class="col-unit">PRIX UNIT. (DT)</th>
                                <th class="col-total">TOTAL (DT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <!-- Encadré Totaux -->
                    <div class="totals-banner">
                        <div class="totals-row">
                            <span class="totals-label">Prix unitaire après remise</span>
                            <span class="totals-value-highlight">${unitPriceAfterDiscount}</span>
                        </div>
                        <div class="totals-row main-total-row">
                            <span class="totals-label">Montant total pour ${qtyRef} coffrets</span>
                            <span class="totals-value-large">${formatPrice(quote.total)} DT</span>
                        </div>
                    </div>

                    <!-- Conditions -->
                    <div class="doc-conditions-section">
                        <div class="conditions-title">CONDITIONS</div>
                        <ul class="conditions-list">
                            ${conditionsHtml}
                        </ul>
                    </div>

                    <!-- Pied de page -->
                    <div class="doc-footer">
                        <div class="footer-left">ÔTAY BOX - Rituels de bien-être, instants de douceur</div>
                        <div class="footer-right">otaybox.tn | contact@otaybox.tn | +216 54 050 380</div>
                    </div>
                </div>
            `;
        },

        /**
         * Génère le HTML A4 d'une Facture
         */
        renderInvoiceHTML(invoice) {
            const items = invoice.items || [];
            const rowsHtml = items.map(item => `
                <tr>
                    <td class="col-desc">
                        <div class="item-title">${escapeHtml(item.designation)}</div>
                    </td>
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-unit">${formatPrice(item.unit_price)}</td>
                    <td class="col-total">${formatPrice(item.total_price)}</td>
                </tr>
            `).join('');

            return `
                <div class="a4-page facture-document" id="printable-invoice">
                    <div class="doc-header">
                        <div class="brand-logo-wrap">
                            <img src="../assets/logo.png" alt="Logo ÔTAY BOX" class="doc-logo">
                        </div>
                        <div class="doc-meta">
                            <h1 class="doc-type-title">FACTURE</h1>
                            <div class="doc-ref">N°: ${escapeHtml(invoice.invoice_number)}</div>
                            <div class="doc-date">Date : ${formatDate(invoice.issue_date)}</div>
                        </div>
                    </div>

                    <div class="header-divider"></div>

                    <div class="parties-container">
                        <div class="party-box brand-party">
                            <div class="party-name">ÔTAY BOX</div>
                            <div class="party-contact-row">+216 54 050 380</div>
                            <div class="party-contact-row">contact@otaybox.tn</div>
                            <div class="party-contact-row">otaybox.tn</div>
                            <div class="party-fiscal">Tunis, Tunisie</div>
                        </div>
                        <div class="party-box client-party">
                            <div class="party-label">FACTURÉ À</div>
                            <div class="party-name client-name">${escapeHtml(invoice.client_name)}</div>
                            ${invoice.client_address ? `<div>${escapeHtml(invoice.client_address)}</div>` : ''}
                            ${invoice.client_phone ? `<div>Tél : ${escapeHtml(invoice.client_phone)}</div>` : ''}
                            ${invoice.client_fiscal_id ? `<div>MF : ${escapeHtml(invoice.client_fiscal_id)}</div>` : ''}
                        </div>
                    </div>

                    <div class="section-banner-title">DÉTAIL DE LA FACTURE</div>

                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th class="col-desc">DÉSIGNATION</th>
                                <th class="col-qty">QTÉ</th>
                                <th class="col-unit">PRIX UNIT. (DT)</th>
                                <th class="col-total">TOTAL (DT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <div class="totals-banner">
                        <div class="totals-row">
                            <span class="totals-label">Sous-total</span>
                            <span class="totals-value-highlight">${formatPrice(invoice.subtotal)} DT</span>
                        </div>
                        ${Number(invoice.shipping_fee) > 0 ? `
                            <div class="totals-row">
                                <span class="totals-label">Frais de livraison</span>
                                <span class="totals-value-highlight">${formatPrice(invoice.shipping_fee)} DT</span>
                            </div>
                        ` : ''}
                        ${Number(invoice.discount) > 0 ? `
                            <div class="totals-row">
                                <span class="totals-label">Remise</span>
                                <span class="totals-value-highlight">-${formatPrice(invoice.discount)} DT</span>
                            </div>
                        ` : ''}
                        <div class="totals-row main-total-row">
                            <span class="totals-label">Total Net à Payer</span>
                            <span class="totals-value-large">${formatPrice(invoice.total)} DT</span>
                        </div>
                    </div>

                    <div class="doc-conditions-section">
                        <div class="conditions-title">MENTIONS LÉGALES & RÈGLEMENT</div>
                        <p style="font-size: 11px; color: #555; line-height: 1.5; margin: 4px 0;">
                            ${escapeHtml(invoice.legal_notes || 'Facture émise conformément aux règles commerciales applicables en Tunisie.')}
                        </p>
                    </div>

                    <div class="doc-footer">
                        <div class="footer-left">ÔTAY BOX - Rituels de bien-être, instants de douceur</div>
                        <div class="footer-right">otaybox.tn | contact@otaybox.tn | +216 54 050 380</div>
                    </div>
                </div>
            `;
        },

        /**
         * Déclenche le téléchargement du PDF vectoriel avec html2pdf
         */
        async downloadPDF(elementId, filename) {
            const el = document.getElementById(elementId);
            if (!el) {
                alert("Erreur : Document non trouvé pour l'impression.");
                return;
            }

            if (window.html2pdf) {
                const opt = {
                    margin: 0,
                    filename: filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                return window.html2pdf().set(opt).from(el).save();
            } else {
                // Alternative native : impression vers PDF
                window.print();
            }
        }
    };

    function formatPrice(val) {
        return Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }

    function formatDate(dStr) {
        if (!dStr) return '';
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('fr-FR');
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.PdfGenerator = PdfGenerator;

})(window);
