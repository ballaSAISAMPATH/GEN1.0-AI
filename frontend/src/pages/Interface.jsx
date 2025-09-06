import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Interface = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [years, setYears] = useState({});
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [plotUrl, setPlotUrl] = useState('');
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        const initialYears = {};
        files.forEach((file, index) => {
            // Attempt to guess year from filename
            const match = file.name.match(/\d{4}/);
            initialYears[index] = match ? match[0] : '';
        });
        setYears(initialYears);
    };

    const handleYearChange = (index, value) => {
        setYears({ ...years, [index]: value });
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select at least one file.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('csvFiles', file);
        });
        formData.append('years', JSON.stringify(Object.values(years)));

        try {
            const response = await axios.post('http://localhost:2601/api/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                toast.success('Data uploaded and processed successfully!');
                setChatHistory([
                    { role: 'ai', content: response.data.insight },
                    { role: 'ai', content: "What would you like to analyze or visualize?" }
                ]);
                // Reset file inputs
                setSelectedFiles([]);
                setYears({});
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                toast.error(`Error: ${response.data.error}`);
                setChatHistory([{ role: 'ai', content: `Error: ${response.data.error}` }]);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(`An error occurred: ${error.response?.data?.error || error.message}`);
            setChatHistory([{ role: 'ai', content: `An error occurred: ${error.response?.data?.error || error.message}` }]);
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

        try {
            const response = await axios.post('http://localhost:2601/api/chat', { message: userMessage });
            if (response.data.plotUrl) {
                setChatHistory((prev) => [...prev, { role: 'ai', content: response.data.text }]);
                setPlotUrl(response.data.plotUrl);
            } else {
                setChatHistory((prev) => [...prev, { role: 'ai', content: response.data.text }]);
                setPlotUrl('');
            }
        } catch (error) {
            console.error('Chat failed:', error);
            toast.error(`An error occurred: ${error.response?.data?.error || error.message}`);
            setChatHistory((prev) => [...prev, { role: 'ai', content: `An error occurred: ${error.response?.data?.error || error.message}` }]);
            setPlotUrl('');
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const renderFileSelection = () => (
        <div className="p-6 bg-black rounded-lg shadow-xl w-full">
            <h2 className="text-xl font-bold text-white mb-4">Upload Datasets</h2>
            <p className="text-gray-400 mb-4 text-sm">Select one or more CSV files and provide the corresponding year for each to get started.</p>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <label className="flex-grow flex items-center px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700 transition-colors justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    Select CSV Files
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" multiple onChange={handleFileChange} />
                </label>
                <button onClick={handleUpload} disabled={loading || selectedFiles.length === 0} className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${loading || selectedFiles.length === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {loading ? 'Processing...' : 'Upload & Analyze'}
                </button>
            </div>
            {selectedFiles.length > 0 && (
                <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                    {selectedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-800 text-white rounded-md shadow-sm">
                            <span className="text-sm font-medium truncate">{file.name}</span>
                            <input
                                type="number"
                                placeholder="Year"
                                value={years[index] || ''}
                                onChange={(e) => handleYearChange(index, e.target.value)}
                                className="w-24 px-2 py-1 text-sm border border-gray-700 bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const handleDownloadPlot = () => {
        if (plotUrl) {
            const link = document.createElement('a');
            link.href = plotUrl;
            link.download = 'data_visualization.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="relative overflow-hidden font-sans antialiased text-gray-100 h-screen w-full flex bg-black">
            {/* Background circles */}
            <div className="absolute left-1/4 top-1/4 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_infinite]"></div>
            <div className="absolute right-1/4 bottom-1/4 w-56 h-56 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_2s_infinite]"></div>
            <div className="absolute left-1/2 bottom-1/3 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-[blob_15s_ease-in-out_4s_infinite]"></div>
            <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-filter backdrop-blur-md"></div>

            <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel - Chat Interface */}
                <div className="flex-grow flex flex-col p-6 border-r border-gray-800 md:w-1/2">
                    <header className="text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-purple-400">RTGS AI Analyst</h1>
                        <p className="text-gray-400 mt-1">Chat with your Telangana Open Data</p>
                    </header>

                    <div className="flex-grow flex flex-col rounded-xl bg-black shadow-inner">
                        <div className="flex-grow overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                            {chatHistory.length === 0 && (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
                                    <p>Upload a CSV file to begin your analysis.</p>
                                </div>
                            )}
                            {chatHistory.map((chat, index) => (
                                <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xl p-3 rounded-xl shadow-md ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                        {chat.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-800">
                            {chatHistory.length > 0 ? (
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        className="flex-grow px-4 py-2 bg-black text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                                        placeholder={loading ? 'Thinking...' : 'Ask a question about the data...'}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={loading}
                                    />
                                    <button onClick={handleSendMessage} disabled={loading} className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                        Send
                                    </button>
                                </div>
                            ) : (
                                renderFileSelection()
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Visualization Display */}
                <div className="flex-grow-0 p-6 md:w-1/2 flex flex-col justify-center items-center">
                    <h2 className="text-xl font-bold text-white mb-4">Data Visualization</h2>
                    <div className="flex items-center justify-center w-full h-full bg-black rounded-xl border border-gray-800 shadow-inner p-4">
                        {plotUrl ? (
                            <div className="flex flex-col items-center space-y-4">
                                <img src={plotUrl} alt="Data visualization" className="max-w-full max-h-full rounded-lg shadow-lg" />
                                <button onClick={handleDownloadPlot} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors">
                                    Download Plot
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center">Charts will appear here after you ask for a visualization.</p>
                        )}
                    </div>
                </div>
            </div>
            {/* Toast Container for notifications */}
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default Interface;