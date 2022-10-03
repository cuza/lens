/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { ExecFileOptions } from "child_process";
import { execFile } from "child_process";
import type { AsyncResult } from "../utils/async-result";

export interface ExecFile {
  (filePath: string): Promise<AsyncResult<string, { stderr: string; error: Error }>>;
  (filePath: string, argsOrOptions: string[] | ExecFileOptions): Promise<AsyncResult<string, { stderr: string; error: Error }>>;
  (filePath: string, args: string[], options: ExecFileOptions): Promise<AsyncResult<string, { stderr: string; error: Error }>>;
}

const execFileInjectable = getInjectable({
  id: "exec-file",

  instantiate: (): ExecFile => {
    return (filePath: string, argsOrOptions?: string[] | ExecFileOptions, maybeOptions?: ExecFileOptions) => {
      const { args, options } = (() => {
        if (Array.isArray(argsOrOptions)) {
          return {
            args: argsOrOptions,
            options: maybeOptions ?? {},
          };
        } else {
          return {
            args: [],
            options: argsOrOptions ?? {},
          };
        }
      })();

      return new Promise((resolve) => {
        execFile(filePath, args, options, (error, stdout, stderr) => {
          if (error) {
            resolve({
              callWasSuccessful: false,
              error: {
                error,
                stderr,
              },
            });
          } else {
            resolve({
              callWasSuccessful: true,
              response: stdout,
            });
          }
        });
      });
    };
  },

  causesSideEffects: true,
});

export default execFileInjectable;
