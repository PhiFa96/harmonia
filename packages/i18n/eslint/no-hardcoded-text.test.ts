import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

import { noHardcodedText } from './no-hardcoded-text.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const error = { messageId: 'hardcoded' } as const;

tester.run('no-hardcoded-text', noHardcodedText, {
  valid: [
    // Übersetzte Texte
    `<Text>{t('tabs.learn')}</Text>`,
    `<View aria-label={t('profile.language')} />`,
    `<Tabs.Screen name="index" options={{ title: t('tabs.learn') }} />`,
    `<Stack screenOptions={{ headerShown: false, animation: 'fade' }} />`,
    // Technische Attribute
    `<View role="radiogroup" testID="profile" />`,
    `<Text style={styles.title} key="a" />`,
    // Ohne Buchstaben: Zahlen, Satzzeichen, Symbole
    `<Text>{count} · 3/4</Text>`,
    `<Text>{' '}</Text>`,
    `<Text>{\`\${a}, \${b}\`}</Text>`,
    // Leerraum zwischen Tags
    `<View>
      <Text>{label}</Text>
    </View>`,
  ],
  invalid: [
    { code: `<Text>Lernen</Text>`, errors: [error] },
    { code: `<><Text>Profil</Text></>`, errors: [error] },
    { code: `<Text>{'Üben'}</Text>`, errors: [error] },
    { code: `<Text>{\`\${count} Noten\`}</Text>`, errors: [error] },
    { code: `<Text>{done ? 'Fertig' : t('busy')}</Text>`, errors: [error] },
    { code: `<Text>{visible && 'Hallo'}</Text>`, errors: [error] },
    { code: `<View aria-label="Sprache" />`, errors: [error] },
    { code: `<View accessibilityLabel={'Language'} />`, errors: [error] },
    { code: `<TextInput placeholder="Name" />`, errors: [error] },
    { code: `<Screen title="Profil" />`, errors: [error] },
    { code: `<Image alt="Notenbild" />`, errors: [error] },
    { code: `<Tabs.Screen name="index" options={{ title: 'Lernen' }} />`, errors: [error] },
    { code: `<Stack screenOptions={{ headerBackTitle: 'Zurück' }} />`, errors: [error] },
  ],
});
