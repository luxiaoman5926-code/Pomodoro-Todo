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
    // 先设置监听器，确保不会错过任何状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // 处理不同的认证事件
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
          })
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            loading: false,
          })
        } else if (event === 'INITIAL_SESSION') {
          // 初始会话 - 可能是从 URL 中恢复的 session
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
          })
        }
      }
    )

    // 然后检查是否有现有会话
    const initializeAuth = async () => {
      try {
        // 首先检查 URL 中是否有 OAuth 回调参数
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          // URL 中有 token，让 Supabase 处理它
          console.log('Found access token in URL, processing...')
          // Supabase 会自动通过 onAuthStateChange 处理
          // 清理 URL 中的 hash
          window.history.replaceState(null, '', window.location.pathname)
          return
        }

        // 没有 URL token，检查现有 session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          setAuthState(prev => ({ ...prev, loading: false }))
          return
        }

        if (session) {
          console.log('Found existing session:', session.user?.email)
          setAuthState({
            user: session.user,
            session,
            loading: false,
          })
        } else {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('初始化认证失败:', error)
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeAuth()

    return () => {
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
    signOut,
  }
}
