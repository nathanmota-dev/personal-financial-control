"use client";

import { ArchiveCategoryButton } from "@/components/finance/archive-category-button";
import { DeleteCategoryButton } from "@/components/finance/delete-category-button";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
categoryGroupLabels
} from "@/lib/finance-ui";
import type { SettingsViewTabsContent2Props } from "@/lib/interfaces/render/settings-view-settings-view-tabs-content2";
import { Pencil } from "lucide-react";

export function SettingsViewTabsContent2({ categoriesByGroup }: SettingsViewTabsContent2Props) {
  return (
<TabsContent value="categories">
          <div className="grid gap-6">
            {Object.entries(categoriesByGroup).map(([group, rows]) => (
              <Card key={group} className="rounded-[20px] border-border bg-card">
                <CardHeader>
                  <CardTitle>{categoryGroupLabels[group as keyof typeof categoryGroupLabels]}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {rows.map((category) => (
                    <div key={category.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-content-strong">{category.name}</p>
                          <p className="text-sm text-content">
                            {categoryGroupLabels[category.group]}
                          </p>
                        </div>
                        {category.isArchived ? <Badge variant="outline">Arquivada</Badge> : null}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <CategorySetupDialog
                          category={category}
                          trigger={
                            <Button variant="outline" className="flex-1">
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                          }
                        />
                        {!category.isArchived ? <ArchiveCategoryButton id={category.id} /> : null}
                        <DeleteCategoryButton id={category.id} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            {!Object.keys(categoriesByGroup).length ? (
              <FinanceEmptyState
                title="Nenhuma categoria cadastrada"
                description="Crie categorias de receita, despesa e aporte para usar em todas as outras telas."
                action={<CategorySetupDialog />}
              />
            ) : null}
          </div>
        </TabsContent>
  );
}
