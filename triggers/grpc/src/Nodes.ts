// This file exports available nanoservice nodes for use in workflows.
import ApiCall from "@nanoservice-ts/api-call";
import IfElse from "@nanoservice-ts/if-else";
import type { NodeBase } from "@nanoservice-ts/shared";

// Map of node names to their instances
const nodes: Record<string, NodeBase> = {
    "@nanoservice-ts/api-call": new ApiCall(),
    "@nanoservice-ts/if-else": new IfElse(),
};

export default nodes;
