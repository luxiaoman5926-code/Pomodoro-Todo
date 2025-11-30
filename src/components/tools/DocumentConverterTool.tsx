import { useState, useRef, useCallback } from 'react'
import { FileText, UploadSimple, DownloadSimple, Spinner, X } from '@phosphor-icons/react'
import type { ToolProps } from '../../types'
import { PDFDocument } from 'pdf-lib'
import mammoth from 'mammoth'

type ConversionType = 'pdf-to-docx' | 'docx-to-pdf' | 'txt-to-docx' | 'markdown-to-html' | 'html-to-markdown'

const CONVERSION_OPTIONS: Array<{ value: ConversionType; label: string; accept: string }> = [
  { value: 'pdf-to-docx', label: 'PDF → DOCX', accept: '.pdf' },
  { value: 'docx-to-pdf', label: 'DOCX → PDF', accept: '.docx' },
  { value: 'txt-to-docx', label: 'TXT → DOCX', accept: '.txt' },
  { value: 'markdown-to-html', label: 'Markdown → HTML', accept: '.md,.markdown' },
  { value: 'html-to-markdown', label: 'HTML → Markdown', accept: '.html,.htm' },
]

const DocumentConverterTool = ({}: ToolProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-docx')
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; blob: Blob }>>([])
  const [isConverting, setIsConverting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)
    setSelectedFiles(prev => [...prev, ...fileArray])
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

  const convertPDFToDOCX = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // 提取文本内容（简化实现，实际需要更复杂的PDF解析）
    let textContent = ''
    for (const page of pages) {
      // PDF文本提取需要更复杂的库，这里使用占位实现
      textContent += `Page ${pages.indexOf(page) + 1}\n\n`
    }

    // 创建简单的DOCX（使用HTML转DOCX的方式，实际应该使用docx库）
    // 注意：这是简化实现，完整的PDF转DOCX需要更专业的库
    const htmlContent = `<html><head><meta charset="utf-8"></head><body>${textContent.replace(/\n/g, '<br>')}</body></html>`
    return new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  }

  const convertDOCXToPDF = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const htmlContent = result.value

    // 创建PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    
    // 简化实现：将HTML转换为PDF需要更复杂的处理
    // 这里使用占位文本
    const { height } = page.getSize()
    page.drawText(htmlContent.substring(0, 1000), {
      x: 50,
      y: height - 50,
      size: 12,
    })

    const pdfBytes = await pdfDoc.save()
    // 转换为标准的 Uint8Array
    const uint8Array = new Uint8Array(pdfBytes)
    return new Blob([uint8Array], { type: 'application/pdf' })
  }

  const convertTXTToDOCX = async (file: File): Promise<Blob> => {
    const text = await file.text()
    const htmlContent = `<html><head><meta charset="utf-8"></head><body>${text.replace(/\n/g, '<br>')}</body></html>`
    return new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  }

  const convertMarkdownToHTML = async (file: File): Promise<Blob> => {
    const text = await file.text()
    // 简单的Markdown到HTML转换（简化实现）
    let html = text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/g, '<br>')
    
    html = `<html><head><meta charset="utf-8"><title>Converted Document</title></head><body>${html}</body></html>`
    return new Blob([html], { type: 'text/html' })
  }

  const convertHTMLToMarkdown = async (file: File): Promise<Blob> => {
    const html = await file.text()
    // 简单的HTML到Markdown转换（简化实现）
    let markdown = html
      .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
      .replace(/<em>(.*?)<\/em>/gim, '*$1*')
      .replace(/<br\s*\/?>/gim, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
    
    return new Blob([markdown], { type: 'text/markdown' })
  }

  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setIsConverting(true)
    setConvertedFiles([])

    try {
      const results: Array<{ name: string; blob: Blob }> = []

      for (const file of selectedFiles) {
        let convertedBlob: Blob
        let extension: string

        switch (conversionType) {
          case 'pdf-to-docx':
            convertedBlob = await convertPDFToDOCX(file)
            extension = 'docx'
            break
          case 'docx-to-pdf':
            convertedBlob = await convertDOCXToPDF(file)
            extension = 'pdf'
            break
          case 'txt-to-docx':
            convertedBlob = await convertTXTToDOCX(file)
            extension = 'docx'
            break
          case 'markdown-to-html':
            convertedBlob = await convertMarkdownToHTML(file)
            extension = 'html'
            break
          case 'html-to-markdown':
            convertedBlob = await convertHTMLToMarkdown(file)
            extension = 'md'
            break
          default:
            throw new Error('Unsupported conversion type')
        }

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        results.push({
          name: `${baseName}.${extension}`,
          blob: convertedBlob,
        })
      }

      setConvertedFiles(results)
    } catch (error) {
      console.error('Conversion error:', error)
      alert(error instanceof Error ? error.message : '转换失败')
    } finally {
      setIsConverting(false)
    }
  }, [selectedFiles, conversionType])

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
        {/* 转换类型选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
            选择转换类型
          </label>
          <select
            value={conversionType}
            onChange={e => setConversionType(e.target.value as ConversionType)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          >
            {CONVERSION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
          <FileText size={48} className="mx-auto mb-4 text-stone-400 dark:text-mist" weight="duotone" />
          <p className="mb-2 text-base font-medium text-stone-700 dark:text-fog">
            拖拽文件到此处或点击选择
          </p>
          <p className="mb-4 text-sm text-stone-500 dark:text-mist">
            支持批量转换
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <UploadSimple size={18} weight="bold" />
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={CONVERSION_OPTIONS.find(opt => opt.value === conversionType)?.accept}
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* 已选择文件列表 */}
        {selectedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              已选择文件 ({selectedFiles.length})
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
              `转换 ${selectedFiles.length} 个文件`
            )}
          </button>
        )}

        {/* 转换结果 */}
        {convertedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-stone-700 dark:text-fog">
              转换结果 ({convertedFiles.length})
            </h3>
            <div className="space-y-2">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-white/20 dark:bg-graphite"
                >
                  <span className="truncate text-sm font-medium text-stone-700 dark:text-fog">
                    {file.name}
                  </span>
                  <button
                    onClick={() => handleDownload(file)}
                    className="ml-2 flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    下载
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            💡 提示：某些复杂的转换（如PDF转DOCX）可能需要更专业的工具。当前实现为基础版本，适合简单的文档格式转换。
          </p>
        </div>
      </div>
    </div>
  )
}

export default DocumentConverterTool

