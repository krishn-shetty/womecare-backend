"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Shield, Users, Baby, Calendar, MapPin, AlertTriangle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSOS: 0,
    communityPosts: 0,
  })

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalUsers: 1250,
      activeSOS: 3,
      communityPosts: 89,
    })
  }, [])

  const features = [
    {
      icon: Shield,
      title: "Emergency SOS",
      description: "Instant emergency alerts with location sharing to your trusted contacts",
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      icon: MapPin,
      title: "Location Tracking",
      description: "Safe location monitoring and sharing with family members",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Calendar,
      title: "Period Tracker",
      description: "Track your menstrual cycle with predictions and health insights",
      color: "text-pink-500",
      bgColor: "bg-pink-50",
    },
    {
      icon: Baby,
      title: "Maternity Care",
      description: "Comprehensive pregnancy tracking with weekly guides and tools",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Users,
      title: "Emergency Contacts",
      description: "Manage trusted contacts for emergency situations",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Connect with other women and share experiences safely",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-pink-100 rounded-full">
                <Heart className="h-12 w-12 text-pink-600" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Your Safety, Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Priority
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Womecare is your comprehensive healthcare companion, providing emergency assistance, health tracking, and
              community support designed specifically for women.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-pink-600 text-pink-600 hover:bg-pink-50 px-8 py-3 bg-transparent"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">{stats.totalUsers.toLocaleString()}+</div>
                <div className="text-gray-600">Women Protected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.activeSOS}</div>
                <div className="text-gray-600">Active Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.communityPosts}+</div>
                <div className="text-gray-600">Community Posts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comprehensive Women's Healthcare</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to stay safe, healthy, and connected in one secure platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Alert Section */}
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Emergency? Help is One Tap Away</h2>
            <p className="text-xl text-gray-600 mb-8">
              Our SOS feature instantly alerts your emergency contacts with your exact location, ensuring help reaches
              you when you need it most.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">108</div>
                <div className="text-sm text-gray-600">Ambulance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">100</div>
                <div className="text-sm text-gray-600">Police</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">101</div>
                <div className="text-sm text-gray-600">Fire</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">1091</div>
                <div className="text-sm text-gray-600">Women Helpline</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Join Thousands of Women Who Trust Womecare</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Start your journey to better health and safety today. It's free, secure, and designed just for you.
          </p>
          {!isAuthenticated && (
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3">
                Create Your Account
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
