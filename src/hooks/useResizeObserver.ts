import React from "react";

export interface ResizeObserverSize {
  width: number;
  height: number;
}

export const useResizeObserver = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback?: (size: ResizeObserverSize) => void,
): ResizeObserverSize | undefined => {
  const [size, setSize] = React.useState<ResizeObserverSize>();

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) return;

      const entry = entries[0];
      const newSize = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      setSize(newSize);
      callback?.(newSize);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback]);

  return size;
};
