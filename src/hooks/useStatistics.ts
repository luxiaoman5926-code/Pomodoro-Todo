import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { HeatmapDataPoint, ReportData, Task } from '../types'

type UseStatisticsOptions = {
  userId: string
}

export const useStatistics = ({ userId }: UseStatisticsOptions) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([])
  const [dailyReport, setDailyReport] = useState<ReportData | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<ReportData | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<ReportData | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 统一获取所有报表数据
  const fetchAllSessionData = async () => {
    const today = new Date()
    
    // 计算所需的最小日期范围
    // 1. 月初 (用于月报表和热力图)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    // 2. 本周初 (用于周报表)
    const startOfWeek = new Date(today)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    // 取最早的日期作为查询起点
    const minDate = startOfMonth < startOfWeek ? startOfMonth : startOfWeek
    const minDateStr = minDate.toISOString()

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('date, duration_seconds, completed_at')
      .eq('user_id', userId)
      .eq('phase', 'focus')
      .gte('completed_at', minDateStr)
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('Error fetching session data:', error)
      return
    }

    if (!data) return

    // 在内存中处理各类报表
    processAllReports(data, startOfWeek, startOfMonth)
  }

  const processAllReports = (
    allSessions: any[], 
    startOfWeek: Date, 
    startOfMonth: Date
  ) => {
    const today = new Date()
    
    // 1. 处理热力图 (使用当月数据)
    // 即使 minDate 晚于 startOfMonth (几乎不可能)，也只会显示部分
    // 我们过滤出当月的数据用于热力图
    const monthSessions = allSessions.filter(s => new Date(s.completed_at) >= startOfMonth)
    
    const dateMap = new Map<string, number>()
    monthSessions.forEach((session) => {
      const date = session.date
      const minutes = Math.floor(session.duration_seconds / 60)
      dateMap.set(date, (dateMap.get(date) || 0) + minutes)
    })

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const allDates: HeatmapDataPoint[] = []
    
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = dateMap.get(dateStr) || 0
      let level = 0
      if (count > 0) {
        if (count <= 15) level = 1
        else if (count <= 30) level = 2
        else if (count <= 60) level = 3
        else level = 4
      }
      allDates.push({ date: dateStr, count, level })
    }
    setHeatmapData(allDates)

    // 2. 处理日报表
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    const dailySessions = allSessions.filter(s => {
        const d = new Date(s.completed_at)
        return d >= todayStart && d <= todayEnd
    })
    setDailyReport(calculateReportData(dailySessions, 'day', todayStart, todayEnd))

    // 3. 处理周报表
    const weekEnd = new Date(startOfWeek)
    weekEnd.setDate(startOfWeek.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    const weeklySessions = allSessions.filter(s => {
        const d = new Date(s.completed_at)
        return d >= startOfWeek && d <= weekEnd
    })
    setWeeklyReport(calculateReportData(weeklySessions, 'week', startOfWeek, weekEnd))

    // 4. 处理月报表
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    
    // monthSessions 已经在上面过滤过了，可以直接用
    setMonthlyReport(calculateReportData(monthSessions, 'month', startOfMonth, monthEnd))
  }

  // 计算报表数据 (辅助函数保持不变)
  const calculateReportData = (
    sessions: Array<{ date: string; duration_seconds: number; completed_at: string }>,
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): ReportData => {
    const totalPomodoros = sessions.length
    const totalMinutes = Math.floor(
      sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60
    )

    // 按日期分组
    const dailyMap = new Map<string, { pomodoros: number; minutes: number }>()
    sessions.forEach((session) => {
      const date = session.date
      const minutes = Math.floor(session.duration_seconds / 60)
      const existing = dailyMap.get(date) || { pomodoros: 0, minutes: 0 }
      dailyMap.set(date, {
        pomodoros: existing.pomodoros + 1,
        minutes: existing.minutes + minutes,
      })
    })

    // 生成每日明细
    const dailyBreakdown: Array<{ date: string; pomodoros: number; minutes: number }> = []
    // 注意：这里循环需要 clone startDate，否则会修改原对象
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayData = dailyMap.get(dateStr)
      dailyBreakdown.push({
        date: dateStr,
        pomodoros: dayData?.pomodoros || 0,
        minutes: dayData?.minutes || 0,
      })
    }

    // 计算效率最高的时段
    const hourMap = new Map<number, number>()
    sessions.forEach((session) => {
      const hour = new Date(session.completed_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })

    let peakHour = 0
    let peakHourCount = 0
    hourMap.forEach((count, hour) => {
      if (count > peakHourCount) {
        peakHourCount = count
        peakHour = hour
      }
    })

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    // 避免除以0（虽然这里通常至少是1）
    const safeDaysDiff = daysDiff < 1 ? 1 : daysDiff
    const averagePerDay = totalMinutes / safeDaysDiff

    return {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPomodoros,
      totalMinutes,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
      peakHour,
      peakHourCount,
      dailyBreakdown,
    }
  }

  // 获取已完成的任务历史
  const fetchCompletedTasks = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(50) // 最近50个已完成的任务

    if (error) {
      console.error('Error fetching completed tasks:', error)
      return
    }

    if (data) {
      setCompletedTasks(data as Task[])
    }
  }

  // 加载所有数据
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchAllSessionData(),
        fetchCompletedTasks(),
      ])
      setIsLoading(false)
    }

    if (userId) {
      loadAllData()
    }
  }, [userId])

  return {
    heatmapData,
    dailyReport,
    weeklyReport,
    monthlyReport,
    completedTasks,
    isLoading,
    refresh: () => {
      setIsLoading(true)
      Promise.all([
        fetchAllSessionData(),
        fetchCompletedTasks(),
      ]).then(() => setIsLoading(false))
    },
  }
}

