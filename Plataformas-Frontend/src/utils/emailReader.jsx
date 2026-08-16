export const renderEmailBody = (text) => {
  if (!text) return null

  // Detecta URLs que empiecen con http o https
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g
  const lines = text.split(/\r?\n/)

  return lines.map((line, i) => {
    const elements = []
    let lastIndex = 0
    let match

    while ((match = urlRegex.exec(line)) !== null) {
      // Texto antes del link
      if (match.index > lastIndex) {
        elements.push(
          <span key={`t-${i}-${lastIndex}`}>
            {line.slice(lastIndex, match.index)}
          </span>
        )
      }

      // El link clickeable
      const url = match[1]
      elements.push(
        <a
        key={`l-${i}-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors break-all my-1"
      >
        Abrir enlace
      </a>
      )

      lastIndex = match.index + match[0].length
    }

    // Texto después de la última URL
    if (lastIndex < line.length) {
      elements.push(
        <span key={`t-${i}-end`}>{line.slice(lastIndex)}</span>
      )
    }

    return (
      <div key={i} className={line.trim() === '' ? 'h-4' : ''}>
        {elements.length > 0 ? elements : <span>&nbsp;</span>}
      </div>
    )
  })
}
