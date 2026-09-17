# 视觉参数入口

## 背景线

线条外观参数位于 `app/globals.css` 的 `:root`：

- `--line-primary-width`：主黑线粗细。
- `--line-echo-width`：回声线粗细。

主线和回声线的颜色、不透明度分别位于 `.line-field__primary` 与 `.line-field__echo`。曲线形状、章节端点和滚动形变位于 `lib/visual-shapes.ts`：

- `routeShapes`：简介、摄影和项目的基础构图控制点。
- `sectionCompositions`：章节切换后的两个屏外端点与中段弧度。
- `shapeForScroll`：滚动漂移、弯折和相位变化幅度。
- `pointsToSmoothPath`、`sampleSmoothCurve`：SVG 绘制与波纹吸附共用的圆滑二次样条。
