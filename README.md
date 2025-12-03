# Invoice Creator

A Raycast extension to quickly generate professional PDF invoices.

## Features

- **Quick Invoice Generation** - Create invoices directly from Raycast
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

Before using the extension, configure your details in Raycast preferences:

**Open Preferences:** `Cmd + Shift + ,` or right-click the command → "Configure Extension"

### Required Settings

| Setting | Description |
|---------|-------------|
| **Your Name** | Your full name for invoices |
| **Country** | Your country |
| **City** | Your city |
| **Address** | Your street address |
| **Email** | Your email address |
| **Phone** | Your phone number |
| **Bank Name** | Your bank's name |
| **Bank Address** | Your bank's address |
| **Beneficiary Name** | Name on the bank account |
| **Beneficiary Address** | Address associated with the bank account |
| **IBAN** | Your IBAN number |
| **SWIFT/BIC** | Your bank's SWIFT/BIC code |

### Optional Settings

| Setting | Description |
|---------|-------------|
| **EVM Address** | Ethereum/EVM wallet address for crypto payments |
| **Default Client Name** | Pre-fill client name |
| **Default Client Address** | Pre-fill client address (3 lines) |
| **Default Service Description** | Pre-fill service description |
| **Default Price** | Pre-fill default price |

## Usage

1. Open Raycast and search for "Create Invoice"
2. Fill in the invoice details:
   - **Invoice Number** - Auto-increments from last invoice
   - **Date** - Invoice date (defaults to today)
   - **Client Info** - Name and address (or select a saved template)
   - **Service Description** - What you're billing for
   - **Period Start/End** - Billing period dates
   - **Price** - Amount to charge
3. Press `Enter` to generate the invoice
4. PDF is saved to your Downloads folder and opens automatically

### Actions

| Action | Description |
|--------|-------------|
| **Generate Invoice** | Create and save the PDF invoice |
| **Save as Template** | Save current client info as a reusable template |
| **Delete Template** | Remove a saved client template |

## Invoice Output

The generated PDF includes:
- Invoice number and date
- Your contact information (from preferences)
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