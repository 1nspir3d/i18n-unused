import { writeFileSync } from 'fs';

import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateLocalesPathAndCodes } from '../helpers/findLocales';
import { applyToFlatKey } from '../helpers/action';
import { checkUncommittedChanges } from '../helpers/git';

import { GREEN } from '../helpers/consoleColor';

export const markUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
  const config = initialize(options);

  const { localesFilePaths } = await generateLocalesPathAndCodes(
    config.localesPath,
    config.localesExtensions,
  );

  const unusedTranslationsCollect = await collectUnusedTranslations(
    localesFilePaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
  );

  if (config.gitCheck) {
    checkUncommittedChanges();
  }

  unusedTranslationsCollect.forEach((collect) => {
    const locale = require(collect.path);

    collect.keys.forEach((key) => applyToFlatKey(locale, key, (source, lastKey) => {
      source[lastKey] = `${config.marker} ${source[lastKey]}`;
    }));

    writeFileSync(collect.path, JSON.stringify(locale, null, 2));

    console.log(GREEN, `Successfully marked: ${collect.path}`);
  });

  return unusedTranslationsCollect;
};
