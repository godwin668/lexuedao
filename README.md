# 乐学小岛 - 语数英全科学习小程序

基于 Taro 4.x + React 18 + CloudBase 的微信小程序，面向小学1-6年级学生的语数英全科学习平台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Taro 4.1.9 (React 18) |
| 语言 | TypeScript 5.x |
| 样式 | SCSS Modules |
| 状态管理 | Zustand |
| 包管理 | pnpm |
| 后端 | CloudBase (云函数 + PostgreSQL) |
| 数据库 | PostgreSQL 15+ (含 pgvector 扩展) |

## 项目结构

```
lexuedao/
├── src/
│   ├── pages/              # 主包页面
│   │   ├── home/           # 首页（学习入口）
│   │   └── profile/        # 个人中心
│   ├── sub-hanzi/          # 分包：汉字学习（7页）
│   ├── sub-math/           # 分包：数学学习（4页）
│   ├── sub-english/        # 分包：英语学习（6页）
│   ├── sub-game/           # 分包：竞技游戏（4页）
│   ├── components/         # 公共组件
│   ├── store/              # Zustand 状态管理
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式变量
├── cloudfunctions/         # 云函数（32个）
├── db/
│   └── init.sql            # 数据库初始化脚本（14张表）
├── docs/
│   └── DESIGN.md           # 全局设计方案
├── config/                 # Taro 构建配置
├── scripts/
│   └── postbuild.js        # 构建后处理脚本
├── dist/                   # 构建输出（小程序根目录）
└── project.config.json     # 小程序项目配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8（推荐）或 npm
- 微信开发者工具
- CloudBase 环境（已开通 PostgreSQL）

### 安装依赖

```bash
pnpm install
```

### 开发模式（热加载）

```bash
pnpm dev:weapp
```

修改 `src/` 下的文件后自动编译到 `dist/`，微信开发者工具会自动刷新。

### 生产构建

```bash
pnpm build:weapp
```

### 在微信开发者工具中运行

1. 打开微信开发者工具
2. 导入项目，选择 `d:\projectsai\lexuedao` 目录
3. AppID 配置在 `project.config.json` 中
4. 点击「编译」即可预览

## 云函数部署

1. 在微信开发者工具中，右键 `cloudfunctions/` 目录
2. 选择「上传并部署：所有云函数」
3. 在 CloudBase 控制台为每个云函数配置环境变量：
   - `PG_CONNECTION_STRING`: PostgreSQL 连接字符串
   - 格式：`postgresql://用户名:密码@内网地址:5432/postgres`

## 数据库初始化

1. 确保 CloudBase 环境已开通 PostgreSQL
2. 安装 pgvector 扩展：`CREATE EXTENSION IF NOT EXISTS vector;`
3. 执行 `db/init.sql` 建表并导入初始数据

## 环境变量

| 变量 | 说明 | 配置位置 |
|------|------|---------|
| `PG_CONNECTION_STRING` | PostgreSQL 连接串 | CloudBase 控制台 → 云函数 → 环境变量 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | aiChat 云函数需要，用于 AI 对话 |
| CloudBase 环境 ID | `lexuedao-d9gnk5dru823f8b98` | `src/app.tsx` |

## CloudBase 管理

本项目使用 PostgreSQL 模式的 CloudBase 环境，**微信开发者工具的「云开发」面板不支持该模式**。

所有管理操作请通过网页控制台：
- 控制台入口：https://tcb.cloud.tencent.com/dev?envId=lexuedao-d9gnk5dru823f8b98
- 云函数管理：`#/scf`
- 数据库管理：`#/db/mysql`
- 云存储管理：`#/storage`
- 日志监控：`#/devops/log`

微信开发者工具仅用于**编译、预览、调试**。

## 用户认证

通过微信 `openid` 自动登录，无需自建账号体系。首次登录自动在 `users` 表创建记录。

## 开发状态

| 模块 | 状态 |
|------|:--:|
| 语文（书写/描红/测试/评分/历史） | ✅ 完成 |
| 数学（练习/测试/结果） | ✅ 完成 |
| 英语（闪卡/拼写/听力/测试/结果） | ✅ 完成 |
| 游戏化竞技（对战/排行/挑战/组队） | ✅ 完成 |
| 登录流程集成 | ✅ 完成 |
| 成就系统 UI | ✅ 完成 |
| 家长端（学习报告/多娃管理/绑定孩子） | ✅ 完成 |
| AI 学习助手聊天 | ✅ 完成 |
| AI 学习建议（薄弱分析+推荐） | ✅ 完成 |
| 段位系统（三科段位分） | ✅ 完成 |
| 微信支付 / VIP 订阅 | 🟡 前端完成，支付接口待接入 |
| 钻石商城 | ✅ 完成 |
| 错题本独立页面 | ✅ 完成 |
| 拍照搜题/改错 | 🔲 待开发 |
| 宠物/伙伴系统 | 🔲 待开发 |
| 跨端 App（Taro RN） | 🔲 待开发 |

详细规划见 [docs/DESIGN.md](docs/DESIGN.md)。

## 页面路由

| 页面 | 路径 |
|------|------|
| 首页 | `pages/home/index` |
| 个人中心 | `pages/profile/index` |
| 汉字首页 | `sub-hanzi/hanzi-home/index` |
| 汉字练习 | `sub-hanzi/hanzi-practice/index` |
| 汉字书写 | `sub-hanzi/hanzi-write/index` |
| 汉字描红 | `sub-hanzi/hanzi-trace/index` |
| 汉字测试 | `sub-hanzi/hanzi-test/index` |
| 汉字结果 | `sub-hanzi/hanzi-result/index` |
| 汉字历史 | `sub-hanzi/hanzi-history/index` |
| 数学首页 | `sub-math/math-home/index` |
| 数学练习 | `sub-math/math-practice/index` |
| 数学测试 | `sub-math/math-test/index` |
| 数学结果 | `sub-math/math-result/index` |
| 英语首页 | `sub-english/eng-home/index` |
| 单词学习 | `sub-english/eng-word/index` |
| 单词拼写 | `sub-english/eng-spell/index` |
| 听力练习 | `sub-english/eng-listen/index` |
| 英语测试 | `sub-english/eng-test/index` |
| 英语结果 | `sub-english/eng-result/index` |
| 好友对战 | `sub-game/battle/index` |
| 排行榜 | `sub-game/leaderboard/index` |
| 每日挑战 | `sub-game/challenge/index` |
| 团队竞技 | `sub-game/team/index` |
| 成就徽章 | `sub-game/achievements/index` |
| AI 学习助手 | `sub-game/ai-chat/index` |
| 学习报告 | `sub-game/report/index` |
| VIP 订阅 | `sub-game/vip/index` |
| 钻石商城 | `sub-game/diamond/index` |
| 错题本 | `sub-game/error-book/index` |
| 绑定孩子 | `sub-game/bind-child/index` |
| 每日挑战 | `sub-game/challenge/index` |
