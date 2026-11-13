import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const extensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const platforms = ['', '.web', '.native', '.ios', '.android'];
// Nur die Syntax wird zwischengespeichert; Dateibytes und Auflösung werden neu geprüft.
const syntax = new Map();
function imports(path, text, hash) {
  if (syntax.get(path)?.hash === hash) return syntax.get(path).imports;
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) throw Error('Invalid bound source syntax');
  const result = new Set();
  function literal(node) {
    if (!node || !ts.isStringLiteralLike(node))
      throw Error('Computed module import requires explicit binding');
    result.add(node.text);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) literal(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      literal(node.moduleReference.expression);
    } else if (ts.isImportTypeNode(node)) {
      literal(ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require') ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'require' &&
          node.expression.name.text === 'resolve'))
    )
      literal(node.arguments[0]);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (syntax.size >= 5000) syntax.clear();
  syntax.set(path, { hash, imports: [...result] });
  return [...result];
}

/** Bindet lokale Importketten, ohne die untersuchten Module auszuführen. */
export function sourceDigests(files, { root } = {}) {
  root = realpathSync(root);
  const pending = new Set(files),
    digests = {},
    workspaces = new Map(),
    configs = new Map(),
    metadata = new Map();
  function inside(path) {
    const rel = relative(root, path);
    if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel))
      throw Error('Bound source outside repository');
    return rel.split(sep).join('/');
  }
  function safe(path) {
    const rel = inside(resolve(root, path)),
      absolute = resolve(root, rel);
    const actual = realpathSync(absolute);
    inside(actual);
    // Explizite Font-Assets dürfen die innerhalb des Repos liegenden pnpm-Links nutzen.
    if (!rel.includes('/node_modules/')) {
      let current = root;
      for (const part of rel.split('/')) {
        current = resolve(current, part);
        if (lstatSync(current).isSymbolicLink())
          throw Error('Bound source symlink requires review');
      }
    }
    if (!lstatSync(actual).isFile()) throw Error('Bound source is not a regular file');
    return actual;
  }
  function json(path) {
    const result = ts.parseConfigFileTextToJson(path, readFileSync(safe(path), 'utf8'));
    if (result.error || !result.config || typeof result.config !== 'object')
      throw Error('Invalid bound source configuration');
    return result.config;
  }
  for (const group of ['apps', 'packages']) {
    if (!existsSync(resolve(root, group))) continue;
    for (const entry of readdirSync(resolve(root, group), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw Error('Workspace source symlink requires review');
      const manifest = `${group}/${entry.name}/package.json`;
      if (!entry.isDirectory() || !existsSync(resolve(root, manifest))) continue;
      const data = json(manifest);
      if (typeof data.name !== 'string' || workspaces.has(data.name))
        throw Error('Invalid or duplicate bound workspace');
      workspaces.set(data.name, { manifest, data });
    }
  }
  function local(path, optional = false) {
    inside(path);
    const candidates = new Set();
    function file(candidate) {
      if (existsSync(candidate) && lstatSync(candidate).isFile()) candidates.add(inside(candidate));
      else if (existsSync(candidate) && lstatSync(candidate).isSymbolicLink()) {
        safe(candidate);
      }
    }
    file(path);
    const ext = extname(path),
      known = extensions.includes(ext);
    const stem = known ? path.slice(0, -ext.length) : path;
    for (const extension of known
      ? ext === '.js'
        ? ['.js', '.ts', '.tsx']
        : [ext]
      : [...extensions, '.json'])
      for (const platform of platforms) file(stem + platform + extension);
    for (const extension of [...extensions, '.json'])
      for (const platform of platforms) file(resolve(path, 'index' + platform + extension));
    if (!candidates.size && !optional)
      throw Error('Unresolved bound local import: ' + inside(path));
    return [...candidates];
  }
  function match(pattern, value) {
    const star = pattern.indexOf('*');
    if (star < 0) return pattern === value ? '' : null;
    const start = pattern.slice(0, star),
      end = pattern.slice(star + 1);
    return value.startsWith(start) &&
      value.endsWith(end) &&
      value.length >= start.length + end.length
      ? value.slice(start.length, value.length - end.length)
      : null;
  }
  function workspace(specifier) {
    const name = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0];
    const pkg = workspaces.get(name);
    if (!pkg) {
      if (specifier.startsWith('@harmonia/')) throw Error('Unknown bound workspace import');
      return null;
    }
    pending.add(pkg.manifest);
    const subpath = specifier === name ? '.' : './' + specifier.slice(name.length + 1);
    const declared = pkg.data.exports;
    let value = declared,
      capture = '';
    if (
      declared &&
      typeof declared === 'object' &&
      !Array.isArray(declared) &&
      Object.keys(declared).some((k) => k.startsWith('.'))
    ) {
      const key =
        Object.keys(declared).find((k) => k === subpath) ??
        Object.keys(declared)
          .filter((k) => k.includes('*'))
          .sort((a, b) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)
          .find((k) => match(k, subpath) !== null);
      value = key === undefined ? undefined : declared[key];
      capture = key === undefined ? '' : match(key, subpath);
    } else if (subpath !== '.') value = undefined;
    const targets = [];
    function flatten(item) {
      if (typeof item === 'string') {
        if (!item.startsWith('./')) throw Error('Invalid bound workspace export');
        const target = item.replaceAll('*', () => capture);
        if (target.split('/').includes('..') || target.split('/').includes('node_modules'))
          throw Error('Invalid bound workspace export target');
        targets.push(target);
      } else if (Array.isArray(item)) item.forEach(flatten);
      else if (item && typeof item === 'object') Object.values(item).forEach(flatten);
    }
    flatten(value);
    if (!targets.length) throw Error('Unresolved bound workspace export: ' + specifier);
    return [
      ...new Set(targets.flatMap((target) => local(resolve(root, dirname(pkg.manifest), target)))),
    ];
  }
  function config(path, seen = new Set()) {
    if (seen.has(path)) throw Error('Cyclic bound configuration');
    if (configs.has(path)) return configs.get(path);
    seen.add(path);
    pending.add(path);
    const value = json(path),
      directory = dirname(resolve(root, path));
    let inherited = { aliases: [], baseUrl: null, hasPaths: false };
    for (const parent of typeof value.extends === 'string'
      ? [value.extends]
      : (value.extends ?? [])) {
      const paths = parent.startsWith('.') ? local(resolve(directory, parent)) : workspace(parent);
      // Externe Konfigurationspakete sind durch Paketmanifest und Lockfile gebunden.
      if (paths)
        for (const p of paths) {
          const parentConfig = config(p, new Set(seen));
          inherited = {
            aliases: parentConfig.hasPaths ? parentConfig.aliases : inherited.aliases,
            baseUrl: parentConfig.baseUrl ?? inherited.baseUrl,
            hasPaths: parentConfig.hasPaths || inherited.hasPaths,
          };
        }
    }
    const options = value.compilerOptions ?? {};
    const baseUrl =
      options.baseUrl === undefined ? inherited.baseUrl : resolve(directory, options.baseUrl);
    const aliases = options.paths
      ? Object.entries(options.paths).map(([pattern, targets]) => {
          if (!Array.isArray(targets) || targets.some((t) => typeof t !== 'string'))
            throw Error('Invalid bound path alias');
          return { pattern, targets, base: baseUrl ?? directory };
        })
      : inherited.aliases.map((alias) => ({ ...alias, base: baseUrl ?? alias.base }));
    const result = {
      aliases,
      baseUrl,
      hasPaths: options.paths !== undefined || inherited.hasPaths,
    };
    configs.set(path, result);
    return result;
  }
  function aliases(importer) {
    let directory = dirname(resolve(root, importer));
    if (metadata.has(directory)) return metadata.get(directory);
    const start = directory;
    let configuration = null,
      manifest = null;
    while (true) {
      const path = resolve(directory, 'tsconfig.json');
      if (!configuration && existsSync(path)) configuration = inside(path);
      const owner = resolve(directory, 'package.json');
      if (!manifest && existsSync(owner)) manifest = inside(owner);
      if (directory === root) break;
      directory = dirname(directory);
    }
    if (manifest) pending.add(manifest);
    const result = configuration ? config(configuration).aliases : [];
    metadata.set(start, result);
    return result;
  }
  for (const path of pending) {
    if (Object.hasOwn(digests, path)) continue;
    const bytes = readFileSync(safe(path));
    const hash = createHash('sha256').update(bytes).digest('hex');
    digests[path] = hash;
    if (!extensions.includes(extname(path)) || path.includes('/node_modules/')) continue;
    const configuredAliases = aliases(path);
    for (const specifier of imports(resolve(root, path), bytes.toString('utf8'), hash)) {
      if (/^(?:node:|npm:|jsr:|https?:|data:)/.test(specifier)) continue;
      let targets;
      if (specifier.startsWith('.')) targets = local(resolve(root, dirname(path), specifier));
      else {
        const specificity = (pattern) =>
          pattern.includes('*') ? pattern.indexOf('*') : Number.MAX_SAFE_INTEGER;
        const alias = configuredAliases
          .filter((a) => match(a.pattern, specifier) !== null)
          .sort(
            (a, b) =>
              specificity(b.pattern) - specificity(a.pattern) ||
              b.pattern.length - a.pattern.length,
          )[0];
        targets = alias
          ? alias.targets.flatMap((target) =>
              local(
                resolve(
                  alias.base,
                  target.replaceAll('*', () => match(alias.pattern, specifier)),
                ),
                true,
              ),
            )
          : workspace(specifier);
        if (alias && !targets.length) throw Error('Unresolved bound path alias');
        if (
          !targets &&
          (specifier.startsWith('@/') ||
            specifier.startsWith('#') ||
            isAbsolute(specifier) ||
            specifier.startsWith('file:'))
        )
          throw Error('Unresolved bound module alias');
      }
      for (const target of targets ?? []) pending.add(target);
    }
  }
  return Object.fromEntries(
    Object.entries(digests).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}
