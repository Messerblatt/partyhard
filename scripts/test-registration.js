async function testRegistration() {
  try {
    console.log("🧪 Testing Registration API...")
    console.log("==============================")

    const testUser = {
      name: "Test User",
      email: "test@example.com",
      phone: "123-456-7890",
      role: "Other",
      password: "testpassword123",
    }

    console.log("📝 Test user data:", testUser)

    // Test the registration endpoint
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    })

    console.log("📊 Response status:", response.status)
    console.log("📊 Response ok:", response.ok)

    const responseData = await response.json()
    console.log("📊 Response data:", responseData)

    if (response.ok) {
      console.log("✅ Registration API is working!")
    } else {
      console.log("❌ Registration API failed:", responseData.error)
    }

    // Clean up - delete the test user
    if (response.ok) {
      console.log("\n🧹 Cleaning up test user...")
      const { query } = await import("../lib/db.js")
      await query("DELETE FROM users WHERE email = $1", [testUser.email])
      console.log("✅ Test user deleted")
    }
  } catch (error) {
    console.error("💥 Error testing registration:", error)
  }
}

// Run the test
testRegistration()
