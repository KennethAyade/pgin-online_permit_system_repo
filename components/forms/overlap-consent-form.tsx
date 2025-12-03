'use client'

/**
 * Overlap Consent Form Component
 * Phase 2.4: Upload consent documents for overlapping coordinates
 */

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react'

interface OverlapConsentData {
  id?: string
  affectedApplicationId: string
  affectedApplicationNo: string
  overlapPercentage: number
  overlapArea?: number
  consentStatus?: 'REQUIRED' | 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'NOT_REQUIRED'
  consentFileUrl?: string
  consentFileName?: string
  verificationRemarks?: string
}

interface OverlapConsentFormProps {
  overlaps: OverlapConsentData[]
  applicationId: string
  onUploadConsent: (affectedApplicationId: string, file: File) => Promise<void>
  onRemoveConsent?: (affectedApplicationId: string) => Promise<void>
  isReadOnly?: boolean
}

export function OverlapConsentForm({
  overlaps,
  applicationId,
  onUploadConsent,
  onRemoveConsent,
  isReadOnly = false,
}: OverlapConsentFormProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileUpload = async (affectedApplicationId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF and image files (PNG, JPG, JPEG) are allowed')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB')
      return
    }

    try {
      setUploadingFor(affectedApplicationId)
      setUploadError(null)
      await onUploadConsent(affectedApplicationId, file)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload consent document')
    } finally {
      setUploadingFor(null)
    }
  }

  const getConsentStatusBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'UPLOADED':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'REQUIRED':
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Required
          </Badge>
        )
    }
  }

  if (overlaps.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-700" />
        <AlertDescription className="text-green-800 text-sm">
          <strong>No Overlaps Detected</strong>
          <br />
          Your project coordinates do not overlap with any existing approved projects. No consent is required.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Consent Required</strong>
          <br />
          Your project coordinates overlap with {overlaps.length} existing approved project{overlaps.length > 1 ? 's' : ''}.
          You must upload consent documents from the affected application owner(s) before your coordinates can be approved.
        </AlertDescription>
      </Alert>

      {uploadError && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800 text-sm">{uploadError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {overlaps.map((overlap) => (
          <Card key={overlap.affectedApplicationId} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Application {overlap.affectedApplicationNo}
                  </CardTitle>
                  <CardDescription>
                    Overlap: {overlap.overlapPercentage.toFixed(2)}%
                    {overlap.overlapArea && ` (${overlap.overlapArea.toFixed(2)} m²)`}
                  </CardDescription>
                </div>
                {getConsentStatusBadge(overlap.consentStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Verification Remarks (if rejected) */}
              {overlap.consentStatus === 'REJECTED' && overlap.verificationRemarks && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-700" />
                  <AlertDescription className="text-red-800 text-sm">
                    <strong>Admin Remarks:</strong> {overlap.verificationRemarks}
                  </AlertDescription>
                </Alert>
              )}

              {/* Current Consent Document */}
              {overlap.consentFileUrl && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{overlap.consentFileName || 'Consent Document'}</p>
                    <a
                      href={overlap.consentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                  {!isReadOnly && overlap.consentStatus !== 'VERIFIED' && onRemoveConsent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveConsent(overlap.affectedApplicationId)}
                      disabled={uploadingFor === overlap.affectedApplicationId}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}

              {/* Upload Button */}
              {!isReadOnly && overlap.consentStatus !== 'VERIFIED' && (
                <div>
                  <input
                    type="file"
                    id={`consent-${overlap.affectedApplicationId}`}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileUpload(overlap.affectedApplicationId, e)}
                    disabled={uploadingFor === overlap.affectedApplicationId}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById(`consent-${overlap.affectedApplicationId}`)?.click()}
                    disabled={uploadingFor === overlap.affectedApplicationId}
                  >
                    {uploadingFor === overlap.affectedApplicationId ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {overlap.consentFileUrl ? 'Replace Consent Document' : 'Upload Consent Document'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a signed consent document from the owner of Application {overlap.affectedApplicationNo}.
                    Accepted formats: PDF, PNG, JPG (max 10MB)
                  </p>
                </div>
              )}

              {/* Read-only message */}
              {isReadOnly && (
                <p className="text-sm text-muted-foreground italic">
                  Consent document upload is currently not available.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground space-y-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="font-medium">About Consent Requirements:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>You must obtain written consent from each affected application owner</li>
          <li>The consent document should clearly state permission for the overlap</li>
          <li>Upload the signed consent document for admin verification</li>
          <li>Your coordinates cannot be approved until all consents are verified</li>
        </ul>
      </div>
    </div>
  )
}
