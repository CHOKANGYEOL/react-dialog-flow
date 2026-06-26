import {
  createElement,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DialogEntry, RequestClose } from "../core/types";
import {
  DialogDispatchContext,
  DialogEntryDispatchContext,
  DialogStateContext,
} from "./context";
import type { DialogEntryRequestClose } from "./DialogEntryControl";
import { DialogEntryControlContext } from "./DialogEntryControl";
import { DialogInstanceContext } from "./DialogInstance";

function DialogEntryRenderer({ entry }: { entry: DialogEntry }) {
  const api = useContext(DialogDispatchContext);
  const entryDispatch = useContext(DialogEntryDispatchContext);
  const [registeredRequestClose, setRegisteredRequestClose] =
    useState<DialogEntryRequestClose | null>(null);
  if (!api)
    throw new Error("DialogRenderer must be used inside DialogProvider.");
  if (!entryDispatch)
    throw new Error("DialogRenderer must be used inside DialogProvider.");

  const closeEntry = useCallback<RequestClose>(
    (reason = "programmatic") => {
      entryDispatch.finalizeClose(entry.id, reason);
    },
    [entry.id, entryDispatch],
  );

  const requestEntryClose = useCallback<DialogEntryRequestClose>(
    (reason = "programmatic", options) => {
      if (registeredRequestClose) {
        registeredRequestClose(reason, options);
        return;
      }
      closeEntry(reason);
    },
    [closeEntry, registeredRequestClose],
  );
  const requestClose = useCallback<RequestClose>(
    (reason = "programmatic") => {
      requestEntryClose(reason);
    },
    [requestEntryClose],
  );

  const entryControl = useMemo(
    () => ({
      closeEntry,
      setRequestClose(next: DialogEntryRequestClose | null) {
        setRegisteredRequestClose(() => next);
      },
    }),
    [closeEntry],
  );
  const complete = useCallback(
    (value: unknown) => {
      entryDispatch.setResult(entry.id, value);
      requestEntryClose("programmatic", { skipShouldClose: true });
    },
    [entry.id, entryDispatch, requestEntryClose],
  );
  const instance = useMemo(
    () => ({ id: entry.id, close: requestClose, complete }),
    [complete, entry.id, requestClose],
  );

  useEffect(() => {
    entryDispatch.registerCloseRequest(entry.id, requestClose);
    return () => entryDispatch.registerCloseRequest(entry.id, null);
  }, [entry.id, entryDispatch, requestClose]);

  return (
    <DialogInstanceContext.Provider value={instance}>
      <DialogEntryControlContext.Provider value={entryControl}>
        {createElement(entry.Component, entry.props ?? {})}
      </DialogEntryControlContext.Provider>
    </DialogInstanceContext.Provider>
  );
}

/** Renders the current stack. Use this manually when `withPortal={false}`. */
export function DialogRenderer() {
  const stack = useContext(DialogStateContext);
  if (!stack)
    throw new Error("DialogRenderer must be used inside DialogProvider.");

  return stack.map((entry) => (
    <Fragment key={entry.id}>
      <DialogEntryRenderer entry={entry} />
    </Fragment>
  ));
}
