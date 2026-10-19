import nodemailer from 'nodemailer';
import { Order, OrderStatus } from './types';
import { db } from './db';

const DEFAULT_GMAIL_USER = '63waziri@gmail.com';
const DEFAULT_GMAIL_APP_PASS = 'pycckvmbweavbbkh'; // pycc kvmb weav bbkh (spaces removed for SMTP)

export async function getEmailTransporter() {
  const settings = await db.getSettings();
  const user = settings.gmailUser || process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  const rawPass = settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || DEFAULT_GMAIL_APP_PASS;
  const pass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

function formatNaira(amount: number): string {
  return `₦${(amount || 0).toLocaleString('en-NG')}`;
}

export async function sendOrderReceiptEmail(order: Order, appUrl?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getEmailTransporter();
    const settings = await db.getSettings();
    const senderEmail = settings.gmailUser || DEFAULT_GMAIL_USER;
    const baseUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/order/${order.id}`;

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #f4f4f5; font-size: 14px;">
            <strong>${item.name}</strong> x ${item.quantity}
            ${item.specialInstructions ? `<br><span style="color: #a1a1aa; font-size: 12px; font-style: italic;">Note: ${item.specialInstructions}</span>` : ''}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; text-align: right; color: #ffffff; font-weight: bold; font-size: 14px;">
            ${formatNaira(item.totalPrice)}
          </td>
        </tr>`
      )
      .join('');

    const locationHtml = order.location
      ? `
      <div style="margin-top: 16px; padding: 12px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
        <p style="margin: 0; color: #d4d4d8; font-size: 13px; font-weight: bold;">Live GPS Delivery Location Attached:</p>
        <p style="margin: 4px 0 8px 0; color: #a1a1aa; font-size: 12px;">Coordinates: ${order.location.latitude.toFixed(5)}, ${order.location.longitude.toFixed(5)}</p>
        <a href="${order.location.mapUrl}" target="_blank" style="display: inline-block; padding: 6px 12px; background-color: #27272a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">
          Open Live GPS Pin in Google Maps &rarr;
        </a>
      </div>`
      : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your NaijaGrill Order Receipt - ${order.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #121214; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #27272a;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #ffffff;">NAIJAGRILL & KITCHEN</h1>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #f59e0b; text-transform: uppercase; font-weight: 600; letter-spacing: 2px;">Smoky Firewood Jollof & Grill</p>
          </td>
        </tr>

        <!-- Order Summary -->
        <tr>
          <td style="padding: 24px 0;">
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 8px 0;">Hello <strong>${order.customer.name}</strong>,</p>
            <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 20px 0; line-height: 1.5;">
              Thank you for ordering with NaijaGrill! We have received your order <strong>${order.orderNumber}</strong>.
              ${order.paymentStatus === 'success' ? 'Your payment has been successfully confirmed via Paystack.' : 'Status: ' + order.paymentStatus}
            </p>

            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table width="100%" style="font-size: 13px;">
                <tr>
                  <td style="color: #71717a;">Order Number:</td>
                  <td style="text-align: right; color: #ffffff; font-weight: bold;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="color: #71717a;">Fulfillment:</td>
                  <td style="text-align: right; color: #ffffff; font-weight: bold; text-transform: capitalize;">${order.fulfillmentType}</td>
                </tr>
                ${order.customer.address ? `
                <tr>
                  <td style="color: #71717a;">Address:</td>
                  <td style="text-align: right; color: #ffffff;">${order.customer.address}</td>
                </tr>` : ''}
                ${order.paymentReference ? `
                <tr>
                  <td style="color: #71717a;">Paystack Ref:</td>
                  <td style="text-align: right; color: #a1a1aa; font-family: monospace;">${order.paymentReference}</td>
                </tr>` : ''}
              </table>
              ${locationHtml}
            </div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr>
                  <th align="left" style="padding-bottom: 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Dish</th>
                  <th align="right" style="padding-bottom: 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <table width="100%" style="margin-top: 16px; font-size: 14px;">
              <tr>
                <td style="color: #a1a1aa; padding: 4px 0;">Subtotal</td>
                <td style="text-align: right; color: #ffffff;">${formatNaira(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="color: #a1a1aa; padding: 4px 0;">Delivery Fee</td>
                <td style="text-align: right; color: #ffffff;">${order.deliveryFee === 0 ? 'FREE' : formatNaira(order.deliveryFee)}</td>
              </tr>
              <tr>
                <td style="color: #ffffff; font-weight: bold; font-size: 18px; padding-top: 12px; border-top: 1px solid #27272a;">Total Paid</td>
                <td style="text-align: right; color: #ffffff; font-weight: 900; font-size: 20px; padding-top: 12px; border-top: 1px solid #27272a;">${formatNaira(order.total)}</td>
              </tr>
            </table>

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="${trackingUrl}" target="_blank" style="background: linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 100%); color: #09090b; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 10px; display: inline-block;">
                Track Live Order & View QR Receipt &rarr;
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top: 24px; border-top: 1px solid #27272a; color: #71717a; font-size: 12px; line-height: 1.5;">
            NaijaGrill & Kitchen &bull; 14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria<br>
            Hotline: +234 803 555 0192 &bull; Email: ${senderEmail}
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    await transporter.sendMail({
      from: `"NaijaGrill & Kitchen" <${senderEmail}>`,
      to: order.customer.email,
      subject: `Order Receipt: ${order.orderNumber} - NaijaGrill (${formatNaira(order.total)})`,
      html,
    });

    console.log(`[Gmail Notification]: Sent order receipt email for ${order.orderNumber} to ${order.customer.email}`);
    return { success: true };
  } catch (error) {
    console.error('[Gmail Notification Error]:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendOrderStatusUpdateEmail(
  order: Order,
  newStatus: OrderStatus,
  note?: string,
  appUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getEmailTransporter();
    const settings = await db.getSettings();
    const senderEmail = settings.gmailUser || DEFAULT_GMAIL_USER;
    const baseUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/order/${order.id}`;

    const statusDescriptions: Record<OrderStatus, { title: string; desc: string }> = {
      pending: { title: 'Order Received', desc: 'We have received your order details and are awaiting confirmation.' },
      confirmed: { title: 'Order Confirmed & Payment Verified', desc: 'Your payment was verified. The kitchen team has accepted your ticket.' },
      preparing: { title: 'Chef is Preparing Your Food', desc: 'Your order is currently cooking on the firewood grill and stoves!' },
      ready_for_pickup: { title: 'Ready for Pickup', desc: 'Your package is packed hot and waiting at our Lekki kitchen pickup counter.' },
      out_for_delivery: { title: 'Rider Out for Delivery', desc: 'Our dispatch rider has picked up your food and is on the way to your address!' },
      delivered: { title: 'Order Delivered / Completed', desc: 'Your meal has been delivered. Enjoy your delicious Nigerian feast!' },
      cancelled: { title: 'Order Cancelled', desc: 'This order was marked as cancelled. If this is an error, please call our kitchen.' },
    };

    const info = statusDescriptions[newStatus] || {
      title: `Status: ${newStatus.replace(/_/g, ' ')}`,
      desc: 'Your order status has been updated.',
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update: ${order.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #121214; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px;">
        <tr>
          <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #27272a;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">NAIJAGRILL & KITCHEN</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #f59e0b; text-transform: uppercase; font-weight: bold;">Live Kitchen Update</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 24px 0;">
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hi <strong>${order.customer.name}</strong>,</p>
            
            <div style="background-color: #18181b; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #ffffff;">${info.title}</h2>
              <p style="margin: 0; font-size: 14px; color: #d4d4d8; line-height: 1.5;">${info.desc}</p>
              ${note ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #a1a1aa; font-style: italic;">Kitchen note: &ldquo;${note}&rdquo;</p>` : ''}
            </div>

            <p style="font-size: 13px; color: #a1a1aa; margin: 16px 0;">
              Order Number: <strong>${order.orderNumber}</strong> &bull; Total: <strong>${formatNaira(order.total)}</strong>
            </p>

            <div style="text-align: center; margin-top: 28px;">
              <a href="${trackingUrl}" target="_blank" style="background-color: #ffffff; color: #09090b; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 8px; display: inline-block;">
                Track Live Order Progress &rarr;
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top: 20px; border-top: 1px solid #27272a; color: #71717a; font-size: 11px;">
            Need help? Call dispatch on +234 803 555 0192 &bull; NaijaGrill Lekki
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    await transporter.sendMail({
      from: `"NaijaGrill & Kitchen" <${senderEmail}>`,
      to: order.customer.email,
      subject: `Kitchen Update: ${order.orderNumber} is ${info.title} - NaijaGrill`,
      html,
    });

    console.log(`[Gmail Notification]: Sent status update (${newStatus}) for ${order.orderNumber} to ${order.customer.email}`);
    return { success: true };
  } catch (error) {
    console.error('[Gmail Status Update Notification Error]:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
