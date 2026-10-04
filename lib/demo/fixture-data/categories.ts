import type { DemoFixture } from "@/lib/demo/contracts";
import { categoryIds } from "./support";

export const categories: DemoFixture["categories"] = [
    { id: categoryIds.salary, name: "Salário", group: "income" },
    { id: categoryIds.rent, name: "Moradia", group: "fixed_expense" },
    { id: categoryIds.utilities, name: "Contas da casa", group: "fixed_expense" },
    { id: categoryIds.food, name: "Alimentação", group: "variable_expense" },
    { id: categoryIds.groceries, name: "Mercado", group: "variable_expense" },
    { id: categoryIds.restaurants, name: "Restaurantes", group: "variable_expense" },
    { id: categoryIds.transport, name: "Transporte", group: "variable_expense" },
    { id: categoryIds.health, name: "Saúde", group: "fixed_expense" },
    { id: categoryIds.leisure, name: "Lazer", group: "variable_expense" },
    { id: categoryIds.education, name: "Educação", group: "variable_expense" },
    { id: categoryIds.investments, name: "Investimentos", group: "investment" },
    { id: categoryIds.other, name: "Outros", group: "variable_expense" },
  ];
