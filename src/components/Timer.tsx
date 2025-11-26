import { Coffee, Pause, Play, RotateCcw, SkipForward, Sun, Target } from 'lucide-react'
import { usePomodoro } from '../hooks/usePomodoro'
import { usePomodoroContext } from '../hooks/usePomodoroContext'
import type { PomodoroPhase } from '../types'
import NoisePlayer from './NoisePlayer'
import ThemedCard from './ThemedCard'

// 阶段对应的图标和颜色配置
const PHASE_STYLES: Record<PomodoroPhase, {
  icon: typeof Target
  bgClass: string
  progressClass: string
  buttonClass: string
}> = {
  focus: {
    icon: Target,
    bgClass: 'bg-stone-100 dark:bg-white/10',
    progressClass: 'bg-stone-900 dark:bg-white',
    buttonClass: 'bg-stone-900 hover:bg-black dark:bg-white dark:text-graphite dark:hover:bg-fog/90',
  },
  shortBreak: {
    icon: Coffee,
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    progressClass: 'bg-emerald-500 dark:bg-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400',
  },
  longBreak: {
    icon: Sun,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    progressClass: 'bg-amber-500 dark:bg-amber-400',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400',
  },
}

const Timer = () => {
  const { selectedTask, onPomodoroComplete } = usePomodoroContext()
  
  const {
    phase,
    phaseLabel,
    phaseHint,
    formattedTime,
    isRunning,
    progress,
    completedPomodoros,
    pomodorosInCurrentRound,
    cyclesBeforeLongBreak,
    toggle,
    reset,
    skip,
    switchPhase,
  } = usePomodoro({ onFocusComplete: onPomodoroComplete })

  const currentStyle = PHASE_STYLES[phase]
  const PhaseIcon = currentStyle.icon

  return (
    <ThemedCard
      label="番茄钟"
      title={phaseLabel}
      meta={`已完成 ${completedPomodoros} 个番茄钟`}
    >
      {/* 阶段切换标签 */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => switchPhase('focus')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            phase === 'focus'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-graphite'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
          }`}
        >
          专注
        </button>
        <button
          type="button"
          onClick={() => switchPhase('shortBreak')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            phase === 'shortBreak'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
          }`}
        >
          短休息
        </button>
        <button
          type="button"
          onClick={() => switchPhase('longBreak')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            phase === 'longBreak'
              ? 'bg-amber-600 text-white dark:bg-amber-500'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
          }`}
        >
          长休息
        </button>
      </div>

      {/* 番茄钟进度指示器 */}
      <div className="mb-6 flex justify-center gap-2">
        {Array.from({ length: cyclesBeforeLongBreak }).map((_, index) => (
          <div
            key={index}
            className={`h-3 w-3 rounded-full transition-all ${
              index < pomodorosInCurrentRound
                ? 'bg-stone-900 dark:bg-white scale-100'
                : index === pomodorosInCurrentRound && phase === 'focus'
                  ? 'bg-stone-400 dark:bg-white/50 scale-110 animate-pulse'
                  : 'bg-stone-200 dark:bg-white/20 scale-100'
            }`}
          />
        ))}
      </div>

      {/* 倒计时区域 */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="mb-2 flex items-center gap-2">
          <PhaseIcon 
            size={24} 
            className={`${
              phase === 'focus' 
                ? 'text-stone-600 dark:text-white/70' 
                : phase === 'shortBreak'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
            }`}
          />
        </div>
        <div className="text-8xl font-black tracking-tighter text-stone-900 transition-colors dark:text-white tabular-nums">
          {formattedTime}
        </div>
        <p
          className={`mt-2 font-medium text-stone-400 dark:text-white/60 ${isRunning ? 'animate-pulse' : ''}`}
        >
          {phaseHint}
        </p>
      </div>

      {/* 白噪声播放器 - 仅在专注阶段显示 */}
      {phase === 'focus' && <NoisePlayer isRunning={isRunning} />}

      {/* 进度条 */}
      <div className={`mb-8 h-2 w-full overflow-hidden rounded-full ${currentStyle.bgClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${currentStyle.progressClass}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 按钮组 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 主按钮：开始/暂停 */}
        <button
          type="button"
          onClick={toggle}
          className={`col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-lg shadow-stone-900/20 transition-transform active:scale-95 dark:shadow-none ${currentStyle.buttonClass}`}
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

        {/* 跳过按钮 */}
        <button
          type="button"
          onClick={skip}
          className="col-span-1 flex h-14 items-center justify-center gap-1 rounded-2xl bg-stone-100 font-bold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          title="跳过当前阶段"
        >
          <SkipForward size={20} />
        </button>

        {/* 重置按钮 */}
        <button
          type="button"
          onClick={reset}
          className="col-span-1 flex h-14 items-center justify-center gap-1 rounded-2xl bg-stone-100 font-bold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          title="重置当前阶段"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* 当前专注任务 */}
      {selectedTask && phase === 'focus' && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2 dark:bg-amber-900/20">
          <Target size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300 truncate max-w-[200px]">
            {selectedTask.text}
          </span>
          <span className="text-xs text-amber-500 dark:text-amber-400/70">
            ({selectedTask.pomodoros || 0}/4 🍅)
          </span>
        </div>
      )}

      {/* 提示信息 */}
      <p className="mt-4 text-center text-xs text-stone-400 dark:text-white/40">
        {phase === 'focus' 
          ? selectedTask 
            ? `正在为「${selectedTask.text}」专注` 
            : '在右侧选择一个任务开始专注'
          : phase === 'shortBreak'
            ? '短暂休息，起身活动一下吧'
            : '好好放松，为下一轮做准备'}
      </p>
    </ThemedCard>
  )
}

export default Timer
