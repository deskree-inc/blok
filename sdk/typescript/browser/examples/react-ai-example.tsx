// Example: React frontend calling Python AI nodes for processing
// Validates Business Query 1: "Can a React frontend directly call Blok Python nodes for AI processing?"

import type React from "react";
import { useState } from "react";
import { BlokProvider, useBlokPython3, useBlokWorkflow } from "../src/react";

// Configure Blok client for the app
const blokConfig = {
	host: "https://your-blok-deployment.com",
	token: "your-token-here", // Replace with actual token
};

// Main App Component
function App() {
	return (
		<BlokProvider config={blokConfig}>
			<div className="app">
				<h1>AI-Powered React App</h1>
				<SentimentAnalyzer />
				<ImageProcessor />
				<DataPipeline />
			</div>
		</BlokProvider>
	);
}

// Component demonstrating AI processing with UI state management
function SentimentAnalyzer() {
	const [text, setText] = useState("");
	const [results, setResults] = useState<string[]>([]);

	const { data, loading, error, execute } = useBlokPython3<{ sentiment: string; confidence: number }>(
		"sentiment-analyzer",
	);

	const handleAnalyze = async () => {
		if (!text.trim()) return;

		const result = await execute({
			text: text.trim(),
			model: "bert-base-uncased",
		});

		if (result.success && result.data?.sentiment && result.data?.confidence) {
			setResults((prev) => [
				...prev,
				`"${text}" → ${result.data?.sentiment} (${((result.data?.confidence ?? 0) * 100).toFixed(1)}%)`,
			]);
			setText("");
		}
	};

	return (
		<div className="sentiment-analyzer">
			<h2>AI Sentiment Analysis</h2>
			<div className="input-section">
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Enter text to analyze..."
					rows={3}
				/>
				<button type="button" onClick={handleAnalyze} disabled={loading || !text.trim()}>
					{loading ? "Processing..." : "Analyze Sentiment"}
				</button>
			</div>

			{error && <div className="error">Error: {Array.isArray(error) ? error[0].message : error.message}</div>}

			{data && (
				<div className="current-result">
					<h3>Latest Result:</h3>
					<p>
						Sentiment: <strong>{data.sentiment}</strong>
					</p>
					<p>
						Confidence: <strong>{(data.confidence * 100).toFixed(1)}%</strong>
					</p>
				</div>
			)}

			<div className="history">
				<h3>Analysis History:</h3>
				{results.map((result) => (
					<div key={result} className="history-item">
						<p>{result}</p>
					</div>
				))}
			</div>
		</div>
	);
}

// Component showing Python AI node for image processing
function ImageProcessor() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [results, setResults] = useState<string[]>([]);

	const { data, loading, error, execute } = useBlokPython3<{
		objects: string[];
		confidence: number[];
	}>("image-analyzer");

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const processImage = async () => {
		if (!selectedFile) return;

		// Convert file to base64 for Python processing
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64Image = e.target?.result as string;

			const result = await execute({
				image_data: base64Image,
				model: "yolo-v5",
			});

			if (result.success && result.data?.objects) {
				const detected = result.data.objects
					.map((obj, i) => `${obj}: ${((result.data?.confidence?.[i] ?? 0) * 100).toFixed(1)}%`)
					.join(", ");
				setResults((prev) => [...prev, `${selectedFile.name}: ${detected}`]);
			}
		};
		reader.readAsDataURL(selectedFile);
	};

	return (
		<div className="image-processor">
			<h2>AI Image Analysis</h2>
			<input type="file" accept="image/*" onChange={handleFileSelect} />
			<button type="button" onClick={processImage} disabled={loading || !selectedFile}>
				{loading ? "Processing..." : "Analyze Image"}
			</button>

			{error && <div className="error">Error processing image</div>}

			{data?.objects && (
				<div className="image-results">
					<h3>Objects Detected:</h3>
					{data.objects.map((obj) => (
						<p key={obj}>
							{obj}: {((data.confidence?.[data.objects.indexOf(obj)] ?? 0) * 100).toFixed(1)}% confidence
						</p>
					))}
				</div>
			)}

			<div className="results">
				<h3>Processing History:</h3>
				{results.map((result) => (
					<div key={result} className="history-item">
						<p>{result}</p>
					</div>
				))}
			</div>
		</div>
	);
}

// Component showing complete workflow execution
function DataPipeline() {
	const [inputData, setInputData] = useState("");
	const [results, setResults] = useState<string[]>([]);

	const { data, loading, error, execute } = useBlokWorkflow<{
		processed: boolean;
		steps_completed: string[];
		final_output: string;
	}>();

	// Define a multi-step data processing workflow
	const dataWorkflow = {
		name: "Data Processing Pipeline",
		description: "Clean, analyze, and summarize text data",
		version: "1.0.0",
		trigger: {
			http: {
				method: "POST",
				path: "/process-data",
				accept: "application/json",
			},
		},
		steps: [
			{
				name: "clean",
				node: "text-cleaner",
				type: "runtime.python3",
			},
			{
				name: "analyze",
				node: "sentiment-analyzer",
				type: "runtime.python3",
			},
			{
				name: "summarize",
				node: "text-summarizer",
				type: "runtime.python3",
			},
		],
		nodes: {
			clean: {
				inputs: { remove_urls: true, normalize_whitespace: true },
			},
			analyze: {
				inputs: { model: "roberta-base", return_scores: true },
			},
			summarize: {
				inputs: { max_length: 150, preserve_meaning: true },
			},
		},
	};

	const processPipeline = async () => {
		if (!inputData.trim()) return;

		const result = await execute(dataWorkflow, {
			raw_text: inputData.trim(),
			user_id: "react-user",
		});

		if (result.success && result.data) {
			const steps = result.data.steps_completed?.join(" → ") || "Unknown steps";
			setResults((prev) => [
				...prev,
				`Input: "${inputData}" | Steps: ${steps} | Output: ${result.data?.final_output ?? "unknown"}`,
			]);
			setInputData("");
		}
	};

	return (
		<div className="data-pipeline">
			<h2>Multi-Step AI Pipeline</h2>
			<textarea
				value={inputData}
				onChange={(e) => setInputData(e.target.value)}
				placeholder="Enter text data to process through AI pipeline..."
				rows={4}
			/>
			<button type="button" onClick={processPipeline} disabled={loading || !inputData.trim()}>
				{loading ? "Processing Pipeline..." : "Run AI Pipeline"}
			</button>

			{error && <div className="error">Pipeline error occurred</div>}

			{data && (
				<div className="current-result">
					<h3>Latest Pipeline Result:</h3>
					<p>
						<strong>Processed:</strong> {data.processed ? "Yes" : "No"}
					</p>
					<p>
						<strong>Steps:</strong> {data.steps_completed?.join(" → ") || "None"}
					</p>
					<p>
						<strong>Output:</strong> {data.final_output}
					</p>
				</div>
			)}

			<div className="pipeline-results">
				<h3>Pipeline History:</h3>
				{results.map((result) => (
					<div key={result} className="pipeline-result">
						<p>{result}</p>
					</div>
				))}
			</div>
		</div>
	);
}

export default App;

// Example CSS for styling (would be in separate file)
const styles = `
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.sentiment-analyzer, .image-processor, .data-pipeline {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.input-section textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.input-section button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.input-section button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  background: #ffe6e6;
  color: #d00;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.current-result, .image-results {
  background: #e6ffe6;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
}

.history-item, .pipeline-result {
  background: #f8f9fa;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}
`;
