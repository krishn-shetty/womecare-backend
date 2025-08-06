"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { MessageCircle, Plus, Heart, Users, Baby, Shield, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface CommunityPost {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  created_at: string
  updated_at?: string
}

interface Comment {
  id: number
  user_id: number
  content: string
  created_at: string
}

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    category: "",
  })

  const [newComment, setNewComment] = useState("")

  const categories = [
    { value: "all", label: "All Posts", icon: MessageCircle },
    { value: "Pregnancy", label: "Pregnancy", icon: Baby },
    { value: "Health", label: "Health", icon: Heart },
    { value: "Support", label: "Support", icon: Users },
    { value: "Safety", label: "Safety", icon: Shield },
    { value: "General", label: "General", icon: TrendingUp },
  ]

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPosts()
    }
  }, [isAuthenticated, user, selectedCategory])

  const fetchPosts = async () => {
    try {
      const params = selectedCategory !== "all" ? `?category=${selectedCategory}` : ""
      const response = await api.get(`/community/posts${params}`)
      setPosts(response.data.posts)
    } catch (err) {
      setError("Failed to load community posts")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async (postId: number) => {
    try {
      const response = await api.get(`/community/posts/${postId}/comments`)
      setComments(response.data.comments)
    } catch (err) {
      setError("Failed to load comments")
    }
  }

  const createPost = async () => {
    try {
      await api.post("/community/posts", {
        ...postForm,
        user_id: user.id,
      })
      setIsPostDialogOpen(false)
      setPostForm({ title: "", content: "", category: "" })
      fetchPosts()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create post")
    }
  }

  const addComment = async () => {
    if (!selectedPost || !newComment.trim()) return

    try {
      await api.post(`/community/posts/${selectedPost.id}/comments`, {
        user_id: user.id,
        content: newComment,
      })
      setNewComment("")
      fetchComments(selectedPost.id)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add comment")
    }
  }

  const openComments = (post: CommunityPost) => {
    setSelectedPost(post)
    setIsCommentsDialogOpen(true)
    fetchComments(post.id)
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat ? cat.icon : MessageCircle
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Pregnancy: "bg-purple-100 text-purple-800",
      Health: "bg-red-100 text-red-800",
      Support: "bg-blue-100 text-blue-800",
      Safety: "bg-green-100 text-green-800",
      General: "bg-gray-100 text-gray-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Forum</h1>
            <p className="text-gray-600">Connect, share, and support each other</p>
          </div>

          <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Share your thoughts, questions, or experiences with the community</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={postForm.title}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter post title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setPostForm((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={postForm.content}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your thoughts..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button onClick={createPost} className="flex-1">
                    Create Post
                  </Button>
                  <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.value} value={category.value} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.value} value={category.value}>
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            <span>User {post.user_id}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => openComments(post)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Comments
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                    <p className="text-gray-600 mb-6">
                      {selectedCategory === "all"
                        ? "Be the first to start a conversation in the community"
                        : `No posts in the ${selectedCategory} category yet`}
                    </p>
                    <Button onClick={() => setIsPostDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Comments Dialog */}
        <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost?.title}</DialogTitle>
              <DialogDescription>
                <Badge className={getCategoryColor(selectedPost?.category || "")}>{selectedPost?.category}</Badge>
                <span className="ml-2 text-sm text-gray-500">
                  {selectedPost && new Date(selectedPost.created_at).toLocaleDateString()}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Original Post */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{selectedPost?.content}</p>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold">Comments</h3>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">User {comment.user_id}</span>
                          <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="space-y-4 border-t pt-4">
                <Label htmlFor="new-comment">Add a comment</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                />
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Community Guidelines */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Community Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Be Respectful</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Treat everyone with kindness and respect</li>
                  <li>• No harassment, bullying, or discrimination</li>
                  <li>• Respect different opinions and experiences</li>
                  <li>• Use appropriate language</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Share Safely</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Don't share personal information</li>
                  <li>• Medical advice should come from professionals</li>
                  <li>• Report inappropriate content</li>
                  <li>• Support each other positively</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
