const node_file = `
import ApiCall from "@blok-ts/api-call";
import IfElse from "@blok-ts/if-else";
import type { NodeBase } from "@blok-ts/runner";
import ExampleNodes from "./nodes/examples";

const nodes: {
	[key: string]: NodeBase;
} = {
	"@blok-ts/api-call": new ApiCall(),
	"@blok-ts/if-else": new IfElse(),
	...ExampleNodes,
};

export default nodes;
`;

const package_dependencies = {
	ai: "^4.1.50",
	"@ai-sdk/openai": "^1.2.0",
	ejs: "^3.1.10",
	pg: "^8.13.3",
	mongodb: "^6.14.2",
};

const package_dev_dependencies = {
	"@types/ejs": "^3.1.5",
	"@types/pg": "^8.11.11",
};

const python3_file = `
from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback

class Node(BlokService):
    def __init__(self):
        BlokService.__init__(self)
        self.input_schema = {}
        self.output_schema = {}

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()

        try:
            response.set_success({ "message": "Hello World from Python3!" })
        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)

            stack_trace = traceback.format_exc()
            err.setStack(stack_trace)
            response.success = False
            response.set_error(err)

        return response
`;

const examples_url = `
Examples:
1- Open "workflow-docs.json" in your browser at http://localhost:4000/workflow-docs
2- Open "db-manager.json" in your browser at http://localhost:4000/db-manager
3- Open "dashboard-gen.json" in your browser at http://localhost:4000/dashboard-gen
4- Open "countries.json" in your browser at http://localhost:4000/countries

For more documentation, visit src/nodes/examples/README.md. The first three examples require a PostgreSQL database to function.
`;

const workflow_template = `
{
	"name": "",
	"description": "",
	"version": "1.0.0",
	"trigger": {
		"http": {
			"method": "GET",
			"path": "/",
			"accept": "application/json"
		}
	},
	"steps": [
		{
			"name": "node-name",
			"node": "node-module-name",
			"type": "module"
		}
	],
	"nodes": {
		"name": {
			"inputs": {

			}
		}
	}
}
`;

const supervisord_nodejs = `
[supervisord]
nodaemon=true

[program:nodejs_app]
command=npm start
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/nodejs.err.log
stdout_logfile=/var/log/nodejs.out.log
`;

const supervisord_python = `
[program:python_app]
command=python3 /app/.blokctl/runtimes/python3/server.py
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/python.err.log
stdout_logfile=/var/log/python.out.log
`;
export {
	node_file,
	package_dependencies,
	package_dev_dependencies,
	python3_file,
	examples_url,
	workflow_template,
	supervisord_nodejs,
	supervisord_python,
};
