import { query } from "../lib/db.js"

async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing Database Connection...")
    console.log("================================")

    // Check environment variables
    console.log("Environment Variables:")
    console.log("- POSTGRES_HOST:", process.env.POSTGRES_HOST)
    console.log("- POSTGRES_PORT:", process.env.POSTGRES_PORT)
    console.log("- POSTGRES_DATABASE:", process.env.POSTGRES_DATABASE)
    console.log("- POSTGRES_USER:", process.env.POSTGRES_USER)
    console.log("- POSTGRES_PASSWORD:", process.env.POSTGRES_PASSWORD ? "[SET]" : "[NOT SET]")

    // Test basic connection
    console.log("\n🔌 Testing basic connection...")
    const result = await query("SELECT NOW() as current_time, version() as postgres_version")

    if (result.rows.length > 0) {
      console.log("✅ Database connection successful!")
      console.log("- Current time:", result.rows[0].current_time)
      console.log("- PostgreSQL version:", result.rows[0].postgres_version)
    }

    // Test users table
    console.log("\n👥 Testing users table...")
    const usersTest = await query("SELECT COUNT(*) as user_count FROM users")
    console.log("✅ Users table accessible!")
    console.log("- Total users:", usersTest.rows[0].user_count)

    // List all users (without passwords)
    const allUsers = await query("SELECT id, name, email, role FROM users ORDER BY id")
    console.log("\n📋 All users in database:")
    console.table(allUsers.rows)
  } catch (error) {
    console.error("❌ Database connection failed!")
    console.error("Error details:", error.message)

    if (error.code) {
      console.error("Error code:", error.code)
    }

    console.log("\n🔧 Troubleshooting steps:")
    console.log("1. Check your .env.local file has correct database credentials")
    console.log("2. Ensure your PostgreSQL server is running")
    console.log("3. Verify the database name exists")
    console.log("4. Check if the user has proper permissions")
    console.log("5. Test connection with psql: psql -h HOST -p PORT -U USERNAME -d DATABASE")
  }
}

// Run the test
testDatabaseConnection()
