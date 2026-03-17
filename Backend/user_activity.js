
import sql from './db/index.js';

async function searchUserActivity() {
    const email = 'oliyideoluwatobi@gmail.com';
    const userId = 180;

    try {
        console.log(`Searching activity for ${email} / User #${userId}`);

        const contacts = await sql`SELECT * FROM contacts WHERE email = ${email}`;
        console.log('Contacts:', contacts);

        const reviews = await sql`SELECT * FROM reviews WHERE user_id = ${userId}`;
        console.log('Reviews:', reviews);

        const wishlist = await sql`SELECT * FROM wishlist WHERE user_id = ${userId}`;
        console.log('Wishlist:', wishlist);

        // Check if there are any other users with the same name
        const users = await sql`SELECT id, first_name, last_name, email FROM users WHERE last_name ILIKE '%Watobi%' OR first_name ILIKE '%Tracey%'`;
        console.log('Similar Users:', users);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

searchUserActivity();
