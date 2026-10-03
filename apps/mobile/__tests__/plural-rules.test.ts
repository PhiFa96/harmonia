// Hermes hat kein Intl.PluralRules. Die App lädt dafür das Polyfill intl-pluralrules.
// Hier: Polyfill gegen die eingebaute Umsetzung (Node/ICU) und i18next mit nur dem Polyfill.

import { createI18n } from '@harmonia/i18n';
import PolyfillPluralRules from 'intl-pluralrules/plural-rules';

const SAMPLES = [0, 1, 2, 3, 10, 21, 101, 1.5, 0.5];

describe('Plural-Polyfill für Hermes', () => {
  it.each(['de', 'en-US', 'en-GB'])(
    '%s: gleiche Kategorien wie die eingebaute Umsetzung',
    (locale) => {
      const native = new Intl.PluralRules(locale);
      const polyfill = new PolyfillPluralRules(locale);
      expect(polyfill.resolvedOptions().pluralCategories.sort()).toEqual(
        native.resolvedOptions().pluralCategories.sort(),
      );
      for (const n of SAMPLES) {
        expect(polyfill.select(n)).toBe(native.select(n));
      }
    },
  );

  it('i18next bildet Pluralformen auch, wenn nur das Polyfill da ist', () => {
    const original = Intl.PluralRules;
    try {
      Object.defineProperty(Intl, 'PluralRules', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      // Wie auf Hermes: Intl.PluralRules fehlt, das Polyfill setzt es (frisch geladen).
      jest.isolateModules(() => {
        jest.requireActual('intl-pluralrules');
      });
      expect(Intl.PluralRules).not.toBe(original);
      const i18n = createI18n('de');
      expect(i18n.t('glossary:measure', { count: 1 })).toBe('Takt');
      expect(i18n.t('glossary:measure', { count: 2 })).toBe('Takte');
    } finally {
      Object.defineProperty(Intl, 'PluralRules', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});
