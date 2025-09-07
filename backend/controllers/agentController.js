// import { ChatGroq } from "@langchain/groq";
// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { configDotenv } from 'dotenv';
// import fs from 'fs';
// import path from 'path';
// import { spawn } from 'child_process';
// configDotenv();
// const systemInstruction = "Act as a highly skilled data analyst. Respond to user queries based on the provided dataset. If the question is not about the data, answer it as a general conversational AI. If the question is vulgar, harmful, or inappropriate, refuse to answer politely. Provide concise, brief answers in short paragraphs or lines to keep the chat fluid.";
// /**
//  * Generates a plot based on the provided data and sends the image URL to the client.
//  * @param {Array<Object>} parsedData - The dataset parsed from the CSV.
//  * @param {object} plotDetails - An object containing the chart type, columns, and title.
//  * @param {object} res - The Express response object.
//  */
// const generatePlot = (parsedData, plotDetails, res) => {
//     const { chart_type, columns, title } = plotDetails;

//     // Generate a unique filename using a timestamp to prevent caching issues
//     const filename = `plot_${Date.now()}.png`;
//     const plotPath = path.join(process.cwd(), 'public', 'images', filename);

//     const pythonProcess = spawn('python', [
//         path.join(process.cwd(), '/data-agent/plotGenerator.py'),
//         plotPath,
//         chart_type,
//         columns.join(','), // Pass columns as a comma-separated string
//         title || `Plot of ${columns.join(' vs ')}` // Use a dynamic title
//     ]);

//     pythonProcess.stderr.on('data', (data) => {
//         console.error(`Python script error: ${data}`);
//     });

//     pythonProcess.on('close', (code) => {
//         if (code === 0) {
//             // NOTE: You must update this URL to your server's public address.
//             const serverBaseUrl = "http://localhost:2601";
//             res.status(200).json({
//                 success: true,
//                 text: "Here is a data visualization based on your request:",
//                 plotUrl: `${serverBaseUrl}/images/${filename}`
//             });
//         } else {
//             console.error(`[VISUALIZATION] Python script exited with code ${code}`);
//             res.status(500).json({ success: false, text: 'Failed to generate plot.', plotUrl: '' });
//         }
//     });

//     // Send the parsed data to the Python script via stdin
//     pythonProcess.stdin.write(JSON.stringify(parsedData));
//     pythonProcess.stdin.end();
// };

// /**
//  * Handles incoming chat messages from the user by querying the Groq LLM.
//  * @param {object} req - The Express request object.
//  * @param {object} res - The Express response object.
//  */
// export const agentController = async (req, res) => {
//     const { message } = req.body;

//     try {
//         const fileName = 'cleaned.csv';
//         const filePath = path.join(process.cwd(), 'data-agent', 'temp_data', 'cleaned', fileName);

//         let csvText;
//         try {
//             csvText = fs.readFileSync(filePath, 'utf-8');
//         } catch (error) {
//             console.error(`Error reading file ${fileName}:`, error);
//             return res.status(500).json({ success: false, error: `Failed to read the file: ${fileName}` });
//         }

//         const lines = csvText.trim().split('\n');
//         const headers = lines[0].split(',').map(h => h.trim());
//         const parsedData = lines.slice(1).map(line => {
//             const values = line.split(',').map(v => v.trim());
//             const row = {};
//             headers.forEach((header, i) => {
//                 row[header] = values[i];
//             });
//             return row;
//         });

//         const chat = new ChatGroq({
//             apiKey: process.env.GROQ_API_KEY,
//             model: 'llama-3.1-8b-instant',
//             maxTokens: 512,
//         });

//         // Step 1: Improved LLM prompt for intent classification
//         const intentPrompt = new HumanMessage({
//             content: `Analyze the user's message to determine if it's a request for a data visualization.

//             - If the user asks for a chart, graph, plot, or visual representation, respond with "visualization".
//             - If the user asks for a summary, analysis, or data information in text format, respond with "query".
//             - Respond with only a single word.

//             User message: "${message}"`
//         });
//         const intentResponse = await chat.invoke([intentPrompt]);
//         const userIntent = intentResponse.content.trim().toLowerCase();

//         if (userIntent === 'visualization') {
//             // ... (The rest of the visualization logic remains the same)
//             const plotDetailsPrompt = new HumanMessage({
//                 content: `Based on the user request and the following columns from the dataset: [${headers.join(', ')}], identify the required chart type, relevant columns, and a title. Respond only with a JSON object in the format: {"chart_type": "line" | "bar" | "pie" | "scatter", "columns": ["column_name_1", "column_name_2"], "title": "Chart Title"}.

// User message: "${message}"`
//             });
//             const plotResponse = await chat.invoke([plotDetailsPrompt]);

//             try {
//                 const plotDetails = JSON.parse(plotResponse.content);
//                 return generatePlot(parsedData, plotDetails, res);
//             } catch (e) {
//                 console.error("Failed to parse plot details JSON from LLM:", e);
//                 res.status(500).json({ success: false, text: "I couldn't understand your request to create a plot. Please try again with a more specific request." });
//             }
//         } else {
//             // Logic for a general data query
//             const prompt = new HumanMessage({
//                 content: `
// Analyze the following dataset provided in JSON format and answer my query. If my query is not related to the dataset, please answer it generally. Do not answer vulgar or inappropriate questions.

// Dataset:
// \`\`\`json
// ${JSON.stringify(parsedData, null, 2)}
// \`\`\`

// My query: "${message}"`
//             });

//             const response = await chat.invoke([new SystemMessage(systemInstruction), prompt]);

//             res.status(200).json({
//                 success: true,
//                 text: response.content,
//             });
//         }
//     } catch (error) {
//         console.error('Error in agent controller:', error);
//         res.status(500).json({ success: false, error: 'Error processing your request.' });
//     }
// };

// // ... (rest of the file remains the same)

// export const getInsights = async (req, res) => {
//     // This function remains the same as it doesn't involve user input for visualization
//     try {
//         const fileName = 'cleaned.csv';
//         const filePath = path.join(process.cwd(), 'data-agent', 'temp_data', 'cleaned', fileName);

//         let csvText;
//         try {
//             csvText = fs.readFileSync(filePath, 'utf-8');
//         } catch (error) {
//             console.error(`Error reading file ${fileName}:`, error);
//             return res.status(500).json({ error: `Failed to read the file: ${fileName}` });
//         }

//         const lines = csvText.trim().split('\n');
//         if (lines.length <= 1) {
//             return res.status(400).json({ error: 'The CSV file is empty or has no data rows.' });
//         }

//         const headers = lines[0].split(',').map(h => h.trim());
//         const parsedData = lines.slice(1).map(line => {
//             const values = line.split(',').map(v => v.trim());
//             const row = {};
//             headers.forEach((header, i) => {
//                 row[header] = values[i];
//             });
//             return row;
//         });

//         const prompt = new HumanMessage({
//             content: `
// You are an expert data analyst. Analyze the dataset provided below and generate a professional, concise, and easy-to-understand summary for a non-technical audience.

// Your summary should include:
// 1. High-level trends in the data (e.g., distributions, common values, ranges for numeric fields).
// 2. Diversity and variety in categorical fields.
// 3. Patterns, correlations, or interesting observations.
// 4. Key takeaways that help understand the dataset meaningfully.
// 5. Actionable suggestions or recommendations based on the insights.
// 6. Avoid focusing on missing values, formatting errors, or data cleaning issues.
//  The dataset is in JSON format:\n\n\`\`\`json\n${JSON.stringify(parsedData, null, 2)}\n\`\`\``
//         });

//         const chat = new ChatGroq({
//             apiKey: process.env.GROQ_API_KEY,
//             model: 'llama-3.1-8b-instant',
//             system: systemInstruction,
//         });

//         const response = await chat.invoke([prompt]);

//         res.status(200).json({
//             success: true,
//             insight: response.content,
//         });

//     } catch (error) {
//         console.error('Error generating insights:', error);
//         res.status(500).json({ error: 'Error generating insights from CSV.' });
//     }
// }

const { ChatGroq } = require("@langchain/groq");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { config: configDotenv } = require("dotenv");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

configDotenv();

const systemInstruction =
  "Act as a highly skilled data analyst. Respond to user queries based on the provided dataset. If the question is not about the data, answer it as a general conversational AI. If the question is vulgar, harmful, or inappropriate, refuse to answer politely. Provide concise, brief answers in short paragraphs or lines to keep the chat fluid.";

/**
 * @param {Array<Object>} parsedData - The dataset parsed from the CSV.
 * @param {object} plotDetails - An object containing the chart type, columns, and title.
 * @param {object} res - The Express response object.
 */
const generatePlot = (parsedData, plotDetails, res) => {
  const { chart_type, columns, title } = plotDetails;

  const filename = `plot_${Date.now()}.png`;
  const plotPath = path.join(process.cwd(), "public", "images", filename);

  const pythonProcess = spawn("python", [
    path.join(process.cwd(), "/data-agent/plotGenerator.py"),
    plotPath,
    chart_type,
    columns.join(","), // Pass columns as a comma-separated string
    title || `Plot of ${columns.join(" vs ")}`, // Use a dynamic title
  ]);

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python script error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      const serverBaseUrl = "http://localhost:2601";
      res.status(200).json({
        success: true,
        text: "Here is a data visualization based on your request:",
        plotUrl: `${serverBaseUrl}/images/${filename}`,
      });
    } else {
      console.error(`[VISUALIZATION] Python script exited with code ${code}`);
      res.status(500).json({
        success: false,
        text: "Failed to generate plot.",
        plotUrl: "",
      });
    }
  });

  pythonProcess.stdin.write(JSON.stringify(parsedData));
  pythonProcess.stdin.end();
};

/**
 * Handles incoming chat messages from the user by querying the Groq LLM.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const agentController = async (req, res) => {
  const { message } = req.body;

  try {
    const fileName = "cleaned.csv";
    const filePath = path.join(
      process.cwd(),
      "data-agent",
      "temp_data",
      "cleaned",
      fileName
    );

    let csvText;
    try {
      csvText = fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error(`Error reading file ${fileName}:`, error);
      return res.status(500).json({
        success: false,
        error: `Failed to read the file: ${fileName}`,
      });
    }

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const parsedData = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i];
      });
      return row;
    });

    const chat = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.1-8b-instant",
      maxTokens: 512,
    });

    const intentPrompt = new HumanMessage({
      content: `Analyze the user's message to determine if it's a request for a data visualization.
            
            - If the user asks for a chart, graph, plot, or visual representation, respond with "visualization".
            - If the user asks for a summary, analysis, or data information in text format, respond with "query".
            - Respond with only a single word.
            
            User message: "${message}"`,
    });
    const intentResponse = await chat.invoke([intentPrompt]);
    const userIntent = intentResponse.content.trim().toLowerCase();

    if (userIntent === "visualization") {
      const plotDetailsPrompt = new HumanMessage({
        content: `Based on the user request and the following columns from the dataset: 
[${headers.join(", ")}], identify the most suitable chart type, relevant columns, and a title.

Rules:
1. Supported chart types: "line", "bar", "pie", "scatter", "histogram", "box", "heatmap", "area", 
    "donut", "bubble", "radar",  "stacked_area", "hbar".
2. Numeric requirements:
   - Must have at least one numeric column for: ["line", "bar", "scatter", "stacked_bar", 
     "grouped_bar", "bubble", "stacked_area", "radar"].
   - If no numeric column exists, do NOT choose these. Instead, pick from ["pie", "histogram", "box", "heatmap", "area", "hbar"], 
     or default to a count-based "bar".
3. Column counts:
   - "bubble" ideally uses 3 columns: X numeric, Y numeric, Size numeric.
   - All other charts require 1 or 2 columns as appropriate.
4. If requested chart type is unsupported, choose the closest valid option.
5. If user request is vague or cannot be matched, select a chart type that best represents the data.
6. Respond ONLY with a raw JSON object (no markdown, code fences, or explanations).

Format strictly as:
{
  "chart_type": "line" | "bar" | "pie" | "scatter" | "histogram" | "box" | "heatmap" | "area" | "donut" | "bubble" | "radar" | "stacked_area" | "hbar",
  "columns": ["column_name_1", "column_name_2", "column_name_3_if_needed"],
  "title": "Chart Title"
}

User message: "${message}"`
,
      });

      const plotResponse = await chat.invoke([plotDetailsPrompt]);

      try {
        let raw = plotResponse.content.trim();

        // 🛡️ Strip code fences if present
        if (raw.startsWith("```")) {
          raw = raw.replace(/```(json)?/g, "").trim();
        }

        const plotDetails = JSON.parse(raw);
        return generatePlot(parsedData, plotDetails, res);
      } catch (e) {
        console.error(
          "Failed to parse plot details JSON from LLM:",
          e,
          plotResponse.content
        );
        res.status(500).json({
          success: false,
          text: "I couldn't understand your request to create a plot. Please try again with a more specific request.",
        });
      }
    } else {
      const prompt = new HumanMessage({
        content: `
            Analyze the following dataset provided in JSON format and answer my query. If my query is not related to the dataset, please answer it generally. Do not answer vulgar or inappropriate questions.

            Dataset:
            \`\`\`json
            ${JSON.stringify(parsedData, null, 2)}
            \`\`\`

            My query: "${message}"`,
      });

      const response = await chat.invoke([
        new SystemMessage(systemInstruction),
        prompt,
      ]);

      res.status(200).json({
        success: true,
        text: response.content,
      });
    }
  } catch (error) {
    console.error("Error in agent controller:", error);
    res
      .status(500)
      .json({ success: false, error: "Error processing your request." });
  }
};

const getInsights = async (req, res) => {
  try {
    const fileName = "cleaned.csv";
    const filePath = path.join(
      process.cwd(),
      "data-agent",
      "temp_data",
      "cleaned",
      fileName
    );

    let csvText;
    try {
      csvText = fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error(`Error reading file ${fileName}:`, error);
      return res
        .status(500)
        .json({ error: `Failed to read the file: ${fileName}` });
    }

    const lines = csvText.trim().split("\n");
    if (lines.length <= 1) {
      return res
        .status(400)
        .json({ error: "The CSV file is empty or has no data rows." });
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const parsedData = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i];
      });
      return row;
    });

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
 The dataset is in JSON format:\n\n\`\`\`json\n${JSON.stringify(
   parsedData,
   null,
   2
 )}\n\`\`\``,
    });

    const chat = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.1-8b-instant",
      system: systemInstruction,
    });

    const response = await chat.invoke([prompt]);

    res.status(200).json({
      success: true,
      insight: response.content,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Error generating insights from CSV." });
  }
};

module.exports = { agentController, getInsights };
