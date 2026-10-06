import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '0',
  className = 'form-control',
  required = false,
  disabled = false,
  readOnly = false,
  style = {},
  inputStyle = {},
  allowDecimals = true,
  ...props
}) => {
  const numericValue = value === '' || value === null || value === undefined ? '' : Number(value);

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || readOnly) return;
    const current = numericValue === '' ? 0 : Number(numericValue);
    const stepVal = Number(step) || 1;
    let newVal = current - stepVal;
    if (min !== undefined && min !== null && min !== '' && newVal < Number(min)) {
      newVal = Number(min);
    }
    const stepStr = step.toString();
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : (allowDecimals ? 2 : 0);
    newVal = Number(newVal.toFixed(decimals));
    onChange(newVal);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || readOnly) return;
    const current = numericValue === '' ? 0 : Number(numericValue);
    const stepVal = Number(step) || 1;
    let newVal = current + stepVal;
    if (max !== undefined && max !== null && max !== '' && newVal > Number(max)) {
      newVal = Number(max);
    }
    const stepStr = step.toString();
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : (allowDecimals ? 2 : 0);
    newVal = Number(newVal.toFixed(decimals));
    onChange(newVal);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      const parsed = Number(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleWheel = (e) => {
    if (e.target) {
      e.target.blur();
    }
  };

  const isAtMin = min !== undefined && min !== null && min !== '' && numericValue !== '' && Number(numericValue) <= Number(min);
  const isAtMax = max !== undefined && max !== null && max !== '' && numericValue !== '' && Number(numericValue) >= Number(max);

  return (
    <div className="number-input-wrapper" style={style}>
      <button
        type="button"
        className="number-input-btn decrement"
        onClick={handleDecrement}
        disabled={disabled || readOnly || isAtMin}
        tabIndex="-1"
        aria-label="Decrement value"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        className={`number-input-field ${className}`}
        required={required}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleInputChange}
        onWheel={handleWheel}
        onFocus={e => e.target.select()}
        disabled={disabled}
        readOnly={readOnly}
        style={inputStyle}
        {...props}
      />
      <button
        type="button"
        className="number-input-btn increment"
        onClick={handleIncrement}
        disabled={disabled || readOnly || isAtMax}
        tabIndex="-1"
        aria-label="Increment value"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
