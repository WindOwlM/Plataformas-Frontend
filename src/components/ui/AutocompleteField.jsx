import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { X } from 'lucide-react'
import { fieldClass } from './fieldStyles'

export function labelNombre(opt) {
  return opt.nombre || ''
}

export function labelPlataforma(opt) {
  return opt.nombre_plat || ''
}

export function labelProveedor(opt) {
  return opt.nombre_prov || ''
}

export function labelCliente(opt) {
  return opt.numero_telefono ? `${opt.nombre} · ${opt.numero_telefono}` : opt.nombre || ''
}

export function optionId(opt) {
  return opt.id
}

export function labelCorreo(opt) {
  return opt.correo || ''
}

export function optionCorreo(opt) {
  return opt.correo || ''
}

function defaultGetOptionLabel(opt) {
  return opt.nombre || opt.nombre_plat || opt.nombre_prov || ''
}

function AutocompleteField({
  id,
  label,
  placeholder,
  value,
  onChange,
  options = [],
  getOptionLabel = defaultGetOptionLabel,
  getOptionValue = optionId,
  required = false,
  icon,
  onQueryChange,
  filterLocal = true,
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const selectedOption = useMemo(
    () => options.find((opt) => getOptionValue(opt) === value),
    [options, getOptionValue, value]
  )

  const filteredOptions = useMemo(() => {
    if (!filterLocal || !query) return options
    const q = query.toLowerCase()
    return options.filter((opt) => getOptionLabel(opt).toLowerCase().includes(q))
  }, [options, query, getOptionLabel, filterLocal])

  useEffect(() => {
    onQueryChange?.(query)
  }, [query, onQueryChange])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((option) => {
    onChange(getOptionValue(option))
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onChange, getOptionValue])

  function handleInputChange(e) {
    setQuery(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(0)
    if (value) onChange('')
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
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
          className={`${fieldClass} ${icon ? 'pl-10' : ''} pr-10`}
        />

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
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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

      {isOpen && query.length > 0 && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-3 text-sm text-gray-400">
          No se encontraron resultados
        </div>
      )}
    </div>
  )
}

export default memo(AutocompleteField)
