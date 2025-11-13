"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { MessageSquare, Send, User } from "lucide-react"

interface CommentsSectionProps {
  applicationId: string
  comments: any[]
  onUpdate?: () => void
}

export function CommentsSection({ applicationId, comments, onUpdate }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          content: newComment,
          commentType: "REMARK",
        }),
      })

      if (response.ok) {
        setNewComment("")
        if (onUpdate) {
          onUpdate()
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Comments & Remarks</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a comment or remark..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {submitting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Add Comment
              </>
            )}
          </Button>
        </form>

        <div className="space-y-4 pt-4 border-t border-gray-200">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No comments yet</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{comment.authorName}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
