import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = "localblue_beta_banner_dismissed";

export function BetaBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      handleDismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="[&>button.absolute]:hidden"
        data-testid="dialog-beta-banner"
      >
        <DialogHeader className="items-center sm:items-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold w-fit mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Beta Program
          </div>
          <DialogTitle>We're Building Something New</DialogTitle>
          <DialogDescription>
            LocalBlue is currently in active development. We're looking for
            contractors who want to help shape the future of contractor websites.
            As a beta tester, you'll get early access to features and a direct
            line to our team.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Link href="/signup" onClick={handleDismiss}>
            <Button data-testid="button-join-beta">Join the Beta</Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            data-testid="button-dismiss-beta"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
