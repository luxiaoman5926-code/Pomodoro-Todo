import { useEffect, useState, lazy, Suspense } from 'react'
import { Moon, Sun, Spinner, Timer as TimerIcon, ChartBar, PaperPlaneRight, Gear, ListChecks, Wrench } from '@phosphor-icons/react'
import InstallPrompt from './components/InstallPrompt'
import LoginPage from './components/LoginPage'
import Timer from './components/Timer'
import TodoList from './components/TodoList'
import UserMenu from './components/UserMenu'
import { useAuth } from './hooks/useAuth'
import { PomodoroProvider, usePomodoroContext } from './hooks/usePomodoroContext'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

// 懒加载非首屏组件
const Statistics = lazy(() => import('./components/Statistics'))
const Transfer = lazy(() => import('./components/Transfer'))
const Settings = lazy(() => import('./components/Settings'))
const TodoFullPage = lazy(() => import('./components/TodoFullPage'))
const ToolsPage = lazy(() => import('./components/ToolsPage'))

const App = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, loading, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'timer' | 'statistics' | 'transfer' | 'settings' | 'tasks' | 'tools'>('timer')

  // 加载中状态
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 dark:bg-coal">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={40} weight="duotone" className="animate-spin text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-mist">加载中...</p>
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
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
      />
    )
  }

  // 已登录显示主应用
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 p-4 sm:p-8 md:p-12 text-stone-900 transition-colors duration-300 dark:bg-coal dark:text-fog">
      <div className="w-full max-w-7xl">
        {/* 顶部 Header */}
        <header className="mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between px-4 gap-6">
          <div>
            <p className="mb-2 text-sm font-bold tracking-widest text-stone-500 dark:text-stone-500 uppercase">
              Deep Focus
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-white">
              番茄钟工作台
            </h1>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-auto">
            <p className="hidden text-base font-medium text-stone-400 dark:text-mist lg:block">
              保持专注 · 高效产出
            </p>
            <div className="flex items-center gap-3">
                <button
                onClick={toggleTheme}
                className="flex size-12 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm transition-transform hover:scale-105 active:scale-95 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
                aria-label="切换主题"
                >
                {theme === 'light' ? (
                    <Moon size={22} weight="duotone" />
                ) : (
                    <Sun size={22} weight="duotone" />
                )}
                </button>
                <UserMenu user={user} onSignOut={signOut} />
            </div>
          </div>
        </header>

        {/* 导航标签 */}
        <nav className="mb-8 flex gap-3 overflow-x-auto px-2 pb-2 sm:pb-0">
          <TabButton
            active={activeTab === 'timer'}
            onClick={() => setActiveTab('timer')}
            icon={TimerIcon}
            label="专注"
          />
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon={ListChecks}
            label="任务"
          />
          <TabButton
            active={activeTab === 'transfer'}
            onClick={() => setActiveTab('transfer')}
            icon={PaperPlaneRight}
            label="传输"
          />
          <TabButton
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
            icon={ChartBar}
            label="统计"
          />
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={Gear}
            label="设置"
          />
          <TabButton
            active={activeTab === 'tools'}
            onClick={() => setActiveTab('tools')}
            icon={Wrench}
            label="工具"
          />
        </nav>

        {/* 主布局 */}
        <PomodoroProvider>
          <PomodoroProviderContent userId={user.id} activeTab={activeTab} onNavigate={setActiveTab} />
        </PomodoroProvider>
      </div>
      <InstallPrompt />
    </div>
  )
}

// 标签按钮组件
type TabButtonProps = {
  active: boolean
  onClick: () => void
  icon: typeof TimerIcon
  label: string
}

const TabButton = ({ active, onClick, icon: Icon, label }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all ${
      active
        ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10 dark:bg-white dark:text-coal'
        : 'bg-white text-stone-600 hover:bg-stone-100 dark:bg-graphite dark:text-mist dark:hover:bg-ash'
    }`}
  >
    <Icon size={20} weight={active ? 'fill' : 'regular'} />
    {label}
  </button>
)

// PomodoroProvider 内容组件
type PomodoroProviderContentProps = {
  userId: string
  activeTab: 'timer' | 'statistics' | 'transfer' | 'settings' | 'tasks' | 'tools'
  onNavigate: (tab: 'timer' | 'statistics' | 'transfer' | 'settings' | 'tasks' | 'tools') => void
}

const PomodoroProviderContent = ({ userId, activeTab, onNavigate }: PomodoroProviderContentProps) => {
  const { setUserId, toggleTimer, addTask } = usePomodoroContext()

  // 设置用户ID
  useEffect(() => {
    setUserId(userId)
  }, [userId, setUserId])

  // 设置键盘快捷键
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: ' ',
        callback: () => {
          if (activeTab === 'timer' && toggleTimer) {
            toggleTimer()
          }
        },
        description: '暂停/开始番茄钟',
      },
      {
        key: 'n',
        altKey: true,
        callback: () => {
          if (activeTab === 'timer' && addTask) {
            addTask()
          }
        },
        description: '新建任务',
      },
    ],
    enabled: activeTab === 'timer',
  })

  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-20">
      <Spinner className="animate-spin text-stone-400 dark:text-mist" size={32} />
    </div>
  )

  if (activeTab === 'tasks') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <TodoFullPage userId={userId} onBack={() => onNavigate('timer')} />
      </Suspense>
    )
  }

  if (activeTab === 'statistics') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Statistics userId={userId} />
      </Suspense>
    )
  }

  if (activeTab === 'transfer') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Transfer userId={userId} />
      </Suspense>
    )
  }

  if (activeTab === 'settings') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Settings />
      </Suspense>
    )
  }

  if (activeTab === 'tools') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ToolsPage />
      </Suspense>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Timer />
      <TodoList userId={userId} onExpand={() => onNavigate('tasks')} />
    </div>
  )
}

export default App
