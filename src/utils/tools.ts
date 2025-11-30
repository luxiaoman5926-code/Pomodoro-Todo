import { 
  Translate, 
  FileText, 
  Image as ImageIcon, 
  MusicNotes, 
  Video, 
  VideoCamera 
} from '@phosphor-icons/react'
import type { Tool, ToolId } from '../types'
import TranslationTool from '../components/tools/TranslationTool'
import DocumentConverterTool from '../components/tools/DocumentConverterTool'
import ImageConverterTool from '../components/tools/ImageConverterTool'
import AudioConverterTool from '../components/tools/AudioConverterTool'
import VideoConverterTool from '../components/tools/VideoConverterTool'
import VideoToAudioTool from '../components/tools/VideoToAudioTool'

// 工具注册表
const toolsRegistry = new Map<ToolId, Tool>()

// 注册工具
export function registerTool(tool: Tool): void {
  toolsRegistry.set(tool.id, tool)
}

// 注册翻译工具
registerTool({
  id: 'translation',
  name: 'AI多语言翻译比对',
  description: '支持多种语言的实时翻译和比对，可同时翻译到多个目标语言',
  icon: Translate,
  component: TranslationTool,
  category: '语言工具',
})

// 注册文档格式转换器
registerTool({
  id: 'document-converter',
  name: '文档格式转换器',
  description: '支持 PDF、DOCX、TXT、Markdown、HTML 等文档格式的相互转换',
  icon: FileText,
  component: DocumentConverterTool,
  category: '文档工具',
})

// 注册图片格式转换器
registerTool({
  id: 'image-converter',
  name: '图片格式转换器',
  description: '支持 PNG、JPEG、WebP、BMP、GIF 等图片格式转换，支持批量处理和尺寸调整',
  icon: ImageIcon,
  component: ImageConverterTool,
  category: '媒体工具',
})

// 注册音频格式转换器
registerTool({
  id: 'audio-converter',
  name: '音频格式转换器',
  description: '支持 MP3、WAV、OGG、AAC、FLAC 等音频格式转换，纯客户端处理',
  icon: MusicNotes,
  component: AudioConverterTool,
  category: '媒体工具',
})

// 注册视频格式转换器
registerTool({
  id: 'video-converter',
  name: '视频格式转换器',
  description: '支持 MP4、AVI、MOV、WebM、MKV 等视频格式转换（需要服务器支持）',
  icon: Video,
  component: VideoConverterTool,
  category: '媒体工具',
})

// 注册视频转音频转换器
registerTool({
  id: 'video-to-audio',
  name: '视频转音频提取器',
  description: '从视频文件中提取音频，支持输出 MP3、WAV、OGG、AAC 格式（需要服务器支持）',
  icon: VideoCamera,
  component: VideoToAudioTool,
  category: '媒体工具',
})

// 获取所有工具
export function getAllTools(): Tool[] {
  return Array.from(toolsRegistry.values())
}

// 按分类获取工具
export function getToolsByCategory(category?: string): Tool[] {
  const allTools = getAllTools()
  if (!category) return allTools
  return allTools.filter(tool => tool.category === category)
}

// 获取特定工具
export function getTool(toolId: ToolId): Tool | undefined {
  return toolsRegistry.get(toolId)
}

// 获取所有分类
export function getCategories(): string[] {
  const categories = new Set<string>()
  getAllTools().forEach(tool => {
    if (tool.category) {
      categories.add(tool.category)
    }
  })
  return Array.from(categories).sort()
}
