import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import HttpTrigger from "../src/runner/HttpTrigger";

describe("MCP Metadata Endpoint", () => {
	let httpTrigger: HttpTrigger;
	let app: Express;

	beforeAll(() => {
		// Disable auto-run for testing
		process.env.DISABLE_TRIGGER_RUN = "true";
		httpTrigger = new HttpTrigger();
		app = httpTrigger.getApp();
	});

	afterAll(() => {
		process.env.DISABLE_TRIGGER_RUN = undefined;
	});

	it("should return available workflows and nodes", async () => {
		const response = await request(app).get("/mcp/metadata").expect(200);

		expect(response.body).toHaveProperty("workflows");
		expect(response.body).toHaveProperty("nodes");
		expect(Array.isArray(response.body.workflows)).toBe(true);
		expect(Array.isArray(response.body.nodes)).toBe(true);
	});

	it("should include business value in tool descriptions", async () => {
		const response = await request(app).get("/mcp/metadata").expect(200);

		if (response.body.workflows.length > 0) {
			expect(response.body.workflows[0]).toHaveProperty("businessValue");
			expect(response.body.workflows[0]).toHaveProperty("description");
			expect(response.body.workflows[0]).toHaveProperty("name");
			expect(response.body.workflows[0]).toHaveProperty("category");
			expect(response.body.workflows[0].category).toBe("workflow");
		}

		if (response.body.nodes.length > 0) {
			expect(response.body.nodes[0]).toHaveProperty("businessValue");
			expect(response.body.nodes[0]).toHaveProperty("description");
			expect(response.body.nodes[0]).toHaveProperty("name");
			expect(response.body.nodes[0]).toHaveProperty("category");
			expect(response.body.nodes[0].category).toBe("node");
		}
	});

	it("should return proper JSON structure", async () => {
		const response = await request(app).get("/mcp/metadata").expect(200).expect("Content-Type", /json/);

		// Validate workflow structure
		if (response.body.workflows.length > 0) {
			const workflow = response.body.workflows[0];
			expect(workflow).toHaveProperty("name");
			expect(workflow).toHaveProperty("description");
			expect(workflow).toHaveProperty("inputs");
			expect(workflow).toHaveProperty("businessValue");
			expect(workflow).toHaveProperty("category");
			expect(typeof workflow.inputs).toBe("object");
		}

		// Validate node structure
		if (response.body.nodes.length > 0) {
			const node = response.body.nodes[0];
			expect(node).toHaveProperty("name");
			expect(node).toHaveProperty("description");
			expect(node).toHaveProperty("inputs");
			expect(node).toHaveProperty("runtime");
			expect(node).toHaveProperty("businessValue");
			expect(node).toHaveProperty("category");
			expect(typeof node.inputs).toBe("object");
		}
	});
});
