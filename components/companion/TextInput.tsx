"use client";

import type { FormEvent, RefObject } from "react";

type TextInputProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  working: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function TextInput({
  inputRef,
  value,
  working,
  onChange,
  onSubmit,
}: TextInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative z-30 flex w-full items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur-md sm:w-auto"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="What would you like to do?"
        aria-label="Type a request for Kimi"
        enterKeyHint="send"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-xl px-4 py-3 text-base outline-none focus:ring-4 focus:ring-[#6d513a]/25 sm:w-[380px] sm:flex-none sm:px-5 sm:py-4 sm:text-lg"
      />

      <button
        type="submit"
        disabled={working || !value.trim()}
        aria-label="Send request to Kimi"
        title="Send"
        className="touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6d513a] text-2xl text-white transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">➜</span>
      </button>
    </form>
  );
}