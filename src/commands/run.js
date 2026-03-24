import { runUserCommand } from "../core/runner.js";

export async function runCommand(args) {
  const command = args[0];
  const commandArgs = args.slice(1);
  return runUserCommand(command, commandArgs);
}
