"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"
import { useGetMeQuery } from "@/lib/api/authSlice"
import { 
  useGetSubmissionsQuery, 
  useApproveSubmissionMutation, 
  useRejectSubmissionMutation 
} from "@/lib/api/apiSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Code, 
  User, 
  BookOpen,
  Eye
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Submission } from "@/lib/types"

export default function SubmissionsPage() {
  const router = useRouter()
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [isClient, setIsClient] = useState(false)

  const { data: meData, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  })

  const { data: submissions, isLoading: submissionsLoading } = useGetSubmissionsQuery(
    { status: undefined },
    { skip: !isAuthenticated && !token }
  )

  const [approveSubmission, { isLoading: isApproving }] = useApproveSubmissionMutation()
  const [rejectSubmission, { isLoading: isRejecting }] = useRejectSubmissionMutation()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !meLoading) {
      if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'teacher')) {
        router.push('/')
      }
    }
  }, [isClient, isAuthenticated, user, meLoading, router])

  if (!isClient || meLoading || submissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'teacher')) {
    return null
  }

  const pendingSubmissions = submissions?.filter(s => s.status === 'pending') || []
  const approvedSubmissions = submissions?.filter(s => s.status === 'approved') || []
  const rejectedSubmissions = submissions?.filter(s => s.status === 'rejected') || []

  const handleApprove = async () => {
    if (!selectedSubmission) return
    
    try {
      await approveSubmission({
        id: selectedSubmission.id,
        adminComment: adminComment || undefined,
      }).unwrap()
      setSelectedSubmission(null)
      setAdminComment("")
    } catch (error) {
      console.error('Failed to approve submission:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedSubmission) return
    
    try {
      await rejectSubmission({
        id: selectedSubmission.id,
        adminComment: adminComment || undefined,
      }).unwrap()
      setSelectedSubmission(null)
      setAdminComment("")
    } catch (error) {
      console.error('Failed to reject submission:', error)
    }
  }

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Одобрено</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Отклонено</Badge>
    }
  }

  const SubmissionCard = ({ submission }: { submission: Submission }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSubmission(submission)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{submission.lessonTitle || 'Урок'}</CardTitle>
          {getStatusBadge(submission.status)}
        </div>
        <CardDescription>
          <div className="flex items-center gap-2 mt-2">
            <User className="h-4 w-4" />
            <span>{submission.studentUsername || `Ученик #${submission.student}`}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={submission.passedAutoCheck ? "default" : "secondary"}>
              {submission.passedAutoCheck ? "Автопроверка пройдена" : "Автопроверка не пройдена"}
            </Badge>
          </div>
          {submission.error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                Ошибка: {submission.error.substring(0, 100)}...
              </AlertDescription>
            </Alert>
          )}
          <div className="text-xs text-muted-foreground">
            Отправлено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Проверка заданий</h1>
          <p className="text-muted-foreground">
            Просматривайте и проверяйте задания, отправленные учениками
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Ожидают проверки ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Одобренные ({approvedSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Отклоненные ({rejectedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>Нет заданий, ожидающих проверки</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>Нет одобренных заданий</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>Нет отклоненных заданий</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog для просмотра и проверки задания */}
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedSubmission?.lessonTitle || 'Задание'}
              </DialogTitle>
              <DialogDescription>
                Ученик: {selectedSubmission?.studentUsername || `#${selectedSubmission?.student}`}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Код:
                  </h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{selectedSubmission?.code}</code>
                  </pre>
                </div>

                {selectedSubmission?.output && selectedSubmission.output.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Вывод:</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      {selectedSubmission.output.map((line, i) => (
                        <div key={i} className="text-sm font-mono">{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSubmission?.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Ошибка:</strong> {selectedSubmission.error}
                    </AlertDescription>
                  </Alert>
                )}

                {selectedSubmission?.adminComment && (
                  <div>
                    <h3 className="font-semibold mb-2">Комментарий админа:</h3>
                    <div className="bg-muted p-4 rounded-lg text-sm">
                      {selectedSubmission.adminComment}
                    </div>
                  </div>
                )}

                {selectedSubmission?.status === 'pending' && (
                  <div>
                    <h3 className="font-semibold mb-2">Ваш комментарий:</h3>
                    <Textarea
                      placeholder="Введите комментарий (необязательно)..."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex gap-2">
              {selectedSubmission?.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Одобрить
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

