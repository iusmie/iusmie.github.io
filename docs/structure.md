# 项目目录结构说明

## 目录结构

```
iusmie.github.io-main/
├── README.md                    # 项目说明
├── package.json                 # 根package.json
├── .gitignore                   # Git忽略文件
│
├── apps/                        # 应用目录
│   └── markdown-tools/          # Markdown工具React应用
│       ├── index.html           # React应用入口
│       ├── vite.config.ts       # Vite配置
│       ├── tailwind.config.js   # Tailwind配置
│       ├── postcss.config.js    # PostCSS配置
│       ├── tsconfig.json        # TypeScript配置
│       ├── package.json         # 应用依赖（可选）
│       └── src/                 # React源码
│           ├── App.tsx
│           ├── main.tsx
│           ├── index.css
│           └── components/
│
├── pages/                       # 静态页面统一目录
│   ├── islands/                 # 个人岛屿页面
│   │   ├── dev-tools.html
│   │   ├── travel.html
│   │   ├── health.html
│   │   ├── pets.html
│   │   ├── study-abroad.html
│   │   └── ideas.html
│   ├── study-abroad/            # 留学相关页面
│   │   ├── study-abroad-tools.html  # 重命名避免冲突
│   │   └── world-clock/
│   │       └── index.html
│   └── tools/                   # 工具页面
│       ├── index.html
│       ├── markdown-viewer.html
│       └── timestamp/
│           └── index.html
│
├── assets/                      # 资源文件
│   ├── shared/                  # 共享资源
│   │   └── styles/
│   │       └── variables.css    # CSS变量定义
│   ├── static/                  # 静态页面资源
│   │   ├── css/
│   │   │   └── common.css       # 静态页面样式
│   │   └── js/
│   │       ├── i18n.js          # 国际化脚本
│   │       ├── ideas.js         # 想法管理脚本
│   │       └── islands-animation.js  # 动画脚本
│   └── images/                  # 图片资源
│
├── public/                      # 公共静态文件
│   └── favicon.ico
│
├── scripts/                     # 构建脚本
│   ├── build-static.js          # 静态页面构建（待实现）
│   └── build-all.js             # 统一构建（待实现）
│
└── docs/                        # 文档
    ├── structure.md             # 目录结构说明（本文件）
    └── development.md           # 开发指南（待完善）
```

## 路径引用规则

### 静态页面引用资源
- CSS: `../../assets/static/css/common.css`
- JS: `../../assets/static/js/[filename].js`
- 返回首页: `../../index.html`

### React应用
- 使用相对路径引用 `src/` 下的文件
- 构建输出到 `dist/` 目录

### 共享资源
- CSS变量: `assets/shared/styles/variables.css`（待集成）

## 文件重命名说明

为避免冲突，以下文件已重命名：
- `pages/study-abroad/index.html` → `pages/study-abroad/study-abroad-tools.html`
  - 原因：与 `pages/islands/study-abroad.html` 功能不同，避免混淆

## 开发说明

### React应用开发
```bash
cd apps/markdown-tools
npm install
npm run dev
```

### 静态页面
直接在浏览器中打开HTML文件即可，或使用本地服务器。

## 待完善功能

1. 统一构建脚本
2. 共享CSS变量集成
3. 开发指南文档
4. 自动化测试
