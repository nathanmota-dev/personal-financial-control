"use client";
import {
archiveAccountAction
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function ArchiveAccountButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="flex-1"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await archiveAccountAction(id);
            toast.success("Conta arquivada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      {isPending ? "Arquivando..." : "Arquivar"}
    </Button>
  );
}
