import { useState, useRef } from 'react'
import {
  PaperPlaneRight,
  UploadSimple,
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  MusicNotes,
  TextT,
  Trash,
  DownloadSimple,
  X,
  Spinner,
  Copy,
  Check,
  PencilSimple,
} from '@phosphor-icons/react'
import { useTransfers } from '../hooks/useTransfers'
import type { TransferItem, TransferType } from '../types'
import ThemedCard from './ThemedCard'

type TransferProps = {
  userId: string
}

const TYPE_TABS:Array<{ id: TransferType | 'all'; label: string; icon: typeof TextT }> = [
  { id: 'all', label: '全部', icon: FileIcon },
  { id: 'text', label: '文本', icon: TextT },
  { id: 'image', label: '图片', icon: ImageIcon },
  { id: 'video', label: '视频', icon: VideoIcon },
  { id: 'audio', label: '音频', icon: MusicNotes },
  { id: 'document', label: '文档', icon: FileIcon },
]

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const Transfer = ({ userId }: TransferProps) => {
  const { items, loading, uploading, sendText, uploadFile, deleteTransfer, renameTransfer } = useTransfers(userId)
  const [activeTab, setActiveTab] = useState<TransferType | 'all'>('all')
  const [text, setText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewItem, setPreviewItem] = useState<TransferItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Rename states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  
  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 过滤列表
  const filteredItems = items.filter((item) => activeTab === 'all' || item.type === activeTab)

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    sendText(text)
    setText('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const startRenaming = (item: TransferItem) => {
    setEditingId(item.id)
    setEditName(item.type === 'text' ? (item.metadata.name || '纯文本') : (item.metadata.name || ''))
  }

  const handleRename = async () => {
    if (!editingId || !editName.trim()) {
        setEditingId(null)
        return
    }
    await renameTransfer(editingId, editName.trim())
    setEditingId(null)
  }

  const handleCopy = async (item: TransferItem) => {
    if (item.type !== 'text') return
    
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div 
      className="relative min-h-[calc(100vh-200px)]"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* 拖拽遮罩层 */}
      {dragActive && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50/90 backdrop-blur-sm dark:bg-blue-900/50 pointer-events-none"
        >
          <div className="text-center text-blue-600 dark:text-blue-400">
            <UploadSimple size={48} className="mx-auto mb-2" />
            <p className="text-lg font-bold">释放文件以上传</p>
          </div>
        </div>
      )}

      {/* 顶部操作区 */}
      <ThemedCard label="传输" title="跨设备同步" meta="文本、文件极速互传">
        {/* 输入框 */}
        <form onSubmit={handleTextSubmit} className="mb-6 flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入文本或粘贴链接..."
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PaperPlaneRight size={20} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center rounded-xl border border-stone-200 bg-white px-5 py-3 text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-ash dark:text-fog dark:hover:bg-white/10"
          >
            {uploading ? <Spinner size={20} className="animate-spin" /> : <UploadSimple size={20} weight="bold" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </form>

        {/* 分类标签 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:shadow-none'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-fog dark:hover:bg-white/20'
              }`}
            >
              <tab.icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 列表内容 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size={32} className="animate-spin text-stone-400 dark:text-mist" weight="duotone" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 dark:text-mist">
              <UploadSimple size={64} weight="duotone" className="mb-4 opacity-50" />
              <p className="text-base font-medium text-stone-600 dark:text-fog">暂无内容</p>
              <p className="mt-2 text-sm text-stone-500 dark:text-mist">拖入文件或输入文本开始传输</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:border-stone-300 hover:shadow-lg dark:border-white/20 dark:bg-graphite dark:hover:border-white/30"
                >
                  {/* 内容预览 */}
                  <div 
                    className="flex h-40 cursor-pointer items-center justify-center bg-stone-50 p-6 dark:bg-coal/50"
                    onClick={() => item.type !== 'text' && setPreviewItem(item)}
                  >
                    {item.type === 'text' ? (
                      <p className="line-clamp-4 text-base text-stone-700 dark:text-fog break-all leading-relaxed">{item.content}</p>
                    ) : item.type === 'image' ? (
                      <img src={item.url} alt={item.metadata.name} className="h-full w-full object-contain rounded-lg" />
                    ) : item.type === 'video' ? (
                      <div className="relative flex items-center justify-center">
                        <VideoIcon size={56} className="text-stone-400 dark:text-mist" weight="duotone" />
                        <div className="absolute rounded-full bg-black/60 p-3 text-white dark:bg-white/20">
                          <div className="h-0 w-0 border-b-[8px] border-l-[12px] border-t-[8px] border-b-transparent border-l-white border-t-transparent ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-stone-400 dark:text-mist">
                        {item.type === 'audio' ? <MusicNotes size={40} weight="duotone" /> : <FileIcon size={40} weight="duotone" />}
                        <span className="text-sm font-medium uppercase">{item.metadata.name?.split('.').pop()}</span>
                      </div>
                    )}
                  </div>

                  {/* 信息栏 */}
                  <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/50 px-4 py-3 dark:border-white/20 dark:bg-coal/30">
                    <div className="min-w-0 flex-1">
                        {editingId === item.id ? (
                            <input
                                autoFocus
                                className="w-full rounded-lg border border-blue-500 bg-white px-2 py-1.5 text-sm font-medium text-stone-900 outline-none ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-ash dark:text-fog"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p 
                                className="mb-1 truncate text-sm font-medium text-stone-800 dark:text-stone-100 cursor-default select-none"
                            >
                                {item.type === 'text' ? (item.metadata.name || '纯文本') : item.metadata.name}
                            </p>
                        )}
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {new Date(item.created_at).toLocaleDateString('zh-CN')} 
                        {item.metadata.size && ` · ${formatSize(item.metadata.size)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.type === 'text' ? (
                        <button
                          onClick={() => handleCopy(item)}
                          className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-blue-600 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-blue-400"
                          title="复制"
                        >
                          {copiedId === item.id ? (
                            <Check size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy size={16} weight="bold" />
                          )}
                        </button>
                      ) : item.url ? (
                        <a
                          href={item.url}
                          download={item.metadata.name}
                          className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-blue-600 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-blue-400"
                          title="下载"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DownloadSimple size={16} weight="bold" />
                        </a>
                      ) : null}
                      <button
                        onClick={() => startRenaming(item)}
                        className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-blue-600 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-blue-400"
                        title="重命名"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => deleteTransfer(item.id, item.content, item.type)}
                        className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-red-500 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-red-400"
                        title="删除"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ThemedCard>

      {/* 预览弹窗 */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            
            {previewItem.type === 'image' && (
              <img src={previewItem.url} alt={previewItem.metadata.name} className="max-h-[85vh] w-full object-contain" />
            )}
            {previewItem.type === 'video' && (
              <video src={previewItem.url} controls autoPlay className="max-h-[85vh] w-full" />
            )}
            {previewItem.type === 'audio' && (
              <div className="flex h-40 w-[300px] items-center justify-center bg-stone-900 px-8">
                <audio src={previewItem.url} controls className="w-full" />
              </div>
            )}
            {previewItem.type === 'document' && (
              <div className="flex h-60 w-[300px] flex-col items-center justify-center gap-4 bg-white p-8 text-center">
                <FileIcon size={48} className="text-stone-400" />
                <div>
                  <p className="font-medium text-stone-900">{previewItem.metadata.name}</p>
                  <p className="text-sm text-stone-500">{formatSize(previewItem.metadata.size)}</p>
                </div>
                <a
                  href={previewItem.url}
                  download={previewItem.metadata.name}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  下载文件
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Transfer

