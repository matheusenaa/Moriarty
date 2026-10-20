"use client";

/**
 * Formulário com confirmação nativa antes de enviar a server action.
 * Uso: <ConfirmForm action={deleteMaterialAction} fields={{ id: m.id }}>excluir</ConfirmForm>
 */
export function ConfirmForm({
  action,
  fields,
  children,
  message = "Tem certeza? Esta ação não pode ser desfeita.",
  className,
  disabled,
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  fields: Record<string, string>;
  children: React.ReactNode;
  message?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={async (formData) => {
        if (!window.confirm(message)) return;
        await action(formData);
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className} disabled={disabled}>
        {children}
      </button>
    </form>
  );
}
