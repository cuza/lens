/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getGlobalOverride } from "../test-utils/get-global-override";
import execFileInjectable from "./exec-file.injectable";

export default getGlobalOverride(execFileInjectable, () => () => {
  throw new Error("tried to exec file without override");
});
