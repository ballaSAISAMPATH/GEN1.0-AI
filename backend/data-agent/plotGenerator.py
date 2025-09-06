import sys
import json
import matplotlib.pyplot as plt
import pandas as pd
import os
import logging

# Configure basic logging to a file and the console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("plot_generator.log"),
        logging.StreamHandler(sys.stderr)
    ]
)

def create_bar_chart(df, columns, filename, title):
    logging.info(f"Creating bar chart with columns: {columns}")
    
    # Check if columns exist
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in the DataFrame.")
        return None

    if len(columns) == 1:
        counts = df[columns[0]].value_counts()
        counts.plot(kind='bar', figsize=(10, 6), color='skyblue')
        plt.xlabel(columns[0])
        plt.ylabel('Count')
    elif len(columns) == 2:
        # Convert the numerical column to a numeric data type
        df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce').fillna(0)
        
        # Now, groupby and sum will work correctly
        df.groupby(columns[0])[columns[1]].sum().plot(kind='bar', figsize=(10, 6), color='skyblue')
        
        plt.xlabel(columns[0])
        plt.ylabel(f'Sum of {columns[1]}')
    
    plt.title(title)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Bar chart saved to {filename}")
    return filename

def create_pie_chart(df, columns, filename, title):
    logging.info(f"Creating pie chart for column: {columns[0]}")
    if not columns or columns[0] not in df.columns:
        logging.error("Column not found in the DataFrame.")
        return None

    counts = df[columns[0]].value_counts()
    plt.figure(figsize=(8, 8))
    plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=140)
    plt.title(title)
    plt.axis('equal')
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Pie chart saved to {filename}")
    return filename

def create_line_chart(df, columns, filename, title):
    logging.info(f"Creating line chart with columns: {columns}")
    if len(columns) < 2: return None
    # Check if columns exist
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in the DataFrame.")
        return None

    # Convert the y-axis column to numeric
    df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce').fillna(0)
    df.plot(x=columns[0], y=columns[1], kind='line', figsize=(10, 6), marker='o')
    
    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[1])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Line chart saved to {filename}")
    return filename

def create_scatter_plot(df, columns, filename, title):
    logging.info(f"Creating scatter plot with columns: {columns}")
    if len(columns) < 2: return None
    # Check if columns exist
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in the DataFrame.")
        return None

    # Convert both columns to numeric
    df[columns[0]] = pd.to_numeric(df[columns[0]], errors='coerce')
    df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce')
    df.plot(x=columns[0], y=columns[1], kind='scatter', figsize=(10, 6))
    
    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[1])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Scatter plot saved to {filename}")
    return filename

if __name__ == "__main__":
    logging.info("Python script started.")
    if len(sys.argv) < 5:
        logging.error("Insufficient arguments provided.")
        print("Usage: python plotGenerator.py <output_filename> <chart_type> <columns> <title>", file=sys.stderr)
        sys.exit(1)

    output_filename = sys.argv[1]
    chart_type = sys.argv[2]
    columns = sys.argv[3].split(',')
    title = sys.argv[4]

    # Dynamically create the output directory if it doesn't exist
    output_dir = os.path.dirname(output_filename)
    if output_dir and not os.path.exists(output_dir):
        logging.info(f"Creating output directory: {output_dir}")
        os.makedirs(output_dir, exist_ok=True)
    
    try:
        logging.info("Attempting to load data from stdin.")
        data = json.load(sys.stdin)
        df = pd.DataFrame(data)
        logging.info("Data loaded successfully.")
        
        plot_file = None

        if chart_type == 'bar':
            plot_file = create_bar_chart(df, columns, output_filename, title)
        elif chart_type == 'pie':
            plot_file = create_pie_chart(df, columns, output_filename, title)
        elif chart_type == 'line':
            plot_file = create_line_chart(df, columns, output_filename, title)
        elif chart_type == 'scatter':
            plot_file = create_scatter_plot(df, columns, output_filename, title)
        
        if plot_file:
            print(plot_file)
            logging.info("Plotting function executed successfully.")
            sys.exit(0)
        else:
            logging.error("Failed to create the requested plot.")
            print("Could not create the requested plot.", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        logging.critical(f"An unexpected error occurred: {e}", exc_info=True)
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)
