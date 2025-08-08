# Blok MCP Observatory Dashboard

Real-time performance monitoring and observability dashboard for Blok MCP ecosystem.

## Overview

The MCP Observatory Dashboard provides comprehensive monitoring and observability for the Blok MCP system, offering real-time insights into tool usage, performance metrics, system health, and error tracking.

## Features

### 📊 Real-time Monitoring
- Live WebSocket updates every 5 seconds
- Real-time performance charts and metrics
- System health status indicators
- Connection status monitoring with automatic reconnection

### 🎯 Performance Metrics
- Tool execution success rates
- Average response times
- Requests per minute tracking
- Popular tools analysis
- Historical performance trends

### 🔍 System Health
- HTTP Trigger status monitoring
- Available tools count
- System component health checks
- Last health check timestamps

### 📈 Visual Analytics
- Interactive charts using Chart.js
- Tool usage over time visualization
- Success rate trend analysis
- Popular tools with usage bars

### ⚠️ Error Tracking
- Error frequency analysis
- Error occurrence timestamps
- Detailed error summaries
- Recent execution status

### 🚀 Recent Activity
- Live feed of tool executions
- Execution duration tracking
- Success/failure indicators
- Tool type identification (Workflow/Node)

## Installation

```bash
cd packages/mcp-dashboard
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run serve
```

## Configuration

### Environment Variables

```bash
# HTTP Trigger URL (default: http://localhost:4000)
BLOK_HTTP_TRIGGER_URL=http://localhost:4000

# Dashboard server port (default: 3000)
DASHBOARD_PORT=3000

# MCP Server URL (default: http://localhost:4001)
MCP_SERVER_URL=http://localhost:4001
```

## Architecture

### Backend Components

- **Server** (`src/server/index.ts`): Express server with WebSocket support
- **Metrics Collector** (`src/server/metrics.ts`): Performance data collection and analysis
- **API Routes** (`src/server/api.ts`): REST API endpoints for dashboard data

### Frontend Components

- **Dashboard UI** (`src/web/index.html`): Responsive web interface with Tailwind CSS
- **JavaScript Client** (`src/web/dashboard.js`): Real-time dashboard functionality
- **Charts Integration**: Chart.js for data visualization

## API Endpoints

### GET /api/metrics
Get comprehensive system metrics

### GET /api/tools/:toolName/history
Get execution history for a specific tool

### GET /api/errors
Get error summary and analysis

### POST /api/executions
Record a new tool execution (for integrations)

### GET /api/health
Dashboard health check

### POST /api/maintenance/clear-old-metrics
Clear old metrics data (maintenance)

## WebSocket Events

The dashboard uses WebSocket for real-time updates:

```javascript
{
  "type": "metrics",
  "data": {
    "performance": { ... },
    "health": { ... },
    "realTimeData": { ... }
  }
}
```

## Integration

### Recording Executions

External systems can record tool executions via the API:

```bash
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "workflow_example",
    "timestamp": "2025-01-08T12:00:00Z",
    "duration": 150,
    "success": true,
    "clientId": "claude-desktop"
  }'
```

### Metrics Collection

The dashboard automatically monitors:
- Tool execution performance
- System component health
- Error rates and patterns
- Usage analytics

## Development Guidelines

### Adding New Metrics

1. Update `MetricsCollector` class in `src/server/metrics.ts`
2. Add corresponding API endpoints in `src/server/api.ts`
3. Update dashboard UI in `src/web/dashboard.js`

### Customizing UI

- Modify `src/web/index.html` for layout changes
- Update `src/web/dashboard.js` for functionality changes
- Tailwind CSS classes for styling

## Monitoring Best Practices

### Performance
- Dashboard updates every 5 seconds by default
- Metrics are stored in memory (last 1000 executions)
- Old metrics auto-cleanup after 24 hours

### Scalability
- WebSocket connections are lightweight
- Charts show last 20 data points for performance
- API responses are optimized for quick rendering

## Troubleshooting

### Connection Issues
- Check HTTP Trigger is running on configured port
- Verify WebSocket proxy configuration
- Check browser console for connection errors

### Missing Data
- Ensure HTTP Trigger `/mcp/metadata` endpoint is accessible
- Check API endpoint responses
- Verify metrics collection is working

### Performance Issues
- Consider reducing update frequency for large deployments
- Implement metrics persistence for production use
- Monitor memory usage with large execution volumes

## Production Deployment

1. Build the dashboard: `npm run build`
2. Configure environment variables
3. Use process manager (PM2, systemd) for server
4. Configure reverse proxy (nginx, Apache) if needed
5. Set up monitoring for the dashboard itself

## Future Enhancements

- [ ] Metrics persistence to database
- [ ] User authentication and authorization
- [ ] Alerting and notification system
- [ ] Advanced filtering and search
- [ ] Export functionality for reports
- [ ] Custom dashboard layouts
- [ ] Multi-instance monitoring
