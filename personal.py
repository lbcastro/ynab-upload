#!/usr/bin/env python3
import os
import codecs
import re
import glob
from datetime import datetime
import random
import requests
import time
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
BUDGET_ID = os.getenv("YNAB_BUDGET_ID")
ACCESS_TOKEN = os.getenv("YNAB_ACCESS_TOKEN")
LOURENCO_ACCOUNT_ID = os.getenv("YNAB_LOURENCO_ACCOUNT_ID")
SHARED_ACCOUNT_ID = os.getenv("YNAB_SHARED_ACCOUNT_ID")
LOUISE_ACCOUNT_ID = os.getenv("YNAB_LOUISE_ACCOUNT_ID")

# Validate required environment variables
required_vars = [
    "YNAB_BUDGET_ID",
    "YNAB_ACCESS_TOKEN",
    "YNAB_LOURENCO_ACCOUNT_ID",
    "YNAB_SHARED_ACCOUNT_ID",
    "YNAB_LOUISE_ACCOUNT_ID"
]

missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    print("Error: Missing required environment variables:", ", ".join(missing_vars))
    sys.exit(1)

def parse_danish_amount(amount_str):
    """Convert Danish number format (1.234,56) to float."""
    # Remove all dots (thousand separators)
    clean_str = amount_str.replace(".", "")
    # Replace comma with dot for decimal point
    clean_str = clean_str.replace(",", ".")
    return float(clean_str)

class TransactionDK:
    def __init__(
        self, date, payee, category="", memo="", amount_str="0.0", cleared=True, ratio=1
    ):
        self.date = date.replace(",", "/")
        self.payee = re.sub(r" +\)+", "", payee)
        self.payee_raw = payee
        self.category = category
        self.memo = memo
        self.cleared = cleared
        self.flow = parse_danish_amount(amount_str)
        if self.flow < 0.0:
            self.outflow = abs(self.flow)
            self.outflow *= ratio
            self.inflow = 0.0
        else:
            self.outflow = 0.0
            self.inflow = self.flow

def push_to_ynab(transaction, budget_id, account_id, access_token, retry_count=5, initial_delay=2):
    url = f'https://api.ynab.com/v1/budgets/{budget_id}/transactions'

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "accept": "application/json"
    }

    milliunit_amount = int(transaction.flow * 1000)
    occurrence = random.randint(10000, 99999)
    success = False
    attempts = 0

    while not success and attempts < retry_count:
        if attempts > 0:
            # Exponential backoff: 2s, 4s, 8s, 16s, 32s
            delay = initial_delay * (2 ** (attempts - 1))
            print(f"Waiting {delay} seconds before retry {attempts + 1}/{retry_count}...")
            time.sleep(delay)

        import_id = f"YNAB:{milliunit_amount}:{transaction.date}:{occurrence}"

        data = {
            'transaction': {
                "account_id": account_id,
                'date': transaction.date,
                'amount': milliunit_amount,
                'payee_id': None,
                'payee_name': transaction.payee,
                'category_id': None,
                'category_name': transaction.category,
                'memo': transaction.memo,
                'cleared': 'uncleared',
                'approved': False,
                'flag_color': None,
                'import_id': import_id,
                'subtransactions': []
            }
        }

        try:
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 201:
                success = True
                print(f"✓ Added transaction: {transaction.payee} ({transaction.flow:.2f})")
            elif response.status_code == 409:
                print(f"Skip duplicate: {transaction.payee}")
                occurrence += 1
            elif response.status_code == 429:
                print(f"⏳ Rate limit reached. Retrying in {delay}s...")
                if attempts == retry_count - 1:
                    raise Exception("Rate limit exceeded after maximum retries")
            else:
                print(f"Unexpected error: {response.status_code}")
                print("Response content:", response.text)
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            if attempts == retry_count - 1:
                raise

        attempts += 1
        
    if not success:
        raise Exception("Failed to upload transaction after multiple attempts")

def read_transaction(
    line,
    filter=True,
    stats=("Executed",),
    cleared=("Executed",),
    notcleared=("Venter",),
    verbose=0,
    lineno=0,
):
    line = [s.strip('"') for s in line.rstrip().split(";")]
    if filter and line[-2] not in stats:
        return None
    is_cleared = line[5] in cleared
    if not filter and verbose > 0 and not is_cleared and line[-2] not in notcleared:
        print(f'Did not recognize cleared state ("{line[4]}") on line {lineno}.')
    date = datetime.strptime(line[0], "%d.%m.%Y").strftime("%Y-%m-%d")

    transaction = TransactionDK(
        date, line[1], amount_str=line[2], cleared=is_cleared
    )
    return transaction

def main(input_file, budget_id=None, account_id=None, access_token=None):
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return

    with codecs.open(input_file, encoding="latin1") as fin:
        header_line = fin.readline().rstrip()
        fields = [s.strip('"') for s in header_line.split(";")]
        if fields != ["Date", "Text", "Amount", "Balance", "Status", "Reconciled"]:
            print(fields)
            raise ValueError("Downloaded CSV file has incorrect header line.")

        transactions = []
        for line in fin:
            transaction = read_transaction(line)
            if transaction is not None:
                transactions.append(transaction)

        for i, transaction in enumerate(transactions):
            if "1.50% af DKK" in transaction.payee:
                matching_transaction = next(
                    (t for t in transactions[:i] if t.date == transaction.date and f"{t.flow:.2f}" in transaction.payee), None
                )
                if matching_transaction:
                    transaction.payee = matching_transaction.payee
                    transaction.memo = "Foreign transaction fee"

            if not transaction.cleared:
                push_to_ynab(transaction, budget_id, account_id, access_token)
                # Add a small delay between transactions to avoid rate limits
                time.sleep(1)

    os.remove(input_file)
    print(f"Deleted file: {input_file}")

def find_input_files():
    lourenco_files = glob.glob("Lourenco-*-*.csv")
    shared_expenses_files = glob.glob("Sharedexpenses-*-*.csv")
    louise_files = glob.glob("Louise-*-*.csv")
    return lourenco_files + shared_expenses_files + louise_files

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 personal.py <csv_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    if input_file.startswith("Sharedexpenses-"):
        account_id = SHARED_ACCOUNT_ID
    elif input_file.startswith("Louise-"):
        account_id = LOUISE_ACCOUNT_ID
    else:
        account_id = LOURENCO_ACCOUNT_ID
    main(input_file, budget_id=BUDGET_ID, account_id=account_id, access_token=ACCESS_TOKEN)