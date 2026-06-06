void import("server-only").catch(() => {
  // Test and script environments do not need the Next.js server-only guard.
});
