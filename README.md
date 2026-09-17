# Monochrome Flow Portfolio

一个黑白灰二维动态个人网站原型，包含简介、摄影作品和项目三个长页面。

## 当前实现

- 三个可直接访问的路由：`/`、`/photography`、`/projects`
- 固定导航与跨路由持续存在的背景黑线
- 黑线在不同页面之间插值变形，并随长页面滚动连续位移、弯折
- `dot` 分支 WebGL 点波纹：鼠标无需按下，轨迹周围的小点先像船尾水花般分散，再弯向并消失在黑线中
- 多段式简介、长摄影画廊、三个项目案例段落
- 移动端布局、键盘导航、减少动态效果模式
- 项目级 `AGENTS.md`、艺术指导、架构说明、Phase 目标和逐阶段提示词

## 本地运行

```bash
npm install
npm run dev
```

构建与检查：

```bash
npm run build
npm run lint
```

## 首次替换内容

1. 在 `components/portfolio-frame.tsx` 和 `app/layout.tsx` 中替换 `LIN` 与站点标题。
2. 修改 `app/page.tsx` 的简介和工作方式。
3. 用正式照片替换 `public/photos/`，保持文件名或同步更新 `app/photography/page.tsx`。
4. 修改 `app/projects/page.tsx` 的项目名称、年份与描述。
5. 将示例邮箱 `hello@example.com` 替换为正式联系方式。

## 文档入口

- [艺术指导](docs/ART_DIRECTION.md)
- [实现架构](docs/ARCHITECTURE.md)
- [Phase 目标](docs/PHASES.md)
- [总提示词](prompts/00_MASTER.md)
- [各阶段提示词](prompts/)

项目目前按本地开发方式创建，尚未绑定线上域名或发布目标。
