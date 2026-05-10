import { execFileSync } from "node:child_process";

export const getAppVersion = ({ major = 6388, baseMinor = 1, baseVersionCommit = "" } = {}) => {
  if (!/^[a-f0-9]{7,40}$/i.test(baseVersionCommit)) return `${major}.${String(baseMinor).padStart(2, "0")}`;
  try {
    const commitDelta = Number(
      execFileSync("git", ["rev-list", "--count", `${baseVersionCommit}..HEAD`], { encoding: "utf8" }).trim()
    );
    const minor = baseMinor + Math.max(commitDelta, 0);
    return `${major}.${String(minor).padStart(2, "0")}`;
  } catch {
    return `${major}.${String(baseMinor).padStart(2, "0")}`;
  }
};
