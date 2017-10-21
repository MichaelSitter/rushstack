// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiDocumenterCommandLine } from './ApiDocumenterCommandLine';
import { BaseAction } from './BaseAction';
import { DocItemSet } from '../utils/DocItemSet';
import { YamlDocumenter } from '../yaml/YamlDocumenter';

export class YamlAction extends BaseAction {
  constructor(parser: ApiDocumenterCommandLine) {
    super({
      actionVerb: 'yaml',
      summary: 'Generate documentation as universal reference YAML files (*.yml)',
      documentation: 'Generates API documentation as a collection of files conforming'
        + ' to the universal reference YAML format, which is used by the docs.microsoft.com'
        + ' pipeline.'
    });
  }

  protected onExecute(): void { // override
    const docItemSet: DocItemSet = this.buildDocItemSet();
    const yamlDocumenter: YamlDocumenter = new YamlDocumenter(docItemSet);
    yamlDocumenter.generateFiles(this.outputFolder);
  }
}
