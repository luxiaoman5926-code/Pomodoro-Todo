import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { UserSettings } from '../types'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  focus_duration: 25 * 60,
  short_break_duration: 5 * 60,
  long_break_duration: 20 * 60,
  cycles_before_long_break: 4,
  auto_start_focus: false,
  auto_start_break: false,
  white_noise_type: 'rain',
  white_noise_volume: 0.5,
  notification_sound: 'default',
  tag_color_mode: 'colorful',
}

export const useSettings = (userId: string | null) => {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取设置
  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // 如果未找到设置（可能是新用户），创建默认设置
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert([{ user_id: userId, ...DEFAULT_SETTINGS }])
            .select()
            .single()

          if (insertError) {
            console.error('Error creating default settings:', insertError)
          } else {
            setSettings(newData)
          }
        } else {
          console.error('Error fetching settings:', error)
        }
      } else {
        // 合并默认值，防止新字段（如 tag_color_mode）在旧数据中缺失
        setSettings({ ...DEFAULT_SETTINGS, ...data })
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // 更新设置
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!userId) return

    // 乐观更新
    setSettings((prev) => (prev ? { ...prev, ...newSettings } : null))

    const { error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating settings:', error)
      console.error('Failed payload:', newSettings)
      // 如果出错，重新获取以回滚
      fetchSettings()
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    updateSettings,
    // 如果还没有加载完成或者没有设置，使用默认值
    currentSettings: settings || (userId ? { user_id: userId, updated_at: '', ...DEFAULT_SETTINGS } : null),
  }
}

