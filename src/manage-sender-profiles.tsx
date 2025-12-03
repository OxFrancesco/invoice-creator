import { Action, ActionPanel, List, Form, Icon, useNavigation, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getSenderProfiles,
  saveSenderProfile,
  deleteSenderProfile,
  generateProfileId,
} from "./template-storage";
import type { SenderProfile } from "./types";

function ProfileForm({ profile, onSave }: { profile?: SenderProfile; onSave: () => void }) {
  const { pop } = useNavigation();
  const isEditing = !!profile;

  const [name, setName] = useState(profile?.sender.name || "");
  const [country, setCountry] = useState(profile?.sender.country || "");
  const [city, setCity] = useState(profile?.sender.city || "");
  const [address, setAddress] = useState(profile?.sender.address || "");
  const [email, setEmail] = useState(profile?.sender.email || "");
  const [phone, setPhone] = useState(profile?.sender.phone || "");
  const [bankName, setBankName] = useState(profile?.bankDetails.bankName || "");
  const [bankAddress, setBankAddress] = useState(profile?.bankDetails.bankAddress || "");
  const [beneficiaryName, setBeneficiaryName] = useState(profile?.bankDetails.beneficiaryName || "");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState(profile?.bankDetails.beneficiaryAddress || "");
  const [iban, setIban] = useState(profile?.bankDetails.iban || "");
  const [swiftBic, setSwiftBic] = useState(profile?.bankDetails.swiftBic || "");
  const [evmAddr, setEvmAddr] = useState(profile?.evmAddress || "");

  async function handleSubmit() {
    if (!name) {
      await showToast({ style: Toast.Style.Failure, title: "Name is required" });
      return;
    }

    const newProfile: SenderProfile = {
      id: profile?.id || generateProfileId(),
      name: name,
      sender: { name, country, city, address, email, phone },
      bankDetails: {
        bankName,
        bankAddress,
        beneficiaryName: beneficiaryName || name,
        beneficiaryAddress: beneficiaryAddress || `${city}, ${country}`,
        iban,
        swiftBic,
      },
      evmAddress: evmAddr || undefined,
    };

    await saveSenderProfile(newProfile);
    await showToast({
      style: Toast.Style.Success,
      title: isEditing ? "Profile updated" : "Profile created",
      message: name,
    });
    onSave();
    pop();
  }

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

      <Form.TextField id="name" title="Your Name *" placeholder="John Doe" value={name} onChange={setName} />
      <Form.TextField id="email" title="Email" placeholder="john@example.com" value={email} onChange={setEmail} />
      <Form.TextField id="phone" title="Phone" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} />
      <Form.TextField id="address" title="Address" placeholder="123 Main Street" value={address} onChange={setAddress} />
      <Form.TextField id="city" title="City" placeholder="New York" value={city} onChange={setCity} />
      <Form.TextField id="country" title="Country" placeholder="United States" value={country} onChange={setCountry} />

      <Form.Separator />
      <Form.Description title="Bank Details" text="For wire transfer payments" />

      <Form.TextField id="bankName" title="Bank Name" placeholder="Bank of America" value={bankName} onChange={setBankName} />
      <Form.TextField id="bankAddress" title="Bank Address" placeholder="100 Bank St, NY" value={bankAddress} onChange={setBankAddress} />
      <Form.TextField id="iban" title="IBAN" placeholder="US12345678901234567890" value={iban} onChange={setIban} />
      <Form.TextField id="swiftBic" title="SWIFT/BIC" placeholder="BOFAUS3N" value={swiftBic} onChange={setSwiftBic} />
      <Form.TextField id="beneficiaryName" title="Beneficiary Name" placeholder="Same as your name if empty" value={beneficiaryName} onChange={setBeneficiaryName} />
      <Form.TextField id="beneficiaryAddress" title="Beneficiary Address" placeholder="Your full address" value={beneficiaryAddress} onChange={setBeneficiaryAddress} />

      <Form.Separator />
      <Form.Description title="Crypto (Optional)" text="For cryptocurrency payments" />

      <Form.TextField id="evmAddress" title="EVM Wallet Address" placeholder="0x..." value={evmAddr} onChange={setEvmAddr} />
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
