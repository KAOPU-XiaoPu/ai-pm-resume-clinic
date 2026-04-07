import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
} from 'react'
import type Vditor from 'vditor'
import 'vditor/dist/index.css'
import { findFirstSnippetLocation } from '../lib/markdown'
import type { ReviewIssue } from '../types'

interface VditorEditorProps {
  value: string
  onChange: (value: string) => void
  activeIssue: ReviewIssue | null
  isStale: boolean
}

export function VditorEditor({
  value,
  onChange,
  activeIssue,
  isStale,
}: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<Vditor | null>(null)
  const initialValueRef = useRef(value)
  const handleChange = useEffectEvent((nextValue: string) => {
    onChange(nextValue)
  })
  const activeLocation = useMemo(
    () =>
      activeIssue
        ? findFirstSnippetLocation(value, activeIssue.evidenceSnippets)
        : null,
    [activeIssue, value],
  )

  useEffect(() => {
    let disposed = false

    async function mountEditor() {
      const { default: Vditor } = await import('vditor')

      if (disposed || !containerRef.current) {
        return
      }

      instanceRef.current = new Vditor(containerRef.current, {
        value: initialValueRef.current,
        mode: 'ir',
        height: '100%',
        minHeight: 640,
        cache: {
          enable: false,
        },
        toolbar: [],
        toolbarConfig: {
          hide: true,
          pin: false,
        },
        preview: {
          mode: 'editor',
          actions: [],
        },
        counter: {
          enable: true,
          type: 'markdown',
        },
        placeholder: '支持直接粘贴 Markdown 简历内容。',
        input(nextValue) {
          handleChange(nextValue)
        },
      })
    }

    mountEditor()

    return () => {
      disposed = true

      if (instanceRef.current) {
        instanceRef.current.destroy()
        instanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance) {
      return
    }

    if (instance.getValue() !== value) {
      instance.setValue(value, true)
    }
  }, [value])

  useEffect(() => {
    const root = containerRef.current

    if (!root || !activeLocation) {
      return
    }

    const scrollElement =
      root.querySelector('.vditor-content') ??
      root.querySelector('.vditor-ir pre.vditor-reset')

    if (!(scrollElement instanceof HTMLElement)) {
      return
    }

    const lines = value.split('\n').length || 1
    const ratio = Math.min(1, activeLocation.line / lines)
    const maxScroll = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight)
    scrollElement.scrollTop = ratio * maxScroll
    instanceRef.current?.focus()
  }, [activeLocation, value])

  return (
    <div className="vditor-shell-wrap">
      <div className="editor-locator">
        {activeIssue ? (
          <>
            <strong>{activeIssue.title}</strong>
            <p>
              {activeLocation
                ? `已定位到约第 ${activeLocation.line} 行`
                : '当前内容里暂未命中原片段'}
              {isStale ? ' · 当前结果基于旧批改，修改后建议重新批改' : ''}
            </p>
            <div className="editor-locator__snippet">
              {activeLocation?.snippet ?? activeIssue.evidenceSnippets[0] ?? '该问题属于缺失型问题，没有精确原文片段。'}
            </div>
          </>
        ) : (
          <>
            <strong>编辑模式</strong>
            <p>从右侧悬停或点击某个待修改点，这里会显示对应原文片段和定位提示。</p>
          </>
        )}
      </div>

      <div className="vditor-shell" ref={containerRef} />
    </div>
  )
}
