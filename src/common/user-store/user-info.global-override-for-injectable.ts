/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getGlobalOverride } from "../test-utils/get-global-override";
import userInfoInjectable from "./user-info.injectable";

export default getGlobalOverride(userInfoInjectable, () => ({
  gid: 1,
  homedir: "/some-home-dir",
  shell: "bash",
  uid: 2,
  username: "some-user-name",
}));
