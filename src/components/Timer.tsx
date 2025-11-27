import { useEffect, useState, useRef, useMemo } from 'react'
import { Coffee, Pause, Play, ArrowCounterClockwise, SkipForward, Sun, Target, Plus, Minus } from '@phosphor-icons/react'
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
    bgClass: 'bg-stone-100 dark:bg-white/5',
    progressClass: 'bg-stone-900 dark:bg-fog',
    buttonClass: 'bg-stone-900 hover:bg-black dark:bg-fog dark:text-coal dark:hover:bg-white/90',
  },
  shortBreak: {
    icon: Coffee,
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
    progressClass: 'bg-emerald-500 dark:bg-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400',
  },
  longBreak: {
    icon: Sun,
    bgClass: 'bg-amber-50 dark:bg-amber-500/10',
    progressClass: 'bg-amber-500 dark:bg-amber-400',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400',
  },
}

const Timer = () => {
  const { selectedTask, onPomodoroComplete, userId, registerTimerControls, settings } = usePomodoroContext()
  
  // 将用户设置转换为番茄钟配置
  // 使用 useMemo 防止不必要的重新渲染导致配置对象变化
  const config = useMemo(() => settings ? {
    focusDuration: settings.focus_duration,
    shortBreakDuration: settings.short_break_duration,
    longBreakDuration: settings.long_break_duration,
    cyclesBeforeLongBreak: settings.cycles_before_long_break,
  } : undefined, [settings])

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
    adjustSeconds,
    setTime,
    secondsLeft,
  } = usePomodoro({ 
    config,
    onFocusComplete: onPomodoroComplete,
    userId: userId || undefined,
    taskId: selectedTask?.id || undefined,
    settings,
  })

  // 编辑时间状态
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 注册控制函数供快捷键使用
  useEffect(() => {
    registerTimerControls({ toggle })
  }, [toggle, registerTimerControls])

  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditingTime])

  const handleTimeDoubleClick = () => {
    if (!isRunning) {
      const minutes = Math.floor(secondsLeft / 60).toString()
      setEditValue(minutes)
      setIsEditingTime(true)
    }
  }

  const handleTimeSave = () => {
    const minutes = parseInt(editValue)
    if (!isNaN(minutes) && minutes > 0) {
      setTime(minutes * 60)
    }
    setIsEditingTime(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeSave()
    } else if (e.key === 'Escape') {
      setIsEditingTime(false)
    }
  }

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
              ? 'bg-stone-900 text-white dark:bg-fog dark:text-coal'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
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
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
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
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
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
                ? 'bg-stone-900 dark:bg-fog scale-100'
                : index === pomodorosInCurrentRound && phase === 'focus'
                  ? 'bg-stone-400 dark:bg-fog/50 scale-110 animate-pulse'
                  : 'bg-stone-200 dark:bg-white/10 scale-100'
            }`}
          />
        ))}
      </div>

      {/* 倒计时区域 */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="mb-2 flex items-center gap-2">
          <PhaseIcon 
            size={24} 
            weight="duotone"
            className={`${
              phase === 'focus' 
                ? 'text-stone-600 dark:text-mist' 
                : phase === 'shortBreak'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
            }`}
          />
        </div>

        <div className="group relative flex items-center gap-4">
          {/* 减时按钮 */}
          <button
            onClick={() => adjustSeconds(-60)}
            className={`p-2 text-stone-300 transition-all hover:scale-110 hover:text-stone-500 dark:text-white/10 dark:hover:text-white/40 ${isRunning ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
            title="减少 1 分钟"
          >
            <Minus size={24} weight="bold" />
          </button>

          {isEditingTime ? (
            <div className="flex items-center justify-center text-8xl font-black tracking-tighter text-stone-900 dark:text-fog">
               <input
                 ref={inputRef}
                 type="number"
                 value={editValue}
                 onChange={(e) => setEditValue(e.target.value)}
                 onBlur={handleTimeSave}
                 onKeyDown={handleKeyDown}
                 className="w-48 bg-transparent text-center outline-none placeholder:text-stone-200 dark:placeholder:text-white/10"
                 placeholder="25"
               />
               <span className="text-4xl text-stone-300 ml-2 dark:text-white/20">m</span>
            </div>
          ) : (
            <div 
              onDoubleClick={handleTimeDoubleClick}
              className={`cursor-pointer select-none text-8xl font-black tracking-tighter text-stone-900 transition-all dark:text-fog tabular-nums ${!isRunning ? 'hover:scale-105 hover:text-stone-700 dark:hover:text-white' : ''}`}
              title={!isRunning ? "双击修改时长" : ""}
            >
              {formattedTime}
            </div>
          )}

          {/* 加时按钮 */}
          <button
            onClick={() => adjustSeconds(60)}
            className={`p-2 text-stone-300 transition-all hover:scale-110 hover:text-stone-500 dark:text-white/10 dark:hover:text-white/40 ${isRunning ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
             title="增加 1 分钟"
          >
            <Plus size={24} weight="bold" />
          </button>
        </div>
        
        <p
          className={`mt-2 mb-8 font-medium text-stone-400 dark:text-mist ${isRunning ? 'animate-pulse' : ''}`}
        >
          {isEditingTime ? '按 Enter 确认，Esc 取消' : phaseHint}
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
      <div className="grid grid-cols-4 gap-3 px-1">
        {/* 主按钮：开始/暂停 */}
        <button
          type="button"
          onClick={toggle}
          className={`col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-lg shadow-stone-900/20 transition-all active:scale-95 hover:-translate-y-0.5 dark:shadow-none ${currentStyle.buttonClass}`}
        >
          {isRunning ? (
            <>
              <Pause size={20} weight="fill" /> 暂停
            </>
          ) : (
            <>
              <Play size={20} weight="fill" /> 开始
            </>
          )}
        </button>

        {/* 跳过按钮 */}
        <button
          type="button"
          onClick={skip}
          className="col-span-1 flex h-14 items-center justify-center gap-1 rounded-2xl bg-stone-100 font-bold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
          title="跳过当前阶段"
        >
          <SkipForward size={20} weight="bold" />
        </button>

        {/* 重置按钮 */}
        <button
          type="button"
          onClick={reset}
          className="col-span-1 flex h-14 items-center justify-center gap-1 rounded-2xl bg-stone-100 font-bold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
          title="重置当前阶段"
        >
          <ArrowCounterClockwise size={20} weight="bold" />
        </button>
      </div>

      {/* 当前专注任务 */}
      {selectedTask && phase === 'focus' && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-amber-500/10 dark:bg-amber-500/10">
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <div className="flex size-8 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Target size={16} weight="duotone" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-stone-900 dark:text-fog">
                {selectedTask.text}
              </span>
              <span className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80">
                正在进行第 {selectedTask.pomodoros || 0} 个番茄钟
              </span>
            </div>
          </div>
          <div className="flex flex-none items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-400">
            <span>{selectedTask.pomodoros || 0}/4</span>
            <span>🍅</span>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <p className="mt-4 text-center text-xs text-stone-400 dark:text-mist">
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
