import type { User, Session } from '@supabase/supabase-js'

export type Task = {
  id: string
  text: string
  completed: boolean
  created_at?: string
  user_id?: string
  pomodoros?: number // 已完成的番茄钟数量 (0-4)
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

// 番茄钟阶段类型
export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak'

// 番茄钟配置
export type PomodoroConfig = {
  focusDuration: number      // 专注时长（秒）
  shortBreakDuration: number // 短休息时长（秒）
  longBreakDuration: number  // 长休息时长（秒）
  cyclesBeforeLongBreak: number // 长休息前的番茄钟数量
}