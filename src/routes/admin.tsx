import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Prince Group Portal" },
      {
        name: "description",
        content: "Prince Group admin area for managing marriage registration applications.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

/**
 * Layout route for everything under /admin/. Rendering <Outlet /> lets child
 * routes (/admin and /admin/login) render their own content. Without it the
 * parent would own the whole page and swallow any child view.
 */
function AdminLayout() {
  return <Outlet />;
}
