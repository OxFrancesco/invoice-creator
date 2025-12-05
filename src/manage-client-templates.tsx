import { Action, ActionPanel, List, Form, Icon, useNavigation, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { useForm, FormValidation } from "@raycast/utils";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplateId,
} from "./template-storage";
import type { ClientTemplate } from "./types";

interface TemplateFormValues {
  clientName: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  serviceDescription: string;
  price: string;
}

function TemplateForm({ template, onSave }: { template?: ClientTemplate; onSave: () => void }) {
  const { pop } = useNavigation();
  const isEditing = !!template;

  const { handleSubmit, itemProps } = useForm<TemplateFormValues>({
    async onSubmit(formValues) {
      const newTemplate: ClientTemplate = {
        id: template?.id || generateTemplateId(),
        name: formValues.clientName,
        client: {
          name: formValues.clientName,
          addressLine1: formValues.addressLine1,
          addressLine2: formValues.addressLine2,
          addressLine3: formValues.addressLine3 || undefined,
        },
        service: {
          description: formValues.serviceDescription,
          price: formValues.price,
        },
      };

      await saveTemplate(newTemplate);
      await showToast({
        style: Toast.Style.Success,
        title: isEditing ? "Template updated" : "Template created",
        message: formValues.clientName,
      });
      onSave();
      pop();
    },
    initialValues: {
      clientName: template?.client.name || "",
      addressLine1: template?.client.addressLine1 || "",
      addressLine2: template?.client.addressLine2 || "",
      addressLine3: template?.client.addressLine3 || "",
      serviceDescription: template?.service.description || "",
      price: template?.service.price || "",
    },
    validation: {
      clientName: FormValidation.Required,
    },
  });

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

      <Form.TextField title="Client Name *" placeholder="Acme Corporation" {...itemProps.clientName} />
      <Form.TextField title="Address Line 1" placeholder="123 Business Ave" {...itemProps.addressLine1} />
      <Form.TextField title="Address Line 2" placeholder="Suite 100" {...itemProps.addressLine2} />
      <Form.TextField title="Address Line 3" placeholder="New York, NY 10001" {...itemProps.addressLine3} />

      <Form.Separator />
      <Form.Description title="Default Service (Optional)" text="Pre-fill service details when using this template" />

      <Form.TextField title="Service Description" placeholder="Consulting services" {...itemProps.serviceDescription} />
      <Form.TextField title="Default Price" placeholder="$1000" {...itemProps.price} />
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
