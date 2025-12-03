import { Action, ActionPanel, Form, showHUD, open, showToast, Toast, Icon, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { generateInvoicePdf } from "./invoice-template";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplateId,
  getLastInvoiceNumber,
  saveLastInvoiceNumber,
  getSenderProfiles,
  saveSenderProfile,
  deleteSenderProfile,
  generateProfileId,
} from "./template-storage";
import type { InvoiceData, ClientTemplate, SenderInfo, BankDetails, SenderProfile } from "./types";

interface Preferences {
  senderName: string;
  senderCountry: string;
  senderCity: string;
  senderAddress: string;
  senderEmail: string;
  senderPhone: string;
  bankName: string;
  bankAddress: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  iban: string;
  swiftBic: string;
  evmAddress?: string;
  defaultClientName?: string;
  defaultClientAddress1?: string;
  defaultClientAddress2?: string;
  defaultClientAddress3?: string;
  defaultServiceDescription?: string;
  defaultPrice?: string;
}

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
  const preferences = getPreferenceValues<Preferences>();

  const defaultSender: SenderInfo = {
    name: preferences.senderName || "",
    country: preferences.senderCountry || "",
    city: preferences.senderCity || "",
    address: preferences.senderAddress || "",
    email: preferences.senderEmail || "",
    phone: preferences.senderPhone || "",
  };

  const defaultBankDetails: BankDetails = {
    bankName: preferences.bankName || "",
    bankAddress: preferences.bankAddress || "",
    beneficiaryName: preferences.beneficiaryName || "",
    beneficiaryAddress: preferences.beneficiaryAddress || "",
    iban: preferences.iban || "",
    swiftBic: preferences.swiftBic || "",
  };

  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("default");
  const [sender, setSender] = useState<SenderInfo>(defaultSender);
  const [bankDetails, setBankDetails] = useState<BankDetails>(defaultBankDetails);
  const [evmAddress, setEvmAddress] = useState<string>(preferences.evmAddress || "");

  const [templates, setTemplates] = useState<ClientTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [clientName, setClientName] = useState(preferences.defaultClientName || "");
  const [clientAddress1, setClientAddress1] = useState(preferences.defaultClientAddress1 || "");
  const [clientAddress2, setClientAddress2] = useState(preferences.defaultClientAddress2 || "");
  const [clientAddress3, setClientAddress3] = useState(preferences.defaultClientAddress3 || "");
  const [serviceDescription, setServiceDescription] = useState(preferences.defaultServiceDescription || "");
  const [price, setPrice] = useState(preferences.defaultPrice || "");

  const today = new Date();
  const { start: defaultPeriodStart, end: defaultPeriodEnd } = getMonthStartEnd();
  const [invoiceDate, setInvoiceDate] = useState<Date>(today);
  const [periodStart, setPeriodStart] = useState<Date>(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState<Date>(defaultPeriodEnd);

  useEffect(() => {
    getTemplates().then(setTemplates);
    getSenderProfiles().then(setSenderProfiles);
    getLastInvoiceNumber().then((lastNum) => {
      if (lastNum !== null) {
        setInvoiceNumber(String(lastNum + 1));
      }
    });
  }, []);

  function loadSenderProfile(profileId: string) {
    setSelectedProfileId(profileId);
    if (profileId === "default") {
      setSender(defaultSender);
      setBankDetails(defaultBankDetails);
      setEvmAddress(preferences.evmAddress || "");
    } else {
      const profile = senderProfiles.find((p) => p.id === profileId);
      if (profile) {
        setSender(profile.sender);
        setBankDetails(profile.bankDetails);
        setEvmAddress(profile.evmAddress || "");
      }
    }
  }

  async function handleSaveSenderProfile() {
    const profileName = sender.name || "Unnamed Profile";
    const profile: SenderProfile = {
      id: selectedProfileId === "default" ? generateProfileId() : selectedProfileId,
      name: profileName,
      sender: sender,
      bankDetails: bankDetails,
      evmAddress: evmAddress || undefined,
    };

    await saveSenderProfile(profile);
    const updatedProfiles = await getSenderProfiles();
    setSenderProfiles(updatedProfiles);
    setSelectedProfileId(profile.id);
    await showToast({ style: Toast.Style.Success, title: "Sender profile saved", message: profileName });
  }

  async function handleDeleteSenderProfile() {
    if (selectedProfileId === "default") {
      await showToast({ style: Toast.Style.Failure, title: "Cannot delete default profile" });
      return;
    }
    await deleteSenderProfile(selectedProfileId);
    const updatedProfiles = await getSenderProfiles();
    setSenderProfiles(updatedProfiles);
    loadSenderProfile("default");
    await showToast({ style: Toast.Style.Success, title: "Sender profile deleted" });
  }

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (templateId === "default") {
      setClientName(preferences.defaultClientName || "");
      setClientAddress1(preferences.defaultClientAddress1 || "");
      setClientAddress2(preferences.defaultClientAddress2 || "");
      setClientAddress3(preferences.defaultClientAddress3 || "");
      setServiceDescription(preferences.defaultServiceDescription || "");
      setPrice(preferences.defaultPrice || "");
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

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Invoice" onSubmit={handleSubmit} />
          <ActionPanel.Section title="Sender Profiles">
            <Action title="Save Sender Profile" icon={Icon.SaveDocument} onAction={handleSaveSenderProfile} />
            {selectedProfileId !== "default" && (
              <Action
                title="Delete Sender Profile"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={handleDeleteSenderProfile}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section title="Client Templates">
            <Action title="Save Client Template" icon={Icon.SaveDocument} onAction={handleSaveTemplate} />
            {selectedTemplateId !== "default" && (
              <Action
                title="Delete Client Template"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={handleDeleteTemplate}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="senderProfileSelector"
        title="Sender Profile"
        value={selectedProfileId}
        onChange={loadSenderProfile}
      >
        <Form.Dropdown.Item value="default" title="Default (from Preferences)" icon={Icon.Cog} />
        {senderProfiles.map((p) => (
          <Form.Dropdown.Item key={p.id} value={p.id} title={p.name} icon={Icon.PersonCircle} />
        ))}
      </Form.Dropdown>
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
