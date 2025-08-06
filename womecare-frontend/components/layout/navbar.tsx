"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Heart, Menu, Shield, Users, Calendar, Baby, MapPin, MessageCircle, User, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Shield },
    { name: "Emergency Contacts", href: "/emergency-contacts", icon: Users },
    { name: "Period Tracker", href: "/period-tracker", icon: Calendar },
    { name: "Maternity", href: "/maternity", icon: Baby },
    { name: "Location", href: "/location", icon: MapPin },
    { name: "Community", href: "/community", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: User },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Womecare</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className={`flex items-center space-x-2 ${
                        isActive(item.href) ? "bg-pink-600 text-white" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user?.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="hidden md:flex items-center space-x-2 bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden bg-transparent">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 mb-8">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Womecare</span>
                  </div>

                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
                        <User className="h-8 w-8 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        {navigation.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link key={item.name} href={item.href}>
                              <Button
                                variant={isActive(item.href) ? "default" : "ghost"}
                                className={`w-full justify-start ${
                                  isActive(item.href) ? "bg-pink-600 text-white" : "text-gray-600 hover:text-gray-900"
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                {item.name}
                              </Button>
                            </Link>
                          )
                        })}
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                          onClick={() => {
                            logout()
                            setIsOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Link href="/auth/login">
                        <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/register">
                        <Button className="w-full" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
