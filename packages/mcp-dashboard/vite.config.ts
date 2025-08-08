import { defineConfig } from "vite";

export default defineConfig({
	root: "src/web",
	build: {
		outDir: "../../dist/web",
		emptyOutDir: true,
	},
	server: {
		port: 3001,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://localhost:3000",
				ws: true,
			},
		},
	},
});
