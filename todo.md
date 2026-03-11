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

## 回测系统涨跌幅显示问题
- [x] 诊断涨跌幅比例显示问题
- [x] 检查后端涨跌幅计算逻辑
- [x] 检查前端涨跌幅显示代码
- [x] 修复涨跌幅比例计算(修复 schema 字段名)
- [x] 测试回测存档界面
- [ ] 创建新的 checkpoint

## 首页推荐动能股问题
- [x] 查找推荐动能股的后端逻辑
- [x] 查找推荐动能股的前端显示代码
- [x] 分析涨跌幅计算问题(前端颜色显示不正确)
- [x] 修复涨跌幅计算逻辑(根据正负值动态显示颜色)
- [x] 测试首页推荐功能
- [ ] 创建新的 checkpoint

## 优化推荐动能股算法
- [x] 分析现有技术指标实现
- [x] 实现梯子指标(蓝色/黄色梯子)
- [x] 实现梯子穿越信号检测(30分钟级别)
- [x] 实现禅动指标(买入信号、黄金支撑线、主力中枢)
- [x] 实现缠论分型(底分型、底背离)
- [x] 实现买卖动能指标(黄线穿绿线、绿柱转红柱)
- [x] 实现多时间级别K线数据获取(日/4h/3h/2h/1h/30m)
- [x] 实现四级优先级评分系统
- [x] 实现定时刷新机制(21:30-05:00每半小时)
- [x] 测试推荐算法
- [ ] 创建新的 checkpoint

## 优化首页推荐股票展示
- [x] 在推荐股票卡片上显示总评分
- [x] 显示各优先级得分(梯子、禅动、缠论、动能)
- [x] 添加"强力推荐"徽章(总分>80)
- [x] 优化卡片布局和视觉效果
- [x] 测试首页展示
- [ ] 创建新的 checkpoint

## 修复 React key 重复错误
- [x] 找到首页中使用 DDOG 作为 key 的地方(板块榜部分)
- [x] 修复 key 重复问题(添加板块名称和索引)
- [x] 测试首页(没有控制台错误)
- [ ] 创建新的 checkpoint

## 修复 WebSocket 连接错误
- [x] 找到 WebSocket 连接代码(momentumWebSocket.ts)
- [x] 判断 WebSocket 是否必要(不必要,前端没有使用)
- [x] 删除不必要的 WebSocket 代码
- [x] 测试首页(没有 WebSocket 错误)
- [ ] 创建新的 checkpoint

## 修复推荐动能股指标分数问题
- [x] 诊断指标分数为0的原因(Yahoo Finance 不支持2h/3h/4h间隔)
- [x] 检查技术指标计算逻辑
- [x] 修复指标计算问题(改用1h和1d代替)
- [x] 优化推荐算法,改为评分制(不要求全部满足)
- [x] 确保至少返回8个推荐股票
- [x] 测试推荐功能(发现后端缺少优先级得分字段)
- [x] 修复后端返回数据格式
- [x] 创建推荐功能测试
- [x] 运行测试并通过(10个推荐股票,完整评分详情)
- [ ] 创建新的 checkpoint

## 调整板块榜配置
- [x] 查找板块榜配置代码
- [x] 将电动车板块改为量子板块
- [x] 添加存储板块
- [x] 添加稀土板块
- [x] 测试板块榜显示(Quantum 5个股票, Storage 4个股票, RareEarth 2个股票)
- [ ] 创建新的 checkpoint

## 修复 DDOG key 重复问题
- [x] 找到 DDOG key 重复的位置(板块榜部分)
- [x] 修复 key 重复问题(已在之前修复)
- [x] 测试首页(没有控制台错误)

## 优化板块股票池
- [x] 为 AI 板块补充更多股票(+5: PATH/ADBE/NOW/DOMO/GTLB)
- [x] 为 Semiconductor 板块补充更多股票(+6: TXN/ADI/NXPI/KLAC/LRCX/AMAT)
- [x] 为 Bitcoin 板块补充更多股票(+3: BITF/WULF/CORZ)
- [x] 为 Quantum 板块补充更多股票(+2: ARQQ/QTUM)
- [x] 为 Storage 板块补充更多股票(+2: PSTG/NTAP)
- [x] 为 RareEarth 板块补充更多股票(+2: REMX/LIT)
- [x] 为 Cloud 板块补充更多股票(+4: TEAM/WDAY/VEEV/OKTA)
- [x] 为 Energy 板块补充更多股票(+3: ENPH/RUN/NEE)

## 添加板块详情页
- [x] 创建板块详情页组件
- [x] 添加板块详情页路由
- [x] 实现板块股票列表展示
- [x] 添加板块整体涨跌幅统计
- [x] 在首页板块榜中添加点击跳转功能
- [x] 测试板块详情页

## 检查推荐动能股定时更新
- [x] 检查定时任务配置(正常启动)
- [x] 验证定时更新是否正常工作(当前不在时间段内,正常)
- [x] 测试推荐股票刷新(调度器配置正确)

## 最终测试
- [x] 测试所有功能
- [ ] 创建新的 checkpoint

## 修复退市/改名股票错误
- [x] 诊断 NUKK 股票错误原因(changePercent 为 null/undefined)
- [x] 实现股票数据验证機制(检查必要字段)
- [x] 添加错误处理逻辑(捕获无效数据)
- [x] 从股票池中踢出无效股票(NUKK)
- [x] 测试修复(首页正常显示,无错误)
- [ ] 创建新的 checkpoint

## 自选股账号绑定功能
- [x] 诊断当前自选股存储方式(浏览器 localStorage)
- [x] 检查数据库中是否已有 watchlist 表
- [x] 设计新的 watchlist 表结构(userId, symbol, addedAt)
- [x] 实现后端 API: 获取自选股列表
- [x] 实现后端 API: 添加自选股
- [x] 实现后端 API: 删除自选股
- [x] 实现后端 API: 清空自选股
- [x] 更新前端代码使用数据库 API 替代 localStorage
- [x] 实现数据迁移逻辑(首次登录时迁移本地数据)
- [x] 测试自选股功能(添加、删除、跨设备同步)
- [ ] 创建新的 checkpoint

## 删除 Manus OAuth 登录系统
- [x] 删除 Manus OAuth 相关代码
- [x] 删除 protectedProcedure 中的 OAuth 检查
- [x] 更新 watchlist API 使用 localUsers 而非 Manus users
- [x] 测试登录系统正常工作

## 优化自选股加载性能
- [x] 分析自选股加载的瓶颈
- [x] 实现 watchlist 缓存機制
- [x] 批量加载股票数据而非逐个加载
- [x] 前端使用 React.memo 优化渲染
- [x] 测试加载速度改进

## 修复收藏按钮没有反应
- [x] 诊断收藏按钮点击事件是否正确绑定
- [x] 检查 WatchlistContext 是否正确初始化
- [x] 检查 localUserId 是否正确获取
- [x] 修复收藏功能
- [x] 测试收藏功能正常工作
- [ ] 创建新的 checkpoint

## 深度诊断收藏按钮不工作
- [x] 检查浏览器控制台是否有错误信息
- [x] 验证 localUserId 是否正确保存和读取
- [x] 检查 toggleStock 函数是否被正确调用
- [x] 检查 API 请求是否成功发送
- [x] 恢复收藏动画效果
- [x] 测试收藏功能
- [x] 创建新的 checkpoint

## 修复 MarketCard 组件 null 值错误
- [ ] 找到 MarketCard 组件
- [ ] 诊断 changePercent 为 null 的原因
- [ ] 修复 null 值处理
- [ ] 测试修复
- [ ] 创建新的 checkpoint

## 修复 MarketCard 组件 null 值错误 - 完成
- [x] 找到 MarketCard 组件
- [x] 诊断 changePercent 为 null 的原因
- [x] 修复 null 值处理(使用 Number() 转换)
- [x] 测试修复
- [x] 创建新的 checkpoint

## 添加量化回测平台入口
- [x] 找到条件选股部分在 Home.tsx 中的位置
- [x] 在条件选股下方添加量化回测平台入口卡片
- [x] 创建入口组件，点击跳转到 mglh.manus.space
- [x] 测试入口功能
- [x] 创建新的 checkpoint

## 优化推荐算法可视化
- [x] 在推荐股票卡片上显示推荐理由
- [x] 支持显示多个推荐信号（蓝梅穿黄梅、底分型加底背离等）
- [x] 优化卡片布局以容纳推荐理由信息
- [x] 添加推荐理由的图标或标签

## 补充 K 线数据源
- [x] 集成 Yahoo Finance API
- [x] 集成 Stooq API
- [x] 集成 Tiingo API (KEY: 3e93c463ad29b481ca941fd9a3b2071f5c51d0d1)
- [x] 集成 Alpaca API (KEY: PKXEV52QLZ2GJIBEZ7DFH2NIXL, Secret: ENBeHx9VidGaWo7x5Q3eQxSGEyAX3R1T7SQNAWNA7uDS)
- [x] 优化 K 线小级别显示
- [x] 测试多数据源的 K 线加载
- [x] 创建新的 checkpoint
