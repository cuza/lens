/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { noop, chunk } from "lodash/fp";
import type { DiContainer, Injectable } from "@ogre-tools/injectable";
import { createContainer, isInjectable } from "@ogre-tools/injectable";
import { Environments, setLegacyGlobalDiForExtensionApi } from "../extensions/as-legacy-globals-for-extension-api/legacy-global-di-for-extension-api";
import requestFromChannelInjectable from "./utils/channel/request-from-channel.injectable";
import loggerInjectable from "../common/logger.injectable";
import { overrideFsWithFakes } from "../test-utils/override-fs-with-fakes";
import { createMemoryHistory } from "history";
import focusWindowInjectable from "./navigation/focus-window.injectable";
import extensionsStoreInjectable from "../extensions/extensions-store/extensions-store.injectable";
import type { ExtensionsStore } from "../extensions/extensions-store/extensions-store";
import fileSystemProvisionerStoreInjectable from "../extensions/extension-loader/file-system-provisioner-store/file-system-provisioner-store.injectable";
import type { FileSystemProvisionerStore } from "../extensions/extension-loader/file-system-provisioner-store/file-system-provisioner-store";
import userStoreInjectable from "../common/user-store/user-store.injectable";
import type { UserStore } from "../common/user-store";
import hotbarStoreInjectable from "../common/hotbars/store.injectable";
import terminalSpawningPoolInjectable from "./components/dock/terminal/terminal-spawning-pool.injectable";
import hostedClusterIdInjectable from "./cluster-frame-context/hosted-cluster-id.injectable";
import historyInjectable from "./navigation/history.injectable";
import { ApiManager } from "../common/k8s-api/api-manager";
import lensResourcesDirInjectable from "../common/vars/lens-resources-dir.injectable";
import broadcastMessageInjectable from "../common/ipc/broadcast-message.injectable";
import apiManagerInjectable from "../common/k8s-api/api-manager/manager.injectable";
import { observable, computed, runInAction } from "mobx";
import requestAnimationFrameInjectable from "./components/animate/request-animation-frame.injectable";
import getRandomIdInjectable from "../common/utils/get-random-id.injectable";
import getFilePathsInjectable from "../features/helm-charts/child-features/preferences/renderer/adding-of-custom-helm-repository/helm-file-input/get-file-paths.injectable";
import callForPublicHelmRepositoriesInjectable from "../features/helm-charts/child-features/preferences/renderer/adding-of-public-helm-repository/public-helm-repositories/call-for-public-helm-repositories.injectable";
import platformInjectable from "../common/vars/platform.injectable";
import startTopbarStateSyncInjectable from "./components/layout/top-bar/start-state-sync.injectable";
import { registerMobX } from "@ogre-tools/injectable-extension-for-mobx";
import watchHistoryStateInjectable from "./remote-helpers/watch-history-state.injectable";
import type { HotbarStore } from "../common/hotbars/store";
import cronJobTriggerDialogClusterFrameChildComponentInjectable from "./components/+workloads-cronjobs/cron-job-trigger-dialog-cluster-frame-child-component.injectable";
import deploymentScaleDialogClusterFrameChildComponentInjectable from "./components/+workloads-deployments/scale/deployment-scale-dialog-cluster-frame-child-component.injectable";
import replicasetScaleDialogClusterFrameChildComponentInjectable from "./components/+workloads-replicasets/scale-dialog/replicaset-scale-dialog-cluster-frame-child-component.injectable";
import statefulsetScaleDialogClusterFrameChildComponentInjectable from "./components/+workloads-statefulsets/scale/statefulset-scale-dialog-cluster-frame-child-component.injectable";
import kubeObjectDetailsClusterFrameChildComponentInjectable from "./components/kube-object-details/kube-object-details-cluster-frame-child-component.injectable";
import kubeconfigDialogClusterFrameChildComponentInjectable from "./components/kubeconfig-dialog/kubeconfig-dialog-cluster-frame-child-component.injectable";
import portForwardDialogClusterFrameChildComponentInjectable from "./port-forward/port-forward-dialog-cluster-frame-child-component.injectable";
import setupSystemCaInjectable from "./frames/root-frame/setup-system-ca.injectable";
import extensionShouldBeEnabledForClusterFrameInjectable from "./extension-loader/extension-should-be-enabled-for-cluster-frame.injectable";
import { asyncComputed } from "@ogre-tools/injectable-react";
import legacyOnChannelListenInjectable from "./ipc/legacy-channel-listen.injectable";
import getEntitySettingCommandsInjectable from "./components/command-palette/registered-commands/get-entity-setting-commands.injectable";
import storageSaveDelayInjectable from "./utils/create-storage/storage-save-delay.injectable";
import environmentVariablesInjectable from "../common/utils/environment-variables.injectable";
import type { GlobalOverride } from "../common/test-utils/get-global-override";
import type { PartialDeep } from "type-fest";

export const getDiForUnitTesting = (
  opts: { doGeneralOverrides?: boolean } = {},
) => {
  const { doGeneralOverrides = false } = opts;

  const di = createContainer("renderer");

  di.preventSideEffects();

  setLegacyGlobalDiForExtensionApi(di, Environments.renderer);

  const injectables: Injectable<any, any, any>[] = (
    global as any
  ).rendererInjectablePaths.flatMap((filePath: string) =>
    Object.values(require(filePath)).filter(
      (maybeInjectable: any) => isInjectable(maybeInjectable),
    ),
  );

  runInAction(() => {
    registerMobX(di);

    chunk(100)(injectables).forEach((chunkInjectables) => {
      di.register(...chunkInjectables);
    });
  });

  if (doGeneralOverrides) {
    const globalOverrides: GlobalOverride[] = (global as any).rendererGlobalOverridePaths.map(
      (filePath: string) => require(filePath).default,
    );

    globalOverrides.forEach(globalOverride => {
      di.override(globalOverride.injectable, globalOverride.overridingInstantiate);
    });

    di.override(getRandomIdInjectable, () => () => "some-irrelevant-random-id");
    di.override(platformInjectable, () => "darwin");

    [
      startTopbarStateSyncInjectable,
      setupSystemCaInjectable,
    ].forEach((injectable) => {
      di.override(injectable, () => ({
        id: injectable.id,
        run: () => {},
      }));
    });

    di.override(terminalSpawningPoolInjectable, () => document.createElement("div"));
    di.override(hostedClusterIdInjectable, () => undefined);

    di.override(historyInjectable, () => createMemoryHistory());
    di.override(legacyOnChannelListenInjectable, () => () => noop);

    di.override(storageSaveDelayInjectable, () => 0);

    di.override(requestAnimationFrameInjectable, () => (callback) => callback());
    di.override(lensResourcesDirInjectable, () => "/irrelevant");

    // TODO: remove when entity settings registry is refactored
    di.override(getEntitySettingCommandsInjectable, () => () => []);

    // TODO: Remove after "LensRendererExtension.isEnabledForCluster" is removed
    di.override(extensionShouldBeEnabledForClusterFrameInjectable, () =>
      asyncComputed({ getValueFromObservedPromise: async () => true, valueWhenPending: true }),
    );

    // TODO: Remove side-effects and shared global state
    const clusterFrameChildComponentInjectables: Injectable<any, any, any>[] = [
      cronJobTriggerDialogClusterFrameChildComponentInjectable,
      deploymentScaleDialogClusterFrameChildComponentInjectable,
      replicasetScaleDialogClusterFrameChildComponentInjectable,
      statefulsetScaleDialogClusterFrameChildComponentInjectable,
      kubeObjectDetailsClusterFrameChildComponentInjectable,
      kubeconfigDialogClusterFrameChildComponentInjectable,
      portForwardDialogClusterFrameChildComponentInjectable,
    ];

    clusterFrameChildComponentInjectables.forEach((injectable) => {
      di.override(injectable, () => ({
        Component: () => null,
        id: injectable.id,
        shouldRender: computed(() => false),
      }));
    });

    di.override(environmentVariablesInjectable, () => ({}));
    di.override(watchHistoryStateInjectable, () => () => () => {});

    overrideFunctionalInjectables(di, [
      broadcastMessageInjectable,
      getFilePathsInjectable,
      callForPublicHelmRepositoriesInjectable,
    ]);

    // eslint-disable-next-line unused-imports/no-unused-vars-ts
    di.override(extensionsStoreInjectable, () => ({ isEnabled: ({ id, isBundled }) => false }) as ExtensionsStore);

    di.override(hotbarStoreInjectable, () => ({
      getActive: () => ({ name: "some-hotbar", items: [] }),
      getDisplayIndex: () => "0",
    }) as unknown as HotbarStore);

    di.override(fileSystemProvisionerStoreInjectable, () => ({}) as FileSystemProvisionerStore);

    di.override(userStoreInjectable, () => ({
      isTableColumnHidden: () => false,
      extensionRegistryUrl: { customUrl: "some-custom-url" },
      syncKubeconfigEntries: observable.map(),
      terminalConfig: { fontSize: 42 },
      editorConfiguration: { minimap: {}, tabSize: 42, fontSize: 42 },
      load: () => {},
    } as PartialDeep<UserStore> as UserStore));

    di.override(apiManagerInjectable, () => new ApiManager());

    di.override(requestFromChannelInjectable, () => () => Promise.resolve(undefined as never));

    overrideFsWithFakes(di);

    di.override(focusWindowInjectable, () => () => {});

    di.override(loggerInjectable, () => ({
      warn: noop,
      debug: noop,
      error: noop,
      info: noop,
      silly: noop,
    }));
  }

  return di;
};

const overrideFunctionalInjectables = (di: DiContainer, injectables: Injectable<any, any, any>[]) => {
  injectables.forEach(injectable => {
    di.override(injectable, () => () => {
      throw new Error(`Tried to run "${injectable.id}" without explicit override.`);
    });
  });
};
