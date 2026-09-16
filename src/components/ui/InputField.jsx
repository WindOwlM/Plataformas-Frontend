export default function InputField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          className={`
            block w-full ${icon ? 'pl-10' : 'pl-4'} pr-3 py-3 
            bg-gray-700 border border-gray-600 rounded-lg 
            text-white placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
            transition-all
          `}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}