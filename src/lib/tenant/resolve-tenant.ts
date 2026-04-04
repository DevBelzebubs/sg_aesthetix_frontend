export type TenantContext = {
  slug: string;
  tenantId: string;
};

export async function resolveTenantBySlug(slug: string): Promise<TenantContext> {
  // Placeholder until tenant API is connected.
  // The slug is enough to start building route-scoped layouts and metadata.
  return {
    slug,
    tenantId: slug,
  };
}
