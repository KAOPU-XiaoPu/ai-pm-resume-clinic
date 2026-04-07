export function exportResumePdf(previewElement: HTMLElement, title?: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF')
    return
  }

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((el) => el.outerHTML)
    .join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title ?? '简历'}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; }
    .resume-tpl {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>${previewElement.innerHTML}</body>
</html>`

  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}
