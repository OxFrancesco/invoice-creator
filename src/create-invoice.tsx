import { Action, ActionPanel, Form, showHUD, open, Icon, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { generateInvoicePdf } from "./invoice-template";
import {
  getTemplates,
  getLastInvoiceNumber,
  saveLastInvoiceNumber,
  getSenderProfiles,
} from "./template-storage";
import type { InvoiceData, ClientTemplate, SenderInfo, BankDetails, SenderProfile } from "./types";

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
  const [isLoading, setIsLoading] = useState(true);
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [templates, setTemplates] = useState<ClientTemplate[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [sender, setSender] = useState<SenderInfo | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [evmAddress, setEvmAddress] = useState<string>("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress1, setClientAddress1] = useState("");
  const [clientAddress2, setClientAddress2] = useState("");
  const [clientAddress3, setClientAddress3] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [price, setPrice] = useState("");

  const today = new Date();
  const { start: defaultPeriodStart, end: defaultPeriodEnd } = getMonthStartEnd();
  const [invoiceDate, setInvoiceDate] = useState<Date>(today);
  const [periodStart, setPeriodStart] = useState<Date>(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState<Date>(defaultPeriodEnd);

  useEffect(() => {
    async function init() {
      const [profiles, clientTemplates, lastNum] = await Promise.all([
        getSenderProfiles(),
        getTemplates(),
        getLastInvoiceNumber(),
      ]);

      setSenderProfiles(profiles);
      setTemplates(clientTemplates);

      if (lastNum !== null) {
        setInvoiceNumber(String(lastNum + 1));
      }

      // Auto-select first profile if available
      if (profiles.length > 0) {
        const firstProfile = profiles[0];
        setSelectedProfileId(firstProfile.id);
        setSender(firstProfile.sender);
        setBankDetails(firstProfile.bankDetails);
        setEvmAddress(firstProfile.evmAddress || "");
      }

      // Auto-select first template if available
      if (clientTemplates.length > 0) {
        const firstTemplate = clientTemplates[0];
        setSelectedTemplateId(firstTemplate.id);
        setClientName(firstTemplate.client.name);
        setClientAddress1(firstTemplate.client.addressLine1);
        setClientAddress2(firstTemplate.client.addressLine2);
        setClientAddress3(firstTemplate.client.addressLine3 || "");
        setServiceDescription(firstTemplate.service.description);
        setPrice(firstTemplate.service.price);
      }

      setIsLoading(false);
    }
    init();
  }, []);

  function loadSenderProfile(profileId: string) {
    setSelectedProfileId(profileId);
    const profile = senderProfiles.find((p) => p.id === profileId);
    if (profile) {
      setSender(profile.sender);
      setBankDetails(profile.bankDetails);
      setEvmAddress(profile.evmAddress || "");
    }
  }

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (templateId === "manual") {
      setClientName("");
      setClientAddress1("");
      setClientAddress2("");
      setClientAddress3("");
      setServiceDescription("");
      setPrice("");
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

  async function handleSubmit() {
    if (!sender || !bankDetails) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No sender profile selected",
        message: "Create a sender profile first using 'Manage Sender Profiles'",
      });
      return;
    }

    if (!clientName) {
      await showToast({ style: Toast.Style.Failure, title: "Client name is required" });
      return;
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceNumber,
      date: formatDate(invoiceDate),
      sender: sender,
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
      bankDetails: bankDetails,
      evmAddress: evmAddress || undefined,
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

  if (isLoading) {
    return <Form isLoading={true} />;
  }

  if (senderProfiles.length === 0) {
    return (
      <Form>
        <Form.Description
          title="No Sender Profiles"
          text="You need to create a sender profile first. Use the 'Manage Sender Profiles' command to create one."
        />
      </Form>
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Invoice" onSubmit={handleSubmit} icon={Icon.Document} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="senderProfileSelector"
        title="Sender Profile"
        value={selectedProfileId}
        onChange={loadSenderProfile}
      >
        {senderProfiles.map((p) => (
          <Form.Dropdown.Item key={p.id} value={p.id} title={p.name} icon={Icon.PersonCircle} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="templateSelector"
        title="Client"
        value={selectedTemplateId}
        onChange={loadTemplate}
      >
        {templates.map((t) => (
          <Form.Dropdown.Item key={t.id} value={t.id} title={t.name} icon={Icon.Building} />
        ))}
        <Form.Dropdown.Item value="manual" title="Enter Manually..." icon={Icon.Pencil} />
      </Form.Dropdown>

      <Form.Separator />

      <Form.TextField
        id="invoiceNumber"
        title="Invoice Number"
        placeholder="1"
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
        title="Address Line 1"
        placeholder="Street Address"
        value={clientAddress1}
        onChange={setClientAddress1}
      />
      <Form.TextField
        id="clientAddress2"
        title="Address Line 2"
        placeholder="City, Country"
        value={clientAddress2}
        onChange={setClientAddress2}
      />
      <Form.TextField
        id="clientAddress3"
        title="Address Line 3"
        placeholder="Additional info (optional)"
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
