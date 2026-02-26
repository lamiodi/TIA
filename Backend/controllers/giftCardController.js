
import sql from '../db/index.js';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendGiftCardEmail } from '../utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper to generate unique gift card code
const generateGiftCardCode = () => {
  return 'GC-' + crypto.randomBytes(6).toString('hex').toUpperCase();
};

export const purchaseGiftCard = async (req, res) => {
  const { amount, recipient_phone, recipient_email, sender_email, sender_name, message, currency = 'NGN' } = req.body;

  // Validate inputs
  if (!amount || !recipient_phone || !recipient_email) {
    return res.status(400).json({ error: 'Amount, recipient phone, and recipient email are required.' });
  }

  // Validate phone number (simple check for 11 digits)
  if (!/^\d{11}$/.test(recipient_phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Must be 11 digits.' });
  }
  
  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Validate amount (must be one of the allowed tiers)
  const allowedAmounts = [100000, 200000, 500000, 700000, 1000000];
  if (!allowedAmounts.includes(Number(amount))) {
    return res.status(400).json({ error: 'Invalid amount. Allowed amounts: 100k, 200k, 500k, 700k, 1M.' });
  }

  try {
    const code = generateGiftCardCode();
    const reference = 'GC_REF_' + crypto.randomBytes(8).toString('hex');
    const amountInKobo = amount * 100;

    // Create gift card record with pending status
    const [giftCard] = await sql`
      INSERT INTO gift_cards (
        code, initial_amount, remaining_balance, currency, 
        recipient_email, recipient_phone, sender_email, 
        sender_name, message,
        status, payment_reference
      ) VALUES (
        ${code}, ${amount}, ${amount}, ${currency},
        ${recipient_email}, ${recipient_phone}, ${sender_email || null},
        ${sender_name || null}, ${message || null},
        'pending', ${reference}
      )
      RETURNING *
    `;

    // Initialize Paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: recipient_email, // Using recipient email for payment notifications
        amount: amountInKobo,
        currency,
        reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift-card/thank-you`, // Frontend route
        metadata: {
          gift_card_id: giftCard.id,
          custom_fields: [
            {
              display_name: "Gift Card Code",
              variable_name: "gift_card_code",
              value: code
            },
            {
              display_name: "Recipient Phone",
              variable_name: "recipient_phone",
              value: recipient_phone
            },
            {
              display_name: "Sender Name",
              variable_name: "sender_name",
              value: sender_name
            },
            {
              display_name: "Message",
              variable_name: "message",
              value: message
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

    const { authorization_url, access_code } = response.data.data;

    res.status(200).json({
      authorization_url,
      access_code,
      reference,
      giftCard
    });

  } catch (error) {
    console.error('Error initiating gift card purchase:', error);
    res.status(500).json({ error: 'Failed to initiate purchase.' });
  }
};

export const activateGiftCard = async (reference) => {
  // Check if gift card exists
  const [giftCard] = await sql`
    SELECT * FROM gift_cards WHERE payment_reference = ${reference}
  `;

  if (!giftCard) {
    throw new Error('Gift card not found');
  }

  if (giftCard.status === 'active') {
      return { giftCard, alreadyActive: true };
  }

  // Update gift card status to active
  const [updatedGiftCard] = await sql`
    UPDATE gift_cards
    SET status = 'active', updated_at = NOW()
    WHERE id = ${giftCard.id}
    RETURNING *
  `;

  // Send Email to Recipient
  try {
    await sendGiftCardEmail(updatedGiftCard.recipient_email, updatedGiftCard);
  } catch (emailError) {
    console.error("Failed to send gift card email:", emailError);
    // Continue, don't fail the request
  }

  return { giftCard: updatedGiftCard, alreadyActive: false };
};

export const verifyGiftCardPayment = async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference is required.' });
  }

  try {
    // Verify payment with Paystack first
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status } = response.data.data;

    if (status === 'success') {
      const { giftCard, alreadyActive } = await activateGiftCard(reference);
      
      if (alreadyActive) {
         return res.status(200).json({ message: 'Gift card already active.', giftCard });
      }

      res.status(200).json({
        message: 'Payment successful. Gift card activated.',
        giftCard,
        receiptUrl: `/api/gift-cards/receipt/${reference}` // Endpoint to download receipt
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed.' });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment.' });
  }
};

// Helper to stream PDF receipt
const generateReceiptStream = (giftCard, outputStream) => {
  const doc = new PDFDocument();

  // Pipe to the output stream (e.g., response)
  doc.pipe(outputStream);

  // Add content to PDF
  doc.fontSize(20).text('Gift Card Receipt', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date: ${new Date(giftCard.updated_at || giftCard.created_at).toLocaleDateString()}`);
  doc.text(`Reference: ${giftCard.payment_reference}`);
  doc.moveDown();
  doc.text(`Recipient Email: ${giftCard.recipient_email}`);
  doc.text(`Recipient Phone: ${giftCard.recipient_phone}`);
  if (giftCard.sender_name) {
    doc.text(`Sender Name: ${giftCard.sender_name}`);
  }
  doc.moveDown();
  doc.text(`Amount: ${giftCard.currency} ${parseFloat(giftCard.initial_amount).toLocaleString()}`);
  doc.moveDown();
  doc.fontSize(16).text(`Gift Card Code: ${giftCard.code}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Thank you for your purchase!', { align: 'center' });

  doc.end();
};

export const downloadReceipt = async (req, res) => {
    const { reference } = req.params;

    try {
        const [giftCard] = await sql`
            SELECT * FROM gift_cards WHERE payment_reference = ${reference}
        `;

        if (!giftCard) {
            return res.status(404).json({ error: 'Receipt not found.' });
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${reference}.pdf`);

        generateReceiptStream(giftCard, res);

    } catch (error) {
        console.error('Error downloading receipt:', error);
        res.status(500).json({ error: 'Failed to download receipt.' });
    }
};
