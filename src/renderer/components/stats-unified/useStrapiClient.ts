import { strapiClient, strapiClientv1 } from 'renderer/lib/strapi';

/**
 * Hook to get the appropriate Strapi client based on API version
 */
export const useStrapiClient = (
  apiVersion: 'v1' | 'production' = 'production',
) => {
  return apiVersion === 'v1' ? strapiClientv1 : strapiClient;
};

/**
 * Type for components that support API versioning
 */
export interface ApiVersionProps {
  apiVersion: 'v1' | 'production';
}
