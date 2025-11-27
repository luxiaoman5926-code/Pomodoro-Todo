import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { AuthState } from '../types'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    let hasHandledOAuth = false

    const cleanupOAuthParams = () => {
      if (typeof window === 'undefined') return

      const url = new URL(window.location.href)
      const searchParams = url.searchParams
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
      const oauthQueryKeys = ['code', 'state', 'error', 'error_description']
      const oauthHashKeys = ['access_token', 'refresh_token', 'expires_in', 'token_type', 'provider_token', 'error', 'error_description']

      oauthQueryKeys.forEach(key => searchParams.delete(key))
      oauthHashKeys.forEach(key => hashParams.delete(key))

      const nextSearch = searchParams.toString()
      const nextHash = hashParams.toString()
      const cleanedUrl = `${url.origin}${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${nextHash ? `#${nextHash}` : ''}`

      window.history.replaceState({}, document.title, cleanedUrl)
    }

    const handleOAuthCallback = async () => {
      if (typeof window === 'undefined' || hasHandledOAuth) return

      const url = new URL(window.location.href)
      const searchParams = url.searchParams
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
      const errorDescription = searchParams.get('error_description') ?? hashParams.get('error_description')

      if (errorDescription) {
        hasHandledOAuth = true
        console.error('OAuth 回调错误:', errorDescription)
        cleanupOAuthParams()
        return
      }

      const code = searchParams.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (!code && !(accessToken && refreshToken)) {
        return
      }

      hasHandledOAuth = true
      console.log('检测到 OAuth 回调，正在处理...')

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        }
        console.log('OAuth 回调处理完成')
      } catch (err) {
        console.error('处理 OAuth 回调失败:', err)
        throw err
      } finally {
        cleanupOAuthParams()
      }
    }

    // 初始化认证状态
    const initAuth = async () => {
      try {
        const { error: initError } = await supabase.auth.initialize()
        if (initError) {
          console.error('初始化认证失败:', initError)
        }

        await handleOAuthCallback()

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('获取会话失败:', error)
        }

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
          })

          if (session) {
            console.log('已有登录会话:', session.user?.email)
          } else {
            console.log('未登录')
          }
        }
      } catch (err) {
        console.error('初始化认证流程失败:', err)
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth 事件:', event, session?.user?.email)

      if (mounted) {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    })

    initAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Google 登录
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Google 登录失败:', error)
      throw error
    }
  }, [])

  // GitHub 登录
  const signInWithGithub = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('GitHub 登录失败:', error)
      throw error
    }
  }, [])

  // 邮箱登录
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      console.error('邮箱登录失败:', error)
      throw error
    }
  }, [])

  // 邮箱注册
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      return data
    } catch (error) {
      console.error('邮箱注册失败:', error)
      throw error
    }
  }, [])

  // 登出
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }, [])

  return {
    ...authState,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
