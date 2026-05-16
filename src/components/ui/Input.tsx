import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
};

export function Input({ error, helper, label, ...props }: InputProps) {
  return (
    <label className="input-wrap">
      {label ? <span>{label}</span> : null}
      <input {...props} />
      {helper ? <small>{helper}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}
