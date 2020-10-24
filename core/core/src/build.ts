import path from 'path';
import { Compiler, Configuration } from 'webpack';
import { LogOptions } from '@component-controls/logger';

type WebpackConfigFn = (config: Configuration, options?: any) => Configuration;
type WebpackConfig = Configuration | WebpackConfigFn;

export interface RuleOptions {
  name: string;
  config: Configuration;
}
export type RuleType = string | RuleOptions;

export type RuleTypes = RuleType[];

export type PresetCallback = (options: BuildProps) => Configuration;
export type PresetType = Configuration | PresetCallback;

/**
 * configuration properties for compile and run
 */
export interface BuildProps {
  /**
   * webpack configuration object
   */
  webpack?: WebpackConfig;
  finalWebpack?: WebpackConfig;

  /**
   * a list of webpack configuration presets from webpack-configs packages
   */
  presets?: RuleTypes;
  /**
   * path to the configuration file e.g : '.storybook'
   */
  configPath?: string;

  /** public output folder for the bundle */
  distFolder?: string;

  /** public file name the bundle, by default 'component-controls.js' */
  bundleName?: string;

  /** public output folder for the assets like images */
  staticFolder?: string;

  /** file name where css styles are exported to load for ssr */
  cssFileName?: string;
  /**
   * logger options
   */
  logOptions?: Partial<LogOptions>;
  /**
   * webpack mode
   */
  mode?: Configuration['mode'];
}

const defaultPresets = ['react', 'react-docgen-typescript'];

export const defaultCompileProps: BuildProps = {
  presets: defaultPresets,
};

export type WatchOptions = Parameters<Compiler['watch']>[0];

/**
 * adds webpack WatchOptions to the Compiler options
 */
export type WatchProps = {
  watchOptions?: WatchOptions;
} & BuildProps;

export const getDistName = (options: BuildProps) => {
  const dist = options.distFolder || path.join(process.cwd(), 'public');
  return dist;
};

export const defBundleName = 'component-controls.js';

export const getBundleName = (options: BuildProps) =>
  path.join(getDistName(options), options.bundleName || defBundleName);

export const defCssFileName = 'component-controls.css';

export const getCSSBundleName = (options: BuildProps) =>
  path.join(getDistName(options), options.cssFileName || defCssFileName);