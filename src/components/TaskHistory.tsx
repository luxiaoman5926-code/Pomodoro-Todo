import { CheckCircle, Clock } from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'
import TomatoProgress from './TomatoProgress'
import type { Task } from '../types'

type TaskHistoryProps = {
  tasks: Task[]
  isLoading: boolean
}

const TaskHistory = ({ tasks, isLoading }: TaskHistoryProps) => {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '未知日期'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <ThemedCard label="任务历史" title="已完成任务" meta="查看你的成就">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-600 dark:border-white/20 dark:border-t-white/60" />
            <p className="text-sm text-stone-400 dark:text-white/40">加载中...</p>
          </div>
        </div>
      </ThemedCard>
    )
  }

  if (tasks.length === 0) {
    return (
      <ThemedCard label="任务历史" title="已完成任务" meta="查看你的成就">
        <div className="flex flex-col items-center justify-center py-12 text-stone-300 dark:text-white/20">
          <div className="mb-4 rounded-full bg-stone-50 p-6 dark:bg-white/5">
            <CheckCircle size={48} weight="duotone" />
          </div>
          <p className="text-sm font-medium text-stone-400 dark:text-white/40">
            还没有完成的任务
          </p>
          <p className="mt-1 text-xs text-stone-300 dark:text-white/30">
            完成第一个任务后，它会出现在这里
          </p>
        </div>
      </ThemedCard>
    )
  }

  return (
    <ThemedCard label="任务历史" title="已完成任务" meta={`共 ${tasks.length} 个已完成任务`}>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-4 transition-all hover:border-stone-300 hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
          >
            <CheckCircle
              className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
              weight="fill"
              size={20}
            />
            <div className="flex-1 min-w-0">
              <p className="mb-1 font-medium text-stone-700 line-through decoration-stone-300 dark:text-white/80 dark:decoration-white/40">
                {task.text}
              </p>
              <div className="flex items-center gap-4 text-xs text-stone-400 dark:text-white/50">
                <div className="flex items-center gap-1">
                  <Clock size={12} weight="duotone" />
                  <span>{formatDate(task.completed_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TomatoProgress count={task.pomodoros || 0} size={16} />
                  <span className="text-stone-500 dark:text-white/60">
                    {task.pomodoros || 0} 个番茄钟
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ThemedCard>
  )
}

export default TaskHistory

