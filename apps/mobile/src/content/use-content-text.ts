import { useTranslation } from 'react-i18next';

/** Dynamische Inhaltsreferenzen werden in der Pipeline gegen alle Sprachdateien geprüft. */
export function useContentText() {
  const { t, i18n } = useTranslation();
  return (key: `content.${string}`): string => {
    if (!i18n.exists(key)) throw new Error(`Inhaltsübersetzung fehlt: ${key}`);
    // exists() prüft die dynamische Referenz; der Katalog ist nicht Teil der statischen UI-Schlüssel.
    return t(key as unknown as ParseKeys);
  };
}
import type { ParseKeys } from 'i18next';
