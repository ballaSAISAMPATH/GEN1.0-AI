import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import sys
import json
import os
import re

def standardize_district_names(df, column_name):
    """
    Standardizes district names to a consistent format.
    Handles common variations and ensures consistency.
    """
    df[column_name] = df[column_name].str.strip().str.title()
    # Create a mapping for common variations
    district_mapping = {
        "Rangareddy": "Ranga Reddy",
        "Medchal": "Medchal-Malkajgiri",
        "Medchal-Malkajgiri": "Medchal-Malkajgiri",
        "Hyderabad": "Hyderabad",
    }
    df[column_name] = df[column_name].replace(district_mapping, regex=True)
    return df

def clean_data(input_path, output_path):
    """
    Cleans and standardizes the raw MSME dataset.
    """
    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Failed to read CSV: {e}"}))
        sys.exit(1)

    # --- Standardization Measures ---
    
    # 1. Standardize column names (lowercase, no spaces)
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # 2. Standardize district names
    if 'district' in df.columns:
        df = standardize_district_names(df, 'district')
    
    # --- Transformation & New Columns ---

    # 3. Create 'Investment_Per_Employee'
    if 'investment' in df.columns and 'employment' in df.columns:
        df['investment_per_employee'] = df['investment'] / df['employment']
        df['investment_per_employee'] = df['investment_per_employee'].replace([np.inf, -np.inf], np.nan)
        df['investment_per_employee'] = df['investment_per_employee'].fillna(0) # or another imputation method
        
    # 4. Create 'MSME_Age_in_Years'
    if 'date_of_establishment' in df.columns:
        df['date_of_establishment'] = pd.to_datetime(df['date_of_establishment'])
        df['msme_age_in_years'] = (pd.to_datetime('today') - df['date_of_establishment']).dt.days / 365.25

    # 5. Handle missing values
    df.fillna(0, inplace=True) # Simple fill for hackathon

    # Save the cleaned data to a new CSV
    df.to_csv(output_path, index=False)
    
    # Return a JSON object
    print(json.dumps({
        "status": "success",
        "message": f"Data cleaned and saved to {output_path}",
        "columns_added": ["investment_per_employee", "msme_age_in_years"]
    }))

def analyze_data(data_path, query):
    """
    Analyzes the cleaned data based on a natural language query.
    """
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(json.dumps({"error": "Cleaned data file not found. Please upload a CSV first."}))
        sys.exit(1)
    
    # A simplified, rule-based approach for the hackathon
    query = query.lower()
    response = "I'm sorry, I couldn't find a direct answer to that question in the data."
    
    if "top 5 districts by investment" in query or "highest investment" in query:
        top_districts = df.groupby('district')['investment'].sum().nlargest(5).reset_index()
        response = f"The top 5 districts by total investment are:\n"
        for index, row in top_districts.iterrows():
            response += f"{index + 1}. {row['district']}: ₹{row['investment'] / 100000:.2f} lakhs\n"
        
    elif "average investment" in query:
        avg_investment = df['investment'].mean()
        response = f"The average investment across all MSMEs is ₹{avg_investment / 100000:.2f} lakhs."
        
    elif "employment by district" in query:
        employment = df.groupby('district')['employment'].sum().nlargest(10).reset_index()
        response = f"Here is the total employment by district:\n"
        for index, row in employment.iterrows():
            response += f"{index + 1}. {row['district']}: {int(row['employment'])} employees\n"
            
    print(json.dumps({"text": response}))

def generate_plot(data_path, query_text, plot_path):
    """
    Generates a plot based on the query and saves it to a file.
    """
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(json.dumps({"error": "Cleaned data file not found. Please upload a CSV first."}))
        sys.exit(1)
    
    plt.style.use('ggplot')
    plt.figure(figsize=(10, 6))
    
    query = query_text.lower()
    
    if "top 5 districts by total investment" in query:
        data = df.groupby('district')['investment'].sum().nlargest(5)
        data.plot(kind='bar', color='purple')
        plt.title('Top 5 Districts by Total Investment', fontsize=16)
        plt.ylabel('Investment (in ₹)', fontsize=12)
        plt.xlabel('District', fontsize=12)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(plot_path)
        print(json.dumps({"success": True}))
    
    elif "investment per employee" in query and "bar chart" in query:
        data = df.groupby('district')['investment_per_employee'].mean().nlargest(5)
        data.plot(kind='bar', color='teal')
        plt.title('Top 5 Districts by Average Investment Per Employee', fontsize=16)
        plt.ylabel('Investment Per Employee (in ₹)', fontsize=12)
        plt.xlabel('District', fontsize=12)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(plot_path)
        print(json.dumps({"success": True}))

    else:
        print(json.dumps({"success": False, "message": "Could not understand the plot request."}))
        
    
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided. Use --clean, --analyze, or --plot."}))
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == '--clean':
        input_path = sys.argv[2]
        output_path = sys.argv[3]
        clean_data(input_path, output_path)
    
    elif command == '--analyze':
        data_path = sys.argv[2]
        query = sys.argv[3]
        analyze_data(data_path, query)

    elif command == '--plot':
        data_path = sys.argv[2]
        query = sys.argv[3]
        plot_path = sys.argv[4]
        generate_plot(data_path, query, plot_path)
