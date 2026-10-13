"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BagActivity = {
  /* Checkout is creating the order and Stripe session. */
  checkingOut: boolean;
  setCheckingOut: (value: boolean) => void;
  /* Some line's quantity change or removal is in flight. */
  editing: boolean;
  trackEdit: () => () => void;
};

const BagActivityContext = createContext<BagActivity>({
  checkingOut: false,
  setCheckingOut: () => {},
  editing: false,
  trackEdit: () => () => {},
});

/*
 * Lets the bag lines and the checkout form see each other's pending state:
 * lines lock while checkout starts (so the order matches what's on screen),
 * and checkout waits while a line change is still being saved.
 */
export function BagActivityProvider({ children }: { children: ReactNode }) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [edits, setEdits] = useState(0);
  const trackEdit = useCallback(() => {
    setEdits((n) => n + 1);
    return () => setEdits((n) => n - 1);
  }, []);
  const value = useMemo(
    () => ({ checkingOut, setCheckingOut, editing: edits > 0, trackEdit }),
    [checkingOut, edits, trackEdit],
  );
  return <BagActivityContext value={value}>{children}</BagActivityContext>;
}

export const useBagActivity = () => useContext(BagActivityContext);

/* Reports a component's pending state to the bag while it's true. */
export function useTrackPending(pending: boolean) {
  const { trackEdit } = useBagActivity();
  useEffect(() => (pending ? trackEdit() : undefined), [pending, trackEdit]);
}
