import { promises as fs } from 'fs';
import * as path from 'path';

import { log } from './logging';

export const exists = async (path: string) => {
  const statsOrFalse = await fs.stat(path).catch(() => false);
  return Boolean(statsOrFalse);
};

export const findFirstExistingPath = async (
  paths: string[]
): Promise<string | never> => {
  for (const aPath of paths) {
    if (await exists(aPath)) {
      return aPath;
    }
  }
  throw new Error('None of the listed paths exist');
};

export const writeFile = async (filePath: string, content: string) => {
  const dirName = path.dirname(filePath);
  if (!(await exists(dirName))) {
    await fs.mkdir(dirName, { recursive: true });
  }
  log(`writing down ${filePath}...`);
  await fs.writeFile(filePath, content);
};

export const getFilename = (
  cleanedUrl: string,
  baseDirPath: string,
  baseUrl: string = ''
) => {
  const urlPath = cleanedUrl.replace(baseUrl, '');
  return path.join(
    baseDirPath,
    `${urlPath}${urlPath.endsWith('.html') ? '' : '/index.html'}`
  );
};
