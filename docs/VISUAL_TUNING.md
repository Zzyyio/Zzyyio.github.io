# 视觉参数入口

## 点波纹

常用参数集中在 `components/ripple-field.tsx` 顶部的 `RIPPLE_TUNING`：

- `dotsPerSide`：每次生成时轨迹两侧各产生的点数。总数约为该值的两倍。
- `maximumParticles`：同时存活的点数上限。
- `emissionDistance`：鼠标累计移动多少像素后生成一次；值越小，波纹越密。
- `emissionStepDistance`、`maximumEmissionSteps`：快速移动时沿路径补点的间距和次数上限。
- `minimumPointSize`、`pointSizeVariation`：点的最小尺寸和随机尺寸范围。
- `minimumLifetime`、`lifetimeVariation`：点的最短生命和随机时长。
- `peakAlpha`：点的最大不透明度。
- `absorptionDistance`：距离背景线多少像素时开始明显缩小、消失。
- `maximumAttraction`：生命周期后段吸向背景线的最大力度。
- `maximumPixelRatio`：WebGL 渲染分辨率上限；提高会更清晰，也会增加 GPU 开销。

## 背景线

线条外观参数位于 `app/globals.css` 的 `:root`：

- `--line-primary-width`：主黑线粗细。
- `--line-echo-width`：回声线粗细。

主线和回声线的颜色、不透明度分别位于 `.line-field__primary` 与 `.line-field__echo`。曲线形状、章节端点和滚动形变位于 `lib/visual-shapes.ts`：

- `routeShapes`：简介、摄影和项目的基础构图控制点。
- `sectionCompositions`：章节切换后的两个屏外端点与中段弧度。
- `shapeForScroll`：滚动漂移、弯折和相位变化幅度。
- `pointsToSmoothPath`、`sampleSmoothCurve`：SVG 绘制与波纹吸附共用的圆滑二次样条。

修改点数或尺寸时，优先一次只调整一项，并保留 `maximumParticles` 与 `maximumPixelRatio` 的性能上限。
