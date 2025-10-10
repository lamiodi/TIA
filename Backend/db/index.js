// db.js
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

// Check if we're in development or production
const isProduction = process.env.NODE_ENV === 'production'

// Configure connection options
const connectionOptions = {
  ssl: isProduction ? 'require' : false, // Only use SSL in production
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 30, // How long a connection can be idle before being closed
  connect_timeout: 10 // Connection timeout in seconds
}

// Use local database URL for development if DATABASE_URL is not available
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tia_brand'

const sql = postgres(databaseUrl, connectionOptions)

export default sql
