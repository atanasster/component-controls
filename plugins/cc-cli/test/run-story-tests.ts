import fs from 'fs';
import path from 'path';
import { runCLI } from 'jest';
import { setLogOptions } from '@component-controls/logger';
import { createStoriesTemplate } from '../src/jest-templates/stories-template';
import { saveDataTemplate } from '../src/cli/save-data-template';
import {
  StoryTemplateOptions,
  DataImportOptions,
  formatExtension,
} from '../src/utils';

export const runTests = async (
  props: Omit<StoryTemplateOptions, 'storyPath'>,
): Promise<void> => {
  const { renderer, format, config, bundle, data, name } = props;
  setLogOptions({ logLevel: 'none' });
  const storyPath = path.resolve(__dirname, 'fixtures/VariantButton.docs.tsx');
  it(`${renderer} ${bundle ? 'bundle' : ''} ${format}`, async () => {
    let dataImports: DataImportOptions | undefined = undefined;
    if (data) {
      dataImports = await saveDataTemplate({
        ...props,
        storyPath,
        overwrite: true,
        output: __dirname,
        name: bundle ? 'VariantButton' : undefined,
        test: `VariantButton.data.${formatExtension(format)}`,
        seed: 123456,
      });
    }
    let renderedFile = '';
    renderedFile = await createStoriesTemplate(
      {
        storyPath,
        format,
        name: bundle ? 'VariantButton' : undefined,
        renderer,
        bundle,
        config,
        output: __dirname,
        data,
      },
      dataImports,
    );
    expect(renderedFile).toMatchSnapshot();
    if (name) {
      const extension = formatExtension(format);
      const testName = `story_test_${renderer}_${format}${
        bundle ? '_bundle' : ''
      }`;
      const testFileName = path.resolve(
        __dirname,
        `${testName}.test.${extension}`,
      );
      const snapshotFileName = path.resolve(
        __dirname,
        `__snapshots__/${testName}.test.${extension}.snap`,
      );

      fs.writeFileSync(testFileName, renderedFile);
      if (fs.existsSync(snapshotFileName)) {
        fs.unlinkSync(snapshotFileName);
      }
      try {
        await runCLI(
          {
            testRegex: testName,
            testPathIgnorePatterns: ['/node_modules/', '/__snapshots__/'],
            detectOpenHandles: true,
            runInBand: true,
            forceExit: true,
            silent: true,
            verbose: false,
            watchman: false,
          } as any,
          [__dirname],
        );
      } finally {
        if (fs.existsSync(testFileName)) {
          fs.unlinkSync(testFileName);
        }
        if (fs.existsSync(snapshotFileName)) {
          fs.unlinkSync(snapshotFileName);
        }
      }
    }
    if (
      dataImports &&
      fs.existsSync(path.resolve(__dirname, dataImports.filePath))
    ) {
      fs.unlinkSync(path.resolve(__dirname, dataImports.filePath));
    }
  }, 1000000);
};
