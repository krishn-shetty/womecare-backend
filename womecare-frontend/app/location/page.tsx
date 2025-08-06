"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Navigation, Clock, Shield, Activity, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface LocationData {
  id: number
  latitude: number
  longitude: number
  accuracy: number
  accuracy_description: string
  address: string
  timestamp: string
  location_source: string
}

export default function LocationPage() {
  const { user, isAuthenticated } = useAuth()
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLocationHistory()
    }
  }, [isAuthenticated, user])

  const fetchLocationHistory = async () => {
    try {
      const response = await api.get(`/location/${user.id}/history?limit=20`)
      setLocationHistory(response.data.locations)
      if (response.data.locations.length > 0) {
        setCurrentLocation(response.data.locations[0])
      }
    } catch (err) {
      setError("Failed to load location history")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            location_source: "gps",
          }

          const response = await api.post(`/location/${user.id}/live`, locationData)
          setCurrentLocation(response.data.location)
          fetchLocationHistory()
          setError("")
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to update location")
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied by user")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable")
            break
          case error.TIMEOUT:
            setError("Location request timed out")
            break
          default:
            setError("An unknown error occurred while retrieving location")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const startLocationTracking = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    try {
      await api.post(`/location/${user.id}/track`, {
        interval: 30,
        high_accuracy: true,
      })

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              location_source: "gps",
            }

            const response = await api.post(`/location/${user.id}/live`, locationData)
            setCurrentLocation(response.data.location)
          } catch (err) {
            console.error("Failed to update location:", err)
          }
        },
        (error) => {
          console.error("Location tracking error:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      )

      setWatchId(id)
      setIsTracking(true)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start location tracking")
    }
  }

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, "_blank")
  }

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, "_blank")
  }

  if (!isAuthenticated) {
    return <div>Please sign in to access this page.</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Tracking</h1>
          <p className="text-gray-600">Monitor and share your location for safety</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Location */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Current Location</span>
            </CardTitle>
            <CardDescription>Your most recent location data</CardDescription>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-medium">{currentLocation.address || "Address not available"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                    <Badge variant="secondary">{currentLocation.accuracy_description}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                    <p className="font-mono text-sm">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="text-sm">{new Date(currentLocation.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => openInMaps(currentLocation.latitude, currentLocation.longitude)}
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Maps
                  </Button>
                  <Button
                    onClick={() => getDirections(currentLocation.latitude, currentLocation.longitude)}
                    variant="outline"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location Data</h3>
                <p className="text-gray-600 mb-4">Get your current location to start tracking</p>
                <Button onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Current Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Tracking Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Location Tracking</span>
            </CardTitle>
            <CardDescription>Continuous location monitoring for safety</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location-tracking"
                    checked={isTracking}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        startLocationTracking()
                      } else {
                        stopLocationTracking()
                      }
                    }}
                  />
                  <Label htmlFor="location-tracking">
                    {isTracking ? "Location tracking is ON" : "Location tracking is OFF"}
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {isTracking
                    ? "Your location is being tracked and updated automatically"
                    : "Enable to continuously monitor your location for safety"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className={`h-6 w-6 ${isTracking ? "text-green-600" : "text-gray-400"}`} />
                <Badge variant={isTracking ? "default" : "secondary"}>{isTracking ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Location History</span>
            </CardTitle>
            <CardDescription>Your recent location updates</CardDescription>
          </CardHeader>
          <CardContent>
            {locationHistory.length > 0 ? (
              <div className="space-y-4">
                {locationHistory.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{location.address || "Address not available"}</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {location.accuracy_description}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(location.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInMaps(location.latitude, location.longitude)}
                      >
                        <MapPin className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getDirections(location.latitude, location.longitude)}
                      >
                        <Navigation className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location History</h3>
                <p className="text-gray-600">Your location history will appear here once you start tracking</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety Information */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Location Safety Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Privacy & Security</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your location is only shared with emergency contacts</li>
                  <li>• Data is encrypted and stored securely</li>
                  <li>• You can turn off tracking anytime</li>
                  <li>• Location history is kept for safety purposes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Emergency Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• SOS alerts include your exact location</li>
                  <li>• Emergency contacts get map links</li>
                  <li>• High accuracy mode for emergencies</li>
                  <li>• Works even with poor signal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
