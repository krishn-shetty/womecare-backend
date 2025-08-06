"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, MapPin, Users, Calendar, Baby, AlertTriangle, Phone, Mail } from 'lucide-react'
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface DashboardData {
  user: any
  emergency_contacts: any[]
  recent_locations: any[]
  sos_alerts: any[]
  pregnancy_tracker: any
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(`/dashboard/${user.id}`)
      setDashboardData(response.data)
    } catch (err: any) {
      setError("Failed to load dashboard data")
      console.error("Dashboard error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerSOS = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            await api.post(`/sos/${user.id}`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              alert_type: "emergency",
              message: "Emergency assistance needed",
            })
            
            toast({
              title: "🚨 SOS Alert Sent Successfully!",
              description: "Your emergency contacts have been notified with your location. Help is on the way!",
              duration: 5000,
            })
            
            fetchDashboardData()
          } catch (error) {
            toast({
              title: "❌ Failed to Send SOS Alert",
              description: "There was an error sending your emergency alert. Please try again or call emergency services directly.",
              variant: "destructive",
              duration: 5000,
            })
          }
        }, (error) => {
          // Location error - still send SOS without location
          api.post(`/sos/${user.id}`, {
            alert_type: "emergency",
            message: "Emergency assistance needed - location unavailable",
          }).then(() => {
            toast({
              title: "🚨 SOS Alert Sent Successfully!",
              description: "Your emergency contacts have been notified. Location could not be determined, but help has been alerted!",
              duration: 5000,
            })
            fetchDashboardData()
          }).catch(() => {
            toast({
              title: "❌ Failed to Send SOS Alert",
              description: "There was an error sending your emergency alert. Please try again or call emergency services directly.",
              variant: "destructive",
              duration: 5000,
            })
          })
        })
      } else {
        // No geolocation support - send SOS without location
        await api.post(`/sos/${user.id}`, {
          alert_type: "emergency",
          message: "Emergency assistance needed - geolocation not supported",
        })
        
        toast({
          title: "🚨 SOS Alert Sent Successfully!",
          description: "Your emergency contacts have been notified. Location services are not available on this device.",
          duration: 5000,
        })
        
        fetchDashboardData()
      }
    } catch (err) {
      toast({
        title: "❌ Failed to Send SOS Alert",
        description: "There was an error sending your emergency alert. Please try again or call emergency services directly.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {dashboardData?.user?.name}!</h1>
          <p className="text-gray-600">Here's your health and safety overview</p>
        </div>

        {/* Emergency SOS Button */}
        <div className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Emergency SOS</h3>
                    <p className="text-red-700">Tap to send emergency alert to your contacts</p>
                  </div>
                </div>
                <Button onClick={triggerSOS} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3" size="lg">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  SOS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emergency Contacts</p>
                  <p className="text-2xl font-bold">{dashboardData?.emergency_contacts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recent Locations</p>
                  <p className="text-2xl font-bold">{dashboardData?.recent_locations?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">SOS Alerts</p>
                  <p className="text-2xl font-bold">{dashboardData?.sos_alerts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Baby className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pregnancy</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.pregnancy_tracker?.is_tracking ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Emergency Contacts</span>
              </CardTitle>
              <CardDescription>Your trusted contacts for emergency situations</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.emergency_contacts?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.emergency_contacts.slice(0, 3).map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.relationship}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {contact.is_primary && <Badge variant="secondary">Primary</Badge>}
                    </div>
                  ))}
                  <Link href="/emergency-contacts">
                    <Button variant="outline" className="w-full bg-transparent">
                      Manage Contacts
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No emergency contacts added yet</p>
                  <Link href="/emergency-contacts">
                    <Button>Add Emergency Contact</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent SOS Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Recent SOS Alerts</span>
              </CardTitle>
              <CardDescription>Your recent emergency alerts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.sos_alerts?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.sos_alerts.slice(0, 3).map((alert: any) => (
                    <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={alert.status === "active" ? "destructive" : "secondary"}>{alert.status}</Badge>
                        <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium">{alert.alert_type}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No SOS alerts sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pregnancy Tracker */}
          {dashboardData?.pregnancy_tracker?.is_tracking && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Baby className="h-5 w-5" />
                  <span>Pregnancy Tracker</span>
                </CardTitle>
                <CardDescription>Your pregnancy journey progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      Week {dashboardData.pregnancy_tracker.current_week}
                    </p>
                    <p className="text-sm text-gray-600">Current Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      Trimester {dashboardData.pregnancy_tracker.trimester}
                    </p>
                    <p className="text-sm text-gray-600">Current Trimester</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {new Date(dashboardData.pregnancy_tracker.due_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Due Date</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/maternity">
                    <Button className="w-full">View Maternity Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/period-tracker">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Period Tracker</span>
              </Button>
            </Link>
            <Link href="/maternity">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <Baby className="h-6 w-6" />
                <span className="text-sm">Maternity</span>
              </Button>
            </Link>
            <Link href="/location">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <MapPin className="h-6 w-6" />
                <span className="text-sm">Location</span>
              </Button>
            </Link>
            <Link href="/community">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Community</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
