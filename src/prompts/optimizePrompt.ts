import type { ReviewReport } from '../types'

function formatIssueChecklist(report: ReviewReport) {
  const lines: string[] = []
  let index = 0

  for (const [key, section] of Object.entries(report.sections)) {
    if (section.issues.length === 0) continue

    lines.push(`\n## ${section.label}（${key}）`)

    for (const issue of section.issues) {
      index += 1
      lines.push(`### 问题 ${index}：${issue.title}`)
      if (issue.evidenceSnippets.length > 0) {
        lines.push(`定位：${issue.evidenceSnippets.map((s) => `”${s}”`).join('、')}`)
      }
      lines.push(`原因：${issue.reason}`)
      lines.push(`修改方向：${issue.fix}`)
    }
  }

  return lines.join('\n')
}

export const optimizeSystemPrompt = `你是一位资深的 AI 产品经理简历优化顾问。

## 核心任务
你收到的是一份已完成批改的简历和一份具体问题清单。你必须逐项修复清单中的每个问题，不做多余修改。

## 修改纪律（最高优先级）
1. 只改与问题清单直接相关的文本。问题清单没提到的段落、句子、用词，一律不动。
2. 每个问题都有”定位”（evidenceSnippets）和”修改方向”（fix）。优先在定位指向的位置做修改，按修改方向执行。
3. 不能杜撰不存在的经历、项目、职责、结果或数字。只能在原有事实允许的范围内重写、补充、重组表达。
4. 保留原有 Markdown 结构、标题层级和模块顺序。
5. 输出必须是完整的简历 Markdown 原文（修改后），不要解释，不要前后缀，不要代码块。
6. 对已经没有问题的段落，绝对不要”顺手改一改”。改动越精准越好，改动范围越小越好。
7. 严禁对专业术语、缩写、行业通用表达做”翻译”或”替换”。例如”AI产品经理”不能改成”人工智能产品经理”，”PM”不能改成”产品经理”，”SOP”不能改成”标准操作流程”。保留原文用词。

## 常见问题的修改方式
- “内容不足/展开不足/点数不够”：基于原文已有事实进行拆分、展开、补充细节，不凭空编造。
- “表达偏概括/不够具体”：把抽象描述改成具体的业务场景 + 你做了什么 + 产出了什么。
- “缺少量化结果”：从原文能推断的数据出发补充量化表达，不能编造精确数字。
- “括号解释不专业”：直接删掉括号解释，或改成更专业的表达方式。
- “结构不完整（如缺 STAR）”：在原文基础上补足缺失的结构要素（背景/目标/动作/结果）。

你只需要返回修改后的完整 Markdown 简历。`

export function buildOptimizeUserPrompt(markdown: string, report: ReviewReport) {
  const issueCount = Object.values(report.sections).reduce(
    (sum, section) => sum + section.issues.length,
    0,
  )

  return `当前简历得分：${report.overallScore}/100，共 ${issueCount} 个待修复问题。

请逐项修复以下问题清单中的每个问题。改完所有问题后，输出完整的修改后 Markdown。

⚠️ 重要：只改问题清单涉及的内容，不要动其他部分。

---

# 问题清单
${formatIssueChecklist(report)}

---

# 当前简历 Markdown
${markdown}`
}
