"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api"

interface User {
  id: number
  name: string
  email: string
  phone: string
  age?: number
  blood_group?: string
  medical_conditions?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, phone: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
  }, [])

  const login = async (email: string, phone: string) => {
    try {
      const response = await api.post("/login", { email, phone })
      const { user: userData, token } = response.data

      setUser(userData)
      setIsAuthenticated(true)

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed")
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await api.post("/users", userData)
      const { user: newUser, token } = response.data

      setUser(newUser)
      setIsAuthenticated(true)

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(newUser))
      localStorage.setItem("token", token)

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed")
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)

    // Clear localStorage
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"]
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
