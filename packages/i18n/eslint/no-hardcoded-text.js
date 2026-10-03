// ESLint-Regel: keine fest eingetragenen Texte in Komponenten. Sichtbare oder vorgelesene Texte
// kommen über packages/i18n (t('…')), damit es sie in allen Sprachen gibt (ADR 0003).
//
// Geprüft wird JSX: Text zwischen Tags, Zeichenketten als Kinder ({'…'}, `…`), Attribute,
// die Nutzer sehen oder hören (aria-label, accessibilityLabel, title, placeholder …), und
// Objekte in Attributen wie Navigationsoptionen (options={{ title: '…' }}).
// Zeichenketten ohne Buchstaben (Zahlen, Satzzeichen, Symbole wie „·“) sind erlaubt.

/** Attribute mit sichtbarem oder vorgelesenem Text. */
const TEXT_ATTRIBUTES = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'label',
  'placeholder',
  'title',
]);

/** Zusätzlich in Objekten (Navigationsoptionen von Expo Router / React Navigation). */
const TEXT_PROPERTIES = new Set([
  ...TEXT_ATTRIBUTES,
  'headerBackTitle',
  'headerTitle',
  'tabBarAccessibilityLabel',
  'tabBarLabel',
]);

const LETTER = /\p{L}/u;

/** @type {import('eslint').Rule.RuleModule} */
export const noHardcodedText = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Texte in Komponenten über packages/i18n statt fest im Code',
    },
    messages: {
      hardcoded:
        'Fest eingetragener Text „{{text}}“: über packages/i18n übersetzen (t(…)), damit es ihn in allen Sprachen gibt.',
    },
    schema: [],
  },
  create(context) {
    // ESLints Typen kennen keine JSX-Knoten, deshalb hier `any`.
    /**
     * @param {any} node
     * @param {string} text
     */
    function report(node, text) {
      const trimmed = text.trim();
      context.report({
        node,
        messageId: 'hardcoded',
        data: { text: trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed },
      });
    }

    /** @param {any} node Ausdruck oder null */
    function checkExpression(node) {
      if (!node) {
        return;
      }
      switch (node.type) {
        case 'Literal':
          if (typeof node.value === 'string' && LETTER.test(node.value)) {
            report(node, node.value);
          }
          return;
        case 'TemplateLiteral': {
          const text = node.quasis.map((/** @type {any} */ q) => q.value.cooked ?? '').join('…');
          if (LETTER.test(text)) {
            report(node, text);
          }
          return;
        }
        case 'ConditionalExpression':
          checkExpression(node.consequent);
          checkExpression(node.alternate);
          return;
        case 'LogicalExpression':
          checkExpression(node.right);
          return;
        case 'ObjectExpression':
          for (const property of node.properties) {
            const key = property.type === 'Property' ? propertyName(property) : undefined;
            if (key !== undefined && TEXT_PROPERTIES.has(key)) {
              checkExpression(property.value);
            }
          }
          return;
        default:
          return;
      }
    }

    /** @param {any} property */
    function propertyName(property) {
      if (property.computed) {
        return undefined;
      }
      if (property.key.type === 'Identifier') {
        return property.key.name;
      }
      return property.key.type === 'Literal' ? String(property.key.value) : undefined;
    }

    return {
      /** @param {any} node JSXText */
      JSXText(node) {
        if (LETTER.test(node.value)) {
          report(node, node.value);
        }
      },
      /** @param {any} node JSXExpressionContainer als Kind eines Elements */
      'JSXElement > JSXExpressionContainer, JSXFragment > JSXExpressionContainer'(node) {
        checkExpression(node.expression);
      },
      /** @param {any} node JSXAttribute */
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : undefined;
        const value =
          node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
        if (name !== undefined && TEXT_ATTRIBUTES.has(name)) {
          checkExpression(value);
        } else if (value?.type === 'ObjectExpression') {
          checkExpression(value);
        }
      },
    };
  },
};

/** Als Plugin für die flache ESLint-Konfiguration: `plugins: { harmonia: plugin }`. */
export default {
  meta: { name: '@harmonia/i18n/eslint' },
  rules: { 'no-hardcoded-text': noHardcodedText },
};
