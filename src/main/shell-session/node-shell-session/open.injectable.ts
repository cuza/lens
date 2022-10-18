/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import type { Cluster } from "../../../common/cluster/cluster";
import type WebSocket from "ws";
import createKubectlInjectable from "../../kubectl/create-kubectl.injectable";
import type { NodeShellSessionDependencies } from "./node-shell-session";
import { NodeShellSession } from "./node-shell-session";
import isMacInjectable from "../../../common/vars/is-mac.injectable";
import isWindowsInjectable from "../../../common/vars/is-windows.injectable";
import loggerInjectable from "../../../common/logger.injectable";
import createKubeJsonApiForClusterInjectable from "../../../common/k8s-api/create-kube-json-api-for-cluster.injectable";
import computeShellEnvironmentInjectable from "../../utils/shell-env/compute-shell-environment.injectable";
import resolvedShellInjectable from "../../../common/user-store/resolved-shell.injectable";
import appNameInjectable from "../../../common/vars/app-name.injectable";
import buildVersionInjectable from "../../vars/build-version/build-version.injectable";
import getBasenameOfPathInjectable from "../../../common/path/get-basename.injectable";
import homeDirectoryPathInjectable from "../../../common/os/home-directory-path.injectable";
import pathDelimiterInjectable from "../../../common/path/delimiter.injectable";
import shellEnvironmentCacheInjectable from "../shell-environment-cache.injectable";
import shellProcessesInjectable from "../shell-processes.injectable";

export interface NodeShellSessionArgs {
  websocket: WebSocket;
  cluster: Cluster;
  tabId: string;
  nodeName: string;
}

const openNodeShellSessionInjectable = getInjectable({
  id: "open-node-shell-session",
  instantiate: (di, params: NodeShellSessionArgs) => {
    const createKubectl = di.inject(createKubectlInjectable);
    const dependencies: NodeShellSessionDependencies = {
      isMac: di.inject(isMacInjectable),
      isWindows: di.inject(isWindowsInjectable),
      logger: di.inject(loggerInjectable),
      resolvedShell: di.inject(resolvedShellInjectable),
      appName: di.inject(appNameInjectable),
      buildVersion: di.inject(buildVersionInjectable),
      createKubeJsonApiForCluster: di.inject(createKubeJsonApiForClusterInjectable),
      computeShellEnvironment: di.inject(computeShellEnvironmentInjectable),
      getBasenameOfPath: di.inject(getBasenameOfPathInjectable),
      homeDirectory: di.inject(homeDirectoryPathInjectable),
      pathDelimiter: di.inject(pathDelimiterInjectable),
      shellEnvironmentCache: di.inject(shellEnvironmentCacheInjectable),
      shellProcesses: di.inject(shellProcessesInjectable),
    };
    const kubectl = createKubectl(params.cluster.version);
    const session = new NodeShellSession(dependencies, { kubectl, ...params });

    return session.open();
  },
  // NOTE: this must be transient to bypass the circular dependency of `createKubeJsonApiForClusterInjectable` on the lens proxy port
  lifecycle: lifecycleEnum.transient,
});

export default openNodeShellSessionInjectable;
