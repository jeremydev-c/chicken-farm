import { Order } from './db';
import { generateInvoicePdf } from './pdf';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tabbypremiumeggs@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tabbypremiumeggs.online';

interface EmailAttachment {
  filename: string;
  content: string; // Base64 string
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Normalizes a Kenyan phone number and returns a pre-populated WhatsApp chat URL.
 */
function getWhatsAppLink(phone: string, orderId: string, name: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  // Normalize Kenyan local formatting to international prefix +254
  if (clean.startsWith('0')) {
    clean = '254' + clean.substring(1);
  } else if (clean.startsWith('7') && clean.length === 9) {
    clean = '254' + clean;
  } else if (clean.startsWith('1') && clean.length === 9) { // support new +254 1xx prefix
    clean = '254' + clean;
  }
  
  const text = `Hello ${name}, this is Tabby Premium Eggs. We have received your reservation #${orderId} and are currently preparing your trays.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

/**
 * Generic helper to send emails via Resend's REST API using native fetch.
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn('[Resend] Warning: RESEND_API_KEY is not defined. Email dispatch skipped.');
    return { success: false, error: 'Resend API key is missing' };
  }

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Tabby Premium Eggs <noreply@tabbypremiumeggs.online>',
        to: recipients,
        subject,
        html,
        ...(attachments ? { attachments } : {})
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend] Failed to send email:', data);
      return { success: false, error: data };
    }

    console.log(`[Resend] Email sent successfully to [${recipients.join(', ')}]. ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Resend] Error during email dispatch:', error);
    return { success: false, error };
  }
}

/**
 * Generates the common styling and structure for HTML emails.
 */
function getEmailWrapper(contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tabby Premium Eggs</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2e2b26; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f4ef; padding: 30px 0;">
          <tr>
            <td align="center">
              <!-- Card Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e3decb; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04);">
                
                <!-- Brand Accent Bar -->
                <tr>
                  <td height="6" style="background: linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%);"></td>
                </tr>

                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #fcfbf9; padding: 35px 20px; border-bottom: 1px solid #ebdcb9;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #b45309; letter-spacing: -0.5px; font-family: 'Outfit', 'Inter', sans-serif;">Tabby Premium Eggs</h1>
                          <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 2px;">Grade AA Farm-Fresh • Nanyuki, Kenya</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Body -->
                <tr>
                  <td style="padding: 40px 35px; background-color: #ffffff;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #faf9f6; border-top: 1px solid #eee8d5; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #4d453a;">Tabby Premium Eggs</p>
                    <p style="margin: 0 0 20px 0; font-size: 12px; line-height: 1.6; color: #827765;">
                      Direct-sourced Grade AA eggs with golden yolks, clean shells, and premium presentation.<br>
                      <strong>Depot:</strong> Nanyuki, Kenya (Open Daily 8:00 AM – 7:00 PM)<br>
                      <strong>Support Hotline:</strong> +254 722 237 593 | <strong>Email:</strong> orders@tabbypremiumeggs.online
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${APP_URL}" style="display: inline-block; font-size: 12px; font-weight: 700; color: #d97706; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #d97706; padding: 6px 16px; border-radius: 4px;">Visit Online Store</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Builds the HTML table listing order items.
 */
function getOrderItemsTable(items: Order['items']): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #f2eedb; font-size: 14px; color: #2e2b26; font-weight: 600;">
        ${item.name}
      </td>
      <td align="center" style="padding: 14px 0; border-bottom: 1px solid #f2eedb; font-size: 14px; color: #5c554a;">
        ${item.quantity}
      </td>
      <td align="right" style="padding: 14px 0; border-bottom: 1px solid #f2eedb; font-size: 14px; color: #5c554a;">
        KES ${item.price.toLocaleString()}
      </td>
      <td align="right" style="padding: 14px 0; border-bottom: 1px solid #f2eedb; font-size: 14px; color: #b45309; font-weight: 700;">
        KES ${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-collapse: collapse;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom: 10px; border-bottom: 2px solid #ebdcb9; font-size: 11px; font-weight: 700; color: #827765; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
          <th align="center" style="padding-bottom: 10px; border-bottom: 2px solid #ebdcb9; font-size: 11px; font-weight: 700; color: #827765; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
          <th align="right" style="padding-bottom: 10px; border-bottom: 2px solid #ebdcb9; font-size: 11px; font-weight: 700; color: #827765; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
          <th align="right" style="padding-bottom: 10px; border-bottom: 2px solid #ebdcb9; font-size: 11px; font-weight: 700; color: #827765; text-transform: uppercase; letter-spacing: 0.5px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Dispatch customer confirmation email.
 */
export async function sendOrderConfirmationEmail(order: Order) {
  const formattedDate = new Date(order.orderDate).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedPickupDate = new Date(order.pickupDate).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isDelivery = order.fulfillmentType === 'delivery';
  const paymentMethodLabel = 'Paid Online via Paystack';
  
  // Custom styled badges
  const paymentStatusBadge = order.paymentStatus === 'paid'
    ? `<span style="background-color: #def7ec; color: #03543f; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">PAID ✓</span>`
    : `<span style="background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">PENDING ONLINE PAYMENT</span>`;

  const fulfillmentBadge = isDelivery
    ? `<span style="background-color: #e1effe; color: #1e429f; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">DELIVERY IN NANYUKI</span>`
    : `<span style="background-color: #edf2f7; color: #4a5568; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">PICKUP AT FARM</span>`;

  const contentHtml = `
    <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #b45309;">Order Confirmed!</h2>
    <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #5c554a;">
      Hi <strong>${order.customerName}</strong>, thank you for choosing Tabby Premium Eggs. Your reservation has been registered, and we are preparing your Grade AA trays.
    </p>

    <!-- Details Box -->
    <table border="0" cellpadding="16" cellspacing="0" width="100%" style="background-color: #faf9f6; border-radius: 12px; border: 1px solid #ebdcb9; margin-bottom: 30px;">
      <tr>
        <td>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40%" style="padding-bottom: 12px; font-size: 13px; color: #827765;"><strong>Reservation ID:</strong></td>
              <td width="60%" style="padding-bottom: 12px; font-size: 14px; color: #2e2b26; font-family: monospace; font-weight: 700;">${order.id}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-size: 13px; color: #827765;"><strong>Order Date:</strong></td>
              <td style="padding-bottom: 12px; font-size: 14px; color: #2e2b26;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-size: 13px; color: #827765;"><strong>Fulfillment Date:</strong></td>
              <td style="padding-bottom: 12px; font-size: 14px; color: #2e2b26; font-weight: 700;">${formattedPickupDate}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-size: 13px; color: #827765;"><strong>Fulfillment Type:</strong></td>
              <td style="padding-bottom: 12px; font-size: 13px;">${fulfillmentBadge}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-size: 13px; color: #827765;"><strong>Payment Method:</strong></td>
              <td style="padding-bottom: 12px; font-size: 14px; color: #2e2b26;">${paymentMethodLabel}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #827765;"><strong>Status:</strong></td>
              <td>${paymentStatusBadge}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${isDelivery ? `
      <!-- Delivery Address -->
      <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Delivery Destination</h3>
      <div style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.5; color: #2e2b26; background-color: #f9f8f6; border: 1px solid #ebdcb9; border-radius: 8px; padding: 14px;">
        📍 <strong>Address:</strong> ${order.deliveryAddress}
      </div>
    ` : `
      <!-- Pickup Depot Details -->
      <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Depot Collection Details</h3>
      <div style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #2e2b26; background-color: #fbfbf9; border-left: 4px solid #d97706; padding: 14px; border-radius: 0 8px 8px 0;">
        🏢 <strong>Pickup Location:</strong> Nanyuki depot, Nanyuki Town.<br>
        ⏰ <strong>Collection Hours:</strong> Daily 8:00 AM – 7:00 PM.<br>
        💡 <em>Please present your Reservation ID (<strong>${order.id}</strong>) to the storekeeper during pickup.</em>
      </div>
    `}

    <!-- Order Items -->
    <h3 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Reserved Products</h3>
    ${getOrderItemsTable(order.items)}

    <!-- Grand Total -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-top: 2px solid #ebdcb9; padding-top: 15px; margin-bottom: 35px;">
      <tr>
        <td align="right" style="font-size: 15px; color: #5c554a; font-weight: 600;">Total Amount:</td>
        <td align="right" width="160" style="font-size: 22px; color: #b45309; font-weight: 800; padding-left: 10px;">
          KES ${order.totalPrice.toLocaleString()}
        </td>
      </tr>
    </table>

    ${order.notes ? `
      <h3 style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Your Note:</h3>
      <p style="margin: 0 0 35px 0; font-size: 13.5px; font-style: italic; color: #5c554a; background-color: #fafafa; border-left: 3px solid #ebdcb9; padding: 10px 14px; border-radius: 0 6px 6px 0;">
        "${order.notes}"
      </p>
    ` : ''}

    <!-- Action Link -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 10px 0 20px 0;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/track" style="display: inline-block; background-color: #b45309; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.2); text-transform: uppercase; letter-spacing: 1px;">Track Reservation Status</a>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #827765;">Use your Reservation ID <strong>${order.id}</strong> on the website to view live tracking.</p>
        </td>
      </tr>
    </table>
  `;

  let attachments;
  try {
    const pdfBuffer = await generateInvoicePdf(order);
    attachments = [
      {
        filename: `tabby_eggs_invoice_${order.id}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ];
  } catch (err) {
    console.error('Failed to attach invoice PDF to confirmation email:', err);
  }

  const html = getEmailWrapper(contentHtml);
  return sendEmail({
    to: order.customerEmail,
    subject: `🍳 Reservation Confirmed - Order #${order.id}`,
    html,
    attachments,
  });
}

/**
 * Dispatch admin alert for a new order.
 * Includes smart phone dialing and WhatsApp redirection links.
 */
export async function sendNewOrderAdminAlert(order: Order) {
  const isDelivery = order.fulfillmentType === 'delivery';
  const paymentMethodLabel = 'Paystack Online';
  
  const paymentStatusBadge = order.paymentStatus === 'paid'
    ? `<span style="background-color: #def7ec; color: #03543f; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">PAID ✓</span>`
    : `<span style="background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">UNPAID (PENDING PAYMENT)</span>`;

  const fulfillmentBadge = isDelivery
    ? `<span style="background-color: #e1effe; color: #1e429f; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">DELIVERY IN NANYUKI</span>`
    : `<span style="background-color: #edf2f7; color: #4a5568; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block;">PICKUP AT DEPOT</span>`;

  const waLink = getWhatsAppLink(order.customerPhone, order.id, order.customerName);

  const contentHtml = `
    <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #b45309; border-left: 4px solid #d97706; padding-left: 12px;">🔔 New Order Received</h2>
    <p style="margin: 0 0 25px 0; font-size: 15px; color: #5c554a;">
      A new egg reservation has been submitted. Check details below to coordinate fulfillment.
    </p>

    <!-- Customer Contacts -->
    <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Customer Information</h3>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background-color: #faf9f6; border: 1px solid #ebdcb9; border-radius: 12px; margin-bottom: 25px; font-size: 14px;">
      <tr>
        <td style="color: #827765; width: 110px; padding-bottom: 8px;"><strong>Name:</strong></td>
        <td style="padding-bottom: 8px;"><strong>${order.customerName}</strong></td>
      </tr>
      <tr>
        <td style="color: #827765; padding-bottom: 8px; vertical-align: middle;"><strong>Phone:</strong></td>
        <td style="padding-bottom: 8px; vertical-align: middle;">
          <a href="tel:${order.customerPhone}" style="color: #b45309; font-weight: 700; text-decoration: none; font-size: 15px;">${order.customerPhone}</a>
          <div style="margin-top: 6px;">
            <a href="${waLink}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">💬 Chat on WhatsApp</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Email:</strong></td>
        <td><a href="mailto:${order.customerEmail}" style="color: #b45309; text-decoration: none;">${order.customerEmail}</a></td>
      </tr>
    </table>

    <!-- Order Metadata -->
    <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Reservation Metadata</h3>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background-color: #faf9f6; border: 1px solid #ebdcb9; border-radius: 12px; margin-bottom: 25px; font-size: 14px;">
      <tr>
        <td style="color: #827765; width: 110px;"><strong>Order ID:</strong></td>
        <td style="font-family: monospace; font-weight: 700; color: #2e2b26;">${order.id}</td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Fulfill Date:</strong></td>
        <td><strong>${new Date(order.pickupDate).toLocaleDateString('en-KE')}</strong></td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Fulfillment:</strong></td>
        <td>${fulfillmentBadge}</td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Payment:</strong></td>
        <td>${paymentMethodLabel}</td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Status:</strong></td>
        <td>${paymentStatusBadge}</td>
      </tr>
      ${isDelivery ? `
      <tr>
        <td style="color: #827765; vertical-align: top;"><strong>Address:</strong></td>
        <td>📍 ${order.deliveryAddress}</td>
      </tr>
      ` : ''}
    </table>

    <!-- Order Items -->
    <h3 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Requested Trays</h3>
    ${getOrderItemsTable(order.items)}

    <!-- Grand Total -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-top: 2px solid #ebdcb9; padding-top: 15px; margin-bottom: 30px;">
      <tr>
        <td align="right" style="font-size: 15px; color: #5c554a; font-weight: 600;">Total Revenue:</td>
        <td align="right" width="160" style="font-size: 21px; color: #b45309; font-weight: 800; padding-left: 10px;">
          KES ${order.totalPrice.toLocaleString()}
        </td>
      </tr>
    </table>

    ${order.notes ? `
      <h3 style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #827765; letter-spacing: 1px;">Customer Notes:</h3>
      <p style="margin: 0 0 30px 0; font-size: 13.5px; font-style: italic; color: #5c554a; background-color: #fafafa; border-left: 3px solid #ebdcb9; padding: 10px 14px; border-radius: 0 6px 6px 0;">
        "${order.notes}"
      </p>
    ` : ''}

    <!-- Action Link -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 15px 0;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/admin/orders" style="display: inline-block; background-color: #2e2b26; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Open Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `;

  const html = getEmailWrapper(contentHtml);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🔔 New Order Received - Order #${order.id} (KES ${order.totalPrice})`,
    html,
  });
}

/**
 * Dispatch status update (fulfilled or canceled) notification to the customer.
 */
export async function sendOrderStatusUpdateEmail(order: Order) {
  const isFulfilled = order.status === 'fulfilled';
  const isCanceled = order.status === 'canceled';

  if (!isFulfilled && !isCanceled) return { success: false, error: 'Status is not fulfilled or canceled.' };

  const subject = isFulfilled 
    ? `🚚 Your Order #${order.id} is Ready / Fulfilled!` 
    : `❌ Update: Order #${order.id} Canceled`;

  const formattedPickupDate = new Date(order.pickupDate).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isDelivery = order.fulfillmentType === 'delivery';

  let statusHtml = '';
  if (isFulfilled) {
    statusHtml = `
      <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #166534;">Your Order is Ready / Fulfilled!</h2>
      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2e2b26;">
        Hi <strong>${order.customerName}</strong>, great news! Your egg reservation <strong>#${order.id}</strong> has been prepared at the farm.
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 14.5px; line-height: 1.6; color: #5c554a; background-color: #f0fdf4; border-left: 4px solid #166534; padding: 14px; border-radius: 0 8px 8px 0;">
        ${isDelivery 
          ? `🚚 <strong>Delivery Address:</strong> Our delivery rider is preparing or has dispatched your Grade AA trays to your location:<br><span style="display:block; margin-top: 6px; font-weight: bold; color: #2e2b26;">${order.deliveryAddress}</span>`
          : `🏢 <strong>Farm Collection:</strong> Your trays are packed and ready for pickup at our Nanyuki depot on <strong>${formattedPickupDate}</strong>.<br><em style="font-size: 13px; color: #666; display:block; margin-top: 4px;">Please present your Reservation ID #${order.id} to the storekeeper.</em>`
        }
      </p>

      <p style="margin: 0 0 25px 0; font-size: 14px; color: #5c554a;">
        Thank you for choosing Tabby Premium Eggs! We appreciate your business and hope to see you again.
      </p>
    `;
  } else {
    statusHtml = `
      <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #991b1b;">Order Canceled</h2>
      <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2e2b26;">
        Hi <strong>${order.customerName}</strong>, we wish to inform you that your reservation <strong>#${order.id}</strong> has been canceled.
      </p>
      <p style="margin: 0 0 25px 0; font-size: 14.5px; line-height: 1.6; color: #5c554a; background-color: #fef2f2; border-left: 4px solid #991b1b; padding: 14px; border-radius: 0 8px 8px 0;">
        If you did not request this cancellation or require assistance regarding a refund or adjustment, please reach out directly to our customer helpline at <strong>+254 722 237 593</strong>.
      </p>
    `;
  }

  const contentHtml = `
    ${statusHtml}

    <!-- Info Summary -->
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background-color: #faf9f6; border: 1px solid #ebdcb9; border-radius: 12px; margin-bottom: 25px; font-size: 13.5px;">
      <tr>
        <td style="color: #827765; width: 120px; padding-bottom: 6px;"><strong>Order ID:</strong></td>
        <td style="font-family: monospace; font-weight: 700; color: #2e2b26; padding-bottom: 6px;">${order.id}</td>
      </tr>
      <tr>
        <td style="color: #827765; padding-bottom: 6px;"><strong>Fulfillment Date:</strong></td>
        <td style="color: #2e2b26; padding-bottom: 6px;">${formattedPickupDate}</td>
      </tr>
      <tr>
        <td style="color: #827765; padding-bottom: 6px;"><strong>Fulfillment Type:</strong></td>
        <td style="color: #2e2b26; padding-bottom: 6px;">${isDelivery ? 'Delivery in Nanyuki' : 'Pickup at Depot'}</td>
      </tr>
      <tr>
        <td style="color: #827765; padding-bottom: 6px;"><strong>Amount:</strong></td>
        <td style="color: #b45309; font-weight: bold; padding-bottom: 6px;">KES ${order.totalPrice.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color: #827765;"><strong>Fulfillment Status:</strong></td>
        <td style="font-weight: 800; color: ${isFulfilled ? '#166534' : '#991b1b'}; text-transform: uppercase;">${order.status}</td>
      </tr>
    </table>
  `;

  let attachments;
  if (isFulfilled) {
    try {
      const pdfBuffer = await generateInvoicePdf(order);
      attachments = [
        {
          filename: `tabby_eggs_invoice_${order.id}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ];
    } catch (err) {
      console.error('Failed to attach invoice PDF to status update email:', err);
    }
  }

  const html = getEmailWrapper(contentHtml);
  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
    attachments,
  });
}
