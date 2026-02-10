# 美股智能分析系统 - 功能清单

## 数据库 Schema- [x] 迁移用户表扩展字段
- [x] 迁移回测相关表(backtest_sessions, backtest_trades, backtest_positions)
- [x] 迁移追踪人物表(tracked_people)
- [x] 迁移社交媒体缓存表(socialMediaCache)）

## 后端 API 适配器
- [x] 迁移 Twitter API 适配器（twitter-openapi-typescript）
- [x] 迁移 Truth Social 适配器（RSS 源）
- [x] 迁移 Finnhub API 适配器
- [x] 迁移 AlphaVantage API 适配器
- [x] 迁移 FOCI MCP 适配器

## 后端路由和逻辑
- [x] 迁移股票数据路由（搜索、行情、K线）
- [x] 迁移社交媒体路由（Twitter、Truth Social）
- [x] 迁移 FOCI 路由（每日摘要、博主追踪）
- [x] 迁移回测路由（会话管理、交易操作）
- [x] 迁移自选股路由（添加、删除、列表）

## 前端组件
- [x] 迁移 DashboardLayout 组件
- [x] 迁移 StockChart 组件（lightweight-charts）
- [x] 迁移 VIPNewsFlow 组件（社交媒体信息流）
- [x] 迁移 FociDashboard 组件
- [x] 迁移 FociAssistant 组件
- [x] 迁移 FociBloggerTracker 组件
- [x] 迁移 SignalPanel 组件
- [x] 迁移 ScreenerNotificationBar 组件
- [x] 迁移 AIChatBox 组件

## 前端页面
- [x] 创建主页/仪表板页面
- [x] 创建股票详情页面
- [x] 创建回测页面
- [x] 创建 VIP 信息流页面
- [x] 创建自选股页面
- [x] 更新路由配置

## 环境变量配置
- [x] 配置 FINNHUB_API_KEY
- [x] 配置 ALPHAVANTAGE_API_KEY
- [x] 配置 MASSIVE_API_KEY
- [x] 配置 TWITTER_AUTH_TOKEN
- [x] 配置 TWITTER_CT0
- [x] 配置 ALPHAMOE_FOCI_API_KEY

## 依赖包安装
- [x] 安装 lightweight-charts
- [x] 安装 twitter-openapi-typescript
- [x] 安装 axios
- [x] 安装 ws（WebSocket）
- [x] 安装其他缺失依赖

## 功能测试
- [x] 测试 API 密钥配置
- [x] 测试项目启动和首页显示
- [x] 测试股票搜索和行情显示
- [x] 测试 K 线图表和技术指标
- [x] 测试 Twitter 信息流
- [x] 测试 Truth Social 信息流
- [x] 测试 FOCI 博主追踪
- [x] 测试回测功能
- [x] 测试自选股管理
- [x] 测试 AI 智能助手

## 部署准备
- [x] 运行生产构建测试
- [x] 检查所有环境变量配置
- [x] 验证数据库连接
- [ ] 创建检查点
- [ ] 提供给用户确认

## 登录注册问题修复
- [x] 诊断登录注册网络错误
- [x] 检查后端 API 路由配置
- [x] 检查前端登录注册请求
- [x] 修复网络错误问题(添加 Express API 路由注册)
- [x] 测试登录注册功能
- [ ] 创建新的 checkpoint
