import { useState } from 'react';

export default function TokenInput({
  label,
  value,
  onChange,
  token,
  balance,
  placeholder = "0.00",
  disabled = false,
  showMax = true,
  className = '',
}) {
  const [focused, setFocused] = useState(false);

  const handleMaxClick = () => {
    if (balance && onChange) {
      onChange(balance);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          {balance && (
            <span className="text-xs text-gray-500">
              Balance: {parseFloat(balance).toFixed(4)} {token}
            </span>
          )}
        </div>
      )}
      
      <div className={`relative bg-gray-50 rounded-lg border transition-colors ${
        focused ? 'border-blue-500 bg-white' : 'border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex items-center p-4">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent text-xl font-semibold text-gray-900 placeholder-gray-400 border-none outline-none disabled:cursor-not-allowed"
            step="any"
            min="0"
          />
          
          <div className="flex items-center space-x-2">
            {token && (
              <span className="font-medium text-gray-900 text-lg">{token}</span>
            )}
            {showMax && balance && !disabled && (
              <button
                onClick={handleMaxClick}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                MAX
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}