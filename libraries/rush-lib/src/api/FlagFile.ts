// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import { FileSystem, JsonFile, type JsonObject } from '@rushstack/node-core-library';
import { isMatch, merge, objectsAreDeepEqual } from '../utilities/objectUtilities';

/**
 * A base class for flag file.
 * @internal
 */
export class FlagFile<T extends object = JsonObject> {
  /**
   * Flag file path
   */
  public readonly path: string;

  /**
   * Content of the flag
   */
  protected _state: T;

  /**
   * Creates a new flag file
   * @param folderPath - the folder that this flag is managing
   * @param state - optional, the state that should be managed or compared
   */
  public constructor(folderPath: string, flagName: string, state?: Partial<T>) {
    this.path = path.join(folderPath, `${flagName}.flag`);
    this._state = (state || {}) as T;
  }

  /**
   * Returns true if the file exists and the contents match the current state.
   */
  public isValid(): boolean {
    let oldState: JsonObject | undefined;
    try {
      oldState = JsonFile.load(this.path);
      const newState: T = this._state;
      if (!objectsAreDeepEqual(oldState, newState)) {
        return false;
      }
    } catch (err) {
      return false;
    }
    return true;
  }

  /**
   * Writes the flag file to disk with the current state
   */
  public create(): void {
    JsonFile.save(this._state, this.path, {
      ensureFolderExists: true
    });
  }

  /**
   * Removes the flag file
   */
  public clear(): void {
    FileSystem.deleteFile(this.path);
  }
}
