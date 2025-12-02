import type { SenderInfo, BankDetails, ClientInfo } from "./types";

export const DEFAULT_SENDER: SenderInfo = {
  name: "Your Name",
  country: "Country",
  city: "City",
  address: "Your Address",
  email: "your@email.com",
  phone: "+1 234567890",
};

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: "Your Bank Name",
  bankAddress: "Bank Address",
  beneficiaryName: "Your Name",
  beneficiaryAddress: "Your Full Address",
  iban: "YOUR_IBAN",
  swiftBic: "SWIFTBIC",
};

export const DEFAULT_EVM_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEFAULT_CLIENT: ClientInfo = {
  name: "Client Company Name",
  addressLine1: "Client Address Line 1",
  addressLine2: "Client Address Line 2",
  addressLine3: "Client Address Line 3",
};

export const DEFAULT_SERVICE = {
  description: "Service Description",
  price: "$0",
};
