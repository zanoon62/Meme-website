/**
 * Professional Email Service using Resend REST API.
 * Uses native fetch — no additional external dependencies needed.
 *
 * Required Env Vars:
 *   - RESEND_API_KEY: API key from https://resend.com
 *   - EMAIL_FROM: Verified sender address (e.g. "MEME Atelier <orders@yourdomain.com>")
 */

import { logger } from "@/lib/logger";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface OrderConfirmationEmailParams {
  orderNumber: string;
  recipientEmail: string;
  lines: Array<{
    title?: string;
    name?: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  subtotal?: number;
  discountTotal?: number;
  couponCode?: string;
  shippingTotal?: number;
  shippingZoneName?: string;
  vatTotal?: number;
  paymentFee?: number;
  paymentMethodName?: string;
  total: number;
  shippingAddress: {
    fullName?: string;
    first_name?: string;
    last_name?: string;
    line1?: string;
    address1?: string;
    line2?: string;
    address2?: string;
    city: string;
    governorate?: string;
    state?: string;
    phone?: string;
  };
  shippingMethod?: string;
  customerNote?: string;
}

/**
 * Sends a branded, luxury HTML order confirmation email to the customer.
 */
export async function sendOrderConfirmationEmail(
  params: OrderConfirmationEmailParams
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("Resend API key missing — skipping order confirmation email.");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const fromAddress =
    process.env.EMAIL_FROM || "MEME Atelier <orders@memefashion.com>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://meme-eg.store";

  const customerName =
    params.shippingAddress.fullName ||
    [params.shippingAddress.first_name, params.shippingAddress.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Customer";
  const addressLine1 =
    params.shippingAddress.line1 || params.shippingAddress.address1 || "";
  const addressLine2 =
    params.shippingAddress.line2 || params.shippingAddress.address2 || "";
  const stateOrGov =
    params.shippingAddress.governorate || params.shippingAddress.state || "";
  const phone = params.shippingAddress.phone || "";

  // Build itemized table rows
  const itemsHtml = params.lines
    .map((item) => {
      const title = item.title || item.name || "Item";
      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
          <strong style="color: #111111; font-size: 14px;">${title}</strong>
          ${
            item.size || item.color
              ? `<div style="font-size: 12px; color: #777777; margin-top: 2px;">${[
                  item.size && `Size: ${item.size}`,
                  item.color && `Color: ${item.color}`,
                ]
                  .filter(Boolean)
                  .join(" | ")}</div>`
              : ""
          }
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 14px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #111111; font-size: 14px; font-weight: 600;">
          EGP ${(item.price * item.quantity).toLocaleString("en-US")}
        </td>
      </tr>
    `;
    })
    .join("");

  const calculatedSubtotal = params.subtotal ?? params.lines.reduce((s, l) => s + l.price * l.quantity, 0);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Order Confirmation — ${params.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color: #f7f7f7; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" maxWidth="600" cellPadding="0" cellSpacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #111111; padding: 32px 40px; text-align: center;">
                  <div style="display: inline-block; width: 36px; height: 36px; line-height: 36px; background-color: #ffffff; color: #111111; border-radius: 50%; font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin-bottom: 12px;">
                    M
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">
                    MEME Atelier
                  </h1>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #888888;">
                    Order Confirmed
                  </p>
                  <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111111;">
                    Thank you for your order, ${customerName.split(" ")[0]}!
                  </h2>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
                    We are preparing your package with care. Below is a summary of your order <strong>#${params.orderNumber}</strong>.
                  </p>

                  <!-- Order Items Table -->
                  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="margin-bottom: 24px;">
                    <thead>
                      <tr>
                        <th style="padding: 8px 0; border-bottom: 2px solid #111111; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Item</th>
                        <th style="padding: 8px 0; border-bottom: 2px solid #111111; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Qty</th>
                        <th style="padding: 8px 0; border-bottom: 2px solid #111111; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Total Breakdown Section -->
                  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="margin-bottom: 32px; border-top: 1px solid #eeeeee; padding-top: 16px;">
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #666666;">Subtotal</td>
                      <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #111111; font-weight: 500;">
                        EGP ${calculatedSubtotal.toLocaleString("en-US")}
                      </td>
                    </tr>

                    ${
                      (params.discountTotal ?? 0) > 0
                        ? `
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #059669;">Discount ${params.couponCode ? `(${params.couponCode})` : ""}</td>
                      <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #059669; font-weight: 600;">
                        -EGP ${params.discountTotal!.toLocaleString("en-US")}
                      </td>
                    </tr>`
                        : ""
                    }

                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #666666;">Shipping ${params.shippingZoneName ? `(${params.shippingZoneName.split(" (")[0]})` : ""}</td>
                      <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #111111; font-weight: 500;">
                        ${params.shippingTotal === 0 ? '<span style="color: #059669; font-weight: 600;">FREE</span>' : `EGP ${(params.shippingTotal ?? 75).toLocaleString("en-US")}`}
                      </td>
                    </tr>

                    ${
                      (params.vatTotal ?? 0) > 0
                        ? `
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #666666;">VAT (14% Egypt Tax)</td>
                      <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #111111; font-weight: 500;">
                        EGP ${params.vatTotal!.toLocaleString("en-US")}
                      </td>
                    </tr>`
                        : ""
                    }

                    ${
                      (params.paymentFee ?? 0) > 0
                        ? `
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #666666;">Payment Fee ${params.paymentMethodName ? `(${params.paymentMethodName})` : ""}</td>
                      <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #111111; font-weight: 500;">
                        EGP ${params.paymentFee!.toLocaleString("en-US")}
                      </td>
                    </tr>`
                        : ""
                    }

                    <tr>
                      <td style="padding: 14px 0 6px 0; font-size: 16px; font-weight: 700; color: #111111; border-top: 2px solid #111111;">Total Amount</td>
                      <td style="padding: 14px 0 6px 0; font-size: 20px; font-weight: 800; text-align: right; color: #d97706; border-top: 2px solid #111111;">
                        EGP ${params.total.toLocaleString("en-US")}
                      </td>
                    </tr>
                    ${
                      params.paymentMethodName
                        ? `
                    <tr>
                      <td colspan="2" style="font-size: 12px; color: #777777; text-align: right; padding-top: 4px;">
                        Payment Method: <strong>${params.paymentMethodName}</strong>
                      </td>
                    </tr>`
                        : ""
                    }
                  </table>

                  <!-- Shipping Address -->
                  <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #777777;">
                      Delivery Address
                    </h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #222222;">
                      <strong>${customerName}</strong><br/>
                      ${addressLine1}<br/>
                      ${addressLine2 ? `${addressLine2}<br/>` : ""}
                      ${params.shippingAddress.city}${stateOrGov ? `, ${stateOrGov}` : ""}<br/>
                      ${phone ? `Phone: ${phone}` : ""}
                    </p>
                    ${
                      params.customerNote
                        ? `
                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #dddddd; font-size: 13px; color: #555555;">
                      <strong>Note:</strong> ${params.customerNote}
                    </div>`
                        : ""
                    }
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${siteUrl}/account" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      View Order Status
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f5f5f5; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #888888;">
                    MEME Atelier — Luxury Women's Fashion
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #aaaaaa;">
                    If you have questions about your order, reply to this email or contact customer care.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.recipientEmail],
        subject: `Order Confirmation — #${params.orderNumber} | MEME Atelier`,
        html,
      }),
    });

    const data = (await res.json()) as { id?: string; message?: string; name?: string };

    if (!res.ok) {
      logger.error("Resend email failed", {
        status: res.status,
        error: data.message || "Unknown error",
      });
      return { ok: false, error: data.message || `HTTP ${res.status}` };
    }

    logger.info("Order confirmation email sent successfully", {
      id: data.id,
      recipient: params.recipientEmail,
    });
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Exception sending email", { error: message });
    return { ok: false, error: message };
  }
}
