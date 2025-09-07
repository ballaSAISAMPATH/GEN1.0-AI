import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Interface = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [years, setYears] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [plotUrl, setPlotUrl] = useState("");
  const [datasetUploaded, setDatasetUploaded] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cleanedReady, setCleanedReady] = useState(false);
  const [insightsContent, setInsightsContent] = useState("");
  const [insightsGenerated, setInsightsGenerated] = useState(false);
useEffect(() => {
  const textarea = document.getElementById("chat-input");
  if (textarea) {
    textarea.style.height = "auto"; // reset height
    textarea.style.height = textarea.scrollHeight + "px"; // set to content height
  }
}, [message]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const initialYears = {};
    files.forEach((file, index) => {
      const match = file.name.match(/\d{4}/);
      initialYears[index] = match ? match[0] : "";
    });
    setYears(initialYears);
  };

  const handleYearChange = (index, value) => {
    setYears({ ...years, [index]: value });
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:2601/user/api/insights"
      );
      if (response.data.success) {
        setInsightsContent(response.data.insight);
        setInsightsGenerated(true);
        toast.success("Insights generated successfully!");
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("csvFiles", file));
    formData.append("years", JSON.stringify(Object.values(years)));

    try {
      const response = await axios.post(
        "http://localhost:2601/api/upload-csv",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        toast.success("Dataset uploaded successfully!");
        setDatasetUploaded(true);
        setCleanedReady(true);
        setInsightsGenerated(false);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "Dataset uploaded successfully! You can now ask questions.",
            type: "info",
          },
        ]);
        setSelectedFiles([]);
        setYears({});
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message;
    setMessage("");
    setLoading(true);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "ai", content: "", type: "loading" },
    ]);

    const placeholderIndex = chatHistory.length + 1;

    try {
      const response = await axios.post("http://localhost:2601/user/api/chat", {
        message: userMessage,
      });

      const newChatHistory = [
        ...chatHistory,
        { role: "user", content: userMessage },
      ];
      console.log(response.data.text);

      if (response.data.plotUrl) {
        setPlotUrl(response.data.plotUrl);
        newChatHistory.push({ role: "ai", content: response.data.text });
      } else {
        newChatHistory.push({ role: "ai", content: response.data.text });
        setPlotUrl("");
      }

      setChatHistory(newChatHistory);
    } catch (error) {
      console.error("Chat failed:", error);
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[placeholderIndex] = {
          role: "ai",
          content: `Error: ${error.response?.data?.error || error.message}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="relative overflow-hidden font-sans antialiased text-gray-100 h-screen w-full flex flex-col md:flex-row bg-black">
      {/* Scrollbar Color */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0f172a;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #1e40af;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #3b82f6;
        }
      `}</style>
      <div className="relative z-10 w-full h-full flex flex-col fle-wrap md:flex-row overflow-hidden">
        {/* Left Chat Panel */}
        <div className="flex flex-col md:w-2/3 h-full border-r border-gray-800 p-4">
          <header className="text-center mb-4">
            <h1 className="text-2xl font-bold text-purple-600">
              RTGS AI Analyst
            </h1>
            <p className="text-gray-400 text-sm">
              Chat with Telangana Open Data
            </p>
          </header>
          <div className="flex-grow border-y border-y-gray-500 bg-black/50 rounded-xl shadow-inner overflow-y-auto p-2">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Start chatting or upload a CSV file.
                <br />
                enter text like " hi , how are you? " and look how the custom AI{" "}
                <br />
                or any query relevant to the dataset after uploading..{" "}
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    chat.role === "user" ? "justify-end" : "justify-start"
                  } mb-2`}
                >
                  <div
                    className={`max-w-3/4 p-2 rounded-lg hover:scale-102 transition-all ${
                      chat.role === "user"
                        ? "bg-blue-600 text-white border-e-2 border-e-white"
                        : "bg-gray-800 text-gray-200 border-s-2 border-s-white"
                    }`}
                  >
                    {chat.type === "loading" ? (
                      <span className="animate-pulse">⏳ Thinking...</span>
                    ) : (
                      <div>
                        {chat.content.split("\n").map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef}></div>
          </div>

          <div className="mt-2">
            {!datasetUploaded && (
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-2">
                <label className="flex-grow flex items-center justify-center px-4 py-2 bg-purple-600 rounded-md cursor-pointer hover:bg-purple-700">
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
                  className={`px-4 py-2 rounded-md font-semibold text-white ${
                    loading || selectedFiles.length === 0
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Processing..." : "Upload & Analyze"}
                </button>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <ul className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-2 bg-blue-800 rounded-md"
                  >
                    <span className="truncate text-sm">{file.name}</span>
                    <input
                      type="number"
                      placeholder="Year"
                      value={years[idx] || ""}
                      onChange={(e) => handleYearChange(idx, e.target.value)}
                      className="w-20 px-1 py-0.5 text-sm rounded-md border border-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-black text-white"
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="flex mt-2 space-x-2">
              <textarea
              id="chat-input"
  placeholder={loading ? "Thinking..." : "Type any query.."}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      handleSendMessage();
    }
  }}
  rows={1}
  className="w-full px-3 py-2 rounded-md border border-gray-700 bg-black text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none overflow-hidden"
/>

              <button
                onClick={handleSendMessage}
                disabled={loading}
                className={`px-4 py-1 rounded-md text-white font-semibold ${
                  loading
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col md:w-2/3 h-full p-4 space-y-2 overflow-hidden">
          {/* Insights */}
         <div className="flex-1 overflow-y-auto bg-black p-4 rounded-lg border border-gray-800">
  <h2 className="text-2xl font-bold text-purple-500 mb-4">Insights</h2>

  {cleanedReady ? (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() =>
            window.open("http://localhost:2601/api/download-cleaned", "_blank")
          }
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold shadow-md transition"
        >
          Download Cleaned Dataset
        </button>
        <button
          onClick={generateInsights}
          disabled={loading || insightsGenerated}
          className={`px-4 py-2 rounded-md font-semibold text-white shadow-md transition ${
            loading || insightsGenerated
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Generate Insights"}
        </button>
      </div>

      {insightsContent ? (
        <div className="bg-black border-y p-4 rounded-lg shadow-inner text-gray-100 space-y-4">
  {insightsContent.split("\n\n").map((section, idx) => (
    <div key={idx} className="space-y-2">
      {section.split("\n").map((line, index) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3
              key={index}
              className="text-lg font-bold text-sky-400 border-s-4 p-2 border-sky-400"
            >
              {line.replace(/\*\*/g, "")}
            </h3>
          );
        }
        return <p key={index} className="text-gray-300">{line}</p>;
      })}
    </div>
  ))}
</div>
      ) : (
        <p className="text-gray-400">Click 'Generate Insights' to begin.</p>
      )}
    </>
  ) : (
    <p className="text-gray-500 space-y-1">
      - Refined file not generated yet.
      <br />
      - Insights generation appears once the dataset is uploaded.
    </p>
  )}
</div>


          {/* Plots */}
          <div className="flex-1 overflow-y-auto bg-black p-2 rounded-md">
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              Data Visualization
            </h2>
            {plotUrl ? (
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={plotUrl}
                  alt="Data visualization"
                  className="max-w-full rounded-md"
                />
                <button
                  onClick={() => {
                    const filename = plotUrl.split("/").pop();
                    const downloadUrl = `http://localhost:2601/download-plot/${filename}`;
                    window.open(downloadUrl, "_blank");
                  }}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                  Download Plot
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center p-20">
                Charts and graphs will be displayed here upon request. You can also generate them by specifying the type, such as a bar, pie, line, scatter, histogram, or heatmap.
              </p>
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        theme="colored"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Interface;
