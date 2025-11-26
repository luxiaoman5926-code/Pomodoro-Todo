import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PomodoroConfig, PomodoroPhase } from '../types'

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
}

/**
 * usePomodoro 负责管理番茄钟的倒计时、进度以及控制按钮的状态。
 * 支持专注、短休息、长休息三个阶段的自动循环。
 */
export const usePomodoro = (options: UsePomodoroOptions = {}) => {
  const { config = DEFAULT_CONFIG, onFocusComplete } = options
  const configRef = useRef(config)
  const onFocusCompleteRef = useRef(onFocusComplete)
  
  // 更新 ref
  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete
  }, [onFocusComplete])
  
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

  // 当前阶段总时长
  const currentPhaseDuration = useMemo(
    () => getCurrentPhaseDuration(phase),
    [phase, getCurrentPhaseDuration]
  )

  // 计时器逻辑
  useEffect(() => {
    if (!isRunning) return undefined

    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick)
          setIsRunning(false)
          setPhaseJustCompleted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(tick)
    }
  }, [isRunning])

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

    // 根据当前阶段决定下一个阶段
    if (phase === 'focus') {
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
      } else {
        setPhase('shortBreak')
        setSecondsLeft(configRef.current.shortBreakDuration)
      }
    } else {
      // 休息结束，回到专注阶段
      setPhase('focus')
      setSecondsLeft(configRef.current.focusDuration)
    }

    setPhaseJustCompleted(false)
  }, [phaseJustCompleted, phase, completedPomodoros])

  // 切换运行/暂停
  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  // 重置当前阶段
  const reset = useCallback(() => {
    setSecondsLeft(getCurrentPhaseDuration(phase))
    setIsRunning(false)
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
    setPhase(newPhase)
    setSecondsLeft(getCurrentPhaseDuration(newPhase))
    setIsRunning(false)
  }, [getCurrentPhaseDuration])

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
