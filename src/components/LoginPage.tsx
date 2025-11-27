import { useState } from 'react'
import { GithubLogo, Spinner, Timer, Envelope, Lock, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react'

type LoginPageProps = {
  onGoogleSignIn: () => Promise<void>
  onGithubSignIn: () => Promise<void>
  onEmailSignIn: (email: string, password: string) => Promise<void>
  onEmailSignUp: (email: string, password: string) => Promise<any>
}

const LoginPage = ({ onGoogleSignIn, onGithubSignIn, onEmailSignIn, onEmailSignUp }: LoginPageProps) => {
  const [isLoading, setIsLoading] = useState<'google' | 'github' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('请输入邮箱和密码')
      return
    }

    setIsLoading('email')
    setError(null)

    try {
      if (isSignUp) {
        const data = await onEmailSignUp(formData.email, formData.password)
        if (data?.user && !data?.session) {
          setVerificationSent(true)
          setFormData({ email: '', password: '' })
        }
      } else {
        await onEmailSignIn(formData.email, formData.password)
      }
    } catch (err: any) {
      console.error(err)
      if (err.message === 'User already registered') {
        setError('该邮箱已被注册，请直接登录')
      } else if (err.message === 'Invalid login credentials') {
        setError('邮箱或密码错误')
      } else {
        setError(err.message || (isSignUp ? '注册失败，请重试' : '登录失败，请重试'))
      }
    } finally {
      setIsLoading(null)
    }
  }

  if (verificationSent) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 p-8 transition-colors duration-300 dark:bg-coal">
        <div className="w-full max-w-md rounded-3xl border border-stone-200/50 bg-white/80 p-8 text-center shadow-xl shadow-stone-900/5 backdrop-blur-sm dark:border-white/5 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
              <Envelope size={32} weight="duotone" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-stone-900 dark:text-white">验证邮件已发送</h2>
          <p className="mb-8 text-sm text-stone-500 dark:text-white/50">
            我们已向您的邮箱发送了一封验证邮件，请查收并点击链接完成注册。
          </p>
          <button
            onClick={() => setVerificationSent(false)}
            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            返回登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 p-8 transition-colors duration-300 dark:bg-coal">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gradient-to-br from-red-200/40 to-rose-300/30 blur-3xl dark:from-red-500/15 dark:to-rose-500/10" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-gradient-to-br from-rose-200/40 to-red-300/30 blur-3xl dark:from-rose-500/15 dark:to-red-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & 标题 */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/30">
              <Timer weight="duotone" className="size-8 text-white" />
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
            {isSignUp ? '创建新账户' : '欢迎回来'}
          </h2>
          <p className="mb-8 text-center text-sm text-stone-500 dark:text-white/50">
            {isSignUp ? '输入您的详细信息以开始使用' : '选择一种方式登录您的账户'}
          </p>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 邮箱表单 */}
          <form onSubmit={handleEmailAuth} className="mb-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400 dark:text-white/30">
                <Envelope size={20} />
              </div>
              <input
                type="email"
                placeholder="电子邮箱"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-red-500"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400 dark:text-white/30">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="密码"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 dark:text-white/30 dark:hover:text-white/50"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-3 font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading === 'email' ? (
                <Spinner className="size-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? '注册账户' : '登录'}
                  <ArrowRight weight="bold" />
                </>
              )}
            </button>
          </form>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-white/10" />
            </div>
            <span className="relative bg-white px-2 text-xs text-stone-400 dark:bg-[#2C2C2C] dark:text-white/40">
              或者使用第三方账号
            </span>
          </div>

          {/* OAuth 按钮 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Google 登录 */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {isLoading === 'google' ? (
                <Spinner className="size-5 animate-spin" />
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
              <span>Google</span>
            </button>

            {/* GitHub 登录 */}
            <button
              onClick={handleGithubSignIn}
              disabled={isLoading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {isLoading === 'github' ? (
                <Spinner className="size-5 animate-spin" />
              ) : (
                <GithubLogo className="size-5" weight="fill" />
              )}
              <span>GitHub</span>
            </button>
          </div>

          {/* 切换模式 */}
          <p className="mt-8 text-center text-sm text-stone-500 dark:text-white/50">
            {isSignUp ? '已有账号？' : '还没有账号？'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setFormData({ email: '', password: '' })
              }}
              className="ml-2 font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              {isSignUp ? '立即登录' : '免费注册'}
            </button>
          </p>

          {/* 说明文字 */}
          <p className="mt-8 text-center text-xs leading-relaxed text-stone-400 dark:text-white/40">
            登录即表示您同意我们的服务条款。
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
