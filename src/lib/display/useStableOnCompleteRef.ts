import { MutableRefObject, useRef } from "react";

/**
 * `ScreenRotator` passes `onComplete` as an inline function, so it changes every parent render.
 * Automatic screens that invoke `onComplete` from `useEffect` should **not** list it in the
 * dependency array (infinite re-runs); call `onCompleteRef.current()` instead and keep only
 * data deps. Same pattern as `AlertScreen`’s `onCompleteRef`.
 */
export function useStableOnCompleteRef(onComplete: () => void): MutableRefObject<() => void> {
  const ref = useRef(onComplete);
  ref.current = onComplete;
  return ref;
}
