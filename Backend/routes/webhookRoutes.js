import express from 'express';
import sql from '../db/index.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

dotenv.config();

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

router.post('/webhook', async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    const reference = data.reference;

    if (event === 'charge.success') {
      const [order] = await sql`
        SELECT id, payment_status, user_id, total, currency, email_sent, cart_id 
        FROM orders 
        WHERE reference = ${reference} AND deleted_at IS NULL
      `;
      if (!order) {
        console.error(`Order not found for reference: ${reference}`);
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.payment_status === 'completed') {
        console.warn(`Payment already verified for reference=${reference}`);
        return res.status(200).json({ message: 'Payment already verified' });
      }

      const [user] = await sql`SELECT email, first_name FROM users WHERE id = ${order.user_id}`;
      await sql.begin(async sql => {
        await sql`
          UPDATE orders 
          SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
          WHERE reference = ${reference}
        `;
        if (order.cart_id) {
          await sql`DELETE FROM cart_items WHERE cart_id = ${order.cart_id}`;
          console.log(`✅ Cleared cart items for cart_id=${order.cart_id}, reference=${reference}`);
        }
      });

      if (!order.email_sent) {
        await sendOrderConfirmationEmail(user.email, { orderId: order.id, userName: user.first_name });
        await sql`UPDATE orders SET email_sent = true WHERE id = ${order.id}`;
      }
      console.log(`✅ Processed charge.success for reference=${reference}`);
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } else if (event === 'charge.failed') {
      const [order] = await sql`
        SELECT id, payment_status, cart_id 
        FROM orders 
        WHERE reference = ${reference} AND deleted_at IS NULL
      `;
      if (!order) {
        console.error(`Order not found for reference: ${reference}`);
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.payment_status !== 'pending') {
        console.warn(`Order not in pending state for reference=${reference}`);
        return res.status(200).json({ message: 'Order already processed' });
      }

      const orderItems = await sql`
        SELECT variant_id, size_id, quantity 
        FROM order_items 
        WHERE order_id = ${order.id}
      `;
      await sql.begin(async sql => {
        for (const item of orderItems) {
          if (item.variant_id && item.size_id) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = stock_quantity + ${item.quantity}
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
          }
        }
        await sql`
          UPDATE orders 
          SET payment_status = 'failed', updated_at = NOW()
          WHERE reference = ${reference}
        `;
      });
      console.log(`✅ Processed charge.failed for reference=${reference}`);
      return res.status(200).json({ message: 'Webhook processed successfully' });
    }

    console.warn(`Unhandled webhook event: ${event}`);
    return res.status(200).json({ message: 'Event not handled' });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    const [order] = await sql`
      SELECT id, payment_status, user_id, total, currency, cart_id, email_sent 
      FROM orders 
      WHERE reference = ${reference} AND deleted_at IS NULL
    `;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.payment_status === 'completed') {
      return res.status(200).json({ message: 'Payment already verified', order });
    }

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const { status, data } = response.data;

    if (!status || data.status !== 'success') {
      const orderItems = await sql`
        SELECT variant_id, size_id, quantity 
        FROM order_items 
        WHERE order_id = ${order.id}
      `;
      await sql.begin(async sql => {
        for (const item of orderItems) {
          if (item.variant_id && item.size_id) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = stock_quantity + ${item.quantity}
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
          }
        }
        await sql`
          UPDATE orders 
          SET payment_status = 'failed', updated_at = NOW()
          WHERE reference = ${reference}
        `;
      });
      return res.status(400).json({ error: 'Payment not successful', order });
    }

    const [user] = await sql`SELECT email, first_name FROM users WHERE id = ${order.user_id}`;
    await sql.begin(async sql => {
      await sql`
        UPDATE orders 
        SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
        WHERE reference = ${reference}
      `;
      if (order.cart_id) {
        await sql`DELETE FROM cart_items WHERE cart_id = ${order.cart_id}`;
        console.log(`✅ Cleared cart items for cart_id=${order.cart_id}`);
      }
    });

    if (!order.email_sent) {
      await sendOrderConfirmationEmail(user.email, { orderId: order.id, userName: user.first_name });
      await sql`UPDATE orders SET email_sent = true WHERE id = ${order.id}`;
    }

    return res.status(200).json({ message: 'Payment verified successfully', order });
  } catch (err) {
    console.error('Error verifying payment:', err.message);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;