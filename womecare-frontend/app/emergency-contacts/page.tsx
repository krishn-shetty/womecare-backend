"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Phone, Mail, Edit, Trash2, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface EmergencyContact {
  id: number
  name: string
  relationship: string
  phone: string
  email: string
  is_primary: boolean
}

export default function EmergencyContactsPage() {
  const { user, isAuthenticated } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    is_primary: false,
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchContacts()
    }
  }, [isAuthenticated, user])

  const fetchContacts = async () => {
    try {
      const response = await api.get(`/emergency-contacts/${user.id}`)
      setContacts(response.data.contacts)
    } catch (err) {
      setError("Failed to load emergency contacts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      if (editingContact) {
        // Update existing contact (API doesn't have update endpoint, so we'll delete and create)
        await api.delete(`/emergency-contacts/${user.id}/${editingContact.id}`)
      }

      await api.post(`/emergency-contacts/${user.id}`, formData)

      setIsDialogOpen(false)
      setEditingContact(null)
      resetForm()
      fetchContacts()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save contact")
    }
  }

  const handleDelete = async (contactId: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await api.delete(`/emergency-contacts/${user.id}/${contactId}`)
        fetchContacts()
      } catch (err) {
        setError("Failed to delete contact")
      }
    }
  }

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      is_primary: contact.is_primary,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      relationship: "",
      phone: "",
      email: "",
      is_primary: false,
    })
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingContact(null)
    resetForm()
    setError("")
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Contacts</h1>
            <p className="text-gray-600">Manage your trusted contacts for emergency situations</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add Emergency Contact"}</DialogTitle>
                <DialogDescription>
                  {editingContact
                    ? "Update the contact information below."
                    : "Add a trusted person who can be contacted in case of emergency."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Mother, Sister, Friend"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_primary: checked }))}
                  />
                  <Label htmlFor="is_primary">Primary contact</Label>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingContact ? "Update Contact" : "Add Contact"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        <CardDescription>{contact.relationship}</CardDescription>
                      </div>
                    </div>
                    {contact.is_primary && <Badge variant="secondary">Primary</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{contact.email}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)} className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Contacts</h3>
              <p className="text-gray-600 mb-6">Add trusted contacts who can be reached in case of emergency</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Emergency Numbers Info */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Emergency Services</CardTitle>
            <CardDescription className="text-red-700">
              Important emergency numbers you can call directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">108</div>
                <div className="text-sm text-red-700">Ambulance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">100</div>
                <div className="text-sm text-red-700">Police</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">101</div>
                <div className="text-sm text-red-700">Fire</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">1091</div>
                <div className="text-sm text-red-700">Women Helpline</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
