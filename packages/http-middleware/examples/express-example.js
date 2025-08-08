// Express.js example with Blok middleware
const express = require("express");
const { blokMiddleware } = require("../dist/index.js");

const app = express();

// Body parsing middleware
app.use(express.json());

// Add Blok workflow capabilities
app.use(
	"/workflows",
	blokMiddleware({
		workflowsPath: "./workflows",
		enableMetrics: true,
		debug: true,
	}),
);

// Existing routes continue working
app.get("/", (req, res) => {
	res.json({
		message: "Express.js server with Blok middleware",
		endpoints: {
			workflows: "POST /workflows/{workflowName}",
			health: "GET /health",
		},
	});
});

app.get("/health", (req, res) => {
	res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/users", (req, res) => {
	res.json({
		users: [
			{ id: 1, name: "John Doe" },
			{ id: 2, name: "Jane Smith" },
		],
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`🚀 Express server with Blok workflows running on port ${PORT}`);
	console.log(`📋 Try: curl http://localhost:${PORT}/health`);
	console.log(`⚡ Workflow endpoint: POST http://localhost:${PORT}/workflows/{workflowName}`);
});
