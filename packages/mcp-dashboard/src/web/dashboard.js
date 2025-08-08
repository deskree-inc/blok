class MCPDashboard {
	constructor() {
		this.ws = null;
		this.charts = {};
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;

		this.initializeCharts();
		this.setupEventListeners();
		this.connectWebSocket();
		this.loadInitialData();
	}

	initializeCharts() {
		// Usage Chart
		const usageCtx = document.getElementById("usage-chart").getContext("2d");
		this.charts.usage = new Chart(usageCtx, {
			type: "line",
			data: {
				labels: [],
				datasets: [
					{
						label: "Tool Executions",
						data: [],
						borderColor: "rgb(59, 130, 246)",
						backgroundColor: "rgba(59, 130, 246, 0.1)",
						tension: 0.1,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
					},
				},
				plugins: {
					legend: {
						display: false,
					},
				},
			},
		});

		// Success Rate Chart
		const successCtx = document.getElementById("success-chart").getContext("2d");
		this.charts.success = new Chart(successCtx, {
			type: "line",
			data: {
				labels: [],
				datasets: [
					{
						label: "Success Rate %",
						data: [],
						borderColor: "rgb(34, 197, 94)",
						backgroundColor: "rgba(34, 197, 94, 0.1)",
						tension: 0.1,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						max: 100,
					},
				},
				plugins: {
					legend: {
						display: false,
					},
				},
			},
		});
	}

	setupEventListeners() {
		document.getElementById("refresh-btn").addEventListener("click", () => {
			this.loadInitialData();
		});
	}

	connectWebSocket() {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${protocol}//${window.location.host}/ws`;

		try {
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log("WebSocket connected");
				this.updateConnectionStatus(true);
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === "metrics") {
						this.updateDashboard(data.data);
					}
				} catch (error) {
					console.error("Error parsing WebSocket message:", error);
				}
			};

			this.ws.onclose = () => {
				console.log("WebSocket disconnected");
				this.updateConnectionStatus(false);
				this.attemptReconnect();
			};

			this.ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				this.updateConnectionStatus(false);
			};
		} catch (error) {
			console.error("Failed to connect WebSocket:", error);
			this.updateConnectionStatus(false);
			this.attemptReconnect();
		}
	}

	attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

			setTimeout(() => {
				this.connectWebSocket();
			}, 2000 * this.reconnectAttempts); // Exponential backoff
		} else {
			console.log("Max reconnection attempts reached. Please refresh the page.");
			this.updateConnectionStatus(false, "Connection failed");
		}
	}

	updateConnectionStatus(connected, message = null) {
		const statusElement = document.getElementById("connection-status");
		const textElement = document.getElementById("connection-text");

		if (connected) {
			statusElement.className = "w-3 h-3 rounded-full bg-green-500 mr-2";
			textElement.textContent = "Connected";
		} else {
			statusElement.className = "w-3 h-3 rounded-full bg-red-500 mr-2";
			textElement.textContent = message || "Disconnected";
		}
	}

	async loadInitialData() {
		try {
			const response = await fetch("/api/metrics");
			if (response.ok) {
				const data = await response.json();
				this.updateDashboard(data);
			} else {
				console.error("Failed to load initial data:", response.statusText);
			}
		} catch (error) {
			console.error("Error loading initial data:", error);
		}
	}

	updateDashboard(metrics) {
		// Update health indicators
		this.updateHealthIndicators(metrics.health);

		// Update performance metrics
		this.updatePerformanceCards(metrics.performance);

		// Update charts
		this.updateCharts(metrics);

		// Update popular tools
		this.updatePopularTools(metrics.performance.popularTools);

		// Update recent activity
		this.updateRecentActivity(metrics.performance.recentExecutions);

		// Update error summary
		this.updateErrorSummary(metrics);
	}

	updateHealthIndicators(health) {
		const indicator = document.getElementById("http-trigger-indicator");
		const status = document.getElementById("http-trigger-status");
		const toolsCount = document.getElementById("tools-count");

		// Update HTTP Trigger status
		status.textContent = health.httpTriggerStatus.charAt(0).toUpperCase() + health.httpTriggerStatus.slice(1);

		switch (health.httpTriggerStatus) {
			case "online":
				indicator.className = "w-2 h-2 rounded-full bg-green-500 mr-2";
				break;
			case "degraded":
				indicator.className = "w-2 h-2 rounded-full bg-yellow-500 mr-2";
				break;
			default:
				indicator.className = "w-2 h-2 rounded-full bg-red-500 mr-2";
		}

		// Update tools count
		toolsCount.textContent = health.toolsAvailable.toString();
	}

	updatePerformanceCards(performance) {
		document.getElementById("success-rate").textContent = `${performance.successRate}%`;
		document.getElementById("avg-duration").textContent = `${performance.averageDuration}ms`;
	}

	updateCharts(metrics) {
		const now = new Date();
		const timeLabel = now.toLocaleTimeString();

		// Update usage chart
		const usageChart = this.charts.usage;
		usageChart.data.labels.push(timeLabel);
		usageChart.data.datasets[0].data.push(metrics.realTimeData.requestsPerMinute);

		// Keep only last 20 data points
		if (usageChart.data.labels.length > 20) {
			usageChart.data.labels.shift();
			usageChart.data.datasets[0].data.shift();
		}

		usageChart.update("none");

		// Update success rate chart
		const successChart = this.charts.success;
		successChart.data.labels.push(timeLabel);
		successChart.data.datasets[0].data.push(metrics.performance.successRate);

		// Keep only last 20 data points
		if (successChart.data.labels.length > 20) {
			successChart.data.labels.shift();
			successChart.data.datasets[0].data.shift();
		}

		successChart.update("none");
	}

	updatePopularTools(popularTools) {
		const container = document.getElementById("popular-tools");

		if (popularTools.length === 0) {
			container.innerHTML = '<p class="text-gray-500 text-center">No data available</p>';
			return;
		}

		const maxCount = Math.max(...popularTools.map((tool) => tool.count));

		container.innerHTML = popularTools
			.map((tool) => {
				const percentage = (tool.count / maxCount) * 100;
				const toolType = tool.name.startsWith("workflow_") ? "Workflow" : "Node";
				const displayName = tool.name.replace(/^(workflow_|node_)/, "");

				return `
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">${displayName}</span>
              <span class="text-sm text-gray-500">${tool.count} calls</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                   style="width: ${percentage}%"></div>
            </div>
            <div class="mt-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                ${toolType}
              </span>
            </div>
          </div>
        </div>
      `;
			})
			.join("");
	}

	updateRecentActivity(recentExecutions) {
		const container = document.getElementById("recent-activity");

		if (recentExecutions.length === 0) {
			container.innerHTML = '<p class="text-gray-500 text-center">No recent activity</p>';
			return;
		}

		container.innerHTML = recentExecutions
			.slice(0, 10)
			.map((execution) => {
				const time = new Date(execution.timestamp).toLocaleTimeString();
				const toolType = execution.toolName.startsWith("workflow_") ? "Workflow" : "Node";
				const displayName = execution.toolName.replace(/^(workflow_|node_)/, "");
				const statusColor = execution.success ? "text-green-600" : "text-red-600";
				const statusIcon = execution.success ? "✓" : "✗";

				return `
        <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
          <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
              <span class="text-lg ${statusColor}">${statusIcon}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">${displayName}</p>
              <p class="text-xs text-gray-500">${toolType} • ${execution.duration}ms</p>
            </div>
          </div>
          <div class="text-xs text-gray-400">
            ${time}
          </div>
        </div>
      `;
			})
			.join("");
	}

	async updateErrorSummary(metrics) {
		try {
			const response = await fetch("/api/errors");
			if (response.ok) {
				const errors = await response.json();
				const container = document.getElementById("error-summary");

				if (errors.length === 0) {
					container.innerHTML = '<p class="text-green-600 text-center">No errors in recent executions ✓</p>';
					return;
				}

				container.innerHTML = errors
					.slice(0, 5)
					.map((error) => {
						const lastOccurrence = new Date(error.lastOccurrence).toLocaleString();

						return `
            <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800">${error.error}</p>
                <p class="text-xs text-red-600 mt-1">Last occurred: ${lastOccurrence}</p>
              </div>
              <div class="ml-3">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ${error.count} occurrences
                </span>
              </div>
            </div>
          `;
					})
					.join("");
			}
		} catch (error) {
			console.error("Error loading error summary:", error);
		}
	}
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
	new MCPDashboard();
});
