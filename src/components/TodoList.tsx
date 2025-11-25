import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import GlassPanel from './GlassPanel'
import type { Task } from '../types'

const STORAGE_KEY = 'spark-tool.tasks'

// safeParseTasks 防御性解析本地存储，忽略无效或被污染的数据
const safeParseTasks = (raw: string | null): Task[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.title === 'string' &&
        typeof entry.completed === 'boolean' &&
        typeof entry.id === 'string',
    )
  } catch {
    return []
  }
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return []
    return safeParseTasks(window.localStorage.getItem(STORAGE_KEY))
  })
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  )

  // handleAddTask 负责创建新任务并复位输入框
  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) return

    const newTask: Task = {
      id: window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}`,
      title: nextTitle,
      completed: false,
    }

    setTasks((prev) => [newTask, ...prev])
    setTitle('')
  }

  // toggleTask 用来切换任务完成状态
  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  // deleteTask 从列表中移除对应任务
  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  return (
    <GlassPanel
      label="待办事项"
      title="专注目标"
      meta={`${completedCount}/${tasks.length || 0} 已完成`}
      className="bg-gradient-to-b from-ash/50 to-ash/10"
    >
      <form
        onSubmit={handleAddTask}
        className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 sm:flex-row sm:items-center"
      >
        <input
          className="flex-1 rounded-xl border border-white/0 bg-transparent px-3 py-2 text-base text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          placeholder="输入下一项任务..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-graphite transition hover:bg-fog/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
        >
          <Plus className="size-4" />
          添加
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
            暂无任务，写下第一件想完成的事情吧。
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </GlassPanel>
  )
}

type TaskItemProps = {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
}

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => (
  <div className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/30">
    <button
      type="button"
      onClick={() => onToggle(task.id)}
      className="flex flex-1 items-center gap-3 text-left"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full border transition ${
          task.completed
            ? 'border-white bg-white text-graphite'
            : 'border-white/40 text-transparent'
        }`}
      >
        <Check className="size-3.5" />
      </span>
      <span
        className={`text-base text-white transition ${
          task.completed ? 'text-white/40 line-through' : ''
        }`}
      >
        {task.title}
      </span>
    </button>
    <button
      type="button"
      onClick={() => onDelete(task.id)}
      className="rounded-full border border-transparent p-2 text-white/50 transition hover:border-white/10 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
      aria-label="删除任务"
    >
      <Trash2 className="size-4" />
    </button>
  </div>
)

export default TodoList

