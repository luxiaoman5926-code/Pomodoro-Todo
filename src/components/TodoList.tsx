import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Loader2 } from 'lucide-react'
import ThemedCard from './ThemedCard'
import type { Task } from '../types'
import { supabase } from '../supabase'

type TodoListProps = {
  userId: string
}

const TodoList = ({ userId }: TodoListProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
      } else if (data) {
        setTasks(data)
      }
      setIsLoading(false)
    }

    fetchTodos()

    // 订阅实时更新
    const channel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => {
              // 避免重复添加
              if (prev.some((t) => t.id === (payload.new as Task).id)) {
                return prev
              }
              return [payload.new as Task, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as Task).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  )

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextText = text.trim()
    if (!nextText || isAdding) return

    setIsAdding(true)
    const { data, error } = await supabase
      .from('todos')
      .insert([{ text: nextText, user_id: userId }])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
    } else if (data) {
      setTasks((prev) => [data[0], ...prev])
      setText('')
    }
    setIsAdding(false)
  }

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !currentCompleted } : task,
      ),
    )

    const { error } = await supabase
      .from('todos')
      .update({ completed: !currentCompleted })
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating todo:', error)
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: currentCompleted } : task,
        ),
      )
    }
  }

  const deleteTask = async (taskId: string) => {
    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting todo:', error)
      setTasks(previousTasks)
    }
  }

  return (
    <ThemedCard
      label="待办事项"
      title="专注目标"
      meta={`${completedCount}/${tasks.length || 0} 已完成`}
    >
      {/* 输入框 */}
      <form onSubmit={handleAddTask} className="group relative mb-6">
        <input
          className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-5 pr-24 text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-4 focus:ring-stone-100 dark:border-white/5 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/40 dark:focus:ring-white/10"
          placeholder="输入下一项任务..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !text.trim()}
          className="absolute bottom-2 right-2 top-2 flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-900 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          {isAdding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          添加
        </button>
      </form>

      {/* 列表 */}
      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-stone-400 dark:text-white/50" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400 dark:text-white/50">
            暂无任务，写下第一件想完成的事情吧。
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id, task.completed)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </div>
    </ThemedCard>
  )
}

type TaskItemProps = {
  task: Task
  onToggle: () => void
  onDelete: () => void
}

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => (
  <div
    className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${
      task.completed
        ? 'border-transparent bg-stone-50 opacity-60 hover:opacity-100 dark:bg-white/5'
        : 'cursor-pointer border-stone-100 bg-white hover:border-stone-300 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-white/30'
    }`}
  >
    <div
      className="flex flex-1 items-center gap-3"
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      role="button"
      tabIndex={0}
    >
      {task.completed ? (
        <CheckCircle2
          className="text-stone-900 dark:text-white"
          fill="transparent"
        />
      ) : (
        <Circle className="text-stone-300 transition-colors group-hover:text-stone-500 dark:text-white/40 dark:group-hover:text-white" />
      )}
      <span
        className={`font-medium transition ${
          task.completed
            ? 'text-stone-400 line-through decoration-stone-300 dark:text-white/40 dark:decoration-white/40'
            : 'text-stone-700 dark:text-white'
        }`}
      >
        {task.text}
      </span>
    </div>
    <button
      type="button"
      onClick={onDelete}
      className="text-stone-300 transition-colors hover:text-red-500 dark:text-white/50 dark:hover:text-white"
      aria-label="删除任务"
    >
      <Trash2 size={18} />
    </button>
  </div>
)

export default TodoList
