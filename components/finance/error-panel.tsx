import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <Card className="rounded-[1.75rem] border-rose-200/70 bg-rose-50/80">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-rose-500/12 p-2 text-rose-700">
            <AlertTriangle className="size-4" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-rose-900/80">{message}</p>
      </CardContent>
    </Card>
  );
}
