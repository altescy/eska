import React from "react";

export const useClipboard = () => {
  const [isCopied, setIsCopied] = React.useState(false);
  const isSupported = !!navigator.clipboard;

  const copyToClipboard = React.useCallback(
    async (text: string) => {
      if (!isSupported) return;
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    },
    [isSupported],
  );

  return { isSupported, isCopied, copyToClipboard };
};
