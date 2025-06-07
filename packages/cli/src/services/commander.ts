import os from "node:os";
import { Command, type OptionValues } from "commander";
import { PosthogAnalytics } from "./posthog.js";
import { getPackageVersion } from "./utils.js";

const version = await getPackageVersion();
const program = new Command();

const HOME_DIR = `${os.homedir()}/.blokctl`;
const cliConfigPath = `${HOME_DIR}/blokctl.json`;

const analytics = new PosthogAnalytics({
	version: version,
	cliConfigPath: cliConfigPath,
});

type TrackCommandExecutionParams = {
	command: string;
	args: OptionValues;
	execution: () => Promise<void>;
};

const trackCommandExecution = async ({ command, args, execution }: TrackCommandExecutionParams) => {
	await analytics.trackCommandExecution({
		command: command,
		args: args,
		execution,
	});
};

export { program, trackCommandExecution, type OptionValues, type TrackCommandExecutionParams };
