import type { User, Session } from '@supabase/supabase-js'

export type Task = {
  id: string
  text: string
  completed: boolean
  created_at?: string
  user_id?: string
}

// Auth 相关类型
export type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
}

export type AuthContextType = AuthState & {
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
}
