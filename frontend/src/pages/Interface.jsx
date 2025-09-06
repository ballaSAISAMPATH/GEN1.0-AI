import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

const Interface = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [years, setYears] = useState({});
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [plotUrl, setPlotUrl] = useState('');
    const [datasetUploaded, setDatasetUploaded] = useState(false);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [cleanedReady, setCleanedReady] = useState(false);
    const [insightsContent, setInsightsContent] = useState('');
    const [insightsGenerated, setInsightsGenerated] = useState(false);


    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        const initialYears = {};
        files.forEach((file, index) => {
            const match = file.name.match(/\d{4}/);
            initialYears[index] = match ? match[0] : '';
        });
        setYears(initialYears);
    };

    const handleYearChange = (index, value) => {
        setYears({ ...years, [index]: value });
    };

    const generateInsights = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:2601/user/api/insights');
            if(response.data.success){
                setInsightsContent(response.data.insight);
                setInsightsGenerated(true);
                toast.success("Insights generated successfully!");
            } else {
                toast.error(`Error: ${response.data.error}`);
            }
        }
        catch (error) {
            console.error('Error generating insights:', error);
            toast.error(`Error: ${error.response?.data?.error || error.message}`);
        }
        finally{
            setLoading(false);
        }
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select at least one file.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('csvFiles', file));
        formData.append('years', JSON.stringify(Object.values(years)));

        try {
            const response = await axios.post('http://localhost:2601/api/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                toast.success('Dataset uploaded successfully!');
                setDatasetUploaded(true);
                setCleanedReady(true);
                setInsightsGenerated(false); // Reset insights on new upload

                setChatHistory((prev) => [
                    ...prev,
                    { role: 'ai', content: 'Dataset uploaded successfully! You can now ask questions.', type: 'info' },
                ]);

                setSelectedFiles([]);
                setYears({});
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast.error(`Error: ${response.data.error}`);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
        const userMessage = message;
        setMessage('');
        setLoading(true);

        // Add a placeholder for AI reply with blinking effect
        setChatHistory((prev) => [...prev, { role: 'ai', content: '', type: 'loading' }]);

        try {
            const response = await axios.post('http://localhost:2601/api/chat', { message: userMessage });

            // Remove last loading placeholder and add real reply
            setChatHistory((prev) => {
                const updated = [...prev];
                const loadingIndex = updated.findIndex(c => c.type === 'loading');
                if (loadingIndex !== -1) updated[loadingIndex] = { role: 'ai', content: response.data.text };
                return updated;
            });

            if (response.data.plotUrl) setPlotUrl(response.data.plotUrl);
        } catch (error) {
            console.error('Chat failed:', error);
            toast.error(`Error: ${error.response?.data?.error || error.message}`);
            setChatHistory((prev) => {
                const updated = [...prev];
                const loadingIndex = updated.findIndex(c => c.type === 'loading');
                if (loadingIndex !== -1) updated[loadingIndex] = { role: 'ai', content: `Error: ${error.response?.data?.error || error.message}` };
                return updated;
            });
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    return (
        <div className="relative overflow-hidden font-sans antialiased text-gray-100 h-screen w-full flex bg-black">
            {/* Styles for react-toastify embedded directly */}
            <style>{`
                .Toastify__toast-container {
                    z-index: 9999;
                    position: fixed;
                    padding: 4px;
                    width: 320px;
                    box-sizing: border-box;
                    color: #fff;
                }
                .Toastify__toast-container--top-left {
                    top: 1em;
                    left: 1em;
                }
                .Toastify__toast-container--top-center {
                    top: 1em;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .Toastify__toast-container--top-right {
                    top: 1em;
                    right: 1em;
                }
                .Toastify__toast-container--bottom-left {
                    bottom: 1em;
                    left: 1em;
                }
                .Toastify__toast-container--bottom-center {
                    bottom: 1em;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .Toastify__toast-container--bottom-right {
                    bottom: 1em;
                    right: 1em;
                }
                .Toastify__toast-container--rtl {
                    right: initial;
                    left: 1em;
                }
                .Toastify__toast-container--rtl.Toastify__toast-container--top-left,
                .Toastify__toast-container--rtl.Toastify__toast-container--top-right,
                .Toastify__toast-container--rtl.Toastify__toast-container--bottom-left,
                .Toastify__toast-container--rtl.Toastify__toast-container--bottom-right {
                    left: 1em;
                    right: initial;
                }
                .Toastify__toast {
                    position: relative;
                    min-height: 64px;
                    box-sizing: border-box;
                    margin-bottom: 1em;
                    padding: 8px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    display: flex;
                    justify-content: space-between;
                    max-height: 800px;
                    overflow: hidden;
                    font-family: sans-serif;
                    cursor: pointer;
                    direction: ltr;
                }
                .Toastify__toast--rtl {
                    direction: rtl;
                }
                .Toastify__toast--close-on-click {
                    cursor: pointer;
                }
                .Toastify__toast--no-close-on-click {
                    cursor: default;
                }
                .Toastify__toast-body {
                    display: flex;
                    align-items: center;
                    flex-grow: 1;
                    padding: 6px;
                    margin: auto 0;
                }
                .Toastify__close-button {
                    color: #fff;
                    font-weight: bold;
                    opacity: 0.7;
                    transition: opacity 0.2s ease-in-out;
                    align-self: flex-start;
                    background: transparent;
                    outline: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                }
                .Toastify__close-button:hover {
                    opacity: 1;
                }
                .Toastify__toast-icon {
                    margin-right: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.5em;
                }
                .Toastify__toast--success {
                    background: #4caf50;
                }
                .Toastify__toast--error {
                    background: #f44336;
                }
                .Toastify__toast--info {
                    background: #2196f3;
                }
                .Toastify__toast--warning {
                    background: #ff9800;
                }
                .Toastify__toast--default {
                    background: #555;
                }
                .Toastify__toast-body {
                    white-space: pre-wrap;
                    word-break: break-word;
                }
            `}</style>

            {/* Background circles */}
            <div className="absolute left-1/4 top-1/4 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_infinite]"></div>
            <div className="absolute right-1/4 bottom-1/4 w-56 h-56 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_2s_infinite]"></div>
            <div className="absolute left-1/2 bottom-1/3 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_4s_infinite]"></div>
            <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-filter backdrop-blur-md"></div>

            <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel - Chat */}
                <div className="flex-grow flex flex-col p-6 border-r border-gray-800 md:w-1/2">
                    <header className="text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-purple-400">RTGS AI Analyst</h1>
                        <p className="text-gray-400 mt-1">Chat with Telangana Open Data</p>
                    </header>

                    <div className="flex-grow flex flex-col rounded-xl bg-black shadow-inner">
                        <div className="flex-grow overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                            {chatHistory.length === 0 && (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
                                    <p>Start chatting or upload a CSV file to get insights.</p>
                                </div>
                            )}
                            {chatHistory.map((chat, index) => (
                                <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xl p-3 rounded-xl shadow-md ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                        {chat.type === 'loading' ? (
                                            <span className="animate-pulse">⏳ Thinking...</span>
                                        ) : chat.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-800">
                            {/* Upload Section */}
                            {!datasetUploaded && (
                            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                                <label className="flex-grow flex items-center px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700 transition-colors justify-center">
                                Select CSV Files
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    multiple
                                    onChange={handleFileChange}
                                />
                                </label>
                                <button
                                onClick={handleUpload}
                                disabled={loading || selectedFiles.length === 0}
                                className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${
                                    loading || selectedFiles.length === 0
                                    ? "bg-gray-700 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                                >
                                {loading ? "Processing..." : "Upload & Analyze"}
                                </button>
                            </div>
                            )}

                            {/* File List with Year Input */}
                            {selectedFiles.length > 0 && (
                            <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                                {selectedFiles.map((file, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-800 text-white rounded-md shadow-sm"
                                >
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                    <input
                                    type="number"
                                    placeholder="Year"
                                    value={years[index] || ""}
                                    onChange={(e) => handleYearChange(index, e.target.value)}
                                    className="w-24 px-2 py-1 text-sm border border-gray-700 bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </li>
                                ))}
                            </ul>
                            )}

                            <div className="flex items-center space-x-4 mt-4">
                                <input
                                    type="text"
                                    className="flex-grow px-4 py-2 bg-black text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                                    placeholder={loading ? 'Thinking...' : 'Type your message...'}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={loading}
                                />
                                <button onClick={handleSendMessage} disabled={loading} className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Insights & Plots */}
                <div className="flex-grow flex flex-col md:w-1/2 p-6 overflow-hidden">
                    
                    {/* Top Box - Insights */}
                    <div className="flex-grow flex flex-col justify-start items-start w-full bg-black border-b border-gray-800 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                        <h2 className="text-xl font-bold text-white mb-2">Insights</h2>
                        {cleanedReady ? (
                            <div className="w-full flex flex-col items-center">
                                <div className="flex justify-center w-full mb-4">
                                    <button
                                        onClick={() => window.open("http://localhost:2601/api/download-cleaned", "_blank")}
                                        className="px-6 py-2 transition-all hover:scale-108 hover:-translate-y-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold text-white mr-4"
                                    >
                                        Download Cleaned Dataset
                                    </button>
                                    <button
                                        onClick={generateInsights}
                                        disabled={loading || insightsGenerated}
                                        className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${
                                            loading || insightsGenerated
                                                ? "bg-gray-700 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {loading ? "Generating..." : "Generate Insights"}
                                    </button>
                                </div>
                                {insightsContent ? (
                                    <div className="text-gray-200 whitespace-pre-wrap">
                                        {insightsContent}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center">Click 'Generate Insights' to begin.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-4">Refined file not generated yet</p>
                        )}
                    </div>

                    {/* Bottom Box - Plots / Graphs */}
                    <div className="flex-grow flex flex-col justify-center items-center w-full bg-black p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                        <h2 className="text-xl font-bold text-white mb-2">Data Visualization</h2>
                        {plotUrl ? (
                            <div className="flex flex-col items-center space-y-4">
                                <img src={plotUrl} alt="Data visualization" className="max-w-full rounded-lg" />
                                <button onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = plotUrl;
                                    link.download = 'data_visualization.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors">
                                    Download Plot
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center">Graphs and charts will appear here after analysis.</p>
                        )}
                    </div>

                </div>
            </div>

            <ToastContainer position="bottom-right" theme="colored" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default Interface;
