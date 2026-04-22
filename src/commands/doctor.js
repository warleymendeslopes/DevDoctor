import { runDoctor } from "../core/doctor.js";
import { printDoctorResults } from "../core/formatter.js";
import { buildDoctorJsonPayload, printJson } from "../core/output.js";

export async function doctorCommand(argv) {
  const json = argv.includes("--json");
  const rest = argv.filter((arg) => arg !== "--json");
  if (rest.length > 0) {
    console.error("Uso: devdoctor doctor [--json]");
    return 1;
  }

  const result = await runDoctor(process.cwd());
  if (json) {
    printJson(
      buildDoctorJsonPayload(result.checks, {
        cwd: result.cwd,
        provider: result.provider,
        packageManager: result.packageManager
      })
    );
  } else {
    printDoctorResults(result.checks);
  }

  return result.checks.some((item) => item.status === "fail") ? 1 : 0;
}
