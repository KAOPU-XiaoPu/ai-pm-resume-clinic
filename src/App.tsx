import { startTransition, useDeferredValue, useState } from 'react'
import './App.css'
import { MarkdownPreview } from './components/MarkdownPreview'
import { VditorEditor } from './components/VditorEditor'
import { teacherSampleResume } from './data/exampleResumes'
import {
  defaultOptimizeModelId,
  defaultModelId,
  reviewModelOptions,
  sectionLabels,
  sectionOrder,
} from './data/reviewConfig'
import { guardOptimizedSections } from './lib/markdown'
import { hasStoredApiKey, optimizeResume, reviewResume, setStoredApiKey } from './lib/openrouter'
import type {
  ReviewIssue,
  ReviewMode,
  ReviewReport,
  ReviewSectionKey,
  ReviewSectionResult,
  ReviewState,
} from './types'

interface ScoreCardProps {
  report: ReviewReport | null
  reviewState: ReviewState
  optimizeState: ReviewState
  isStale: boolean
  errorMessage: string | null
  optimizationRounds: number
  optimizationMessage: string | null
  canOptimize: boolean
  needsRefreshBeforeOptimize: boolean
  onOptimize: () => void
}

interface SectionCardProps {
  title: string
  section: ReviewSectionResult | null
  reviewState: ReviewState
  isStale: boolean
  activeIssueId: string | null
  matchedIssueIds: Set<string>
  onIssueEnter: (issue: ReviewIssue) => void
  onIssueLeave: () => void
}

function ScoreCard({
  report,
  reviewState,
  optimizeState,
  isStale,
  errorMessage,
  optimizationRounds,
  optimizationMessage,
  canOptimize,
  needsRefreshBeforeOptimize,
  onOptimize,
}: ScoreCardProps) {
  return (
    <section className="sidebar-card score-card">
      <header className="sidebar-card__header">
        <h2>综合得分</h2>
        {isStale ? <span className="badge badge--warn">内容已变更</span> : null}
      </header>

      {reviewState === 'loading' ? (
        <div className="score-card__placeholder">
          <strong>批改中</strong>
          <p>模型正在识别模块并生成批注。</p>
        </div>
      ) : null}

      {optimizeState === 'loading' ? (
        <div className="score-card__placeholder">
          <strong>优化中</strong>
          <p>
            优化 Agent 正在按问题改写原文，并交由批改 Agent 复评。
            {optimizationRounds > 0 ? ` 当前第 ${optimizationRounds} 轮。` : ''}
          </p>
        </div>
      ) : null}

      {reviewState !== 'loading' && !report && !errorMessage ? (
        <div className="score-card__placeholder">
          <strong>待开始</strong>
          <p>点击“开始批改”后生成综合得分和结构化点评。</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="score-card__error">
          <strong>批改失败</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {report ? (
        <div className="score-card__content">
          <div className="score-card__number">
            <strong>{report.overallScore}</strong>
            <span>/ 100</span>
          </div>
          <p className="score-card__verdict">{report.overallVerdict}</p>
          <p className="score-card__summary">{report.overallSummary}</p>
          <div className="score-card__meta">
            <span>
              批改时间：
              {new Date(report.reviewedAt).toLocaleString('zh-CN', {
                hour12: false,
              })}
            </span>
          </div>

          {optimizationMessage ? (
            <p className="score-card__automation-note">{optimizationMessage}</p>
          ) : null}

          {needsRefreshBeforeOptimize ? (
            <p className="score-card__automation-note">
              当前内容已被编辑，请先重新批改，再启动自动优化。
            </p>
          ) : null}

          {canOptimize ? (
            <button
              type="button"
              className="score-card__action"
              onClick={onOptimize}
            >
              优化
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

const MAX_OPTIMIZE_ROUNDS = 3

function SectionCard({
  title,
  section,
  reviewState,
  isStale,
  activeIssueId,
  matchedIssueIds,
  onIssueEnter,
  onIssueLeave,
}: SectionCardProps) {
  if (!section) {
    return (
      <section className="sidebar-card section-card">
        <header className="sidebar-card__header">
          <h2>{title}</h2>
        </header>
        <p className="section-card__empty">请先开始批改。</p>
      </section>
    )
  }

  return (
    <section className="sidebar-card section-card">
      <header className="sidebar-card__header">
        <h2>{section.label}</h2>
        {section.issues.length === 0 ? (
          <span className="status-pass">✓</span>
        ) : (
          <span className="issue-count">{section.issues.length}</span>
        )}
      </header>

      {reviewState === 'loading' ? (
        <p className="section-card__empty">正在识别这个模块。</p>
      ) : null}

      {reviewState !== 'loading' && section.issues.length === 0 ? (
        <div className="section-card__pass">
          <p>无待调整项</p>
          {isStale ? <span className="section-card__hint">当前内容已编辑，建议重新批改确认。</span> : null}
        </div>
      ) : null}

      {section.issues.length > 0 ? (
        <div className="section-issue-list">
          {section.issues.map((issue) => (
            <button
              type="button"
              key={issue.id}
              className={`issue-chip ${activeIssueId === issue.id ? 'issue-chip--active' : ''} ${
                isStale && !matchedIssueIds.has(issue.id) ? 'issue-chip--stale' : ''
              }`}
              onMouseEnter={() => onIssueEnter(issue)}
              onMouseLeave={onIssueLeave}
              onFocus={() => onIssueEnter(issue)}
              onBlur={onIssueLeave}
              onClick={() => onIssueEnter(issue)}
            >
              <span className="issue-chip__title">{shortenTitle(issue.title)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function App() {
  const [markdown, setMarkdown] = useState(teacherSampleResume)
  const deferredMarkdown = useDeferredValue(markdown)
  const [mode, setMode] = useState<ReviewMode>('read')
  const [reviewModel, setReviewModel] = useState(defaultModelId)
  const [optimizeModel, setOptimizeModel] = useState(defaultOptimizeModelId)
  const [reviewState, setReviewState] = useState<ReviewState>('idle')
  const [optimizeState, setOptimizeState] = useState<ReviewState>('idle')
  const [report, setReport] = useState<ReviewReport | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showKeyDialog, setShowKeyDialog] = useState(() => !hasStoredApiKey())
  const [keyInput, setKeyInput] = useState('')
  const [optimizationRounds, setOptimizationRounds] = useState(0)
  const [optimizationMessage, setOptimizationMessage] = useState<string | null>(null)
  const [lastReviewedMarkdown, setLastReviewedMarkdown] = useState(teacherSampleResume)
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)

  const isReviewing = reviewState === 'loading'
  const isOptimizing = optimizeState === 'loading'
  const isBusy = isReviewing || isOptimizing
  const isStale = Boolean(report && lastReviewedMarkdown !== markdown)
  const canOptimize =
    report !== null &&
    report.overallScore < 100 &&
    reviewState === 'success' &&
    !isStale &&
    !isOptimizing
  const needsRefreshBeforeOptimize =
    report !== null && report.overallScore < 100 && isStale
  const allIssues = report
    ? sectionOrder.flatMap((key) => report.sections[key].issues)
    : []
  const activeIssue = allIssues.find((issue) => issue.id === activeIssueId) ?? null
  const matchedIssueIds = new Set(
    allIssues
      .filter((issue) => issue.evidenceSnippets.some((snippet) => markdown.includes(snippet)))
      .map((issue) => issue.id),
  )

  const handleIssueEnter = (issue: ReviewIssue) => {
    setActiveIssueId(issue.id)
  }

  const clearHighlight = () => {
    if (mode === 'edit') {
      return
    }

    setActiveIssueId(null)
  }

  const handleToggleMode = () => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'read' ? 'edit' : 'read'

      if (nextMode === 'edit') {
        const firstIssue = allIssues[0]
        if (firstIssue) {
          setActiveIssueId(firstIssue.id)
        }
      }

      if (nextMode === 'read' && !activeIssueId) {
        setActiveIssueId(null)
      }

      return nextMode
    })
  }

  const handleSaveKey = () => {
    const trimmed = keyInput.trim()
    if (!trimmed) {
      return
    }
    setStoredApiKey(trimmed)
    setShowKeyDialog(false)
    setKeyInput('')
  }

  const handleReview = async () => {
    if (!hasStoredApiKey()) {
      setShowKeyDialog(true)
      return
    }
    if (!markdown.trim() || isBusy) {
      return
    }

    clearHighlight()
    setReviewState('loading')
    setOptimizeState('idle')
    setErrorMessage(null)
    setOptimizationRounds(0)
    setOptimizationMessage(null)

    try {
      const nextReport = await reviewResume(markdown, reviewModel)

      startTransition(() => {
        setReport(nextReport)
        setLastReviewedMarkdown(markdown)
        setReviewState('success')
        setMode('read')
        setActiveIssueId(getFirstIssueId(nextReport))
      })
    } catch (error) {
      setReport(null)
      setReviewState('error')
      setErrorMessage(error instanceof Error ? error.message : '请求失败，请稍后重试。')
    }
  }

  const handleOptimize = async () => {
    if (!hasStoredApiKey()) {
      setShowKeyDialog(true)
      return
    }
    if (!report || report.overallScore >= 100 || isBusy) {
      return
    }

    setOptimizeState('loading')
    setErrorMessage(null)
    setOptimizationRounds(0)
    setOptimizationMessage(null)

    let round = 0
    let currentMarkdown = markdown
    let currentReport = report
    let bestMarkdown = markdown
    let bestReport = report
    let stopReason: 'limit' | 'unchanged' | 'regressed' | null = null

    try {
      while (currentReport.overallScore < 100 && round < MAX_OPTIMIZE_ROUNDS) {
        round += 1
        setOptimizationRounds(round)

        const optimized = await optimizeResume(currentMarkdown, currentReport, optimizeModel)

        if (
          normalizeMarkdownContent(optimized.markdown) ===
          normalizeMarkdownContent(currentMarkdown)
        ) {
          stopReason = 'unchanged'
          break
        }

        // Guard: only keep changes for sections that actually had issues
        const sectionKeysWithIssues = new Set(
          (Object.keys(currentReport.sections) as ReviewSectionKey[]).filter(
            (key) => currentReport.sections[key].issues.length > 0,
          ),
        )
        currentMarkdown = guardOptimizedSections(
          currentMarkdown,
          optimized.markdown,
          sectionKeysWithIssues,
        )
        currentReport = await reviewResume(currentMarkdown, reviewModel)

        if (currentReport.overallScore > bestReport.overallScore) {
          bestMarkdown = currentMarkdown
          bestReport = currentReport
        }

        if (currentReport.overallScore < bestReport.overallScore) {
          currentMarkdown = bestMarkdown
          currentReport = bestReport
          stopReason = 'regressed'
          break
        }

        startTransition(() => {
          setMarkdown(currentMarkdown)
          setReport(currentReport)
          setLastReviewedMarkdown(currentMarkdown)
          setMode('read')
          setActiveIssueId(getFirstIssueId(currentReport))
        })
      }

      if (!stopReason && currentReport.overallScore < 100 && round >= MAX_OPTIMIZE_ROUNDS) {
        stopReason = 'limit'
      }

      const finalMarkdown = bestReport.overallScore >= currentReport.overallScore ? bestMarkdown : currentMarkdown
      const finalReport = bestReport.overallScore >= currentReport.overallScore ? bestReport : currentReport

      startTransition(() => {
        setMarkdown(finalMarkdown)
        setReport(finalReport)
        setLastReviewedMarkdown(finalMarkdown)
        setMode('read')
        setReviewState('success')
        setOptimizeState('success')
        setOptimizationRounds(round)
        setActiveIssueId(getFirstIssueId(finalReport))
        setOptimizationMessage(buildOptimizationMessage(finalReport.overallScore, round, stopReason))
      })
    } catch (error) {
      setOptimizeState('error')
      setErrorMessage(error instanceof Error ? error.message : '优化失败，请稍后重试。')
    }
  }

  return (
    <div className="app-shell">
      {showKeyDialog ? (
        <div className="key-dialog-overlay">
          <div className="key-dialog">
            <h2>输入 AIHubMix API Key</h2>
            <p>
              请在{' '}
              <a href="https://aihubmix.com" target="_blank" rel="noopener noreferrer">
                aihubmix.com
              </a>{' '}
              获取你的 API Key，填入后即可使用批改功能。
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSaveKey()
                }
              }}
              placeholder="sk-..."
              autoFocus
            />
            <div className="key-dialog__actions">
              <button type="button" onClick={handleSaveKey} disabled={!keyInput.trim()}>
                确认
              </button>
              {hasStoredApiKey() ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyDialog(false)
                    setKeyInput('')
                  }}
                >
                  取消
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <main className="app-frame">
        <header className="topbar">
          <h1>AI产品经理简历批改台</h1>

          <div className="topbar__controls">
            <label className="model-picker">
              <span>批改模型：</span>
              <select
                value={reviewModel}
                onChange={(event) => setReviewModel(event.target.value)}
                disabled={isBusy}
                aria-label="切换模型"
              >
                {reviewModelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.shortLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="model-picker">
              <span>优化模型：</span>
              <select
                value={optimizeModel}
                onChange={(event) => setOptimizeModel(event.target.value)}
                disabled={isBusy}
                aria-label="切换优化模型"
              >
                {reviewModelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.shortLabel}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="topbar__button"
              onClick={handleToggleMode}
              disabled={isBusy}
            >
              {mode === 'read' ? '编辑模式' : '阅读模式'}
            </button>

            <button
              type="button"
              className="topbar__button topbar__button--primary"
              onClick={handleReview}
              disabled={isBusy || !markdown.trim()}
            >
              {isReviewing ? '批改中...' : isOptimizing ? '优化中...' : '开始批改'}
            </button>

            <button
              type="button"
              className="topbar__button topbar__button--small"
              onClick={() => setShowKeyDialog(true)}
            >
              更换 Key
            </button>
          </div>
        </header>

        <section className="workspace">
          <section className="left-panel">
            {mode === 'read' ? (
              <MarkdownPreview
                markdown={deferredMarkdown}
                issues={allIssues}
                activeIssueId={activeIssueId}
                onIssueEnter={handleIssueEnter}
                onIssueLeave={clearHighlight}
              />
            ) : (
              <VditorEditor
                value={markdown}
                onChange={setMarkdown}
                activeIssue={activeIssue}
                isStale={isStale}
              />
            )}
          </section>

          <aside className="right-panel">
            <ScoreCard
              report={report}
              reviewState={reviewState}
              optimizeState={optimizeState}
              isStale={isStale}
              errorMessage={errorMessage}
              optimizationRounds={optimizationRounds}
              optimizationMessage={optimizationMessage}
              canOptimize={canOptimize}
              needsRefreshBeforeOptimize={needsRefreshBeforeOptimize}
              onOptimize={handleOptimize}
            />

            {sectionOrder.map((key) => (
              <SectionCard
                key={key}
                title={sectionLabels[key]}
                section={report?.sections[key] ?? null}
                reviewState={reviewState}
                isStale={isStale}
                activeIssueId={activeIssueId}
                matchedIssueIds={matchedIssueIds}
                onIssueEnter={handleIssueEnter}
                onIssueLeave={clearHighlight}
              />
            ))}
          </aside>
        </section>
      </main>
    </div>
  )
}

function shortenTitle(title: string) {
  return title.length > 20 ? `${title.slice(0, 20)}…` : title
}

function getFirstIssueId(report: ReviewReport | null) {
  if (!report) {
    return null
  }

  return (
    report.sections.personal_info.issues[0]?.id ??
    report.sections.personal_strengths.issues[0]?.id ??
    report.sections.work_experience.issues[0]?.id ??
    report.sections.project_experience.issues[0]?.id ??
    null
  )
}

function normalizeMarkdownContent(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

function buildOptimizationMessage(
  overallScore: number,
  rounds: number,
  stopReason: 'limit' | 'unchanged' | 'regressed' | null,
) {
  if (rounds === 0) {
    return null
  }

  if (overallScore >= 100) {
    return `已自动优化 ${rounds} 轮，当前达到 100 分。`
  }

  if (stopReason === 'unchanged') {
    return `优化 Agent 在第 ${rounds} 轮未继续改动原文，当前停在 ${overallScore} 分。`
  }

  if (stopReason === 'regressed') {
    return `已自动优化 ${rounds} 轮，第 ${rounds} 轮分数下降，已回退到最佳版本（${overallScore} 分）。`
  }

  if (stopReason === 'limit') {
    return `已自动优化 ${rounds} 轮，当前 ${overallScore} 分；为避免无限循环，自动优化已暂停。`
  }

  return `已自动优化 ${rounds} 轮，当前 ${overallScore} 分。`
}

export default App
