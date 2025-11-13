"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { CheckCircle2, Circle } from "lucide-react"

interface StatusTimelineProps {
  statusHistory: any[]
}

export function StatusTimeline({ statusHistory }: StatusTimelineProps) {
  if (statusHistory.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 text-center text-gray-500">
          No status history available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Status History</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {statusHistory.map((history, index) => (
            <div key={history.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-blue-700" />
                </div>
                {index < statusHistory.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2 min-h-[40px]" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{history.toStatus.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Changed by {history.changedByRole}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(history.createdAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  {history.remarks && (
                    <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded border border-gray-200">
                      {history.remarks}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
