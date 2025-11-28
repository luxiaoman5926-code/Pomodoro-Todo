import { useState, useMemo, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Calendar,
  FolderSimple,
  Circle,
  CheckCircle,
  X,
  CalendarBlank,
  DotsThree,
} from '@phosphor-icons/react'
import type { Task, Project } from '../types'
import { supabase } from '../supabase'

type TodoFullPageProps = {
  userId: string
  onBack: () => void
}

// 项目颜色选项
const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
]

const PRIORITY_MAP = {
  high: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', label: '高' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: '中' },
  low: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: '低' },
}

const TodoFullPage = ({ userId, onBack }: TodoFullPageProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])
  const [newProjectStartDate, setNewProjectStartDate] = useState('')
  const [newProjectEndDate, setNewProjectEndDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 获取任务
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setIsLoading(false)
  }

  // 获取项目
  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [userId])

  // 创建项目
  const createProject = async () => {
    const name = newProjectName.trim()
    if (!name) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: name,
          color: newProjectColor,
          start_date: newProjectStartDate ? new Date(newProjectStartDate).toISOString() : null,
          end_date: newProjectEndDate ? new Date(newProjectEndDate).toISOString() : null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        return
      }

      if (data) {
        setProjects([...projects, data])
        setNewProjectName('')
        setNewProjectColor(PROJECT_COLORS[0])
        setNewProjectStartDate('')
        setNewProjectEndDate('')
        setShowProjectModal(false)
      }
    } catch (err) {
      console.error('Error creating project:', err)
    }
  }

  // 更新项目
  const updateProject = async () => {
    if (!editingProject || !newProjectName.trim()) return

    const { error } = await supabase
      .from('projects')
      .update({
        name: newProjectName.trim(),
        color: newProjectColor,
        start_date: newProjectStartDate ? new Date(newProjectStartDate).toISOString() : null,
        end_date: newProjectEndDate ? new Date(newProjectEndDate).toISOString() : null,
      })
      .eq('id', editingProject.id)

    if (!error) {
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { 
              ...p, 
              name: newProjectName.trim(), 
              color: newProjectColor,
              start_date: newProjectStartDate ? new Date(newProjectStartDate).toISOString() : null,
              end_date: newProjectEndDate ? new Date(newProjectEndDate).toISOString() : null,
            }
          : p
      ))
      setEditingProject(null)
      setNewProjectName('')
      setNewProjectStartDate('')
      setNewProjectEndDate('')
      setShowProjectModal(false)
    }
  }

  // 删除项目
  const deleteProject = async (projectId: string) => {
    // 将项目下的任务移到收件箱
    await supabase
      .from('todos')
      .update({ project_id: null })
      .eq('project_id', projectId)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId))
      setTasks(tasks.map(t => t.project_id === projectId ? { ...t, project_id: null } : t))
      if (selectedProject === projectId) {
        setSelectedProject(null)
      }
    }
  }

  // 更新任务项目
  const updateTaskProject = async (taskId: string, projectId: string | null) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, project_id: projectId } : t))
    
    await supabase
      .from('todos')
      .update({ project_id: projectId })
      .eq('id', taskId)
  }

  // 更新任务截止日期
  const updateTaskDueDate = async (taskId: string, dueDate: string | null) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, due_date: dueDate } : t))
    
    await supabase
      .from('todos')
      .update({ due_date: dueDate })
      .eq('id', taskId)
  }

  // 切换任务完成状态
  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
        : t
    ))

    await supabase
      .from('todos')
      .update({ 
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', taskId)
  }

  // 按项目分组的任务
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = { inbox: [] }
    
    projects.forEach(p => {
      groups[p.id] = []
    })

    const filteredTasks = tasks.filter(t => !t.completed)
    
    filteredTasks.forEach(task => {
      if (task.project_id && groups[task.project_id]) {
        groups[task.project_id].push(task)
      } else {
        groups.inbox.push(task)
      }
    })

    return groups
  }, [tasks, projects])

  // 日历数据
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    
    const days: { date: Date; tasks: Task[] }[] = []
    
    for (let i = 0; i < startOffset; i++) {
      const prevDate = new Date(year, month, -startOffset + i + 1)
      days.push({ date: prevDate, tasks: [] })
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const dayTasks = tasks.filter(t => {
        if (!t.due_date) return false
        return t.due_date.split('T')[0] === dateStr
      })
      days.push({ date, tasks: dayTasks })
    }

    // 填充到完整的周
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i)
        days.push({ date: nextDate, tasks: [] })
      }
    }

    return days
  }, [currentMonth, tasks])

  const openEditProject = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setNewProjectColor(project.color)
    setNewProjectStartDate(project.start_date ? project.start_date.split('T')[0] : '')
    setNewProjectEndDate(project.end_date ? project.end_date.split('T')[0] : '')
    setShowProjectModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            >
              <ArrowLeft size={20} weight="bold" />
              <span className="font-medium">返回</span>
            </button>
            <h1 className="text-xl font-bold text-stone-900 dark:text-white">任务管理</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === 'list'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
              }`}
            >
              <FolderSimple size={18} />
              项目
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === 'calendar'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
              }`}
            >
              <Calendar size={18} />
              日历
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        {activeView === 'list' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
            {/* 侧边栏 - 项目列表 */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-stone-100 bg-white p-4 shadow-xl shadow-stone-200/50 dark:border-white/5 dark:bg-stone-900 dark:shadow-none">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    项目
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProject(null)
                      setNewProjectName('')
                      setNewProjectColor(PROJECT_COLORS[0])
                      setShowProjectModal(true)
                    }}
                    className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  {/* 收件箱 */}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                      selectedProject === null
                        ? 'bg-stone-100 dark:bg-stone-800'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-stone-200 dark:bg-stone-700">
                        <FolderSimple size={14} className="text-stone-600 dark:text-stone-300" />
                      </div>
                      <span className="font-medium text-stone-700 dark:text-stone-200">收件箱</span>
                    </div>
                    <span className="text-xs font-medium text-stone-400">
                      {groupedTasks.inbox.length}
                    </span>
                  </button>

                  {/* 项目列表 */}
                  {projects.map(project => {
                    const hasDateRange = project.start_date || project.end_date
                    const formatDateShort = (dateStr: string | null | undefined) => {
                      if (!dateStr) return ''
                      const date = new Date(dateStr)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }
                    
                    return (
                      <div key={project.id} className="group">
                        <button
                          onClick={() => setSelectedProject(project.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                            selectedProject === project.id
                              ? 'bg-stone-100 dark:bg-stone-800'
                              : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="size-6 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: project.color + '20' }}
                            >
                              <div
                                className="flex size-full items-center justify-center rounded-lg"
                                style={{ color: project.color }}
                              >
                                <FolderSimple size={14} weight="fill" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="block font-medium text-stone-700 dark:text-stone-200 truncate">
                                {project.name}
                              </span>
                              {hasDateRange && (
                                <span className="block text-[10px] text-stone-400 dark:text-stone-500">
                                  {formatDateShort(project.start_date)}{project.start_date && project.end_date ? ' - ' : ''}{formatDateShort(project.end_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-400">
                              {groupedTasks[project.id]?.length || 0}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditProject(project)
                              }}
                              className="rounded p-1 opacity-0 transition hover:bg-stone-200 group-hover:opacity-100 dark:hover:bg-stone-700"
                            >
                              <DotsThree size={14} />
                            </button>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 主内容 - 任务列表 */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-xl shadow-stone-200/50 dark:border-white/5 dark:bg-stone-900 dark:shadow-none">
                <h2 className="mb-6 text-lg font-bold text-stone-900 dark:text-white">
                  {selectedProject 
                    ? projects.find(p => p.id === selectedProject)?.name || '项目'
                    : '收件箱'
                  }
                </h2>

                <div className="space-y-2">
                  {(selectedProject ? groupedTasks[selectedProject] : groupedTasks.inbox)?.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projects={projects}
                      onToggle={() => toggleTask(task.id)}
                      onUpdateProject={(projectId) => updateTaskProject(task.id, projectId)}
                      onUpdateDueDate={(date) => updateTaskDueDate(task.id, date)}
                    />
                  ))}

                  {(selectedProject ? groupedTasks[selectedProject] : groupedTasks.inbox)?.length === 0 && (
                    <div className="py-12 text-center">
                      <FolderSimple size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                      <p className="text-stone-500 dark:text-stone-400">暂无任务</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 日历视图 */
          <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-xl shadow-stone-200/50 dark:border-white/5 dark:bg-stone-900 dark:shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                >
                  上月
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                >
                  今天
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                >
                  下月
                </button>
              </div>
            </div>

            {/* 星期标题 */}
            <div className="mb-2 grid grid-cols-7 gap-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="py-2 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历网格 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarData.map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === currentMonth.getMonth()
                const isToday = day.date.toDateString() === new Date().toDateString()
                const dayStr = day.date.toISOString().split('T')[0]
                
                // 检查该日期处于哪些项目的时间段内
                const activeProjects = projects.filter(p => {
                  if (!p.start_date && !p.end_date) return false
                  const startDate = p.start_date ? p.start_date.split('T')[0] : null
                  const endDate = p.end_date ? p.end_date.split('T')[0] : null
                  
                  if (startDate && endDate) {
                    return dayStr >= startDate && dayStr <= endDate
                  } else if (startDate) {
                    return dayStr >= startDate
                  } else if (endDate) {
                    return dayStr <= endDate
                  }
                  return false
                })
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] rounded-xl border p-2 transition ${
                      isCurrentMonth
                        ? 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800'
                        : 'border-transparent bg-stone-50 opacity-50 dark:bg-stone-900'
                    } ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                  >
                    <div className={`mb-1 text-sm font-medium ${
                      isToday ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* 项目时间条 */}
                    {activeProjects.length > 0 && (
                      <div className="mb-1 space-y-0.5">
                        {activeProjects.slice(0, 2).map(project => {
                          const startDate = project.start_date ? project.start_date.split('T')[0] : null
                          const endDate = project.end_date ? project.end_date.split('T')[0] : null
                          const isStart = startDate === dayStr
                          const isEnd = endDate === dayStr
                          
                          return (
                            <div
                              key={project.id}
                              className={`h-1.5 ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''} ${!isStart && !isEnd ? '' : ''}`}
                              style={{ backgroundColor: project.color }}
                              title={`${project.name}${startDate ? ` (${startDate}` : ''}${endDate ? ` - ${endDate})` : startDate ? ')' : ''}`}
                            />
                          )
                        })}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {day.tasks.slice(0, 2).map(task => {
                        const project = projects.find(p => p.id === task.project_id)
                        return (
                          <div
                            key={task.id}
                            className="truncate rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: project ? project.color + '20' : '#e5e7eb',
                              color: project ? project.color : '#6b7280',
                            }}
                          >
                            {task.text}
                          </div>
                        )
                      })}
                      {day.tasks.length > 2 && (
                        <div className="text-xs text-stone-400">+{day.tasks.length - 2} 更多</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 项目创建/编辑模态框 */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {editingProject ? '编辑项目' : '新建项目'}
              </h3>
              <button
                onClick={() => {
                  setShowProjectModal(false)
                  setEditingProject(null)
                }}
                className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称..."
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-stone-600 dark:bg-stone-700 dark:text-white dark:focus:ring-amber-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  项目颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className={`size-8 rounded-full transition ${
                        newProjectColor === color ? 'ring-2 ring-offset-2 ring-stone-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* 项目时间段 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  项目时间段
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">开始日期</label>
                    <input
                      type="date"
                      value={newProjectStartDate}
                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-400 dark:border-stone-600 dark:bg-stone-700 dark:text-white dark:[color-scheme:dark]"
                    />
                  </div>
                  <span className="mt-5 text-stone-400">→</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">截止日期</label>
                    <input
                      type="date"
                      value={newProjectEndDate}
                      onChange={(e) => setNewProjectEndDate(e.target.value)}
                      min={newProjectStartDate}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-400 dark:border-stone-600 dark:bg-stone-700 dark:text-white dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {editingProject && (
                <button
                  onClick={() => {
                    deleteProject(editingProject.id)
                    setShowProjectModal(false)
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  删除项目
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => {
                  setShowProjectModal(false)
                  setEditingProject(null)
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={editingProject ? updateProject : createProject}
                disabled={!newProjectName.trim()}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProject ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 任务行组件
type TaskRowProps = {
  task: Task
  projects: Project[]
  onToggle: () => void
  onUpdateProject: (projectId: string | null) => void
  onUpdateDueDate: (date: string | null) => void
}

const TaskRow = ({ task, projects, onToggle, onUpdateProject, onUpdateDueDate }: TaskRowProps) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const priorityStyle = task.priority ? PRIORITY_MAP[task.priority] : null
  const project = projects.find(p => p.id === task.project_id)

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 transition hover:border-stone-200 hover:shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600">
      <button onClick={onToggle} className="flex-none">
        {task.completed ? (
          <CheckCircle size={22} weight="fill" className="text-emerald-500" />
        ) : (
          <Circle size={22} className="text-stone-300 dark:text-stone-600" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`font-medium ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-100'}`}>
          {task.text}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {priorityStyle && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityStyle.bg} ${priorityStyle.color}`}>
              {priorityStyle.label}
            </span>
          )}
          {task.tags?.map(tag => (
            <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 dark:bg-stone-700 dark:text-stone-300">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 项目选择 */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-700"
            style={project ? { color: project.color } : {}}
          >
            <FolderSimple size={14} weight={project ? 'fill' : 'regular'} />
            {project?.name || '无项目'}
          </button>
          
          {showProjectMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-800">
              <button
                onClick={() => {
                  onUpdateProject(null)
                  setShowProjectMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                <FolderSimple size={14} />
                收件箱
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onUpdateProject(p.id)
                    setShowProjectMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700"
                  style={{ color: p.color }}
                >
                  <FolderSimple size={14} weight="fill" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 日期选择 */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-stone-100 dark:hover:bg-stone-700 ${
              task.due_date ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
            }`}
          >
            <CalendarBlank size={14} />
            {task.due_date ? new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '设置日期'}
          </button>

          {showDatePicker && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-xl border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-800">
              <input
                type="date"
                value={task.due_date?.split('T')[0] || ''}
                onChange={(e) => {
                  onUpdateDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)
                  setShowDatePicker(false)
                }}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-700"
              />
              {task.due_date && (
                <button
                  onClick={() => {
                    onUpdateDueDate(null)
                    setShowDatePicker(false)
                  }}
                  className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  清除日期
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoFullPage

