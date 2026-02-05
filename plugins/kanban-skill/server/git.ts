import { $ } from "bun";

export interface GitResult {
  success: boolean;
  error?: string;
}

export async function gitCommit(filepath: string, action: "create" | "update"): Promise<GitResult> {
  const filename = filepath.split("/").pop();
  const message = `kanban: ${action} ${filename}`;

  try {
    await $`git add ${filepath}`.quiet();
  } catch (error) {
    const msg = `Git staging failed for ${filename}: ${error}`;
    console.warn(msg);
    return { success: false, error: msg };
  }

  try {
    await $`git commit -m ${message}`.quiet();
  } catch (error) {
    const msg = `Git commit failed for ${filename}: ${error}`;
    console.warn(msg);
    return { success: false, error: msg };
  }

  return { success: true };
}
