import { Pause, Play, RotateCcw } from 'lucide-react'
import { usePomodoro } from '../hooks/usePomodoro'
import ThemedCard from './ThemedCard'

const Timer = () => {
  const { formattedTime, isRunning, progress, toggle, reset } =
    usePomodoro()

  return (
    <ThemedCard
      label="番茄钟"
      title="专注阶段"
      meta={`${Math.round(progress * 100)}% 完成`}
    >
      {/* 倒计时区域 */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="text-8xl font-black tracking-tighter text-stone-900 transition-colors dark:text-white tabular-nums">
          {formattedTime}
        </div>
        <p
          className={`mt-2 font-medium text-stone-400 dark:text-white/60 ${isRunning ? 'animate-pulse' : ''}`}
        >
          {isRunning ? '沉浸中...' : '准备开始'}
        </p>
      </div>

      {/* 进度条 */}
      <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-stone-900 transition-all duration-1000 ease-linear dark:bg-white"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 按钮组 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 主按钮：纯黑(浅色) / 白色(暗色) */}
        <button
          type="button"
          onClick={toggle}
          className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-900 font-bold text-white shadow-lg shadow-stone-900/20 transition-transform hover:bg-black active:scale-95 dark:bg-white dark:text-graphite dark:shadow-none dark:hover:bg-fog/90"
        >
          {isRunning ? (
            <>
              <Pause size={20} fill="currentColor" /> 暂停
            </>
          ) : (
            <>
              <Play size={20} fill="currentColor" /> 开始
            </>
          )}
        </button>

        {/* 次要按钮：浅灰(浅色) / 半透明白(暗色) */}
        <button
          type="button"
          onClick={reset}
          className="col-span-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-100 font-bold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <RotateCcw size={20} /> 重置
        </button>
      </div>
    </ThemedCard>
  )
}

export default Timer
