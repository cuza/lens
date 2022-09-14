/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { existsSync, readFileSync } from "fs";
import os from "os";
import type { ClusterStoreModel } from "../../common/cluster-store/cluster-store";
import type { KubeconfigSyncEntry, UserPreferencesModel } from "../../common/user-store";
import type { MigrationDeclaration } from "../helpers";
import { migrationLog } from "../helpers";
import { isErrnoException } from "../../common/utils";
import { getLegacyGlobalDiForExtensionApi } from "../../extensions/as-legacy-globals-for-extension-api/legacy-global-di-for-extension-api";
import directoryForUserDataInjectable from "../../common/app-paths/directory-for-user-data.injectable";
import directoryForKubeConfigsInjectable from "../../common/app-paths/directory-for-kube-configs/directory-for-kube-configs.injectable";
import joinPathsInjectable from "../../common/path/join-paths.injectable";
import isLogicalChildPathInjectable from "../../common/path/is-logical-child-path.injectable";
import getDirnameOfPathInjectable from "../../common/path/get-dirname.injectable";

export default {
  version: "5.0.3-beta.1",
  run(store) {
    try {
      const { syncKubeconfigEntries = [], ...preferences }: UserPreferencesModel = store.get("preferences") ?? {};

      const di = getLegacyGlobalDiForExtensionApi();

      const userDataPath = di.inject(directoryForUserDataInjectable).get();
      const kubeConfigsPath = di.inject(directoryForKubeConfigsInjectable);
      const joinPaths = di.inject(joinPathsInjectable);
      const isLogicalChildPath = di.inject(isLogicalChildPathInjectable);
      const getDirnameOfPath = di.inject(getDirnameOfPathInjectable);

      const { clusters = [] }: ClusterStoreModel = JSON.parse(readFileSync(joinPaths(userDataPath, "lens-cluster-store.json"), "utf-8")) ?? {};
      const extensionDataDir = joinPaths(userDataPath, "extension_data");
      const syncPaths = new Set(syncKubeconfigEntries.map(s => s.filePath));

      syncPaths.add(joinPaths(os.homedir(), ".kube"));

      for (const cluster of clusters) {
        if (!cluster.kubeConfigPath) {
          continue;
        }
        const dirOfKubeconfig = getDirnameOfPath(cluster.kubeConfigPath);

        if (dirOfKubeconfig === kubeConfigsPath) {
          migrationLog(`Skipping ${cluster.id} because kubeConfigPath is under the stored KubeConfig folder`);
          continue;
        }

        if (syncPaths.has(cluster.kubeConfigPath) || syncPaths.has(dirOfKubeconfig)) {
          migrationLog(`Skipping ${cluster.id} because kubeConfigPath is already being synced`);
          continue;
        }

        if (isLogicalChildPath(extensionDataDir, cluster.kubeConfigPath)) {
          migrationLog(`Skipping ${cluster.id} because kubeConfigPath is placed under an extension_data folder`);
          continue;
        }

        if (!existsSync(cluster.kubeConfigPath)) {
          migrationLog(`Skipping ${cluster.id} because kubeConfigPath no longer exists`);
          continue;
        }

        migrationLog(`Adding ${cluster.kubeConfigPath} from ${cluster.id} to sync paths`);
        syncPaths.add(cluster.kubeConfigPath);
      }

      const updatedSyncEntries: KubeconfigSyncEntry[] = [...syncPaths].map(filePath => ({ filePath }));

      migrationLog("Final list of synced paths", updatedSyncEntries);
      store.set("preferences", { ...preferences, syncKubeconfigEntries: updatedSyncEntries });
    } catch (error) {
      if (isErrnoException(error) && error.code !== "ENOENT") {
        // ignore files being missing
        throw error;
      }
    }
  },
} as MigrationDeclaration;
