export default function Button({
  type = 'button',
  children,
  isLoading = false,
  variant = 'primary',
  onClick,
  className = '',
}) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex-1 flex justify-center py-2.5 px-4 
        border border-transparent rounded-lg shadow-sm 
        text-sm font-medium text-white 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 
        disabled:opacity-50 disabled:cursor-not-allowed 
        transition-all hover:scale-[1.02] active:scale-[0.98]
        ${variants[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  )
}