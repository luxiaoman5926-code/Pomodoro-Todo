import { Pause, Play, RefreshCw } from 'lucide-react'
import GlassPanel from './GlassPanel'
import { usePomodoro } from '../hooks/usePomodoro'

const Timer = () => {
  const { formattedTime, isRunning, progress, toggle, reset } = usePomodoro()
  const progressPercent = Math.round(progress * 100)

  return (
    <GlassPanel
      label="番茄钟"
      title="专注阶段"
      meta={`${progressPercent}% 完成`}
      metaClassName="text-sm font-medium text-white/60"
      className="bg-gradient-to-b from-ash/80 to-ash/20"
    >
      <TimerDisplay formattedTime={formattedTime} isRunning={isRunning} />
      <div>
        <TimerProgressBar progressPercent={progressPercent} />
        <TimerControls
          isRunning={isRunning}
          onToggle={toggle}
          onReset={reset}
        />
      </div>
    </GlassPanel>
  )
}

type TimerDisplayProps = {
  formattedTime: string
  isRunning: boolean
}

const TimerDisplay = ({ formattedTime, isRunning }: TimerDisplayProps) => (
  <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-[28px] border border-white/5 bg-black/60">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent)]" />
    <div className="relative flex flex-col items-center gap-2">
      <p className="text-6xl font-semibold tabular-nums text-white drop-shadow-[0_5px_25px_rgba(0,0,0,0.55)]">
        {formattedTime}
      </p>
      <span className="text-xs text-white/50">
        {isRunning ? '沉浸中...' : '准备开始'}
      </span>
    </div>
  </div>
)

const TimerProgressBar = ({ progressPercent }: { progressPercent: number }) => (
  <div className="mb-4 h-2 w-full rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-white transition-all duration-500"
      style={{ width: `${progressPercent}%` }}
    />
  </div>
)

type TimerControlsProps = {
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
}

const TimerControls = ({
  isRunning,
  onToggle,
  onReset,
}: TimerControlsProps) => (
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-semibold text-graphite transition hover:bg-fog/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
    >
      {isRunning ? (
        <>
          <Pause className="size-4" />
          暂停
        </>
      ) : (
        <>
          <Play className="size-4" />
          开始
        </>
      )}
    </button>
    <button
      type="button"
      onClick={onReset}
      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
    >
      <RefreshCw className="size-4" />
      重置
    </button>
  </div>
)

export default Timer

