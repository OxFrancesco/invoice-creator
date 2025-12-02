import { LocalStorage } from "@raycast/api";
import type { ClientTemplate } from "./types";

const TEMPLATES_KEY = "client-templates";
const LAST_INVOICE_NUMBER_KEY = "last-invoice-number";

export async function getLastInvoiceNumber(): Promise<number | null> {
  const data = await LocalStorage.getItem<string>(LAST_INVOICE_NUMBER_KEY);
  if (!data) return null;
  const num = parseInt(data, 10);
  return isNaN(num) ? null : num;
}

export async function saveLastInvoiceNumber(num: number): Promise<void> {
  await LocalStorage.setItem(LAST_INVOICE_NUMBER_KEY, String(num));
}

export async function getTemplates(): Promise<ClientTemplate[]> {
  const data = await LocalStorage.getItem<string>(TEMPLATES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveTemplate(template: ClientTemplate): Promise<void> {
  const templates = await getTemplates();
  const existingIndex = templates.findIndex((t) => t.id === template.id);
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  await LocalStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  await LocalStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
}

export function generateTemplateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
