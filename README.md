# Outfit AI

一个基于 `Next.js 16 + React 19 + TypeScript + Tailwind CSS 4` 的 AI 穿搭推荐工作台。  
项目围绕“场景化穿搭推荐”展开，支持文本输入、用户画像、多模态图片参考、天气感知推荐、流式 AI 解释，以及基于 `Wanx 2.0` 的穿搭示例图生成。

## 当前能力边界

当前“图片参考”的作用是为模型提供视觉上下文，而不是做精确服装检测或商品检索。  
它主要用于：

- 辅助识别穿搭风格
- 提取颜色与单品线索
- 补充场景氛围信息
- 让推荐结果和解释更贴近用户上传的参考图

## 核心功能

### 1. 场景化穿搭推荐

- 输入场景描述
- 选择主风格
- 补充用户画像：性别、身高、体重、风格偏好
- 点击生成后返回 3 套卡片化穿搭结果

### 2. 多模态图片参考

- 支持点击上传和拖拽上传
- 支持上传后预览大图
- 上传图片后切换到视觉模型理解链路
- 展示图片分析结果：风格、颜色、单品、场景线索

### 3. 天气感知推荐

- 页面加载时尝试使用浏览器定位获取当前位置
- 调用天气接口获取当前天气和体感温度
- 如有降雨，自动在建议中加入“带伞”提醒

### 4. 流式 AI 解释

- 点击推荐卡片后，解释区通过 `SSE` 流式更新
- 输出风格接近对话式顾问说明，而不是一次性静态文本

### 5. Wanx 示例图生成

- 针对当前选中的穿搭，手动触发文生图
- 使用 `wanx2.0-t2i-turbo` 生成一张风格示意图
- 用于帮助用户更直观理解推荐搭配的视觉效果

### 6. 反馈闭环

- 每张推荐卡片支持“喜欢 / 不喜欢”反馈
- 下一轮生成时，会把最近反馈整理成偏好上下文注入模型 prompt

## 技术栈

- 前端：`Next.js 16`、`React 19`、`TypeScript`、`Tailwind CSS 4`
- 服务端：`Next.js Route Handlers`
- 模型：
  - `Qwen` 文本推荐
  - `Qwen` 视觉理解
  - `Wanx 2.0` 文生图
- 外部服务：
  - `Open-Meteo`：天气查询
  - `Nominatim / OpenStreetMap`：定位反查城市
- 交互协议：`SSE`

## API 说明

### `POST /api/outfits/recommend`

根据当前表单生成穿搭推荐。

返回：

- `recommendations`
- `imageAnalysis`
- `weather`

### `POST /api/outfits/explanation`

基于当前选中的搭配，通过 `SSE` 流式返回解释文本。

### `POST /api/outfits/example-image`

基于当前选中的搭配，调用 `wanx2.0-t2i-turbo` 生成示例图。

返回：

- `imageUrl`
- `revisedPrompt`

### `GET /api/weather/current`

基于浏览器定位经纬度返回当前天气。

### `GET /api/health`

返回服务状态与当前模型配置。

## 环境变量

在 `.env.development` 中配置：

```bash
QWEN_API_KEY=your_api_key
QWEN_MODEL=qwen3-vl-30b-a3b-instruct
QWEN_VISION_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

WANX_MODEL=wanx2.0-t2i-turbo
WANX_BASE_URL=https://dashscope.aliyuncs.com/api/v1
WANX_IMAGE_SIZE=1024*1024
```

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 开发说明

- 当前页面刷新后不会保留上一次输入和生成结果，默认每次进入都是干净状态
- 地点不支持手动输入，依赖浏览器定位自动获取
- 若定位失败，天气相关能力会降级，但不影响推荐主流程
- Wanx 文生图为异步任务轮询模式，生成时间通常会明显长于文本推荐
