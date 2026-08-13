# usg.cc.cd 正式环境运维记录

**站点**：美股智能分析平台（usgb）  
**正式地址**：`https://usg.cc.cd`  
**代码仓库**：`JohnnyTenkyo/meiguzuizhong-backup`  
**部署模式**：腾讯云主机上的 Node.js 主应用与独立 Python 信息流服务，由 PM2 管理；Nginx 反向代理，Cloudflare 代理与 Full (strict) HTTPS。

> 本站以独立空数据库上线，未迁移 Manus 历史数据。股票数据源和 X 信息流凭据仅保存在服务器的 PM2 受控环境中，禁止写入 Git、部署文档或前端代码。

## 1. 运行架构

| 项目 | 正式配置 | 运维说明 |
|---|---|---|
| 域名 | `usg.cc.cd` | Cloudflare 代理模式，浏览器仅应使用 HTTPS。 |
| 应用目录 | `/var/www/usgb` | 由 GitHub 仓库检出；本地工作副本位于 `/home/ubuntu/usgb-repo`。 |
| 主应用 | PM2：`usgb`（id 5） | Node.js/Express + React 生产服务，监听 `127.0.0.1:3005`。 |
| 信息流服务 | PM2：`usgb-twitter`（id 6） | Flask + twifork，监听 `127.0.0.1:5000`，仅供主应用本机访问。 |
| 数据库 | MariaDB：`usgb` | 独立空库；表结构由 Drizzle 迁移初始化。 |
| Web 入口 | Nginx | `/etc/nginx/conf.d/usg.conf` 将 `usg.cc.cd` 反向代理到端口 `3005`。 |
| 源站证书 | Cloudflare Origin CA | 证书：`/etc/nginx/ssl/usg.cc.cd.pem`；私钥：`/etc/nginx/ssl/usg.cc.cd.key`；到期日为 **2041-08-09（UTC）**。 |

## 2. HTTPS 与 Cloudflare

Cloudflare 区域为 `usg.cc.cd`，区域 ID 为 `670993781487ced9105586c9fa98bc4f`。DNS 的 `A` 记录指向服务器并保持 Cloudflare **代理（橙云）**。SSL/TLS 加密模式已设置为 **Full (strict)**，且“始终使用 HTTPS”已开启。

源站 Nginx 必须保留以下 TLS 文件路径。切勿将 Origin CA 私钥复制至仓库，也不要将 Cloudflare 加密模式降级为 Flexible 或 Full；否则会破坏源站身份校验或造成重定向异常。

```bash
ssh root@43.130.0.81
nginx -t && systemctl reload nginx
curl -I https://usg.cc.cd
curl -I http://usg.cc.cd  # 应返回 HTTPS 重定向
```

## 3. 日常运行与诊断

下列命令均在服务器执行。仅查看状态与日志不会暴露受控环境中的 API 密钥；不要使用会打印完整 PM2 环境变量的命令或截图。

| 目标 | 命令 |
|---|---|
| 查看所有进程 | `pm2 list` |
| 查看主应用日志 | `pm2 logs usgb --lines 100 --nostream` |
| 查看信息流日志 | `pm2 logs usgb-twitter --lines 100 --nostream` |
| 重启主应用 | `pm2 restart usgb --update-env` |
| 重启信息流 | `pm2 restart usgb-twitter --update-env` |
| 保存 PM2 开机恢复状态 | `pm2 save` |
| 核验信息流健康接口 | `curl -fsS http://127.0.0.1:5000/health` |
| 读取单个人物动态 | `curl -fsS 'http://127.0.0.1:5000/tweets?username=elonmusk&count=1'` |

信息流服务使用长期专用 Python 事件循环承载 twifork 客户端。若日志出现 `Future attached to a different loop` 或 `Event loop is closed`，应先同步包含该修复的代码，再执行 `pm2 restart usgb-twitter --update-env`。修复后的服务已连续两次返回埃隆·马斯克的原始 X 动态。

## 4. 更新与回滚

常规应用更新应先在 GitHub 主分支完成代码审查与测试，然后在服务器应用。更新前建议先备份数据库，并在维护窗口中执行。

```bash
ssh root@43.130.0.81
cd /var/www/usgb
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build
pm2 restart usgb --update-env
pm2 restart usgb-twitter --update-env
pm2 save
```

若更新后异常，请先查看 PM2 与 Nginx 日志并修复；如必须回退，使用 Git 中已经验证的提交重新检出、重新构建并重启两个进程。不要通过删除数据库来处理应用错误。

```bash
pm2 logs usgb --lines 150 --nostream
pm2 logs usgb-twitter --lines 150 --nostream
tail -n 150 /var/log/nginx/error.log
nginx -t
```

## 5. 数据库备份与恢复

生产数据库目前从空库初始化。虽然未迁移 Manus 历史数据，之后用户注册、自选股、回测等新数据仍需要常规备份。建议至少每日在服务器外保存一次加密备份。

```bash
# 备份
mysqldump --single-transaction --routines --events usgb | gzip > /root/backups/usgb-$(date +%F).sql.gz

# 恢复至已确认的 usgb 数据库；恢复前先备份当前状态
gunzip -c /root/backups/usgb-YYYY-MM-DD.sql.gz | mysql usgb
```

## 6. 上线回归结果与已知边界

| 项目 | 结果 | 备注 |
|---|---|---|
| 正式首页 | 通过 | `https://usg.cc.cd` 正常加载市场概览、板块、涨幅榜和人物信息流页面。 |
| HTTP 强制跳转 | 通过 | `http://usg.cc.cd` 由 Nginx/Cloudflare 跳转至 HTTPS。 |
| 注册与登录 | 通过 | 已以临时账户完成注册、登录令牌返回与数据库清理。 |
| 主应用与信息流进程 | 通过 | `usgb` 与 `usgb-twitter` 均由 PM2 在线守护。 |
| X 人物动态 | 通过 | twifork 已验证可连续读取 `@elonmusk` 动态；X Cookie、限流或平台策略变化可能影响个别账号。 |
| Truth Social | 可用 | `@realDonaldTrump` 的 Truth Social 内容仍作为稳定的补充来源。 |
| EODHD | 受限 | 当前账户返回 402，需升级对应数据权限后再启用。 |
| Tiingo | 受限 | 日配额耗尽时会自动无法作为可用日线来源。 |
| Alpaca K 线 | 未实现 | 当前适配器仍含模拟数据，不能视为实时生产数据源。 |

## 7. 安全收尾

API 密钥和 X Cookie 已通过 PM2 受控环境部署，且不应进入 Git。当前迁移批次仍在进行，因此临时 SSH 公钥及 `/home/ubuntu/upload/1.pem` 保留至所有站点完成迁移后统一撤销。届时应删除服务器 `/root/.ssh/authorized_keys` 中的临时条目、删除沙箱私钥文件，并由服务器管理员重新确认 root 密码与最小化访问权限。
