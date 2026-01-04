# SPR 飞书多维表格插件

基于**结构化渐进提取 (SPR)** 方法的飞书多维表格智能学习插件，帮助用户高效学习 Markdown 文档内容。

## 功能特性

- 🧠 **智能文档分析** - 使用 Gemini AI 将 Markdown 文档解析为结构化知识树
- 📝 **笔记管理** - 支持为每个知识节点添加笔记，自动分类
- 🎯 **进度追踪** - 标记已掌握的知识点，可视化学习进度
- 🔄 **多端同步** - 支持 LocalStorage、Redis、Supabase 多种存储方式
- 📊 **AI 摘要** - 自动生成段落摘要和思维导图
- 📝 **测试题生成** - 基于内容自动生成测试题
- 🎨 **暗色/亮色主题** - 支持主题切换

## 项目结构

```bash
.
├── config/               # 配置文件
│   ├── webpack.config.js # Webpack 配置
│   ├── constants.ts      # 应用常量
│   ├── env.ts            # 环境变量配置
│   └── menuConfig.ts     # 菜单配置
├── public/               # 静态资源
│   └── index.html        # HTML 模板
├── src/
│   ├── components/       # React 组件
│   │   ├── layout/       # 布局组件
│   │   ├── markdown/     # Markdown 相关
│   │   ├── tree/         # 知识树组件
│   │   ├── ui/           # UI 组件
│   │   └── ...
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # 服务层
│   │   ├── geminiService.ts    # Gemini AI 服务
│   │   ├── supabaseService.ts  # Supabase 同步
│   │   ├── redisService.ts     # Redis 缓存
│   │   └── feishuService.ts    # 飞书 API
│   ├── styles/           # 样式文件
│   ├── types.ts          # TypeScript 类型
│   ├── utils/            # 工具函数
│   ├── App.tsx           # 主应用
│   └── index.tsx         # 入口文件
├── .env.example          # 环境变量模板
├── block.json            # 插件元信息
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Gemini AI API Key (必需)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase 配置 (可选，用于云端同步)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_API_KEY=your_supabase_anon_key

# Redis 配置 (可选)
VITE_REDIS_REST_URL=https://your-redis-instance.redis.cloud.redislabs.com
VITE_REDIS_PASSWORD=your_redis_password

# 功能开关
VITE_ENABLE_REDIS=false  # 是否启用 Redis
VITE_ATTACHMENT_FIELD_NAME=附件  # 飞书附件字段名
```

#### 获取 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API Key
3. 复制到 `.env` 文件中

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

### 5. 发布到飞书

```bash
npm run upload
```

## 使用说明

### 在飞书多维表格中使用

1. 创建一个多维表格
2. 添加一个 **附件** 类型的字段（字段名默认为 "附件"）
3. 在该字段中上传一个 Markdown 文件
4. 打开插件，插件会自动：
   - 从附件中读取 Markdown 内容
   - 使用 AI 分析文档结构
   - 生成知识树供学习

### 主要功能

| 功能 | 说明 |
|------|------|
| **知识树浏览** | 按章节/部分浏览文档结构 |
| **笔记记录** | 为每个知识点添加笔记 |
| **完成标记** | 标记已掌握的内容 |
| **段落关联** | 将知识点与具体段落关联 |
| **AI 摘要** | 为段落生成摘要和思维导图 |
| **测试题** | 自动生成测试题检验学习效果 |

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `VITE_GEMINI_API_KEY` | Gemini AI API Key | - | ✅ |
| `VITE_SUPABASE_URL` | Supabase 项目 URL | 内置默认值 | ❌ |
| `VITE_SUPABASE_API_KEY` | Supabase API Key | 内置默认值 | ❌ |
| `VITE_SUPABASE_TABLE_NAME` | Supabase 表名 | `blocks_sync` | ❌ |
| `VITE_REDIS_REST_URL` | Redis REST API URL | 内置默认值 | ❌ |
| `VITE_REDIS_PASSWORD` | Redis 密码 | 内置默认值 | ❌ |
| `VITE_ENABLE_REDIS` | 是否启用 Redis | `false` | ❌ |
| `VITE_ATTACHMENT_FIELD_NAME` | 附件字段名 | `附件` | ❌ |

## CSP 配置

飞书插件环境有严格的 CSP 策略，如需外部请求，需要在飞书管理后台配置：

**需要添加的域名：**
- `generativelanguage.googleapis.com` - Gemini API
- `*.supabase.co` - Supabase (如果使用)
- `*.redis.cloud.redislabs.com` - Redis (如果使用)

## 开发说明

### 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Webpack 5** - 构建工具
- **Tailwind CSS 4** - 样式框架
- **Semi UI** - 组件库
- **Gemini AI** - AI 分析
- **Framer Motion** - 动画 (飞书环境已禁用以兼容 CSP)

### 飞书插件开发

- [@lark-opdev/block-bitable-api](https://www.npmjs.com/package/@lark-opdev/block-bitable-api) - 飞书多维表格 API
- [飞书开放平台](https://open.feishu.cn/) - 官方文档

## 许可证

MIT
