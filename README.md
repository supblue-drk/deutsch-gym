# Deutsch Gym

面向 B2–C1 德语学习者的 iPhone PWA，聚焦德国职场沟通、地道表达和汽车产品战略讨论。

## Phase 2：离线核心学习

沿用 Phase 1 的 React + TypeScript + Vite、Tailwind CSS、React Router、Dexie 和 iPhone 导航设计。无后端、账号、付费 API、AI 服务、外部字体或核心 CDN 依赖。

- **60 条原创实用表达**：职场 / 日常 / 汽车战略各 20 条，包含德语说明、中文释义与例句译文、CEFR、语域、语法提示、标签。支持搜索、世界与等级筛选、详情、收藏、标记已学。
- **每日训练**：默认 3 条新表达，可设为 5 / 10；当前到期复习优先，逐条揭示答案与 Again / Hard / Good / Easy 评分，即时保存、中断续学与完成摘要。
- **间隔复习**：明确区分新、学习中、复习、已巩固；Review 展示今日到期和当前可用数量，支持完整复习会话；收藏浏览不改变排程。
- **真实进度**：已学、已巩固、到期、连续天数、已完成 Review 会话、最近七天活动及分世界进度，均读取 IndexedDB。
- **数据管理**：JSON 备份、完整校验后确认覆盖、显式确认重置。初始内容不在用户数据库中，不会随重置丢失。

调度规则、统计定义和数据格式见 [学习引擎说明](docs/LEARNING_ENGINE.md)。

## 本地运行

需要 Node.js 22.12+（或 24 LTS）与 npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:deployment
npm run preview
```

开发服务器默认不启用 Service Worker。离线功能请使用生产构建预览或 HTTPS 部署验证；localhost 是浏览器的安全上下文例外。iPhone 通过普通局域网 HTTP 地址访问时不能验证 Service Worker。

## 目录

```text
src/
  components/   导航布局与 Card / PageHeading / EmptyState / ButtonLink
  data/         60 条本地表达（稳定 ID，禁止重新编号）
  lib/          数据库、学习引擎、排程、统计、备份与主题
  pages/        Library、日课、Review、Progress 和设置
  test/         测试环境
public/icons/   原创 DG 图标
docs/           学习引擎、验收与后续计划
```

## 数据与版本管理

数据库名仍为 `deutsch-gym`，schema **v2**。保留全部 v1 表 `preferences`、`learningItems`、`sessions`、`reviews` 及记录，仅新增 `cards`、`learningSessions`、`learningEvents`；原来的空骨架记录不会被伪装成新内容的学习成绩。初始化只补缺失的默认设置，不清库、不重复写学习记录。

评分、进度与事件在一个 IndexedDB 事务中提交；同一会话同一游标的重复请求不会重复记分。备份包含所有用户表（包括 v1 历史表）及设置，导入在完全校验和用户确认后以单个事务替换，失败回滚。重置只清学习数据和收藏，保留设置；内容在代码包中不受影响。

未来升级必须新增 schema 版本并补迁移测试，不修改已发布的 v1 / v2 定义，不删除重建用户数据库。Safari 清除网站数据或系统回收存储仍可能导致本地数据丢失，请定期导出到“文件”。无云同步；备份含个人学习记录，仅导入可信文件（上限 10 MB）。

## PWA 与部署约定

预期网址：**https://supblue-drk.github.io/deutsch-gym/**。

Vite base、Manifest 的 id / start_url / scope、图标及 Service Worker 注册范围统一为 `/deutsch-gym/`。使用 HashRouter，设置页为 `/deutsch-gym/#/settings`，刷新、分享和首次打开深链接均不依赖服务器重写。不支持旧式 `/deutsch-gym/settings` 地址。

部署产物为 `dist/`。Service Worker 仅控制 `/deutsch-gym/`，导航 fallback 也限制在这一子路径，预缓存应用外壳与本地图标，不缓存 API 请求；首次完整加载并激活 Service Worker 后可离线打开。新版就绪时显示更新提示，由用户选择刷新。清理旧缓存仅影响 Cache Storage，不会清除 IndexedDB；数据库名保持不变，v2 使用增量迁移，应用升级不执行清库操作。

**域名迁移说明：**IndexedDB 按 origin 隔离。同一个 GitHub Pages 域名下的后续部署保留原数据；Vercel 域名与 `supblue-drk.github.io` 不能共享浏览器数据，Phase 2 可通过 JSON 手动导出 / 导入；尚未提供云端迁移。不要通过清除 Safari 网站数据来更新应用。

### 在 iPhone 上启用 GitHub Pages

1. 用 Safari 打开仓库，进入 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**（移动界面可能需要“请求桌面网站”）。
2. 如仓库仍为 private 且 Pages 提示套餐不支持，需要使用支持私有仓库 Pages 的套餐，或自行决定是否将仓库公开；应用代码不会更改仓库可见性。GitHub Pages 网站通常公开可访问，请勿将机密内容写入应用。
3. 审核并合并功能 PR。`.github/workflows/pages.yml` 在 main 更新时安装依赖、运行测试和构建、检查产物路径、上传 dist 并部署；原 CI 继续独立运行。
4. 在 **Actions → Deploy GitHub Pages** 查看结果。必要时点击 **Run workflow**，选择 **main** 手动运行。部署只允许 main；如 github-pages 环境要求审批，在运行页面批准即可。
5. 成功后打开上方网址，在 Safari 选择 **分享 → 添加到主屏幕**。旧 Vercel 图标仍指向旧域名，请从新地址重新添加。若需要停用旧 Vercel 自动部署，请在 Vercel 项目中断开 GitHub 连接；仓库中没有 Vercel 部署配置，本次未操作 Vercel 账户。

无需在 iPhone 上运行终端命令。本地复核可运行 `npm run build && npm run test:deployment`；`npm run preview` 后访问 `/deutsch-gym/`。

### Phase 2 iPhone 验收

1. GitHub 打开 Phase 2 PR，等待 CI 通过后手动合并；在 Actions 等待 Pages 部署完成。打开原 GitHub Pages 地址或主屏幕 App，联网重开一次；出现更新提示时点 **Aktualisieren**。确认 Settings 显示 **0.2.0**。不要清除网站数据。
2. Library 确认 **60 AUSDRÜCKE**；分别选择三个世界（各 20 条），筛选 B2 / C1，搜索 `Zahlungsbereitschaft` 或 `支付意愿`，打开详情检查德中内容与语域。收藏一条，打开 Review 的 **Favoriten durchsehen** 验证收藏筛选。
3. Settings 设置每日目标 **3**。Today → **Tagestraining öffnen**。未开始过的新账户先看到 3 条；每条点 **Antwort aufdecken → Good**。第一条后关闭 App 再打开，确认从第二条继续。结束应显示已处理 3 条、学会 3 条。
4. Progress 应显示真实已学数、当天活动、连续天数及世界进度。已有学习数据时总数会更高。Good 的首次复习在次日本地零点到期；不需要篡改系统日期。
5. 为当天检查 Review，可在一条尚未学习的日课卡上选 **Again**，十分钟后打开 Review，点 **Wiederholung starten → Antwort aufdecken → Good / Easy**，完成并确认 Review 会话计数增加。如今日课已完成，可等下一天；改变目标不追加当天已经开始的队列。
6. Settings → **JSON-Sicherung exportieren**。在 Safari 下载列表或分享菜单将 JSON 存到“文件”。导出成功不等于已复制到云端；请确认文件确实存在。
7. 有备份后，点 **Lernfortschritt zurücksetzen**，先取消确认并检查数据未变；再次确认重置后，Library 仍有 60 条、Progress 为零。再点 **JSON-Sicherung importieren**，选择备份并确认覆盖，检查进度、收藏、目标和主题恢复。选择无效 JSON 应显示错误且不改变数据。
8. 完整联网加载新版后开启飞行模式，关闭并重开主屏幕 App。重复搜索、训练、复习、查看进度和导出；恢复联网后检查状态未丢失。首次从未访问过的网站无法凭空离线安装，需要先缓存一次应用。
9. 检查明暗主题、六个导航页面、`/deutsch-gym/#/settings` 刷新、字号、44px 触控区、刘海及 Home 指示条遮挡情况。

自动化覆盖内容、搜索、日课选择、评分、持久化、事务失败、数据库迁移、连续天数、备份和学习 UI；构建产物检查额外验证全部 60 条内容已进入预缓存 JS。Cloud 中未代替你进行 Safari 真机、系统文件选择器和安装后离线验收。

后续范围见 [开发计划](docs/ROADMAP.md)。本 PR 不启动 Phase 3，不自动合并。
