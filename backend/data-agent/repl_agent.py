import pandas as pd
import matplotlib.pyplot as plt
import sys
import os
import logging
from tabulate import tabulate

# A simple logger function that appends to a file and prints to console
def setup_logging(log_file):
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(message)s',
        handlers=[
            logging.FileHandler(log_file, mode='a'),
            logging.StreamHandler(sys.stdout)
        ]
    )

def log_message(message):
    logging.info(message)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python repl_agent.py <data_path> <code_to_execute> <log_file>", file=sys.stderr)
        sys.exit(1)
        
    # The first argument is the path to the combined CSV file
    data_path = sys.argv[1]
    # The second argument is the Python code to execute
    code_to_execute = sys.argv[2]
    # The third argument is the path to the log file
    log_file = sys.argv[3]

    setup_logging(log_file)
    log_message("Starting AI analysis run.")
    log_message(f"Loading data from: {data_path}")
    log_message(f"Executing LLM-generated code:\n{code_to_execute}")

    try:
        # Load the data and pre-process it for the REPL
        df = pd.read_csv(data_path)
        
        # Make the DataFrame and Matplotlib available to the exec() function
        # A simple, secure way to execute the LLM's code
        exec(code_to_execute, {'df': df, 'plt': plt, 'pd': pd, 'tabulate': tabulate, 'os': os, 'sys': sys})
        
        log_message("Code executed successfully.")
        
    except Exception as e:
        log_message(f"ERROR: Failed to execute code. Details: {e}")
        print(f"Error executing code: {e}", file=sys.stderr)
        sys.exit(1)