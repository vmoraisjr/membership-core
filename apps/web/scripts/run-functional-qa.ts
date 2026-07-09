import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

type Step = {
  label: string;
  command: string;
  args: string[];
};

const cwd = process.cwd();

function getBinCommand(name: string) {
  const suffix =
    process.platform === "win32"
      ? ".cmd"
      : "";

  return path.join(
    cwd,
    "node_modules",
    ".bin",
    `${name}${suffix}`
  );
}

function getArgFlag(flag: string) {
  return process.argv.includes(flag);
}

function escapeWindowsArg(value: string) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[ \t"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function runStep(step: Step) {
  console.log(`\n[qa] ${step.label}`);

  const invocation =
    process.platform === "win32"
      ? {
          command: "cmd.exe",
          args: [
            "/d",
            "/s",
            "/c",
            [
              escapeWindowsArg(
                step.command
              ),
              ...step.args.map(
                escapeWindowsArg
              ),
            ].join(" "),
          ],
        }
      : {
          command: step.command,
          args: step.args,
        };

  const result = spawnSync(
    invocation.command,
    invocation.args,
    {
      cwd,
      stdio: "inherit",
      env: process.env,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `QA step failed: ${step.label}`
    );
  }
}

async function main() {
  const skipBuild =
    getArgFlag("--skip-build");
  const skipLint =
    getArgFlag("--skip-lint");
  const skipTypecheck =
    getArgFlag("--skip-typecheck");
  const resetBetween =
    getArgFlag("--reset-between");

  const tsx = getBinCommand("tsx");
  const eslint =
    getBinCommand("eslint");
  const tsc = getBinCommand("tsc");
  const next = getBinCommand("next");

  const testFiles = [
    "tests/auth/authentication-hardening.test.ts",
    "tests/auth/password-recovery-and-first-access.test.ts",
    "tests/audit/audit-log-hardening.test.ts",
    "tests/billing/billing-hardening.test.ts",
    "tests/contracts/contracts-hardening.test.ts",
    "tests/membership/membership-regression.test.ts",
    "tests/messages/support-workspace-regression.test.ts",
    "tests/modules/module-management-hardening.test.ts",
    "tests/rbac/rbac-hardening.test.ts",
    "tests/tenant-isolation/cross-tenant-regression.test.ts",
    "tests/users/clinic-bootstrap-boundaries.test.ts",
    "tests/users/user-management-completion.test.ts",
    "tests/validation/form-validation-hardening.test.ts",
  ];

  runStep({
    label: "reset functional database",
    command: tsx,
    args: [
      "scripts/reset-functional-db.ts",
    ],
  });

  for (const testFile of testFiles) {
    runStep({
      label: `run ${testFile}`,
      command: tsx,
      args: [testFile],
    });

    if (resetBetween) {
      runStep({
        label: `reset after ${testFile}`,
        command: tsx,
        args: [
          "scripts/reset-functional-db.ts",
        ],
      });
    }
  }

  if (!skipTypecheck) {
    runStep({
      label: "typecheck",
      command: tsc,
      args: ["--noEmit"],
    });
  }

  if (!skipLint) {
    runStep({
      label: "lint",
      command: eslint,
      args: ["."],
    });
  }

  if (!skipBuild) {
    runStep({
      label: "build",
      command: next,
      args: ["build"],
    });
  }

  console.log(
    "\n[qa] Functional QA completed successfully."
  );
}

main().catch((error) => {
  console.error(
    "\n[qa] Functional QA failed."
  );
  console.error(error);
  process.exit(1);
});
