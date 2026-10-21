# 弹幕动漫 (Danmaku Bangumi) - 前端

一个支持多源聚合与跨站弹幕对齐的流媒体播放器。

## 特性

- 基于 `Promise.allSettled` 并发请求多个流媒体切片源，高可用容错降级。
- 对接官方开放平台，实时拉取番剧全量弹幕。
- 支持 `±0.5s` 步进与精确数值输入，解决不同切片源片头剪辑差异导致的弹幕错位。
- 手写移动端触摸状态机，支持长按 2 倍速快进、滑动调节音量/亮度/进度、双击暂停。
- 基于 Vuetify 3 打造纯黑夜间护眼配色。

## 技术栈

- **框架**：Vue 3 (`<script setup>` Composition API)
- **构建工具**：Vite
- **UI 组件库**：Vuetify 3
- **状态管理**：Pinia + 持久化插件
- **流媒体播放器**：NPlayer + `@nplayer/danmaku` + Hls.js
- **网络请求**：Axios

## 快速开始

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置你的后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. 运行开发服务器

```bash
npm run dev
```

### 4. 生产构建

```bash
npm run build
```

## ⚠️ 免责声明

本项目仅供 Web 流媒体技术、移动端手势交互与前端工程化学习交流使用，不提供任何音视频上传与存储服务。所有视频切片地址均来自互联网公开接口，弹幕数据来自第三方开放平台。
