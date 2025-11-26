import { useEffect, useRef } from 'react'
import { CloudRain, Coffee, Fire, SpeakerSimpleX, Tree } from '@phosphor-icons/react'
import { usePomodoroContext } from '../hooks/usePomodoroContext'

type SoundId = 'rain' | 'forest' | 'library' | 'cafe' | 'none'

const SOUNDS = [
  {
    id: 'rain',
    icon: CloudRain,
    label: '雨声',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  },
  {
    id: 'forest',
    icon: Tree,
    label: '森林',
    url: 'https://actions.google.com/sounds/v1/ambiences/daytime_forrest_bonfire.ogg', // 暂用 bonfire 替代 forest
  },
  {
    id: 'library',
    icon: Fire, // 图书馆暂时用火的图标替代
    label: '图书馆',
    url: 'https://actions.google.com/sounds/v1/ambiences/daytime_forrest_bonfire.ogg', // 暂用
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
  const { settings, updateSettings } = usePomodoroContext()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<number | null>(null)

  const selected = (settings?.white_noise_type as SoundId) || 'rain'
  const volume = settings?.white_noise_volume ?? 0.5

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isRunning ? volume : 0
    }
  }, [volume, isRunning])

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
        if (!sound || selected === 'none') {
          if (!audio.paused) {
            startFadeOut(audio)
          }
          return
        }

        // 如果 URL 变了，需要加载
        if (audio.src !== sound.url) {
          audio.src = sound.url
          audio.load()
        }

        if (isRunning) {
          audio.volume = volume
          audio.loop = true
          await audio.play()
        } else {
          if (!audio.paused) {
            startFadeOut(audio)
          }
        }
      } catch (error) {
        console.error('Audio playback failed:', error)
      }
    }

    playSound()

    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current)
      }
    }
  }, [isRunning, selected, volume])

  const startFadeOut = (audio: HTMLAudioElement) => {
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
      }
    }, 100)
  }

  const handleSelect = (id: string) => {
    // 如果点击当前选中的，则取消选择（静音）
    // 或者保持选中，由用户明确点击静音按钮
    // 这里我们保留显式的静音按钮
    updateSettings({ white_noise_type: id })
  }

  return (
    <div className="mb-6 flex justify-center gap-4">
      {/* 音频元素 */}
      <audio ref={audioRef} />

      {/* 按钮组 */}
      <button
        onClick={() => updateSettings({ white_noise_type: 'none' })}
        className={`flex size-10 items-center justify-center rounded-full transition-all ${
          selected === 'none'
            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20 dark:bg-white dark:text-stone-900'
            : 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white'
        }`}
        aria-label="静音"
        title="静音"
      >
        <SpeakerSimpleX size={18} />
      </button>

      {SOUNDS.filter(s => ['rain', 'cafe'].includes(s.id)).map((sound) => (
        <button
          key={sound.id}
          onClick={() => handleSelect(sound.id)}
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

