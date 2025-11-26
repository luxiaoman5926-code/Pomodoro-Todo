import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PomodoroConfig, PomodoroPhase, UserSettings } from '../types'
import { supabase } from '../supabase'

// 默认配置：专注25分钟，短休息5分钟，长休息20分钟，每4个番茄钟后长休息
export const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25 * 60,        // 25分钟
  shortBreakDuration: 5 * 60,    // 5分钟
  longBreakDuration: 20 * 60,    // 20分钟
  cyclesBeforeLongBreak: 4,      // 4个番茄钟后长休息
}

// 阶段中文名称映射
export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: '专注阶段',
  shortBreak: '短休息',
  longBreak: '长休息',
}

// 阶段提示文字
export const PHASE_HINTS: Record<PomodoroPhase, { running: string; paused: string }> = {
  focus: { running: '沉浸中...', paused: '准备开始专注' },
  shortBreak: { running: '休息一下...', paused: '准备短休息' },
  longBreak: { running: '好好放松...', paused: '准备长休息' },
}

// clamp 将传入值限制在 0-1，避免进度条溢出
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max)

// formatTime 将秒数转换成 mm:ss 格式，方便直接展示在 UI 上
export const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}

type UsePomodoroOptions = {
  config?: PomodoroConfig
  /** 当专注阶段完成时调用的回调 */
  onFocusComplete?: () => void
  /** 用户ID（用于记录会话） */
  userId?: string | null
  /** 当前选中的任务ID（用于记录会话） */
  taskId?: string | null
  /** 用户设置（用于自动开始等逻辑） */
  settings?: UserSettings | null
}

/**
 * usePomodoro 负责管理番茄钟的倒计时、进度以及控制按钮的状态。
 * 支持专注、短休息、长休息三个阶段的自动循环。
 */
export const usePomodoro = (options: UsePomodoroOptions = {}) => {
  const { config = DEFAULT_CONFIG, onFocusComplete, userId, taskId, settings } = options
  
  // 1. Refs
  const configRef = useRef(config)
  const onFocusCompleteRef = useRef(onFocusComplete)
  const userIdRef = useRef(userId)
  const taskIdRef = useRef(taskId)
  const settingsRef = useRef(settings)
  const phaseStartTimeRef = useRef<number>(Date.now())
  const phaseStartSecondsRef = useRef<number>(configRef.current.focusDuration)

  // 2. Helper Functions (no state dependency, only refs)
  // 获取当前阶段的总时长
  const getCurrentPhaseDuration = useCallback((currentPhase: PomodoroPhase) => {
    switch (currentPhase) {
      case 'focus':
        return configRef.current.focusDuration
      case 'shortBreak':
        return configRef.current.shortBreakDuration
      case 'longBreak':
        return configRef.current.longBreakDuration
      default:
        return configRef.current.focusDuration
    }
  }, [])

  // 3. States
  // 当前阶段：专注 / 短休息 / 长休息
  const [phase, setPhase] = useState<PomodoroPhase>('focus')
  // 已完成的番茄钟数量（仅计算专注阶段完成的数量）
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  // 当前阶段剩余秒数
  const [secondsLeft, setSecondsLeft] = useState(configRef.current.focusDuration)
  // 是否正在运行
  const [isRunning, setIsRunning] = useState(false)
  // 是否刚完成一个阶段（用于触发提示）
  const [phaseJustCompleted, setPhaseJustCompleted] = useState(false)

  // 4. Effects
  // 更新 ref
  useEffect(() => {
    configRef.current = config
    onFocusCompleteRef.current = onFocusComplete
    userIdRef.current = userId
    taskIdRef.current = taskId
    settingsRef.current = settings
  }, [config, onFocusComplete, userId, taskId, settings])

  // 监听配置变化，更新当前剩余时间（如果未运行）
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft((prev) => {
        // 如果配置的时长变了，且当前剩余时间等于之前的时长（说明没开始），则更新
        // 或者简单点，直接更新，但这可能会重置暂停中的计时
        // 这里我们只在配置变化时更新
        const currentPhaseDuration = getCurrentPhaseDuration(phase)
        if (prev !== currentPhaseDuration && prev === phaseStartSecondsRef.current) {
           return currentPhaseDuration
        }
        return prev
      })
    }
  }, [config, isRunning, phase, getCurrentPhaseDuration]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 当前阶段总时长
  const currentPhaseDuration = useMemo(
    () => getCurrentPhaseDuration(phase),
    [phase, getCurrentPhaseDuration]
  )

  // 计时器逻辑
  useEffect(() => {
    if (!isRunning) return undefined

    const startTime = Date.now()
    const startSeconds = secondsLeft

    const tick = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const newSecondsLeft = startSeconds - elapsedSeconds

      setSecondsLeft((prev) => {
        // 如果已经在其他地方被修改为0（例如跳过），则保持0
        if (prev <= 0) return 0

        if (newSecondsLeft <= 0) {
          window.clearInterval(tick)
          setIsRunning(false)
          setPhaseJustCompleted(true)
          return 0
        }
        return newSecondsLeft
      })
    }, 100) // 使用更短的间隔检查，确保倒计时平滑，虽然实际更新还是基于秒

    return () => {
      window.clearInterval(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning])

  // 更新网页标题（显示倒计时）
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      const phaseName = phase === 'focus' ? '专注中' : phase === 'shortBreak' ? '短休息' : '长休息'
      document.title = `${formatTime(secondsLeft)} - ${phaseName} | 番茄钟`
    } else {
      // 恢复原始标题
      document.title = '番茄钟待办工作台'
    }

    // 清理函数：组件卸载时恢复标题
    return () => {
      document.title = '番茄钟待办工作台'
    }
  }, [isRunning, secondsLeft, phase])

  // 阶段完成后的处理
  useEffect(() => {
    if (!phaseJustCompleted) return

    // 播放提示音（如果浏览器支持）
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // 忽略自动播放限制错误
      })
    } catch {
      // 忽略音频错误
    }

    // 发送桌面通知（动态导入以避免 SSR 问题）
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const getNotificationMessage = () => {
        if (phase === 'focus') {
          return {
            title: '🎉 专注完成！',
            body: '休息一下吧，你已经完成了一个番茄钟',
          }
        } else if (phase === 'shortBreak') {
          return {
            title: '⏰ 短休息结束',
            body: '准备开始下一个专注阶段',
          }
        } else {
          return {
            title: '☀️ 长休息结束',
            body: '好好放松后，准备开始新的专注',
          }
        }
      }

      const message = getNotificationMessage()
      
      // 如果已有权限，直接发送；否则请求权限
      if (Notification.permission === 'granted') {
        new Notification(message.title, {
          body: message.body,
          icon: '/vite.svg',
          tag: 'pomodoro-complete',
          badge: '/vite.svg',
        }).onclick = () => window.focus()
      } else if (Notification.permission === 'default') {
        // 请求权限
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(message.title, {
              body: message.body,
              icon: '/vite.svg',
              tag: 'pomodoro-complete',
              badge: '/vite.svg',
            }).onclick = () => window.focus()
          }
        })
      }
    }

    // 记录会话到数据库
    const recordSession = async () => {
      if (!userIdRef.current) return

      // 计算实际专注时长（秒）
      // 使用开始时的秒数和当前剩余秒数的差值
      const actualDuration = Math.max(0, phaseStartSecondsRef.current - secondsLeft)
      const today = new Date().toISOString().split('T')[0]

      // 只记录有实际时长的会话（至少1秒）
      if (actualDuration < 1) return

      const { error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: userIdRef.current,
          task_id: taskIdRef.current || null,
          date: today,
          duration_seconds: actualDuration,
          phase: phase,
        })

      if (error) {
        console.error('Error recording pomodoro session:', error)
      }
    }

    // 根据当前阶段决定下一个阶段
    if (phase === 'focus') {
      // 记录专注会话
      recordSession()

      // 完成一个专注阶段，增加计数
      const newCompletedCount = completedPomodoros + 1
      setCompletedPomodoros(newCompletedCount)

      // 调用专注完成回调（用于更新任务的番茄数）
      if (onFocusCompleteRef.current) {
        onFocusCompleteRef.current()
      }

      // 检查是否需要长休息
      if (newCompletedCount % configRef.current.cyclesBeforeLongBreak === 0) {
        setPhase('longBreak')
        setSecondsLeft(configRef.current.longBreakDuration)
        phaseStartTimeRef.current = Date.now()
        phaseStartSecondsRef.current = configRef.current.longBreakDuration
      } else {
        setPhase('shortBreak')
        setSecondsLeft(configRef.current.shortBreakDuration)
        phaseStartTimeRef.current = Date.now()
        phaseStartSecondsRef.current = configRef.current.shortBreakDuration
      }

      // 自动开始休息
      if (settingsRef.current?.auto_start_break) {
        setIsRunning(true)
      }
    } else {
      // 记录休息会话
      recordSession()

      // 休息结束，回到专注阶段
      setPhase('focus')
      setSecondsLeft(configRef.current.focusDuration)
      phaseStartTimeRef.current = Date.now()
      phaseStartSecondsRef.current = configRef.current.focusDuration

      // 自动开始专注
      if (settingsRef.current?.auto_start_focus) {
        setIsRunning(true)
      }
    }

    setPhaseJustCompleted(false)
  }, [phaseJustCompleted, phase, completedPomodoros])

  // 切换运行/暂停
  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  // 重置当前阶段
  const reset = useCallback(() => {
    const duration = getCurrentPhaseDuration(phase)
    setSecondsLeft(duration)
    setIsRunning(false)
    phaseStartTimeRef.current = Date.now()
    phaseStartSecondsRef.current = duration
  }, [phase, getCurrentPhaseDuration])

  // 完全重置（回到初始状态）
  const fullReset = useCallback(() => {
    setPhase('focus')
    setCompletedPomodoros(0)
    setSecondsLeft(configRef.current.focusDuration)
    setIsRunning(false)
    setPhaseJustCompleted(false)
  }, [])

  // 跳过当前阶段
  const skip = useCallback(() => {
    setIsRunning(false)
    setPhaseJustCompleted(true)
  }, [])

  // 手动切换到指定阶段
  const switchPhase = useCallback((newPhase: PomodoroPhase) => {
    const duration = getCurrentPhaseDuration(newPhase)
    setPhase(newPhase)
    setSecondsLeft(duration)
    setIsRunning(false)
    phaseStartTimeRef.current = Date.now()
    phaseStartSecondsRef.current = duration
  }, [getCurrentPhaseDuration])

  // 当阶段或任务变化时，重置开始时间
  useEffect(() => {
    phaseStartTimeRef.current = Date.now()
    phaseStartSecondsRef.current = secondsLeft
  }, [phase, taskId])

  // 计算进度
  const progress = useMemo(() => {
    const elapsed = currentPhaseDuration - secondsLeft
    return clamp(elapsed / currentPhaseDuration)
  }, [secondsLeft, currentPhaseDuration])

  // 当前轮次（第几轮4个番茄钟）
  const currentRound = Math.floor(completedPomodoros / configRef.current.cyclesBeforeLongBreak) + 1

  // 当前轮次已完成的番茄钟数量
  const pomodorosInCurrentRound = completedPomodoros % configRef.current.cyclesBeforeLongBreak

  return {
    // 状态
    phase,
    phaseLabel: PHASE_LABELS[phase],
    phaseHint: PHASE_HINTS[phase][isRunning ? 'running' : 'paused'],
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    isRunning,
    progress,
    completedPomodoros,
    currentRound,
    pomodorosInCurrentRound,
    cyclesBeforeLongBreak: configRef.current.cyclesBeforeLongBreak,
    
    // 操作
    toggle,
    reset,
    fullReset,
    skip,
    switchPhase,
  }
}
