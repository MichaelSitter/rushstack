// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import { FileSystem, ITerminal, JsonFile, JsonSchema } from '@rushstack/node-core-library';
import schemaJson from '../schemas/cobuild.schema.json';
import { EnvironmentConfiguration } from './EnvironmentConfiguration';
import { CobuildLockProviderFactory, RushSession } from '../pluginFramework/RushSession';
import { RushConstants } from '../logic/RushConstants';

import type { ICobuildLockProvider } from '../logic/cobuild/ICobuildLockProvider';
import type { RushConfiguration } from './RushConfiguration';

/**
 * @beta
 */
export interface ICobuildJson {
  cobuildEnabled: boolean;
  cobuildLockProvider: string;
}

/**
 * @beta
 */
export interface ICobuildConfigurationOptions {
  cobuildJson: ICobuildJson;
  rushConfiguration: RushConfiguration;
  rushSession: RushSession;
}

/**
 * Use this class to load and save the "common/config/rush/cobuild.json" config file.
 * This file provides configuration options for the Rush Cobuild feature.
 * @beta
 */
export class CobuildConfiguration {
  private static _jsonSchema: JsonSchema = JsonSchema.fromLoadedObject(schemaJson);

  /**
   * Indicates whether the cobuild feature is enabled.
   * Typically it is enabled in the cobuild.json config file.
   *
   * Note: The orchestrator (or local users) should always have to opt into running with cobuilds by
   * providing a cobuild context id. Even if cobuilds are "enabled" as a feature, they don't
   * actually turn on for that particular build unless the cobuild context id is provided as an
   * non-empty string.
   */
  public readonly cobuildEnabled: boolean;
  /**
   * Cobuild context id
   *
   * @remarks
   * The cobuild feature won't be enabled until the context id is provided as an non-empty string.
   */
  public readonly cobuildContextId: string | undefined;
  public readonly cobuildLockProvider: ICobuildLockProvider;

  private constructor(options: ICobuildConfigurationOptions) {
    const { cobuildJson } = options;

    this.cobuildEnabled = EnvironmentConfiguration.cobuildEnabled ?? cobuildJson.cobuildEnabled;
    this.cobuildContextId = EnvironmentConfiguration.cobuildContextId;
    if (!this.cobuildContextId) {
      this.cobuildEnabled = false;
    }

    const cobuildLockProviderFactory: CobuildLockProviderFactory | undefined =
      options.rushSession.getCobuildLockProviderFactory(cobuildJson.cobuildLockProvider);
    if (!cobuildLockProviderFactory) {
      throw new Error(`Unexpected cobuild lock provider: ${cobuildJson.cobuildLockProvider}`);
    }
    this.cobuildLockProvider = cobuildLockProviderFactory(cobuildJson);
  }

  /**
   * Attempts to load the cobuild.json data from the standard file path `common/config/rush/cobuild.json`.
   * If the file has not been created yet, then undefined is returned.
   */
  public static async tryLoadAsync(
    terminal: ITerminal,
    rushConfiguration: RushConfiguration,
    rushSession: RushSession
  ): Promise<CobuildConfiguration | undefined> {
    const jsonFilePath: string = CobuildConfiguration.getCobuildConfigFilePath(rushConfiguration);
    if (!FileSystem.exists(jsonFilePath)) {
      return undefined;
    }
    return await CobuildConfiguration._loadAsync(jsonFilePath, terminal, rushConfiguration, rushSession);
  }

  public static getCobuildConfigFilePath(rushConfiguration: RushConfiguration): string {
    return path.resolve(rushConfiguration.commonRushConfigFolder, RushConstants.cobuildFilename);
  }

  private static async _loadAsync(
    jsonFilePath: string,
    terminal: ITerminal,
    rushConfiguration: RushConfiguration,
    rushSession: RushSession
  ): Promise<CobuildConfiguration> {
    const cobuildJson: ICobuildJson = await JsonFile.loadAndValidateAsync(
      jsonFilePath,
      CobuildConfiguration._jsonSchema
    );

    return new CobuildConfiguration({
      cobuildJson,
      rushConfiguration,
      rushSession
    });
  }

  public get contextId(): string | undefined {
    return this.cobuildContextId;
  }

  public async connectLockProviderAsync(): Promise<void> {
    await this.cobuildLockProvider.connectAsync();
  }

  public async disconnectLockProviderAsync(): Promise<void> {
    await this.cobuildLockProvider.disconnectAsync();
  }
}
