import React from 'react';
import { useFormContext } from 'react-hook-form';

// Shared base styles for inputs
const inputBaseStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  background: 'var(--bg-input, var(--bg-surface))',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

// Shared style for labels
const labelBaseStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 4,
};

// Component to display form field errors
export function FieldError({ name }) {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#E05555', marginTop: 3 }}>{error.message}</p>;
}

// Reusable FormField for text, number, date, etc.
export function FormField({ label, name, type = 'text', required, min, max, step, placeholder, ...rest }) {
  const { register } = useFormContext();
  return (
    <div>
      <label style={labelBaseStyle}>
        {label} {required && <span style={{ color: '#E05555' }}>*</span>}
      </label>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        {...register(name)}
        style={inputBaseStyle}
        {...rest}
      />
      <FieldError name={name} />
    </div>
  );
}

// Reusable SelectField
export function SelectField({ label, name, options, required, ...rest }) {
  const { register } = useFormContext();
  return (
    <div>
      <label style={labelBaseStyle}>
        {label} {required && <span style={{ color: '#E05555' }}>*</span>}
      </label>
      <select {...register(name)} style={inputBaseStyle} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} />
    </div>
  );
}

// Reusable CheckboxField
export function CheckboxField({ label, name, ...rest }) {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <input type="checkbox" id={name} {...register(name)} style={{ transform: 'scale(1.1)' }} {...rest} />
      <label htmlFor={name} style={{ ...labelBaseStyle, marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>
        {label}
      </label>
    </div>
  );
}

// Reusable RadioGroupField
export function RadioGroupField({ label, name, options, required, ...rest }) {
  const { register } = useFormContext();
  return (
    <div>
      <label style={labelBaseStyle}>
        {label} {required && <span style={{ color: '#E05555' }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {options.map((option) => (
          <div key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="radio"
              id={`${name}-${option.value}`}
              value={option.value}
              {...register(name)}
              {...rest}
            />
            <label htmlFor={`${name}-${option.value}`} style={{ ...labelBaseStyle, marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
      <FieldError name={name} />
    </div>
  );
}

// Reusable TextField (textarea)
export function TextField({ label, name, required, rows = 3, placeholder, ...rest }) {
  const { register } = useFormContext();
  return (
    <div>
      <label style={labelBaseStyle}>
        {label} {required && <span style={{ color: '#E05555' }}>*</span>}
      </label>
      <textarea
        rows={rows}
        placeholder={placeholder}
        {...register(name)}
        style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit' }}
        {...rest}
      />
      <FieldError name={name} />
    </div>
  );
}
