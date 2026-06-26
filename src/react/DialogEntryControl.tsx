import { createContext, useContext } from "react";
import type { CloseReason } from "../core/types";

export type DialogEntryRequestCloseOptions = {
  skipShouldClose?: boolean;
};

export type DialogEntryRequestClose = (
  reason?: CloseReason,
  options?: DialogEntryRequestCloseOptions,
) => void;

export type DialogEntryControl = {
  closeEntry: (reason?: CloseReason) => void;
  setRequestClose: (requestClose: DialogEntryRequestClose | null) => void;
};

export const DialogEntryControlContext =
  createContext<DialogEntryControl | null>(null);

export function useDialogEntryControl() {
  const control = useContext(DialogEntryControlContext);
  if (!control)
    throw new Error(
      "useDialogEntryControl must be used inside DialogRenderer.",
    );
  return control;
}
