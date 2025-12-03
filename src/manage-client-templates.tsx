import { Action, ActionPanel, List, Form, Icon, useNavigation, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplateId,
} from "./template-storage";
import type { ClientTemplate } from "./types";

function TemplateForm({ template, onSave }: { template?: ClientTemplate; onSave: () => void }) {
  const { pop } = useNavigation();
  const isEditing = !!template;

  const [clientName, setClientName] = useState(template?.client.name || "");
  const [addressLine1, setAddressLine1] = useState(template?.client.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(template?.client.addressLine2 || "");
  const [addressLine3, setAddressLine3] = useState(template?.client.addressLine3 || "");
  const [serviceDescription, setServiceDescription] = useState(template?.service.description || "");
  const [price, setPrice] = useState(template?.service.price || "");

  async function handleSubmit() {
    if (!clientName) {
      await showToast({ style: Toast.Style.Failure, title: "Client name is required" });
      return;
    }

    const newTemplate: ClientTemplate = {
      id: template?.id || generateTemplateId(),
      name: clientName,
      client: {
        name: clientName,
        addressLine1,
        addressLine2,
        addressLine3: addressLine3 || undefined,
      },
      service: {
        description: serviceDescription,
        price,
      },
    };

    await saveTemplate(newTemplate);
    await showToast({
      style: Toast.Style.Success,
      title: isEditing ? "Template updated" : "Template created",
      message: clientName,
    });
    onSave();
    pop();
  }

  return (
    <Form
      navigationTitle={isEditing ? `Edit ${template.name}` : "New Client Template"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditing ? "Update Template" : "Create Template"}
            onSubmit={handleSubmit}
            icon={Icon.CheckCircle}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Client Details" text="This information appears on the invoice" />

      <Form.TextField
        id="clientName"
        title="Client Name *"
        placeholder="Acme Corporation"
        value={clientName}
        onChange={setClientName}
      />
      <Form.TextField
        id="addressLine1"
        title="Address Line 1"
        placeholder="123 Business Ave"
        value={addressLine1}
        onChange={setAddressLine1}
      />
      <Form.TextField
        id="addressLine2"
        title="Address Line 2"
        placeholder="Suite 100"
        value={addressLine2}
        onChange={setAddressLine2}
      />
      <Form.TextField
        id="addressLine3"
        title="Address Line 3"
        placeholder="New York, NY 10001"
        value={addressLine3}
        onChange={setAddressLine3}
      />

      <Form.Separator />
      <Form.Description title="Default Service (Optional)" text="Pre-fill service details when using this template" />

      <Form.TextField
        id="serviceDescription"
        title="Service Description"
        placeholder="Consulting services"
        value={serviceDescription}
        onChange={setServiceDescription}
      />
      <Form.TextField
        id="price"
        title="Default Price"
        placeholder="$1000"
        value={price}
        onChange={setPrice}
      />
    </Form>
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [templates, setTemplates] = useState<ClientTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTemplates() {
    const data = await getTemplates();
    setTemplates(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function handleDelete(template: ClientTemplate) {
    if (
      await confirmAlert({
        title: "Delete Template",
        message: `Are you sure you want to delete "${template.name}"?`,
        primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await deleteTemplate(template.id);
      await showToast({ style: Toast.Style.Success, title: "Template deleted" });
      loadTemplates();
    }
  }

  return (
    <List isLoading={isLoading}>
      <List.EmptyView
        title="No Client Templates"
        description="Create templates for clients you invoice frequently"
        icon={Icon.Person}
        actions={
          <ActionPanel>
            <Action.Push
              title="Create Template"
              icon={Icon.Plus}
              target={<TemplateForm onSave={loadTemplates} />}
            />
          </ActionPanel>
        }
      />
      {templates.map((template) => (
        <List.Item
          key={template.id}
          title={template.name}
          subtitle={template.client.addressLine1}
          accessories={[
            { text: template.service.price || "No default price" },
          ]}
          icon={Icon.Building}
          actions={
            <ActionPanel>
              <Action.Push
                title="Edit Template"
                icon={Icon.Pencil}
                target={<TemplateForm template={template} onSave={loadTemplates} />}
              />
              <Action.Push
                title="Create New Template"
                icon={Icon.Plus}
                target={<TemplateForm onSave={loadTemplates} />}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
              <Action
                title="Delete Template"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={() => handleDelete(template)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
