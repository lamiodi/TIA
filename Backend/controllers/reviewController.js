import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

export const getReviewsByProductId = async (req, res) => {
  const { product_id, bundle_id, page = 1, limit = 10 } = req.query;
  
  if (!product_id && !bundle_id) {
    console.error('getReviews: Missing product_id or bundle_id for request');
    return res.status(400).json({ error: 'Product ID or Bundle ID is required' });
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await sql`
      SELECT 
        r.id,
        r.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        r.rating,
        r.title,
        r.comment,
        r.helpful,
        r.created_at AS date,
        COALESCE(
          (SELECT COALESCE(json_agg(image_url), '[]'::json)
           FROM review_images ri
           WHERE ri.review_id = r.id),
          '[]'::json
        ) AS images,
        CASE
          WHEN r.product_id IS NOT NULL THEN p.name
          WHEN r.bundle_id IS NOT NULL THEN b.name
        END AS item_name,
        CASE
          WHEN r.product_id IS NOT NULL THEN 'product'
          WHEN r.bundle_id IS NOT NULL THEN 'bundle'
        END AS item_type
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN bundles b ON r.bundle_id = b.id
      WHERE ${product_id ? sql`r.product_id = ${product_id}` : sql`r.bundle_id = ${bundle_id}`}
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const [countResult] = await sql`
      SELECT COUNT(*) as count 
      FROM reviews 
      WHERE ${product_id ? sql`product_id = ${product_id}` : sql`bundle_id = ${bundle_id}`}
    `;
    const total = parseInt(countResult.count);

    console.log('getReviews: Fetched', reviews.length, 'reviews for', product_id ? `product_id: ${product_id}` : `bundle_id: ${bundle_id}`);
    
    res.json({ 
      reviews: reviews.map(row => ({
        ...row,
        user_name: row.user_name.trim() || 'Anonymous',
        item_name: row.item_name,
        item_type: row.item_type
      })), 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  } catch (err) {
    console.error('getReviews: Error fetching reviews for', product_id ? `product_id: ${product_id}` : `bundle_id: ${bundle_id}`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const submitReview = async (req, res) => {
  const { product_id, bundle_id, rating, title, comment, user_id } = req.body;
  const files = req.files || [];
  
  if (!user_id || (!product_id && !bundle_id) || !rating || !title || !comment) {
    console.error('submitReview: Missing required fields for user_id:', user_id, 'product_id:', product_id, 'bundle_id:', bundle_id);
    if (files.length > 0) await Promise.all(files.map((file) => fs.unlink(file.path)));
    return res.status(400).json({ error: 'Missing required fields: user_id, product_id or bundle_id, rating, title, and comment are required' });
  }
  
  if (rating < 1 || rating > 5) {
    console.error('submitReview: Invalid rating:', rating, 'for user_id:', user_id);
    if (files.length > 0) await Promise.all(files.map((file) => fs.unlink(file.path)));
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  if (files.length > 3) {
    console.error('submitReview: Too many images uploaded for user_id:', user_id, 'count:', files.length);
    await Promise.all(files.map((file) => fs.unlink(file.path)));
    return res.status(400).json({ error: 'Maximum 3 images allowed' });
  }

  try {
    await sql.begin(async (sql) => {
      const [review] = await sql`
        INSERT INTO reviews (
          user_id, product_id, bundle_id, rating, title, comment, created_at, updated_at
        ) VALUES (${user_id}, ${product_id || null}, ${bundle_id || null}, ${rating}, ${title}, ${comment}, NOW(), NOW())
        RETURNING 
          id,
          user_id,
          product_id,
          bundle_id,
          rating,
          title,
          comment,
          helpful,
          created_at AS date
      `;
      const reviewId = review.id;

      const [userResult] = await sql`
        SELECT CONCAT(first_name, ' ', last_name) AS user_name FROM users WHERE id = ${user_id}
      `;

      const imageUrls = [];
      for (const file of files) {
        try {
          const uploaded = await cloudinary.uploader.upload(file.path, {
            folder: 'reviews',
          });
          imageUrls.push(uploaded.secure_url);
        } catch (uploadErr) {
          console.error('submitReview: Cloudinary upload error for user_id:', user_id, uploadErr.message);
          throw new Error('Failed to upload image to Cloudinary');
        } finally {
          await fs.unlink(file.path);
        }
      }

      if (imageUrls.length > 0) {
        await sql`
          INSERT INTO review_images (review_id, image_url, created_at)
          VALUES ${imageUrls.map(url => sql`(${reviewId}, ${url}, NOW())`)}
        `;
      }

      console.log('submitReview: Review submitted successfully for user_id:', user_id, product_id ? `product_id: ${product_id}` : `bundle_id: ${bundle_id}`);
      
      res.status(201).json({ 
        ...review, 
        user_name: userResult.user_name.trim() || 'Anonymous',
        images: imageUrls 
      });
    });
  } catch (err) {
    console.error('submitReview: Error submitting review for user_id:', user_id, product_id ? `product_id: ${product_id}` : `bundle_id: ${bundle_id}`, err.message);
    if (files.length > 0) await Promise.all(files.map((file) => fs.unlink(file.path)));
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

export const voteReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { vote_type } = req.body;
  const user_id = req.user?.id;
  
  console.log('voteReview: Received request', { reviewId, vote_type, user_id, body: req.body, user: req.user });
  
  try {
    if (!user_id) {
      console.error('voteReview: User not authenticated for review_id:', reviewId);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!vote_type || !['helpful', 'not_helpful'].includes(vote_type)) {
      console.error('voteReview: Invalid vote type:', vote_type, 'for user_id:', user_id, 'review_id:', reviewId);
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    if (!reviewId || isNaN(parseInt(reviewId))) {
      console.error('voteReview: Invalid review ID:', reviewId, 'for user_id:', user_id);
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    await sql.begin(async (sql) => {
      // Check if review exists
      const [reviewCheck] = await sql`SELECT 1 FROM reviews WHERE id = ${reviewId}`;
      if (!reviewCheck) {
        console.error('voteReview: Review not found for review_id:', reviewId, 'user_id:', user_id);
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check for existing vote
      const [voteCheck] = await sql`SELECT 1 FROM review_votes WHERE review_id = ${reviewId} AND user_id = ${user_id}`;
      if (voteCheck) {
        console.error('voteReview: User already voted for review_id:', reviewId, 'user_id:', user_id);
        return res.status(400).json({ error: 'User has already voted on this review' });
      }

      // Insert vote
      await sql`
        INSERT INTO review_votes (review_id, user_id, vote_type, created_at) 
        VALUES (${reviewId}, ${user_id}, ${vote_type}, NOW())
      `;

      // Update helpful count for 'helpful' votes
      if (vote_type === 'helpful') {
        await sql`
          UPDATE reviews SET helpful = COALESCE(helpful, 0) + 1 WHERE id = ${reviewId}
        `;
      }

      console.log('voteReview: Vote recorded for review_id:', reviewId, 'user_id:', user_id, 'vote_type:', vote_type);
      res.status(200).json({ message: 'Vote recorded' });
    });
  } catch (err) {
    console.error('voteReview: Error voting for review_id:', reviewId, 'user_id:', user_id, err.message);
    res.status(500).json({ error: 'Server error' });
  }
};