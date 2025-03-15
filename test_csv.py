#!/usr/bin/env python3
import os
import sys

def create_test_csv(filename):
    """Create a test CSV file with the expected format."""
    with open(filename, 'w') as f:
        f.write('Date;Text;Amount;Balance;Status;Reconciled\n')
        f.write('31.12.2023;Test Payment;-100,00;1.000,00;Executed;N\n')
    
    print(f"Created test CSV file: {filename}")
    return os.path.abspath(filename)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    else:
        filename = "Lourenco-test-123.csv"
    
    create_test_csv(filename) 