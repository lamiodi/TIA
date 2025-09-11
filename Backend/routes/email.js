// email.js - Routes for handling delivery fee emails in an e-commerce application
import express from 'express';
import sql from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { 
  sendDeliveryFeePaymentLinkEmail, 
  sendAdminDeliveryFeeNotification,
  sendOrderStatusUpdateEmail 
} from '../utils/emailService.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Helper function to check if country is international (outside Nigeria)
const isInternationalOrder = (country) => country && country.toLowerCase() !== 'nigeria';

// Get orders pending delivery fee (international orders)
router.get('/pending-delivery-fee', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await sql`
      SELECT 
        o.id,
        o.created_at,
        o.total,
        o.shipping_country as country,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.shipping_country != 'Nigeria' 
        AND o.delivery_fee_paid = false
        AND o.status = 'pending'
      ORDER BY o.created_at DESC
    `;
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching pending delivery fee orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Send delivery fee email
router.post('/send-delivery-fee-email', authenticateToken, requireAdmin, async (req, res) => {
  const { orderId, fee, paymentLink } = req.body;

  // Input validation
  if (!orderId || !fee || isNaN(fee) || fee <= 0) {
    return res.status(400).json({ error: 'Valid orderId and positive fee are required' });
  }

  try {
    // Fetch order details with support for both guest and logged users
    const [order] = await sql`
      SELECT 
        o.id, o.user_id, o.shipping_country, o.delivery_fee_paid, o.is_temporary,
        u.first_name, u.last_name, u.email as user_email,
        ba.full_name as billing_full_name, ba.email as billing_email,
        a.address_line_1, a.city, a.state, a.zip_code
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ${orderId}
    `;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!isInternationalOrder(order.shipping_country)) {
      return res.status(400).json({ error: 'Delivery fee email is only for international orders' });
    }

    if (order.delivery_fee_paid) {
      return res.status(400).json({ error: 'Delivery fee already paid for this order' });
    }

    // Use provided payment link or generate one
    const finalPaymentLink = paymentLink || `${process.env.FRONTEND_URL}/pay-delivery-fee?orderId=${orderId}&amount=${fee * 100}&currency=USD`;

    // Update delivery fee in the database
    await sql`
      UPDATE orders
      SET delivery_fee = ${fee}, updated_at = NOW()
      WHERE id = ${orderId}
    `;

    // Determine email and name based on user type (guest vs logged-in)
    let finalEmail, finalName;
    
    if (order.is_temporary) {
      // For guest users (temporary), prioritize billing address email
      finalEmail = order.billing_email || order.user_email;
      finalName = order.billing_full_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Customer';
      console.log(`📧 Guest user delivery fee for order ${orderId}: Using billing email ${finalEmail}`);
    } else {
      // For logged-in users, prioritize user email
      finalEmail = order.user_email || order.billing_email;
      finalName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.billing_full_name || 'Customer';
      console.log(`📧 Logged-in user delivery fee for order ${orderId}: Using user email ${finalEmail}`);
    }

    if (!finalEmail) {
      return res.status(400).json({ error: 'No email address found for this order' });
    }

    // Send delivery fee payment link email to user
    await sendDeliveryFeePaymentLinkEmail(
      finalEmail,
      finalName,
      orderId,
      fee,
      'USD', // Default currency for admin-set fees
      finalPaymentLink
    );

    // Send admin notification
    await sendAdminDeliveryFeeNotification(orderId, finalName, order.shipping_country, {
      address_line_1: order.address_line_1,
      city: order.city,
      state: order.state || '',
      zip_code: order.zip_code,
    });

    res.status(200).json({ message: 'Delivery fee email sent', deliveryFee: fee, paymentLink: finalPaymentLink });
  } catch (error) {
    console.error('Error sending delivery fee email:', error);
    res.status(500).json({ error: 'Failed to send delivery fee email' });
  }
});

// Verify delivery fee payment
router.post('/verify-delivery-fee-payment', authenticateToken, requireAdmin, async (req, res) => {
  const { reference, orderId } = req.body;

  if (!reference || !orderId) {
    return res.status(400).json({ error: 'Valid reference and orderId are required' });
  }

  try {
    // Verify payment with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    if (response.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update order to mark delivery fee as paid
    await sql`
      UPDATE orders
      SET delivery_fee_paid = true, updated_at = NOW()
      WHERE id = ${orderId}
    `;

    // Fetch user details for confirmation email
    const [order] = await sql`
      SELECT u.email, u.first_name, u.last_name, o.delivery_fee, o.currency
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId}
    `;

    // Note: Delivery fee confirmation email removed - users see delivery thank you page instead

    res.status(200).json({ message: 'Delivery fee payment verified and confirmed' });
  } catch (error) {
    console.error('Error verifying delivery fee payment:', error.message);
    res.status(500).json({ error: 'Failed to verify delivery fee payment' });
  }
});

// Send order status update email
router.post('/send-order-status-update', authenticateToken, requireAdmin, async (req, res) => {
  const { orderId, userEmail, userName, status } = req.body;
  
  // Input validation
  if (!orderId || !userEmail || !userName || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    await sendOrderStatusUpdateEmail(userEmail, userName, orderId, status);
    res.status(200).json({ message: 'Order status update email sent successfully' });
  } catch (error) {
    console.error('Error sending order status update email:', error);
    res.status(500).json({ error: 'Failed to send order status update email' });
  }
});

export default router;