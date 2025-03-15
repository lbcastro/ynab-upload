# YNAB Transaction Importer

A modern web application for importing bank transactions into YNAB (You Need A Budget). Supports Danish bank CSV formats with automatic currency conversion.

## Features

- 🎯 Drag-and-drop CSV file upload
- 🔄 Automatic Danish currency format conversion
- 🌙 Dark/light theme support
- 📊 Real-time import status
- 🔁 Automatic retry handling
- �� Responsive design
- 🐳 Docker support for easy deployment

## Setup

### Prerequisites

- Python 3.x
- Node.js 16+
- YNAB account with API access
- Docker and Docker Compose (optional)

### Environment Variables

```env
YNAB_BUDGET_ID=your-budget-id
YNAB_ACCESS_TOKEN=your-access-token
YNAB_LOURENCO_ACCOUNT_ID=account-id
YNAB_SHARED_ACCOUNT_ID=account-id
YNAB_LOUISE_ACCOUNT_ID=account-id
```

## Usage

### Standard Method

1. Install dependencies:
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Upload CSV files through the web interface at `http://localhost:3000`

### Using Docker Compose

1. For development:
```bash
docker compose -f docker-compose.dev.yml up
```

2. For production:
```bash
docker compose up
```

3. Access the web interface at `http://localhost:3000`

## CSV Format

Expected format:
```csv
Date;Text;Amount;Balance;Status;Reconciled
31.12.2023;Payment;1.234,56;10.000,00;Executed;N
```

## Development

```bash
# Run backend tests
python -m pytest

# Run frontend tests
npm test

# Build for production
npm run build
```