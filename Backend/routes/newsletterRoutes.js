// newsletterRoutes.js
import { Router } from 'express';
import sql from '../db/index.js';

const router = Router();

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // Check if email already exists
    const [existingSubscriber] = await sql`
      SELECT * FROM newsletter_subscribers WHERE email = ${email}
    `;

    if (existingSubscriber) {
      // If already subscribed but unsubscribed, reactivate
      if (existingSubscriber.unsubscribed_at) {
        await sql`
          UPDATE newsletter_subscribers
          SET unsubscribed_at = NULL
          WHERE email = ${email}
        `;
        return res.json({
          success: true,
          message: 'Welcome back! You have been re-subscribed to our newsletter.'
        });
      } else {
        // If already active, return error
        return res.status(409).json({
          success: false,
          message: 'This email is already subscribed'
        });
      }
    }

    // Add new subscriber
    await sql`
      INSERT INTO newsletter_subscribers (email, subscribed_at)
      VALUES (${email}, NOW())
    `;

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while subscribing'
    });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    await sql`
      UPDATE newsletter_subscribers
      SET unsubscribed_at = NOW()
      WHERE email = ${email}
    `;

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while unsubscribing'
    });
  }
});

// Get all subscribers (for admin dashboard)
router.get('/subscribers', async (req, res) => {
  try {
    const subscribers = await sql`
      SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC
    `;
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

export default router;
