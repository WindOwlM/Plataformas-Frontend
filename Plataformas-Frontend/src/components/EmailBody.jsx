import DOMPurify from 'dompurify'

export default function EmailBody({ content }) {
  if (!content) return null

  // Detecta si es HTML (Outlook) o texto plano (Gmail)
  const isHtml = content.trim().startsWith('<')

  // ─── TEXTO PLANO (Gmail) ───
  if (!isHtml) {
    return (
      <div className="text-gray-300 text-sm leading-relaxed space-y-0">
        {renderPlainText(content)}
      </div>
    )
  }

  // ─── HTML (Outlook) ───
  // Limpia el HTML: quita scripts, eventos y estilos inline problemáticos
  const cleanHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height'],
    // Quita estilos inline para que no pongan fondo blanco/texto negro
    KEEP_CONTENT: true,
  })

  return (
    <div className="email-html-content text-gray-200 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar">
      <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      
      {/* Estilos para que los links se vean como botones */}
      <style>{`
        .email-html-content a {
          display: inline-block;
          padding: 6px 14px;
          background-color: #4f46e5;
          color: white !important;
          text-decoration: none !important;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          margin: 4px 2px;
          transition: all 0.2s;
          word-break: break-all;
          border: none;
          cursor: pointer;
        }
        .email-html-content a:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
        }
        .email-html-content p {
          margin-bottom: 0.75rem;
        }
        .email-html-content div {
          margin-bottom: 0.5rem;
        }
        .email-html-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        .email-html-content td,
        .email-html-content th {
          padding: 8px;
          border: 1px solid #374151;
        }
        .email-html-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .email-html-content strong,
        .email-html-content b {
          color: #f3f4f6;
          font-weight: 600;
        }
        .email-html-content h1,
        .email-html-content h2,
        .email-html-content h3 {
          color: #e5e7eb;
          margin: 12px 0 8px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

// Helper para texto plano (Gmail)
function renderPlainText(text) {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g
  const lines = text.split(/\r?\n/)

  return lines.map((line, i) => {
    const elements = []
    let lastIndex = 0
    let match

    while ((match = urlRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(
          <span key={`t-${i}-${lastIndex}`}>
            {line.slice(lastIndex, match.index)}
          </span>
        )
      }
      const url = match[1]
      elements.push(
        <a
          key={`l-${i}-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline break-all cursor-pointer"
        >
          {url}
        </a>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < line.length) {
      elements.push(<span key={`t-${i}-end`}>{line.slice(lastIndex)}</span>)
    }

    return (
      <div key={i} className={line.trim() === '' ? 'h-4' : ''}>
        {elements.length > 0 ? elements : <span>&nbsp;</span>}
      </div>
    )
  })
}