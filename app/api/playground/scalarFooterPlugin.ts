import type { ApiReferencePlugin } from "@scalar/api-reference/plugins";
import { ReactRenderer } from "@scalar/react-renderer";
import { ScalarPlaygroundFooter } from "./ScalarPlaygroundFooter";

/**
 * Scalar plugin that injects the same footer as the app (Product, Developers, Legal, Support)
 * using Scalar's built-in content.end view.
 */
export function scalarPlaygroundFooterPlugin(): ApiReferencePlugin {
  return () => ({
    name: "playground-footer",
    extensions: [],
    views: {
      "content.end": [
        {
          component: ScalarPlaygroundFooter,
          renderer: ReactRenderer,
        },
      ],
    },
  });
}
