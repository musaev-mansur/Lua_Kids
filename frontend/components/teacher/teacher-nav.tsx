"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Settings, LogOut } from "lucide-react"

export function TeacherNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-zinc-950 text-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <Settings className="h-5 w-5" />
          </div>
          <span>
            Roblox<span className="text-orange-500">Academy</span>{" "}
            <span className="text-xs font-normal opacity-70 border px-1 rounded ml-1">TEACHER</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/teacher" className="text-white transition-colors hover:text-orange-400">
            Manage Courses
          </Link>
          <Link href="/teacher/students" className="text-zinc-400 transition-colors hover:text-orange-400">
            Students
          </Link>
          <Link href="/teacher/files" className="text-zinc-400 transition-colors hover:text-orange-400">
            Files & Videos
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              View as Student
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-orange-500">
                  <AvatarImage src="/placeholder.svg" alt="Teacher" />
                  <AvatarFallback>TC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mr. Anderson</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Students</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
