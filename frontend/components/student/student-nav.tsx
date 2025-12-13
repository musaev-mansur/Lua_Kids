"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BookOpen, Trophy, LogOut, UserIcon } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { logout } from "@/lib/api/authSlice"
import { useLogoutMutation } from "@/lib/api/authSlice"

export function StudentNav() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [logoutMutation] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch(logout())
      router.push('/login')
    }
  }

  if (!user) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <Link href="/">
            <span>
              Lua<span className="text-primary">Tutor</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-foreground transition-colors hover:text-primary">
            Мой прогресс
          </Link>
          <Link href="/compiler" className="text-muted-foreground transition-colors hover:text-primary">
            Компилятор
          </Link>
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link href="/admin/submissions" className="text-muted-foreground transition-colors hover:text-primary">
              Проверка заданий
            </Link>
          )}
          {/* <Link href="/achievements" className="text-muted-foreground transition-colors hover:text-primary">
            Achievements
          </Link>
          <Link href="/community" className="text-muted-foreground transition-colors hover:text-primary">
            Community
          </Link> */}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-foreground">{user.xp} XP</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">Lvl {user.level}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">Ученик</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Профиль</span>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <Trophy className="mr-2 h-4 w-4" />
                <span>Achievements</span>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
