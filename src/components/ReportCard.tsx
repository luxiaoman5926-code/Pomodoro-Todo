import { Calendar, Clock, Target, TrendUp } from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'
import type { ReportData } from '../types'

type ReportCardProps = {
  report: ReportData
  title: string
}

const ReportCard = ({ report, title }: ReportCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <ThemedCard label={title} title="数据概览" meta={`${report.startDate} 至 ${report.endDate}`}>
      {/* 关键指标 */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-stone-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-stone-400 dark:text-white/40">
            <Target size={16} weight="duotone" />
            <span className="text-xs font-medium">完成番茄钟</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            {report.totalPomodoros}
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-stone-400 dark:text-white/40">
            <Clock size={16} weight="duotone" />
            <span className="text-xs font-medium">专注时长</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            {report.totalMinutes}
            <span className="ml-1 text-sm font-normal text-stone-500 dark:text-white/60">分钟</span>
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-stone-400 dark:text-white/40">
            <TrendUp size={16} weight="duotone" />
            <span className="text-xs font-medium">日均专注</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            {report.averagePerDay}
            <span className="ml-1 text-sm font-normal text-stone-500 dark:text-white/60">分钟</span>
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-stone-400 dark:text-white/40">
            <Calendar size={16} weight="duotone" />
            <span className="text-xs font-medium">效率最高时段</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            {formatHour(report.peakHour)}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-white/60">
            {report.peakHourCount} 次专注
          </p>
        </div>
      </div>

      {/* 每日明细 */}
      {report.period !== 'day' && (
        <div className="space-y-2">
          <h3 className="mb-3 text-sm font-semibold text-stone-700 dark:text-white/80">
            每日明细
          </h3>
          <div className="custom-scrollbar space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '280px' }}>
            {[...report.dailyBreakdown].reverse().map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-stone-600 dark:text-white/70">
                  {formatDate(day.date)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-stone-500 dark:text-white/50">
                  {day.pomodoros} 个番茄钟
                </span>
                <span className="font-medium text-stone-700 dark:text-white/80">
                  {day.minutes} 分钟
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </ThemedCard>
  )
}

export default ReportCard

