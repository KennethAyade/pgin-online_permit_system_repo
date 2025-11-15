"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShieldCheck, Mail, Building2, Loader2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

interface AdminUserRow {
  id: string
  email: string
  fullName: string
  position: string | null
  department: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

interface ApplicantRow {
  id: string
  email: string
  fullName: string
  companyName: string | null
  address: string | null
  emailVerified: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [admins, setAdmins] = useState<AdminUserRow[]>([])
  const [applicants, setApplicants] = useState<ApplicantRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const [adminToDelete, setAdminToDelete] = useState<AdminUserRow | null>(null)
  const [applicantToDelete, setApplicantToDelete] = useState<ApplicantRow | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to load users")
        return
      }

      setAdmins(result.admins || [])
      setApplicants(result.applicants || [])
    } catch (err) {
      setError("An unexpected error occurred while loading users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleAdminActive = async (admin: AdminUserRow) => {
    try {
      setUpdatingId(admin.id)
      setError(null)
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: admin.id, isActive: !admin.isActive }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to update admin user")
        return
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: result.admin.isActive } : a)),
      )
    } catch (err) {
      setError("An unexpected error occurred while updating the admin user.")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    await fetchUsers()
  }

  const performDeleteAdmin = async (admin: AdminUserRow) => {
    try {
      setDeletingId(admin.id)
      setError(null)
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, type: "admin" }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to delete administrator")
        return
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
    } catch (err) {
      setError("An unexpected error occurred while deleting the administrator.")
    } finally {
      setDeletingId(null)
    }
  }

  const performDeleteApplicant = async (user: ApplicantRow) => {
    try {
      setDeletingId(user.id)
      setError(null)
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, type: "applicant" }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to delete applicant")
        return
      }

      setApplicants((prev) => prev.filter((a) => a.id !== user.id))
    } catch (err) {
      setError("An unexpected error occurred while deleting the applicant.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Users</h1>
            <p className="text-blue-100">
              Manage administrator and applicant accounts
            </p>
          </div>
        </div>
      </div>

      {/* Search + Tabs */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">
              User management
            </CardTitle>
            <p className="mt-1 text-sm text-gray-600">
              View administrators and applicants. Admin status can be enabled or disabled here.
            </p>
          </div>
          <form onSubmit={handleSearch} className="w-full md:w-80">
            <Input
              placeholder="Search by name, email, or organization..."
              className="bg-white border-gray-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
            </div>
          ) : (
            <Tabs defaultValue="admins" className="mt-2">
              <TabsList>
                <TabsTrigger value="admins">Administrators</TabsTrigger>
                <TabsTrigger value="applicants">Applicants</TabsTrigger>
              </TabsList>

              <TabsContent value="admins" className="mt-4">
                {admins.length === 0 ? (
                  <p className="py-6 text-sm text-gray-500">No administrators found.</p>
                ) : (
                  <div className="rounded-md border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700">Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700">Role</TableHead>
                          <TableHead className="font-semibold text-gray-700">Department</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Last login</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id} className="hover:bg-gray-50">
                            <TableCell className="flex items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                {admin.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {admin.fullName}
                                </span>
                                {admin.position && (
                                  <span className="text-xs text-gray-500">{admin.position}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                <span>{admin.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                                {admin.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              {admin.department || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  admin.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                }
                                variant="outline"
                              >
                                {admin.isActive ? "Active" : "Disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {admin.lastLoginAt
                                ? format(new Date(admin.lastLoginAt), "MMM d, yyyy HH:mm")
                                : "Never"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingId === admin.id}
                                  className={
                                    admin.isActive
                                      ? "border-red-200 text-red-700 hover:bg-red-50"
                                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  }
                                  onClick={() => handleToggleAdminActive(admin)}
                                >
                                  {updatingId === admin.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  {admin.isActive ? "Disable" : "Enable"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingId === admin.id}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => setAdminToDelete(admin)}
                                >
                                  {deletingId === admin.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applicants" className="mt-4">
                {applicants.length === 0 ? (
                  <p className="py-6 text-sm text-gray-500">No applicants found.</p>
                ) : (
                  <div className="rounded-md border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700">Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700">Organization</TableHead>
                          <TableHead className="font-semibold text-gray-700">Address</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Registered</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applicants.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                <span>{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                <span>{user.companyName || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                              {user.address || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  user.emailVerified
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }
                              >
                                {user.emailVerified ? "Verified" : "Pending verification"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {user.createdAt
                                ? format(new Date(user.createdAt), "MMM d, yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === user.id}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => setApplicantToDelete(user)}
                              >
                                {deletingId === user.id ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                )}
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Delete admin confirmation */}
      <Dialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete administrator</DialogTitle>
            <DialogDescription>
              {adminToDelete && (
                <span>
                  Are you sure you want to permanently delete administrator
                  {" "}
                  <span className="font-semibold">{adminToDelete.fullName}</span>? This
                  action cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminToDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!adminToDelete) return
                setDeletingId(adminToDelete.id)
                await performDeleteAdmin(adminToDelete)
                setAdminToDelete(null)
              }}
              disabled={!!deletingId}
            >
              {deletingId && adminToDelete && deletingId === adminToDelete.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete applicant confirmation */}
      <Dialog open={!!applicantToDelete} onOpenChange={(open) => !open && setApplicantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete applicant</DialogTitle>
            <DialogDescription>
              {applicantToDelete && (
                <span>
                  Are you sure you want to permanently delete applicant
                  {" "}
                  <span className="font-semibold">{applicantToDelete.fullName}</span> and all
                  of their applications? This action cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplicantToDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!applicantToDelete) return
                setDeletingId(applicantToDelete.id)
                await performDeleteApplicant(applicantToDelete)
                setApplicantToDelete(null)
              }}
              disabled={!!deletingId}
            >
              {deletingId && applicantToDelete && deletingId === applicantToDelete.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
