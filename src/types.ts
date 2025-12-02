export interface SenderInfo {
  name: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone: string;
}

export interface ClientInfo {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3?: string;
}

export interface ServiceItem {
  description: string;
  timePeriod: string;
  price: string;
}

export interface BankDetails {
  bankName: string;
  bankAddress: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  iban: string;
  swiftBic: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  sender: SenderInfo;
  client: ClientInfo;
  services: ServiceItem[];
  total: string;
  bankDetails: BankDetails;
  evmAddress?: string;
}

export interface ClientTemplate {
  id: string;
  name: string;
  client: ClientInfo;
  service: {
    description: string;
    price: string;
  };
}
