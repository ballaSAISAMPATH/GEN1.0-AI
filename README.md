
# 📊 Real-Time Governance System (RTGS)

## 📌 Overview

The **Real-Time Governance System (RTGS)** is a data-driven platform that transforms raw datasets into **clean, standardized, and actionable insights**.
It can be applied to **any dataset** across **any sector** — government, healthcare, finance, education, industries, etc.

The system ingests raw CSVs, cleans them using Python, and serves insights and visualizations via a Node.js + React stack.

---

## 🎯 Key Features

 * Upload raw datasets (CSV format)
 * Automated data cleaning & preprocessing
 * Visualization generator (plots, charts)
 * REST APIs for insights and downloads
 * Frontend-ready for dashboards or UIs
 * Fully extensible for **any domain**

---

## ⚙️ Tech Stack

* **Backend**: Node.js, Express
* **Frontend**: React (Vite)
* **Data Processing**: Python (Pandas, Matplotlib)
* **File Handling**: Multer, FS
* **Other Utilities**: dotenv, CORS

---

## 📂 Project Structure

```
RTGS/
│
├── backend/                       
│   ├── controllers/        # API logic
│   ├── data-agent/         # Data processing (Python scripts)
│   │   ├── temp_data/      # Temporary uploads
│   │   ├── data_processor.py
│   │   └── plotGenerator.py
│   ├── routes/             # API routes
│   ├── public/             # Static assets
│   ├── server.js           # Backend entry
│   ├── .env
│   └── package.json
│
├── frontend/               
│   ├── src/                # React source
│   ├── public/             # Static frontend assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── README.md
└── eslint.config.js
```

---

## 🚀 Getting Started

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/VarshiniNeralla/AgenticAi.git
cd AgenticAi
```

### 🔹 2. Backend Setup

```bash
cd backend
npm install
```

Run backend:

```bash
nodemon server.js or node server.js
```

### 🔹 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Endpoints

### 📤 Upload Dataset

```http
POST /api/upload-csv
```

* Upload one or more CSV files
* Cleans and preprocesses datasets

### 📥 Download Cleaned Dataset

```http
GET /api/download-cleaned
```

* Returns the latest cleaned dataset

### 📊 Insights

```http
GET /user/api/insights
```

* Retrieves processed insights

### 💬 Chat with Data Agent

```http
POST /user/api/chat
```

* Ask questions about the dataset and receive answers

---

## 🛠️ Example Workflow

1. Upload any raw CSV dataset (finance, health, industry, etc.).
2. System cleans & standardizes the data with Python.
3. Visualizations are generated automatically.
4. Cleaned dataset & insights are served via APIs.
5. React frontend displays results in real time.

---

## 📈 Example Use Cases

* **Healthcare**: Patient records, hospital operations
* **Government**: Public datasets, policy analysis
* **Education**: Student performance, institutional data
* **Finance**: Transactions, investment trends
* **Industry**: MSME or large-scale enterprise data

---




