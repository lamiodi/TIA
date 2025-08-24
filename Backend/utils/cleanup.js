// cleanup.js
import { CronJob } from 'cron';
import sql from '../db/index.js'; // Adjust path to your DB connection

const cleanupJob = new CronJob('0 0 * * 0', async () => { // Weekly on Sunday at midnight
  try {
    await sql.begin(async (sql) => {
      const staleUsers = await sql`
        SELECT id FROM users 
        WHERE is_temporary = true 
        AND created_at < NOW() - INTERVAL '7 days'
        AND deleted_at IS NULL
        -- Optional: AND NOT EXISTS (SELECT 1 FROM orders WHERE user_id = users.id AND created_at > NOW() - INTERVAL '7 days')
      `;

      for (const user of staleUsers) {
        await sql`UPDATE users SET deleted_at = NOW() WHERE id = ${user.id}`;
        // Optional: Clean related data, e.g., delete carts if no orders
        await sql`DELETE FROM cart WHERE user_id = ${user.id}`;
      }
      console.log(`Cleaned up ${staleUsers.length} temporary accounts`);
    });
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, null, true, 'UTC');

export default cleanupJob;