import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <Card className="rounded-[1.75rem] border-danger/70 bg-danger/80">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-danger/12 p-2 text-danger">
            <AlertTriangle className="size-4" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-danger/80">{message}</p>
      </CardContent>
    </Card>
  );
}
