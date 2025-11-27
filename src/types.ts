import type { User, Session } from '@supabase/supabase-js'

export type TaskPriority = 'low' | 'medium' | 'high'

export type Subtask = {
  id: string
  text: string
  completed: boolean
}

export type Task = {
  id: string
  text: string
  completed: boolean
  created_at?: string
  completed_at?: string | null
  user_id?: string
  pomodoros?: number // 已完成的番茄钟数量 (0-4)
  tags?: string[]
  priority?: TaskPriority
  estimated_pomodoros?: number // @deprecated use estimated_time
  estimated_time?: number // 预计时间（分钟）
  subtasks?: Subtask[]
  transfer_ids?: string[] // Linked transfer items
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

// 番茄钟会话记录
export type PomodoroSession = {
  id: string
  user_id: string
  task_id: string | null
  date: string // YYYY-MM-DD 格式
  duration_seconds: number
  phase: PomodoroPhase
  completed_at: string
  created_at: string
}

// 热力图数据点
export type HeatmapDataPoint = {
  date: string // YYYY-MM-DD
  count: number // 该天的专注时长（分钟）
  level: number // 0-4，用于颜色深浅
}

// 周/月报表数据
export type ReportData = {
  period: 'day' | 'week' | 'month'
  startDate: string
  endDate: string
  totalPomodoros: number // 完成的番茄钟数量
  totalMinutes: number // 总专注时长（分钟）
  averagePerDay: number // 平均每天专注时长
  peakHour: number // 效率最高的时段（0-23）
  peakHourCount: number // 该时段的专注次数
  dailyBreakdown: Array<{
    date: string
    pomodoros: number
    minutes: number
  }>
}

// 用户设置
export type UserSettings = {
  user_id: string
  focus_duration: number // 秒
  short_break_duration: number // 秒
  long_break_duration: number // 秒
  cycles_before_long_break: number
  auto_start_focus: boolean
  auto_start_break: boolean
  white_noise_type: string
  white_noise_volume: number
  notification_sound: string
  tag_color_mode: 'colorful' | 'monochrome'
  updated_at: string
}

// 传输内容类型
export type TransferType = 'text' | 'image' | 'video' | 'audio' | 'document'

// 传输项
export type TransferItem = {
  id: string
  user_id: string
  type: TransferType
  content: string
  url?: string // 文件的临时访问链接
  metadata: {
    name?: string
    size?: number
    mimeType?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  created_at: string
}
