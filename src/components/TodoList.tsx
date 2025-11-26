import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CheckCircle,
  Circle,
  Plus,
  Trash,
  Spinner,
  Target,
  ClipboardText,
  Flag,
  Tag as TagIcon,
  Clock,
  X,
} from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'
import TomatoProgress from './TomatoProgress'
import type { Task, TaskPriority } from '../types'
import { supabase } from '../supabase'
import { usePomodoroContext } from '../hooks/usePomodoroContext'

type TodoListProps = {
  userId: string
}

const PRIORITY_MAP = {
  high: { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: '高' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: '中' },
  low: { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: '低' },
}

const TodoList = ({ userId }: TodoListProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // 新增状态
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newEstimated, setNewEstimated] = useState(1)
  const [newTag, setNewTag] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [showAddOptions, setShowAddOptions] = useState(false)

  const { selectedTask, setSelectedTask, registerTaskUpdater, registerAddTask } = usePomodoroContext()
  const inputRef = useRef<HTMLInputElement>(null)

  // 注册任务更新函数
  useEffect(() => {
    const updateTaskPomodoros = async (taskId: string, pomodoros: number) => {
      // 乐观更新本地状态
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, pomodoros } : task))
      )

      // 同步到数据库
      const { error } = await supabase
        .from('todos')
        .update({ pomodoros })
        .eq('id', taskId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating pomodoros:', error)
      }
    }

    registerTaskUpdater(updateTaskPomodoros)
  }, [userId, registerTaskUpdater])

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false) // 只获取未完成的任务

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
            const newTask = payload.new as Task
            if (!newTask.completed) {
              setTasks((prev) => {
                if (prev.some((t) => t.id === newTask.id)) return prev
                return [newTask, ...prev]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task
            if (updatedTask.completed) {
              setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id))
            } else {
              setTasks((prev) =>
                prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
              )
            }
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

  // 客户端排序：优先级 > 创建时间
  const sortedTasks = useMemo(() => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return [...tasks].sort((a, b) => {
      const pA = priorityOrder[a.priority || 'medium']
      const pB = priorityOrder[b.priority || 'medium']
      if (pA !== pB) return pB - pA
      return (
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    })
  }, [tasks])

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )

  const handleAddTag = () => {
    if (newTag.trim() && !newTags.includes(newTag.trim())) {
      setNewTags([...newTags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag))
  }

  const resetAddForm = () => {
    setText('')
    setNewPriority('medium')
    setNewEstimated(1)
    setNewTags([])
    setNewTag('')
    setShowAddOptions(false)
  }

  const handleAddTask = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const nextText = text.trim()
    if (!nextText || isAdding) return

    setIsAdding(true)
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          text: nextText,
          user_id: userId,
          pomodoros: 0,
          priority: newPriority,
          estimated_pomodoros: newEstimated,
          tags: newTags,
        },
      ])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
    } else if (data) {
      setTasks((prev) => [data[0], ...prev])
      resetAddForm()
    }
    setIsAdding(false)
  }

  // 注册添加任务函数供快捷键使用
  useEffect(() => {
    const addTaskHandler = () => {
      if (inputRef.current) {
        inputRef.current.focus()
        setShowAddOptions(true)
      }
    }
    registerAddTask(addTaskHandler)
  }, [registerAddTask])

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted

    if (newCompleted) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: false } : task
        )
      )
    }

    const updateData: { completed: boolean; completed_at?: string | null } = {
      completed: newCompleted,
    }

    if (newCompleted) {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating todo:', error)
      // 回滚...省略简单处理
    }
  }

  const deleteTask = async (taskId: string) => {
    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    if (selectedTask?.id === taskId) {
      setSelectedTask(null)
    }

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

  const handleSelectTask = (task: Task) => {
    if (task.completed) return
    if (selectedTask?.id === task.id) {
      setSelectedTask(null)
    } else {
      setSelectedTask(task)
    }
  }

  return (
    <ThemedCard
      label="待办事项"
      title="专注目标"
      meta={`${completedCount}/${tasks.length || 0} 已完成`}
    >
      {/* 当前专注任务提示 */}
      {selectedTask && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
          <Target size={16} weight="duotone" className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            正在专注: {selectedTask.text}
          </span>
        </div>
      )}

      {/* 输入框及选项 */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 p-2 transition-all focus-within:border-stone-300 focus-within:bg-white focus-within:shadow-sm dark:border-white/5 dark:bg-white/5 dark:focus-within:border-white/10 dark:focus-within:bg-white/10">
        <form onSubmit={handleAddTask}>
          <input
            ref={inputRef}
            className="w-full bg-transparent px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:outline-none dark:text-white dark:placeholder:text-white/40"
            placeholder="输入下一项任务..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onFocus={() => setShowAddOptions(true)}
            disabled={isAdding}
          />
          
          {/* 扩展选项 */}
          {showAddOptions && (
            <div className="mt-2 border-t border-stone-100 px-1 pt-2 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-3">
                {/* 优先级 */}
                <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1 dark:bg-white/5">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        newPriority === p
                          ? 'bg-white text-stone-900 shadow-sm dark:bg-white/20 dark:text-white'
                          : 'text-stone-400 hover:text-stone-600 dark:text-white/40 dark:hover:text-white/70'
                      }`}
                      title={PRIORITY_MAP[p].label}
                    >
                      <Flag size={14} weight={newPriority === p ? 'fill' : 'regular'} className={newPriority === p ? PRIORITY_MAP[p].color : ''} />
                    </button>
                  ))}
                </div>

                {/* 预估番茄 */}
                <div className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 dark:bg-white/5">
                  <Clock size={14} className="text-stone-400" />
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newEstimated}
                    onChange={(e) => setNewEstimated(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-8 bg-transparent text-center text-xs font-medium outline-none dark:text-white"
                  />
                </div>

                {/* 标签输入 */}
                <div className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 dark:bg-white/5">
                  <TagIcon size={14} className="text-stone-400" />
                  <input
                    className="w-16 bg-transparent text-xs outline-none dark:text-white placeholder:text-stone-400"
                    placeholder="标签"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    onBlur={handleAddTag}
                  />
                </div>

                <div className="flex-1" />

                <button
                  type="submit"
                  disabled={isAdding || !text.trim()}
                  className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  {isAdding ? <Spinner className="animate-spin" /> : <Plus weight="bold" />}
                  添加
                </button>
              </div>

              {/* 已选标签展示 */}
              {newTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {newTags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      #{tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-800">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* 列表 */}
      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 animate-spin text-stone-400 dark:text-white/50" weight="duotone" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-stone-300 dark:text-white/20">
            <ClipboardText size={48} weight="duotone" className="mb-4 opacity-50" />
            <p className="text-sm font-medium">暂无任务</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onToggle={() => toggleTask(task.id, task.completed)}
              onDelete={() => deleteTask(task.id)}
              onSelect={() => handleSelectTask(task)}
            />
          ))
        )}
      </div>
    </ThemedCard>
  )
}

type TaskItemProps = {
  task: Task
  isSelected: boolean
  onToggle: () => void
  onDelete: () => void
  onSelect: () => void
}

const TaskItem = ({ task, isSelected, onToggle, onDelete, onSelect }: TaskItemProps) => {
  const priorityKey = (task.priority && PRIORITY_MAP[task.priority]) ? task.priority : 'medium'
  const priorityStyle = PRIORITY_MAP[priorityKey]

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-2xl border-2 p-4 transition-all ${
        isSelected
          ? 'border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-900/20'
          : task.completed
          ? 'border-transparent bg-stone-50 opacity-60 hover:opacity-100 dark:bg-white/5'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/30'
      } ${isSelected ? '' : 'border-l-4 ' + (priorityStyle?.border?.replace('border', 'border-l') || 'border-l-stone-200')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <button
            onClick={onToggle}
            className={`mt-0.5 ${task.completed ? 'text-stone-900 dark:text-white' : 'text-stone-300 hover:text-stone-500 dark:text-white/40 dark:hover:text-white'}`}
          >
            {task.completed ? <CheckCircle weight="fill" size={24} /> : <Circle size={24} />}
          </button>
          
          <div className="flex-1">
            <p
              className={`font-medium transition ${
                task.completed
                  ? 'text-stone-400 line-through decoration-stone-300 dark:text-white/40 dark:decoration-white/40'
                  : 'text-stone-700 dark:text-white'
              }`}
            >
              {task.text}
            </p>
            
            {/* 标签和元数据 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {task.priority && task.priority !== 'medium' && priorityStyle && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold uppercase ${priorityStyle.color}`}>
                  <Flag weight="fill" />
                  {priorityStyle.label}
                </span>
              )}
              
              {task.tags?.map((tag) => (
                <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 dark:bg-white/10 dark:text-white/60">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1">
           {/* 选择按钮 */}
           {!task.completed && (
            <button
              onClick={onSelect}
              className={`rounded-lg p-1.5 transition-colors ${
                isSelected
                  ? 'bg-amber-200 text-amber-700 dark:bg-amber-600 dark:text-white'
                  : 'text-stone-300 hover:bg-stone-100 hover:text-amber-500 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-amber-400'
              }`}
              title={isSelected ? '取消选择' : '选择此任务专注'}
            >
              <Target size={18} weight="duotone" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-stone-300 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400"
          >
            <Trash size={18} weight="duotone" />
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-1 flex items-center justify-between border-t border-stone-100 pt-2 dark:border-white/5">
        <div className="flex items-center gap-2">
           <TomatoProgress count={task.pomodoros || 0} size={16} />
           <span className="text-xs text-stone-400 dark:text-white/40">
             / {task.estimated_pomodoros || 1} 预计
           </span>
        </div>
        {task.pomodoros && task.estimated_pomodoros && task.pomodoros >= task.estimated_pomodoros && (
           <span className="text-[10px] font-medium text-emerald-500">目标达成!</span>
        )}
      </div>
    </div>
  )
}

export default TodoList
