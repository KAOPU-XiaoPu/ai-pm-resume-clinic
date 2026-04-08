import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Certificate {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export function CertificatePanel() {
  const [items, setItems] = useState<Certificate[]>([])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', issuer: '', date: '', url: '' },
    ])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id))
  }

  const updateItem = (id: string, updates: Partial<Certificate>) => {
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="space-y-3">
      {items.map((cert) => (
        <div
          key={cert.id}
          className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  value={cert.name}
                  onChange={(e) =>
                    updateItem(cert.id, { name: e.target.value })
                  }
                  placeholder="证书名称"
                />
                <input
                  className={inputClass}
                  value={cert.issuer}
                  onChange={(e) =>
                    updateItem(cert.id, { issuer: e.target.value })
                  }
                  placeholder="颁发机构"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  value={cert.date}
                  onChange={(e) =>
                    updateItem(cert.id, { date: e.target.value })
                  }
                  placeholder="获得日期"
                />
                <input
                  className={inputClass}
                  value={cert.url}
                  onChange={(e) =>
                    updateItem(cert.id, { url: e.target.value })
                  }
                  placeholder="证书链接 (可选)"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(cert.id)}
              className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加证书
      </button>
    </div>
  )
}
