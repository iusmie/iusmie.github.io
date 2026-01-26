import { useState } from 'react'
import MarkdownCompare from './components/MarkdownCompare'
import MarkdownTablePreview from './components/MarkdownTablePreview'

type ToolType = 'compare' | 'table'

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('compare')

  return (
    <div className="min-h-screen bg-notion-page flex flex-col">
      {/* 工具切换栏 */}
      <div className="bg-notion-bg border-b border-notion-border">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-notion-text-tertiary mr-2">工具:</span>
              <button
                onClick={() => setCurrentTool('compare')}
                className={`px-3 py-1.5 rounded-[3px] text-sm font-medium transition-all duration-150 ${
                  currentTool === 'compare'
                    ? 'bg-notion-accent-blue text-white shadow-notion-sm'
                    : 'bg-notion-bg text-notion-text-secondary hover:bg-notion-hover border border-notion-border'
                }`}
              >
                Markdown对比
              </button>
              <button
                onClick={() => setCurrentTool('table')}
                className={`px-3 py-1.5 rounded-[3px] text-sm font-medium transition-all duration-150 ${
                  currentTool === 'table'
                    ? 'bg-notion-accent-blue text-white shadow-notion-sm'
                    : 'bg-notion-bg text-notion-text-secondary hover:bg-notion-hover border border-notion-border'
                }`}
              >
                表格预览
              </button>
            </div>
            <a
              href="/"
              className="px-3 py-1.5 rounded-[3px] text-sm font-medium text-notion-text-secondary hover:bg-notion-hover border border-notion-border transition-all duration-150"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>

      {/* 当前工具内容 */}
      {currentTool === 'compare' ? <MarkdownCompare /> : <MarkdownTablePreview />}
    </div>
  )
}

export default App
