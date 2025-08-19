import axios from 'axios';
import dotenv from 'dotenv';
import sql from '../db/index.js';

dotenv.config();

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (req, res) => {
  try {
    const { order_id, reference, email, amount, currency, callback_url } = req.body;

    console.log(`💳 Initializing Paystack payment: order_id=${order_id}, reference=${reference}, email=${email}, amount=${amount}, currency=${currency}`);

    if (!order_id || !reference || !email || !amount || !currency) {
      console.error('Missing required fields for payment initialization');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check order exists
    const orderCheck = await sql`
      SELECT id, total, currency, payment_status
      FROM orders
      WHERE id = ${order_id} AND reference = ${reference}
    `;

    if (orderCheck.length === 0) {
      console.error(`Order not found or invalid reference: ${reference}`);
      return res.status(404).json({ error: 'Order not found or invalid reference' });
    }

    const order = orderCheck[0];
    if (order.payment_status !== 'pending') {
      console.error(`Payment already processed for order: ${reference}`);
      return res.status(400).json({ error: 'Payment already processed or cancelled' });
    }

    if (order.currency !== currency || Math.abs(order.total * 100 - amount) > 1) {
      console.error(`Invalid amount or currency. Expected: ${order.total * 100} ${order.currency}, got: ${amount} ${currency}`);
      return res.status(400).json({ error: 'Invalid amount or currency' });
    }

    const defaultCallbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL}/thank-you`;
    const finalCallbackUrl = callback_url || defaultCallbackUrl;

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount),
        currency,
        reference,
        callback_url: finalCallbackUrl,
        metadata: {
          order_id,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: order_id
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference: paystackReference } = response.data.data;

    if (!authorization_url) {
      console.error('Paystack did not return authorization_url:', response.data);
      return res.status(500).json({ error: 'Failed to get payment authorization URL from Paystack' });
    }

    console.log(`✅ Paystack transaction initialized: reference=${paystackReference}`);
    res.status(200).json({ authorization_url, access_code, reference: paystackReference });

  } catch (err) {
    console.error('❌ Error initializing Paystack payment:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};



export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query || req.body;
    if (!reference) {
      console.error('Missing reference for payment verification');
      return res.status(400).json({ error: 'Reference is required' });
    }
    console.log(`🔎 Verifying Paystack payment: reference=${reference}`);

    const orderCheck = await sql`
      SELECT id, user_id, payment_status, total, currency, cart_id
      FROM orders
      WHERE reference = ${reference} AND deleted_at IS NULL
    `;
    if (orderCheck.length === 0) {
      console.error(`Order not found for reference: ${reference}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderCheck[0];
    if (order.payment_status === 'completed') {
      console.warn(`Payment already verified for reference=${reference}`);
      return req.method === 'GET'
        ? res.redirect(`/thank-you?reference=${reference}&status=already_verified`)
        : res.status(200).json({ message: 'Payment already verified', order });
    }

    const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const { status, data } = response.data;
    if (!status || data.status !== 'success') {
      console.error(`Payment not successful for reference=${reference}`);
      // Restock inventory
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
              SET stock = stock + ${item.quantity}
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
      return req.method === 'GET'
        ? res.redirect(`/thank-you?reference=${reference}&status=failed`)
        : res.status(400).json({ error: 'Payment not successful', order });
    }

    await sql.begin(async sql => {
      const updatedOrders = await sql`
        UPDATE orders
        SET payment_status = 'completed',
            status = 'processing',
            updated_at = NOW()
        WHERE reference = ${reference} AND deleted_at IS NULL
        RETURNING id, user_id, total, currency, cart_id
      `;
      const updatedOrder = updatedOrders[0];
      if (updatedOrder.cart_id) {
        await sql`DELETE FROM cart_items WHERE cart_id = ${updatedOrder.cart_id}`;
        console.log(`✅ Cleared cart items for cart_id=${updatedOrder.cart_id}, order_id=${updatedOrder.id}, reference=${reference}`);
      }
    });

    console.log(`✅ Payment verified for reference=${reference}, order_id=${order.id}`);
    if (req.method === 'GET') {
      return res.redirect(`/thank-you?reference=${reference}&status=success`);
    }
    res.status(200).json({ message: 'Payment verified successfully', order });
  } catch (err) {
    console.error('❌ Error verifying Paystack payment:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};