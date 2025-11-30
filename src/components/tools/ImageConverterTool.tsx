import { useState, useRef, useCallback } from 'react'
import { Image as ImageIcon, UploadSimple, DownloadSimple, Spinner, X, Eye } from '@phosphor-icons/react'
import type { ToolProps } from '../../types'

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'bmp' | 'gif'

const FORMAT_OPTIONS: Array<{ value: ImageFormat; label: string; mimeType: string }> = [
  { value: 'png', label: 'PNG', mimeType: 'image/png' },
  { value: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg' },
  { value: 'webp', label: 'WebP', mimeType: 'image/webp' },
  { value: 'bmp', label: 'BMP', mimeType: 'image/bmp' },
  { value: 'gif', label: 'GIF', mimeType: 'image/gif' },
]

const ImageConverterTool = ({}: ToolProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(0.9)
  const [resizeEnabled, setResizeEnabled] = useState(false)
  const [resizeWidth, setResizeWidth] = useState(1920)
  const [resizeHeight, setResizeHeight] = useState(1080)
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; blob: Blob; preview: string }>>([])
  const [isConverting, setIsConverting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    setSelectedFiles(prev => [...prev, ...imageFiles])
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

  const convertImage = useCallback(async (file: File): Promise<{ blob: Blob; preview: string }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        if (!e.target?.result) {
          reject(new Error('Failed to read file'))
          return
        }

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 应用尺寸调整
          if (resizeEnabled) {
            const aspectRatio = img.width / img.height
            if (resizeWidth / resizeHeight > aspectRatio) {
              height = resizeHeight
              width = height * aspectRatio
            } else {
              width = resizeWidth
              height = width / aspectRatio
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          const format = FORMAT_OPTIONS.find(opt => opt.value === targetFormat)
          if (!format) {
            reject(new Error('Unsupported format'))
            return
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'))
                return
              }

              const preview = URL.createObjectURL(blob)
              resolve({ blob, preview })
            },
            format.mimeType,
            targetFormat === 'jpeg' || targetFormat === 'webp' ? quality : undefined
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target.result as string
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [targetFormat, quality, resizeEnabled, resizeWidth, resizeHeight])

  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setIsConverting(true)
    setConvertedFiles([])

    try {
      const results: Array<{ name: string; blob: Blob; preview: string }> = []

      for (const file of selectedFiles) {
        const { blob, preview } = await convertImage(file)
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        results.push({
          name: `${baseName}.${targetFormat}`,
          blob,
          preview,
        })
      }

      setConvertedFiles(results)
    } catch (error) {
      console.error('Conversion error:', error)
      alert(error instanceof Error ? error.message : '转换失败')
    } finally {
      setIsConverting(false)
    }
  }, [selectedFiles, convertImage, targetFormat])

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

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* 目标格式选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
            目标格式
          </label>
          <select
            value={targetFormat}
            onChange={e => setTargetFormat(e.target.value as ImageFormat)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          >
            {FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 质量设置（仅JPEG和WebP） */}
        {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
              质量: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={e => setQuality(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* 尺寸调整 */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-fog">
            <input
              type="checkbox"
              checked={resizeEnabled}
              onChange={e => setResizeEnabled(e.target.checked)}
              className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 dark:border-white/20"
            />
            调整尺寸
          </label>
          {resizeEnabled && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-stone-500 dark:text-mist">宽度</label>
                <input
                  type="number"
                  value={resizeWidth}
                  onChange={e => setResizeWidth(parseInt(e.target.value) || 1920)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500 dark:text-mist">高度</label>
                <input
                  type="number"
                  value={resizeHeight}
                  onChange={e => setResizeHeight(parseInt(e.target.value) || 1080)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
                />
              </div>
            </div>
          )}
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
          <ImageIcon size={48} className="mx-auto mb-4 text-stone-400 dark:text-mist" weight="duotone" />
          <p className="mb-2 text-base font-medium text-stone-700 dark:text-fog">
            拖拽图片到此处或点击选择
          </p>
          <p className="mb-4 text-sm text-stone-500 dark:text-mist">
            支持批量转换
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <UploadSimple size={18} weight="bold" />
            选择图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* 已选择文件列表 */}
        {selectedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              已选择图片 ({selectedFiles.length})
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

        {/* 转换按钮 */}
        {selectedFiles.length > 0 && (
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isConverting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={20} className="animate-spin" />
                转换中...
              </span>
            ) : (
              `转换 ${selectedFiles.length} 张图片`
            )}
          </button>
        )}

        {/* 转换结果 */}
        {convertedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              转换结果 ({convertedFiles.length})
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-white/20 dark:bg-graphite"
                >
                  <div className="relative aspect-square bg-stone-100 dark:bg-coal">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="p-3">
                    <p className="mb-2 truncate text-sm font-medium text-stone-700 dark:text-fog">
                      {file.name}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewIndex(index)}
                        className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
                      >
                        <Eye size={14} weight="bold" className="mx-auto" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <DownloadSimple size={14} weight="bold" className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 预览模态框 */}
        {previewIndex !== null && convertedFiles[previewIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewIndex(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewIndex(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-white/20"
              >
                <X size={20} weight="bold" />
              </button>
              <img
                src={convertedFiles[previewIndex].preview}
                alt={convertedFiles[previewIndex].name}
                className="max-h-[85vh] rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageConverterTool

