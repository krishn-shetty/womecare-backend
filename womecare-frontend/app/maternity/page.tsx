"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Baby, Calendar, Heart, Activity, Clock, Plus, BookOpen, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface MaternityDashboard {
  due_date: string
  current_week: number
  days_pregnant: number
  days_remaining: number
  trimester: number
  current_week_guide?: {
    title: string
    baby_development: string
    mother_changes: string
    tips: string
    image_url?: string
  }
}

interface Symptom {
  id: number
  symptom_name: string
  severity: number
  notes: string
  log_date: string
}

interface KickSession {
  id: number
  start_time: string
  end_time: string
  kick_count: number
  duration_minutes: number
}

interface Contraction {
  id: number
  start_time: string
  duration_seconds: number
  frequency_minutes: number
}

export default function MaternityPage() {
  const { user, isAuthenticated } = useAuth()
  const [dashboard, setDashboard] = useState<MaternityDashboard | null>(null)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [kickSessions, setKickSessions] = useState<KickSession[]>([])
  const [contractions, setContractions] = useState<Contraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")

  // Kick Counter State
  const [isCountingKicks, setIsCountingKicks] = useState(false)
  const [kickCount, setKickCount] = useState(0)
  const [kickStartTime, setKickStartTime] = useState<Date | null>(null)

  // Contraction Timer State
  const [isTimingContraction, setIsTimingContraction] = useState(false)
  const [contractionStartTime, setContractionStartTime] = useState<Date | null>(null)
  const [contractionDuration, setContractionDuration] = useState(0)

  // Dialog States
  const [isStartPregnancyOpen, setIsStartPregnancyOpen] = useState(false)
  const [isSymptomDialogOpen, setIsSymptomDialogOpen] = useState(false)
  const [lmpDate, setLmpDate] = useState("")
  const [symptomForm, setSymptomForm] = useState({
    symptom_name: "",
    severity: 1,
    notes: "",
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMaternityDashboard()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimingContraction && contractionStartTime) {
      interval = setInterval(() => {
        setContractionDuration(Math.floor((Date.now() - contractionStartTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimingContraction, contractionStartTime])

  const fetchMaternityDashboard = async () => {
    try {
      const response = await api.get(`/maternity/${user.id}/dashboard`)
      setDashboard(response.data)
      fetchSymptoms()
      fetchKickSessions()
      fetchContractions()
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No active pregnancy
        setDashboard(null)
      } else {
        setError("Failed to load maternity data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSymptoms = async () => {
    try {
      const response = await api.get(`/maternity/${user.id}/symptoms`)
      setSymptoms(response.data.symptoms)
    } catch (err) {
      console.error("Failed to fetch symptoms")
    }
  }

  const fetchKickSessions = async () => {
    try {
      const response = await api.get(`/maternity/${user.id}/kick-counter`)
      setKickSessions(response.data.sessions)
    } catch (err) {
      console.error("Failed to fetch kick sessions")
    }
  }

  const fetchContractions = async () => {
    try {
      const response = await api.get(`/maternity/${user.id}/contraction-timer`)
      setContractions(response.data.contractions)
    } catch (err) {
      console.error("Failed to fetch contractions")
    }
  }

  const startPregnancyTracking = async () => {
    try {
      await api.post(`/maternity/${user.id}/start`, { lmp_date: lmpDate })
      setIsStartPregnancyOpen(false)
      setLmpDate("")
      fetchMaternityDashboard()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start pregnancy tracking")
    }
  }

  const logSymptom = async () => {
    try {
      await api.post(`/maternity/${user.id}/symptoms`, symptomForm)
      setIsSymptomDialogOpen(false)
      setSymptomForm({ symptom_name: "", severity: 1, notes: "" })
      fetchSymptoms()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log symptom")
    }
  }

  const startKickCounter = () => {
    setIsCountingKicks(true)
    setKickCount(0)
    setKickStartTime(new Date())
  }

  const recordKick = () => {
    setKickCount((prev) => prev + 1)
  }

  const stopKickCounter = async () => {
    if (kickStartTime) {
      const endTime = new Date()
      try {
        await api.post(`/maternity/${user.id}/kick-counter`, {
          start_time: kickStartTime.toISOString(),
          end_time: endTime.toISOString(),
          kick_count: kickCount,
        })
        fetchKickSessions()
      } catch (err) {
        setError("Failed to save kick session")
      }
    }
    setIsCountingKicks(false)
    setKickCount(0)
    setKickStartTime(null)
  }

  const startContractionTimer = () => {
    setIsTimingContraction(true)
    setContractionStartTime(new Date())
    setContractionDuration(0)
  }

  const stopContractionTimer = async () => {
    if (contractionStartTime) {
      try {
        await api.post(`/maternity/${user.id}/contraction-timer`, {
          duration_seconds: contractionDuration,
        })
        fetchContractions()
      } catch (err) {
        setError("Failed to save contraction")
      }
    }
    setIsTimingContraction(false)
    setContractionStartTime(null)
    setContractionDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
              <Baby className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Start Pregnancy Tracking</CardTitle>
            <CardDescription>
              Begin tracking your pregnancy journey with personalized insights and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isStartPregnancyOpen} onOpenChange={setIsStartPregnancyOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">Start Tracking</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Pregnancy Tracking</DialogTitle>
                  <DialogDescription>Enter the date of your last menstrual period to begin tracking</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div>
                    <Label htmlFor="lmp_date">Last Menstrual Period Date</Label>
                    <Input
                      id="lmp_date"
                      type="date"
                      value={lmpDate}
                      onChange={(e) => setLmpDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={startPregnancyTracking} className="flex-1">
                      Start Tracking
                    </Button>
                    <Button variant="outline" onClick={() => setIsStartPregnancyOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maternity Dashboard</h1>
          <p className="text-gray-600">Track your pregnancy journey week by week</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="kicks">Kick Counter</TabsTrigger>
            <TabsTrigger value="contractions">Contractions</TabsTrigger>
            <TabsTrigger value="guide">Weekly Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Pregnancy Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Week</p>
                      <p className="text-2xl font-bold">{dashboard.current_week}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-100 rounded-full">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trimester</p>
                      <p className="text-2xl font-bold">{dashboard.trimester}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Days Pregnant</p>
                      <p className="text-2xl font-bold">{dashboard.days_pregnant}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Baby className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Days Remaining</p>
                      <p className="text-2xl font-bold">{dashboard.days_remaining}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Pregnancy Progress</CardTitle>
                <CardDescription>Your journey to meeting your baby</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(dashboard.days_pregnant / 280) * 100} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Week {dashboard.current_week}</span>
                    <span>Due: {new Date(dashboard.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  {symptoms.slice(0, 3).map((symptom) => (
                    <div key={symptom.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{symptom.symptom_name}</p>
                        <p className="text-sm text-gray-600">Severity: {symptom.severity}/5</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(symptom.log_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {symptoms.length === 0 && <p className="text-gray-500 text-center py-4">No symptoms logged yet</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Kick Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {kickSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{session.kick_count} kicks</p>
                        <p className="text-sm text-gray-600">{session.duration_minutes} minutes</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(session.start_time).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {kickSessions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No kick sessions recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Symptom Tracking</h2>
              <Dialog open={isSymptomDialogOpen} onOpenChange={setIsSymptomDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Symptom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Symptom</DialogTitle>
                    <DialogDescription>Record any symptoms you're experiencing</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="symptom_name">Symptom</Label>
                      <Input
                        id="symptom_name"
                        value={symptomForm.symptom_name}
                        onChange={(e) => setSymptomForm((prev) => ({ ...prev, symptom_name: e.target.value }))}
                        placeholder="e.g., Morning sickness, Back pain"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity (1-5)</Label>
                      <Select
                        onValueChange={(value) =>
                          setSymptomForm((prev) => ({ ...prev, severity: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <SelectItem key={level} value={level.toString()}>
                              {level} - {level === 1 ? "Mild" : level === 3 ? "Moderate" : level === 5 ? "Severe" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={symptomForm.notes}
                        onChange={(e) => setSymptomForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={logSymptom} className="flex-1">
                        Log Symptom
                      </Button>
                      <Button variant="outline" onClick={() => setIsSymptomDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {symptoms.map((symptom) => (
                <Card key={symptom.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{symptom.symptom_name}</h3>
                      <Badge
                        variant={
                          symptom.severity >= 4 ? "destructive" : symptom.severity >= 3 ? "default" : "secondary"
                        }
                      >
                        {symptom.severity}/5
                      </Badge>
                    </div>
                    {symptom.notes && <p className="text-sm text-gray-600 mb-2">{symptom.notes}</p>}
                    <p className="text-xs text-gray-500">{new Date(symptom.log_date).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="kicks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kick Counter</CardTitle>
                <CardDescription>Track your baby's movements and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold text-purple-600">{kickCount}</div>
                  <p className="text-gray-600">Kicks counted</p>

                  {isCountingKicks ? (
                    <div className="space-y-4">
                      <Button onClick={recordKick} size="lg" className="bg-purple-600 hover:bg-purple-700">
                        <Activity className="h-6 w-6 mr-2" />
                        Record Kick
                      </Button>
                      <Button onClick={stopKickCounter} variant="outline">
                        Stop & Save Session
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={startKickCounter} size="lg">
                      Start Kick Counter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kickSessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{session.kick_count} kicks</p>
                        <p className="text-sm text-gray-600">Duration: {session.duration_minutes} minutes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{new Date(session.start_time).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(session.start_time).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contraction Timer</CardTitle>
                <CardDescription>Time your contractions to track labor progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold text-red-600">{formatTime(contractionDuration)}</div>
                  <p className="text-gray-600">Current contraction duration</p>

                  {isTimingContraction ? (
                    <Button onClick={stopContractionTimer} size="lg" variant="destructive">
                      <Clock className="h-6 w-6 mr-2" />
                      Stop Contraction
                    </Button>
                  ) : (
                    <Button onClick={startContractionTimer} size="lg" className="bg-red-600 hover:bg-red-700">
                      Start Timing Contraction
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Contractions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractions.map((contraction) => (
                    <div key={contraction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Duration: {formatTime(contraction.duration_seconds)}</p>
                        {contraction.frequency_minutes && (
                          <p className="text-sm text-gray-600">
                            Frequency: {contraction.frequency_minutes.toFixed(1)} min apart
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{new Date(contraction.start_time).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(contraction.start_time).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            {dashboard.current_week_guide ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{dashboard.current_week_guide.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-purple-600 mb-2">Baby Development</h3>
                    <p className="text-gray-700">{dashboard.current_week_guide.baby_development}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-600 mb-2">Changes in Your Body</h3>
                    <p className="text-gray-700">{dashboard.current_week_guide.mother_changes}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-600 mb-2">Tips for This Week</h3>
                    <p className="text-gray-700">{dashboard.current_week_guide.tips}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guide Available</h3>
                  <p className="text-gray-600">Guide for week {dashboard.current_week} is not available yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
