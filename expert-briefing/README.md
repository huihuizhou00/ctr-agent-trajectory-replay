# CTR Agent Benchmark 专家汇报页面

这是一个独立的、无构建依赖的静态评测审计控制台，用于向出题技术专家汇报 CTR Agent Benchmark 的 construct、轨迹、verifier、Harbor 执行链和改进边界。页面使用本地 `data.js` 固定已核验事实，不在浏览器运行时读取原始 task、trajectory 或 Harbor 文件。

## 打开

```bash
cd /Users/huihui/Documents/review/重新作业-20260814/expert-briefing
python3 -m http.server 8765
```

浏览器打开 <http://127.0.0.1:8765/>。

如果 8765 已被占用，可换成其他端口。页面不需要 Node.js、npm 或外网资源。

## 汇报操作

- 默认是“结论视图”：只保留判断链、关键数值和责任边界。
- 切换“证据视图”：显示轨迹 step、绝对证据路径，并可复制路径。
- 左侧章节导航适合按 15 分钟顺序讲解；移动端会变成顶部横向进度。
- 轨迹矩阵支持按 failure mode 筛选；点击行或案例按钮可更新五节点 trace viewer。
- Probe 可切换原 outcome verifier / process revision；L5 历史 infra 记录默认折叠。
- 打印时会自动切到证据视图并隐藏导航控件。

## 证据边界

页面展示的 `process-verifier-revision` 是 fixture 驱动的最小过程 gate 原型，尚未接入 Harbor，也不冒充真实过程日志或新的 Harbor Job。正式 `submission/`、原始 task、trajectory、Harbor 源码均未被页面修改。
