import { hash } from "bcryptjs"
import { query } from "../lib/db.js"

async function fixDemoUser() {
  try {
    console.log("🔧 Fixing demo user password...")

    // First, let's see what's currently in the database
    const currentUser = await query("SELECT id, name, email, password FROM users WHERE email = $1", [
      "markusmeyer2000@protonmail.com",
    ])

    if (currentUser.rows.length === 0) {
      console.log("❌ Demo user not found. Creating new demo user...")

      // Create the demo user
      const hashedPassword = await hash("1234", 10)
      const result = await query(
        "INSERT INTO users (role, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
        ["Admin", "Markus", "markusmeyer2000@protonmail.com", hashedPassword],
      )

      console.log("✅ Demo user created:", result.rows[0])
    } else {
      console.log("📋 Current user data:")
      const user = currentUser.rows[0]
      console.log("- Name:", user.name)
      console.log("- Email:", user.email)
      console.log("- Password length:", user.password.length)
      console.log("- Is hashed (starts with $2b$):", user.password.startsWith("$2b$"))

      // Hash the password properly
      console.log("🔐 Generating new hash for password '1234'...")
      const hashedPassword = await hash("1234", 10)
      console.log("✅ New hash generated:", hashedPassword.substring(0, 20) + "...")

      // Update the user
      await query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, "markusmeyer2000@protonmail.com"])

      console.log("✅ Demo user password updated successfully!")
    }

    // Verify the fix worked
    console.log("\n🧪 Verifying the fix...")
    const { compare } = await import("bcryptjs")
    const verifyUser = await query("SELECT password FROM users WHERE email = $1", ["markusmeyer2000@protonmail.com"])

    if (verifyUser.rows.length > 0) {
      const isValid = await compare("1234", verifyUser.rows[0].password)
      console.log("✅ Password verification:", isValid ? "SUCCESS" : "FAILED")

      if (isValid) {
        console.log("🎉 Demo user is ready! You can now login with:")
        console.log("   Email: markusmeyer2000@protonmail.com")
        console.log("   Password: 1234")
      }
    }
  } catch (error) {
    console.error("💥 Error fixing demo user:", error)
  }
}

// Run the fix
fixDemoUser()
