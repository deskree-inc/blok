import fs from "node:fs";
import path from "node:path";
import { beforeAll, expect, test } from "vitest";
import Node from "../index";
import ctx from "./helper";

let node: Node;
let rootDir: string;

beforeAll(() => {
	node = new Node();
	node.name = "api-call";
	rootDir = path.resolve(__dirname, ".");
});

// Validate Hello World from Node
test("Render index.html page", async () => {
	const response = await node.handle(ctx(), { react_app: "./dist/app/index.merged.min.js" });

	expect(response.success).toEqual(true);

	// Check that the response contains the essential React components
	const html = response.data as string;
	expect(html).toContain('<div id="root"></div>');
	expect(html).toContain('script type="text/babel"');
	expect(html).toContain("React.createElement");
	expect(html).toContain("ReactDOM.render");
	expect(html).toContain("ChatBot");
});
