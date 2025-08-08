// Copy exact implementation from triggers/http/src/utils/MessageDecode.ts
import type { Context } from "@blok-ts/runner";

export default class MessageDecode {
	requestDecode(body: string): Context {
		try {
			const parsed = JSON.parse(body);
			if (parsed.Message && parsed.Encoding === "BASE64") {
				const decodedMessage = Buffer.from(parsed.Message, "base64").toString("utf-8");
				return JSON.parse(decodedMessage);
			}
			return parsed;
		} catch (error) {
			throw new Error(`Failed to decode message: ${error}`);
		}
	}
}
