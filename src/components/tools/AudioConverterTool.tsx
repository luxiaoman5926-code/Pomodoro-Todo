import { useState, useRef, useCallback, useEffect } from 'react'
import { MusicNotes, UploadSimple, DownloadSimple, Spinner, X, Play, Pause } from '@phosphor-icons/react'
import type { ToolProps } from '../../types'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac'

const FORMAT_OPTIONS: Array<{ value: AudioFormat; label: string; mimeType: string }> = [
  { value: 'mp3', label: 'MP3', mimeType: 'audio/mpeg' },
  { value: 'wav', label: 'WAV', mimeType: 'audio/wav' },
  { value: 'ogg', label: 'OGG', mimeType: 'audio/ogg' },
  { value: 'aac', label: 'AAC', mimeType: 'audio/aac' },
  { value: 'flac', label: 'FLAC', mimeType: 'audio/flac' },
]

const AudioConverterTool = ({}: ToolProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState<AudioFormat>('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; blob: Blob; url: string }>>([])
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [audioRefs, setAudioRefs] = useState<Array<HTMLAudioElement | null>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)

  // 加载 FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      ffmpeg.on('log', ({ message }) => {
        console.log(message)
      })

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(progress * 100)
      })

      try {
        await ffmpeg.load()
        setFfmpegLoaded(true)
      } catch (error) {
        console.error('Failed to load FFmpeg:', error)
        alert('FFmpeg加载失败，请刷新页面重试')
      }
    }

    loadFFmpeg()

    return () => {
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate()
      }
    }
  }, [])

  // 清理音频引用和文件 URL
  useEffect(() => {
    return () => {
      audioRefs.forEach(audio => {
        if (audio) {
          audio.pause()
          URL.revokeObjectURL(audio.src)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      convertedFiles.forEach(file => {
        URL.revokeObjectURL(file.url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'))
    setSelectedFiles(prev => [...prev, ...audioFiles])
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const convertAudio = useCallback(async (file: File, index: number): Promise<{ name: string; blob: Blob; url: string }> => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      throw new Error('FFmpeg未加载')
    }

    const ffmpeg = ffmpegRef.current
    const inputFileName = `input_${index}.${file.name.split('.').pop()}`
    const outputFileName = `output_${index}.${targetFormat}`

    // 写入输入文件
    await ffmpeg.writeFile(inputFileName, await fetchFile(file))

    // 构建 FFmpeg 命令
    const format = FORMAT_OPTIONS.find(opt => opt.value === targetFormat)
    if (!format) {
      throw new Error('Unsupported format')
    }

    const args = ['-i', inputFileName]

    // 根据目标格式设置参数
    switch (targetFormat) {
      case 'mp3':
        args.push('-codec:a', 'libmp3lame', '-b:a', bitrate)
        break
      case 'wav':
        args.push('-codec:a', 'pcm_s16le')
        break
      case 'ogg':
        args.push('-codec:a', 'libvorbis', '-b:a', bitrate)
        break
      case 'aac':
        args.push('-codec:a', 'aac', '-b:a', bitrate)
        break
      case 'flac':
        args.push('-codec:a', 'flac')
        break
    }

    args.push('-y', outputFileName)

    // 执行转换
    await ffmpeg.exec(args)

    // 读取输出文件
    const data = await ffmpeg.readFile(outputFileName)
    // FFmpeg readFile 返回 Uint8Array 或 string
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: format.mimeType })
      : new Blob([new Uint8Array(data)], { type: format.mimeType })
    const url = URL.createObjectURL(blob)

    // 清理临时文件
    await ffmpeg.deleteFile(inputFileName)
    await ffmpeg.deleteFile(outputFileName)

    const baseName = file.name.replace(/\.[^/.]+$/, '')
    return {
      name: `${baseName}.${targetFormat}`,
      blob,
      url,
    }
  }, [targetFormat, bitrate, ffmpegLoaded])

  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0 || !ffmpegLoaded) return

    setIsConverting(true)
    setProgress(0)
    setConvertedFiles([])

    try {
      const results: Array<{ name: string; blob: Blob; url: string }> = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const result = await convertAudio(file, i)
        results.push(result)
      }

      setConvertedFiles(results)
      setAudioRefs(new Array(results.length).fill(null))
    } catch (error) {
      console.error('Conversion error:', error)
      alert(error instanceof Error ? error.message : '转换失败')
    } finally {
      setIsConverting(false)
      setProgress(0)
    }
  }, [selectedFiles, convertAudio, ffmpegLoaded])

  const handleDownload = useCallback((file: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(file.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const handlePlay = useCallback((index: number) => {
    // 停止当前播放
    audioRefs.forEach((audio, i) => {
      if (audio && i !== index) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    if (playingIndex === index) {
      // 暂停
      const audio = audioRefs[index]
      if (audio) {
        audio.pause()
        setPlayingIndex(null)
      }
    } else {
      // 播放
      const audio = new Audio(convertedFiles[index].url)
      const newAudioRefs = [...audioRefs]
      newAudioRefs[index] = audio
      setAudioRefs(newAudioRefs)
      audio.play()
      audio.onended = () => setPlayingIndex(null)
      setPlayingIndex(index)
    }
  }, [playingIndex, audioRefs, convertedFiles])

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* FFmpeg 加载状态 */}
        {!ffmpegLoaded && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
            <div className="flex items-center gap-3">
              <Spinner size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                正在加载 FFmpeg 引擎，请稍候...
              </p>
            </div>
          </div>
        )}

        {/* 目标格式选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
            目标格式
          </label>
          <select
            value={targetFormat}
            onChange={e => setTargetFormat(e.target.value as AudioFormat)}
            disabled={!ffmpegLoaded}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          >
            {FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 比特率设置 */}
        {targetFormat !== 'wav' && targetFormat !== 'flac' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
              比特率: {bitrate}
            </label>
            <select
              value={bitrate}
              onChange={e => setBitrate(e.target.value)}
              disabled={!ffmpegLoaded}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
            >
              <option value="128k">128 kbps</option>
              <option value="192k">192 kbps</option>
              <option value="256k">256 kbps</option>
              <option value="320k">320 kbps</option>
            </select>
          </div>
        )}

        {/* 文件上传区域 */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
              : 'border-stone-300 bg-stone-50 dark:border-white/20 dark:bg-ash'
          }`}
        >
          <MusicNotes size={48} className="mx-auto mb-4 text-stone-400 dark:text-mist" weight="duotone" />
          <p className="mb-2 text-base font-medium text-stone-700 dark:text-fog">
            拖拽音频文件到此处或点击选择
          </p>
          <p className="mb-4 text-sm text-stone-500 dark:text-mist">
            支持批量转换
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!ffmpegLoaded}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <UploadSimple size={18} weight="bold" />
            选择音频
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* 已选择文件列表 */}
        {selectedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              已选择音频 ({selectedFiles.length})
            </h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-2 dark:border-white/20 dark:bg-graphite"
                >
                  <span className="truncate text-sm text-stone-700 dark:text-fog">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:hover:bg-white/10 dark:hover:text-red-400"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 转换按钮和进度 */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={handleConvert}
              disabled={isConverting || !ffmpegLoaded}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isConverting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} className="animate-spin" />
                  转换中... {Math.round(progress)}%
                </span>
              ) : (
                `转换 ${selectedFiles.length} 个音频文件`
              )}
            </button>
            {isConverting && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* 转换结果 */}
        {convertedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              转换结果 ({convertedFiles.length})
            </h3>
            <div className="space-y-3">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-white/20 dark:bg-graphite"
                >
                  <span className="truncate text-sm font-medium text-stone-700 dark:text-fog">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlay(index)}
                      className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 transition-colors hover:bg-stone-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
                      title={playingIndex === index ? '暂停' : '播放'}
                    >
                      {playingIndex === index ? (
                        <Pause size={18} weight="bold" />
                      ) : (
                        <Play size={18} weight="bold" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      title="下载"
                    >
                      <DownloadSimple size={18} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            💡 提示：首次使用需要加载 FFmpeg 引擎（约 30MB），请耐心等待。转换过程在浏览器本地完成，不会上传到服务器。
          </p>
        </div>
      </div>
    </div>
  )
}

export default AudioConverterTool

