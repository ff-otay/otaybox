// =============================================================================
// Supabase Edge Function : Envoi de notification de commande à l'administratrice
// Destinataire : contact@otaybox.tn
// Expéditeur vérifié : ÔTAY BOX <commandes@otaybox.tn>
// Sécurité : La clé API Resend reste strictement sur le serveur via RESEND_API_KEY
// Confidentialité : Aucun renseignement personnel client dans le corps de l'e-mail
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const order = payload.order || payload.record;

    if (!order || !order.order_number) {
      return new Response(JSON.stringify({ error: "Données de commande manquantes (order_number requis)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contact@otaybox.tn";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const dashboardBaseUrl = Deno.env.get("DASHBOARD_URL") || "https://otaybox.tn/admin";

    const detailUrl = `${dashboardBaseUrl}/commande-detail.html?id=${order.id || order.order_number}`;

    // Tableau des articles sans aucune donnée client
    const itemsHtml = Array.isArray(order.items)
      ? order.items.map((i: any) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eef2ee;">${i.product_name || i.name || 'Article'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eef2ee; text-align: center;">${i.quantity || i.qty || 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eef2ee; text-align: right;">${Number(i.unit_price || i.price || 0).toFixed(3)} DT</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eef2ee; text-align: right; font-weight: bold; color: #4b6c4f;">${Number(i.total_price || ((i.price || 0) * (i.qty || 1))).toFixed(3)} DT</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4" style="padding: 10px 12px;">Consultez les articles dans le dashboard.</td></tr>`;

    // Gabarit e-mail respectant la confidentialité absolue du client
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF8F5; padding: 25px; border-radius: 12px; border: 1px solid #e6ded5;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #4b6c4f; margin: 0; font-size: 26px; letter-spacing: 2px;">ÔTAY BOX</h1>
          <p style="color: #6e6862; font-size: 13px; margin-top: 4px;">Rituels de bien-être, instants de douceur</p>
          <div style="display: inline-block; background: #4b6c4f; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-top: 10px; letter-spacing: 0.5px;">
            NOUVELLE COMMANDE EN LIGNE
          </div>
        </div>

        <div style="background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 20px;">
          <h2 style="font-size: 18px; color: #2F2A25; margin-top: 0; border-bottom: 2px solid #4b6c4f; padding-bottom: 8px;">
            Commande N° ${order.order_number}
          </h2>
          <p style="font-size: 14px; color: #424746; margin: 8px 0; line-height: 1.5;">
            Une nouvelle commande vient d'être validée avec succès sur votre boutique en ligne <strong>otaybox.tn</strong>.
          </p>
          <div style="background: #fdfbf7; border-left: 4px solid #4b6c4f; padding: 10px 14px; margin-top: 12px; font-size: 13px; color: #5c5046; border-radius: 0 6px 6px 0;">
            🔒 <strong>Confidentialité garantie :</strong> Les coordonnées personnelles du client et son adresse de livraison sont consultables directement dans votre espace d'administration sécurisé.
          </div>
        </div>

        <div style="background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 20px;">
          <h3 style="font-size: 15px; color: #2F2A25; margin-top: 0; margin-bottom: 12px;">Articles commandés</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f4f7f4; color: #4b6c4f; text-align: left;">
                <th style="padding: 8px 12px;">Désignation</th>
                <th style="padding: 8px 12px; text-align: center;">Qté</th>
                <th style="padding: 8px 12px; text-align: right;">Prix unitaire</th>
                <th style="padding: 8px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; font-size: 14px; text-align: right;">
            <div style="margin-bottom: 4px;">Sous-total : <strong>${Number(order.subtotal || 0).toFixed(3)} DT</strong></div>
            <div style="margin-bottom: 4px;">Livraison : <strong>${Number(order.shipping_fee) === 0 ? 'Offerte (Gratuite)' : Number(order.shipping_fee || 0).toFixed(3) + ' DT'}</strong></div>
            <div style="font-size: 18px; color: #4b6c4f; font-weight: bold; margin-top: 8px;">
              Total à percevoir : ${Number(order.total || 0).toFixed(3)} DT
            </div>
            <div style="font-size: 12px; color: #8C857E; margin-top: 4px;">Paiement : ${order.payment_method || 'À la livraison'} (${order.payment_status || 'En attente'})</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 25px; margin-bottom: 15px;">
          <a href="${detailUrl}" style="background-color: #4b6c4f; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 50px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(75, 108, 79, 0.25);">
            Accéder à la commande dans le Dashboard
          </a>
        </div>

        <p style="text-align: center; font-size: 11px; color: #a19a93; margin-top: 25px;">
          Notification générée automatiquement par le système ÔTAY BOX • ${new Date().toLocaleString("fr-FR")}
        </p>
      </div>
    `;

    // Envoi via Resend en utilisant la clé secrète Supabase RESEND_API_KEY
    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ÔTAY BOX <commandes@otaybox.tn>",
          to: [adminEmail],
          subject: `🌿 Nouvelle commande reçue : #${order.order_number} (${Number(order.total || 0).toFixed(3)} DT)`,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.error("Erreur retournée par l'API Resend:", resendData);
        return new Response(JSON.stringify({ success: false, error: resendData }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, id: resendData.id, provider: "resend" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } 
    
    // Fallback Brevo si configuré
    if (brevoApiKey) {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "ÔTAY BOX", email: "contact@otaybox.tn" },
          to: [{ email: adminEmail }],
          subject: `🌿 Nouvelle commande reçue : #${order.order_number} (${Number(order.total || 0).toFixed(3)} DT)`,
          htmlContent: htmlContent,
        }),
      });

      const brevoData = await brevoRes.json();
      return new Response(JSON.stringify({ success: brevoRes.ok, data: brevoData, provider: "brevo" }), {
        status: brevoRes.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Secret RESEND_API_KEY introuvable dans Supabase Secrets." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
