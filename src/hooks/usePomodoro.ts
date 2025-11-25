import { useEffect, useMemo, useRef, useState } from 'react'

export const DEFAULT_FOCUS_DURATION = 25 * 60

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

/**
 * usePomodoro 负责管理番茄钟的倒计时、进度以及控制按钮的状态。
 */
export const usePomodoro = (durationInSeconds = DEFAULT_FOCUS_DURATION) => {
  const durationRef = useRef(durationInSeconds)
  const [secondsLeft, setSecondsLeft] = useState(durationRef.current)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return undefined

    // 仅在运行状态时创建 interval，离开时自动清理
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick)
          setIsRunning(false)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(tick)
    }
  }, [isRunning])

  const toggle = () => {
    setIsRunning((prev) => !prev)
  }

  const reset = () => {
    setSecondsLeft(durationRef.current)
    setIsRunning(false)
  }

  const progress = useMemo(() => {
    const elapsed = durationRef.current - secondsLeft
    return clamp(elapsed / durationRef.current)
  }, [secondsLeft])

  return {
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    isRunning,
    progress,
    toggle,
    reset,
  }
}

