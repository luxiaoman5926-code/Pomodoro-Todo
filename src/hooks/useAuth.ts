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
    // 获取当前会话
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      } catch (error) {
        console.error('获取会话失败:', error)
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }

    getSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    )

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

