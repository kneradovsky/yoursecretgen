import { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
}

function CopyButton({ text, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      className="secondary copy-button"
      onClick={handleCopy}
      disabled={disabled || !text}
      type="button"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default CopyButton;
