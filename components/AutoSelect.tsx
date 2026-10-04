"use client";

import type { SelectHTMLAttributes } from "react";

export function AutoSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}