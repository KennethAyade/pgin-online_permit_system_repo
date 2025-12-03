'use client'

/**
 * Admin Overlap Consent Manager Component
 * Phase 2.4: Admin interface to review and verify consent documents
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  ExternalLink,
  Eye,
} from 'lucide-react'

interface ConsentData {
  id: string
  newApplicationId: string
  newApplicationNo: string
  newProjectName: string
  affectedApplicationId: string
  affectedApplicationNo: string
  affectedProjectName: string
  overlapPercentage: number
  overlapArea?: number
  consentStatus: 'REQUIRED' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'
  consentFileUrl?: string
  consentFileName?: string
  consentUploadedAt?: Date
  consentVerifiedAt?: Date
  verificationRemarks?: string
  applicantName: string
  applicantEmail: string
}

interface OverlapConsentManagerProps {
  consents: ConsentData[]
  onVerifyConsent: (consentId: string, decision: 'VERIFIED' | 'REJECTED', remarks?: string) => Promise<void>
  onRefresh?: () => void
}

export function OverlapConsentManager({
  consents,
  onVerifyConsent,
  onRefresh,
}: OverlapConsentManagerProps) {
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [rejectionRemarks, setRejectionRemarks] = useState<{ [key: string]: string }>({})
  const [showRemarksFor, setShowRemarksFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (consentId: string, decision: 'VERIFIED' | 'REJECTED') => {
    try {
      setVerifyingId(consentId)
      setError(null)

      const remarks = decision === 'REJECTED' ? rejectionRemarks[consentId] : undefined

      if (decision === 'REJECTED' && !remarks) {
        setError('Please provide remarks for rejection')
        return
      }

      await onVerifyConsent(consentId, decision, remarks)

      // Clear remarks after successful verification
      if (decision === 'REJECTED') {
        setRejectionRemarks(prev => {
          const updated = { ...prev }
          delete updated[consentId]
          return updated
        })
        setShowRemarksFor(null)
      }

      // Refresh the list
      if (onRefresh) {
        onRefresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify consent')
    } finally {
      setVerifyingId(null)
    }
  }

  const getConsentStatusBadge = (status: string) => {
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
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Required
          </Badge>
        )
    }
  }

  // Filter and sort consents
  const pendingConsents = consents.filter(c => c.consentStatus === 'UPLOADED')
  const verifiedConsents = consents.filter(c => c.consentStatus === 'VERIFIED')
  const rejectedConsents = consents.filter(c => c.consentStatus === 'REJECTED')

  if (consents.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No consent documents to review at this time.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingConsents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedConsents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedConsents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Consents Section */}
      {pendingConsents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-blue-600">Pending Verification</h3>
          {pendingConsents.map((consent) => (
            <Card key={consent.id} className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      New Application: {consent.newApplicationNo}
                    </CardTitle>
                    <CardDescription>
                      Overlaps with: {consent.affectedApplicationNo}
                    </CardDescription>
                  </div>
                  {getConsentStatusBadge(consent.consentStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overlap Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">New Project:</span> {consent.newProjectName}
                  </div>
                  <div>
                    <span className="font-medium">Affected Project:</span> {consent.affectedProjectName}
                  </div>
                  <div>
                    <span className="font-medium">Applicant:</span> {consent.applicantName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {consent.applicantEmail}
                  </div>
                  <div>
                    <span className="font-medium">Overlap:</span> {consent.overlapPercentage.toFixed(2)}%
                  </div>
                  {consent.overlapArea && (
                    <div>
                      <span className="font-medium">Area:</span> {consent.overlapArea.toFixed(2)} m²
                    </div>
                  )}
                </div>

                {/* Consent Document */}
                {consent.consentFileUrl && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{consent.consentFileName || 'Consent Document'}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {consent.consentUploadedAt ? new Date(consent.consentUploadedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={consent.consentFileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </a>
                    </Button>
                  </div>
                )}

                {/* Rejection Remarks (if showing) */}
                {showRemarksFor === consent.id && (
                  <div className="space-y-2">
                    <Label htmlFor={`remarks-${consent.id}`}>Rejection Remarks</Label>
                    <Textarea
                      id={`remarks-${consent.id}`}
                      placeholder="Enter reason for rejection..."
                      value={rejectionRemarks[consent.id] || ''}
                      onChange={(e) =>
                        setRejectionRemarks(prev => ({
                          ...prev,
                          [consent.id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleVerify(consent.id, 'VERIFIED')}
                    disabled={verifyingId === consent.id}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Consent
                  </Button>
                  {showRemarksFor === consent.id ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVerify(consent.id, 'REJECTED')}
                        disabled={verifyingId === consent.id || !rejectionRemarks[consent.id]}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Confirm Rejection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowRemarksFor(null)
                          setRejectionRemarks(prev => {
                            const updated = { ...prev }
                            delete updated[consent.id]
                            return updated
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRemarksFor(consent.id)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Consent
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verified Consents Section */}
      {verifiedConsents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600">Verified Consents</h3>
          {verifiedConsents.map((consent) => (
            <Card key={consent.id} className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {consent.newApplicationNo} ↔ {consent.affectedApplicationNo}
                    </CardTitle>
                    <CardDescription>
                      Overlap: {consent.overlapPercentage.toFixed(2)}%
                    </CardDescription>
                  </div>
                  {getConsentStatusBadge(consent.consentStatus)}
                </div>
              </CardHeader>
              <CardContent>
                {consent.consentFileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={consent.consentFileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejected Consents Section */}
      {rejectedConsents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600">Rejected Consents</h3>
          {rejectedConsents.map((consent) => (
            <Card key={consent.id} className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {consent.newApplicationNo} ↔ {consent.affectedApplicationNo}
                    </CardTitle>
                    <CardDescription>
                      Overlap: {consent.overlapPercentage.toFixed(2)}%
                    </CardDescription>
                  </div>
                  {getConsentStatusBadge(consent.consentStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {consent.verificationRemarks && (
                  <Alert className="border-red-200 bg-red-100/50">
                    <AlertDescription className="text-sm">
                      <strong>Rejection Reason:</strong> {consent.verificationRemarks}
                    </AlertDescription>
                  </Alert>
                )}
                {consent.consentFileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={consent.consentFileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
