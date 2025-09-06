import argparse
import pandas as pd
import sys
import os

def log_message(message, log_file):
    """Append a message to the log file and print it"""
    with open(log_file, 'a') as f:
        f.write(message + "\n")
    print(message)

def run_code(data_path, code, log_file):
    try:
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Dataset not found: {data_path}")

        # Load dataset into df
        df = pd.read_csv(data_path)

        # Prepare safe execution environment
        local_vars = {"df": df, "pd": pd}

        # Execute user code
        exec(code, {}, local_vars)

        log_message("[SUCCESS] Code executed successfully.", log_file)

    except Exception as e:
        error_msg = f"[ERROR] {str(e)}"
        log_message(error_msg, log_file)
        print(error_msg, file=sys.stderr)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Python REPL Agent for running user code on datasets")

    parser.add_argument('--data_path', required=True, help='Path to dataset (CSV)')
    parser.add_argument('--code', required=True, help='Python code to execute')
    parser.add_argument('--log_file', required=True, help='Path to log file')

    args = parser.parse_args()
    run_code(args.data_path, args.code, args.log_file)
