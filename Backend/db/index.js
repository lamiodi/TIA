// db.js
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require' // Ensures Supabase SSL is used
})

export default sql
