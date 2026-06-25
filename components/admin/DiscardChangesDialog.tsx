"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DiscardChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function DiscardChangesDialog({
  open,
  onConfirm,
  onCancel,
  title = "Änderungen verwerfen?",
  description = "Du hast ungespeicherte Änderungen. Wenn du jetzt schließt, gehen sie verloren.",
}: DiscardChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="glass-panel-strong z-[60] max-w-md border-white/10 bg-popover/95 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Weiter bearbeiten
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Verwerfen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
