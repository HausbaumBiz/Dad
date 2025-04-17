"use server"

import { createUser, getUserById, verifyCredentials } from "@/lib/user"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Register a new user
export async function registerUser(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const zipCode = formData.get("zipCode") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validate form data
  if (!firstName || !lastName || !zipCode || !email || !password || !confirmPassword) {
    return { success: false, message: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" }
  }

  // Create user in database
  const result = await createUser({
    firstName,
    lastName,
    email,
    zipCode,
    password,
  })

  if (result.success && result.userId) {
    // Set a session cookie
    cookies().set("userId", result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Set a registration success cookie for the toast
    cookies().set("registrationSuccess", "true", {
      maxAge: 60, // 1 minute
      path: "/",
    })

    // Redirect to home page
    redirect("/")
  }

  return result
}

// Login user
export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate form data
  if (!email || !password) {
    return { success: false, message: "Email and password are required" }
  }

  // Verify credentials
  const result = await verifyCredentials(email, password)

  if (result.success && result.userId) {
    // Set a session cookie
    cookies().set("userId", result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Redirect to home page
    redirect("/")
  }

  return { success: false, message: "Invalid email or password" }
}

// Check if user is logged in
export async function getLoggedInUser() {
  const userId = cookies().get("userId")?.value

  if (!userId) {
    return null
  }

  // Get user from database
  const user = await getUserById(userId)
  return user
}

// Logout user
export async function logoutUser() {
  cookies().delete("userId")
  return { success: true }
}
