import { promises as fs } from 'fs';
/**
 * Utility function to check if a file exists
 * @param file - File path
 * @returns {Promise<boolean>}
 */
export async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
