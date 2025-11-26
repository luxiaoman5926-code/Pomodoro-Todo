import { useState } from 'react'
import { Github, Loader2, Timer, CheckSquare } from 'lucide-react'

type LoginPageProps = {
  onGoogleSignIn: () => Promise<void>
  onGithubSignIn: () => Promise<void>
}

const LoginPage = ({ onGoogleSignIn, onGithubSignIn }: LoginPageProps) => {
  const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading('google')
    setError(null)
    try {
      await onGoogleSignIn()
    } catch (err) {
      setError('Google 登录失败，请重试')
    } finally {
      setIsLoading(null)
    }
  }

  const handleGithubSignIn = async () => {
    setIsLoading('github')
    setError(null)
    try {
      await onGithubSignIn()
    } catch (err) {
      setError('GitHub 登录失败，请重试')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 p-8 transition-colors duration-300 dark:bg-coal">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-300/20 blur-3xl dark:from-amber-500/10 dark:to-orange-500/5" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-300/20 blur-3xl dark:from-rose-500/10 dark:to-pink-500/5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & 标题 */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center justify-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
              <Timer className="size-7 text-white" />
            </div>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-teal-500/25">
              <CheckSquare className="size-7 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            番茄钟待办工作台
          </h1>
          <p className="text-sm text-stone-500 dark:text-white/50">
            专注工作，高效管理任务
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-3xl border border-stone-200/50 bg-white/80 p-8 shadow-xl shadow-stone-900/5 backdrop-blur-sm dark:border-white/5 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="mb-2 text-center text-xl font-bold text-stone-900 dark:text-white">
            欢迎回来
          </h2>
          <p className="mb-8 text-center text-sm text-stone-500 dark:text-white/50">
            选择一种方式登录您的账户
          </p>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* OAuth 按钮 */}
          <div className="space-y-4">
            {/* Google 登录 */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-4 font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              {isLoading === 'google' ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>使用 Google 登录</span>
            </button>

            {/* GitHub 登录 */}
            <button
              onClick={handleGithubSignIn}
              disabled={isLoading !== null}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 px-6 py-4 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-stone-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
            >
              {isLoading === 'github' ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Github className="size-5" />
              )}
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
            <span className="text-xs text-stone-400 dark:text-white/40">安全登录</span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
          </div>

          {/* 说明文字 */}
          <p className="text-center text-xs leading-relaxed text-stone-400 dark:text-white/40">
            登录即表示您同意我们的服务条款。
            <br />
            我们使用 OAuth 2.0 确保您的账户安全。
          </p>
        </div>

        {/* 底部文字 */}
        <p className="mt-8 text-center text-xs text-stone-400 dark:text-white/40">
          © 2025 番茄钟待办 · 专注成就卓越
        </p>
      </div>
    </div>
  )
}

export default LoginPage

