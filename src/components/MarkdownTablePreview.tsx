import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修复Leaflet默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface RouteSegment {
  route: string
  transport: string
  time: string
  price: string
  notes: string
  accommodation: string
  cash: string
  alternative: string
  from?: string
  to?: string
}

const MarkdownTablePreview = () => {
  const [markdownContent, setMarkdownContent] = useState(`### 🗺️ 杭州至伦敦火车行程总表

| 路段 | 车次/交通方式 | 时间 | 票价 | 通关流程与注意事项 | 住宿 | 现金和离线地图 | 备选方案 |
|------|--------------|------|------|-------------------|------|---------------|----------|
| **杭州 → 北京（中国境内）** | **G32次高铁** | **07:47 杭州东站发车 → 12:20 北京南站到达**（全程4小时33分钟） | **二等座 ¥674，一等座 ¥1077，商务座 ¥2357**  | • 每日多班高铁，建议选择上午车次以便衔接后续行程<br>• 提前12306官网购票，旺季需提前15天<br>• 北京南站可地铁4号线直达北京站（约30分钟） |  |  | **备选车次**：<br>• G172次：06:50杭州东→13:08北京南 <br>• G42次：杭州东→北京南（2026年1月26日起新增）  |
| **北京 → 集宁南- 二连浩特（中国境内）** | D1051-4653 | **19:55 北京站发车 → 06:50 二连浩特站到达**（全程10小时55分钟） | 有软卧 | 每日都有 |  |  |  |
| **二连浩特（中国） ↔ 扎门乌德（蒙古）** | **口岸小巴/面包车**（非固定巴士） | **8:00–18:00运营**（建议9:00前抵达口岸） | **¥20–30 元**（或10,000–15,000 MNT） | **通关流程**：<br>1. **中国出境**：在二连公路口岸出示护照+蒙古电子签证<br>2. **步行/乘车过境**：约1公里，5分钟<br>3. **蒙古入境**：在扎门乌德口岸办理，耗时30–60分钟<br>**关键提示**：<br>• 蒙古电子签证：[https://egov.mongolia.gov.mn](https://egov.mongolia.gov.mn)，单次$50，3天出签<br>• 口岸每日开放8:00–18:00，周末正常开放，法定节假日闭关<br>• 2023年1月已恢复客运通关 |  | 兑换¥500等值蒙古图格里克（MNT），用于小巴和火车购票<br>下载蒙古国铁时刻表（Rail Guide Mongolia APP）+ 离线地图（Maps.me） |  |
| **扎门乌德 → 乌兰巴托（蒙古国内）** | **蒙古国铁 №401/402次**（或替代车次） | **扎门乌德20:00发车 → 次日09:30乌兰巴托到达**（约13.5小时） | **硬卧 ≈¥120**（60,000 MNT） | • **无固定401/402次**，当前主要车次：**№278**（每周五乌兰巴托→扎门乌德）及反向车<br>• **每日有1班夜车**：扎门乌德20:00左右发车，次日早晨抵达乌兰巴托<br>• 购票：扎门乌德车站现场购票或官网 [https://eticket.ubtz.mn](https://eticket.ubtz.mn)<br>• 车况老旧但安全，建议自带食物、水和充电宝 | 乌兰巴托车站附近推荐"UB Hostel"（¥80/晚，含早餐，步行5分钟到车站） | 兑换¥300等值蒙古图格里克（MNT）<br>下载乌兰巴托离线地图（Maps.me） | 若火车停运，可乘长途巴士（8–10小时，¥100）或拼车（6小时，¥150） |`)

  const [showItinerary, setShowItinerary] = useState(false)

  // 解析表格数据
  const routeSegments = useMemo(() => {
    const segments: RouteSegment[] = []
    const lines = markdownContent.split('\n')
    
    // 查找表格行（以|开头）
    let inTable = false
    let headerFound = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 检测表格开始（包含表头分隔符）
      if (line.includes('|') && line.includes('---')) {
        inTable = true
        headerFound = true
        continue
      }
      
      // 如果找到表头，开始解析数据行
      if (inTable && headerFound && line.startsWith('|') && !line.includes('---')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c)
        
        if (cells.length >= 4) {
          const route = cells[0] || ''
          const transport = cells[1] || ''
          const time = cells[2] || ''
          const price = cells[3] || ''
          const notes = cells[4] || ''
          const accommodation = cells[5] || ''
          const cash = cells[6] || ''
          const alternative = cells[7] || ''
          
          // 提取起点和终点
          const routeMatch = route.match(/\*\*(.+?)\s*→\s*(.+?)\*\*/)
          const from = routeMatch ? routeMatch[1].replace(/（.*?）/g, '').trim() : ''
          const to = routeMatch ? routeMatch[2].replace(/（.*?）/g, '').trim() : ''
          
          segments.push({
            route,
            transport,
            time,
            price,
            notes,
            accommodation,
            cash,
            alternative,
            from,
            to
          })
        }
      }
    }
    
    return segments
  }, [markdownContent])

  // 城市坐标映射（简化版，实际应该使用地理编码API）
  const cityCoordinates: Record<string, [number, number]> = {
    '杭州': [30.2741, 120.1551],
    '北京': [39.9042, 116.4074],
    '二连浩特': [43.6530, 111.9770],
    '扎门乌德': [43.7167, 111.9167],
    '乌兰巴托': [47.8864, 106.9057],
  }

  // 生成地图路径点
  const mapPoints = useMemo(() => {
    const points: [number, number][] = []
    const labels: string[] = []
    
    routeSegments.forEach((segment, index) => {
      if (segment.from && cityCoordinates[segment.from]) {
        points.push(cityCoordinates[segment.from])
        labels.push(segment.from)
      }
      if (segment.to && cityCoordinates[segment.to] && index === routeSegments.length - 1) {
        points.push(cityCoordinates[segment.to])
        labels.push(segment.to)
      }
    })
    
    return { points, labels }
  }, [routeSegments])

  return (
    <div className="flex flex-col h-screen bg-notion-page">
      {/* 头部栏 */}
      <header className="bg-notion-bg border-b border-notion-border flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-notion-text">
                Markdown表格预览工具
              </h1>
              <p className="text-sm text-notion-text-secondary mt-1">实时预览和编辑Markdown表格内容</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 flex-1 min-h-0">
          {/* 左侧：编辑区域 - 占2列 */}
          <div className="lg:col-span-2 bg-notion-bg rounded-[3px] shadow-notion border border-notion-border flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-notion-accent-blue rounded-full"></div>
                <h2 className="text-sm font-semibold text-notion-text">Markdown源代码</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMarkdownContent('')}
                  className="text-xs text-notion-text-secondary hover:text-notion-text px-3 py-1.5 rounded-[3px] hover:bg-notion-selected transition-all duration-150 font-medium"
                  title="清空内容"
                >
                  清空
                </button>
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      setMarkdownContent(text)
                    } catch (err) {
                      alert('无法读取剪贴板，请直接在文本框中粘贴（Ctrl+V 或 Cmd+V）')
                    }
                  }}
                  className="text-xs text-notion-accent-blue hover:text-blue-700 px-3 py-1.5 rounded-[3px] hover:bg-blue-50 transition-all duration-150 font-medium border border-blue-200"
                  title="从剪贴板粘贴"
                >
                  粘贴
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(markdownContent)
                      alert('已复制到剪贴板！')
                    } catch (err) {
                      alert('复制失败，请手动选择文本复制')
                    }
                  }}
                  className="text-xs text-notion-accent-green hover:text-green-700 px-3 py-1.5 rounded-[3px] hover:bg-green-50 transition-all duration-150 font-medium border border-green-200"
                  title="复制内容"
                >
                  复制
                </button>
              </div>
            </div>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder="在此输入Markdown表格内容..."
              className="flex-1 w-full p-4 border-0 resize-none focus:ring-1 focus:ring-notion-accent-blue focus:outline-none font-mono text-sm leading-relaxed text-notion-text bg-notion-bg placeholder:text-notion-text-tertiary transition-all"
            />
          </div>

          {/* 右侧：预览区域 - 占8列 */}
          <div className="lg:col-span-8 bg-notion-bg rounded-[3px] shadow-notion border border-notion-border flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-notion-border bg-notion-hover flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-notion-accent-green rounded-full"></div>
                <h2 className="text-sm font-semibold text-notion-text">实时预览</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowItinerary(true)}
                  className="text-xs text-notion-accent-orange hover:text-orange-700 px-3 py-1.5 rounded-[3px] hover:bg-orange-50 transition-all duration-150 font-medium border border-orange-200"
                  title="生成行程计划单"
                >
                  🗺️ 生成行程计划单
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `markdown表格_${new Date().toISOString().slice(0, 10)}.md`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  }}
                  className="text-xs text-notion-accent-purple hover:text-purple-700 px-3 py-1.5 rounded-[3px] hover:bg-purple-50 transition-all duration-150 font-medium border border-purple-200"
                  title="下载为Markdown文件"
                >
                  ⬇️ 下载
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-notion-page">
              <style>{`
                /* 自定义滚动条样式 */
                div::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({node, ...props}) => (
                      <h1 className="text-3xl font-semibold mt-8 mb-6 text-notion-text border-b-2 border-notion-border pb-3" {...props} />
                    ),
                    h2: ({node, ...props}) => (
                      <h2 className="text-2xl font-semibold mt-8 mb-4 text-notion-text border-b border-notion-border pb-2" {...props} />
                    ),
                    h3: ({node, children, ...props}) => (
                      <h3 className="text-xl font-semibold mt-6 mb-3 text-notion-text flex items-center gap-2" {...props}>
                        <span className="w-1 h-6 bg-notion-accent-blue rounded-full flex-shrink-0"></span>
                        <span>{children}</span>
                      </h3>
                    ),
                    h4: ({node, ...props}) => (
                      <h4 className="text-lg font-semibold mt-5 mb-2 text-notion-text" {...props} />
                    ),
                    p: ({node, ...props}) => <p className="mb-4 leading-7 text-notion-text-secondary" {...props} />,
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-6 rounded-[3px] shadow-notion border border-notion-border bg-notion-bg">
                        <table className="min-w-full divide-y divide-notion-border" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => (
                      <thead className="bg-notion-accent-blue" {...props} />
                    ),
                    tbody: ({node, ...props}) => (
                      <tbody className="bg-notion-bg divide-y divide-notion-border" {...props} />
                    ),
                    tr: ({node, ...props}) => (
                      <tr className="hover:bg-notion-hover transition-all duration-150 border-b border-notion-border even:bg-notion-hover/30" {...props} />
                    ),
                    th: ({node, ...props}) => (
                      <th className="px-5 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-white/20 last:border-r-0" {...props} />
                    ),
                    td: ({node, ...props}) => (
                      <td className="px-5 py-4 text-sm text-notion-text-secondary align-top border-r border-notion-border last:border-r-0 leading-relaxed whitespace-normal" {...props} />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="list-disc pl-6 mb-4 space-y-2 text-notion-text-secondary marker:text-notion-accent-blue" {...props} />
                    ),
                    ol: ({node, ...props}) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-2 text-notion-text-secondary marker:text-notion-accent-blue marker:font-semibold" {...props} />
                    ),
                    li: ({node, ...props}) => (
                      <li className="leading-7 pl-2" {...props} />
                    ),
                    strong: ({node, ...props}) => (
                      <strong className="font-semibold text-notion-text" {...props} />
                    ),
                    a: ({node, ...props}) => (
                      <a className="text-notion-accent-blue hover:text-blue-700 underline decoration-1 underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    code: ({node, ...props}) => (
                      <code className="bg-notion-hover text-notion-accent-blue px-2 py-1 rounded-[3px] text-sm font-mono border border-notion-border" {...props} />
                    ),
                    pre: ({node, ...props}) => (
                      <pre className="bg-notion-text text-white p-4 rounded-[3px] overflow-x-auto mb-4 shadow-notion border border-notion-border" {...props} />
                    ),
                  }}
                >
                  {markdownContent || '*暂无内容，请在左侧输入Markdown表格*'}
                </ReactMarkdown>
                {!markdownContent && (
                  <div className="text-center py-12 text-notion-text-tertiary">
                    <div className="text-4xl mb-2">📋</div>
                    <p>暂无内容，请在左侧输入Markdown表格</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 行程计划单弹窗 */}
      {showItinerary && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-notion-bg rounded-[3px] shadow-notion max-w-7xl w-full max-h-[90vh] flex flex-col border border-notion-border">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-notion-border bg-notion-accent-blue flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <h2 className="text-xl font-semibold text-white">行程计划单</h2>
              </div>
              <button
                onClick={() => setShowItinerary(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-all duration-150"
                title="关闭"
              >
                ×
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 p-6 overflow-y-auto">
                {/* 左侧：行程详情 */}
                <div className="bg-notion-hover rounded-[3px] p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    行程详情
                  </h3>
                  <div className="space-y-4">
                    {routeSegments.map((segment, index) => (
                      <div key={index} className="bg-notion-bg rounded-[3px] p-4 shadow-notion-sm border border-notion-border">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-notion-accent-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-notion-text mb-2">{segment.route}</h4>
                            <div className="space-y-1 text-sm text-notion-text-secondary">
                              <div><span className="font-semibold">交通方式：</span>{segment.transport}</div>
                              <div><span className="font-semibold">时间：</span>{segment.time}</div>
                              {segment.price && <div><span className="font-semibold">票价：</span>{segment.price}</div>}
                              {segment.accommodation && (
                                <div><span className="font-semibold">住宿：</span>{segment.accommodation}</div>
                              )}
                              {segment.notes && (
                                <div className="mt-2 text-xs text-notion-text-secondary bg-blue-50 p-2 rounded-[3px] border border-blue-200">
                                  <span className="font-semibold">注意事项：</span>
                                  <div dangerouslySetInnerHTML={{ __html: segment.notes.replace(/\n/g, '<br>') }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右侧：地图展示 */}
                <div className="bg-notion-hover rounded-[3px] overflow-hidden">
                  <h3 className="text-lg font-semibold text-notion-text mb-4 p-4 flex items-center gap-2">
                    <span className="text-2xl">🗺️</span>
                    路线地图
                  </h3>
                  {mapPoints.points.length > 0 ? (
                    <div className="h-[calc(100%-80px)]">
                      <MapContainer
                        center={mapPoints.points[0] || [40, 110]}
                        zoom={4}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {mapPoints.points.map((point, index) => (
                          <Marker key={index} position={point}>
                            <Popup>
                              <div className="font-semibold">{mapPoints.labels[index] || `站点 ${index + 1}`}</div>
                              {routeSegments[index] && (
                                <div className="text-xs mt-1">
                                  {routeSegments[index].transport}
                                </div>
                              )}
                            </Popup>
                          </Marker>
                        ))}
                        {mapPoints.points.length > 1 && (
                          <Polyline
                            positions={mapPoints.points}
                            color="#0B85FF"
                            weight={3}
                            opacity={0.7}
                          />
                        )}
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-[calc(100%-80px)] flex items-center justify-center text-notion-text-tertiary">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🗺️</div>
                        <p>无法解析路线信息</p>
                        <p className="text-xs mt-1">请确保表格中包含有效的起点和终点信息</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-notion-border bg-notion-hover flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  const itineraryText = routeSegments.map((seg, idx) => 
                    `${idx + 1}. ${seg.route}\n   交通：${seg.transport}\n   时间：${seg.time}\n   票价：${seg.price}`
                  ).join('\n\n')
                  const blob = new Blob([itineraryText], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `行程计划单_${new Date().toISOString().slice(0, 10)}.txt`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 rounded-[3px] bg-notion-accent-blue text-white hover:bg-blue-700 font-medium transition-all duration-150 shadow-notion-sm"
              >
                下载行程单
              </button>
              <button
                onClick={() => setShowItinerary(false)}
                className="px-4 py-2 rounded-[3px] bg-notion-selected text-notion-text-secondary hover:bg-notion-border font-medium transition-all duration-150 border border-notion-border"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarkdownTablePreview
