import data from './published.json' with { type: 'json' };
import { parseCatalogue } from './catalogue.ts';
export const catalogue = parseCatalogue(data);
