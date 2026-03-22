"use client";

import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
  inputClassName?: string;
};

export default function SearchInput({
  wrapperClassName = "",
  inputClassName = "",
  className,
  ...props
}: SearchInputProps) {
  const resolvedInputClassName = inputClassName || className || "";

  return (
    <div className={`app-search-field ${wrapperClassName}`.trim()}>
      <Search
        aria-hidden="true"
        size={17}
        strokeWidth={2}
        className="app-search-icon"
      />
      <input
        type="search"
        className={`app-search-input app-form-control ${resolvedInputClassName}`.trim()}
        {...props}
      />
    </div>
  );
}
