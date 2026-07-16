"use client";

import { useState } from "react";

import type {
  DailyProjectionTableProps,
  MobileDayMetricProps,
} from "@/app/interfaces/projected-balance";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { DayDetailSheet } from "@/components/finance/projected-balance-components/day-detail-sheet";
import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import type { DailyProjection } from "@/lib/interfaces/projected-balance";
import { cn } from "@/lib/utils";

export function DailyProjectionTable({ daily }: DailyProjectionTableProps) {
  const [selectedDay, setSelectedDay] = useState<DailyProjection | null>(null);

  function openDay(day: DailyProjection) {
    setSelectedDay(day);
  }

  return (
    <>
      <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
        <CardHeader>
          <CardTitle>Projeção por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Investimentos líquidos</TableHead>
                  <TableHead className="text-right">Cartão</TableHead>
                  <TableHead className="text-right">Saldo projetado</TableHead>
                  <TableHead className="text-right">Disponível/dia</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map((day) => (
                  <TableRow
                    key={day.date}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDay(day)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        openDay(day);
                      }
                    }}
                    className="cursor-pointer border-slate-800 hover:bg-slate-900/80"
                  >
                    <TableCell className="font-medium text-slate-100">
                      {formatDateLabel(day.date)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-300">
                      {formatCurrency(day.incomeCents + day.transferInCents)}
                    </TableCell>
                    <TableCell className="text-right text-rose-300">
                      {formatCurrency(day.expenseCents + day.transferOutCents)}
                    </TableCell>
                    <TableCell className="text-right text-sky-300">
                      {formatCurrency(day.investmentCents)}
                    </TableCell>
                    <TableCell className="text-right text-blue-300">
                      {formatCurrency(day.creditCardCents)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        day.projectedBalanceCents >= 0 ? "text-cyan-300" : "text-rose-300"
                      )}
                    >
                      {formatCurrency(day.projectedBalanceCents)}
                    </TableCell>
                    <TableCell className="text-right text-slate-100">
                      {formatCurrency(day.availablePerDayCents)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={day.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {daily.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => openDay(day)}
                className="rounded-2xl border border-slate-800 p-4 text-left transition hover:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{formatDateLabel(day.date)}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Disponível: {formatCurrency(day.availablePerDayCents)}
                    </p>
                  </div>
                  <StatusBadge status={day.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileDayMetric
                    label="Entradas"
                    value={formatCurrency(day.incomeCents + day.transferInCents)}
                    className="text-emerald-300"
                  />
                  <MobileDayMetric
                    label="Saídas"
                    value={formatCurrency(day.expenseCents + day.transferOutCents)}
                    className="text-rose-300"
                  />
                  <MobileDayMetric
                    label="Cartão"
                    value={formatCurrency(day.creditCardCents)}
                    className="text-blue-300"
                  />
                  <MobileDayMetric
                    label="Saldo"
                    value={formatCurrency(day.projectedBalanceCents)}
                    className={
                      day.projectedBalanceCents >= 0 ? "text-cyan-300" : "text-rose-300"
                    }
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <DayDetailSheet day={selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)} />
    </>
  );
}

function MobileDayMetric({ label, value, className }: MobileDayMetricProps) {
  return (
    <div className={cn(financeItemClassName, "p-3")}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("mt-1 font-semibold", className)}>{value}</p>
    </div>
  );
}
