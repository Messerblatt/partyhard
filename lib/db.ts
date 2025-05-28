import { Pool } from "pg"

// Create a new pool instance with better error handling

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE,
  // Add connection timeout and retry logic
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
})

// Test the connection on startup
pool.on("connect", () => {
  // console.log("✅ Connected to PostgreSQL database")
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})

// Export the query method with better error handling
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // console.log("✅ Executed query", { text: text.substring(0, 100) + "...", duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", {
      text: text.substring(0, 50) + "...",
      error: error.message,
      code: error.code,
    })
    throw error
  }
}

// Export the pool for direct use
export { pool }
