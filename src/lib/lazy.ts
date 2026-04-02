import { lazy, type ComponentType } from 'react';

type ComponentModule<T extends ComponentType<any>> = {
  default?: T;
  [key: string]: unknown;
};

export const lazyNamed = <T extends ComponentType<any>>(
  loader: () => Promise<ComponentModule<T>>,
  exportName?: string
) =>
  lazy(async () => {
    const mod = await loader();
    const candidate = (exportName ? mod[exportName] : undefined) ?? mod.default;

    if (!candidate) {
      throw new Error(
        `Chargement dynamique invalide: export ${exportName ? `\"${exportName}\"` : 'default'} introuvable.`
      );
    }

    return { default: candidate as T };
  });
