// webhookRoutes.js
import express from 'express';
import crypto from 'crypto';
import sql from '../db/index.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import axios from 'axios';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Handle Paystack webhook
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('❌ Invalid Paystack webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log(`📥 Webhook received: event=${event}, reference=${data.reference}`);

    if (event === 'charge.success') {
      const { reference, status } = data;

      if (status !== 'success') {
        console.log(`ℹ️ Payment not successful for reference=${reference}`);
        return res.status(200).json({ message: 'Webhook received, payment not successful' });
      }

      // Wrap all DB operations in a transaction
      await sql.begin(async (sql) => {
        // Check if order exists and is not already completed
        const [order] = await sql`
          SELECT id, payment_status, user_id, total, currency 
          FROM orders 
          WHERE reference = ${reference} AND deleted_at IS NULL
        `;

        if (!order) {
          console.error(`❌ Order not found for reference=${reference}`);
          return res.status(404).json({ error: 'Order not found' });
        }

        if (order.payment_status === 'completed') {
          console.log(`ℹ️ Payment already verified for reference=${reference}`);
          return res.status(200).json({ message: 'Payment already verified' });
        }

        // Update order status
        await sql`
          UPDATE orders 
          SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
          WHERE reference = ${reference}
        `;

        // Get user details for email
        const [user] = await sql`
          SELECT email, first_name, last_name FROM users WHERE id = ${order.user_id}
        `;

        console.log(`✅ Payment verified via webhook for order ${order.id}, reference=${reference}`);

        // Send confirmation email after successful commit
        if (user) {
          const formattedName = `${user.first_name} ${user.last_name}`;
          try {
            await sendOrderConfirmationEmail(
              user.email,
              formattedName,
              order.id,
              order.total,
              order.currency
            );
            console.log(`✅ Order confirmation email sent to ${user.email}`);
          } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError.message);
            // Continue even if email fails
          }
        }

        res.status(200).json({ message: 'Webhook processed' });
      });
    } 
    else if (event === 'charge.failed') {
      console.log(`⚠️ Payment failed for reference=${data.reference}`);

      try {
        await sql`
          UPDATE orders
          SET payment_status = 'failed', status = 'cancelled', updated_at = NOW()
          WHERE reference = ${data.reference}
        `;
        console.log(`✅ Updated order status to failed for reference=${data.reference}`);
      } catch (err) {
        console.error('❌ Error updating failed order:', err.message);
      }

      res.status(200).json({ message: 'Webhook processed' });
    } 
    else {
      console.log(`ℹ️ Unhandled webhook event: ${event}`);
      res.status(200).json({ message: 'Webhook received' });
    }
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Manual verification endpoint (for admin use)
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    await sql.begin(async (sql) => {
      // First verify with Paystack API
      const paystackResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const { status, data } = paystackResponse.data;

      if (!status || data.status !== 'success') {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

      // Get order details
      const [order] = await sql`
        SELECT * FROM orders WHERE reference = ${reference} AND deleted_at IS NULL
      `;

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.payment_status !== 'completed') {
        await sql`
          UPDATE orders
          SET payment_status = 'completed', status = 'processing', updated_at = NOW()
          WHERE id = ${order.id}
        `;
      }

      // Get updated order with user and address details
      const [orderDetails] = await sql`
        SELECT 
          o.*, u.email, u.first_name, u.last_name,
          a.address_line_1, a.city, a.state, a.country AS shipping_country,
          ba.full_name AS billing_full_name, ba.email AS billing_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN addresses a ON o.address_id = a.id
        JOIN billing_addresses ba ON o.billing_address_id = ba.id
        WHERE o.id = ${order.id}
      `;

      // Send confirmation email
      if (orderDetails) {
        const formattedName = `${orderDetails.first_name} ${orderDetails.last_name}`;
        try {
          await sendOrderConfirmationEmail(
            orderDetails.email,
            formattedName,
            orderDetails.id,
            orderDetails.total,
            orderDetails.currency
          );
          console.log(`✅ Order confirmation email sent to ${orderDetails.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send confirmation email:', emailError.message);
        }
      }

      res.status(200).json({ order: orderDetails });
    });
  } catch (err) {
    console.error('❌ Error verifying payment:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
