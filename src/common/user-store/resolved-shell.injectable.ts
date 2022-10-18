/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import userInfoInjectable from "./user-info.injectable";
import userStoreInjectable from "./user-store.injectable";

const resolvedShellInjectable = getInjectable({
  id: "resolved-shell",
  instantiate: (di) => {
    const userStore = di.inject(userStoreInjectable);
    const userInfo = di.inject(userInfoInjectable);

    return computed(() => userStore.shell || process.env.SHELL || process.env.PTYSHELL || userInfo.shell);
  },
});

export default resolvedShellInjectable;
