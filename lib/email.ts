import { Order } from './db';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tabbypremiumeggs@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tabbypremiumeggs.online';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Generic helper to send emails via Resend's REST API using native fetch.
 * This keeps the application dependencies clean and avoids version conflicts.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
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
      <body style="margin: 0; padding: 0; background-color: #f7f6f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d2d2d; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f6f0; padding: 20px 0;">
          <tr>
            <td align="center">
              <!-- Card Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #ebdcb9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <!-- Header -->
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #fbfaf5 0%, #f5eecd 100%); padding: 30px 20px; border-bottom: 2px solid #ebdcb9;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #b45309; letter-spacing: -0.5px;">Tabby Premium Eggs</h1>
                          <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 500; color: #78350f; text-transform: uppercase; letter-spacing: 1.5px;">Grade AA Farm-Fresh • Nanyuki, Kenya</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Body -->
                <tr>
                  <td style="padding: 35px 30px; background-color: #ffffff;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 25px 30px; background-color: #faf9f5; border-top: 1px solid #f0ead8; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #5c4d37;">Tabby Premium Eggs</p>
                    <p style="margin: 0 0 15px 0; font-size: 12px; line-height: 1.6; color: #7c6e59;">
                      Freshly collected Grade AA farm eggs delivered straight to your home or kitchen in Nanyuki, Kenya.<br>
                      <strong>Phone:</strong> +254 722 237 593 | <strong>Email:</strong> orders@tabbypremiumeggs.online
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding-top: 5px;">
                          <a href="${APP_URL}" style="font-size: 12px; font-weight: 700; color: #d97706; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Visit Online Shop</a>
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
      <td style="padding: 12px 0; border-bottom: 1px solid #f2edd8; font-size: 14px; color: #2d2d2d; font-weight: 600;">
        ${item.name}
      </td>
      <td align="center" style="padding: 12px 0; border-bottom: 1px solid #f2edd8; font-size: 14px; color: #4d4d4d;">
        ${item.quantity}
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f2edd8; font-size: 14px; color: #4d4d4d;">
        KES ${item.price.toLocaleString()}
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f2edd8; font-size: 14px; color: #2d2d2d; font-weight: 700;">
        KES ${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #ebdcb9; font-size: 12px; font-weight: 700; color: #7c6e59; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
          <th align="center" style="padding-bottom: 8px; border-bottom: 2px solid #ebdcb9; font-size: 12px; font-weight: 700; color: #7c6e59; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #ebdcb9; font-size: 12px; font-weight: 700; color: #7c6e59; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #ebdcb9; font-size: 12px; font-weight: 700; color: #7c6e59; text-transform: uppercase; letter-spacing: 0.5px;">Subtotal</th>
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
  const paymentMethodLabel = order.paymentMethod === 'paystack' ? 'Paid Online (Paystack)' : 'Pay on Pickup/Delivery';
  const paymentStatusLabel = order.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending Payment';

  const contentHtml = `
    <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #b45309;">Order Reservation Confirmed!</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #4d4d4d;">
      Hi <strong>${order.customerName}</strong>, thank you for reserving eggs with us. Your reservation is registered, and we are preparing your tray(s) for collection.
    </p>

    <!-- Info Block -->
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background-color: #faf9f5; border-radius: 8px; border: 1px solid #ebdcb9; margin-bottom: 25px;">
      <tr>
        <td>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #7c6e59;"><strong>Reservation ID:</strong></td>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #2d2d2d; font-family: monospace; font-weight: bold;">${order.id}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #7c6e59;"><strong>Order Date:</strong></td>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #2d2d2d;">${formattedDate}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #7c6e59;"><strong>Fulfillment Date:</strong></td>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #2d2d2d; font-weight: bold;">${formattedPickupDate}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #7c6e59;"><strong>Fulfillment Option:</strong></td>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #2d2d2d;">${isDelivery ? 'Delivery in Nanyuki' : 'Pickup at Farm'}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #7c6e59;"><strong>Payment Method:</strong></td>
              <td width="50%" style="padding-bottom: 10px; font-size: 13px; color: #2d2d2d;">${paymentMethodLabel}</td>
            </tr>
            <tr>
              <td width="50%" style="font-size: 13px; color: #7c6e59;"><strong>Payment Status:</strong></td>
              <td width="50%" style="font-size: 13px; color: #b45309; font-weight: bold;">${paymentStatusLabel}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${isDelivery ? `
      <!-- Delivery Address -->
      <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Delivery Address</h3>
      <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.5; color: #2d2d2d; background-color: #faf9f5; border: 1px solid #ebdcb9; border-radius: 8px; padding: 12px;">
        ${order.deliveryAddress}
      </p>
    ` : ''}

    <!-- Order Items -->
    <h3 style="margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Items Summary</h3>
    ${getOrderItemsTable(order.items)}

    <!-- Grand Total -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-top: 2px solid #ebdcb9; padding-top: 15px; margin-bottom: 30px;">
      <tr>
        <td align="right" style="font-size: 16px; color: #4d4d4d; font-weight: 600;">Total Amount:</td>
        <td align="right" width="150" style="font-size: 20px; color: #b45309; font-weight: 800; padding-left: 10px;">
          KES ${order.totalPrice.toLocaleString()}
        </td>
      </tr>
    </table>

    ${order.notes ? `
      <h3 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Customer Note:</h3>
      <p style="margin: 0 0 30px 0; font-size: 13px; font-style: italic; color: #555; background-color: #fcfcfc; border-left: 3px solid #ebdcb9; padding: 8px 12px;">
        "${order.notes}"
      </p>
    ` : ''}

    <!-- Action Link -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/track" style="display: inline-block; background-color: #b45309; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 6px; box-shadow: 0 4px 6px rgba(180, 83, 9, 0.15); text-transform: uppercase; letter-spacing: 0.5px;">Track Order Status</a>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #7c6e59;">Click above to track fulfillment status. Reservation ID: <strong>${order.id}</strong></p>
        </td>
      </tr>
    </table>
  `;

  const html = getEmailWrapper(contentHtml);
  return sendEmail({
    to: order.customerEmail,
    subject: `🍳 Reservation Confirmed - Order #${order.id}`,
    html,
  });
}

/**
 * Dispatch admin alert for a new order.
 */
export async function sendNewOrderAdminAlert(order: Order) {
  const isDelivery = order.fulfillmentType === 'delivery';
  const paymentMethodLabel = order.paymentMethod === 'paystack' ? 'Paid Online (Paystack)' : 'Pay on Pickup/Delivery';
  const paymentStatusLabel = order.paymentStatus === 'paid' ? 'Paid ✓' : 'Unpaid (Collect Cash)';

  const contentHtml = `
    <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #b45309; border-left: 4px solid #d97706; padding-left: 10px;">🔔 New Order Received</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #4d4d4d;">
      An order has been submitted. Prepare the inventory stock accordingly.
    </p>

    <!-- Customer Details -->
    <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Customer Contact</h3>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #faf9f5; border: 1px solid #ebdcb9; border-radius: 8px; margin-bottom: 20px; font-size: 13.5px;">
      <tr>
        <td style="color: #7c6e59; width: 120px;"><strong>Name:</strong></td>
        <td><strong>${order.customerName}</strong></td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Phone:</strong></td>
        <td><a href="tel:${order.customerPhone}" style="color: #b45309; text-decoration: none;">${order.customerPhone}</a></td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Email:</strong></td>
        <td><a href="mailto:${order.customerEmail}" style="color: #b45309; text-decoration: none;">${order.customerEmail}</a></td>
      </tr>
    </table>

    <!-- Order Metadata -->
    <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Order Details</h3>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #faf9f5; border: 1px solid #ebdcb9; border-radius: 8px; margin-bottom: 20px; font-size: 13.5px;">
      <tr>
        <td style="color: #7c6e59; width: 120px;"><strong>Order ID:</strong></td>
        <td style="font-family: monospace; font-weight: bold;">${order.id}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Pickup/Delivery:</strong></td>
        <td><strong>${new Date(order.pickupDate).toLocaleDateString('en-KE')}</strong></td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Type:</strong></td>
        <td>${isDelivery ? 'Delivery in Nanyuki' : 'Pickup at Farm'}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Payment Flow:</strong></td>
        <td>${paymentMethodLabel}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Payment Status:</strong></td>
        <td style="color: #b45309; font-weight: bold;">${paymentStatusLabel}</td>
      </tr>
      ${isDelivery ? `
      <tr>
        <td style="color: #7c6e59; vertical-align: top;"><strong>Address:</strong></td>
        <td>${order.deliveryAddress}</td>
      </tr>
      ` : ''}
    </table>

    <!-- Order Items -->
    <h3 style="margin: 0 0 5px 0; font-size: 13px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Products Requested</h3>
    ${getOrderItemsTable(order.items)}

    <!-- Grand Total -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-top: 2px solid #ebdcb9; padding-top: 15px; margin-bottom: 25px;">
      <tr>
        <td align="right" style="font-size: 15px; color: #4d4d4d; font-weight: 600;">Total Revenue:</td>
        <td align="right" width="150" style="font-size: 19px; color: #b45309; font-weight: 800; padding-left: 10px;">
          KES ${order.totalPrice.toLocaleString()}
        </td>
      </tr>
    </table>

    ${order.notes ? `
      <h3 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #7c6e59; letter-spacing: 0.5px;">Notes from Customer:</h3>
      <p style="margin: 0 0 25px 0; font-size: 13px; font-style: italic; color: #555; background-color: #fbfbfb; border-left: 3px solid #ebdcb9; padding: 8px 12px;">
        "${order.notes}"
      </p>
    ` : ''}

    <!-- Action Link -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/admin/orders" style="display: inline-block; background-color: #2b2b2b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 24px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Open Admin Dashboard</a>
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

  // Do not send emails if status is pending (which is default state)
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
      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #15803d;">Your Order is Ready / Fulfilled!</h2>
      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #2d2d2d;">
        Hi <strong>${order.customerName}</strong>, your reservation <strong>#${order.id}</strong> has been processed on our farm.
      </p>
      
      <p style="margin: 0 0 15px 0; font-size: 14.5px; line-height: 1.5; color: #4d4d4d;">
        ${isDelivery 
          ? `Our delivery services are preparing or have dispatched your Grade AA eggs to your address: <strong>${order.deliveryAddress}</strong>.`
          : `Your farm-fresh eggs are packaged and ready for collection at our farm in Nanyuki. Please present your Order ID (<strong>#${order.id}</strong>) during pickup on <strong>${formattedPickupDate}</strong>.`
        }
      </p>

      <p style="margin: 0 0 25px 0; font-size: 14.5px; line-height: 1.5; color: #4d4d4d;">
        Thank you for choosing Tabby Premium Eggs! We hope to serve you again soon.
      </p>
    `;
  } else {
    statusHtml = `
      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #b91c1c;">Order Canceled</h2>
      <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.5; color: #2d2d2d;">
        Hi <strong>${order.customerName}</strong>, we wish to inform you that your reservation <strong>#${order.id}</strong> has been canceled.
      </p>
      <p style="margin: 0 0 25px 0; font-size: 14.5px; line-height: 1.5; color: #4d4d4d;">
        If you did not request this cancellation or require assistance, please contact our support team immediately at <strong>+254 722 237 593</strong>.
      </p>
    `;
  }

  const contentHtml = `
    ${statusHtml}

    <!-- Info Summary -->
    <table border="0" cellpadding="10" cellspacing="0" width="100%" style="background-color: #faf9f5; border: 1px solid #ebdcb9; border-radius: 8px; margin-bottom: 25px; font-size: 13px;">
      <tr>
        <td style="color: #7c6e59; width: 120px;"><strong>Order ID:</strong></td>
        <td style="font-family: monospace; font-weight: bold; color: #2d2d2d;">${order.id}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Fulfillment Date:</strong></td>
        <td style="color: #2d2d2d;">${formattedPickupDate}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Fulfillment Type:</strong></td>
        <td style="color: #2d2d2d;">${isDelivery ? 'Delivery in Nanyuki' : 'Pickup at Farm'}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Amount:</strong></td>
        <td style="color: #b45309; font-weight: bold;">KES ${order.totalPrice.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color: #7c6e59;"><strong>Fulfillment Status:</strong></td>
        <td style="font-weight: bold; color: ${isFulfilled ? '#15803d' : '#b91c1c'}; text-transform: uppercase;">${order.status}</td>
      </tr>
    </table>
  `;

  const html = getEmailWrapper(contentHtml);
  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
  });
}
