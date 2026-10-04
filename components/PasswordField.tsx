"use client";

import { useState } from "react";

export function PasswordField({
  name,
  placeholder,
  autoComplete,
  minLength = 8,
}: {
  name: string;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={shown ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-stone-200 px-4 pr-16 outline-none focus:border-ink"
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-stone-500"
      >
        {shown ? "숨김" : "표시"}
      </button>
    </div>
  );
}
