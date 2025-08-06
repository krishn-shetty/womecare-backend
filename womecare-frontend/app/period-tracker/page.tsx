"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, TrendingUp, Heart, Droplet } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface PeriodEntry {
  id: number
  cycle_start_date: string
  cycle_length: number
  period_length: number
  flow_intensity: string
  symptoms: string
  mood: string
  notes: string
}

interface PredictionData {
  predicted_date: string
  average_cycle_length: number
  message: string
}

export default function PeriodTrackerPage() {
  const { user, isAuthenticated } = useAuth()
  const [periods, setPeriods] = useState<PeriodEntry[]>([])
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    cycle_start_date: "",
    cycle_length: 28,
    period_length: 5,
    flow_intensity: "",
    symptoms: "",
    mood: "",
    notes: "",
  })

  const flowIntensities = ["Light", "Medium", "Heavy", "Very Heavy"]
  const moods = ["Happy", "Sad", "Anxious", "Irritable", "Normal", "Energetic", "Tired"]

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPeriodHistory()
      fetchPrediction()
    }
  }, [isAuthenticated, user])

  const fetchPeriodHistory = async () => {
    try {
      const response = await api.get(`/period-tracker/${user.id}/history`)
      setPeriods(response.data.periods)
    } catch (err) {
      setError("Failed to load period history")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrediction = async () => {
    try {
      const response = await api.get(`/period-tracker/${user.id}/predict`)
      setPrediction(response.data)
    } catch (err) {
      // Prediction might not be available if not enough data
      console.log("Prediction not available")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await api.post(`/period-tracker/${user.id}/log`, formData)
      setIsDialogOpen(false)
      resetForm()
      fetchPeriodHistory()
      fetchPrediction()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log period")
    }
  }

  const resetForm = () => {
    setFormData({
      cycle_start_date: "",
      cycle_length: 28,
      period_length: 5,
      flow_intensity: "",
      symptoms: "",
      mood: "",
      notes: "",
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "cycle_length" || name === "period_length" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Period Tracker</h1>
            <p className="text-gray-600">Track your menstrual cycle and get predictions</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Period
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Period</DialogTitle>
                <DialogDescription>Record your period details to track your cycle</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cycle_start_date">Cycle Start Date</Label>
                  <Input
                    id="cycle_start_date"
                    name="cycle_start_date"
                    type="date"
                    value={formData.cycle_start_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cycle_length">Cycle Length (days)</Label>
                    <Input
                      id="cycle_length"
                      name="cycle_length"
                      type="number"
                      value={formData.cycle_length}
                      onChange={handleChange}
                      min="20"
                      max="40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period_length">Period Length (days)</Label>
                    <Input
                      id="period_length"
                      name="period_length"
                      type="number"
                      value={formData.period_length}
                      onChange={handleChange}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flow_intensity">Flow Intensity</Label>
                  <Select onValueChange={(value) => handleSelectChange("flow_intensity", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flow intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      {flowIntensities.map((intensity) => (
                        <SelectItem key={intensity} value={intensity}>
                          {intensity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mood">Mood</Label>
                  <Select onValueChange={(value) => handleSelectChange("mood", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    placeholder="e.g., cramps, headache, bloating..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Log Period
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Prediction Card */}
        {prediction && (
          <Card className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-pink-600" />
                <span>Next Period Prediction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Next Period</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {new Date(prediction.predicted_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Cycle Length</p>
                  <p className="text-2xl font-bold text-purple-600">{prediction.average_cycle_length} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period History */}
        {periods.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Period History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {periods.map((period) => (
                <Card key={period.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(period.cycle_start_date).toLocaleDateString()}
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        <Droplet className="h-4 w-4 text-pink-500" />
                        <span className="text-sm text-gray-600">{period.period_length}d</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cycle Length:</span>
                        <span className="font-medium">{period.cycle_length} days</span>
                      </div>

                      {period.flow_intensity && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Flow:</span>
                          <Badge variant="secondary">{period.flow_intensity}</Badge>
                        </div>
                      )}

                      {period.mood && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Mood:</span>
                          <Badge variant="outline">{period.mood}</Badge>
                        </div>
                      )}

                      {period.symptoms && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Symptoms:</p>
                          <p className="text-sm">{period.symptoms}</p>
                        </div>
                      )}

                      {period.notes && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Notes:</p>
                          <p className="text-sm">{period.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Period Data</h3>
              <p className="text-gray-600 mb-6">Start tracking your periods to get insights and predictions</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Period
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Health Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-blue-600" />
              <span>Period Health Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">During Your Period</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Stay hydrated and eat iron-rich foods</li>
                  <li>• Use heat therapy for cramps</li>
                  <li>• Get adequate rest and sleep</li>
                  <li>• Light exercise can help reduce pain</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Track These Symptoms</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cramps and pain levels</li>
                  <li>• Flow intensity and duration</li>
                  <li>• Mood changes and energy levels</li>
                  <li>• Any unusual symptoms</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
