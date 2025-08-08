// Example: Express.js app with Blok middleware using registry pattern
const express = require("express");
const { blokMiddleware } = require("../dist/index.js");
const ApiCall = require("@blok-ts/api-call");
const IfElse = require("@blok-ts/if-else");

// Create Express app
const app = express();

// Body parsing middleware
app.use(express.json());

// Define nodes registry (following Express.js pattern)
const nodes = {
	"@blok-ts/api-call": new ApiCall.default(),
	"@blok-ts/if-else": new IfElse.default(),
};

// Define workflows registry (following Express.js pattern)
const workflows = {
	"test-workflow": {
		name: "Test Workflow",
		version: "1.0.0",
		description: "Example workflow for testing",
		// Workflow definition would go here
	},
};

// Add Blok workflow capabilities using registry pattern
app.use(
	"/workflows",
	blokMiddleware({
		nodes: nodes,
		workflows: workflows,
		enableMetrics: true,
		debug: true,
	}),
);

// Existing routes continue working
app.get("/", (req, res) => {
	res.json({
		message: "Express.js server with Blok middleware (registry pattern)",
		usage: {
			endpoint: "POST /workflows/{workflowName}",
			health: "GET /health",
			nodes: `Available nodes: ${Object.keys(nodes).join(", ")}`,
			workflows: `Available workflows: ${Object.keys(workflows).join(", ")}`,
		},
	});
});

app.get("/health", (req, res) => {
	res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`🚀 Express server with Blok middleware running on port ${PORT}`);
	console.log("📋 Registry Pattern: nodes and workflows passed directly to middleware");
	console.log(`📦 Available nodes: ${Object.keys(nodes).length}`);
	console.log(`⚡ Available workflows: ${Object.keys(workflows).length}`);
	console.log(`🔗 Try: curl http://localhost:${PORT}/health`);
});
