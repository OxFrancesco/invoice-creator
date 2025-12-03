# Invoice Creator

A Raycast extension to quickly generate professional PDF invoices.

## Features

- **Quick Invoice Generation** - Create invoices directly from Raycast
- **Multiple Sender Profiles** - Store different identities (personal, company, freelance) with separate bank details
- **Date Pickers** - Select invoice date and billing period with intuitive date pickers
- **Client Templates** - Save and reuse client information for faster invoicing
- **Auto-increment Invoice Numbers** - Automatically tracks and increments invoice numbers
- **Bank Details** - Include your bank details (IBAN, SWIFT/BIC) for wire transfers
- **Crypto Payments** - Optional EVM wallet address for cryptocurrency payments
- **PDF Export** - Generates clean, professional PDF invoices saved to Downloads

## Installation

1. Install [Raycast](https://raycast.com/)
2. Clone this repository
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the extension in development mode

## Configuration

You can configure your details in two ways:

### Option 1: Sender Profiles (Recommended)

Create multiple sender profiles directly in the extension for different identities:
- **Personal** - Your personal details for freelance work
- **Company** - Your business details with company bank account
- **Other** - Any other identity you invoice from

Each profile stores:
- Sender info (name, address, email, phone)
- Bank details (IBAN, SWIFT/BIC, beneficiary info)
- EVM wallet address (optional)

**To create a profile:** Fill in the form, then press `Cmd+K` → "Save Sender Profile"

### Option 2: Default Profile via Preferences

Set up a default profile in Raycast preferences (used when no custom profile is selected):

**Open Preferences:** `Cmd + Shift + ,` or right-click the command → "Configure Extension"

| Setting | Description |
|---------|-------------|
| **Default Sender Name** | Your name for the default profile |
| **Default Country/City/Address** | Your location details |
| **Default Email/Phone** | Your contact info |
| **Default Bank Details** | Bank name, address, IBAN, SWIFT/BIC |
| **Default EVM Address** | Crypto wallet (optional) |

### Client Defaults (Optional)

| Setting | Description |
|---------|-------------|
| **Default Client Name** | Pre-fill client name |
| **Default Client Address** | Pre-fill client address (3 lines) |
| **Default Service Description** | Pre-fill service description |
| **Default Price** | Pre-fill default price |

## Usage

1. Open Raycast and search for "Create Invoice"
2. Select your **Sender Profile** (your identity and bank details)
3. Select a **Client Template** or enter client details manually
4. Fill in the invoice details:
   - **Invoice Number** - Auto-increments from last invoice
   - **Date** - Invoice date (defaults to today)
   - **Service Description** - What you're billing for
   - **Period Start/End** - Billing period dates
   - **Price** - Amount to charge
5. Press `Enter` to generate the invoice
6. PDF is saved to your Downloads folder and opens automatically

### Actions

| Action | Description |
|--------|-------------|
| **Generate Invoice** | Create and save the PDF invoice |
| **Save Sender Profile** | Save current sender/bank details as a reusable profile |
| **Delete Sender Profile** | Remove a saved sender profile |
| **Save Client Template** | Save current client info as a reusable template |
| **Delete Client Template** | Remove a saved client template |

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