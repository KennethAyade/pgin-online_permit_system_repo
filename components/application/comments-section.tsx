"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { MessageSquare, Send, User, Paperclip, X, FileText, Download } from "lucide-react"

interface CommentsSectionProps {
  applicationId: string
  comments: any[]
  onUpdate?: () => void
}

export function CommentsSection({ applicationId, comments, onUpdate }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    setUploadError("")
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() && selectedFiles.length === 0) return

    setSubmitting(true)
    setUploadError("")
    
    try {
      let attachments: { fileName: string; fileUrl: string }[] = []

      // Upload files first if any are selected
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("applicationId", applicationId)

          const uploadResponse = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            setUploadError(`Failed to upload ${file.name}`)
            setSubmitting(false)
            return
          }

          const uploadResult = await uploadResponse.json()
          attachments.push({
            fileName: file.name,
            fileUrl: uploadResult.document.fileUrl,
          })
        }
      }

      // Create comment with attachments
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          content: newComment.trim() || "Uploaded files",
          commentType: "REMARK",
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      if (response.ok) {
        setNewComment("")
        setSelectedFiles([])
        setUploadError("")
        if (onUpdate) {
          onUpdate()
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      setUploadError("An error occurred. Please try again.")
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
            placeholder="Add a comment or remark (admin can request additional documents here)..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />

          {/* Multiple File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="comment-files" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Paperclip className="h-4 w-4" />
              Attach Files (Multiple files supported)
            </Label>
            <Input
              id="comment-files"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={submitting}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">
              You can upload multiple files. Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB per file)
            </p>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length}):</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={submitting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={submitting || (!newComment.trim() && selectedFiles.length === 0)}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {submitting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                {selectedFiles.length > 0 ? "Uploading files and posting..." : "Posting..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {selectedFiles.length > 0 ? `Add Comment with ${selectedFiles.length} file(s)` : "Add Comment"}
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

                    {/* Display Attached Files */}
                    {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attached Files ({comment.attachments.length}):
                        </p>
                        <div className="space-y-1">
                          {comment.attachments.map((attachment: any, index: number) => (
                            <a
                              key={index}
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-white p-2 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="flex-1">{attachment.fileName}</span>
                              <Download className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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
