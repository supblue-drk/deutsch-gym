# Deutsch Gym

面向 B2–C1 德语学习者的 iPhone PWA，聚焦德国职场沟通、地道表达和汽车产品战略讨论。

## Phase 1 范围

已建立 Today、Gym、Review、Progress 底部导航及 Library、Settings 页面。训练内容、复习算法及统计计算尚未实现，所有学习页面使用真实空状态。无账号、服务器、付费 API 或外部字体请求。

- React + TypeScript + Vite、Tailwind CSS、React Router
- Dexie.js + IndexedDB，v1 数据库及主题偏好持久化
- vite-plugin-pwa：Manifest、192/512 PNG 图标、maskable 图标、Apple Touch 图标、应用外壳预缓存
- Vitest + Testing Library + fake-indexeddb；GitHub Actions 检查测试与构建
- 深蓝 / 奶油白 / 暖金；明暗与系统主题；iPhone 安全区域、44px 触控目标、语义导航、键盘焦点

## 本地运行

需要 Node.js 22.12+（或 24 LTS）与 npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

开发服务器默认不启用 Service Worker。离线功能请使用生产构建预览或 HTTPS 部署验证；localhost 是浏览器的安全上下文例外。iPhone 通过普通局域网 HTTP 地址访问时不能验证 Service Worker。

## 目录

```text
src/
  components/   导航布局与 Card / PageHeading / EmptyState / ButtonLink
  lib/          IndexedDB schema、初始化与主题上下文
  pages/        Phase 1 页面
  test/         测试环境
public/icons/   原创 DG 图标
docs/          后续开发计划
```

## 数据与版本管理

数据库名 `deutsch-gym`，当前 schema v1。`preferences` 存储设置；`learningItems`、`sessions`、`reviews` 为后续阶段预留，初始化不插入学习数据。初始化幂等，仅在缺少主题设置时写入默认值。

未来升级必须新增 `db.version(2).stores(...).upgrade(...)`，保留已发布版本，添加旧版本迁移测试，不删除重建用户数据库。学习数据仅在当前设备、浏览器和域名保存；清除网站数据或系统回收存储可能导致丢失，Phase 1 无云同步、导入或备份。IndexedDB 不可用时显示可恢复错误页。

## PWA 与部署约定

预期网址：**https://supblue-drk.github.io/deutsch-gym/**。

Vite base、Manifest 的 id / start_url / scope、图标及 Service Worker 注册范围统一为 `/deutsch-gym/`。使用 HashRouter，设置页为 `/deutsch-gym/#/settings`，刷新、分享和首次打开深链接均不依赖服务器重写。不支持旧式 `/deutsch-gym/settings` 地址。

部署产物为 `dist/`。Service Worker 仅控制 `/deutsch-gym/`，导航 fallback 也限制在这一子路径，预缓存应用外壳与本地图标，不缓存 API 请求；首次完整加载并激活 Service Worker 后可离线打开。新版就绪时显示更新提示，由用户选择刷新。清理旧缓存仅影响 Cache Storage，不会清除 IndexedDB；数据库名及 v1 schema 保持不变，应用升级不执行清库操作。

**域名迁移说明：**IndexedDB 按 origin 隔离。同一个 GitHub Pages 域名下的后续部署保留原数据；Vercel 域名与 `supblue-drk.github.io` 不能共享浏览器数据，现有版本尚无跨域数据迁移或导入导出功能。不要通过清除 Safari 网站数据来更新应用。

### 在 iPhone 上启用 GitHub Pages

1. 用 Safari 打开仓库，进入 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**（移动界面可能需要“请求桌面网站”）。
2. 如仓库仍为 private 且 Pages 提示套餐不支持，需要使用支持私有仓库 Pages 的套餐，或自行决定是否将仓库公开；本 PR 不会更改仓库可见性。GitHub Pages 网站通常公开可访问，请勿将机密内容写入应用。
3. 审核并合并本部署 PR。`.github/workflows/pages.yml` 在 main 更新时安装依赖、运行测试和构建、检查产物路径、上传 dist 并部署；原 CI 继续独立运行。
4. 在 **Actions → Deploy GitHub Pages** 查看结果。必要时点击 **Run workflow**，选择 **main** 手动运行。部署只允许 main；如 github-pages 环境要求审批，在运行页面批准即可。
5. 成功后打开上方网址，在 Safari 选择 **分享 → 添加到主屏幕**。旧 Vercel 图标仍指向旧域名，请从新地址重新添加。若需要停用旧 Vercel 自动部署，请在 Vercel 项目中断开 GitHub 连接；仓库中没有 Vercel 部署配置，本次未操作 Vercel 账户。

无需在 iPhone 上运行终端命令。本地复核可运行 `npm run build && npm run test:deployment`；`npm run preview` 后访问 `/deutsch-gym/`。

### 手动验收

1. 浅色、深色、系统模式切换，刷新后检查主题保留。
2. 检查六页导航、返回按钮、直接访问 `/deutsch-gym/#/settings` 和未知路径。
3. iPhone 竖屏 / 横屏检查刘海区、底部 Home 指示条、字号及触控。
4. 生产版本首次联网加载，等待 Service Worker 激活，再断网重开，检查所有页面和图标。
5. 发布第二版，确认更新提示，点击更新检查新版本加载。
6. 新安装时 Review / Progress / Library 无虚构记录或统计。

本阶段自动化测试不替代真实 Safari 安装、离线与更新测试。

后续范围见 [开发计划](docs/ROADMAP.md)。Phase 1 合并后等待确认再进入下一阶段。
