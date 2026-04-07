import { useMemo, useRef, useState } from 'react'
import { renderMarkdownToHtml } from '../lib/markdown'
import type { ReviewIssue } from '../types'

interface MarkdownPreviewProps {
  markdown: string
  issues: ReviewIssue[]
  activeIssueId: string | null
  onIssueEnter: (issue: ReviewIssue) => void
  onIssueLeave: () => void
}

export function MarkdownPreview({
  markdown,
  issues,
  activeIssueId,
  onIssueEnter,
  onIssueLeave,
}: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<{
    issue: ReviewIssue
    top: number
    left: number
    placement: 'above' | 'below'
  } | null>(null)
  const issueMap = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue])),
    [issues],
  )
  const html = renderMarkdownToHtml(markdown, issues, activeIssueId)

  const showTooltip = (issue: ReviewIssue, clientX: number, clientY: number) => {
    const tooltipWidth = 320
    const margin = 16
    const left = Math.min(
      Math.max(margin, clientX + 14),
      window.innerWidth - tooltipWidth - margin,
    )
    const shouldPlaceAbove = clientY > 220

    setTooltip({
      issue,
      top: shouldPlaceAbove ? clientY - 14 : clientY + 18,
      left,
      placement: shouldPlaceAbove ? 'above' : 'below',
    })
  }

  const handleIssueTarget = (
    target: HTMLElement | null,
    clientX: number,
    clientY: number,
  ) => {
    if (!(target instanceof HTMLElement)) {
      if (tooltip) {
        setTooltip(null)
        onIssueLeave()
      }
      return
    }

    const issueIds = target.dataset.issueIds?.split(',') ?? []
    const issueId = issueIds[0] ?? target.dataset.issueId
    if (!issueId) {
      return
    }

    const issue = issueMap.get(issueId)
    if (!issue) {
      return
    }

    onIssueEnter(issue)
    showTooltip(issue, clientX, clientY)
  }

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target instanceof HTMLElement
      ? event.target.closest('[data-issue-id]')
      : null
    handleIssueTarget(
      target instanceof HTMLElement ? target : null,
      event.clientX,
      event.clientY,
    )
  }

  const handleMouseLeave = () => {
    setTooltip(null)
    onIssueLeave()
  }

  return (
    <div className="markdown-preview-shell">
      <div
        ref={containerRef}
        className="markdown-preview"
        onMouseOver={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {tooltip ? (
        <div
          className="issue-tooltip"
          style={{
            top: `${tooltip.top}px`,
            left: `${tooltip.left}px`,
            transform: tooltip.placement === 'above' ? 'translateY(-100%)' : 'none',
          }}
        >
          <strong>{tooltip.issue.title}</strong>
          <p>{tooltip.issue.reason}</p>
          <p>
            <span>怎么改：</span>
            {tooltip.issue.fix}
          </p>
        </div>
      ) : null}
    </div>
  )
}
