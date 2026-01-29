各种输入方式
  ├── 消息通道（WhatsApp、Telegram 等）
  │   └── Channel 接收 → Gateway
  ├── CLI 命令
  │   └── CLI → Gateway（直接）
  ├── Webhooks
  │   └── HTTP → Gateway（直接）
  ├── Cron
  │   └── Cron → Gateway（直接）
  ├── Web UI
  │   └── WebSocket → Gateway（直接）
  ├── Voice Wake
  │   └── Voice → Gateway（直接）
  └── Gmail Watcher
      └── Gmail → Gateway（直接）
       ↓
Gateway（统一入口）✅
  ↓
Gateway 路由消息
  ↓
Agent 处理消息 ✅
  ├── 调用 Browser Control（如果需要）
  ├── 调用 Canvas（如果需要）
  ├── 使用 Skills（如果需要）
  └── 调用 Plugins（如果需要）
  ↓
Agent 生成回复 ✅
  ↓
Gateway 接收回复 ✅
  ↓
Gateway 路由回复
  ├── 消息通道 → Channel 发送
  ├── CLI → CLI 输出
  ├── Webhooks → HTTP 响应
  ├── Cron → （可选）Channel 发送
  ├── Web UI → WebSocket 返回
  ├── Voice Wake → （可选）Channel 发送
  └── Gmail Watcher → （可选）Channel 发送
