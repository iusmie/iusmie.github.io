import { useState, useMemo, useRef, useEffect } from 'react'
import DiffMatchPatch from 'diff-match-patch'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DiffLine {
  type: 'equal' | 'delete' | 'insert'
  text: string
  lineNumber?: number
}

interface DiffBlock {
  lines: DiffLine[]
  startIndex: number
  endIndex: number
  hasDiff: boolean
}

type DiffChoice = 'keep' | 'accept' | null

interface Section {
  level: number
  title: string
  content: string
  startLine: number
  endLine: number
  id: string
}

interface SectionMatch {
  leftSection: Section | null
  rightSection: Section | null
  matchType: 'matched' | 'leftOnly' | 'rightOnly'
  diffBlocks: DiffBlock[]
  hasDiff: boolean
}

const MarkdownCompare = () => {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const [hideUnchanged, setHideUnchanged] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  // const [, setCurrentDiffIndex] = useState(0)
  const [diffChoices, setDiffChoices] = useState<Map<number, DiffChoice>>(new Map())
  const [showFinalDocument, setShowFinalDocument] = useState(false)
  const [compareBySection, setCompareBySection] = useState(true)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<{
    sectionId: string
    side: 'left' | 'right'
    originalContent: string
  } | null>(null)
  const [editedContents, setEditedContents] = useState<Map<string, { left?: string, right?: string }>>(new Map())
  const [editText, setEditText] = useState('')
  
  const leftScrollRef = useRef<HTMLDivElement>(null)
  const rightScrollRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const dmp = new DiffMatchPatch()

  // 解析Markdown章节结构
  const parseSections = (text: string): Section[] => {
    if (!text) return []
    
    const lines = text.split('\n')
    const sections: Section[] = []
    let currentSection: Section | null = null
    
    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      
      if (headingMatch) {
        // 保存上一个章节（不包含标题行，只包含标题后的内容）
        if (currentSection) {
          currentSection.endLine = index - 1
          // 从标题行的下一行开始，到当前标题行的上一行结束
          const contentStart = currentSection.startLine + 1
          const contentEnd = index
          currentSection.content = contentStart < contentEnd 
            ? lines.slice(contentStart, contentEnd).join('\n')
            : ''
          sections.push(currentSection)
        }
        
        // 创建新章节
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        const id = `section-${sections.length}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`
        
        currentSection = {
          level,
          title,
          content: '',
          startLine: index,
          endLine: lines.length - 1,
          id
        }
      }
    })
    
    // 保存最后一个章节（不包含标题行，只包含标题后的内容）
    if (currentSection !== null) {
      const section: Section = currentSection
      section.endLine = lines.length - 1
      // 从标题行的下一行开始，到文件末尾
      const contentStart = section.startLine + 1
      section.content = contentStart < lines.length
        ? lines.slice(contentStart).join('\n')
        : ''
      sections.push(section)
    }
    
    return sections
  }

  // 匹配章节
  const matchSections = (leftSections: Section[], rightSections: Section[]): SectionMatch[] => {
    const matches: SectionMatch[] = []
    const usedRightIndices = new Set<number>()
    
    // 按层级和顺序匹配章节
    leftSections.forEach((leftSection) => {
      // 先尝试精确匹配标题
      const exactMatch = rightSections.findIndex(
        (rightSection, idx) => 
          !usedRightIndices.has(idx) && 
          rightSection.title === leftSection.title &&
          rightSection.level === leftSection.level
      )
      
      if (exactMatch !== -1) {
        usedRightIndices.add(exactMatch)
        matches.push({
          leftSection,
          rightSection: rightSections[exactMatch],
          matchType: 'matched',
          diffBlocks: [],
          hasDiff: false
        })
      } else {
        // 标题不同，尝试按层级和位置匹配
        // 找到相同层级、相同相对位置的章节
        const leftSectionsAtLevel = leftSections.filter(s => s.level === leftSection.level)
        const rightSectionsAtLevel = rightSections.filter(s => s.level === leftSection.level && !usedRightIndices.has(rightSections.indexOf(s)))
        
        const leftPosInLevel = leftSectionsAtLevel.indexOf(leftSection)
        const positionMatch = rightSectionsAtLevel[leftPosInLevel]
        
        if (positionMatch && leftPosInLevel >= 0) {
          const globalIdx = rightSections.indexOf(positionMatch)
          usedRightIndices.add(globalIdx)
          matches.push({
            leftSection,
            rightSection: positionMatch,
            matchType: 'matched',
            diffBlocks: [],
            hasDiff: true // 标题不同，标记为有差异
          })
        } else {
          // 无法匹配，标记为仅左侧存在
          matches.push({
            leftSection,
            rightSection: null,
            matchType: 'leftOnly',
            diffBlocks: [],
            hasDiff: true
          })
        }
      }
    })
    
    // 添加右侧独有的章节
    rightSections.forEach((rightSection, idx) => {
      if (!usedRightIndices.has(idx)) {
        matches.push({
          leftSection: null,
          rightSection,
          matchType: 'rightOnly',
          diffBlocks: [],
          hasDiff: true
        })
      }
    })
    
    return matches
  }

  // 对比章节内容
  const compareSectionContent = (leftContent: string, rightContent: string): DiffBlock[] => {
    const normalizedLeft = leftContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const normalizedRight = rightContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    if (normalizedLeft === normalizedRight) {
      return []
    }
    
    const diffs = dmp.diff_main(normalizedLeft, normalizedRight)
    dmp.diff_cleanupSemantic(diffs)
    
    const lines: DiffLine[] = []
    let lineNumber = 1
    
    diffs.forEach(([operation, text]) => {
      const textLines = text.split('\n')
      textLines.forEach((line, index) => {
        if (index === textLines.length - 1 && line === '' && textLines.length > 1) return
        
        if (operation === -1) {
          lines.push({ type: 'delete', text: line, lineNumber: lineNumber++ })
        } else if (operation === 1) {
          lines.push({ type: 'insert', text: line, lineNumber: undefined })
        } else {
          lines.push({ type: 'equal', text: line, lineNumber: lineNumber++ })
        }
      })
    })
    
    // 构建差异块
    const blocks: DiffBlock[] = []
    let currentBlock: DiffLine[] = []
    let startIdx = 0
    
    lines.forEach((line, index) => {
      if (line.type === 'equal') {
        if (currentBlock.length > 0 && currentBlock.some(l => l.type !== 'equal')) {
          blocks.push({
            lines: [...currentBlock],
            startIndex: startIdx,
            endIndex: index - 1,
            hasDiff: true
          })
          currentBlock = []
        }
        if (currentBlock.length === 0) {
          startIdx = index
        }
        currentBlock.push(line)
      } else {
        if (currentBlock.length > 0 && currentBlock.every(l => l.type === 'equal')) {
          blocks.push({
            lines: [...currentBlock],
            startIndex: startIdx,
            endIndex: index - 1,
            hasDiff: false
          })
          currentBlock = []
        }
        if (currentBlock.length === 0) {
          startIdx = index
        }
        currentBlock.push(line)
      }
    })
    
    if (currentBlock.length > 0) {
      blocks.push({
        lines: [...currentBlock],
        startIndex: startIdx,
        endIndex: lines.length - 1,
        hasDiff: currentBlock.some(l => l.type !== 'equal')
      })
    }
    
    return blocks.filter(b => b.hasDiff)
  }

  // 章节对比结果
  const sectionMatches = useMemo(() => {
    if (!compareBySection || !leftText || !rightText) {
      return { matches: [], leftSections: [], rightSections: [] }
    }
    
    const leftSections = parseSections(leftText)
    const rightSections = parseSections(rightText)
    
    // 如果没有章节，返回空数组
    if (leftSections.length === 0 && rightSections.length === 0) {
      return { matches: [], leftSections: [], rightSections: [] }
    }
    
    const matches = matchSections(leftSections, rightSections)
    
    // 对比每个匹配章节的内容
    matches.forEach((match) => {
      if (match.matchType === 'matched' && match.leftSection && match.rightSection) {
        const diffBlocks = compareSectionContent(
          match.leftSection.content,
          match.rightSection.content
        )
        match.diffBlocks = diffBlocks
        match.hasDiff = diffBlocks.length > 0
      } else {
        // 对于不匹配的章节，标记为有差异
        match.hasDiff = true
      }
    })
    
    return { matches, leftSections, rightSections }
  }, [leftText, rightText, compareBySection])

  const { diffLines, diffBlocks, stats } = useMemo(() => {
    if (!leftText && !rightText) {
      return { diffLines: [], diffBlocks: [], stats: { deleted: 0, inserted: 0, modified: 0, total: 0 } }
    }
    
    // 规范化文本：统一换行符
    const normalizeText = (text: string) => {
      return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }
    
    const normalizedLeft = normalizeText(leftText)
    const normalizedRight = normalizeText(rightText)
    
    // 如果文本完全相同，直接返回
    if (normalizedLeft === normalizedRight) {
      const lines: DiffLine[] = normalizedLeft.split('\n').map((line, index) => ({
        type: 'equal' as const,
        text: line,
        lineNumber: index + 1
      }))
      
      return {
        diffLines: lines,
        diffBlocks: [{
          lines: lines,
          startIndex: 0,
          endIndex: lines.length - 1,
          hasDiff: false
        }],
        stats: { deleted: 0, inserted: 0, modified: 0, total: 0 }
      }
    }
    
    const diffs = dmp.diff_main(normalizedLeft, normalizedRight)
    dmp.diff_cleanupSemantic(diffs)
    
    const lines: DiffLine[] = []
    let lineNumber = 1
    
    diffs.forEach(([operation, text]) => {
      // 处理文本分割，保留空行
      const textLines = text.split('\n')
      
      textLines.forEach((line, index) => {
        // 跳过最后一个空字符串（如果文本以换行符结尾，split会产生一个空字符串）
        // 但如果整个文本块都是空的，我们需要保留它
        const isLastEmpty = index === textLines.length - 1 && line === '' && textLines.length > 1
        
        if (isLastEmpty) {
          // 如果前一个不是空字符串，说明这是split产生的末尾空字符串，跳过
          if (index > 0 && textLines[index - 1] !== '') {
            return
          }
        }
        
        if (operation === -1) {
          lines.push({ type: 'delete', text: line, lineNumber: lineNumber++ })
        } else if (operation === 1) {
          lines.push({ type: 'insert', text: line, lineNumber: undefined })
        } else {
          lines.push({ type: 'equal', text: line, lineNumber: lineNumber++ })
        }
      })
    })

    // 构建差异块
    const blocks: DiffBlock[] = []
    let currentBlock: DiffLine[] = []
    let startIdx = 0
    
    lines.forEach((line, index) => {
      if (line.type === 'equal') {
        // 如果当前块有差异（包含delete或insert），先保存差异块
        if (currentBlock.length > 0 && currentBlock.some(l => l.type !== 'equal')) {
          blocks.push({
            lines: [...currentBlock],
            startIndex: startIdx,
            endIndex: index - 1,
            hasDiff: true
          })
          currentBlock = []
        }
        // 开始或继续相同内容块
        if (currentBlock.length === 0) {
          startIdx = index
        }
        currentBlock.push(line)
      } else {
        // 如果当前块是相同内容，先保存相同内容块
        if (currentBlock.length > 0 && currentBlock.every(l => l.type === 'equal')) {
          blocks.push({
            lines: [...currentBlock],
            startIndex: startIdx,
            endIndex: index - 1,
            hasDiff: false
          })
          currentBlock = []
        }
        // 开始或继续差异块
        if (currentBlock.length === 0) {
          startIdx = index
        }
        currentBlock.push(line)
      }
    })
    
    if (currentBlock.length > 0) {
      blocks.push({
        lines: [...currentBlock],
        startIndex: startIdx,
        endIndex: lines.length - 1,
        hasDiff: currentBlock.some(l => l.type !== 'equal')
      })
    }

    // 计算统计信息
    const deleted = lines.filter(l => l.type === 'delete').length
    const inserted = lines.filter(l => l.type === 'insert').length
    const modified = Math.min(deleted, inserted)
    const diffBlocksList = blocks.filter(b => b.hasDiff)

    return {
      diffLines: lines,
      diffBlocks: blocks,
      stats: {
        deleted,
        inserted,
        modified,
        total: diffBlocksList.length
      }
    }
  }, [leftText, rightText])

  // 保留这些变量以备将来使用
  // const leftLines = useMemo(() => {
  //   return diffLines.filter(line => line.type !== 'insert')
  // }, [diffLines])

  // const rightLines = useMemo(() => {
  //   return diffLines.filter(line => line.type !== 'delete')
  // }, [diffLines])

  // 同步滚动处理 - 同步textarea和差异高亮层
  useEffect(() => {
    if (!syncScroll || viewMode !== 'split' || !leftText || !rightText) return

    const leftTextarea = document.querySelector('textarea[value*=""]') as HTMLTextAreaElement
    const rightTextarea = document.querySelectorAll('textarea')[1] as HTMLTextAreaElement
    const leftDiffLayer = leftScrollRef.current
    const rightDiffLayer = rightScrollRef.current

    if (!leftDiffLayer || !rightDiffLayer) return

    const handleLeftScroll = (e: Event) => {
      if (!isScrollingRef.current && e.target) {
        isScrollingRef.current = true
        const scrollTop = (e.target as HTMLTextAreaElement).scrollTop
        leftDiffLayer.scrollTop = scrollTop
        if (rightTextarea && rightDiffLayer) {
          rightTextarea.scrollTop = scrollTop
          rightDiffLayer.scrollTop = scrollTop
        }
        setTimeout(() => {
          isScrollingRef.current = false
        }, 50)
      }
    }

    const handleRightScroll = (e: Event) => {
      if (!isScrollingRef.current && e.target) {
        isScrollingRef.current = true
        const scrollTop = (e.target as HTMLTextAreaElement).scrollTop
        rightDiffLayer.scrollTop = scrollTop
        if (leftTextarea && leftDiffLayer) {
          leftTextarea.scrollTop = scrollTop
          leftDiffLayer.scrollTop = scrollTop
        }
        setTimeout(() => {
          isScrollingRef.current = false
        }, 50)
      }
    }

    // 使用事件委托，监听所有textarea的滚动
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach((textarea, index) => {
      if (index === 0) {
        textarea.addEventListener('scroll', handleLeftScroll)
      } else if (index === 1) {
        textarea.addEventListener('scroll', handleRightScroll)
      }
    })

    return () => {
      textareas.forEach((textarea, index) => {
        if (index === 0) {
          textarea.removeEventListener('scroll', handleLeftScroll)
        } else if (index === 1) {
          textarea.removeEventListener('scroll', handleRightScroll)
        }
      })
    }
  }, [syncScroll, viewMode, leftText, rightText])

  // 跳转到差异
  const diffBlockRefs = useRef<(HTMLDivElement | null)[]>([])

  // 保留此函数以备将来使用
  // const scrollToDiff = (index: number) => {
  //   const diffBlocksList = diffBlocks.filter(b => b.hasDiff)
  //   if (index < 0 || index >= diffBlocksList.length) return
  //   
  //   const block = diffBlocksList[index]
  //   const ref = diffBlockRefs.current[block.startIndex]
  //   if (ref) {
  //     ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
  //     // setCurrentDiffIndex(index)
  //   }
  // }

  // 保留这些函数以备将来使用
  // const nextDiff = () => {
  //   scrollToDiff(currentDiffIndex + 1)
  // }

  // const prevDiff = () => {
  //   scrollToDiff(currentDiffIndex - 1)
  // }

  // 处理差异选择
  const handleDiffChoice = (blockIndex: number, choice: DiffChoice) => {
    const newChoices = new Map(diffChoices)
    if (choice === null) {
      newChoices.delete(blockIndex)
    } else {
      newChoices.set(blockIndex, choice)
    }
    setDiffChoices(newChoices)
  }

  // 批量操作
  const acceptAll = () => {
    const diffBlocksList = diffBlocks.filter(b => b.hasDiff)
    const newChoices = new Map<number, DiffChoice>()
    diffBlocksList.forEach((block) => {
      newChoices.set(block.startIndex, 'accept')
    })
    setDiffChoices(newChoices)
  }

  const keepAll = () => {
    const diffBlocksList = diffBlocks.filter(b => b.hasDiff)
    const newChoices = new Map<number, DiffChoice>()
    diffBlocksList.forEach((block) => {
      newChoices.set(block.startIndex, 'keep')
    })
    setDiffChoices(newChoices)
  }

  const clearAllChoices = () => {
    setDiffChoices(new Map())
  }

  // 生成最终文档
  const finalDocument = useMemo(() => {
    if (!leftText && !rightText) return ''
    
    const result: string[] = []
    
    diffBlocks.forEach((block) => {
      if (!block.hasDiff) {
        // 相同内容直接添加
        result.push(...block.lines.map(l => l.text))
      } else {
        // 差异内容根据选择决定
        const choice = diffChoices.get(block.startIndex)
        
        if (choice === 'accept') {
          // 采纳新内容：只保留新增的内容
          block.lines.forEach(line => {
            if (line.type === 'insert' || line.type === 'equal') {
              result.push(line.text)
            }
          })
        } else if (choice === 'keep') {
          // 保留原文：只保留删除的内容（原文）
          block.lines.forEach(line => {
            if (line.type === 'delete' || line.type === 'equal') {
              result.push(line.text)
            }
          })
        } else {
          // 未选择：默认保留原文
          block.lines.forEach(line => {
            if (line.type === 'delete' || line.type === 'equal') {
              result.push(line.text)
            }
          })
        }
      }
    })
    
    return result.join('\n')
  }, [diffBlocks, diffChoices, leftText, rightText])

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalDocument)
      alert('已复制到剪贴板！')
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败，请手动选择文本复制')
    }
  }

  // 下载为Markdown文件
  const downloadMarkdown = () => {
    const blob = new Blob([finalDocument], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `最终文档_${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 处理双击编辑
  const handleDoubleClickEdit = (sectionId: string, side: 'left' | 'right', content: string) => {
    setEditingSection({ sectionId, side, originalContent: content })
    // 如果有编辑过的内容，使用编辑后的内容，否则使用原始内容
    const edited = editedContents.get(sectionId)
    const contentToEdit = side === 'left' 
      ? (edited?.left ?? content)
      : (edited?.right ?? content)
    setEditText(contentToEdit)
  }

  // 保存编辑内容
  const handleSaveEdit = () => {
    if (!editingSection) return
    
    const { sectionId, side } = editingSection
    const currentEdited = editedContents.get(sectionId) || {}
    
    if (side === 'left') {
      currentEdited.left = editText
    } else {
      currentEdited.right = editText
    }
    
    const newEditedContents = new Map(editedContents)
    newEditedContents.set(sectionId, currentEdited)
    setEditedContents(newEditedContents)
    setEditingSection(null)
    setEditText('')
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditText('')
  }

  // 获取显示的内容（优先使用编辑后的内容）
  const getDisplayContent = (sectionId: string, side: 'left' | 'right', originalContent: string): string => {
    const edited = editedContents.get(sectionId)
    if (side === 'left' && edited?.left !== undefined) {
      return edited.left
    }
    if (side === 'right' && edited?.right !== undefined) {
      return edited.right
    }
    return originalContent
  }

  const renderDiffLine = (line: DiffLine, index: number, _showNumber: boolean = false) => {
    const bgColor = 
      line.type === 'delete' ? 'bg-red-50 border-l-4 border-red-400' :
      line.type === 'insert' ? 'bg-green-50 border-l-4 border-green-400' :
      'bg-transparent'
    
    const textColor =
      line.type === 'delete' ? 'text-red-800' :
      line.type === 'insert' ? 'text-green-800' :
      'text-notion-text-secondary'

    return (
      <div 
        key={index} 
        className={`${bgColor} ${textColor} px-4 py-2 font-mono text-sm flex items-start gap-3 leading-relaxed`}
      >
        {showLineNumbers && (
          <span className="text-notion-text-tertiary text-xs select-none flex-shrink-0 w-12 text-right">
            {line.lineNumber || '\u00A0'}
          </span>
        )}
        <span className="flex-1">{line.text || '\u00A0'}</span>
      </div>
    )
  }


  const renderMarkdownDiff = (_lines: DiffLine[]) => {
    const filteredBlocks = hideUnchanged 
      ? diffBlocks.filter(b => b.hasDiff)
      : diffBlocks

    return (
      <div className="prose max-w-none">
        {filteredBlocks.map((block) => {
          const isDiff = block.hasDiff
          
          if (isDiff) {
            const choice = diffChoices.get(block.startIndex)
            const isAccepted = choice === 'accept'
            const isKept = choice === 'keep'
            
            return (
              <div 
                key={block.startIndex} 
                ref={el => diffBlockRefs.current[block.startIndex] = el}
                className={`my-2 border-l-4 rounded-r-lg ${
                  isAccepted 
                    ? 'border-green-500 bg-green-50/50' 
                    : isKept 
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-yellow-400 bg-yellow-50/30'
                }`}
              >
                {/* 选择按钮 */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/50 border-b border-notion-border">
                  <span className="text-xs font-medium text-notion-text-secondary">
                    差异块 #{diffBlocks.filter(b => b.hasDiff).indexOf(block) + 1}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDiffChoice(block.startIndex, 'keep')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        isKept
                          ? 'bg-blue-600 text-white'
                          : 'bg-notion-hover text-notion-text-secondary hover:bg-notion-selected'
                      }`}
                    >
                      保留原文
                    </button>
                    <button
                      onClick={() => handleDiffChoice(block.startIndex, 'accept')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        isAccepted
                          ? 'bg-green-600 text-white'
                          : 'bg-notion-hover text-notion-text-secondary hover:bg-notion-selected'
                      }`}
                    >
                      采纳新内容
                    </button>
                    {choice && (
                      <button
                        onClick={() => handleDiffChoice(block.startIndex, null)}
                        className="px-2 py-1 text-xs rounded-md bg-notion-hover text-notion-text-secondary hover:bg-notion-selected"
                        title="清除选择"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 差异内容 */}
                <div className="px-2">
                  {block.lines.map((line, lineIndex) => 
                    renderDiffLine(line, block.startIndex + lineIndex, showLineNumbers)
                  )}
                </div>
              </div>
            )
          } else {
            const markdown = block.lines.map(l => l.text).join('\n')
            return (
              <div key={block.startIndex} className="my-3">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none"
                  components={{
                    p: ({node, ...props}) => <p className="mb-4 leading-7" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="leading-7" {...props} />,
                    code: ({node, ...props}) => <code className="bg-notion-hover px-1.5 py-0.5 rounded text-sm" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            )
          }
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-notion-page">
      {/* 头部栏 */}
      <header className="bg-notion-bg border-b border-notion-border flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-notion-text">Markdown对比工具</h1>
              <p className="text-xs text-notion-text-secondary mt-0.5">对比两个Markdown文档的差异</p>
            </div>
            
            {/* 右上角控制按钮 */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 视图模式 */}
              <div className="flex items-center gap-1 bg-notion-hover rounded-[3px] p-1">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-medium transition-all duration-150 ${
                    viewMode === 'split'
                      ? 'bg-notion-bg text-notion-text shadow-notion-sm'
                      : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-selected'
                  }`}
                >
                  并排
                </button>
                <button
                  onClick={() => setViewMode('unified')}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-medium transition-all duration-150 ${
                    viewMode === 'unified'
                      ? 'bg-notion-bg text-notion-text shadow-notion-sm'
                      : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-selected'
                  }`}
                >
                  统一
                </button>
              </div>

              {/* 选项 */}
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-notion-text-secondary hover:text-notion-text transition-colors">
                  <input
                    type="checkbox"
                    checked={hideUnchanged}
                    onChange={(e) => setHideUnchanged(e.target.checked)}
                    className="rounded-[3px] w-3.5 h-3.5 border-notion-border text-notion-accent-blue focus:ring-notion-accent-blue"
                  />
                  隐藏相同
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-notion-text-secondary hover:text-notion-text transition-colors">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="rounded-[3px] w-3.5 h-3.5 border-notion-border text-notion-accent-blue focus:ring-notion-accent-blue"
                  />
                  行号
                </label>
                {viewMode === 'split' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-notion-text-secondary hover:text-notion-text transition-colors">
                    <input
                      type="checkbox"
                      checked={syncScroll}
                      onChange={(e) => setSyncScroll(e.target.checked)}
                      className="rounded-[3px] w-3.5 h-3.5 border-notion-border text-notion-accent-blue focus:ring-notion-accent-blue"
                    />
                    同步滚动
                  </label>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer text-notion-text-secondary hover:text-notion-text transition-colors">
                  <input
                    type="checkbox"
                    checked={compareBySection}
                    onChange={(e) => setCompareBySection(e.target.checked)}
                    className="rounded-[3px] w-3.5 h-3.5 border-notion-border text-notion-accent-blue focus:ring-notion-accent-blue"
                  />
                  按章节对比
                </label>
              </div>

              {/* 批量操作 */}
              {stats.total > 0 && (
                <div className="flex items-center gap-1.5 border-l border-notion-border pl-3">
                  <button
                    onClick={acceptAll}
                    className="px-2 py-1 text-xs rounded-[3px] bg-green-50 text-notion-accent-green hover:bg-green-100 font-medium transition-all duration-150 border border-green-200"
                    title="全部采纳"
                  >
                    全采纳
                  </button>
                  <button
                    onClick={keepAll}
                    className="px-2 py-1 text-xs rounded-[3px] bg-blue-50 text-notion-accent-blue hover:bg-blue-100 font-medium transition-all duration-150 border border-blue-200"
                    title="全部保留"
                  >
                    全保留
                  </button>
                  {diffChoices.size > 0 && (
                    <button
                      onClick={clearAllChoices}
                      className="px-2 py-1 text-xs rounded-[3px] bg-notion-hover text-notion-text-secondary hover:bg-notion-selected font-medium transition-all duration-150 border border-notion-border"
                      title="清除选择"
                    >
                      清除
                    </button>
                  )}
                  <button
                    onClick={() => setShowFinalDocument(!showFinalDocument)}
                    className={`px-2 py-1 text-xs rounded-[3px] font-medium transition-all duration-150 ${
                      showFinalDocument
                        ? 'bg-notion-accent-purple text-white border border-transparent'
                        : 'bg-purple-50 text-notion-accent-purple hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    {showFinalDocument ? '隐藏' : '生成'}文档
                  </button>
                </div>
              )}

              {/* 统计信息 */}
              <div className="flex items-center gap-2 text-xs border-l border-notion-border pl-3">
                <span className="text-notion-text-tertiary mr-1">统计:</span>
                <span className="flex items-center gap-1 text-notion-text-secondary" title="删除的行数">
                  <span className="w-2 h-2 bg-notion-accent-red rounded-full"></span>
                  <span className="text-notion-text-tertiary">删除:</span>
                  {stats.deleted}
                </span>
                <span className="flex items-center gap-1 text-notion-text-secondary" title="新增的行数">
                  <span className="w-2 h-2 bg-notion-accent-green rounded-full"></span>
                  <span className="text-notion-text-tertiary">新增:</span>
                  {stats.inserted}
                </span>
                {stats.total > 0 && (
                  <span className="text-notion-text-secondary" title="已选择的差异块数/总差异块数">
                    <span className="text-notion-text-tertiary">已选:</span>
                    {diffChoices.size}/{stats.total}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto flex flex-col px-4 sm:px-6 lg:px-8 py-4">
        {/* 输入区域 - 始终显示在最上方 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 flex-shrink-0" style={{ height: '200px' }}>
          <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border flex flex-col h-full">
            <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-notion-text">原文</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeftText('')}
                  className="text-xs text-notion-text-tertiary hover:text-notion-text px-2 py-1 rounded-[3px] hover:bg-notion-selected transition-all duration-150"
                  title="清空原文"
                >
                  清空
                </button>
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      setLeftText(text)
                    } catch (err) {
                      alert('无法读取剪贴板，请直接在文本框中粘贴（Ctrl+V 或 Cmd+V）')
                    }
                  }}
                  className="text-xs text-notion-text-tertiary hover:text-notion-text px-2 py-1 rounded-[3px] hover:bg-notion-selected transition-all duration-150"
                  title="从剪贴板粘贴"
                >
                  粘贴
                </button>
              </div>
            </div>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="在此输入第一个Markdown内容...（或点击粘贴按钮）"
              className="flex-1 w-full p-3 border-0 resize-none focus:ring-1 focus:ring-notion-accent-blue focus:outline-none font-mono text-sm leading-relaxed text-notion-text bg-notion-bg placeholder:text-notion-text-tertiary"
            />
          </div>
          <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border flex flex-col h-full">
            <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-notion-text">对比文本</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRightText('')}
                  className="text-xs text-notion-text-tertiary hover:text-notion-text px-2 py-1 rounded-[3px] hover:bg-notion-selected transition-all duration-150"
                  title="清空对比文本"
                >
                  清空
                </button>
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      setRightText(text)
                    } catch (err) {
                      alert('无法读取剪贴板，请直接在文本框中粘贴（Ctrl+V 或 Cmd+V）')
                    }
                  }}
                  className="text-xs text-notion-text-tertiary hover:text-notion-text px-2 py-1 rounded-[3px] hover:bg-notion-selected transition-all duration-150"
                  title="从剪贴板粘贴"
                >
                  粘贴
                </button>
              </div>
            </div>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="在此输入第二个Markdown内容...（或点击粘贴按钮）"
              className="flex-1 w-full p-3 border-0 resize-none focus:ring-1 focus:ring-notion-accent-blue focus:outline-none font-mono text-sm leading-relaxed text-notion-text bg-notion-bg placeholder:text-notion-text-tertiary"
            />
          </div>
        </div>

        {/* 章节导航栏 - 左右目录结构 */}
        {compareBySection && sectionMatches.matches && sectionMatches.matches.length > 0 && (
          <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border mb-4 flex-shrink-0">
            <div className="px-3 py-2 border-b border-notion-border bg-notion-hover">
              <h3 className="text-xs font-semibold text-notion-text-secondary">章节导航</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* 左侧：原文目录 */}
              <div className="border-r border-notion-border pr-4">
                <h4 className="text-xs font-semibold text-notion-text-secondary mb-3">原文目录</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {sectionMatches.leftSections.length > 0 ? (
                    sectionMatches.leftSections.map((section) => {
                      const match = sectionMatches.matches.find(m => m.leftSection?.id === section.id)
                      const hasDiff = match?.hasDiff || false
                      const matchType = match?.matchType || 'matched'
                      
                      return (
                        <button
                          key={`left-${section.id}`}
                          onClick={() => {
                            setSelectedSectionId(section.id)
                            const ref = sectionRefs.current.get(section.id)
                            if (ref) {
                              ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            selectedSectionId === section.id
                              ? 'bg-blue-600 text-white'
                              : hasDiff
                              ? matchType === 'leftOnly'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border-l-2 border-red-400'
                                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-l-2 border-yellow-400'
                              : 'text-notion-text-secondary hover:bg-notion-hover'
                          }`}
                          style={{ paddingLeft: `${(section.level - 1) * 12 + 8}px` }}
                          title={`${section.title}${hasDiff ? ' (有差异)' : ' (无差异)'}`}
                        >
                          <span className="flex items-center gap-1">
                            <span className="text-notion-text-tertiary text-xs">#{section.level}</span>
                            <span className="flex-1 truncate">{section.title}</span>
                            {hasDiff && (
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                matchType === 'leftOnly' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></span>
                            )}
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-xs text-notion-text-tertiary italic py-2">无章节</div>
                  )}
                </div>
              </div>
              
              {/* 右侧：对比文本目录 */}
              <div className="pl-4">
                <h4 className="text-xs font-semibold text-notion-text-secondary mb-3">对比文本目录</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {sectionMatches.rightSections.length > 0 ? (
                    sectionMatches.rightSections.map((section) => {
                      const match = sectionMatches.matches.find(m => m.rightSection?.id === section.id)
                      const hasDiff = match?.hasDiff || false
                      const matchType = match?.matchType || 'matched'
                      
                      return (
                        <button
                          key={`right-${section.id}`}
                          onClick={() => {
                            setSelectedSectionId(section.id)
                            const ref = sectionRefs.current.get(section.id)
                            if (ref) {
                              ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            selectedSectionId === section.id
                              ? 'bg-blue-600 text-white'
                              : hasDiff
                              ? matchType === 'rightOnly'
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-l-2 border-green-400'
                                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-l-2 border-yellow-400'
                              : 'text-notion-text-secondary hover:bg-notion-hover'
                          }`}
                          style={{ paddingLeft: `${(section.level - 1) * 12 + 8}px` }}
                          title={`${section.title}${hasDiff ? ' (有差异)' : ' (无差异)'}`}
                        >
                          <span className="flex items-center gap-1">
                            <span className="text-notion-text-tertiary text-xs">#{section.level}</span>
                            <span className="flex-1 truncate">{section.title}</span>
                            {hasDiff && (
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                matchType === 'rightOnly' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></span>
                            )}
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-xs text-notion-text-tertiary italic py-2">无章节</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 对比结果区域 */}
        {(leftText || rightText) ? (
          // 有内容时显示对比视图
          compareBySection && sectionMatches.matches && sectionMatches.matches.length > 0 ? (
            // 按章节对比视图
            <div className="flex-shrink-0">
              {sectionMatches.matches.map((match) => {
                const section = match.leftSection || match.rightSection
                if (!section) return null
                
                return (
                  <div
                    key={section.id}
                    ref={el => {
                      if (el) sectionRefs.current.set(section.id, el)
                    }}
                    className="mb-6 bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border"
                  >
                    {/* 章节标题 */}
                    <div className={`px-4 py-3 border-b border-notion-border ${
                      match.hasDiff 
                        ? match.matchType === 'leftOnly'
                          ? 'bg-red-50'
                          : match.matchType === 'rightOnly'
                          ? 'bg-green-50'
                          : 'bg-yellow-50'
                        : 'bg-notion-hover'
                    }`}>
                      {match.matchType === 'matched' && match.leftSection && match.rightSection ? (
                        // 匹配的章节：并排显示两个标题
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                            <div>
                              <h3 className={`text-base font-bold text-notion-text`} style={{ fontSize: `${20 - match.leftSection.level * 2}px` }}>
                                {'#'.repeat(match.leftSection.level)} {match.leftSection.title}
                              </h3>
                            </div>
                            <div>
                              <h3 className={`text-base font-bold text-notion-text`} style={{ fontSize: `${20 - match.rightSection.level * 2}px` }}>
                                {'#'.repeat(match.rightSection.level)} {match.rightSection.title}
                              </h3>
                            </div>
                          </div>
                          {/* 差异状态标签 */}
                          <div className="flex items-center gap-2 ml-4">
                            {match.hasDiff ? (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">有差异</span>
                            ) : (
                              <span className="text-xs text-notion-text-secondary bg-notion-hover px-2 py-1 rounded">无差异</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        // 不匹配的章节：显示单个标题
                        <div className="flex items-center justify-between">
                          <h3 className={`text-base font-bold text-notion-text`} style={{ fontSize: `${20 - section.level * 2}px` }}>
                            {'#'.repeat(section.level)} {section.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {match.matchType === 'leftOnly' && (
                              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">仅左侧</span>
                            )}
                            {match.matchType === 'rightOnly' && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">仅右侧</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 章节内容对比 */}
                    <div className="p-4">
                      {viewMode === 'split' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="border-r border-notion-border pr-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-notion-text-secondary">原文</h4>
                              {match.leftSection?.content && (
                                <span className="text-xs text-notion-text-tertiary">
                                  {(() => {
                                    const sectionId = match.leftSection!.id
                                    const displayContent = getDisplayContent(sectionId, 'left', match.leftSection!.content)
                                    return displayContent.replace(/\s/g, '').length
                                  })()} 字
                                </span>
                              )}
                            </div>
                            <div 
                              className="font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-notion-text cursor-pointer"
                              onDoubleClick={() => {
                                if (match.leftSection?.content) {
                                  const sectionId = match.leftSection.id
                                  getDisplayContent(sectionId, 'left', match.leftSection.content)
                                  handleDoubleClickEdit(sectionId, 'left', match.leftSection.content)
                                }
                              }}
                              title="双击编辑内容"
                            >
                              {match.leftSection ? (
                                match.leftSection.content ? (
                                  (() => {
                                    const sectionId = match.leftSection!.id
                                    const displayContent = getDisplayContent(sectionId, 'left', match.leftSection!.content)
                                    return displayContent.split('\n').map((line, idx) => {
                                      const isDiffLine = match.hasDiff && match.matchType === 'matched'
                                      return (
                                        <div 
                                          key={idx} 
                                          className={`${isDiffLine ? 'bg-red-50/50 border-l-2 border-red-300 pl-2' : ''} text-notion-text`}
                                        >
                                          {line || '\u00A0'}
                                        </div>
                                      )
                                    })
                                  })()
                                ) : (
                                  <span className="text-notion-text-tertiary">章节内容为空</span>
                                )
                              ) : (
                                <span className="text-notion-text-tertiary italic">无此章节</span>
                              )}
                            </div>
                          </div>
                          <div className="pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-notion-text-secondary">对比文本</h4>
                              {match.rightSection?.content && (
                                <span className="text-xs text-notion-text-tertiary">
                                  {(() => {
                                    const sectionId = match.rightSection!.id
                                    const displayContent = getDisplayContent(sectionId, 'right', match.rightSection!.content)
                                    return displayContent.replace(/\s/g, '').length
                                  })()} 字
                                </span>
                              )}
                            </div>
                            <div 
                              className="font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-notion-text cursor-pointer"
                              onDoubleClick={() => {
                                if (match.rightSection?.content) {
                                  const sectionId = match.rightSection.id
                                  getDisplayContent(sectionId, 'right', match.rightSection.content)
                                  handleDoubleClickEdit(sectionId, 'right', match.rightSection.content)
                                }
                              }}
                              title="双击编辑内容"
                            >
                              {match.rightSection ? (
                                match.rightSection.content ? (
                                  (() => {
                                    const sectionId = match.rightSection!.id
                                    const displayContent = getDisplayContent(sectionId, 'right', match.rightSection!.content)
                                    return displayContent.split('\n').map((line, idx) => {
                                      const isDiffLine = match.hasDiff && match.matchType === 'matched'
                                      return (
                                        <div 
                                          key={idx} 
                                          className={`${isDiffLine ? 'bg-green-50/50 border-l-2 border-green-300 pl-2' : ''} text-notion-text`}
                                        >
                                          {line || '\u00A0'}
                                        </div>
                                      )
                                    })
                                  })()
                                ) : (
                                  <span className="text-notion-text-tertiary">章节内容为空</span>
                                )
                              ) : (
                                <span className="text-notion-text-tertiary italic">无此章节</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-notion-text">
                          {match.matchType === 'matched' && match.diffBlocks.length > 0 ? (
                            match.diffBlocks.map((block, blockIdx) => (
                              <div key={blockIdx} className="my-2 border-l-4 border-yellow-400 bg-yellow-50/30 p-2 rounded-r">
                                {block.lines.map((line, lineIdx) => (
                                  <div
                                    key={lineIdx}
                                    className={`px-2 py-1 ${
                                      line.type === 'delete'
                                        ? 'bg-red-100 text-red-800 border-l-4 border-red-400'
                                        : line.type === 'insert'
                                        ? 'bg-green-100 text-green-800 border-l-4 border-green-400'
                                        : 'text-notion-text'
                                    }`}
                                  >
                                    {line.text || '\u00A0'}
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : match.matchType === 'matched' ? (
                            <div className="text-notion-text-secondary italic p-4 bg-notion-hover rounded">内容相同，无差异</div>
                          ) : (
                            <div className="text-notion-text-secondary italic p-4 bg-notion-hover rounded">
                              {match.matchType === 'leftOnly' ? '此章节仅在原文中存在' : '此章节仅在对比文本中存在'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-shrink-0">
              {/* 左侧：原文 + 差异高亮 */}
              <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border flex flex-col">
                <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-notion-text">原文</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeftText('')}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="清空原文"
                    >
                      清空
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText()
                          setLeftText(text)
                        } catch (err) {
                          alert('无法读取剪贴板，请直接在文本框中粘贴（Ctrl+V 或 Cmd+V）')
                        }
                      }}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="从剪贴板粘贴"
                    >
                      粘贴
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(leftText)
                          alert('已复制到剪贴板！')
                        } catch (err) {
                          const textarea = document.createElement('textarea')
                          textarea.value = leftText
                          document.body.appendChild(textarea)
                          textarea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textarea)
                          alert('已复制到剪贴板！')
                        }
                      }}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="复制原文"
                    >
                      复制
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={leftText}
                    onChange={(e) => setLeftText(e.target.value)}
                    placeholder="在此输入第一个Markdown内容..."
                    className="w-full min-h-[400px] p-3 border-0 resize-y focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm leading-relaxed text-notion-text bg-white"
                  />
                </div>
              </div>
              
              {/* 右侧：对比文本 + 差异高亮 */}
              <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border flex flex-col">
                <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-notion-text">对比文本</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightText('')}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="清空对比文本"
                    >
                      清空
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText()
                          setRightText(text)
                        } catch (err) {
                          alert('无法读取剪贴板，请直接在文本框中粘贴（Ctrl+V 或 Cmd+V）')
                        }
                      }}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="从剪贴板粘贴"
                    >
                      粘贴
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(rightText)
                          alert('已复制到剪贴板！')
                        } catch (err) {
                          const textarea = document.createElement('textarea')
                          textarea.value = rightText
                          document.body.appendChild(textarea)
                          textarea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textarea)
                          alert('已复制到剪贴板！')
                        }
                      }}
                      className="text-xs text-notion-text-tertiary hover:text-notion-text-secondary px-2 py-1 rounded hover:bg-notion-hover"
                      title="复制对比文本"
                    >
                      复制
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={rightText}
                    onChange={(e) => setRightText(e.target.value)}
                    placeholder="在此输入第二个Markdown内容..."
                    className="w-full min-h-[400px] p-3 border-0 resize-y focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm leading-relaxed text-notion-text bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            // 统一视图
            <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border flex-shrink-0">
              <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex-shrink-0">
                <h2 className="text-sm font-semibold text-notion-text">统一对比视图</h2>
              </div>
              <div className="p-4">
                {renderMarkdownDiff(diffLines)}
              </div>
            </div>
          )
        ) : null}

        {/* 最终文档模块 - 根据采纳选择生成的Markdown文档 */}
        {showFinalDocument && (leftText || rightText) && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md border-2 border-purple-200 flex-1 flex flex-col overflow-hidden mt-4">
            <div className="px-4 py-3 border-b border-purple-200 bg-white/80 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h2 className="text-base font-bold text-notion-text">最终文档</h2>
                <span className="text-xs text-notion-text-tertiary bg-notion-hover px-2 py-1 rounded">
                  已选择 {diffChoices.size} / {stats.total} 个差异块
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium transition-colors shadow-sm"
                  title="复制Markdown文本到剪贴板"
                >
                  📋 复制
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 text-xs font-medium transition-colors shadow-sm"
                  title="下载为.md文件"
                >
                  ⬇️ 下载
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-4 bg-white/50">
              {/* Markdown渲染预览 */}
              <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border mb-4 overflow-hidden">
                <div className="px-3 py-2 border-b border-notion-border bg-notion-hover">
                  <h3 className="text-xs font-semibold text-notion-text-secondary">预览</h3>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  <div className="prose max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-4 leading-7" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="leading-7" {...props} />,
                        code: ({node, ...props}) => <code className="bg-notion-hover px-1.5 py-0.5 rounded text-sm" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                      }}
                    >
                      {finalDocument || '*暂无内容*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              
              {/* 原始Markdown文本 */}
              <div className="bg-notion-bg rounded-[3px] shadow-notion-sm border border-notion-border overflow-hidden">
                <div className="px-3 py-2 border-b border-notion-border bg-notion-hover flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-notion-text-secondary">Markdown源代码</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-2 py-1 rounded bg-notion-hover text-notion-text-secondary hover:bg-notion-selected text-xs font-medium transition-colors"
                      title="复制Markdown文本"
                    >
                      复制
                    </button>
                    <button
                      onClick={downloadMarkdown}
                      className="px-2 py-1 rounded bg-notion-hover text-notion-text-secondary hover:bg-notion-selected text-xs font-medium transition-colors"
                      title="下载为.md文件"
                    >
                      下载
                    </button>
                  </div>
                </div>
                <textarea
                  value={finalDocument || ''}
                  readOnly
                  className="w-full h-64 p-4 border-0 font-mono text-xs bg-notion-hover resize-none focus:outline-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  placeholder="根据您的选择，这里将显示合并后的Markdown文档..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 编辑弹层 */}
        {editingSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-notion-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-notion-text">
                    编辑内容 - {editingSection.side === 'left' ? '原文' : '对比文本'}
                  </h3>
                  <p className="text-sm text-notion-text-tertiary mt-1">
                    章节ID: {editingSection.sectionId}
                  </p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-notion-text-tertiary hover:text-notion-text-secondary text-2xl font-bold"
                  title="关闭"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="在此编辑内容..."
                />
              </div>
              <div className="px-6 py-4 border-t border-notion-border flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-md bg-notion-hover text-notion-text-secondary hover:bg-notion-selected font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default MarkdownCompare
