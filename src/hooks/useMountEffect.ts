import React from "react";

export const useMountEffect = (
  fn: (() => void) | (() => () => void) | (() => Promise<void>) | (() => Promise<() => void>),
) => {
  const mounted = React.useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run once on mount
  return React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (typeof fn === "function") {
        const result = fn();
        if (typeof result === "function") {
          return result;
        } else if (result instanceof Promise) {
          result.then((cleanup) => {
            if (typeof cleanup === "function") {
              return cleanup;
            }
          });
        }
      }
    }
  }, []);
};
