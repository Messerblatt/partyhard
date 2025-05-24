import { compare, hash } from "bcryptjs"
import { query } from "../lib/db.js"

async function debugSignIn() {
  try {
    console.log("🔍 Debugging Sign-In Process...")
    console.log("===============================")

    const testEmail = "markusmeyer2000@protonmail.com"
    const testPassword = "1234"

    // Step 1: Check if user exists
    console.log("1️⃣ Checking if user exists...")
    const userResult = await query("SELECT id, role, name, email, password FROM users WHERE email = $1", [testEmail])

    if (userResult.rows.length === 0) {
      console.log("❌ User not found!")

      // Show all users
      const allUsers = await query("SELECT id, name, email FROM users")
      console.log("📋 Available users:")
      console.table(allUsers.rows)

      // Create the demo user
      console.log("\n🔧 Creating demo user...")
      const hashedPassword = await hash(testPassword, 10)
      await query("INSERT INTO users (role, name, email, password) VALUES ($1, $2, $3, $4)", [
        "Admin",
        "Markus",
        testEmail,
        hashedPassword,
      ])
      console.log("✅ Demo user created!")
      return
    }

    const user = userResult.rows[0]
    console.log("✅ User found:")
    console.log("- ID:", user.id)
    console.log("- Name:", user.name)
    console.log("- Email:", user.email)
    console.log("- Role:", user.role)
    console.log("- Password length:", user.password.length)
    console.log("- Password starts with $2b$:", user.password.startsWith("$2b$"))
    console.log("- Password preview:", user.password.substring(0, 20) + "...")

    // Step 2: Test password comparison
    console.log("\n2️⃣ Testing password comparison...")
    console.log("Test password:", testPassword)

    if (!user.password.startsWith("$2b$")) {
      console.log("❌ Password is not hashed! Current password:", user.password)
      console.log("🔧 Hashing password now...")

      const hashedPassword = await hash(testPassword, 10)
      await query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, testEmail])

      console.log("✅ Password hashed and updated!")

      // Re-fetch user
      const updatedUser = await query("SELECT password FROM users WHERE email = $1", [testEmail])
      user.password = updatedUser.rows[0].password
    }

    const isPasswordValid = await compare(testPassword, user.password)
    console.log("🔐 Password comparison result:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("❌ Password comparison failed!")
      console.log("🔧 Let's try re-hashing the password...")

      // Force re-hash
      const newHash = await hash(testPassword, 10)
      await query("UPDATE users SET password = $1 WHERE email = $2", [newHash, testEmail])

      // Test again
      const retest = await compare(testPassword, newHash)
      console.log("✅ New hash test:", retest)

      if (retest) {
        console.log("🎉 Password should work now!")
      }
    } else {
      console.log("✅ Password comparison successful!")
    }

    // Step 3: Simulate the full auth flow
    console.log("\n3️⃣ Simulating full authentication flow...")

    const finalUser = await query("SELECT id, role, name, email, password FROM users WHERE email = $1", [testEmail])
    const finalTest = await compare(testPassword, finalUser.rows[0].password)

    if (finalTest) {
      console.log("✅ Full auth simulation successful!")
      console.log("User object that should be returned:")
      console.log({
        id: finalUser.rows[0].id.toString(),
        email: finalUser.rows[0].email,
        name: finalUser.rows[0].name,
        role: finalUser.rows[0].role,
      })
    } else {
      console.log("❌ Full auth simulation failed!")
    }
  } catch (error) {
    console.error("💥 Error during debugging:", error)
  }
}

// Run the debug
debugSignIn()
