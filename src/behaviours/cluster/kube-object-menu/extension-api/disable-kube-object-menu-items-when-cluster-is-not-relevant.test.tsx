/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { AsyncFnMock } from "@async-fn/jest";
import asyncFn from "@async-fn/jest";
import type { RenderResult } from "@testing-library/react";
import type { ApplicationBuilder } from "../../../../renderer/components/test-utils/get-application-builder";
import type { KubernetesCluster } from "../../../../common/catalog-entities";
import { getApplicationBuilder } from "../../../../renderer/components/test-utils/get-application-builder";
import { getExtensionFakeFor } from "../../../../renderer/components/test-utils/get-extension-fake";
import { getInjectable } from "@ogre-tools/injectable";
import { frontEndRouteInjectionToken } from "../../../../common/front-end-routing/front-end-route-injection-token";
import { computed } from "mobx";
import React from "react";
import { navigateToRouteInjectionToken } from "../../../../common/front-end-routing/navigate-to-route-injection-token";
import { routeSpecificComponentInjectionToken } from "../../../../renderer/routes/route-specific-component-injection-token";
import { KubeObject } from "../../../../common/k8s-api/kube-object";
import extensionShouldBeEnabledForClusterFrameInjectable from "../../../../renderer/extension-loader/extension-should-be-enabled-for-cluster-frame.injectable";
import { KubeObjectMenu } from "../../../../renderer/components/kube-object-menu";
import apiManagerInjectable from "../../../../common/k8s-api/api-manager/manager.injectable";

describe("disable kube object menu items when cluster is not relevant", () => {
  let builder: ApplicationBuilder;
  let rendered: RenderResult;
  let isEnabledForClusterMock: AsyncFnMock<
    (cluster: KubernetesCluster) => boolean
  >;

  beforeEach(async () => {
    builder = getApplicationBuilder();

    builder.beforeApplicationStart(({ mainDi }) => {
      mainDi.override(apiManagerInjectable, () => ({}));
    });

    const rendererDi = builder.dis.rendererDi;

    rendererDi.unoverride(extensionShouldBeEnabledForClusterFrameInjectable);

    rendererDi.register(testRouteInjectable, testRouteComponentInjectable);

    builder.setEnvironmentToClusterFrame();

    const getExtensionFake = getExtensionFakeFor(builder);

    isEnabledForClusterMock = asyncFn();

    const testExtension = getExtensionFake({
      id: "test-extension-id",
      name: "test-extension",

      rendererOptions: {
        isEnabledForCluster: isEnabledForClusterMock,

        kubeObjectMenuItems: [
          {
            kind: "some-kind",
            apiVersions: ["some-api-version"],
            components: {
              MenuItem: () => (
                <div data-testid="some-test-id">Some menu item</div>
              ),
            },
          },
        ],
      },
    });

    rendered = await builder.render();

    const navigateToRoute = rendererDi.inject(navigateToRouteInjectionToken);
    const testRoute = rendererDi.inject(testRouteInjectable);

    navigateToRoute(testRoute);

    builder.extensions.enable(testExtension);
  });

  describe("given not yet known if extension should be enabled for the cluster, when navigating", () => {
    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("does not show the kube object menu item", () => {
      const actual = rendered.queryByTestId("some-test-id");

      expect(actual).not.toBeInTheDocument();
    });
  });

  describe("given extension shouldn't be enabled for the cluster, when navigating", () => {
    beforeEach(async () => {
      await isEnabledForClusterMock.resolve(false);
    });

    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("does not show the kube object menu item", () => {
      const actual = rendered.queryByTestId("some-test-id");

      expect(actual).not.toBeInTheDocument();
    });
  });

  describe("given extension should be enabled for the cluster, when navigating", () => {
    beforeEach(async () => {
      await isEnabledForClusterMock.resolve(true);
    });

    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("shows the kube object menu item", () => {
      const actual = rendered.getByTestId("some-test-id");

      expect(actual).toBeInTheDocument();
    });
  });
});

const testRouteInjectable = getInjectable({
  id: "test-route",

  instantiate: () => ({
    path: "/test-route",
    clusterFrame: true,
    isEnabled: computed(() => true),
  }),

  injectionToken: frontEndRouteInjectionToken,
});

const testRouteComponentInjectable = getInjectable({
  id: "test-route-component",

  instantiate: (di) => ({
    route: di.inject(testRouteInjectable),

    Component: () => (
      <KubeObjectMenu
        toolbar={true}
        object={getKubeObjectStub("some-kind", "some-api-version")}
      />
    ),
  }),

  injectionToken: routeSpecificComponentInjectionToken,
});

const getKubeObjectStub = (kind: string, apiVersion: string) =>
  KubeObject.create({
    apiVersion,
    kind,
    metadata: {
      uid: "some-uid",
      name: "some-name",
      resourceVersion: "some-resource-version",
      namespace: "some-namespace",
      selfLink: "",
    },
  });
