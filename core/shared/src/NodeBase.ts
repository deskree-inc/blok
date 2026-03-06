import _ from "lodash";

import GlobalError from "./GlobalError";
import type Context from "./types/Context";
import type ErrorContext from "./types/ErrorContext";
import type FunctionContext from "./types/FunctionContext";
import type NodeConfigContext from "./types/NodeConfigContext";
import type ParamsDictionary from "./types/ParamsDictionary";
import type ResponseContext from "./types/ResponseContext";
import type Step from "./types/Step";
import type VarsContext from "./types/VarsContext";
import mapper from "./utils/Mapper";

// Abstract base class for node processing
export default abstract class NodeBase {
    public flow = false;
    public name = "";
    public contentType = "";
    public active = true;
    public stop = false;
    public originalConfig: ParamsDictionary = {};
    public set_var = false;

    // Main process method
    public async process(ctx: Context, step?: Step): Promise<ResponseContext> {
        let response: ResponseContext = {
            success: true,
            data: null,
            error: null,
        };

        const config: NodeConfigContext = ctx.config as unknown as NodeConfigContext;
        this.originalConfig = _.cloneDeep(config[this.name]);
        this.blueprintMapper(config[this.name], ctx);

        response = await this.run(ctx);

        if (response.error) throw response.error;
        ctx.response = response;

        return response;
    }

    // Process flow method with error handling
    public async processFlow(ctx: Context): Promise<ResponseContext> {
        let response: ResponseContext = {
            success: true,
            data: null,
            error: null,
        };

        try {
            const config: NodeConfigContext = ctx.config as unknown as NodeConfigContext;
            this.blueprintMapper(config[this.name], ctx);

            response = await this.run(ctx);
        } catch (error: unknown) {
            response.error = this.setError(error as ErrorContext);
            response.success = false;
            ctx.response = response;
        }

        return response;
    }

    // Abstract run method to be implemented by subclasses
    abstract run(ctx: Context): Promise<ResponseContext>;

    // Placeholder for running steps (should be implemented by subclasses)
    public runSteps(step: Step | Step[], ctx: Context): Promise<Context> {
        console.error("[Error] runSteps method is not implemented.");
        throw new Error("runSteps method is not implemented.");
    }

    // Run JavaScript code in a controlled context
    public runJs(
        str: string,
        ctx: Context,
        data: ParamsDictionary = {},
        func: FunctionContext = {},
        vars: VarsContext = {},
    ): ParamsDictionary {
        return Function("ctx", "data", "func", "vars", `"use strict";return (${str});`)(ctx, data, func, vars);
    }

    // Set variables in context
    public setVar(ctx: Context, vars: VarsContext) {
        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars = { ...ctx.vars, ...vars };
    }

    // Get variable from context
    public getVar(ctx: Context, name: string) {
        return ctx.vars?.[name];
    }

    // Map blueprint values using the mapper utility
    public blueprintMapper = (obj: ParamsDictionary, ctx: Context, data?: ParamsDictionary) => {
        let newObj: ParamsDictionary | string = obj;

        try {
            if (typeof obj === "string") newObj = mapper.replaceString(obj, ctx, data as ParamsDictionary);
            else mapper.replaceObjectStrings(newObj, ctx, data as ParamsDictionary);
        } catch (e) {
            console.log("MAPPER ERROR", e);
        }

        return newObj;
    };

    // Set error context and return GlobalError instance
    public setError(config: ErrorContext): GlobalError {
        let errorHandler: GlobalError;

        if (typeof config === "string") {
            errorHandler = new GlobalError(config);
        } else if (config.message && Object.keys(config).length === 1) {
            errorHandler = new GlobalError(config.message as string);
        } else {
            const err = typeof config === "object" ? JSON.stringify(config) : "Unkwon Error";
            errorHandler = new GlobalError(err);
            if (typeof config === "object") {
                errorHandler.setJson(config);
            }
        }

        if (config.json) errorHandler.setJson(config);
        if (config.stack) errorHandler.setStack(config.stack);
        if (config.code) errorHandler.setCode(typeof config.code === "number" ? config.code : 500);

        errorHandler.setName(this.name);

        return errorHandler;
    }
}