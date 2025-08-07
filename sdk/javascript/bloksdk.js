class BlokSDK {
	createHttpClient(host, token, debug = false) {
		const _host = host || "http://localhost:4000";
		const _token = token || "";

		if (!_host.includes("http://") && !_host.includes("https://")) {
			throw new Error("Invalid host format. Please provide a valid host with http:// or https://");
		}

		return new BlokSDKClient({
			host: _host,
			token: _token,
			debug: debug,
		});
	}
}

class BlokSDKClient {
	constructor(config) {
		this.host = config.host;
		this.token = config.token;

		this.runtimes = ["python3", "nodejs"];
		this.version = "1.0.0";
		this.defaultHeaders = {
			Authorization: `Bearer ${this.token}`,
			"x-blok-execute-node": "true",
			"Content-Type": "application/json",
		};
		this.customHeaders = {};
		this.debug = config.debug || false;
	}

	setHeaders(headers) {
		this.customHeaders = { ...headers };
	}

	async python3(nodeName, inputs) {
		return await this.call("runtime.python3", nodeName, inputs);
	}

	async nodejs(nodeName, inputs, type = "module") {
		return await this.call(type, nodeName, inputs);
	}

	async call(runtime, nodeName, inputs) {
		const requestHeader = { ...this.defaultHeaders, ...this.customHeaders };
		if (this.debug) console.log("Request Headers", JSON.stringify(requestHeader));

		const workflow = {
			name: "Remote Node",
			description: "Execution of remote node",
			version: "1.0.0",
			trigger: {
				http: {
					method: "POST",
					path: "*",
					accept: "application/json",
				},
			},
			steps: [
				{
					name: "node",
					node: nodeName,
					type: runtime,
				},
			],
			nodes: {
				node: {
					inputs: inputs,
				},
			},
		};

		if (this.debug) console.log("Request Workflow", JSON.stringify(workflow));

		const base64Workflow = btoa(JSON.stringify({ request: {}, workflow: workflow }));

		const message = {
			Name: nodeName,
			Message: base64Workflow,
			Encoding: "BASE64",
			Type: "JSON",
		};

		if (this.debug) console.log("Request Message", JSON.stringify(message));

		try {
			const sdk_response = {
				success: false,
				data: null,
				rawData: null,
				errors: null,
				contentType: null,
				status: null,
			};

			const fetchUrl = `${this.host}/${message.Name}`;
			if (this.debug) console.log("Fetch URL", fetchUrl);

			const response = await fetch(fetchUrl, {
				method: "POST",
				headers: requestHeader,
				body: JSON.stringify(message),
			});

			const contentType = response.headers.get("content-type");
			sdk_response.contentType = contentType;

			if (!response.ok) {
				sdk_response.success = false;

				if (contentType?.includes("application/json")) {
					const responseJson = await response.json();
					sdk_response.errors = Array.isArray(responseJson)
						? responseJson.map((error) => {
								return {
									status: response.status,
									...error,
								};
							})
						: [
								{
									status: response.status,
									...responseJson,
								},
							];
				} else {
					sdk_response.errors = {
						status: response.status,
						message: response.statusText,
					};
				}

				return sdk_response;
			}

			sdk_response.success = true;
			sdk_response.status = response.status;

			if (contentType?.includes("application/json")) {
				const responseJson = await response.json();
				sdk_response.data = responseJson;
				return sdk_response;
			}
			if (contentType.includes("text/")) {
				const responseText = await response.text();
				sdk_response.rawData = responseText;
				return sdk_response;
			}
			if (
				contentType.includes("application/pdf") ||
				contentType.includes("application/octet-stream") ||
				contentType.includes("image/") ||
				contentType.includes("application/zip")
			) {
				const responseBlob = await response.blob();
				sdk_response.rawData = responseBlob;
				return sdk_response;
			}

			const responseRaw = await response.text();
			sdk_response.rawData = responseRaw;
			return sdk_response;
		} catch (error) {
			return {
				success: false,
				data: null,
				rawData: null,
				contentType: null,
				errors: [
					{
						status: 500,
						message: error.message || "Unexpected error",
					},
				],
			};
		}
	}
}
