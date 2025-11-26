type TomatoProgressProps = {
  /** 已完成的番茄钟数量 (0-4) */
  count: number
  /** 图标大小 */
  size?: number
  /** 是否显示数字提示 */
  showTooltip?: boolean
}

/**
 * 番茄进度图标组件
 * 显示0-4个番茄钟的进度：灰色(0) → 1/4 → 2/4 → 3/4 → 满(4)
 */
const TomatoProgress = ({ count, size = 24, showTooltip = true }: TomatoProgressProps) => {
  // 限制在0-4范围内
  const progress = Math.min(Math.max(count, 0), 4)
  
  // 计算填充百分比 (0, 25, 50, 75, 100)
  const fillPercent = (progress / 4) * 100

  // 根据进度选择颜色
  const getColor = () => {
    if (progress === 0) return { fill: '#d6d3d1', stroke: '#a8a29e' } // stone-300, stone-400
    if (progress < 4) return { fill: '#f87171', stroke: '#dc2626' } // red-400, red-600
    return { fill: '#ef4444', stroke: '#b91c1c' } // red-500, red-700 (满)
  }

  const colors = getColor()

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      title={showTooltip ? `已完成 ${progress}/4 个番茄钟` : undefined}
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
          cy="13"
          rx="9"
          ry="8"
          fill={`url(#tomato-fill-${progress})`}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />

        {/* 番茄叶子 */}
        <path
          d="M12 5C12 5 10 3 8 4C6 5 7 7 7 7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 5C12 5 14 3 16 4C18 5 17 7 17 7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* 番茄茎 */}
        <path
          d="M12 5V3"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 高光效果 */}
        <ellipse
          cx="9"
          cy="10"
          rx="1.5"
          ry="2"
          fill="white"
          opacity="0.3"
        />
      </svg>

      {/* 进度数字（小徽章） */}
      {progress > 0 && (
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
          {progress}
        </span>
      )}
    </div>
  )
}

export default TomatoProgress

