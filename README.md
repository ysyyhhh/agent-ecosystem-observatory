# DSH 生态观察站

[![DSH Ecosystem](https://img.shields.io/badge/DSH-Ecosystem-146450)](https://github.com/deepseek-ai/deepseek-harness)
[![Website](https://img.shields.io/badge/Website-GitHub%20Pages-2088ff)](https://ysyyhhh.github.io/agent-ecosystem-observatory/)
[![Deploy](https://github.com/ysyyhhh/agent-ecosystem-observatory/actions/workflows/pages.yml/badge.svg)](https://github.com/ysyyhhh/agent-ecosystem-observatory/actions/workflows/pages.yml)
[![Stars](https://img.shields.io/github/stars/ysyyhhh/agent-ecosystem-observatory?style=flat)](https://github.com/ysyyhhh/agent-ecosystem-observatory/stargazers)
[![License](https://img.shields.io/github/license/ysyyhhh/agent-ecosystem-observatory)](LICENSE)

**专注 DeepSeek Harness（DSH）生态的开源研究项目：追踪 DSH 变化，拆解相关开源与闭源产品，寻找有依据的产品机会。**

[访问网站](https://ysyyhhh.github.io/agent-ecosystem-observatory/) · [产品拆解](https://ysyyhhh.github.io/agent-ecosystem-observatory/#products) · [全局 Log](https://ysyyhhh.github.io/agent-ecosystem-observatory/#log) · [应用榜](https://ysyyhhh.github.io/agent-ecosystem-observatory/#rankings) · [提交产品 / 线索](https://github.com/ysyyhhh/agent-ecosystem-observatory/issues/new?template=research.md)

An open-source observatory dedicated to the DeepSeek Harness ecosystem: track DSH changes, map open- and closed-source product capabilities to DSH, and investigate product opportunities with references.

## 项目定位

DSH 是持续研究的中心。收录范围包括基于 DSH 的应用与插件，以及能为 DSH 提供能力对照、集成方向或产品启发的开源、闭源产品。引用某个闭源产品并不表示它采用 DSH。

本站公开代码与研究数据，将来源事实、作者声明、分析推断和实测结果分开记录。它是独立的生态观察网站，目前不是可安装的 DSH 插件。

## DSH 生态入口

- [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)
- [DSH 官方文档](https://deepseek-harness.github.io/deepseek-harness/)
- [DSH Releases](https://github.com/deepseek-ai/deepseek-harness/releases) · [社区 Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions)
- [GitHub：deepseek-harness](https://github.com/topics/deepseek-harness) · [GitHub：dsh-plugin](https://github.com/topics/dsh-plugin)
- [DSH 社区插件目录](https://awesome-dsh-plugin.com/)

## 为什么独立建仓库

这份项目的产物是围绕 DSH 的研究快照与静态网站。浏览和基础采集无需运行 DSH 或插件，也不依赖 GPU；其他产品作为 DSH 生态的对照与机会线索收录。

网站以洞察为首页，提供四个入口：

- 总览：DSH 变化、六层能力缺口、三个带反方和验证步骤的产品 Idea。
- 产品拆解：首批八个商业 / 社区产品，逐项映射到 DSH 模块或社区候选，附来源与缺口。
- 全局 Log：已审阅的 DSH / 产品更新与媒体线索，可按能力层过滤；另有自动采集的 release / commit 原始记录。
- 应用榜：已收录的四个 DSH 社区应用按 Star 或最近推送排序。排除归档与 Fork；不是全生态榜，也不是质量榜。仓库搜索作为折叠辅助目录保留。

每项映射和判断可展开查看引用。界面使用 UTC 日期与来源标注日期，避免把收录日期当成发布日期。

## 本地更新

需要 Python 3.10+、已登录的 GitHub CLI（`gh auth login`）。无需 Python 第三方依赖。

```powershell
python scripts/refresh.py
python -m unittest discover -s tests
python scripts/build.py
python -m http.server 8080 --directory dist
```

打开 http://localhost:8080 。审阅 `data/latest.json`、`data/activity.json` 与 `data/intelligence.json`，再提交发布：

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
- `data/intelligence.json`：已审阅的来源、六层能力、产品拆分、Idea、全局 Log 与媒体条目。产品和媒体摘要当前由研究者维护，不会由一次 refresh 自动生成。
- `data/activity.json`：每次最多 8 个 DSH releases、15 条 commit 的元数据采集，按 ID 合并历史。失败保留旧数据与旧观察日期。可独立运行 `python scripts/activity.py`。
- 媒体支持带原始链接的 X、Reddit、官方博客与论文记录；尚未配置 X API 或全网自动采集。X 原帖 403 时以转引线索展示，未知发布时间保留 null。
- `scripts/build.py` 校验每个来源、能力层和产品引用能解析；产品映射必须附缺口说明。首期快照不计算增长，多期可比的主仓库快照才显示区间 Star 变化。
- GitHub 搜索：`topic:dsh-plugin`，按更新时间采集最多 300 项，另含 DSH 主仓库。搜索存在索引延迟；这不是全生态普查。历史条目保留并标明观察日期。
- 首期收录属于基线，不能计算新增生态速度。首次发现不等于项目刚发布。
- 仅按仓库标识去重，不把 Fork 数、Star 或 commit 数当作有效能力。未安装任何候选项目。
- 商业产品页面仅进行有体积和超时上限的抓取与哈希比较。变化只是审阅信号，不是自动提取的功能发布；动态页可能产生噪声，登录墙即使返回 200 也不代表内容已验证。
- 来源抓取失败明确显示，不用失败覆盖为“没有更新”。厂商页面正文不随站点重新分发。

## 重计算扩展

工作流成功率、语义重复率、DSH 有效复用率初始均为 `null`，页面显示未评测。闲置算力阶段可以另行运行分析，再把审阅后的结果写入 research 数据；当前不提供伪装成已实现的评测运行器。

非空指标必须提供 `run_id` 与 `evidence_url`。建议每次实验保存任务数据版本、产品与模型版本、环境、运行时间、人工介入、成本、成功判定和原始记录。按任务比较，避免把任意加权乘积包装成权威总分。

## 研究路线

1. 持续采集、审阅来源、补充具体产品与媒体更新条目。
2. 扩大已有能力分类与人工映射；尤其补充映射反例和真实使用反馈。
3. 有了多期可比数据再统计新增能力速度。
4. 在本地空闲时做语义聚类与同任务评测。

参考 DSH 的插件化概念和本地 idea 模板的“价值假设 / 需要验证 / 后续工作”组织方式，未复制其运行时代码。非 DeepSeek、OpenAI 或任何产品的官方项目。

代码使用 MIT 许可证；第三方名称、描述和来源内容属于各自权利人。

## 验证

`python -m unittest discover -s tests` 检查采集失败保留、仓库去重与来源引用完整性。可选浏览器测试 `node tests/browser.cjs` 需要 Playwright（可通过 NODE_PATH 指向已有安装），`SITE_URL` 默认 `http://127.0.0.1:8086`，`BROWSER_PATH` 可指向本地 Chrome / Edge。测试覆盖导航、Idea / 产品详情、跨层跳转、Log 筛选、排行排序、移动布局和外部文本转义。

## 项目统计

[Star History](https://www.star-history.com/#ysyyhhh/agent-ecosystem-observatory&Date) · [贡献者](https://github.com/ysyyhhh/agent-ecosystem-observatory/graphs/contributors) · [提交活动](https://github.com/ysyyhhh/agent-ecosystem-observatory/activity) · [Fork 网络](https://github.com/ysyyhhh/agent-ecosystem-observatory/network/members)

Star 和提交活动只反映项目关注与维护情况，不作为 DSH 能力或产品质量评分。
