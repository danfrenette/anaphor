import type { ComponentProps } from "react";

/** Static brand mark: preserves the approved 4.5-unit optical offset. */
export function AnaphorMark(props: ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-88 -88 176 176" width="32" height="32" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <circle cx="0" cy="0" r="77.6" fill="none" stroke="currentColor" strokeWidth="12" />
      <g transform="translate(0 4.5) scale(0.92)">
        <path d="M0 -5A34.641 34.641 0 0 1 0 -65A34.641 34.641 0 0 1 0 -5Z" />
        <path transform="rotate(120)" d="M0 -5A34.641 34.641 0 0 1 0 -65A34.641 34.641 0 0 1 0 -5Z" />
        <path transform="rotate(240)" d="M0 -5A34.641 34.641 0 0 1 0 -65A34.641 34.641 0 0 1 0 -5Z" />
      </g>
    </svg>
  );
}
