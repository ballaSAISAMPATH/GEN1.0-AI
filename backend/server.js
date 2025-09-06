const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const agentController = require("./routes/agentRoute");
require('dotenv').config();

const app = express();
const port = 2601;

// Paths
const tempDir = path.join(__dirname, 'data-agent', 'temp_data');
const cleanedDir = path.join(tempDir, 'cleaned');
const finalCombinedPath = path.join(tempDir, 'combined_data.csv');
const logPath = path.join(tempDir, 'run_log.txt');

// Ensure directories exist
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(cleanedDir)) fs.mkdirSync(cleanedDir, { recursive: true });
if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

// Logging
const logToFile = (message) => {
    const ts = new Date().toISOString();
    fs.appendFileSync(logPath, `[${ts}] ${message}\n`);
    console.log(`[${ts}] ${message}`);
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `raw_${uniqueSuffix}_${file.originalname}`);
    },
});
const upload = multer({ storage });
app.use("/user",agentController);

app.get('/api/download-cleaned', (req, res) => {
    fs.readdir(cleanedDir, (err, files) => {
        if (err || files.length === 0) {
            return res.status(404).json({ error: 'No cleaned datasets found.' });
        }

        // Find most recent file
        const latestFile = files
            .map(f => ({ name: f, time: fs.statSync(path.join(cleanedDir, f)).mtime }))
            .sort((a, b) => b.time - a.time)[0].name;

        const filePath = path.join(cleanedDir, latestFile);
        res.download(filePath, latestFile); // triggers browser download
    });
});

app.post('/api/upload-csv', upload.array('csvFiles'), async (req, res) => {
    logToFile('Starting new data ingestion & analysis run.');

    if (!req.files || !req.files.length) {
        logToFile('ERROR: No files uploaded.');
        return res.status(400).json({ error: 'No files uploaded.' });
    }

    const years = JSON.parse(req.body.years);
    const filesToClean = req.files.map((file, i) => ({
        rawPath: file.path,
        cleanedPath: path.join(cleanedDir, `cleaned_${path.basename(file.filename)}`),
        year: years[i],
    }));

    try {
        // Cleaning
        for (const f of filesToClean) {
            logToFile(`Cleaning ${path.basename(f.rawPath)} (Year: ${f.year})`);
            await new Promise((resolve, reject) => {
                const py = spawn('python', [
                    path.join(__dirname, 'data-agent', 'data_processor.py'),
                    'clean',
                    '--input_path', f.rawPath,
                    '--output_path', f.cleanedPath,
                    '--year', f.year,
                    '--log_file', logPath,
                ]);
                py.stdout.on('data', (d) => logToFile(`STDOUT: ${d}`));
                py.stderr.on('data', (d) => logToFile(`STDERR: ${d}`));
                py.on('close', (code) => code === 0 ? resolve() : reject(`Cleaning failed: ${f.rawPath}`));
            });
        }

        // Combine
        const cleanedPaths = filesToClean.map(f => f.cleanedPath);
        logToFile('Combining cleaned files...');
        await new Promise((resolve, reject) => {
            const py = spawn('python', [
                path.join(__dirname, 'data-agent', 'data_processor.py'),
                'combine',
                '--output_path', finalCombinedPath,
                '--log_file', logPath,
                '--input_paths', ...cleanedPaths,
            ]);
            py.stdout.on('data', (d) => logToFile(`STDOUT: ${d}`));
            py.stderr.on('data', (d) => logToFile(`STDERR: ${d}`));
            py.on('close', (code) => code === 0 ? resolve() : reject('Combining failed'));
        });

        // Generate initial insights
        logToFile('Generating initial insights...');
        const initialInsights = await new Promise((resolve, reject) => {
            const py = spawn('python', [
                path.join(__dirname, 'data-agent', 'repl_agent.py'),
                '--data_path', finalCombinedPath,
                '--code', `import pandas as pd
df = pd.read_csv(r'${finalCombinedPath}')
summary = df.describe(include='all').to_string()
print(summary)`,
                '--log_file', logPath,
            ]);
            let output = '', error = '';
            py.stdout.on('data', (d) => output += d.toString());
            py.stderr.on('data', (d) => error += d.toString());
            py.on('close', (code) => code === 0 ? resolve(output) : reject(error));
        });
        console.log("here",initialInsights);
        
        res.json({
            success: true,
            message: 'Files cleaned & combined.',
            insights: initialInsights,
        });

    } catch (err) {
        logToFile(`ERROR: ${err}`);
        res.status(500).json({ error: 'Processing failed', details: err });
    }
});

app.listen(port, () => logToFile(`Server listening at http://localhost:${port}`));
