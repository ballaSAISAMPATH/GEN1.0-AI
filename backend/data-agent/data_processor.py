import pandas as pd
import argparse
import os
import sys
import logging

def setup_logging(log_file):
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(message)s',
        handlers=[logging.FileHandler(log_file, mode='a'), logging.StreamHandler(sys.stdout)]
    )

def log(message):
    logging.info(message)

def standardize_dataframe(df):
    df.dropna(axis=1, how='all', inplace=True)
    
    df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
    log(f"Standardized column names: {df.columns.tolist()}")
    return df

def clean_dataframe(df):
    before = len(df)
    df.drop_duplicates(inplace=True)
    log(f"Removed {before - len(df)} duplicate rows")
    
    numeric_cols = ['investment', 'employement']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce')
            missing = df[col].isna().sum()
            if missing > 0:
                median_val = df[col].median()
                df[col].fillna(median_val, inplace=True)
                log(f"Filled {missing} missing values in {col} with median {median_val}")
    
    for col in df.select_dtypes(include='object').columns:
        missing = df[col].isna().sum()
        if missing > 0:
            df[col].fillna('Unknown', inplace=True)
            log(f"Filled {missing} missing values in {col} with 'Unknown'")
    
    return df

def main():
    parser = argparse.ArgumentParser(description="CSV Cleaning & Standardization")
    parser.add_argument('--input_csv', required=True, help="Path to the input CSV file")
    parser.add_argument('--output_dir', default='output', help="Directory to save processed file")
    parser.add_argument('--log_file', default='process_log.txt', help="Path to log file")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    setup_logging(args.log_file)
    log(f"Starting processing for {args.input_csv}")

    try:
        df = pd.read_csv(args.input_csv)
    except FileNotFoundError:
        log(f"ERROR: File {args.input_csv} not found.")
        sys.exit(1)
    except Exception as e:
        log(f"ERROR: Failed to read CSV: {e}")
        sys.exit(1)

    df = standardize_dataframe(df)
    df = clean_dataframe(df)

    final_path = os.path.join(args.output_dir, "cleaned.csv")
    df.to_csv(final_path, index=False)
    log(f"Saved final cleaned CSV: {final_path}")
    log("Processing complete!")

if __name__ == '__main__':
    main()
