import { useMemo } from 'react'
import type { HeatmapDataPoint } from '../types'

type HeatmapProps = {
  data: HeatmapDataPoint[]
}

const Heatmap = ({ data }: HeatmapProps) => {
  // 获取当月第一天是周几，用于补前面的空位
  const startOffset = useMemo(() => {
    if (data.length === 0) return 0
    const firstDate = new Date(data[0].date)
    return firstDate.getDay()
  }, [data])

  // 获取颜色类名
  const getColorClass = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-stone-100 dark:bg-white/5'
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-900/40'
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-700/60'
      case 3:
        return 'bg-emerald-600 dark:bg-emerald-600'
      case 4:
        return 'bg-emerald-800 dark:bg-emerald-500'
      default:
        return 'bg-stone-100 dark:bg-white/5'
    }
  }

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 星期头 */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-stone-400 dark:text-white/40">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 填充空白 */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* 数据点 */}
        {data.map((point) => {
          const date = new Date(point.date)
          const isToday = date.toDateString() === new Date().toDateString()
          return (
            <div
              key={point.date}
              className={`group relative aspect-square rounded-md transition-all hover:scale-105 hover:z-10 ${getColorClass(
                point.level
              )} ${isToday ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
            >
              {/* 日期数字 */}
              <span className={`absolute left-0.5 top-0.5 text-[10px] font-medium ${
                point.level > 2 ? 'text-emerald-50 dark:text-emerald-900' : 'text-stone-400 dark:text-white/30'
              }`}>
                {date.getDate()}
              </span>

              {/* 悬停提示 */}
              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-20 dark:bg-white dark:text-graphite">
                {point.date}
                <br />
                {point.count} 分钟
              </div>
            </div>
          )
        })}
      </div>

      {/* 图例 */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-stone-400 dark:text-white/40">
        <span>少</span>
        <div className="flex gap-1">
          <div className="size-3 rounded-sm bg-stone-100 dark:bg-white/5" />
          <div className="size-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
          <div className="size-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" />
          <div className="size-3 rounded-sm bg-emerald-600 dark:bg-emerald-600" />
          <div className="size-3 rounded-sm bg-emerald-800 dark:bg-emerald-500" />
        </div>
        <span>多</span>
      </div>
    </div>
  )
}

export default Heatmap
