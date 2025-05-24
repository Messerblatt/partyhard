import { hash } from "bcryptjs"
import { query } from "../lib/db.js"

async function hashDemoPassword() {
  try {
    console.log("Hashing demo user password...")

    // Hash the password '1234'
    const hashedPassword = await hash("1234", 10)
    console.log("Generated hash:", hashedPassword)

    // Update the demo user's password in the database
    const result = await query("UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email", [
      hashedPassword,
      "markusmeyer2000@protonmail.com",
    ])

    if (result.rows.length > 0) {
      console.log("✅ Successfully updated password for user:", result.rows[0])
      console.log("Demo credentials are now ready:")
      console.log("Email: markusmeyer2000@protonmail.com")
      console.log("Password: 1234")
    } else {
      console.log("❌ User not found with email: markusmeyer2000@protonmail.com")

      // Let's check what users exist
      const allUsers = await query("SELECT id, name, email FROM users")
      console.log("Existing users in database:")
      console.table(allUsers.rows)
    }
  } catch (error) {
    console.error("Error hashing password:", error)
  }
}

// Run the function
hashDemoPassword()
