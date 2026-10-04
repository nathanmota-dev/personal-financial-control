"use client";
import {
deleteCategoryAction
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteCategoryAction(id);
            toast.success("Categoria removida.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
