import { createServer } from "node:http";
import path from "node:path";
import express from "express";
import { WebSocketServer } from "ws";
import { DashboardAPI } from "./api";
import { MetricsCollector } from "./metrics";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize metrics collector and API
const metricsCollector = new MetricsCollector();
const dashboardAPI = new DashboardAPI(metricsCollector);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../web")));

// API routes
app.use("/api", dashboardAPI.getRouter());

// WebSocket for real-time metrics
wss.on("connection", (ws) => {
	console.log("Dashboard client connected");

	// Send initial metrics
	metricsCollector.getMetrics().then((metrics) => {
		ws.send(JSON.stringify({ type: "metrics", data: metrics }));
	});

	// Set up real-time updates
	const interval = setInterval(async () => {
		try {
			const metrics = await metricsCollector.getMetrics();
			ws.send(JSON.stringify({ type: "metrics", data: metrics }));
		} catch (error) {
			console.error("Error sending metrics:", error);
		}
	}, 5000); // Update every 5 seconds

	ws.on("close", () => {
		console.log("Dashboard client disconnected");
		clearInterval(interval);
	});
});

// Start server
const PORT = process.env.DASHBOARD_PORT || 3000;
server.listen(PORT, () => {
	console.log(`MCP Dashboard running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("Shutting down MCP Dashboard...");
	server.close(() => {
		process.exit(0);
	});
});
