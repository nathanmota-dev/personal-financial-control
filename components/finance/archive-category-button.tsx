"use client";
import {
archiveCategoryAction
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function ArchiveCategoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Arquivar"
      title="Arquivar"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await archiveCategoryAction(id);
            toast.success("Categoria arquivada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      <Archive className="size-4" />
    </Button>
  );
}
