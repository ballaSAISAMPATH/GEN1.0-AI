import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { configDotenv } from 'dotenv';
configDotenv();
export const agentController = async (req, res) => {
}

export const getInsights = async (req, res) => {
    try {        
        const chat = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: 'llama-3.1-8b-instant',
        });
    }
    catch (error) {
        console.error('Error generating insights:', error);
        res.status(200).json({ error: 'Error generating insights' });
    }
}