import { createPortal } from "react-dom";
import type React from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  closeDialog,
  dialogsReducer,
  entriesToClose,
  openDialog,
} from "../core/createDialogStore";
import type { OpenDialogAction } from "../core/createDialogStore";
import type {
  CloseDialog,
  CloseReason,
  DialogResult,
  DialogProviderProps,
  DialogOpenProps,
  DialogAsyncOpenProps,
  OpenAsyncDialog,
  OpenAsyncResultDialog,
  OpenDialog,
  RequestClose,
} from "../core/types";
import { DialogRenderer } from "./DialogRenderer";
import {
  DialogDispatchContext,
  DialogEntryDispatchContext,
  DialogStateContext,
} from "./context";
import { usePortalContainer } from "./usePortalContainer";

export function DialogProvider({
  children,
  withPortal = true,
  containerSelector,
  portalId,
  className,
  zIndex,
  closeOnEscape = true,
}: DialogProviderProps) {
  const [stack, dispatch] = useReducer(dialogsReducer, []);
  const stackRef = useRef(stack);
  const closeRequestHandlersRef = useRef(new Map<string, RequestClose>());
  const resultResolversRef = useRef(
    new Map<string, (result: DialogResult) => void>(),
  );
  const resultValuesRef = useRef(new Map<string, unknown>());

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const finalizeClose = useCallback((id: string, reason: CloseReason) => {
    const entry = stackRef.current.find((candidate) => candidate.id === id);
    if (!entry) return;

    entry.closeCallback?.(reason);
    const resolve = resultResolversRef.current.get(id);
    if (resolve) {
      if (resultValuesRef.current.has(id)) {
        resolve({
          status: "completed",
          value: resultValuesRef.current.get(id),
        });
      } else {
        resolve({ status: "dismissed", reason });
      }
      resultResolversRef.current.delete(id);
    }
    resultValuesRef.current.delete(id);
    dispatch(
      closeDialog({ reason, matcher: (candidate) => candidate.id === id }),
    );
  }, []);

  const registerCloseRequest = useCallback(
    (id: string, requestClose: RequestClose | null) => {
      if (requestClose) closeRequestHandlersRef.current.set(id, requestClose);
      else closeRequestHandlersRef.current.delete(id);
    },
    [],
  );

  const setResult = useCallback((id: string, value: unknown) => {
    resultValuesRef.current.set(id, value);
  }, []);

  const close: CloseDialog = useCallback(
    (options) => {
      const reason = options?.reason ?? "programmatic";
      entriesToClose(stackRef.current, options).forEach((entry) => {
        const requestClose = closeRequestHandlersRef.current.get(entry.id);
        if (requestClose) requestClose(reason);
        else finalizeClose(entry.id, reason);
      });
    },
    [finalizeClose],
  );

  const finalizeReplacedSingleInstance = useCallback(
    (action: OpenDialogAction) => {
      if (!action.payload.isSingleInstance) return;
      const existing = stackRef.current.find(
        (entry) => entry.instanceKey === action.payload.instanceKey,
      );
      if (existing) finalizeClose(existing.id, "programmatic");
    },
    [finalizeClose],
  );

  const open: OpenDialog = useCallback(
    (Component, props) => {
      const action = openDialog(Component, props);
      finalizeReplacedSingleInstance(action);
      dispatch(action);
      return action.payload.id;
    },
    [finalizeReplacedSingleInstance],
  );

  const openAsyncResult = useCallback(
    <T = void, C extends React.ElementType = React.ElementType>(
      Component: C,
      props?: DialogOpenProps<C>,
    ) =>
      new Promise<DialogResult<T>>((resolve) => {
        const action = openDialog(Component, props);
        finalizeReplacedSingleInstance(action);
        resultResolversRef.current.set(
          action.payload.id,
          resolve as (result: DialogResult) => void,
        );
        dispatch(action);
      }),
    [finalizeReplacedSingleInstance],
  ) as OpenAsyncResultDialog;

  const openAsync = useCallback(
    <T = void, C extends React.ElementType = React.ElementType>(
      Component: C,
      propsAndOptions?: DialogAsyncOpenProps<C, T>,
    ) => {
      const { onDismiss, ...props } = propsAndOptions ?? {};
      return openAsyncResult<T, C>(Component, props as DialogOpenProps<C>).then(
        (result) =>
          result.status === "completed"
            ? result.value
            : (onDismiss?.(result.reason) ?? false),
      );
    },
    [openAsyncResult],
  ) as OpenAsyncDialog;

  const closeTop = useCallback(
    (reason: CloseReason = "programmatic") => close({ reason }),
    [close],
  );
  const closeAll = useCallback(
    (reason: CloseReason = "programmatic") => close({ isAll: true, reason }),
    [close],
  );
  const api = useMemo(
    () => ({ open, openAsync, openAsyncResult, close, closeTop, closeAll }),
    [open, openAsync, openAsyncResult, close, closeTop, closeAll],
  );
  const entryDispatch = useMemo(
    () => ({ finalizeClose, registerCloseRequest, setResult }),
    [finalizeClose, registerCloseRequest, setResult],
  );

  useEffect(() => {
    if (!closeOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && stackRef.current.length > 0) {
        close({ reason: "esc" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, closeOnEscape]);

  useEffect(
    () => () => {
      resultResolversRef.current.forEach((resolve) =>
        resolve({ status: "dismissed", reason: "programmatic" }),
      );
      resultResolversRef.current.clear();
      resultValuesRef.current.clear();
    },
    [],
  );

  const container = usePortalContainer({
    containerSelector,
    portalId,
    className,
    zIndex,
  });

  return (
    <DialogStateContext.Provider value={stack}>
      <DialogDispatchContext.Provider value={api}>
        <DialogEntryDispatchContext.Provider value={entryDispatch}>
          {children}
          {withPortal && container
            ? createPortal(<DialogRenderer />, container)
            : null}
        </DialogEntryDispatchContext.Provider>
      </DialogDispatchContext.Provider>
    </DialogStateContext.Provider>
  );
}
