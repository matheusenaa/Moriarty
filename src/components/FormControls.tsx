import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ htmlFor, children, className }: { htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1 block text-sm font-medium text-pergaminho/90", className)}>
      {children}
    </label>
  );
}

const fieldBase =
  "w-full rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm text-pergaminho placeholder:text-cinza-escuro focus:border-latao/60 focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-cinza">{hint}</p> : null}
    </div>
  );
}
