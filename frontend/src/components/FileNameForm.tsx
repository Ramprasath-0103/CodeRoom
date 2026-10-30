import { useState, type FormEvent, type KeyboardEvent } from "react";

interface FileNameFormProps {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => string | null;
  onCancel: () => void;
}

export default function FileNameForm({
  initialName = "",
  submitLabel,
  onSubmit,
  onCancel,
}: FileNameFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = onSubmit(name);

    if (validationError) {
      setError(validationError);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <form className="file-name-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        aria-label={submitLabel}
        placeholder="file-name.js"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
      />
      {error && <p className="file-name-error">{error}</p>}
    </form>
  );
}
