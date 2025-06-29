/**
 * @fileoverview Configuration management for the Evos Launcher
 * Handles reading, writing, and managing application configuration settings.
 * Provides default configuration values and file system operations for config persistence.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { Config } from '../types';

export const defaultConfig: Config = {
  mode: 'dark',
  colorPrimary: '#9cb8ba',
  colorSecondary: '#000000',
  colorBackground: '#000000fc',
  colorText: '#ffffff',
  colorScrollBar: '6b6b6b',
  colorPaper: '#000000',
  ip: '',
  authenticatedUsers: [],
  activeUser: null,
  exePath: '',
  gamePort: '6050',
  ticketEnabled: 'true',
  showAllChat: 'true',
  enableDiscordRPC: 'true',
  branch: 'Stable',
  selectedArguments: {},
};

export const configFilePath = path.join(app.getPath('userData'), 'config.json');

export async function readConfig(): Promise<Config | null> {
  try {
    const config = await fs.promises.readFile(configFilePath, 'utf-8');
    return JSON.parse(config) as Config;
  } catch (error) {
    log.info('Error while reading the config file:', error);
    return null;
  }
}

export async function createConfigFile(): Promise<void> {
  let existingConfig;

  try {
    // Try to read the existing config file
    const configFileContent = await fs.promises.readFile(
      configFilePath,
      'utf-8',
    );
    existingConfig = JSON.parse(configFileContent);
  } catch (error) {
    log.info('Config file does not exist or is invalid, creating it...');
    await fs.promises.writeFile(
      configFilePath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8',
    );
    return;
  }

  // Check for missing properties in the existing config
  const updatedConfig = { ...defaultConfig, ...existingConfig };

  await fs.promises.writeFile(
    configFilePath,
    JSON.stringify(updatedConfig, null, 2),
    'utf-8',
  );
}

export function writeConfigSync(config: Config): void {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function clearConfig(): void {
  fs.writeFileSync(
    configFilePath,
    JSON.stringify(defaultConfig, null, 2),
    'utf-8',
  );
}
