export default function Alert({ type = 'error', message }) {
  const styles = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  }

  return (
    <div className={`p-3 border rounded-lg ${styles[type]}`}>
      <p className="text-sm text-center">{message}</p>
    </div>
  )
}