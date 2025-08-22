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

// Add this to your existing paystackController.js

// In paystackController.js
export const initializeDeliveryFeePayment = async (req, res) => {
  try {
    const { order_id, delivery_fee, currency, callback_url } = req.body;
    console.log(`💳 Initializing Paystack delivery fee payment: order_id=${order_id}, delivery_fee=${delivery_fee}, currency=${currency}`);
    
    if (!order_id || !delivery_fee || !currency) {
      console.error('Missing required fields for delivery fee payment initialization');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check order exists and is eligible for delivery fee
    const orderCheck = await sql`
      SELECT o.id, o.total, o.currency, o.payment_status, o.shipping_country, o.delivery_fee, o.delivery_fee_paid, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${order_id} AND o.deleted_at IS NULL
    `;
    
    if (orderCheck.length === 0) {
      console.error(`Order not found: çalıştığı ${order_id}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderCheck[0];
    
    // Validate order is eligible for delivery fee
    if (order.shipping_country.toLowerCase() === 'nigeria') {
      console.error(`Delivery fee not applicable for domestic order: ${order_id}`);
      return res.status(400).json({ error: 'Delivery fee only applicable for international orders' });
    }
    
    if (order.payment_status !== 'completed') {
      console.error(`Order payment not completed: ${order_id}`);
      return res.status(400).json({ error: 'Order payment must be completed before collecting delivery fee' });
    }
    
    if (order.delivery_fee_paid) {
      console.error(`Delivery fee already paid for order: ${order_id}`);
      return res.status(400).json({ error: 'Delivery fee already paid for this order' });
    }
    
    // Generate unique reference with DF- prefix, order_id, and timestamp
    const timestamp = Date.now();
    const reference = `DF-${order_id}-${timestamp}`;
    
    // Update delivery fee amount in database
    await sql`
      UPDATE orders
      SET delivery_fee = ${delivery_fee}, updated_at = NOW()
      WHERE id = ${order_id}
    `;
    
    const defaultCallbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL}/admin/orders`;
    const finalCallbackUrl = callback_url || defaultCallbackUrl;
    
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: order.email,
        amount: Math.round(delivery_fee * 100), // Convert to kobo/cents
        currency,
        reference,
        callback_url: finalCallbackUrl,
        metadata: {
          order_id,
          payment_type: 'delivery_fee',
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: order_id
            },
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: "delivery_fee"
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
    
    console.log(`✅ Paystack delivery fee transaction initialized: reference=${paystackReference}`);
    res.status(200).json({ 
      authorization_url, 
      access_code, 
      reference: paystackReference,
      delivery_fee 
    });
    
  } catch (err) {
    console.error('❌ Error initializing Paystack delivery fee payment:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize delivery fee payment' });
  }
};
// Add this to your existing paystackController.js
// In paystackController.js
export const verifyDeliveryFeePayment = async (req, res) => {
  try {
    const { reference } = req.query || req.body;
    
    if (!reference) {
      console.error('Missing reference for delivery fee payment verification');
      return res.status(400).json({ error: 'Reference is required' });
    }
    
    // Check if this is a delivery fee payment (DF- prefix)
    if (!reference.startsWith('DF-')) {
      console.error(`Invalid delivery fee reference format: ${reference}`);
      return res.status(400).json({ error: 'Invalid delivery fee reference format' });
    }
    
    // Extract order_id from reference (e.g., DF-72-1634567890123 -> 72)
    const referenceParts = reference.split('-');
    if (referenceParts.length < 2) {
      console.error(`Invalid delivery fee reference format: ${reference}`);
      return res.status(400).json({ error: 'Invalid delivery fee reference format' });
    }
    const order_id = referenceParts[1]; // Second part is order_id
    
    console.log(`🔎 Verifying Paystack delivery fee payment: reference=${reference}, order_id=${order_id}`);
    
    // Check order exists
    const orderCheck = await sql`
      SELECT o.id, o.user_id, o.delivery_fee, o.delivery_fee_paid, o.currency, u.email, u.first_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${order_id} AND o.deleted_at IS NULL
    `;
    
    if (orderCheck.length === 0) {
      console.error(`Order not found for delivery fee verification: ${order_id}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderCheck[0];
    
    if (order.delivery_fee_paid) {
      console.warn(`Delivery fee already verified for order=${order_id}`);
      return res.status(200).json({ message: 'Delivery fee already verified', order });
    }
    
    // Verify with Paystack
    const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    const { status, data } = response.data;
    
    if (!status || data.status !== 'success') {
      console.error(`Delivery fee payment not successful for reference=${reference}`);
      return res.status(400).json({ error: 'Delivery fee payment not successful', order });
    }
    
    // Update delivery fee status
    await sql`
      UPDATE orders
      SET delivery_fee_paid = true, updated_at = NOW()
      WHERE id = ${order_id}
    `;
    
    console.log(`✅ Delivery fee payment verified for reference=${reference}, order_id=${order_id}`);
    
    // Send confirmation email
    await sendDeliveryFeePaymentConfirmation(
      order.email,
      order.first_name,
      order_id,
      order.delivery_fee,
      order.currency
    );
    
    res.status(200).json({ 
      message: 'Delivery fee payment verified successfully', 
      order: { ...order, delivery_fee_paid: true }
    });
    
  } catch (err) {
    console.error('❌ Error verifying Paystack delivery fee payment:', err.message);
    res.status(500).json({ error: 'Failed to verify delivery fee payment' });
  }
};