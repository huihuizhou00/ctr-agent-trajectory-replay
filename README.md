# CTR Agent Trajectory Replay

一个面向 Agent 评测与面试展示的离线轨迹回放页面。项目把原始 agent trajectory 还原为可检索、可逐 step 回放的证据链，用于分析模型消息、工具调用、代码执行、终端 observation 和环境状态变化之间的关系。

## 展示内容

- 8 条代表性 CTR 任务轨迹
- 1,597 个原始 step 的顺序回放
- 模型消息、tool call、shell/Python keystrokes、终端 observation 和 metrics
- `sim_hour`、`ad_load`、`frequency_cap`、`refresh_interval`、airtime、rollouts 等状态量的逐步变化
- 模型、环境、动作三条对齐时间轨道，可拖动到任意 step 检查上下文
- 按工具调用、代码、错误、状态变化和 observation 筛选，并支持关键词搜索
- 中英文界面切换（原始 Agent message 保留原文，避免把证据误当成翻译结果）

## 我完成的工作

1. 从原始轨迹中抽取可验证的 step、动作、观测和状态字段，保留来源顺序与原始文本。
2. 建立状态量 carry-forward 规则：当前 step 没有新观测时明确标记，而不是填充或猜测数值。
3. 设计模型、环境、动作三轨对齐的回放交互，支持从任意时间点定位失败上下文。
4. 将失败分析从“结果是否通过”扩展到 proxy 误判、配置变更时机、环境/基础设施异常和 evaluator 可评分性等过程证据。
5. 形成可复用的评测 SOP：轨迹完整性检查 → 动作/观测核对 → 状态变化追踪 → 失败模式归因 → verifier/reward 边界确认。

## 运行

页面是自包含的静态 HTML，可直接打开 `index.html`。也可以在本目录启动本地服务：

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

然后访问 <http://127.0.0.1:8766/index.html>。

## 文件说明

- `index.html`：可直接演示的离线回放页面，包含已整理的展示数据。
- `build_replay.py`：从本地只读轨迹生成回放页面的构建脚本。

构建脚本依赖作业原始轨迹目录。原始 task、trajectory、Harbor 源码、运行产物和 submission 不包含在本仓库中；页面中的展示数据仅用于说明评测方法和个人实现，不代表完整 benchmark 分发包。

## 评测边界

页面展示的是可观察证据，不展示或推断隐藏思维链。8 条轨迹用于失败模式发现和方法演示，不用于估计整个任务分布的失败率。`reward`、verifier 和基础设施状态需要结合原始 evaluator 产物解释，不能把缺失 evaluator 证据直接等同于模型得分为 0。

