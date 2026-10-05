export default function EmailBody({ content }) {
  if (!content) {
    return <p className="text-gray-500">Sin contenido</p>
  }

  const text = typeof content === 'string' ? content : String(content)
  const looksHtml = /<[a-z][\s\S]*>/i.test(text)

  if (looksHtml) {
    return (
      <div
        className="email-body break-words [&_a]:text-indigo-400 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }

  return <pre className="whitespace-pre-wrap font-sans text-sm">{text}</pre>
}
