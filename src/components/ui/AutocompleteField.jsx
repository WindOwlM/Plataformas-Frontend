import { useState, useRef, useEffect } from 'react'

export default function AutocompleteField({
  id,
  label,
  placeholder,
  value,
  onChange,
  options = [],
  getOptionLabel = (opt) => opt.nombre || opt.nombre_plat || opt.nombre_prov || '',
  getOptionValue = (opt) => opt.id,
  required = false,
  icon
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Encontrar la opción seleccionada para mostrar su nombre
  const selectedOption = options.find(opt => getOptionValue(opt) === value)
  
  // Filtrar opciones según el texto escrito
  const filteredOptions = query.length > 0
    ? options.filter(opt => 
        getOptionLabel(opt).toLowerCase().includes(query.toLowerCase())
      )
    : options

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(option) {
    onChange(getOptionValue(option))
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function handleInputChange(e) {
    setQuery(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(0)
    if (value) {
      onChange('') // Limpiar selección si empieza a escribir
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={selectedOption ? getOptionLabel(selectedOption) : query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required && !value}
          className={`
            block w-full ${icon ? 'pl-10' : 'pl-3'} pr-10 py-2.5
            bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-all
          `}
        />
        
        {/* Indicador de seleccionado */}
        {selectedOption && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={getOptionValue(option)}
              type="button"
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                w-full text-left px-3 py-2 text-sm
                ${index === highlightedIndex ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}
                transition-colors
              `}
            >
              {getOptionLabel(option)}
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {isOpen && query.length > 0 && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-3 text-sm text-gray-400">
          No se encontraron resultados
        </div>
      )}
    </div>
  )
}