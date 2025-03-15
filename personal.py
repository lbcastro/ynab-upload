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

# Get environment variables or use defaults
BUDGET_ID = os.environ.get("YNAB_BUDGET_ID", "fbe718d1-38d7-4f6c-8b84-7a42d2dcb163")
ACCESS_TOKEN = os.environ.get("YNAB_ACCESS_TOKEN", "e009c83231f6ce314e0cf29f8dc6a9e4f9cb774e6d7eba18c18b5c6b3a82f722")
LOURENCO_ACCOUNT_ID = os.environ.get("YNAB_LOURENCO_ACCOUNT_ID", "25fbb6be-2671-428d-9e68-ffca65db77d2")
SHARED_ACCOUNT_ID = os.environ.get("YNAB_SHARED_ACCOUNT_ID", "028b9d22-2dcd-4dce-ac93-2f64045d45c2")
LOUISE_ACCOUNT_ID = os.environ.get("YNAB_LOUISE_ACCOUNT_ID", "eec1ab52-afff-4077-82d8-9a61ddf0e0ca")

# For testing in Docker, disable SSL verification
# WARNING: This is not secure for production use
VERIFY_SSL = os.environ.get("VERIFY_SSL", "true").lower() == "true"

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
            # Disable SSL verification for testing in Docker
            response = requests.post(url, headers=headers, json=data, verify=VERIFY_SSL)
            
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
    print(f"Processing file: {input_file}")
    
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return

    try:
        with codecs.open(input_file, encoding="latin1") as fin:
            header_line = fin.readline().rstrip()
            fields = [s.strip('"') for s in header_line.split(";")]
            if fields != ["Date", "Text", "Amount", "Balance", "Status", "Reconciled"]:
                print(f"Unexpected header fields: {fields}")
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

        # Only delete the file if processing was successful
        os.remove(input_file)
        print(f"Deleted file: {input_file}")
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise

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
    print(f"Input file: {input_file}")
    
    if "Shared" in input_file:
        account_id = SHARED_ACCOUNT_ID
    elif "Louise" in input_file:
        account_id = LOUISE_ACCOUNT_ID
    else:
        account_id = LOURENCO_ACCOUNT_ID
    
    try:
        main(input_file, budget_id=BUDGET_ID, account_id=account_id, access_token=ACCESS_TOKEN)
    except Exception as e:
        print(f"Error in main function: {str(e)}")
        sys.exit(1)