import { useState } from 'react'
import { Spinner } from '@phosphor-icons/react'
import Heatmap from './Heatmap'
import ReportCard from './ReportCard'
import TaskHistory from './TaskHistory'
import { useStatistics } from '../hooks/useStatistics'

type StatisticsProps = {
  userId: string
}

const Statistics = ({ userId }: StatisticsProps) => {
  const { heatmapData, dailyReport, weeklyReport, monthlyReport, completedTasks, isLoading } = useStatistics({
    userId,
  })

  const [reportRange, setReportRange] = useState<'day' | 'week' | 'month'>('week')

  const currentReport =
    reportRange === 'day'
      ? dailyReport
      : reportRange === 'week'
      ? weeklyReport
      : monthlyReport

  const reportTitle =
    reportRange === 'day' ? '今日统计' : reportRange === 'week' ? '本周统计' : '本月统计'

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={40} weight="duotone" className="animate-spin text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-white/50">加载统计数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 热力图 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">专注热力图</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-white/50">
            本月专注记录
          </p>
        </div>
        <Heatmap data={heatmapData} />
      </div>

      {/* 报表 */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex rounded-lg bg-stone-100 p-1 dark:bg-white/5">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setReportRange(range)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  reportRange === range
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-stone-500 hover:text-stone-700 dark:text-white/40 dark:hover:text-white/70'
                }`}
              >
                {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>

        {currentReport ? (
          <ReportCard report={currentReport} title={reportTitle} />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-stone-400 dark:text-white/40">暂无数据</p>
          </div>
        )}
      </div>

      {/* 任务历史 */}
      <TaskHistory tasks={completedTasks} isLoading={isLoading} />
    </div>
  )
}

export default Statistics

