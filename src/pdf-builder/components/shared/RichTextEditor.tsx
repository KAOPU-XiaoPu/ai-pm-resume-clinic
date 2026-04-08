import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCallback } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({
  content,
  onChange,
  placeholder: _placeholder = '请输入内容...',
  minHeight = 100,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('输入链接地址', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const buttons = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      title: '加粗',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      title: '斜体',
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive('underline'),
      title: '下划线',
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
      title: '无序列表',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
      title: '有序列表',
    },
    {
      icon: AlignLeft,
      action: () => editor.chain().focus().setTextAlign('left').run(),
      active: editor.isActive({ textAlign: 'left' }),
      title: '左对齐',
    },
    {
      icon: AlignCenter,
      action: () => editor.chain().focus().setTextAlign('center').run(),
      active: editor.isActive({ textAlign: 'center' }),
      title: '居中',
    },
    {
      icon: LinkIcon,
      action: setLink,
      active: editor.isActive('link'),
      title: '链接',
    },
  ]

  return (
    <div className="rounded-md border border-gray-200">
      <div className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 p-1">
        {buttons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className={cn(
              'rounded p-1.5 transition-colors hover:bg-gray-200',
              btn.active && 'bg-gray-200 text-blue-600',
            )}
          >
            <btn.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none"
        style={{ minHeight }}
      />
    </div>
  )
}
