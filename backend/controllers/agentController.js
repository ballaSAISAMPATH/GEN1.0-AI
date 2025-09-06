import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { configDotenv } from 'dotenv';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module to resolve file paths

configDotenv();

// This is a simple in-memory store for our system instruction.
// For a real application, you might load this from a configuration file or a database.
const systemInstruction = "Act as a highly skilled data analyst. Respond to user queries based on the provided dataset. If the question is not about the data, answer it as a general conversational AI. If the question is vulgar, harmful, or inappropriate, refuse to answer politely. Provide concise, brief answers in short paragraphs or lines to keep the chat fluid.";

/**
 * Handles incoming chat messages from the user by querying the Groq LLM.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
export const agentController = async (req, res) => {
    const {message} = req.body;
    
    try {
        // --- Step 1: Read the CSV data from the local file system ---
        const fileName = 'cleaned.csv';
        const filePath = path.join(process.cwd(), 'data-agent', 'temp_data', 'cleaned', fileName);
        
        console.log(`[AGENT_CONTROLLER] Received message: "${message}"`);
        
        let csvText;
        try {
            csvText = fs.readFileSync(filePath, 'utf-8');
            console.log(`[AGENT_CONTROLLER] Successfully read file: ${fileName}`);
        } catch (error) {
            console.error(`Error reading file ${fileName}:`, error);
            return res.status(500).json({ success: false, error: `Failed to read the file: ${fileName}` });
        }

        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const parsedData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i];
            });
            return row;
        });

        // --- Step 2: Construct the prompt for the LLM ---
        const chat = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: 'llama-3.1-8b-instant',
            maxTokens: 512, // Set a max token limit for brief responses
        });

        const prompt = new HumanMessage({
            content: `
            Analyze the following dataset provided in JSON format and answer my query. If my query is not related to the dataset, please answer it generally. Do not answer vulgar or inappropriate questions.

            Dataset:
            \`\`\`json
            ${JSON.stringify(parsedData, null, 2)}
            \`\`\`

            My query: "${message}"`
        });

        // --- Step 3: Call the Groq API to get the response ---
        console.log("[AGENT_CONTROLLER] Invoking LLM...");
        const response = await chat.invoke([new SystemMessage(systemInstruction), prompt]);
        console.log("[AGENT_CONTROLLER] LLM response received:", response);
        
        // --- Step 4: Send the response back to the client ---
        res.status(200).json({
            success: true,
            text: response.content,
        });
        console.log("[AGENT_CONTROLLER] Response sent to client.");

    } catch (error) {
        console.error('Error in agent controller:', error);
        res.status(500).json({ success: false, error: 'Error processing your request.' });
    }
}

/**
 * Parses a single CSV file from a directory and uses the Groq LLM to generate initial insights.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
export const getInsights = async (req, res) => {
    try {
        console.log("hi");
        
        // --- Step 1: Read the CSV data from the local file system ---
        // Assuming there is always a single file named 'data.csv' in the specified path.
        const fileName = 'cleaned.csv';
        const filePath = path.join(process.cwd(), 'data-agent', 'temp_data', 'cleaned', fileName);
        console.log(filePath);
        
        let csvText;
        try {
            csvText = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.error(`Error reading file ${fileName}:`, error);
            return res.status(500).json({ error: `Failed to read the file: ${fileName}` });
        }

        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) {
            return res.status(400).json({ error: 'The CSV file is empty or has no data rows.' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const parsedData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i];
            });
            return row;
        });

        // --- Step 2: Construct the prompt for the LLM ---
        const prompt = new HumanMessage({
            content: `
            You are an expert data analyst. Analyze the dataset provided below and generate a professional, concise, and easy-to-understand summary for a non-technical audience.

            Your summary should include:
            1. High-level trends in the data (e.g., distributions, common values, ranges for numeric fields).
            2. Diversity and variety in categorical fields.
            3. Patterns, correlations, or interesting observations.
            4. Key takeaways that help understand the dataset meaningfully.
            5. Actionable suggestions or recommendations based on the insights.
            6. Avoid focusing on missing values, formatting errors, or data cleaning issues.
             The dataset is in JSON format:\n\n\`\`\`json\n${JSON.stringify(parsedData, null, 2)}\n\`\`\``
        });
        
        console.log("step2");
        // --- Step 3: Call the Groq API to get the insights ---
        const chat = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: 'llama-3.1-8b-instant',
            system: systemInstruction, // Using the system instruction
        });
        console.log("step3");
        
        const response = await chat.invoke([prompt]);
        console.log("response: ",response);
        
        // --- Step 4: Send the response back to the client ---
        res.status(200).json({
            success: true,
            insight: response.content,
        });

    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Error generating insights from CSV.' });
    }
}
