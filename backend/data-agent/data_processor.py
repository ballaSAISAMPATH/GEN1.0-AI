import pandas as pd
import sys
import os
import argparse
import logging
import numpy as np

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
    
def clean_data(input_path, output_path, year, log_file):
    """
    Cleans and standardizes a single CSV file, handling missing values and duplicates.
    """
    setup_logging(log_file)
    log_message(f"Starting data cleaning for: {os.path.basename(input_path)}")

    try:
        df = pd.read_csv(input_path)
    except FileNotFoundError:
        log_message(f"ERROR: The file at {input_path} was not found.")
        sys.exit(1)
    
    initial_rows = len(df)
    log_message(f"Initial dataset shape: {df.shape}")

    # Drop any unnamed columns
    unnamed_cols = [col for col in df.columns if 'Unnamed' in col]
    if unnamed_cols:
        df.drop(columns=unnamed_cols, inplace=True)
        log_message(f"Dropped {len(unnamed_cols)} 'Unnamed' column(s).")

    # --- Standardization ---
    column_mapping = {
        'unit_name': 'unit_name', 'ie_or_not': 'ie_or_not', 'industry_category': 'industry_category',
        'district_name': 'district', 'mandal_name': 'mandal', 'employment': 'employment',
        'line_of_activity': 'line_of_activity', 'investment': 'investment',
        'presentstatus': 'present_status', 'typeofindustry': 'industry_type',
        'export': 'export', 'typeofconnection': 'connection_type',
        # Handles other file variants
        'district': 'district', 'mandal': 'mandal', 'type_of_industry': 'industry_type',
        'industry_name': 'industry_type',
    }
    df.rename(columns=column_mapping, inplace=True)
    log_message("Standardized column names.")

    # Normalize district names
    district_mapping = {
        'Warangal - Rural': 'Warangal Rural',
        'Warangal - Rura Duggondi': 'Warangal Rural',
        'Warangal - Rura Geesugonda': 'Warangal Rural',
        'Rangareddy': 'Ranga Reddy',
    }
    df['district'] = df['district'].replace(district_mapping)

    # Remove duplicates
    before = len(df)
    df.drop_duplicates(inplace=True)
    after = len(df)
    if before > after:
        log_message(f"Removed {before - after} duplicate row(s).")

    # Convert investment to numeric
    df['investment'] = pd.to_numeric(df['investment'].replace({r'[^\d.]': ''}, regex=True), errors='coerce')
    missing_investment = df['investment'].isnull().sum()
    if missing_investment > 0:
        median_val = df['investment'].median()
        df['investment'].fillna(median_val, inplace=True)
        log_message(f"Filled {missing_investment} missing 'investment' values with median {median_val}.")

    # Fill missing employment with mean
    if 'employment' in df.columns:
        missing_emp = df['employment'].isnull().sum()
        if missing_emp > 0:
            mean_val = df['employment'].mean()
            df['employment'].fillna(mean_val, inplace=True)
            log_message(f"Filled {missing_emp} missing 'employment' values with mean {mean_val:.2f}.")

    # Fill missing categorical with "Unknown"
    for col in ['district', 'mandal', 'industry_type']:
        if col in df.columns:
            missing = df[col].isnull().sum()
            if missing > 0:
                df[col].fillna('Unknown', inplace=True)
                log_message(f"Filled {missing} missing '{col}' values with 'Unknown'.")

    # Add year column
    df['year'] = year

    log_message(f"Final dataset shape: {df.shape}")
    df.to_csv(output_path, index=False)
    log_message(f"Saved cleaned dataset to {output_path}")

def combine_data(input_paths, output_path, log_file):
    """
    Combines multiple cleaned CSVs into a single master file.
    """
    setup_logging(log_file)
    log_message("Starting data combination process.")
    
    all_dfs = []
    for path in input_paths:
        if os.path.exists(path):
            all_dfs.append(pd.read_csv(path))
            log_message(f"Loaded cleaned file: {os.path.basename(path)}")
        else:
            log_message(f"WARNING: File not found at {path}. Skipping.")

    if not all_dfs:
        log_message("ERROR: No cleaned data files found. Exiting.")
        sys.exit(1)

    combined_df = pd.concat(all_dfs, ignore_index=True)
    combined_df.to_csv(output_path, index=False)
    log_message(f"Successfully combined {len(all_dfs)} file(s).")
    log_message(f"Combined data saved to {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Data Processing Agent for Telangana Open Data.")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # clean subcommand
    clean_parser = subparsers.add_parser('clean', help='Clean and standardize a single dataset.')
    clean_parser.add_argument('--input_path', required=True)
    clean_parser.add_argument('--output_path', required=True)
    clean_parser.add_argument('--year', required=True)
    clean_parser.add_argument('--log_file', required=True)

    # combine subcommand
    combine_parser = subparsers.add_parser('combine', help='Combine multiple datasets.')
    combine_parser.add_argument('--output_path', required=True)
    combine_parser.add_argument('--log_file', required=True)
    combine_parser.add_argument('--input_paths', nargs='+', required=True)

    args = parser.parse_args()
    if args.command == 'clean':
        clean_data(args.input_path, args.output_path, args.year, args.log_file)
    elif args.command == 'combine':
        combine_data(args.input_paths, args.output_path, args.log_file)
    else:
        parser.print_help()
