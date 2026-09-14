import { useState, useCallback } from 'react';
import { useI18n } from '../i18n';

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
}

function CopyButton({ text, disabled }: CopyButtonProps) {
  const { t } = useI18n();
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
      {copied ? t('common.copied') : t('common.copy')}
    </button>
  );
}

export default CopyButton;
