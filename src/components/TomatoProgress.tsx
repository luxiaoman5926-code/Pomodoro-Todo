type TomatoProgressProps = {
  /** 已完成的番茄钟数量 (0-99) */
  count: number
  /** 图标大小 */
  size?: number
  /** 是否显示数字提示 */
  showTooltip?: boolean
}

/**
 * 番茄进度图标组件
 * 显示0-99个番茄钟的进度：
 * - 0-4个：显示填充进度（灰色(0) → 1/4 → 2/4 → 3/4 → 满(4)）
 * - 5-99个：显示满状态，数字徽章显示实际数量
 */
const TomatoProgress = ({ count, size = 24, showTooltip = true }: TomatoProgressProps) => {
  // 限制在0-99范围内
  const actualCount = Math.min(Math.max(count, 0), 99)
  
  // 对于显示进度，最多显示4个的进度
  const progress = Math.min(actualCount, 4)
  
  // 计算填充百分比 (0, 25, 50, 75, 100)
  const fillPercent = actualCount >= 4 ? 100 : (progress / 4) * 100

  // 根据进度选择颜色
  const getColor = () => {
    if (progress === 0) return { fill: '#d6d3d1', stroke: '#a8a29e' } // stone-300, stone-400
    if (progress < 4) return { fill: '#f87171', stroke: '#dc2626' } // red-400, red-600
    return { fill: '#ef4444', stroke: '#b91c1c' } // red-500, red-700 (满)
  }

  const colors = getColor()
  
  // 生成提示文本
  const tooltipText = showTooltip 
    ? actualCount >= 4 
      ? `已完成 ${actualCount} 个番茄钟`
      : `已完成 ${actualCount}/4 个番茄钟`
    : undefined

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      title={tooltipText}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        className="drop-shadow-sm"
      >
        {/* 定义渐变遮罩 - 从下往上填充 */}
        <defs>
          <linearGradient id={`tomato-fill-${progress}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset={`${fillPercent}%`} stopColor={colors.fill} />
            <stop offset={`${fillPercent}%`} stopColor={progress === 0 ? colors.fill : '#fecaca'} />
          </linearGradient>
          <clipPath id="tomato-clip">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
          </clipPath>
        </defs>

        {/* 番茄主体 - 带填充效果 */}
        <ellipse
          cx="12"
          cy="12.5"
          rx="8.5"
          ry="7.5"
          fill={`url(#tomato-fill-${progress})`}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />

        {/* 番茄叶子 */}
        <path
          d="M12 5C12 5 10 3.5 8.5 4.5C7 5.5 7.5 7 7.5 7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 5C12 5 14 3.5 15.5 4.5C17 5.5 16.5 7 16.5 7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* 番茄茎 */}
        <path
          d="M12 5V3.5"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 高光效果 */}
        <ellipse
          cx="9"
          cy="10"
          rx="1.5"
          ry="1.5"
          fill="white"
          opacity="0.3"
        />
      </svg>

      {/* 进度数字（小徽章） */}
      {actualCount > 0 && (
        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold shadow-sm ${
          actualCount >= 10 
            ? 'h-4 min-w-4 px-0.5 text-[8px]' 
            : 'h-3.5 w-3.5 text-[9px]'
        }`}>
          {actualCount >= 99 ? '99+' : actualCount}
        </span>
      )}
    </div>
  )
}

export default TomatoProgress

