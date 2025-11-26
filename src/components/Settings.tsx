import { useState, useEffect } from 'react'
import { usePomodoroContext } from '../hooks/usePomodoroContext'
import { Clock, Play, SpeakerHigh } from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'

const Settings = () => {
  const { settings, updateSettings } = usePomodoroContext()
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  if (!localSettings) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (key: keyof typeof localSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    updateSettings({ [key]: value })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ThemedCard label="设置" title="个性化配置" meta="自定义你的专注体验">
        {/* 时长设置 */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-white/80">
            <Clock size={18} weight="duotone" className="text-amber-500" />
            时长设置 (分钟)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-stone-500 dark:text-white/50">专注</label>
              <input
                type="number"
                value={localSettings.focus_duration / 60}
                onChange={(e) => handleChange('focus_duration', Math.max(1, Number(e.target.value)) * 60)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-stone-500 dark:text-white/50">短休息</label>
              <input
                type="number"
                value={localSettings.short_break_duration / 60}
                onChange={(e) => handleChange('short_break_duration', Math.max(1, Number(e.target.value)) * 60)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-stone-500 dark:text-white/50">长休息</label>
              <input
                type="number"
                value={localSettings.long_break_duration / 60}
                onChange={(e) => handleChange('long_break_duration', Math.max(1, Number(e.target.value)) * 60)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* 自动开始 */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-white/80">
            <Play size={18} weight="duotone" className="text-emerald-500" />
            自动控制
          </h3>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <span className="text-sm font-medium text-stone-600 dark:text-white/80">休息结束自动开始专注</span>
              <input
                type="checkbox"
                checked={localSettings.auto_start_focus}
                onChange={(e) => handleChange('auto_start_focus', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <span className="text-sm font-medium text-stone-600 dark:text-white/80">专注结束自动开始休息</span>
              <input
                type="checkbox"
                checked={localSettings.auto_start_break}
                onChange={(e) => handleChange('auto_start_break', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        {/* 白噪声 */}
        <div className="mb-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-white/80">
            <SpeakerHigh size={18} weight="duotone" className="text-blue-500" />
            白噪声
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { id: 'rain', label: '雨声' },
              { id: 'forest', label: '森林' },
              { id: 'library', label: '图书馆' },
              { id: 'cafe', label: '咖啡馆' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleChange('white_noise_type', type.id)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  localSettings.white_noise_type === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-500/50 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-white/50">音量</span>
              <span className="text-xs font-bold text-stone-700 dark:text-white/80">
                {Math.round(localSettings.white_noise_volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localSettings.white_noise_volume}
              onChange={(e) => handleChange('white_noise_volume', Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-blue-500 dark:bg-white/10"
            />
          </div>
        </div>
      </ThemedCard>
    </div>
  )
}

export default Settings

