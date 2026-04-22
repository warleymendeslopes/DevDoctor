function toSerializableError(error) {
  if (!error) return null;
  return {
    message: error.message || String(error)
  };
}

export function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

export function buildCommandResultPayload({
  ok,
  mode,
  command,
  commandArgs,
  exitCode,
  failure = null,
  analysis = null,
  meta = null,
  error = null
}) {
  return {
    ok,
    mode,
    command,
    commandArgs,
    exitCode,
    failure,
    analysis,
    meta,
    error: toSerializableError(error)
  };
}

export function buildDoctorJsonPayload(results, meta = {}) {
  const summary = {
    ok: results.every((item) => item.status === "ok"),
    counts: {
      ok: results.filter((item) => item.status === "ok").length,
      warn: results.filter((item) => item.status === "warn").length,
      fail: results.filter((item) => item.status === "fail").length
    }
  };

  return {
    ...summary,
    mode: "doctor",
    checks: results,
    meta
  };
}
