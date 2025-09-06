const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const agentRouter = require('./routes/agentRoute');
const app = express();
const port = 2601;

// Paths
const tempDir = path.join(__dirname, 'data-agent', 'temp_data');
const cleanedDir = path.join(tempDir, 'cleaned');
const logPath = path.join(tempDir, 'run_log.txt');

// Ensure directories exist
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(cleanedDir)) fs.mkdirSync(cleanedDir, { recursive: true });
if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

// Logging helper
const logToFile = (message) => {
    const ts = new Date().toISOString();
    fs.appendFileSync(logPath, `[${ts}] ${message}\n`);
    console.log(`[${ts}] ${message}`);
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/user",agentRouter)
// Multer upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `raw_${uniqueSuffix}_${file.originalname}`);
    },
});
const upload = multer({ storage });

// Upload route
app.post('/api/upload-csv', upload.array('csvFiles'), async (req, res) => {
    logToFile('Starting new data ingestion & analysis run.');

    if (!req.files || !req.files.length) {
        logToFile('ERROR: No files uploaded.');
        return res.status(400).json({ error: 'No files uploaded.' });
    }

    try {
        const cleanedFiles = [];

        for (const file of req.files) {
            logToFile(`Processing ${file.filename}`);

            await new Promise((resolve, reject) => {
                const py = spawn('python', [
                    path.join(__dirname, 'data-agent', 'data_processor.py'),
                    '--input_csv', file.path,
                    '--output_dir', cleanedDir,
                    '--log_file', logPath
                ]);

                py.stdout.on('data', (d) => logToFile(`STDOUT: ${d}`));
                py.stderr.on('data', (d) => logToFile(`STDERR: ${d}`));

                py.on('close', (code) => {
                    if (code === 0) {
                        const cleanedPath = path.join(cleanedDir, `cleaned_${file.filename}`);
                        cleanedFiles.push(cleanedPath);
                        resolve();
                    } else {
                        reject(`Cleaning failed for ${file.filename}`);
                    }
                });
            });
        }

        logToFile('All files cleaned successfully.');

        res.json({
            success: true,
            message: 'Files cleaned successfully.',
            cleanedFiles,
        });

    } catch (err) {
        logToFile(`ERROR: ${err}`);
        res.status(500).json({ error: 'Processing failed', details: err });
    }
});

// Download latest cleaned CSV
app.get('/api/download-cleaned', (req, res) => {
    fs.readdir(cleanedDir, (err, files) => {
        if (err || files.length === 0) {
            return res.status(404).json({ error: 'No cleaned datasets found.' });
        }

        const latestFile = files
            .map(f => ({ name: f, time: fs.statSync(path.join(cleanedDir, f)).mtime }))
            .sort((a, b) => b.time - a.time)[0].name;

        const filePath = path.join(cleanedDir, latestFile);
        res.download(filePath, latestFile);
    });
});

app.listen(port, () => logToFile(`Server listening at http://localhost:${port}`));
