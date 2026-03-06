import type ErrorContext from "./types/ErrorContext";
import type ParamsDictionary from "./types/ParamsDictionary";

// Custom error class with extended context
export default class GlobalError extends Error {
    public context: ErrorContext = { message: "" };

    constructor(msg: string | undefined) {
        super(msg);
        Object.setPrototypeOf(this, GlobalError.prototype);

        this.context.message = msg as string;
    }

    // Set error code
    setCode(code?: number) {
        this.context.code = code;
    }

    // Set JSON payload
    setJson(json?: Record<string, unknown>) {
        this.context.json = json as ParamsDictionary;
    }

    // Set stack trace
    setStack(stack?: string) {
        this.context.stack = stack;
    }

    // Set error name
    setName(name?: string) {
        this.context.name = name;
    }

    // Check if JSON payload exists
    hasJson(): boolean {
        return this.context.json !== undefined;
    }

    // String representation of error
    override toString(): string {
        if (this.context.json) return JSON.stringify(this.context.json);
        return this.context.message as string;
    }
}