import seaborn as sns
import sys
import json
import matplotlib.pyplot as plt
import pandas as pd
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("plot_generator.log"),
        logging.StreamHandler(sys.stderr)
    ]
)
def create_histogram(df, columns, filename, title):
    logging.info(f"Creating histogram for column: {columns[0]}")
    if not columns or columns[0] not in df.columns:
        logging.error("Column not found in DataFrame.")
        return None

    df[columns[0]] = pd.to_numeric(df[columns[0]], errors='coerce').dropna()
    plt.figure(figsize=(10, 6))
    plt.hist(df[columns[0]], bins=20, color='skyblue', edgecolor='black')
    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel("Frequency")
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Histogram saved to {filename}")
    return filename
def create_box_plot(df, columns, filename, title):
    logging.info(f"Creating box plot for columns: {columns}")
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns] = df[columns].apply(pd.to_numeric, errors='coerce')
    plt.figure(figsize=(10, 6))
    df[columns].plot(kind='box')
    plt.title(title)
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Box plot saved to {filename}")
    return filename

def create_heatmap(df, filename, title):
    logging.info("Creating heatmap for correlation matrix.")
    numeric_df = df.apply(pd.to_numeric, errors='coerce').dropna(axis=1, how='all')
    corr = numeric_df.corr()

    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Heatmap saved to {filename}")
    return filename
def create_area_chart(df, columns, filename, title):
    logging.info(f"Creating area chart with columns: {columns}")
    if len(columns) < 2: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce').fillna(0)
    df.plot(x=columns[0], y=columns[1], kind='area', figsize=(10, 6), alpha=0.5)

    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[1])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Area chart saved to {filename}")
    return filename

def create_bar_chart(df, columns, filename, title):
    logging.info(f"Creating bar chart with columns: {columns}")
    
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in the DataFrame.")
        return None

    if len(columns) == 1:
        counts = df[columns[0]].value_counts()
        counts.plot(kind='bar', figsize=(10, 6), color='skyblue')
        plt.xlabel(columns[0])
        plt.ylabel('Count')
    elif len(columns) == 2:
        df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce').fillna(0)
        
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

    df[columns[1]] = pd.to_numeric(df[columns[1]], errors='coerce').fillna(0)
    df.plot(x=columns[0], y=columns[1], kind='line', figsize=(10, 6), marker='o')
    
    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[1])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Line chart saved to {filename}")
    return filename
def create_stacked_bar(df, columns, filename, title):
    logging.info(f"Creating stacked bar chart with columns: {columns}")
    if len(columns) < 3: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    pivot_df = df.pivot_table(index=columns[0], columns=columns[1], values=columns[2], aggfunc="sum", fill_value=0)
    pivot_df.plot(kind="bar", stacked=True, figsize=(10, 6))

    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[2])
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Stacked bar chart saved to {filename}")
    return filename
def create_donut_chart(df, columns, filename, title):
    logging.info(f"Creating donut chart for column: {columns[0]}")
    if not columns or columns[0] not in df.columns:
        logging.error("Column not found in DataFrame.")
        return None

    counts = df[columns[0]].value_counts()
    plt.figure(figsize=(8, 8))
    wedges, texts, autotexts = plt.pie(counts, labels=counts.index, autopct="%1.1f%%", startangle=140)
    # Add circle to make it donut
    centre_circle = plt.Circle((0, 0), 0.70, fc="white")
    fig = plt.gcf()
    fig.gca().add_artist(centre_circle)

    plt.title(title)
    plt.axis("equal")
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Donut chart saved to {filename}")
    return filename

def create_bubble_chart(df, columns, filename, title):
    logging.info(f"Creating bubble chart with columns: {columns}")
    if len(columns) < 3: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns] = df[columns].apply(pd.to_numeric, errors="coerce").fillna(0)
    plt.figure(figsize=(10, 6))
    plt.scatter(df[columns[0]], df[columns[1]], s=df[columns[2]]*10, alpha=0.5, c="skyblue", edgecolors="black")

    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel(columns[1])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Bubble chart saved to {filename}")
    return filename

import numpy as np

def create_radar_chart(df, columns, filename, title):
    logging.info(f"Creating radar chart with columns: {columns}")
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df_numeric = df[columns].apply(pd.to_numeric, errors="coerce").dropna()
    values = df_numeric.mean().tolist()
    num_vars = len(columns)

    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    values += values[:1]
    angles += angles[:1]

    plt.figure(figsize=(8, 8))
    ax = plt.subplot(111, polar=True)
    ax.plot(angles, values, "o-", linewidth=2)
    ax.fill(angles, values, alpha=0.25)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(columns)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Radar chart saved to {filename}")
    return filename

def create_multi_line(df, columns, filename, title):
    logging.info(f"Creating multi-line chart with columns: {columns}")
    if len(columns) < 3: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns[1:]] = df[columns[1:]].apply(pd.to_numeric, errors="coerce").fillna(0)
    df.plot(x=columns[0], y=columns[1:], kind="line", figsize=(10, 6), marker="o")

    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel("Values")
    plt.legend(title="Series")
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Multi-line chart saved to {filename}")
    return filename
def create_stacked_area(df, columns, filename, title):
    logging.info(f"Creating stacked area chart with columns: {columns}")
    if len(columns) < 3: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns[1:]] = df[columns[1:]].apply(pd.to_numeric, errors="coerce").fillna(0)
    df.plot(x=columns[0], y=columns[1:], kind="area", stacked=True, alpha=0.6, figsize=(10, 6))

    plt.title(title)
    plt.xlabel(columns[0])
    plt.ylabel("Values")
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Stacked area chart saved to {filename}")
    return filename
def create_horizontal_bar(df, columns, filename, title):
    logging.info(f"Creating horizontal bar chart with columns: {columns}")
    if len(columns) < 2: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in DataFrame.")
        return None

    df[columns[1]] = pd.to_numeric(df[columns[1]], errors="coerce").fillna(0)
    df.groupby(columns[0])[columns[1]].sum().plot(kind="barh", figsize=(10, 6), color="skyblue")

    plt.title(title)
    plt.xlabel(columns[1])
    plt.ylabel(columns[0])
    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Horizontal bar chart saved to {filename}")
    return filename


def create_scatter_plot(df, columns, filename, title):
    logging.info(f"Creating scatter plot with columns: {columns}")
    if len(columns) < 2: return None
    if not all(col in df.columns for col in columns):
        logging.error("One or more columns not found in the DataFrame.")
        return None

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
        elif chart_type == 'histogram':
            plot_file = create_histogram(df, columns, output_filename, title)
        elif chart_type == 'box':
         plot_file = create_box_plot(df, columns, output_filename, title)
        elif chart_type == 'heatmap':
            plot_file = create_heatmap(df, output_filename, title)
        elif chart_type == 'area':
            plot_file = create_area_chart(df, columns, output_filename, title)
        elif chart_type == "stacked_bar":
            plot_file = create_stacked_bar(df, columns, output_filename, title)
        elif chart_type == "donut":
            plot_file = create_donut_chart(df, columns, output_filename, title)
        elif chart_type == "bubble":
            plot_file = create_bubble_chart(df, columns, output_filename, title)
        elif chart_type == "radar":
            plot_file = create_radar_chart(df, columns, output_filename, title)
        elif chart_type == "multi_line":
            plot_file = create_multi_line(df, columns, output_filename, title)
        elif chart_type == "stacked_area":
            plot_file = create_stacked_area(df, columns, output_filename, title)
        elif chart_type == "hbar":
            plot_file = create_horizontal_bar(df, columns, output_filename, title)

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
