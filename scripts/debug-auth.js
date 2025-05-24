import { compare, hash } from "bcryptjs"
import { query } from "../lib/db.js"

async function debugAuthentication() {
  try {
    console.log("🔍 Debugging Authentication Process...")
    console.log("=====================================")

    // Check what's in the database
    const users = await query("SELECT id, name, email, password FROM users WHERE email = $1", [
      "markusmeyer2000@protonmail.com",
    ])

    if (users.rows.length === 0) {
      console.log("❌ No user found with email: markusmeyer2000@protonmail.com")

      // Show all users
      const allUsers = await query("SELECT id, name, email FROM users")
      console.log("📋 All users in database:")
      console.table(allUsers.rows)
      return
    }

    const user = users.rows[0]
    console.log("✅ User found:")
    console.log("- ID:", user.id)
    console.log("- Name:", user.name)
    console.log("- Email:", user.email)
    console.log("- Password (first 50 chars):", user.password.substring(0, 50) + "...")
    console.log("- Password length:", user.password.length)
    console.log("- Starts with $2b$ (bcrypt):", user.password.startsWith("$2b$"))

    // Test password comparison
    console.log("\n🔐 Testing Password Comparison...")
    console.log("=====================================")

    const testPassword = "1234"
    console.log("Testing password:", testPassword)

    try {
      const isValid = await compare(testPassword, user.password)
      console.log("✅ Password comparison result:", isValid)

      if (!isValid) {
        console.log("❌ Password comparison failed!")

        // Let's try to hash the password again and compare
        console.log("\n🔄 Re-hashing password for comparison...")
        const newHash = await hash(testPassword, 10)
        console.log("New hash:", newHash)

        const newComparison = await compare(testPassword, newHash)
        console.log("New hash comparison:", newComparison)

        // Update the database with the new hash
        console.log("\n💾 Updating database with new hash...")
        await query("UPDATE users SET password = $1 WHERE email = $2", [newHash, "markusmeyer2000@protonmail.com"])
        console.log("✅ Database updated with new hash")
      }
    } catch (compareError) {
      console.error("❌ Error during password comparison:", compareError)
    }

    // Test the complete authentication flow
    console.log("\n🧪 Testing Complete Auth Flow...")
    console.log("=====================================")

    const authTest = await query("SELECT id, role, name, email, password FROM users WHERE email = $1", [
      "markusmeyer2000@protonmail.com",
    ])

    if (authTest.rows.length > 0) {
      const authUser = authTest.rows[0]
      const authValid = await compare("1234", authUser.password)

      console.log("Auth test result:", authValid)

      if (authValid) {
        console.log("✅ Authentication should work now!")
        console.log("User object that would be returned:")
        console.log({
          id: authUser.id.toString(),
          email: authUser.email,
          name: authUser.name,
          role: authUser.role,
        })
      } else {
        console.log("❌ Authentication still failing")
      }
    }
  } catch (error) {
    console.error("💥 Error during debugging:", error)
  }
}

// Run the debug function
debugAuthentication()
