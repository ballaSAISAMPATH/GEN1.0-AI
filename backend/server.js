const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ChatGroq } = require('@langchain/groq');
const { AgentExecutor, createReactAgent } = require('langchain/agents');
const { pull } = require('langchain/hub');
const { DynamicTool } = require('@langchain/core/tools');

require('dotenv').config();

const app = express();
const port = 2601;

// Define paths
const tempDir = path.join(__dirname, 'data-agent', 'temp_data');
const cleanedDir = path.join(tempDir, 'cleaned');
const finalCombinedPath = path.join(tempDir, 'combined_data.csv');
const plotPath = path.join(tempDir, 'plot.png');
const logPath = path.join(tempDir, 'run_log.txt');

// Ensure directories exist and clear previous logs
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(cleanedDir)) fs.mkdirSync(cleanedDir, { recursive: true });
if (fs.existsSync(logPath)) fs.unlinkSync(logPath); // Clear log on start

// Logging function
const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    console.log(logMessage.trim()); // Also log to console for real-time visibility
};

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `raw_${uniqueSuffix}_${file.originalname}`);
    },
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(tempDir));

// Initialize LangChain model
const model = new ChatGroq({
    model: 'llama-3.1-8b-instant',
    apiKey: process.env.GROQ_API_KEY,
});

// API Endpoint to handle file uploads
app.post('/api/upload-csv', upload.array('csvFiles'), (req, res) => {
    logToFile('Starting new run for data ingestion and analysis.');

    if (!req.files || req.files.length === 0) {
        logToFile('ERROR: No files uploaded.');
        return res.status(400).json({ error: 'No files uploaded.' });
    }

    const years = JSON.parse(req.body.years);
    const filesToClean = req.files.map((file, index) => ({
        rawPath: file.path,
        cleanedPath: path.join(cleanedDir, `cleaned_${path.basename(file.filename)}`),
        year: years[index],
    }));

    logToFile(`Received ${req.files.length} file(s) for processing.`);

    const cleanPromises = filesToClean.map(({ rawPath, cleanedPath, year }) => {
        return new Promise((resolve, reject) => {
            logToFile(`Starting cleaning for ${path.basename(rawPath)} (Year: ${year}).`);
            // FIX: Corrected argument order for argparse
           const python = spawn('python', [
    path.join(__dirname, 'data-agent', 'data_processor.py'),
    'clean',   // ✅ fixed
    '--input_path', rawPath,
    '--output_path', cleanedPath,
    '--year', year,
    '--log_file', logPath,
]);


            python.stdout.on('data', (data) => logToFile(`DATA_PROCESSOR_STDOUT: ${data.toString()}`));
            python.stderr.on('data', (data) => logToFile(`DATA_PROCESSOR_STDERR: ${data.toString()}`));

            python.on('close', (code) => {
                if (code !== 0) {
                    const error = `Python script for cleaning exited with code ${code}.`;
                    logToFile(`ERROR: ${error}`);
                    reject(error);
                }
                logToFile(`Cleaning for ${path.basename(rawPath)} completed successfully.`);
                resolve();
            });
        });
    });

    Promise.all(cleanPromises)
        .then(() => {
            const cleanedPaths = filesToClean.map(f => f.cleanedPath);
            logToFile(`All files cleaned. Starting data combination into ${path.basename(finalCombinedPath)}.`);
            // FIX: Corrected argument order for argparse
           const pythonCombine = spawn('python', [
    path.join(__dirname, 'data-agent', 'data_processor.py'),
    'combine',   // ✅ fixed
    '--output_path', finalCombinedPath,
    '--log_file', logPath,
    '--input_paths', ...cleanedPaths,
]);


            pythonCombine.stdout.on('data', (data) => logToFile(`DATA_PROCESSOR_STDOUT: ${data.toString()}`));
            pythonCombine.stderr.on('data', (data) => logToFile(`DATA_PROCESSOR_STDERR: ${data.toString()}`));

            pythonCombine.on('close', (code) => {
                if (code !== 0) {
                    const error = 'Data combining failed.';
                    logToFile(`ERROR: ${error}`);
                    return res.status(500).json({ error: error });
                }
                const initialInsight = "I've processed and combined your datasets. They contain information about MSMEs in Telangana, including district, industry type, investment, and employment, with data from multiple years now available for comparison.";
                logToFile(`Data combination completed successfully. Initial insight generated.`);
                res.json({
                    success: true,
                    message: 'Datasets processed and combined successfully.',
                    insight: initialInsight,
                });
            });
        })
        .catch((error) => {
            console.error('Data cleaning failed:', error);
            res.status(500).json({ error: 'Data cleaning failed.', details: error });
        });
});

// API Endpoint for the chat interface
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    logToFile(`User Query: "${message}"`);

    if (!message) {
        logToFile('ERROR: No message provided.');
        return res.status(400).json({ error: 'No message provided.' });
    }

    if (!fs.existsSync(finalCombinedPath)) {
        logToFile('ERROR: Combined data file not found.');
        return res.status(400).json({ error: "Please upload and process a dataset before asking questions." });
    }

    const pythonREPLTool = new DynamicTool({
        name: 'python_repl',
        description: 'A Python REPL to execute python commands. The \'df\' variable holds the combined data as a pandas DataFrame. The `plt` variable holds the matplotlib.pyplot module. Use this tool to analyze data, perform calculations, and generate visualizations. To generate a plot, use `plt.savefig(\'plot.png\')` to save the figure to the designated file path. For data summaries, use `df.to_markdown()` or `df.to_string()` for easy-to-read text tables. Use this tool to uncover insights, patterns, and trends in the data.',
        func: async (code) => {
            logToFile(`Agent Action: Executing Python REPL with code:\n${code}`);
            return new Promise((resolve, reject) => {
                // FIX: Corrected argument order for argparse
                const pythonProcess = spawn('python', [
                    path.join(__dirname, 'data-agent', 'repl_agent.py'), 
                    '--data_path', finalCombinedPath, 
                    '--code_to_execute', code, 
                    '--log_file', logPath,
                ]);

                let stdout = '';
                let stderr = '';

                pythonProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    stdout += output;
                    logToFile(`REPL_STDOUT: ${output}`);
                });

                pythonProcess.stderr.on('data', (data) => {
                    const output = data.toString();
                    stderr += output;
                    logToFile(`REPL_STDERR: ${output}`);
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        const error = `Python REPL exited with code ${code}: ${stderr}`;
                        logToFile(`ERROR: ${error}`);
                        reject(new Error(error));
                    } else {
                        logToFile(`REPL execution successful.`);
                        resolve(stdout);
                    }
                });
            });
        },
    });

    const tools = [pythonREPLTool];
    const reactPrompt = await pull("hwchase17/react");
    const agent = await createReactAgent({
        llm: model,
        tools,
        prompt: reactPrompt,
    });

    const agentExecutor = AgentExecutor.fromAgentAndTools({
        agent,
        tools,
    });

    try {
        const rawAiResponse = await agentExecutor.invoke({
            input: message,
            chat_history: []
        });

        const plotUrl = fs.existsSync(plotPath) ? `http://localhost:${port}/images/plot.png?t=${Date.now()}` : null;
        const responseText = rawAiResponse.output;

        logToFile(`Final AI Response: ${responseText}`);
        if (plotUrl) {
            logToFile(`Plot generated at: ${plotUrl}`);
        }

        res.json({
            success: true,
            text: responseText,
            plotUrl: plotUrl,
        });
    } catch (error) {
        logToFile(`ERROR: Agent execution failed. Details: ${error.message}`);
        console.error('Agent execution error:', error);
        res.status(500).json({ error: 'An internal error occurred while processing your request.', details: error.message });
    }
});

app.listen(port, () => {
    logToFile(`Server listening on http://localhost:${port}`);
});