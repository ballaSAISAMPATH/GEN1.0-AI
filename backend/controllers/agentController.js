import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { configDotenv } from 'dotenv';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module to resolve file paths

configDotenv();

// This is a simple in-memory store for our system instruction.
// For a real application, you might load this from a configuration file or a database.
const systemInstruction = "Act as a highly skilled data analyst. Your goal is to provide clear, concise, and accurate insights based on the provided CSV data. Your response should be professional and easy to understand for a non-expert.";

/**
 * Handles incoming chat messages from the user by querying the Groq LLM.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
export const agentController = async (req, res) => {
    // TODO: Implement the chat logic for subsequent user questions.
    // This function will need to receive the user's question and the previously
    // stored dataset to provide a contextual answer.
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
            content: `Analyze the following dataset and provide a brief summary of the key findings, trends, and any potential anomalies you observe. The dataset is in JSON format:\n\n\`\`\`json\n${JSON.stringify(parsedData, null, 2)}\n\`\`\``
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
