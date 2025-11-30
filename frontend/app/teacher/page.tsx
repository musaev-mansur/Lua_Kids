"use client"

import type React from "react"

import { useState } from "react"
import { TeacherNav } from "@/components/teacher/teacher-nav"
import type { Lesson } from "@/lib/types"
import { useGetCourseLessonsQuery, useCreateLessonMutation, useUpdateLessonMutation, useDeleteLessonMutation } from "@/lib/api/apiSlice"

const COURSE_ID = "roblox-lua-101"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, GripVertical, Video, FileCode } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TeacherDashboard() {
  const { data: lessons = [], isLoading } = useGetCourseLessonsQuery(COURSE_ID)
  const [createLesson] = useCreateLessonMutation()
  const [updateLesson] = useUpdateLessonMutation()
  const [deleteLesson] = useDeleteLessonMutation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Simple form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const newLesson: Partial<Lesson> & { course: string } = {
      id: editingLesson ? editingLesson.id : `lesson-${lessons.length + 1}`,
      course: COURSE_ID,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      order: editingLesson ? editingLesson.order : lessons.length + 1,
      duration: Number.parseInt(formData.get("duration") as string) || 10,
      xpReward: Number.parseInt(formData.get("xp") as string) || 50,
      isLocked: false,
      content: formData.get("content") as string,
      videoUrl: formData.get("videoUrl") as string,
      challenge: {
        instructions: "Updated challenge instructions",
        initialCode: "-- Updated starter code",
      },
    }

    try {
    if (editingLesson) {
        await updateLesson({ ...newLesson, id: editingLesson.id }).unwrap()
    } else {
        await createLesson(newLesson).unwrap()
    }
    setIsDialogOpen(false)
    setEditingLesson(null)
    } catch (error) {
      console.error("Ошибка при сохранении урока:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await deleteLesson(id).unwrap()
      } catch (error) {
        console.error("Ошибка при удалении урока:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <TeacherNav />

      <main className="container py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
            <p className="text-muted-foreground">Managing: Roblox Lua Course</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open: boolean) => {
              setIsDialogOpen(open)
              if (!open) setEditingLesson(null)
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
                  <DialogDescription>
                    Create content for your students. They will see this immediately.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingLesson?.title}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={editingLesson?.description}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="videoUrl" className="text-right">
                      Video URL
                    </Label>
                    <Input
                      id="videoUrl"
                      name="videoUrl"
                      defaultValue={editingLesson?.videoUrl}
                      placeholder="https://youtube.com/..."
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      Duration (min)
                    </Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      defaultValue={editingLesson?.duration}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="content" className="text-right">
                      Content (MD)
                    </Label>
                    <Textarea
                      id="content"
                      name="content"
                      defaultValue={editingLesson?.content}
                      className="col-span-3 h-32"
                      placeholder="# Hello World..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Lesson</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lessons ({isLoading ? "..." : lessons.length})</CardTitle>
            <CardDescription>Drag to reorder lessons. Students must complete them in this order.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[80px]">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Загрузка...</TableCell>
                  </TableRow>
                ) : (
                  lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell className="font-medium">#{lesson.order}</TableCell>
                    <TableCell>
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-xs text-muted-foreground">{lesson.description}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {lesson.videoUrl && (
                          <Badge variant="secondary" className="gap-1">
                            <Video className="h-3 w-3" /> Video
                          </Badge>
                        )}
                        {lesson.challenge && (
                          <Badge variant="outline" className="gap-1">
                            <FileCode className="h-3 w-3" /> Code
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{lesson.duration} mins</TableCell>
                    <TableCell>
                      <Badge variant={lesson.isLocked ? "secondary" : "default"}>
                        {lesson.isLocked ? "Draft" : "Published"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingLesson(lesson)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
