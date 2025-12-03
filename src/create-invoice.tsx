import { Action, ActionPanel, Form, showHUD, open, showToast, Toast, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import {
  generateInvoicePdf,
  DEFAULT_SENDER,
  DEFAULT_BANK_DETAILS,
  DEFAULT_EVM_ADDRESS,
  DEFAULT_CLIENT,
  DEFAULT_SERVICE,
} from "./invoice-template";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplateId,
  getLastInvoiceNumber,
  saveLastInvoiceNumber,
} from "./template-storage";
import type { InvoiceData, ClientTemplate } from "./types";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimePeriod(start: Date, end: Date): string {
  const format = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  return `${format(start)} - ${format(end)}`;
}

function getMonthStartEnd(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

export default function Command() {
  const [templates, setTemplates] = useState<ClientTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [clientName, setClientName] = useState(DEFAULT_CLIENT.name);
  const [clientAddress1, setClientAddress1] = useState(DEFAULT_CLIENT.addressLine1);
  const [clientAddress2, setClientAddress2] = useState(DEFAULT_CLIENT.addressLine2);
  const [clientAddress3, setClientAddress3] = useState(DEFAULT_CLIENT.addressLine3 || "");
  const [serviceDescription, setServiceDescription] = useState(DEFAULT_SERVICE.description);
  const [price, setPrice] = useState(DEFAULT_SERVICE.price);

  const today = new Date();
  const { start: defaultPeriodStart, end: defaultPeriodEnd } = getMonthStartEnd();
  const [invoiceDate, setInvoiceDate] = useState<Date>(today);
  const [periodStart, setPeriodStart] = useState<Date>(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState<Date>(defaultPeriodEnd);

  useEffect(() => {
    getTemplates().then(setTemplates);
    getLastInvoiceNumber().then((lastNum) => {
      if (lastNum !== null) {
        setInvoiceNumber(String(lastNum + 1));
      }
    });
  }, []);

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (templateId === "default") {
      setClientName(DEFAULT_CLIENT.name);
      setClientAddress1(DEFAULT_CLIENT.addressLine1);
      setClientAddress2(DEFAULT_CLIENT.addressLine2);
      setClientAddress3(DEFAULT_CLIENT.addressLine3 || "");
      setServiceDescription(DEFAULT_SERVICE.description);
      setPrice(DEFAULT_SERVICE.price);
    } else {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setClientName(template.client.name);
        setClientAddress1(template.client.addressLine1);
        setClientAddress2(template.client.addressLine2);
        setClientAddress3(template.client.addressLine3 || "");
        setServiceDescription(template.service.description);
        setPrice(template.service.price);
      }
    }
  }

  async function handleSaveTemplate() {
    const templateName = clientName || "Unnamed Template";
    const template: ClientTemplate = {
      id: selectedTemplateId === "default" ? generateTemplateId() : selectedTemplateId,
      name: templateName,
      client: {
        name: clientName,
        addressLine1: clientAddress1,
        addressLine2: clientAddress2,
        addressLine3: clientAddress3 || undefined,
      },
      service: {
        description: serviceDescription,
        price: price,
      },
    };

    await saveTemplate(template);
    const updatedTemplates = await getTemplates();
    setTemplates(updatedTemplates);
    setSelectedTemplateId(template.id);
    await showToast({ style: Toast.Style.Success, title: "Template saved", message: templateName });
  }

  async function handleDeleteTemplate() {
    if (selectedTemplateId === "default") {
      await showToast({ style: Toast.Style.Failure, title: "Cannot delete default template" });
      return;
    }
    await deleteTemplate(selectedTemplateId);
    const updatedTemplates = await getTemplates();
    setTemplates(updatedTemplates);
    loadTemplate("default");
    await showToast({ style: Toast.Style.Success, title: "Template deleted" });
  }

  async function handleSubmit() {
    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceNumber,
      date: formatDate(invoiceDate),
      sender: DEFAULT_SENDER,
      client: {
        name: clientName,
        addressLine1: clientAddress1,
        addressLine2: clientAddress2,
        addressLine3: clientAddress3 || undefined,
      },
      services: [
        {
          description: serviceDescription,
          timePeriod: formatTimePeriod(periodStart, periodEnd),
          price: price,
        },
      ],
      total: price,
      bankDetails: DEFAULT_BANK_DETAILS,
      evmAddress: DEFAULT_EVM_ADDRESS,
    };

    try {
      const pdfBytes = await generateInvoicePdf(invoiceData);
      const fileName = `Invoice-${invoiceNumber}-${clientName.replace(/\s+/g, "-")}.pdf`;
      const filePath = join(homedir(), "Downloads", fileName);

      await writeFile(filePath, pdfBytes);

      const invNum = parseInt(invoiceNumber, 10);
      if (!isNaN(invNum)) {
        await saveLastInvoiceNumber(invNum);
      }

      await showHUD(`Invoice saved to Downloads/${fileName}`);
      await open(filePath);
    } catch (error) {
      await showHUD(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Invoice" onSubmit={handleSubmit} />
          <Action title="Save as Template" icon={Icon.SaveDocument} onAction={handleSaveTemplate} />
          {selectedTemplateId !== "default" && (
            <Action
              title="Delete Template"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={handleDeleteTemplate}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.Dropdown id="templateSelector" title="Client Template" value={selectedTemplateId} onChange={loadTemplate}>
        <Form.Dropdown.Item value="default" title="Default" icon={Icon.Document} />
        {templates.map((t) => (
          <Form.Dropdown.Item key={t.id} value={t.id} title={t.name} icon={Icon.Person} />
        ))}
      </Form.Dropdown>

      <Form.Separator />

      <Form.TextField
        id="invoiceNumber"
        title="Invoice Number"
        placeholder="16"
        value={invoiceNumber}
        onChange={setInvoiceNumber}
      />
      <Form.DatePicker id="date" title="Date" value={invoiceDate} onChange={(date) => date && setInvoiceDate(date)} />

      <Form.Separator />

      <Form.TextField
        id="clientName"
        title="Client Name"
        placeholder="Company Name Ltd"
        value={clientName}
        onChange={setClientName}
      />
      <Form.TextField
        id="clientAddress1"
        title="Client Address Line 1"
        placeholder="Street Address"
        value={clientAddress1}
        onChange={setClientAddress1}
      />
      <Form.TextField
        id="clientAddress2"
        title="Client Address Line 2"
        placeholder="City, Country"
        value={clientAddress2}
        onChange={setClientAddress2}
      />
      <Form.TextField
        id="clientAddress3"
        title="Client Address Line 3"
        placeholder="Additional address info (optional)"
        value={clientAddress3}
        onChange={setClientAddress3}
      />

      <Form.Separator />

      <Form.TextField
        id="serviceDescription"
        title="Service Description"
        placeholder="Consulting services"
        value={serviceDescription}
        onChange={setServiceDescription}
      />
      <Form.DatePicker
        id="periodStart"
        title="Period Start"
        value={periodStart}
        onChange={(date) => date && setPeriodStart(date)}
      />
      <Form.DatePicker
        id="periodEnd"
        title="Period End"
        value={periodEnd}
        onChange={(date) => date && setPeriodEnd(date)}
      />
      <Form.TextField id="price" title="Price" placeholder="$3300" value={price} onChange={setPrice} />
    </Form>
  );
}
