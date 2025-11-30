import { useState, useRef, useCallback } from 'react'
import { Video, UploadSimple, DownloadSimple, Spinner, X, Warning } from '@phosphor-icons/react'
import type { ToolProps } from '../../types'
import axios from 'axios'

type VideoFormat = 'mp4' | 'avi' | 'mov' | 'webm' | 'mkv'

const FORMAT_OPTIONS: Array<{ value: VideoFormat; label: string }> = [
  { value: 'mp4', label: 'MP4' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'webm', label: 'WebM' },
  { value: 'mkv', label: 'MKV' },
]

const VideoConverterTool = ({}: ToolProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<VideoFormat>('mp4')
  const [quality, setQuality] = useState('medium')
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedFile, setConvertedFile] = useState<{ name: string; url: string } | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    
    // 检查文件大小（500MB限制）
    if (file.size > 500 * 1024 * 1024) {
      alert('文件大小超过500MB限制，请使用较小的文件')
      return
    }
    
    setSelectedFile(file)
    setConvertedFile(null)
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

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return

    setIsConverting(true)
    setProgress(0)
    setConvertedFile(null)

    try {
      // 这里需要使用后端API进行转换
      // 示例使用 CloudConvert API（需要配置 API Key）
      const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY

      if (!apiKey) {
        throw new Error('请配置 CloudConvert API Key。视频转换需要服务器支持。')
      }

      // 创建转换任务
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('output_format', targetFormat)
      formData.append('quality', quality)

      // 这里应该调用后端API或CloudConvert API
      // 示例代码（需要实际的API实现）
      const response = await axios.post('/api/video/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress((progressEvent.loaded / progressEvent.total) * 50) // 上传进度占50%
          }
        },
      })

      // 等待转换完成（轮询）
      const taskId = response.data.taskId
      let completed = false
      
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 每2秒检查一次
        
        const statusResponse = await axios.get(`/api/video/status/${taskId}`)
        const status = statusResponse.data.status
        setProgress(50 + (statusResponse.data.progress || 0) * 0.5) // 转换进度占50%

        if (status === 'completed') {
          const downloadUrl = statusResponse.data.downloadUrl
          const baseName = selectedFile.name.replace(/\.[^/.]+$/, '')
          setConvertedFile({
            name: `${baseName}.${targetFormat}`,
            url: downloadUrl,
          })
          completed = true
        } else if (status === 'failed') {
          throw new Error('视频转换失败')
        }
      }
    } catch (error) {
      console.error('Conversion error:', error)
      alert(error instanceof Error ? error.message : '转换失败，请检查API配置或网络连接')
    } finally {
      setIsConverting(false)
      setProgress(0)
    }
  }, [selectedFile, targetFormat, quality])

  const handleDownload = useCallback(() => {
    if (!convertedFile) return
    const a = document.createElement('a')
    a.href = convertedFile.url
    a.download = convertedFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [convertedFile])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* API配置提示 */}
        {!import.meta.env.VITE_CLOUDCONVERT_API_KEY && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <Warning size={20} className="mt-0.5 text-amber-600 dark:text-amber-400" weight="bold" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  需要配置 API Key
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  视频转换需要服务器支持。请在环境变量中配置 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-500/20">VITE_CLOUDCONVERT_API_KEY</code> 或使用 Supabase Edge Function。
                </p>
              </div>
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
            onChange={e => setTargetFormat(e.target.value as VideoFormat)}
            disabled={isConverting}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          >
            {FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 质量选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
            质量
          </label>
          <select
            value={quality}
            onChange={e => setQuality(e.target.value)}
            disabled={isConverting}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          >
            <option value="low">低质量（快速）</option>
            <option value="medium">中等质量</option>
            <option value="high">高质量（较慢）</option>
          </select>
        </div>

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
          <Video size={48} className="mx-auto mb-4 text-stone-400 dark:text-mist" weight="duotone" />
          <p className="mb-2 text-base font-medium text-stone-700 dark:text-fog">
            拖拽视频文件到此处或点击选择
          </p>
          <p className="mb-4 text-sm text-stone-500 dark:text-mist">
            支持格式：MP4, AVI, MOV, WebM, MKV（最大 500MB）
          </p>
          {selectedFile && (
            <div className="mb-4 rounded-lg bg-white p-3 text-left dark:bg-graphite">
              <p className="text-sm font-medium text-stone-700 dark:text-fog">{selectedFile.name}</p>
              <p className="mt-1 text-xs text-stone-500 dark:text-mist">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <UploadSimple size={18} weight="bold" />
            {selectedFile ? '更换文件' : '选择视频'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null)
                setConvertedFile(null)
              }}
              className="ml-2 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
            >
              <X size={18} weight="bold" />
              清除
            </button>
          )}
        </div>

        {/* 转换按钮和进度 */}
        {selectedFile && (
          <div className="space-y-3">
            <button
              onClick={handleConvert}
              disabled={isConverting || !import.meta.env.VITE_CLOUDCONVERT_API_KEY}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isConverting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} className="animate-spin" />
                  转换中... {Math.round(progress)}%
                </span>
              ) : (
                '开始转换'
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
        {convertedFile && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  转换完成
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                  {convertedFile.name}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                <DownloadSimple size={16} weight="bold" />
                下载
              </button>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⚠️ 注意：视频转换需要服务器资源支持。文件会被上传到服务器进行转换，转换完成后可下载。建议文件大小不超过 500MB。
          </p>
        </div>
      </div>
    </div>
  )
}

export default VideoConverterTool

