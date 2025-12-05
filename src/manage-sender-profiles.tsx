import { Action, ActionPanel, List, Form, Icon, useNavigation, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { useForm, FormValidation } from "@raycast/utils";
import {
  getSenderProfiles,
  saveSenderProfile,
  deleteSenderProfile,
  generateProfileId,
} from "./template-storage";
import type { SenderProfile } from "./types";

interface ProfileFormValues {
  name: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  bankAddress: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  iban: string;
  swiftBic: string;
  evmAddress: string;
}

function ProfileForm({ profile, onSave }: { profile?: SenderProfile; onSave: () => void }) {
  const { pop } = useNavigation();
  const isEditing = !!profile;

  const { handleSubmit, itemProps } = useForm<ProfileFormValues>({
    async onSubmit(formValues) {
      const newProfile: SenderProfile = {
        id: profile?.id || generateProfileId(),
        name: formValues.name,
        sender: {
          name: formValues.name,
          country: formValues.country,
          city: formValues.city,
          address: formValues.address,
          email: formValues.email,
          phone: formValues.phone,
        },
        bankDetails: {
          bankName: formValues.bankName,
          bankAddress: formValues.bankAddress,
          beneficiaryName: formValues.beneficiaryName || formValues.name,
          beneficiaryAddress: formValues.beneficiaryAddress || `${formValues.city}, ${formValues.country}`,
          iban: formValues.iban,
          swiftBic: formValues.swiftBic,
        },
        evmAddress: formValues.evmAddress || undefined,
      };

      await saveSenderProfile(newProfile);
      await showToast({
        style: Toast.Style.Success,
        title: isEditing ? "Profile updated" : "Profile created",
        message: formValues.name,
      });
      onSave();
      pop();
    },
    initialValues: {
      name: profile?.sender.name || "",
      country: profile?.sender.country || "",
      city: profile?.sender.city || "",
      address: profile?.sender.address || "",
      email: profile?.sender.email || "",
      phone: profile?.sender.phone || "",
      bankName: profile?.bankDetails.bankName || "",
      bankAddress: profile?.bankDetails.bankAddress || "",
      beneficiaryName: profile?.bankDetails.beneficiaryName || "",
      beneficiaryAddress: profile?.bankDetails.beneficiaryAddress || "",
      iban: profile?.bankDetails.iban || "",
      swiftBic: profile?.bankDetails.swiftBic || "",
      evmAddress: profile?.evmAddress || "",
    },
    validation: {
      name: FormValidation.Required,
    },
  });

  return (
    <Form
      navigationTitle={isEditing ? `Edit ${profile.name}` : "New Sender Profile"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditing ? "Update Profile" : "Create Profile"}
            onSubmit={handleSubmit}
            icon={Icon.CheckCircle}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Your Details" text="This information appears on your invoices" />

      <Form.TextField title="Your Name *" placeholder="John Doe" {...itemProps.name} />
      <Form.TextField title="Email" placeholder="john@example.com" {...itemProps.email} />
      <Form.TextField title="Phone" placeholder="+1 234 567 8900" {...itemProps.phone} />
      <Form.TextField title="Address" placeholder="123 Main Street" {...itemProps.address} />
      <Form.TextField title="City" placeholder="New York" {...itemProps.city} />
      <Form.TextField title="Country" placeholder="United States" {...itemProps.country} />

      <Form.Separator />
      <Form.Description title="Bank Details" text="For wire transfer payments" />

      <Form.TextField title="Bank Name" placeholder="Bank of America" {...itemProps.bankName} />
      <Form.TextField title="Bank Address" placeholder="100 Bank St, NY" {...itemProps.bankAddress} />
      <Form.TextField title="IBAN" placeholder="US12345678901234567890" {...itemProps.iban} />
      <Form.TextField title="SWIFT/BIC" placeholder="BOFAUS3N" {...itemProps.swiftBic} />
      <Form.TextField title="Beneficiary Name" placeholder="Same as your name if empty" {...itemProps.beneficiaryName} />
      <Form.TextField title="Beneficiary Address" placeholder="Your full address" {...itemProps.beneficiaryAddress} />

      <Form.Separator />
      <Form.Description title="Crypto (Optional)" text="For cryptocurrency payments" />

      <Form.TextField title="EVM Wallet Address" placeholder="0x..." {...itemProps.evmAddress} />
    </Form>
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [profiles, setProfiles] = useState<SenderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfiles() {
    const data = await getSenderProfiles();
    setProfiles(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleDelete(profile: SenderProfile) {
    if (
      await confirmAlert({
        title: "Delete Profile",
        message: `Are you sure you want to delete "${profile.name}"?`,
        primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await deleteSenderProfile(profile.id);
      await showToast({ style: Toast.Style.Success, title: "Profile deleted" });
      loadProfiles();
    }
  }

  return (
    <List isLoading={isLoading}>
      <List.EmptyView
        title="No Sender Profiles"
        description="Create your first profile to start invoicing"
        icon={Icon.Person}
        actions={
          <ActionPanel>
            <Action.Push
              title="Create Profile"
              icon={Icon.Plus}
              target={<ProfileForm onSave={loadProfiles} />}
            />
          </ActionPanel>
        }
      />
      {profiles.map((profile) => (
        <List.Item
          key={profile.id}
          title={profile.name}
          subtitle={profile.sender.email}
          accessories={[
            { text: profile.bankDetails.iban ? `IBAN: ...${profile.bankDetails.iban.slice(-4)}` : "No IBAN" },
          ]}
          icon={Icon.PersonCircle}
          actions={
            <ActionPanel>
              <Action.Push
                title="Edit Profile"
                icon={Icon.Pencil}
                target={<ProfileForm profile={profile} onSave={loadProfiles} />}
              />
              <Action.Push
                title="Create New Profile"
                icon={Icon.Plus}
                target={<ProfileForm onSave={loadProfiles} />}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
              <Action
                title="Delete Profile"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={() => handleDelete(profile)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
