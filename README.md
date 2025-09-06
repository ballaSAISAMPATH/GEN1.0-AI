# Real-Time Governance System (RTGS) – Telangana MSME Data

## 📌 Overview
This project prototypes a **Real-Time Governance System (RTGS)** using data from the **Telangana Open Data Portal**.  
It automates the process of **ingesting, cleaning, and transforming** public datasets into **actionable insights** for policymakers.

For this prototype, we focus on the **Telangana Industries MSME dataset (2021–2025)**, which provides information about Micro, Small & Medium Enterprises in the state.

---

## 🎯 Mission
- Turn raw public data into **standardized, analysis-ready evidence**.  
- Provide **easy-to-understand insights** via the **command line** (tables, ASCII charts, summaries).  
- Ensure transparency through **step-by-step logs** and reproducibility.  

---

## ⚙️ Tech Stack
- **Python (Pandas, Matplotlib, Tabulate)** – Data cleaning, transformation, insights, CLI outputs  
- **MERN Stack (MongoDB, Express, React, Node.js)** – Backend setup for extending insights to a web UI  
- **LangChain (Planned)** – To add agentic AI capabilities for automated analysis

---

## 🗂️ Dataset
**Source**: Telangana Open Data Portal  
- Dataset Name: *Industries – MSME Data*  
- Organization: Department of Industries and Commerce  
- Period: 01-04-2021 to 31-08-2025  
- Columns:
  - `district`  
  - `mandal`  
  - `industry_category` (cleaned from typo `indsutry_category`)  
  - `type_of_industry`  
  - `unit_name`  
  - `line_of_activity`  
  - `investment`  
  - `employment`  
  - `present_status`  
  - `export`  
  - `type_of_connection`

---

## 🧹 Data Cleaning (Completed in d1-morn)
- Fixed column name typos (`indsutry_category → industry_category`)  
- Trimmed whitespace and normalized text (title case for districts/mandals)  
- Converted `investment` and `employment` to numeric  
- Standardized missing values (`NaN` where data is absent)  
- Combined multiple monthly CSV files into a single cleaned dataset:  
  - Output file: **`telangana_msme_cleaned.csv`**

---

## 🚀 Usage
### 1. Clone the repository
```bash
git clone https://github.com/VarshiniNeralla/AgenticAi.git
cd AgenticAi
