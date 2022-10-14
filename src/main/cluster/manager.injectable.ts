/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import clusterStoreInjectable from "../../common/cluster-store/cluster-store.injectable";
import getClusterByIdInjectable from "../../common/cluster-store/get-by-id.injectable";
import catalogEntityRegistryInjectable from "../catalog/entity-registry.injectable";
import clustersThatAreBeingDeletedInjectable from "./are-being-deleted.injectable";
import { ClusterManager } from "./manager";

const clusterManagerInjectable = getInjectable({
  id: "cluster-manager",

  instantiate: (di) => new ClusterManager({
    store: di.inject(clusterStoreInjectable),
    catalogEntityRegistry: di.inject(catalogEntityRegistryInjectable),
    clustersThatAreBeingDeleted: di.inject(clustersThatAreBeingDeletedInjectable),
    getClusterById: di.inject(getClusterByIdInjectable),
  }),
});

export default clusterManagerInjectable;
