import { Moon, Sun, Loader2 } from 'lucide-react'
import InstallPrompt from './components/InstallPrompt'
import LoginPage from './components/LoginPage'
import Timer from './components/Timer'
import TodoList from './components/TodoList'
import UserMenu from './components/UserMenu'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'

const App = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, loading, signInWithGoogle, signInWithGithub, signOut } = useAuth()

  // 加载中状态
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 dark:bg-coal">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-white/50">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录显示登录页
  if (!user) {
    return (
      <LoginPage
        onGoogleSignIn={signInWithGoogle}
        onGithubSignIn={signInWithGithub}
      />
    )
  }

  // 已登录显示主应用
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 p-8 text-stone-900 transition-colors duration-300 dark:bg-coal dark:text-fog">
      <div className="w-full max-w-5xl">
        {/* 顶部 Header */}
        <header className="mb-8 flex items-end justify-between px-2">
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-stone-500 dark:text-white/50">
              深度专注
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              番茄钟待办工作台
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-sm font-medium text-stone-400 dark:text-white/60 sm:block">
              25 分钟冲刺 · 5 分钟休息
            </p>
            <button
              onClick={toggleTheme}
              className="flex size-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm transition-transform hover:scale-105 active:scale-95 dark:bg-white/10 dark:text-white"
              aria-label="切换主题"
            >
              {theme === 'light' ? (
                <Moon className="size-5" />
              ) : (
                <Sun className="size-5" />
              )}
            </button>
            <UserMenu user={user} onSignOut={signOut} />
          </div>
        </header>

        {/* 主布局：双卡片 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Timer />
          <TodoList userId={user.id} />
        </div>
      </div>
      <InstallPrompt />
    </div>
  )
}

export default App
