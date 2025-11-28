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
  CaretDown,
  CaretRight,
  Funnel,
  ListChecks,
  ClockCounterClockwise,
  FloppyDisk,
  XCircle,
  Paperclip,
  Link as LinkIcon,
  File as FileIcon,
  PencilSimple,
  Check,
  ArrowsOutSimple,
  FolderSimple,
} from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'
import TomatoProgress from './TomatoProgress'
import type { Task, TaskPriority, Subtask, TransferItem, Project } from '../types'
import { supabase } from '../supabase'
import { usePomodoroContext } from '../hooks/usePomodoroContext'
import { useTransfers } from '../hooks/useTransfers'

type TodoListProps = {
  userId: string
  onExpand?: () => void
}

const PRIORITY_MAP = {
  high: { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: '高' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: '中' },
  low: { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: '低' },
}

// Tag colors palette
const TAG_COLORS = [
  { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-300' },
  { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-300' },
  { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-300' },
  { bg: 'bg-lime-100 dark:bg-lime-500/20', text: 'text-lime-600 dark:text-lime-300' },
  { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-300' },
  { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-300' },
  { bg: 'bg-sky-100 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-300' },
  { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-300' },
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-300' },
  { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-300' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', text: 'text-fuchsia-600 dark:text-fuchsia-300' },
  { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-300' },
]

// Helper to get color from string
const getTagColor = (tag: string) => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index]
}

const TodoList = ({ userId, onExpand }: TodoListProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // 视图状态
  const [activeTab, setActiveTab] = useState<'todo' | 'history'>('todo')

  // 新增状态
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newEstimatedTime, setNewEstimatedTime] = useState<number | string>(25) // 默认25分钟
  const [newTag, setNewTag] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [newLinkIds, setNewLinkIds] = useState<string[]>([])
  const [newDueDate, setNewDueDate] = useState('') // 截止日期
  const [newProjectId, setNewProjectId] = useState<string | null>(null) // 项目ID
  const [showAddOptions, setShowAddOptions] = useState(false)
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showLinkSelector, setShowLinkSelector] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6')
  
  // 项目状态
  const [projects, setProjects] = useState<Project[]>([])
  
  // 筛选状态
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const { selectedTask, setSelectedTask, registerTaskUpdater, registerAddTask, settings } = usePomodoroContext()
  const { items: transferItems, refresh: refreshTransfers } = useTransfers(userId)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

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
      // 获取所有任务，包括已完成的
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) // 默认按创建时间倒序

      if (error) {
        console.error('Error fetching todos:', error)
      } else if (data) {
        setTasks(data)
      }
      setIsLoading(false)
    }

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
      } else if (data) {
        setProjects(data)
      }
    }

    fetchTodos()
    fetchProjects()
    refreshTransfers() // 获取传输文件以供链接

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
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev
              return [newTask, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
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
  }, [userId, refreshTransfers])

  // 获取所有唯一的标签（仅从未完成任务中获取，或者从所有任务中获取？通常从待办中获取比较有用）
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    // 仅从待办任务中收集标签，避免已完成的历史标签干扰筛选
    tasks.filter(t => !t.completed).forEach(task => {
      task.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [tasks])

  // 分离待办和已完成任务
  const todoTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])
  const historyTasks = useMemo(() => tasks.filter(t => t.completed), [tasks])

  // 客户端排序与筛选（针对待办任务）
  const sortedAndFilteredTasks = useMemo(() => {
    let result = [...todoTasks]
    
    // 筛选
    if (filterTag) {
      result = result.filter(t => t.tags?.includes(filterTag))
    }

    // 排序：优先级 > 创建时间
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return result.sort((a, b) => {
      const pA = priorityOrder[a.priority || 'medium']
      const pB = priorityOrder[b.priority || 'medium']
      if (pA !== pB) return pB - pA
      return (
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    })
  }, [todoTasks, filterTag])

  // 历史任务排序（按完成时间倒序）
  const sortedHistoryTasks = useMemo(() => {
    return [...historyTasks].sort((a, b) => {
      return new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    })
  }, [historyTasks])

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim()
    if (tag && !newTags.includes(tag)) {
      setNewTags([...newTags, tag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag))
  }

  // 项目颜色选项
  const PROJECT_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ]

  // 创建项目
  const handleCreateProject = async () => {
    const name = newProjectName.trim()
    if (!name) return

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name,
        color: newProjectColor,
        user_id: userId,
      }])
      .select()

    if (error) {
      console.error('Error creating project:', error)
    } else if (data && data[0]) {
      setProjects(prev => [data[0], ...prev])
      setNewProjectId(data[0].id)
      setNewProjectName('')
      setNewProjectColor('#3b82f6')
      setShowCreateProject(false)
      setShowProjectSelector(false)
    }
  }

  const resetAddForm = () => {
    setText('')
    setNewPriority('medium')
    setNewEstimatedTime(25)
    setNewTags([])
    setNewLinkIds([])
    setNewTag('')
    setNewDueDate('')
    setNewProjectId(null)
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
          estimated_time: Number(newEstimatedTime) || 25,
          tags: newTags,
          subtasks: [],
          transfer_ids: newLinkIds,
          due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
          project_id: newProjectId,
        },
      ])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
    } else if (data) {
      // 实时订阅会处理状态更新，但为了反应更快，这里也可以手动加
      // setTasks((prev) => [data[0], ...prev]) 
      // 由于开启了 insert 订阅，这里不需要手动 set，否则可能重复（虽然有去重逻辑）
      resetAddForm()
    }
    setIsAdding(false)
  }

  // 注册添加任务函数供快捷键使用
  useEffect(() => {
    const addTaskHandler = () => {
      if (activeTab === 'todo' && inputRef.current) {
        inputRef.current.focus()
        setShowAddOptions(true)
      } else {
        setActiveTab('todo')
        setTimeout(() => {
           inputRef.current?.focus()
           setShowAddOptions(true)
        }, 50)
      }
    }
    registerAddTask(addTaskHandler)
  }, [registerAddTask, activeTab])

  // 点击外部收起输入框（如果没有输入内容）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 关闭项目选择器下拉
      if (showProjectSelector) {
        setShowProjectSelector(false)
      }
      
      if (
        inputContainerRef.current &&
        !inputContainerRef.current.contains(event.target as Node) &&
        showAddOptions &&
        !text.trim() &&
        newTags.length === 0 &&
        newLinkIds.length === 0 &&
        !newDueDate &&
        !newProjectId
      ) {
        setShowAddOptions(false)
        setNewPriority('medium')
        setNewEstimatedTime(25)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddOptions, showProjectSelector, text, newTags, newLinkIds, newDueDate, newProjectId])

  // 更新任务（通用）
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // 乐观更新
    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))

    const { error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating task:', error)
      // 这里应该有回滚逻辑，暂略
    }
  }

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted
    const updateData: Partial<Task> = {
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null // null for incomplete
    }

    // 乐观更新：不从 tasks 移除，只改状态。useMemo 会自动将其分类到不同列表
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updateData } : task
      )
    )

    // 如果任务完成，取消其选中状态
    if (newCompleted && selectedTask?.id === taskId) {
        setSelectedTask(null)
    }

    const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error updating task:', error)
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

  // 重命名标签（更新所有包含该标签的任务）
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (oldTag === newTag || !newTag.trim()) return
    
    // 找出所有包含该标签的任务
    const tasksWithTag = tasks.filter(t => t.tags?.includes(oldTag))
    
    // 乐观更新本地状态
    setTasks(prev => prev.map(task => {
      if (task.tags?.includes(oldTag)) {
        const updatedTags = task.tags.map(t => t === oldTag ? newTag : t)
        return { ...task, tags: updatedTags }
      }
      return task
    }))

    // 同时更新新任务表单中的标签
    if (newTags.includes(oldTag)) {
      setNewTags(prev => prev.map(t => t === oldTag ? newTag : t))
    }

    // 更新筛选标签
    if (filterTag === oldTag) {
      setFilterTag(newTag)
    }

    // 批量更新数据库
    for (const task of tasksWithTag) {
      const updatedTags = task.tags?.map(t => t === oldTag ? newTag : t) || []
      const { error } = await supabase
        .from('todos')
        .update({ tags: updatedTags })
        .eq('id', task.id)
        .eq('user_id', userId)

      if (error) {
        console.error('Error renaming tag:', error)
      }
    }
  }

  // 删除标签（从所有任务中移除该标签）
  const handleDeleteTag = async (tagToDelete: string) => {
    // 找出所有包含该标签的任务
    const tasksWithTag = tasks.filter(t => t.tags?.includes(tagToDelete))
    
    // 乐观更新本地状态
    setTasks(prev => prev.map(task => {
      if (task.tags?.includes(tagToDelete)) {
        const updatedTags = task.tags.filter(t => t !== tagToDelete)
        return { ...task, tags: updatedTags }
      }
      return task
    }))

    // 同时更新新任务表单中的标签
    if (newTags.includes(tagToDelete)) {
      setNewTags(prev => prev.filter(t => t !== tagToDelete))
    }

    // 清除筛选
    if (filterTag === tagToDelete) {
      setFilterTag(null)
    }

    // 批量更新数据库
    for (const task of tasksWithTag) {
      const updatedTags = task.tags?.filter(t => t !== tagToDelete) || []
      const { error } = await supabase
        .from('todos')
        .update({ tags: updatedTags })
        .eq('id', task.id)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting tag:', error)
      }
    }
  }

  // 标签建议：排除已选的
  const tagSuggestions = useMemo(() => {
    return allTags.filter(t => !newTags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase()))
  }, [allTags, newTags, newTag])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '未知日期'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const isColorfulTags = settings?.tag_color_mode !== 'monochrome'

  return (
    <ThemedCard
      label="任务清单"
      title="我的任务"
      meta={
        <div className="flex items-center gap-3">
          <div className="flex gap-2 rounded-lg bg-stone-100 p-1 dark:bg-ash">
            <button
              onClick={() => setActiveTab('todo')}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                activeTab === 'todo'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-graphite dark:text-fog dark:shadow-none'
                  : 'text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white/60'
              }`}
            >
              <ListChecks weight="bold" />
              待办
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-graphite dark:text-fog dark:shadow-none'
                  : 'text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white/60'
              }`}
            >
              <ClockCounterClockwise weight="bold" />
              历史
            </button>
          </div>
          {onExpand && (
            <button
              onClick={onExpand}
              className="flex items-center justify-center rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-white"
              title="展开任务管理"
            >
              <ArrowsOutSimple size={18} weight="bold" />
            </button>
          )}
        </div>
      }
      className="md:h-[640px] flex flex-col"
    >
      {activeTab === 'todo' && (
        <>
          {/* 当前专注任务提示 */}
          {selectedTask && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10 dark:border dark:border-amber-500/20 flex-shrink-0">
              <Target size={16} weight="duotone" className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                正在专注: {selectedTask.text}
              </span>
            </div>
          )}

          {/* 标签筛选栏 */}
          {allTags.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
              <Funnel size={14} className={`shrink-0 ${filterTag ? 'text-amber-500' : 'text-stone-400 dark:text-mist'}`} />
              <button
                onClick={() => setFilterTag(null)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterTag === null
                    ? 'bg-stone-800 text-white dark:bg-fog dark:text-coal'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
                }`}
              >
                全部
              </button>
              {allTags.map(tag => {
                const colorStyle = isColorfulTags ? getTagColor(tag) : { bg: 'bg-stone-100 dark:bg-ash', text: 'text-stone-500 dark:text-mist' }
                const isActive = filterTag === tag
                
                return (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(isActive ? null : tag)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : `${colorStyle.bg} ${colorStyle.text} opacity-80 hover:opacity-100`
                    }`}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          )}

          {/* 输入框及选项 */}
          <div 
            ref={inputContainerRef}
            className={`mb-6 rounded-2xl border bg-stone-50/80 transition-all duration-300 flex-shrink-0 ${
              showAddOptions 
                ? 'border-stone-200 bg-white shadow-lg shadow-stone-200/50 dark:border-white/10 dark:bg-stone-800 dark:shadow-none px-4 py-4' 
                : 'border-stone-100 hover:border-stone-200 hover:bg-white dark:border-white/5 dark:bg-stone-800/50 dark:hover:border-white/10 px-4 py-3'
            }`}
          >
            <form onSubmit={handleAddTask}>
              <div className="flex flex-col gap-3">
                {/* 输入行 */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    showAddOptions ? 'border-stone-300 dark:border-stone-500' : 'border-stone-200 dark:border-stone-600'
                  }`} />
                  <input
                    ref={inputRef}
                    className="w-full bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500"
                    placeholder="输入下一项任务..."
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onFocus={() => setShowAddOptions(true)}
                    disabled={isAdding}
                  />
                </div>
                
                {/* 扩展选项 - 两行布局 */}
                {showAddOptions && (
                  <>
                    {/* 第一行：优先级、时间、日期 */}
                    <div className="flex flex-wrap items-center gap-2 pl-8 border-t border-stone-100 dark:border-white/5 pt-3">
                      {/* 优先级选择器 */}
                      <div className="flex items-center rounded-full bg-stone-100/80 p-0.5 dark:bg-white/5">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewPriority(p)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                              newPriority === p
                                ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-white'
                                : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                            }`}
                            title={PRIORITY_MAP[p].label}
                          >
                            <Flag size={12} weight={newPriority === p ? 'fill' : 'regular'} className={newPriority === p ? PRIORITY_MAP[p].color : ''} />
                            {newPriority === p && <span>{PRIORITY_MAP[p].label}</span>}
                          </button>
                        ))}
                      </div>

                      {/* 预估时间 */}
                      <div className="flex items-center gap-1 rounded-full bg-stone-100/80 px-2.5 py-1 dark:bg-white/5" title="预计时间(分钟)">
                        <Clock size={12} className="text-stone-400 dark:text-stone-500" />
                        <input
                          type="number"
                          min="1"
                          value={newEstimatedTime}
                          onChange={(e) => setNewEstimatedTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                          onBlur={() => {
                              const val = Number(newEstimatedTime)
                              if (!val || val < 1) setNewEstimatedTime(1)
                          }}
                          className="w-7 bg-transparent text-center text-xs font-medium outline-none dark:text-white"
                        />
                        <span className="text-xs text-stone-400 dark:text-stone-500">m</span>
                      </div>

                      {/* 截止日期 */}
                      <div className="flex items-center gap-1 rounded-full bg-stone-100/80 px-2.5 py-1 dark:bg-white/5">
                        <ClockCounterClockwise size={12} className="text-stone-400 dark:text-stone-500" />
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="bg-transparent text-xs font-medium outline-none dark:text-white dark:[color-scheme:dark] w-24"
                          placeholder="年/月/日"
                        />
                      </div>
                    </div>

                    {/* 第二行：标签、Link、添加按钮 */}
                    <div className="flex flex-wrap items-center gap-2 pl-8">
                      {/* 标签输入 */}
                      <div className="relative flex items-center gap-1.5 rounded-full bg-stone-100/80 px-2.5 py-1 dark:bg-white/5">
                        <button 
                          type="button"
                          onClick={() => setShowTagSelector(true)}
                          className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-white transition-colors"
                          title="选择已有标签"
                        >
                          <ListChecks size={12} weight="bold" />
                        </button>
                        <div className="h-3 w-px bg-stone-200 dark:bg-white/10" />
                        <TagIcon size={12} className="text-stone-400 dark:text-stone-500" />
                        <input
                          className="w-16 bg-transparent text-xs outline-none dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
                          placeholder="标签"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          onBlur={() => setTimeout(() => handleAddTag(), 100)}
                        />
                        {/* 标签建议下拉 */}
                        {newTag && tagSuggestions.length > 0 && (
                          <div className="absolute left-0 top-full z-10 mt-1 max-h-32 w-32 overflow-y-auto rounded-lg border border-stone-100 bg-white shadow-lg dark:border-white/10 dark:bg-stone-800">
                            {tagSuggestions.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                className="w-full px-2 py-1 text-left text-xs hover:bg-stone-50 dark:text-white dark:hover:bg-white/5"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleAddTag(tag)
                                }}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 关联文件选择器 */}
                      {transferItems.length > 0 && (
                        <button 
                            type="button"
                            onClick={() => setShowLinkSelector(true)}
                            className="flex items-center gap-1 rounded-full bg-stone-100/80 px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:text-mist dark:hover:bg-white/10 transition-colors"
                        >
                             <Paperclip size={12} />
                             Link
                        </button>
                      )}

                      {/* 项目文件夹选择器 */}
                      <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setShowProjectSelector(!showProjectSelector)}
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                              newProjectId 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' 
                                : 'bg-stone-100/80 text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:text-mist dark:hover:bg-white/10'
                            }`}
                        >
                             <FolderSimple size={12} weight={newProjectId ? 'fill' : 'regular'} />
                             {newProjectId ? projects.find(p => p.id === newProjectId)?.name || '项目' : '项目'}
                             {newProjectId && (
                               <button 
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); setNewProjectId(null); }}
                                 className="hover:opacity-70"
                               >
                                 <X size={10} />
                               </button>
                             )}
                        </button>
                        {/* 项目下拉选择 */}
                        {showProjectSelector && (
                          <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-stone-100 bg-white shadow-lg dark:border-white/10 dark:bg-stone-800">
                            {/* 新建项目表单 */}
                            {showCreateProject ? (
                              <div className="p-3 space-y-3">
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="项目名称"
                                  value={newProjectName}
                                  onChange={(e) => setNewProjectName(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                  className="w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 dark:border-white/10 dark:bg-stone-700 dark:text-white"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                  {PROJECT_COLORS.map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setNewProjectColor(color)}
                                      className={`w-5 h-5 rounded-full transition-transform ${newProjectColor === color ? 'scale-125 ring-2 ring-offset-1 ring-stone-400' : 'hover:scale-110'}`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="flex-1 rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                                  >
                                    创建
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setShowCreateProject(false); setNewProjectName(''); }}
                                    className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* 新建项目按钮 */}
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 border-b border-stone-100 dark:border-white/10"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    setShowCreateProject(true)
                                  }}
                                >
                                  <Plus size={12} weight="bold" />
                                  <span>新建项目</span>
                                </button>
                                {/* 项目列表 */}
                                <div className="max-h-32 overflow-y-auto">
                                  {projects.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-stone-400 dark:text-mist">暂无项目</div>
                                  ) : (
                                    projects.map(project => (
                                      <button
                                        key={project.id}
                                        type="button"
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-white/5 ${
                                          newProjectId === project.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                                        }`}
                                        onMouseDown={(e) => {
                                          e.preventDefault()
                                          setNewProjectId(newProjectId === project.id ? null : project.id)
                                          setShowProjectSelector(false)
                                        }}
                                      >
                                        <span 
                                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: project.color }}
                                        />
                                        <span className="truncate dark:text-white">{project.name}</span>
                                        {newProjectId === project.id && (
                                          <Check size={12} className="ml-auto text-blue-500" weight="bold" />
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 已选标签展示 - 内联在同一行 */}
                      {newTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {newTags.map((tag) => {
                              const colorStyle = isColorfulTags ? getTagColor(tag) : { bg: 'bg-stone-100', text: 'text-stone-600' }
                              return (
                                <span key={tag} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${colorStyle.bg} ${colorStyle.text}`}>
                                  #{tag}
                                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                                    <X size={10} />
                                  </button>
                                </span>
                              )
                          })}
                        </div>
                      )}

                      <div className="flex-1" />

                      {/* 添加按钮 */}
                      <button
                        type="submit"
                        disabled={isAdding || !text.trim()}
                        className="flex items-center gap-1.5 rounded-full bg-stone-800 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-stone-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
                      >
                        {isAdding ? <Spinner className="animate-spin" size={12} /> : <Plus weight="bold" size={12} />}
                        添加任务
                      </button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* 列表 */}
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2 min-h-0 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-8 animate-spin text-stone-300 dark:text-stone-600" weight="duotone" />
              </div>
            ) : sortedAndFilteredTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-stone-300 dark:text-stone-700">
                <ClipboardText size={64} weight="duotone" className="mb-6 opacity-40" />
                <p className="text-lg font-medium">
                  {filterTag ? '该标签下无任务' : '暂无任务'}
                </p>
              </div>
            ) : (
              sortedAndFilteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onToggle={() => toggleTask(task.id, task.completed)}
                  onDelete={() => deleteTask(task.id)}
                  onSelect={() => handleSelectTask(task)}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  transferItems={transferItems}
                  isColorfulTags={isColorfulTags}
                  allTags={allTags}
                  projects={projects}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2 min-h-0">
          {sortedHistoryTasks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-stone-300 dark:text-white/10">
              <CheckCircle size={48} weight="duotone" className="mb-4 opacity-50" />
              <p className="text-sm font-medium">还没有完成的任务</p>
              <p className="text-xs opacity-70">加油！</p>
            </div>
          ) : (
            sortedHistoryTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 transition-all hover:border-stone-300 hover:bg-stone-50 dark:border-white/5 dark:bg-ash/50 dark:hover:border-white/10 dark:hover:bg-ash"
              >
                <button
                  onClick={() => toggleTask(task.id, task.completed)}
                  className="mt-0.5 flex-shrink-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  title="标记为未完成"
                >
                  <CheckCircle weight="fill" size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-stone-700 line-through decoration-stone-300 dark:text-mist dark:decoration-white/20 truncate">
                      {task.text}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-mist/60 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <TomatoProgress count={task.pomodoros || 0} size={14} />
                          <span className="text-stone-500 dark:text-mist">
                            {task.pomodoros || 0}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                          <Clock size={12} weight="duotone" />
                          <span>{formatDate(task.completed_at)}</span>
                        </div>
                    </div>
                  </div>
                </div>
                 <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 dark:text-mist dark:hover:text-red-400 transition-opacity"
                    title="删除记录"
                  >
                    <Trash size={16} weight="duotone" />
                  </button>
              </div>
            ))
          )}
        </div>
      )}
      <TagManagementModal
        isOpen={showTagSelector}
        onClose={() => setShowTagSelector(false)}
        allTags={allTags}
        selectedTags={newTags}
        onToggleTag={(tag) => {
            if (newTags.includes(tag)) {
                setNewTags(newTags.filter(t => t !== tag))
            } else {
                setNewTags([...newTags, tag])
            }
        }}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
        isColorfulTags={isColorfulTags}
      />

      <SelectionModal
        title="关联文件"
        isOpen={showLinkSelector}
        onClose={() => setShowLinkSelector(false)}
        items={transferItems}
        selectedIds={newLinkIds}
        onToggle={(id) => {
            if (newLinkIds.includes(id)) {
                setNewLinkIds(newLinkIds.filter(tid => tid !== id))
            } else {
                setNewLinkIds([...newLinkIds, id])
            }
        }}
        renderItem={(item) => (
            <div className="flex items-center gap-2 overflow-hidden">
                {item.type === 'text' ? <LinkIcon size={16} /> : <FileIcon size={16} />}
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{item.type === 'text' ? item.content : (item.metadata.name || 'Unknown File')}</span>
                    <span className="text-[10px] text-stone-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        )}
        keyExtractor={(item) => item.id}
      />
    </ThemedCard>
  )
}

type TaskItemProps = {
  task: Task
  isSelected: boolean
  onToggle: () => void
  onDelete: () => void
  onSelect: () => void
  onUpdate: (updates: Partial<Task>) => void
  transferItems?: TransferItem[]
  isColorfulTags?: boolean
  allTags?: string[]
  projects?: Project[]
}

const TaskItem = ({ task, isSelected, onToggle, onDelete, onSelect, onUpdate, transferItems = [], isColorfulTags = true, allTags = [], projects = [] }: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit states
  const [editTitle, setEditTitle] = useState(task.text)
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority || 'medium')
  const [editEstimate, setEditEstimate] = useState<number | string>(task.estimated_time || 25)
  const [editTags, setEditTags] = useState<string[]>(task.tags || [])
  const [editProjectId, setEditProjectId] = useState<string | null>(task.project_id || null)
  const [newTagInput, setNewTagInput] = useState('')
  const [subtaskText, setSubtaskText] = useState('')
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showLinkSelector, setShowLinkSelector] = useState(false)
  const [showProjectSelectorEdit, setShowProjectSelectorEdit] = useState(false)
  
  // Subtask editing state
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editSubtaskValue, setEditSubtaskValue] = useState('')
  
  // Tag inline editing state
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null)
  const [editTagValue, setEditTagValue] = useState('')
  
  // Reset edit states when entering editing
  useEffect(() => {
    if (isEditing) {
      setEditTitle(task.text)
      setEditPriority(task.priority || 'medium')
      setEditEstimate(task.estimated_time || 25)
      setEditTags(task.tags || [])
      setEditProjectId(task.project_id || null)
    }
  }, [isEditing, task])

  const priorityKey = (task.priority && PRIORITY_MAP[task.priority]) ? task.priority : 'medium'
  const priorityStyle = PRIORITY_MAP[priorityKey]
  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const linkedTransfers = task.transfer_ids?.map(id => transferItems.find(t => t.id === id)).filter(Boolean) as TransferItem[] || []

  const startEditingSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditSubtaskValue(subtask.text)
  }

  // 开始编辑标签
  const startEditingTag = (index: number, tag: string) => {
    setEditingTagIndex(index)
    setEditTagValue(tag)
  }

  // 保存标签编辑
  const saveTagEdit = () => {
    if (editingTagIndex === null) return
    
    const newTagValue = editTagValue.trim()
    if (newTagValue && task.tags) {
      // 检查是否与其他标签重复
      const otherTags = task.tags.filter((_, i) => i !== editingTagIndex)
      if (!otherTags.includes(newTagValue)) {
        const updatedTags = task.tags.map((t, i) => 
          i === editingTagIndex ? newTagValue : t
        )
        onUpdate({ tags: updatedTags })
      }
    }
    setEditingTagIndex(null)
    setEditTagValue('')
  }

  // 取消标签编辑
  const cancelTagEdit = () => {
    setEditingTagIndex(null)
    setEditTagValue('')
  }

  const saveSubtask = () => {
    if (!editingSubtaskId) return
    
    if (editSubtaskValue.trim()) {
        const updatedSubtasks = task.subtasks?.map(s => 
          s.id === editingSubtaskId ? { ...s, text: editSubtaskValue.trim() } : s
        )
        onUpdate({ subtasks: updatedSubtasks })
    }
    setEditingSubtaskId(null)
  }

  const handleSave = () => {
    const updates: Partial<Task> = {}
    let hasChanges = false

    if (editTitle.trim() !== task.text) {
      updates.text = editTitle.trim()
      hasChanges = true
    }
    if (editPriority !== task.priority) {
      updates.priority = editPriority
      hasChanges = true
    }
    const finalEstimate = Number(editEstimate) || 25
    if (finalEstimate !== task.estimated_time) {
      updates.estimated_time = finalEstimate
      hasChanges = true
    }
    // Simple array comparison for tags
    if (JSON.stringify(editTags.sort()) !== JSON.stringify(task.tags?.sort() || [])) {
      updates.tags = editTags
      hasChanges = true
    }
    // 项目更改
    if (editProjectId !== (task.project_id || null)) {
      updates.project_id = editProjectId
      hasChanges = true
    }

    if (hasChanges) {
      onUpdate(updates)
    }
    setIsEditing(false)
  }

  const handleAddTag = () => {
    const tag = newTagInput.trim()
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag])
      setNewTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag))
  }

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault()
    if (!subtaskText.trim()) return
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      text: subtaskText.trim(),
      completed: false
    }
    const updatedSubtasks = [...(task.subtasks || []), newSubtask]
    onUpdate({ subtasks: updatedSubtasks })
    setSubtaskText('')
  }

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    onUpdate({ subtasks: updatedSubtasks })
  }

  const deleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.filter(s => s.id !== subtaskId)
    onUpdate({ subtasks: updatedSubtasks })
  }

  const handleLinkTransfer = (transferId: string) => {
    const currentIds = task.transfer_ids || []
    if (currentIds.includes(transferId)) return
    onUpdate({ transfer_ids: [...currentIds, transferId] })
  }

  const handleUnlinkTransfer = (transferId: string) => {
    const currentIds = task.transfer_ids || []
    onUpdate({ transfer_ids: currentIds.filter(id => id !== transferId) })
  }

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-2xl border px-5 py-4 transition-all duration-200 ${
        isSelected
          ? 'border-amber-300 bg-amber-50 shadow-md shadow-amber-100/50 dark:border-amber-500/50 dark:bg-amber-900/20 dark:shadow-none'
          : task.completed
          ? 'border-transparent bg-stone-50/50 opacity-60 hover:opacity-100 dark:bg-white/5'
          : 'border-stone-100 bg-white shadow-sm hover:border-stone-200 hover:shadow-lg hover:shadow-stone-100/50 dark:border-white/5 dark:bg-stone-800 dark:hover:border-white/10 dark:hover:bg-stone-800/80 dark:shadow-none'
      } ${isSelected ? '' : 'border-l-[6px] ' + (priorityStyle?.border?.replace('border', 'border-l') || 'border-l-stone-200')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          {/* 完成按钮 */}
          <button
            onClick={onToggle}
            className={`mt-1 transition-transform active:scale-90 ${task.completed ? 'text-stone-800 dark:text-stone-200' : 'text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400'}`}
          >
            {task.completed ? <CheckCircle weight="fill" size={24} /> : <Circle size={24} />}
          </button>
          
          <div className="flex-1 min-w-0 pt-0.5">
            {/* 编辑模式 vs 查看模式 */}
            {isEditing ? (
              <div className="flex flex-col gap-3">
                {/* 标题输入 */}
                <input
                  autoFocus
                  className="w-full bg-transparent text-lg font-medium outline-none border-b-2 border-stone-200 focus:border-stone-800 dark:border-stone-700 dark:focus:border-stone-400 dark:text-stone-100 pb-2"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                
                {/* 编辑工具栏 */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 优先级 */}
                  <div className="flex items-center gap-0.5 rounded bg-stone-100 p-0.5 dark:bg-white/5">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditPriority(p)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                          editPriority === p
                            ? 'bg-white text-stone-900 shadow-sm dark:bg-white/20 dark:text-white'
                            : 'text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white/70'
                        }`}
                        title={PRIORITY_MAP[p].label}
                      >
                        <Flag weight="fill" size={10} className={editPriority === p ? PRIORITY_MAP[p].color : ''} />
                      </button>
                    ))}
                  </div>

                  {/* 时间预估 */}
                  <div className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 dark:bg-white/5">
                    <Clock size={10} className="text-stone-400 dark:text-mist" />
                    <input
                      type="number"
                      min="1"
                      value={editEstimate}
                      onChange={(e) => setEditEstimate(e.target.value === '' ? '' : parseInt(e.target.value))}
                      onBlur={() => {
                          const val = Number(editEstimate)
                          if (!val || val < 1) setEditEstimate(1)
                      }}
                      className="w-10 bg-transparent text-center text-[10px] font-medium outline-none dark:text-white"
                    />
                    <span className="text-[10px] text-stone-400 dark:text-mist">m</span>
                  </div>

                  {/* 标签输入 */}
                  <div className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 dark:bg-white/5">
                    <button 
                        type="button"
                        onClick={() => setShowTagSelector(true)}
                        className="text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white"
                        title="选择已有标签"
                    >
                        <ListChecks size={10} weight="bold" />
                    </button>
                    <div className="h-2.5 w-px bg-stone-300 dark:bg-white/10" />
                    <TagIcon size={10} className="text-stone-400 dark:text-mist" />
                    <input
                      className="w-12 bg-transparent text-[10px] outline-none dark:text-white placeholder:text-stone-400 dark:placeholder:text-mist"
                      placeholder="Tag"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      onBlur={handleAddTag}
                    />
                  </div>

                  {/* 关联文件选择器 */}
                  {transferItems.length > 0 && (
                    <button 
                        type="button"
                        onClick={() => setShowLinkSelector(true)}
                        className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:text-mist dark:hover:bg-white/10"
                    >
                        <Paperclip size={10} />
                        Link
                    </button>
                  )}

                  {/* 项目选择器 */}
                  <div className="relative">
                    <button 
                        type="button"
                        onClick={() => setShowProjectSelectorEdit(!showProjectSelectorEdit)}
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                          editProjectId 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' 
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:text-mist dark:hover:bg-white/10'
                        }`}
                    >
                         <FolderSimple size={10} weight={editProjectId ? 'fill' : 'regular'} />
                         {editProjectId ? (projects.find(p => p.id === editProjectId)?.name?.slice(0, 6) || '项目') : '项目'}
                         {editProjectId && (
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setEditProjectId(null); }}
                             className="hover:opacity-70"
                           >
                             <X size={8} />
                           </button>
                         )}
                    </button>
                    {/* 项目下拉 */}
                    {showProjectSelectorEdit && (
                      <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-stone-100 bg-white shadow-lg dark:border-white/10 dark:bg-stone-800">
                        <div className="max-h-32 overflow-y-auto">
                          {projects.length === 0 ? (
                            <div className="px-2 py-1.5 text-[10px] text-stone-400 dark:text-mist">暂无项目</div>
                          ) : (
                            projects.map(project => (
                              <button
                                key={project.id}
                                type="button"
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[10px] hover:bg-stone-50 dark:hover:bg-white/5 ${
                                  editProjectId === project.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                                }`}
                                onClick={() => {
                                  setEditProjectId(editProjectId === project.id ? null : project.id)
                                  setShowProjectSelectorEdit(false)
                                }}
                              >
                                <span 
                                  className="w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="truncate dark:text-white">{project.name}</span>
                                {editProjectId === project.id && (
                                  <Check size={10} className="ml-auto text-blue-500" weight="bold" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 标签展示 */}
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editTags.map((tag) => {
                      const colorStyle = isColorfulTags ? getTagColor(tag) : { bg: 'bg-stone-100 dark:bg-white/10', text: 'text-stone-500 dark:text-mist' }
                      return (
                        <span key={tag} className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] ${colorStyle.bg} ${colorStyle.text}`}>
                          #{tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                            <X size={8} weight="bold" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* 保存/取消按钮 */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1 rounded bg-stone-900 py-1 text-[10px] font-bold text-white hover:bg-stone-800 dark:bg-fog dark:text-coal dark:hover:bg-white/90"
                  >
                    <FloppyDisk weight="bold" size={12} />
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-1 rounded bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:text-mist dark:hover:bg-white/10"
                  >
                    <XCircle weight="bold" size={12} />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 标题区 (支持双击编辑) */}
                <div className="flex items-start justify-between gap-2">
                    <p
                        onDoubleClick={() => !task.completed && setIsEditing(true)}
                        className={`font-medium text-base leading-relaxed transition truncate select-none cursor-text ${
                        task.completed
                            ? 'text-stone-400 line-through decoration-stone-300 dark:text-stone-500 dark:decoration-stone-700'
                            : 'text-stone-800 dark:text-stone-100'
                        }`}
                        title="双击编辑"
                    >
                        {task.text}
                    </p>
                    
                    {/* 进度信息 (紧凑模式) */}
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0 pt-1">
                        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
                            <TomatoProgress count={task.pomodoros || 0} size={14} />
                            {/* 预计时间/总番茄数 */}
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                {task.estimated_time ? `${task.estimated_time}m` : `/${task.estimated_pomodoros || 1}`}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* 第二行：标签、元数据、链接文件 (更宽松) */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {priorityStyle && (
                    <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${priorityStyle.color} ${priorityStyle.bg}`}>
                      <Flag weight="fill" size={12} />
                      {priorityStyle.label}
                    </span>
                  )}

                  {/* 项目标识 */}
                  {task.project_id && (() => {
                    const project = projects.find(p => p.id === task.project_id)
                    if (!project) return null
                    return (
                      <span 
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300"
                      >
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </span>
                    )
                  })()}
                  
                  {task.tags?.map((tag, index) => {
                    const colorStyle = isColorfulTags ? getTagColor(tag) : { bg: 'bg-stone-100 dark:bg-white/10', text: 'text-stone-500 dark:text-mist' }
                    const isEditingThisTag = editingTagIndex === index
                    
                    return isEditingThisTag ? (
                      <input
                        key={`edit-${index}`}
                        autoFocus
                        type="text"
                        value={editTagValue}
                        onChange={(e) => setEditTagValue(e.target.value)}
                        onBlur={saveTagEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTagEdit()
                          if (e.key === 'Escape') cancelTagEdit()
                        }}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium outline-none ring-2 ring-amber-400 ${colorStyle.bg} ${colorStyle.text} w-20`}
                      />
                    ) : (
                      <span 
                        key={tag} 
                        onDoubleClick={() => !task.completed && startEditingTag(index, tag)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer select-none transition-opacity hover:opacity-80 ${colorStyle.bg} ${colorStyle.text}`}
                        title="双击编辑标签"
                      >
                        #{tag}
                      </span>
                    )
                  })}

                  {/* 子任务进度指示 */}
                  {hasSubtasks && (
                     <span className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 dark:bg-white/10 dark:text-mist">
                        <CheckCircle size={10} />
                        {completedSubtasks}/{totalSubtasks}
                     </span>
                  )}

                  {/* 关联文件指示 */}
                  {linkedTransfers.length > 0 && linkedTransfers.map(item => (
                    <a 
                       key={item.id}
                       href={item.url || '#'} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600 hover:underline dark:bg-blue-900/20 dark:text-blue-400"
                       onClick={(e) => { if (!item.url) e.preventDefault(); }}
                    >
                       {item.type === 'text' ? <LinkIcon size={10} /> : <FileIcon size={10} />}
                       <span className="max-w-[80px] truncate">
                         {item.type === 'text' ? '文本' : item.metadata.name}
                       </span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-0.5">
           {/* 展开子任务 */}
           <button
             onClick={() => setIsExpanded(!isExpanded)}
             className={`p-1 transition-colors ${isExpanded ? 'text-stone-600 dark:text-white' : 'text-stone-300 hover:text-stone-500 dark:text-white/20'}`}
           >
             {isExpanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
           </button>

           {/* 选择按钮 */}
           {!task.completed && (
            <button
              onClick={onSelect}
              className={`rounded-lg p-1 transition-colors ${
                isSelected
                  ? 'bg-amber-200 text-amber-700 dark:bg-amber-600 dark:text-white'
                  : 'text-stone-300 hover:bg-stone-100 hover:text-amber-500 dark:text-white/20 dark:hover:bg-white/10 dark:hover:text-amber-400'
              }`}
              title={isSelected ? '取消选择' : '选择此任务专注'}
            >
              <Target size={16} weight="duotone" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-stone-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400"
          >
            <Trash size={16} weight="duotone" />
          </button>
        </div>
      </div>

      {/* 子任务区域 */}
      {isExpanded && (
        <div className="mt-3 border-t border-stone-100 pt-2 dark:border-white/5 pl-1">
          <div className="space-y-1">
            {task.subtasks?.map(subtask => (
              <div key={subtask.id} className="group/sub flex items-center gap-3 py-1">
                <button
                  onClick={() => toggleSubtask(subtask.id)}
                  className={`flex-shrink-0 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 ${subtask.completed ? 'text-emerald-500 hover:text-emerald-600' : ''}`}
                >
                  {subtask.completed ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                </button>
                
                {editingSubtaskId === subtask.id ? (
                    <input 
                        autoFocus
                        className="flex-1 bg-transparent text-sm outline-none border-b border-stone-300 dark:border-stone-600 dark:text-white pb-0.5"
                        value={editSubtaskValue}
                        onChange={(e) => setEditSubtaskValue(e.target.value)}
                        onBlur={saveSubtask}
                        onKeyDown={(e) => e.key === 'Enter' && saveSubtask()}
                    />
                ) : (
                    <span 
                        onDoubleClick={() => !subtask.completed && startEditingSubtask(subtask)}
                        className={`flex-1 text-sm transition-colors cursor-text select-none ${subtask.completed ? 'text-stone-400 line-through dark:text-stone-600' : 'text-stone-700 dark:text-stone-300'}`}
                        title="双击编辑子任务"
                    >
                      {subtask.text}
                    </span>
                )}

                <button
                  onClick={() => deleteSubtask(subtask.id)}
                  className="opacity-0 group-hover/sub:opacity-100 p-1 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400 transition-opacity"
                  title="删除子任务"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* 编辑模式下，显示添加子任务和关联文件管理 */}
          {isEditing && (
            <div className="mt-3 border-t border-stone-100 pt-3 dark:border-white/5">
              <p className="mb-2 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide">关联文件</p>
              <div className="flex flex-wrap gap-2">
                 {linkedTransfers.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-white/10 dark:text-stone-300">
                       {item.type === 'text' ? <LinkIcon size={12} /> : <FileIcon size={12} />}
                       <span className="max-w-[120px] truncate">{item.type === 'text' ? '文本' : item.metadata.name}</span>
                       <button onClick={() => handleUnlinkTransfer(item.id)} className="hover:text-red-500"><X size={12} /></button>
                    </div>
                 ))}
                 {linkedTransfers.length === 0 && <span className="text-xs text-stone-400 italic">无关联文件</span>}
              </div>
            </div>
          )}

          {/* 添加子任务输入 */}
          <form onSubmit={handleAddSubtask} className="mt-2 flex items-center gap-3">
             <Plus size={18} className="text-stone-400 dark:text-stone-500" />
             <input
               className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-600 py-1"
               placeholder="添加子任务..."
               value={subtaskText}
               onChange={(e) => setSubtaskText(e.target.value)}
             />
          </form>
        </div>
      )}

      <SelectionModal
        title="管理标签"
        isOpen={showTagSelector}
        onClose={() => setShowTagSelector(false)}
        items={allTags}
        selectedIds={editTags}
        onToggle={(tag) => {
            if (editTags.includes(tag)) {
                setEditTags(editTags.filter(t => t !== tag))
            } else {
                setEditTags([...editTags, tag])
            }
        }}
        renderItem={(tag, isSelected) => {
            const colorStyle = isColorfulTags ? getTagColor(tag) : { bg: 'bg-stone-100', text: 'text-stone-500' }
            return (
                <div className="flex items-center gap-2">
                    <TagIcon size={16} className={colorStyle.text} weight={isSelected ? 'fill' : 'regular'} />
                    <span className="text-sm font-medium">#{tag}</span>
                </div>
            )
        }}
        keyExtractor={(tag) => tag}
      />

      <SelectionModal
        title="关联文件"
        isOpen={showLinkSelector}
        onClose={() => setShowLinkSelector(false)}
        items={transferItems}
        selectedIds={task.transfer_ids || []}
        onToggle={(id) => {
            const currentIds = task.transfer_ids || []
            if (currentIds.includes(id)) {
                handleUnlinkTransfer(id)
            } else {
                handleLinkTransfer(id)
            }
        }}
        renderItem={(item) => (
            <div className="flex items-center gap-2 overflow-hidden">
                {item.type === 'text' ? <LinkIcon size={16} /> : <FileIcon size={16} />}
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{item.type === 'text' ? item.content : (item.metadata.name || 'Unknown File')}</span>
                    <span className="text-[10px] text-stone-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        )}
        keyExtractor={(item) => item.id}
      />
    </div>
  )
}
type SelectionModalProps<T> = {
  title: string
  isOpen: boolean
  onClose: () => void
  items: T[]
  selectedIds: string[]
  onToggle: (id: string) => void
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  keyExtractor: (item: T) => string
}

const SelectionModal = <T,>({ title, isOpen, onClose, items, selectedIds, onToggle, renderItem, keyExtractor }: SelectionModalProps<T>) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl dark:bg-stone-800 ring-1 ring-stone-900/5 animate-in fade-in zoom-in duration-200">
         <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-stone-700 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white bg-transparent border-none cursor-pointer"><X size={16} /></button>
         </div>
         <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-1">
            {items.length === 0 ? <p className="text-center text-sm text-stone-400 py-4">暂无内容</p> : items.map(item => {
                const id = keyExtractor(item)
                const isSelected = selectedIds.includes(id)
                return (
                    <div 
                      key={id} 
                      onClick={() => onToggle(id)} 
                      className={`cursor-pointer rounded-lg px-3 py-2 transition-colors flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100' 
                          : 'hover:bg-stone-50 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                        {renderItem(item, isSelected)}
                        {isSelected && <CheckCircle weight="fill" className="ml-auto text-amber-500" size={16} />}
                    </div>
                )
            })}
         </div>
      </div>
    </div>
  )
}

// 标签管理模态框 - 支持选择、编辑、删除标签
type TagManagementModalProps = {
  isOpen: boolean
  onClose: () => void
  allTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onRenameTag: (oldTag: string, newTag: string) => void
  onDeleteTag: (tag: string) => void
  isColorfulTags: boolean
}

const TagManagementModal = ({ 
  isOpen, 
  onClose, 
  allTags, 
  selectedTags, 
  onToggleTag, 
  onRenameTag, 
  onDeleteTag,
  isColorfulTags 
}: TagManagementModalProps) => {
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTag && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTag])

  const handleStartEdit = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTag(tag)
    setEditValue(tag)
  }

  const handleSaveEdit = () => {
    if (editingTag && editValue.trim() && editValue.trim() !== editingTag) {
      onRenameTag(editingTag, editValue.trim())
    }
    setEditingTag(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setEditValue('')
  }

  const handleDelete = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定要删除标签 "#${tag}" 吗？\n这将从所有任务中移除此标签。`)) {
      onDeleteTag(tag)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl dark:bg-stone-800 ring-1 ring-stone-900/5 animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-stone-700 dark:text-white">管理标签</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-stone-600 dark:text-mist dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="mb-3 text-xs text-stone-400 dark:text-mist">
          点击选择 · 双击编辑 · 右侧按钮删除
        </p>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-1">
          {allTags.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-4">暂无标签</p>
          ) : (
            allTags.map(tag => {
              const colorStyle = isColorfulTags 
                ? getTagColor(tag) 
                : { bg: 'bg-stone-100 dark:bg-white/10', text: 'text-stone-500 dark:text-mist' }
              const isSelected = selectedTags.includes(tag)
              const isEditing = editingTag === tag

              return (
                <div
                  key={tag}
                  onClick={() => !isEditing && onToggleTag(tag)}
                  onDoubleClick={(e) => handleStartEdit(tag, e)}
                  className={`group cursor-pointer rounded-lg px-3 py-2 transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100'
                      : 'hover:bg-stone-50 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <TagIcon size={16} className={colorStyle.text} />
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        onBlur={handleSaveEdit}
                        className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-amber-400 dark:border-amber-500"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-emerald-500 hover:text-emerald-600"
                      >
                        <Check size={14} weight="bold" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <TagIcon size={16} className={colorStyle.text} weight={isSelected ? 'fill' : 'regular'} />
                      <span className="flex-1 text-sm font-medium">#{tag}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(tag, e)}
                          className="p-1 text-stone-400 hover:text-blue-500 dark:text-mist dark:hover:text-blue-400"
                          title="编辑标签"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(tag, e)}
                          className="p-1 text-stone-400 hover:text-red-500 dark:text-mist dark:hover:text-red-400"
                          title="删除标签"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      {isSelected && <CheckCircle weight="fill" className="text-amber-500" size={16} />}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoList
