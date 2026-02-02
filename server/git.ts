import { $ } from "bun";

export async function gitCommit(filepath: string, action: "create" | "update"): Promise<boolean> {
  const filename = filepath.split("/").pop();
  const message = `kanban: ${action} ${filename}`;

  try {
    await $`git add ${filepath}`.quiet();
    await $`git commit -m ${message}`.quiet();
    return true;
  } catch (error) {
    console.warn(`Git commit failed: ${error}`);
    return false;
  }
}
