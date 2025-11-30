import { useState, useMemo } from 'react'
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import ThemedCard from './ThemedCard'
import ToolCard from './ToolCard'
import ToolModal from './ToolModal'
import { getAllTools, getToolsByCategory, getCategories } from '../utils/tools'
import type { Tool } from '../types'

const ToolsPage = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = getCategories()
  const allTools = getAllTools()

  // 筛选工具
  const filteredTools = useMemo(() => {
    let tools = selectedCategory
      ? getToolsByCategory(selectedCategory)
      : allTools

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tools = tools.filter(
        tool =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.category?.toLowerCase().includes(query)
      )
    }

    return tools
  }, [searchQuery, selectedCategory, allTools])

  const handleOpenTool = (tool: Tool) => {
    setSelectedTool(tool)
  }

  const handleCloseTool = () => {
    setSelectedTool(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ThemedCard
        label="工具集"
        title="实用工具"
        meta="各类实用的Web小工具，持续更新中"
      >
        {/* 搜索和筛选 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-mist"
              weight="duotone"
            />
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:placeholder:text-mist dark:focus:border-amber-500/50"
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-coal'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
              }`}
            >
              <Funnel size={16} weight={selectedCategory === null ? 'fill' : 'regular'} />
              全部
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-coal'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 工具网格 */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={() => handleOpenTool(tool)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-stone-600 dark:text-mist">
              未找到匹配的工具
            </p>
            <p className="mt-2 text-sm text-stone-500 dark:text-mist">
              尝试调整搜索条件或筛选器
            </p>
          </div>
        )}
      </ThemedCard>

      {/* 工具模态框 */}
      <ToolModal tool={selectedTool} isOpen={selectedTool !== null} onClose={handleCloseTool} />
    </div>
  )
}

export default ToolsPage
