# Invoice Creator

A Raycast extension to quickly generate professional PDF invoices.

## Features

- **Multiple Sender Profiles** - Store different identities (personal, company, freelance) with separate bank details
- **Client Templates** - Save client information for faster invoicing
- **Date Pickers** - Select invoice date and billing period with intuitive date pickers
- **Auto-increment Invoice Numbers** - Automatically tracks and increments invoice numbers
- **Bank Details** - Include your bank details (IBAN, SWIFT/BIC) for wire transfers
- **Crypto Payments** - Optional EVM wallet address for cryptocurrency payments
- **PDF Export** - Generates clean, professional PDF invoices saved to Downloads

## Commands

The extension provides three separate commands for a clean workflow:

### 1. Manage Sender Profiles

Create and manage your sender profiles (your identities for invoicing):

- **Personal** - Your personal details for freelance work
- **Company** - Your business details with company bank account
- **Other** - Any other identity you invoice from

Each profile stores:
- Your details (name, address, email, phone)
- Bank details (IBAN, SWIFT/BIC, beneficiary info)
- EVM wallet address (optional)

### 2. Manage Client Templates

Create and manage client templates for clients you invoice frequently:

- Client name and address
- Default service description
- Default price

### 3. Create Invoice

Generate invoices using your saved profiles and templates:

1. Select your **Sender Profile**
2. Select a **Client Template** (or enter manually)
3. Fill in invoice details (number, date, service, period, price)
4. Press `Enter` to generate the PDF

## Installation

1. Install [Raycast](https://raycast.com/)
2. Clone this repository
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the extension in development mode

## Getting Started

1. **Create a Sender Profile** - Run "Manage Sender Profiles" and create your first profile with your details and bank information
2. **Create a Client Template** (optional) - Run "Manage Client Templates" to save clients you invoice regularly
3. **Create Invoices** - Run "Create Invoice" to generate PDF invoices

## Invoice Output

The generated PDF includes:
- Invoice number and date
- Your contact information (from selected sender profile)
- Client billing information
- Service details with time period
- Total amount
- Bank transfer details (IBAN, SWIFT/BIC)
- EVM wallet address (if configured)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build extension
npm run build

# Lint code
npm run lint

# Fix lint issues
npm run fix-lint
```

## License

MIT
