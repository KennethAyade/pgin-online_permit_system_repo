"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/application/status-badge"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApplicationTableProps {
  applications: any[]
}

export function AdminApplicationTable({ applications }: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No applications found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Application No.</TableHead>
                <TableHead className="font-semibold text-gray-700">Applicant</TableHead>
                <TableHead className="font-semibold text-gray-700">Permit Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Project Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Submitted</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {application.applicationNo}
                  </TableCell>
                  <TableCell className="text-gray-700">{application.user?.fullName || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {application.permitType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">{application.projectName || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {application.submittedAt
                      ? format(new Date(application.submittedAt), "MMM d, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/applications/${application.id}`}>
                      <Button variant="outline" size="sm" className="border-gray-300 hover:bg-blue-50 hover:border-blue-300">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
