# Agent 生态观察站

面向个人开发者的持续调研项目：观察 DSH 开源生态与商业 Agent 产品，把公开元数据、厂商声明、研究假设和实测结果分开记录。

网站：https://ysyyhhh.github.io/agent-ecosystem-observatory/

## 为什么独立建仓库

这份项目的产物是有证据的研究快照与静态网站。无需运行 DSH 或插件，也不依赖 GPU。DSH 是首个观察对象，可逐步扩展更多生态。

首版支持搜索、范围筛选、分页、公开数据下载、来源抓取状态、研究假设与评测空状态。它是调研基础设施，尚不是完整的能力排行榜或自动研究 Agent。

## 本地更新

需要 Python 3.10+、已登录的 GitHub CLI（`gh auth login`）。无需 Python 第三方依赖。

```powershell
python scripts/refresh.py
python -m unittest discover -s tests
python scripts/build.py
python -m http.server 8080 --directory dist
```

打开 http://localhost:8080 。审阅 `data/latest.json` 与 `data/research.json`，再提交发布：

```powershell
git add data
git commit -m "Update research snapshot"
git push origin main
```

代码或数据推送 main 后，GitHub Actions 自动构建并发布 Pages；网页不直接调用 GitHub API，不持有令牌。CI 不采集、不调用模型、不运行重计算。

本地周期执行 `python scripts/refresh.py` 即可更新数据；调度器的工作目录必须指向本仓库。目前未安装定时任务，未自动提交或推送。具体频率可按需要另配。只改本地数据不会自动改变线上网站。

## 数据与口径

- `data/latest.json`：最新采集结果与来源状态。
- `data/snapshots/`：每次采集的时间戳快照，保留历史。
- `data/research.json`：人工维护的产品观察、假设、评测结果。
- GitHub 搜索：`topic:dsh-plugin`，按更新时间采集最多 300 项，另含 DSH 主仓库。搜索存在索引延迟；这不是全生态普查。历史条目保留并标明观察日期。
- 首期收录属于基线，不能计算新增生态速度。首次发现不等于项目刚发布。
- 仅按仓库标识去重，不把 Fork 数、Star 或 commit 数当作有效能力。未安装任何候选项目。
- 商业产品页面仅进行有体积和超时上限的抓取与哈希比较。变化只是审阅信号，不是自动提取的功能发布；动态页可能产生噪声，登录墙即使返回 200 也不代表内容已验证。
- 来源抓取失败明确显示，不用失败覆盖为“没有更新”。厂商页面正文不随站点重新分发。

## 重计算扩展

工作流成功率、语义重复率、DSH 有效复用率初始均为 `null`，页面显示未评测。闲置算力阶段可以另行运行分析，再把审阅后的结果写入 research 数据；当前不提供伪装成已实现的评测运行器。

非空指标必须提供 `run_id` 与 `evidence_url`。建议每次实验保存任务数据版本、产品与模型版本、环境、运行时间、人工介入、成本、成功判定和原始记录。按任务比较，避免把任意加权乘积包装成权威总分。

## 研究路线

1. 先持续采集、审阅来源、补充具体产品更新条目。
2. 增加带原文链接与发布日期的能力 taxonomy / 人工映射。
3. 有了多期可比数据再统计新增能力速度。
4. 在本地空闲时做语义聚类与同任务评测。

参考 DSH 的插件化概念和本地 idea 模板的“价值假设 / 需要验证 / 后续工作”组织方式，未复制其运行时代码。非 DeepSeek、OpenAI 或任何产品的官方项目。

代码使用 MIT 许可证；第三方名称、描述和来源内容属于各自权利人。
