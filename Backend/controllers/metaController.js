import sql from '../db/index.js';

// controllers/metaController.js
export const getSizes = async (req, res) => {
  try {
    const result = await sql`
      SELECT id, size_name AS label
      FROM sizes
      ORDER BY id
    `;
    // `sql` returns a normal JS array
    res.json(result); // [{ id: 1, label: "S" }, ...]
  } catch (err) {
    console.error('Error fetching sizes:', err);
    res.status(500).json({ error: 'Failed to fetch sizes' });
  }
};

export const getColors = async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM colors
      ORDER BY id
    `;
    res.json(result);
  } catch (err) {
    console.error('Error fetching colors:', err);
    res.status(500).json({ error: 'Failed to load colors.' });
  }
};
