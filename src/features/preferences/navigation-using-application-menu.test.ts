/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { RenderResult } from "@testing-library/react";
import type { ApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import { getApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import type { Discover } from "../../renderer/components/test-utils/discovery-of-html-elements";
import { discoverFor } from "../../renderer/components/test-utils/discovery-of-html-elements";

describe("preferences - navigation using application menu", () => {
  let builder: ApplicationBuilder;
  let rendered: RenderResult;
  let discover: Discover;

  beforeEach(async () => {
    builder = getApplicationBuilder();

    rendered = await builder.render();
    discover = discoverFor(() => rendered);
  });

  afterEach(() => {
    builder.quit();
  });

  it("renders", () => {
    expect(rendered.container).toMatchSnapshot();
  });

  it("does not show application preferences yet", () => {
    const { discovered } = discover.querySingleElement(
      "preference-page",
      "application-page",
    );

    expect(discovered).toBeNull();
  });

  describe("when navigating to preferences using application menu", () => {
    beforeEach(() => {
      builder.applicationMenu.click(
        "root",
        "mac",
        "navigate-to-preferences",
      );
    });

    it("renders", () => {
      expect(rendered.container).toMatchSnapshot();
    });

    it("shows application preferences", () => {
      const { discovered } = discover.getSingleElement(
        "preference-page",
        "application-page",
      );

      expect(discovered).not.toBeNull();
    });
  });
});
