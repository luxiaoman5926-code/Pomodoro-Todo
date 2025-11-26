import { useEffect, useRef, useState } from 'react'
import { CloudRain, Coffee, Flame, VolumeX } from 'lucide-react'

type SoundId = 'rain' | 'fire' | 'cafe' | 'none'

const SOUNDS = [
  {
    id: 'rain',
    icon: CloudRain,
    label: '雨声',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  },
  {
    id: 'fire',
    icon: Flame,
    label: '篝火',
    url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg',
  },
  {
    id: 'cafe',
    icon: Coffee,
    label: '咖啡馆',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
  },
] as const

type NoisePlayerProps = {
  isRunning: boolean
}

const NoisePlayer = ({ isRunning }: NoisePlayerProps) => {
  const [selected, setSelected] = useState<SoundId>('none')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // 清除之前的渐弱定时器
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }

    const playSound = async () => {
      try {
        const sound = SOUNDS.find((s) => s.id === selected)
        if (!sound) {
          // 如果选中了静音，或者是无效ID
          if (!audio.paused) {
            startFadeOut(audio)
          }
          return
        }

        // 如果已经在播放且 URL 没变，什么都不做（除非之前是暂停的）
        // 如果 URL 变了，或者之前暂停了，需要播放
        if (audio.src !== sound.url) {
          audio.src = sound.url
          audio.load()
        }

        if (isRunning) {
          audio.volume = 1
          audio.loop = true
          await audio.play()
        } else {
          // 如果没在运行，但选了声音，确保是停止状态
          if (!audio.paused) {
            startFadeOut(audio)
          }
        }
      } catch (error) {
        console.error('Audio playback failed:', error)
        // 简单的错误处理：重置为静音，防止 UI 卡在播放状态
        setSelected('none')
      }
    }

    playSound()

    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current)
      }
    }
  }, [isRunning, selected])

  const startFadeOut = (audio: HTMLAudioElement) => {
    // 如果已经暂停，直接返回
    if (audio.paused) return

    fadeIntervalRef.current = window.setInterval(() => {
      if (audio.volume > 0.05) {
        audio.volume -= 0.05
      } else {
        audio.volume = 0
        audio.pause()
        if (fadeIntervalRef.current) {
          window.clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        // 重置音量以便下次播放
        audio.volume = 1
      }
    }, 100)
  }

  return (
    <div className="mb-6 flex justify-center gap-4">
      {/* 音频元素 */}
      <audio ref={audioRef} onError={() => setSelected('none')} />

      {/* 按钮组 */}
      <button
        onClick={() => setSelected('none')}
        className={`flex size-10 items-center justify-center rounded-full transition-all ${
          selected === 'none'
            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20 dark:bg-white dark:text-stone-900'
            : 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white'
        }`}
        aria-label="静音"
        title="静音"
      >
        <VolumeX size={18} />
      </button>

      {SOUNDS.map((sound) => (
        <button
          key={sound.id}
          onClick={() => setSelected(sound.id as SoundId)}
          className={`flex size-10 items-center justify-center rounded-full transition-all ${
            selected === sound.id
              ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20 dark:bg-white dark:text-stone-900'
              : 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white'
          }`}
          aria-label={sound.label}
          title={sound.label}
        >
          <sound.icon size={18} />
        </button>
      ))}
    </div>
  )
}

export default NoisePlayer

