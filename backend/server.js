const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const {ChatGroq} = require('@langchain/groq');
require('dotenv').config();

const app = express();
const port = 2601;

// Define paths
const tempDir = path.join(__dirname, 'data-agent', 'temp_data');
const rawFilePath = path.join(tempDir, 'raw.csv');
const cleanedFilePath = path.join(tempDir, 'cleaned_data.csv');
const plotFilePath = path.join(tempDir, 'plot.png');

// Ensure temporary directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Overwrite the raw file for each new upload
    cb(null, 'raw.csv');
  },
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (the plots)
app.use('/images', express.static(tempDir));

// Initialize LangChain model
const model = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  apiKey: process.env.GROQ_API_KEY,
});

const chatHistory = [];

// API Endpoint to handle file uploads
app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Spawn Python child process to clean the data
  const python = spawn('python', [
    path.join(__dirname, 'data-agent', 'data_processor.py'),
    '--clean',
    rawFilePath,
    cleanedFilePath,
  ]);

  let pythonOutput = '';
  let pythonError = '';

  python.stdout.on('data', (data) => {
    pythonOutput += data.toString();
  });

  python.stderr.on('data', (data) => {
    pythonError += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      console.error('Python Error:', pythonError);
      return res.status(500).json({ error: 'Data cleaning failed.', details: pythonError });
    }
    
    // Parse the JSON output from the Python script
    try {
      const result = JSON.parse(pythonOutput);
      const initialInsight = "I've analyzed the raw data. It contains information about Micro, Small, and Medium Enterprises (MSMEs) in Telangana. It looks like we have data on district, industry type, investment, and employment.";

      res.json({
        success: true,
        message: 'CSV processed successfully.',
        insight: initialInsight,
        result: result,
      });
    } catch (parseError) {
      console.error('Failed to parse Python output:', parseError);
      res.status(500).json({ error: 'Failed to parse data processor output.' });
    }
  });
});

// API Endpoint for the chat interface
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided.' });
  }

  chatHistory.push({ role: 'user', content: message });
  
  // LangChain logic to decide on action and generate response
  try {
    const promptTemplate = PromptTemplate.fromTemplate(
      `You are an expert data analyst and chatbot. Your task is to respond to a user's query about a dataset. The user has uploaded a cleaned CSV file about MSMEs in Telangana, which is located at '${cleanedFilePath}'.

      Your response should be based on an analysis of this data. If the user asks for a simple text-based insight, provide a clear, concise answer. If the user asks for a visualization (e.g., "show a chart," "plot this," "visualize"), you must request a plot to be generated.
      
      You have access to a tool to perform these actions. Your final response should be in the form of a JSON object.
      
      Here is the user's query: {query}
      
      Respond with a JSON object with 'type' and 'payload' keys.
      - If you can answer with text, use type 'text' and payload 'your answer'.
      - If you need a visualization, use type 'plot' and payload 'a description of the plot to generate'.
      
      Example text response: {{"type": "text", "payload": "The average investment is 500."}}
      Example plot response: {{"type": "plot", "payload": "a bar chart showing the top 5 districts by total investment"}}
      
      Your response must be ONLY a single JSON object. Do not include any other text.`
    );
    
    const runnable = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);
    
    const rawAiResponse = await runnable.invoke({ query: message });
    
    // The Gemini model may add extra characters, so we need to clean the JSON
    const jsonString = rawAiResponse.replace(/^```json|```$/g, '').trim();
    let aiResponse;
    try {
      aiResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response JSON:', parseError);
      return res.status(500).json({ error: 'AI response was not in a valid JSON format.' });
    }
    
    // Handle the parsed response
    if (aiResponse.type === 'text') {
      res.json({ text: aiResponse.payload });
    } else if (aiResponse.type === 'plot') {
      // Spawn Python process for plotting
      const python = spawn('python', [
        path.join(__dirname, 'data-agent', 'data_processor.py'),
        '--plot',
        cleanedFilePath,
        aiResponse.payload,
        plotFilePath,
      ]);
      
      let pythonOutput = '';
      python.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python plotting script exited with code ${code}`);
          return res.status(500).json({ error: 'Data visualization failed.' });
        }
        res.json({
          text: `Here is a visualization based on your query: ${aiResponse.payload}`,
          plotUrl: `http://localhost:${port}/images/plot.png?t=${Date.now()}` // Add timestamp to bust cache
        });
      });
    } else {
      res.status(500).json({ error: 'Invalid AI response type.' });
    }

  } catch (error) {
    console.error('LangChain or Python execution error:', error);
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
