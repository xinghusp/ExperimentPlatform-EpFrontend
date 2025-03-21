# ExperimentPlatform-EpFrontend

## 项目概述

ExperimentPlatform 前端是一个基于 Vue.js 构建的实验平台 Web 界面，与 ExperimentPlatform-EpBackend 后端配合使用，提供完整的在线实验平台解决方案。本项目主要负责用户界面和交互逻辑，为学生和管理员提供友好的操作体验。

## 完整文档

有关完整的系统文档，包括 API 详情、部署指南和架构说明，请参阅[后端项目](https://github.com/xinghusp/ExperimentPlatform-EpBackend)。

---

## 主要功能

### 用户认证

- 管理员和学生登录界面
- JWT 令牌管理
- 会话持久化

### 管理员面板

- 班级管理（创建、编辑、删除）
- 学生管理（添加、批量导入、编辑）
- 实验任务创建与分配
- 环境模板配置
- 实验进度监控

### 学生界面

- 实验任务列表与详情
- 启动实验环境（远程桌面/Jupyter）
- 实验状态追踪
- 实验界面集成

### 实验环境接入

- 远程桌面无客户端访问
- Jupyter Notebook 集成
- 实时状态更新

## 技术栈

- **前端框架**: Vue.js
- **UI 组件**: Element UI
- **状态管理**: Vuex
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **WebSocket**: 用于实时通信
- **构建工具**: Webpack

## 快速开始

### 开发环境

1. 克隆仓库

```bash
git clone https://github.com/xinghusp/ExperimentPlatform-EpFrontend.git
cd ExperimentPlatform-EpFrontend
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   创建`.env.development`文件:

```
VUE_APP_API_URL=http://localhost:8000/api
VUE_APP_WS_URL=ws://localhost:8000
```

4. 启动开发服务器

```bash
npm run serve
```

### 生产环境构建

```bash
npm run build
```

## 系统截图

- 管理员控制面板
- 班级与学生管理
- 实验任务配置
- 远程桌面环境
- Jupyter 环境

## 系统要求

- Node.js 16.0+
- 现代浏览器支持 (Chrome, Firefox, Safari, Edge)
- 后端 API 服务

## 相关项目

- [ExperimentPlatform-EpBackend](https://github.com/xinghusp/ExperimentPlatform-EpBackend) - 后端 API 服务

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

[MIT License](LICENSE)

---

**项目状态:** 开发中
