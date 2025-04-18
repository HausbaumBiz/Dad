"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import * as Sentry from "@sentry/nextjs"

// Define the User type
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  zipCode: string
  createdAt: number
}

// Define the context type
interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider props type
interface UserProviderProps {
  children: ReactNode
}

// Auth token storage keys
const AUTH_TOKEN_KEY = "hausbaum_auth_token"
const AUTH_EXPIRY_KEY = "hausbaum_auth_expiry"
const USER_DATA_KEY = "hausbaum_user_data"

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  // Function to save auth data to localStorage
  const saveAuthToLocalStorage = (userId: string, expiryTime: number, userData?: User) => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, userId)
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString())

      if (userData) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
      }

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event("storage_updated"))
    } catch (error) {
      console.error("Error saving auth data to localStorage:", error)
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "saveAuthToLocalStorage",
          },
        },
      })
    }
  }

  // Function to get auth data from localStorage
  const getAuthFromLocalStorage = () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const expiryStr = localStorage.getItem(AUTH_EXPIRY_KEY)
      const expiry = expiryStr ? Number.parseInt(expiryStr, 10) : 0

      // Check if token is expired
      if (token && expiry && expiry > Date.now()) {
        return token
      }

      // Clear expired token
      if (token) {
        clearAuthFromLocalStorage()
      }

      return null
    } catch (error) {
      console.error("Error getting auth data from localStorage:", error)
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "getAuthFromLocalStorage",
          },
        },
      })
      return null
    }
  }

  // Function to clear auth data from localStorage
  const clearAuthFromLocalStorage = () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_EXPIRY_KEY)
      localStorage.removeItem(USER_DATA_KEY)

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event("storage_updated"))
    } catch (error) {
      console.error("Error clearing auth data from localStorage:", error)
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "clearAuthFromLocalStorage",
          },
        },
      })
    }
  }

  // Function to get cached user data from localStorage
  const getCachedUserData = (): User | null => {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error getting cached user data:", error)
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "getCachedUserData",
          },
        },
      })
      return null
    }
  }

  // Function to fetch user data
  const fetchUserData = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Start a transaction for performance monitoring
      let transaction: Sentry.Transaction | undefined
      if (typeof Sentry.startTransaction === "function") {
        transaction = Sentry.startTransaction({
          name: "fetchUserData",
          op: "auth",
        })
      }

      // First try to get userId from cookie
      let userId = getCookie("userId")
      let useLocalStorage = false

      // If no cookie, try localStorage as backup
      if (!userId) {
        userId = getAuthFromLocalStorage()
        useLocalStorage = true

        // If we found a token in localStorage but not in cookies, try to restore the cookie
        if (userId) {
          console.log("Restoring auth cookie from localStorage backup")

          // Attempt to restore the cookie via API
          const restoreResponse = await fetch("/api/auth/restore-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          })

          if (!restoreResponse.ok) {
            // If restore failed, clear localStorage and return null
            clearAuthFromLocalStorage()
            setUser(null)
            setIsLoading(false)
            transaction?.finish()
            return
          }
        }
      }

      if (!userId) {
        setUser(null)
        setIsLoading(false)
        transaction?.finish()
        return
      }

      // Try to use cached user data first if we're using localStorage
      if (useLocalStorage) {
        const cachedUser = getCachedUserData()
        if (cachedUser) {
          setUser(cachedUser)
          // Still fetch in the background to ensure data is fresh
        }
      }

      // Fetch fresh user data from API
      const response = await fetch(`/api/user?id=${userId}`)

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)

        // Set user context in Sentry
        Sentry.setUser({
          id: userData.id,
          email: userData.email,
          username: `${userData.firstName} ${userData.lastName}`,
        })

        // Update localStorage with fresh data
        if (userId) {
          // Calculate expiry time (7 days from now)
          const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000
          saveAuthToLocalStorage(userId, expiryTime, userData)
        }
      } else {
        // If the response is not OK, clear the user
        setUser(null)

        // Clear Sentry user context
        Sentry.setUser(null)

        // Clear invalid cookies and localStorage
        document.cookie = "userId=; max-age=0; path=/;"
        clearAuthFromLocalStorage()
      }

      // Finish the transaction
      transaction?.finish()
    } catch (error) {
      console.error("Error fetching user data:", error)
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "fetchUserData",
          },
        },
      })
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true)

      // Start a transaction for performance monitoring
      let transaction: Sentry.Transaction | undefined
      if (typeof Sentry.startTransaction === "function") {
        transaction = Sentry.startTransaction({
          name: "login",
          op: "auth",
        })
      }

      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Save auth data to localStorage
        if (result.userId) {
          // Calculate expiry time (7 days from now)
          const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000
          saveAuthToLocalStorage(result.userId, expiryTime)
        }

        await fetchUserData() // Refresh user data after login

        // Add a breadcrumb for successful login
        Sentry.addBreadcrumb({
          category: "auth",
          message: "User logged in successfully",
          level: "info",
        })

        // Finish the transaction
        transaction?.finish()

        return { success: true, message: "Login successful" }
      }

      // Add a breadcrumb for failed login
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Login failed",
        level: "error",
        data: {
          reason: result.message,
        },
      })

      // Finish the transaction
      transaction?.finish()

      return { success: false, message: result.message || "Login failed" }
    } catch (error) {
      console.error("Login error:", error)

      // Capture the error with Sentry
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "login",
          },
        },
      })

      return { success: false, message: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Start a transaction for performance monitoring
      let transaction: Sentry.Transaction | undefined
      if (typeof Sentry.startTransaction === "function") {
        transaction = Sentry.startTransaction({
          name: "logout",
          op: "auth",
        })
      }

      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear user data
      setUser(null)

      // Clear Sentry user context
      Sentry.setUser(null)

      // Add a breadcrumb for logout
      Sentry.addBreadcrumb({
        category: "auth",
        message: "User logged out",
        level: "info",
      })

      // Clear cookie client-side
      document.cookie = "userId=; max-age=0; path=/;"

      // Clear localStorage
      clearAuthFromLocalStorage()

      // Finish the transaction
      transaction?.finish()

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)

      // Capture the error with Sentry
      Sentry.captureException(error, {
        contexts: {
          auth: {
            operation: "logout",
          },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to manually refresh user data
  const refreshUserData = async (): Promise<void> => {
    await fetchUserData()
  }

  // Initial fetch of user data
  useEffect(() => {
    fetchUserData()
  }, [pathname]) // Re-fetch when pathname changes

  // Listen for storage events (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY || e.key === USER_DATA_KEY || e.key === null) {
        fetchUserData()
      }
    }

    // Custom event for same-tab updates
    const handleCustomStorageEvent = () => {
      fetchUserData()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("storage_updated", handleCustomStorageEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("storage_updated", handleCustomStorageEvent)
    }
  }, [])

  // Check token expiration periodically
  useEffect(() => {
    const checkTokenExpiration = () => {
      const userId = getCookie("userId")

      if (!userId) {
        // If no cookie, check localStorage
        const localStorageToken = getAuthFromLocalStorage()

        if (!localStorageToken) {
          // If no token in localStorage either, user is logged out
          if (user) {
            setUser(null)

            // Clear Sentry user context
            Sentry.setUser(null)
          }
        }
      }
    }

    const interval = setInterval(checkTokenExpiration, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user])

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUserData,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
