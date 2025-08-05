const fs = require("node:fs");
const path = require("node:path");

// Copy index.html to dist/
if (fs.existsSync("index.html")) {
	const destDir = "dist";
	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir, { recursive: true });
	}
	fs.copyFileSync("index.html", path.join(destDir, "index.html"));
	console.log("Copied index.html to dist/");
}
