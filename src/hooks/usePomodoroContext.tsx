import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Task } from '../types'

type PomodoroContextType = {
  /** 当前选中的任务（正在专注的任务） */
  selectedTask: Task | null
  /** 设置当前选中的任务 */
  setSelectedTask: (task: Task | null) => void
  /** 当番茄钟完成时调用，增加选中任务的番茄数 */
  onPomodoroComplete: () => void
  /** 注册任务更新回调（供TodoList使用） */
  registerTaskUpdater: (updater: (taskId: string, pomodoros: number) => void) => void
}

const PomodoroContext = createContext<PomodoroContextType | null>(null)

type PomodoroProviderProps = {
  children: ReactNode
}

export const PomodoroProvider = ({ children }: PomodoroProviderProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskUpdater, setTaskUpdater] = useState<((taskId: string, pomodoros: number) => void) | null>(null)

  const registerTaskUpdater = useCallback((updater: (taskId: string, pomodoros: number) => void) => {
    setTaskUpdater(() => updater)
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

