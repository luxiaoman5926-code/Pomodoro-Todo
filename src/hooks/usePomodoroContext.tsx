import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useSettings } from './useSettings'
import type { Task, UserSettings } from '../types'

type PomodoroContextType = {
  /** 当前选中的任务（正在专注的任务） */
  selectedTask: Task | null
  /** 设置当前选中的任务 */
  setSelectedTask: (task: Task | null) => void
  /** 当番茄钟完成时调用，增加选中任务的番茄数 */
  onPomodoroComplete: () => void
  /** 注册任务更新回调（供TodoList使用） */
  registerTaskUpdater: (updater: (taskId: string, pomodoros: number) => void) => void
  /** 用户ID（用于记录会话） */
  userId: string | null
  /** 设置用户ID */
  setUserId: (userId: string | null) => void
  /** 注册番茄钟控制函数（供快捷键使用） */
  registerTimerControls: (controls: { toggle: () => void }) => void
  /** 注册任务添加函数（供快捷键使用） */
  registerAddTask: (addTask: () => void) => void
  /** 切换番茄钟（供快捷键使用） */
  toggleTimer: () => void
  /** 添加任务（供快捷键使用） */
  addTask: () => void
  /** 用户设置 */
  settings: UserSettings | null
  /** 更新设置 */
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
}

const PomodoroContext = createContext<PomodoroContextType | null>(null)

type PomodoroProviderProps = {
  children: ReactNode
}

export const PomodoroProvider = ({ children }: PomodoroProviderProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskUpdater, setTaskUpdater] = useState<((taskId: string, pomodoros: number) => void) | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { currentSettings: settings, updateSettings } = useSettings(userId)
  const [timerControls, setTimerControls] = useState<{ toggle: () => void } | null>(null)
  const [addTaskFn, setAddTaskFn] = useState<(() => void) | null>(null)

  const registerTaskUpdater = useCallback((updater: (taskId: string, pomodoros: number) => void) => {
    setTaskUpdater(() => updater)
  }, [])

  const registerTimerControls = useCallback((controls: { toggle: () => void }) => {
    setTimerControls(() => controls)
  }, [])

  const registerAddTask = useCallback((addTask: () => void) => {
    setAddTaskFn(() => addTask)
  }, [])

  const onPomodoroComplete = useCallback(() => {
    if (selectedTask && taskUpdater) {
      const newPomodoros = Math.min((selectedTask.pomodoros || 0) + 1, 4)
      taskUpdater(selectedTask.id, newPomodoros)
      // 更新本地选中任务的状态
      setSelectedTask(prev => prev ? { ...prev, pomodoros: newPomodoros } : null)
    }
  }, [selectedTask, taskUpdater])

  return (
    <PomodoroContext.Provider
      value={{
        selectedTask,
        setSelectedTask,
        onPomodoroComplete,
        registerTaskUpdater,
        userId,
        setUserId,
        registerTimerControls,
        registerAddTask,
        // 暴露控制函数供快捷键使用
        toggleTimer: () => timerControls?.toggle(),
        addTask: () => addTaskFn?.(),
        settings,
        updateSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext)
  if (!context) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider')
  }
  return context
}

