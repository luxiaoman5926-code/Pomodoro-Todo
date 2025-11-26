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

  // 获取当月的热力图数据
  const fetchHeatmapData = async () => {
    const today = new Date()
    // 获取当月第一天
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDateStr = startOfMonth.toISOString().split('T')[0]

    // 使用 RPC 优化数据获取
    const { data, error } = await supabase
      .rpc('get_heatmap_data', {
        p_user_id: userId,
        p_start_date: startDateStr
      })

    if (error) {
      // 如果 RPC 失败（可能是旧版本），降级到普通查询
      console.warn('RPC get_heatmap_data failed, falling back to normal query:', error)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('pomodoro_sessions')
        .select('date, duration_seconds')
        .eq('user_id', userId)
        .eq('phase', 'focus')
        .gte('date', startDateStr)
        .order('date', { ascending: true })

      if (fallbackError) {
        console.error('Error fetching heatmap data:', fallbackError)
        return
      }

      processHeatmapData(fallbackData || [], true)
      return
    }

    processHeatmapData(data || [], false)
  }

  // 处理热力图数据
  const processHeatmapData = (data: any[], isRaw: boolean) => {
    const today = new Date()
    // 获取当月第一天
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    // 获取当月最后一天
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    // 按日期聚合数据
    const dateMap = new Map<string, number>()
    
    if (isRaw) {
      // 处理原始会话数据
      data.forEach((session) => {
        const date = session.date
        const minutes = Math.floor(session.duration_seconds / 60)
        dateMap.set(date, (dateMap.get(date) || 0) + minutes)
      })
    } else {
      // 处理 RPC 聚合数据
      data.forEach((item) => {
        dateMap.set(item.date, item.duration_minutes)
      })
    }

    // 生成当月的所有日期
    const allDates: HeatmapDataPoint[] = []
    
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = dateMap.get(dateStr) || 0
      
      // 计算等级 (0-4) 基于该天的专注时长
      // 0: 0分钟, 1: 1-15分钟, 2: 16-30分钟, 3: 31-60分钟, 4: 60+分钟
      let level = 0
      if (count > 0) {
        if (count <= 15) level = 1
        else if (count <= 30) level = 2
        else if (count <= 60) level = 3
        else level = 4
      }

      allDates.push({
        date: dateStr,
        count,
        level,
      })
    }

    setHeatmapData(allDates)
  }

  // 获取日报表数据
  const fetchDailyReport = async () => {
    const today = new Date()
    const dayStart = new Date(today)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(today)
    dayEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('date, duration_seconds, completed_at')
      .eq('user_id', userId)
      .eq('phase', 'focus')
      .gte('completed_at', dayStart.toISOString())
      .lte('completed_at', dayEnd.toISOString())
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('Error fetching daily report:', error)
      return
    }

    if (!data) return

    const report = calculateReportData(data, 'day', dayStart, dayEnd)
    setDailyReport(report)
  }

  // 获取周报表数据
  const fetchWeeklyReport = async () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // 本周一
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('date, duration_seconds, completed_at')
      .eq('user_id', userId)
      .eq('phase', 'focus')
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', weekEnd.toISOString())
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('Error fetching weekly report:', error)
      return
    }

    if (!data) return

    const report = calculateReportData(data, 'week', weekStart, weekEnd)
    setWeeklyReport(report)
  }

  // 获取月报表数据
  const fetchMonthlyReport = async () => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('date, duration_seconds, completed_at')
      .eq('user_id', userId)
      .eq('phase', 'focus')
      .gte('completed_at', monthStart.toISOString())
      .lte('completed_at', monthEnd.toISOString())
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('Error fetching monthly report:', error)
      return
    }

    if (!data) return

    const report = calculateReportData(data, 'month', monthStart, monthEnd)
    setMonthlyReport(report)
  }

  // 计算报表数据
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

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const averagePerDay = totalMinutes / daysDiff

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
        fetchHeatmapData(),
        fetchDailyReport(),
        fetchWeeklyReport(),
        fetchMonthlyReport(),
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
        fetchHeatmapData(),
        fetchDailyReport(),
        fetchWeeklyReport(),
        fetchMonthlyReport(),
        fetchCompletedTasks(),
      ]).then(() => setIsLoading(false))
    },
  }
}

