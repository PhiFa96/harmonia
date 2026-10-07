import { curriculumSkills } from '../packages/content/src/curriculum.ts';

const escape = (text) =>
  text.replace(/[&"<>`|\r\n]/g, (character) => {
    const entities = {
      '&': '&amp;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
      '`': '&#96;',
      '|': '&#124;',
      '\r': ' ',
      '\n': ' ',
    };
    return entities[character];
  });

/** Stabile IDs in Tabellen, kurze Knotenbezeichnungen in Diagrammen; kein Zugriff auf Dateien. */
export function renderCurriculum(catalogue, plan, translate) {
  const placements = curriculumSkills(catalogue, plan);
  const bySkill = new Map(placements.map((entry) => [entry.skill.id, entry]));
  const unitNodes = new Map(plan.units.map((entry, index) => [entry.unitId, `u${index}`]));
  const skillNodes = new Map(placements.map((entry) => [entry.skill.id, `s${entry.order}`]));
  const title = (key, locale = 'de') => escape(translate(key, locale));
  const lines = [
    '# Fähigkeitsgraph Stufen 1–2 (Entwurf)',
    '',
    '<!-- Erzeugt mit pnpm curriculum:render; Änderungen an Katalog, Plan oder Übersetzungen vornehmen. -->',
    '',
    `Katalog-/Planversion ${plan.contentVersion}. ${catalogue.areas.length} Bereiche, ${catalogue.levels.length} Bereichsstufen, ${plan.units.length} Einheiten und ${placements.length} Fähigkeiten.`,
    '',
    'Pfeile zeigen von der Voraussetzung zum folgenden Lernziel. Die Reihenfolge ist eine mögliche Reihenfolge für die Planung; unabhängige Zweige bleiben im Graphen unabhängig. Die Tabellen zeigen alle direkten Voraussetzungen, auch über Bereichsgrenzen hinweg.',
    '',
    'Die Einheiten haben noch keine vollständigen Lektionen. Technische Prüfungen ersetzen die separate fachliche Abnahme durch Claude nicht. Diese Ansicht gehört zur Planung und ist kein Lernpfad in der App.',
    '',
    '## Reihenfolge der Einheiten',
    '',
    '| Nr. | Stufe | Bereich | Einheit | Fähigkeiten |',
    '|---|---|---|---|---|',
  ];
  for (const [index, entry] of plan.units.entries()) {
    const placement = placements.find((value) => value.unit.id === entry.unitId);
    lines.push(
      `| ${index + 1} | ${placement.level.number} | ${title(placement.area.titleKey)} | ${title(placement.unit.titleKey)} · \`${entry.unitId}\` | ${entry.skillIds.length} |`,
    );
  }
  lines.push('', '```mermaid', 'flowchart TD');
  for (const number of plan.scopeLevels) {
    lines.push(`  subgraph level${number}["Stufe ${number}"]`);
    for (const entry of plan.units) {
      const placement = placements.find((value) => value.unit.id === entry.unitId);
      if (placement.level.number === number)
        lines.push(`    ${unitNodes.get(entry.unitId)}["${title(placement.unit.titleKey)}"]`);
    }
    lines.push('  end');
  }
  const unitEdges = new Set();
  for (const entry of placements)
    for (const id of entry.skill.prerequisites) {
      const previous = bySkill.get(id);
      if (previous.unit.id !== entry.unit.id)
        unitEdges.add(`  ${unitNodes.get(previous.unit.id)} --> ${unitNodes.get(entry.unit.id)}`);
    }
  lines.push(...unitEdges, '```', '');
  for (const area of catalogue.areas) {
    const own = placements.filter((entry) => entry.area.id === area.id);
    const external = new Set();
    for (const entry of own)
      for (const id of entry.skill.prerequisites)
        if (bySkill.get(id).area.id !== area.id) external.add(id);
    lines.push(`## ${title(area.titleKey)} · \`${area.id}\``, '', '```mermaid', 'flowchart TD');
    for (const number of plan.scopeLevels) {
      const group = own.filter((entry) => entry.level.number === number);
      if (group.length === 0) continue;
      lines.push(`  subgraph level${number}["Stufe ${number}"]`);
      for (const entry of group)
        lines.push(`    ${skillNodes.get(entry.skill.id)}["${title(entry.skill.titleKey)}"]`);
      lines.push('  end');
    }
    for (const id of external)
      lines.push(
        `  ${skillNodes.get(id)}["${title(bySkill.get(id).skill.titleKey)} · anderer Bereich"]`,
      );
    for (const entry of own)
      for (const id of entry.skill.prerequisites)
        lines.push(
          `  ${skillNodes.get(id)} ${external.has(id) ? '-.->' : '-->'} ${skillNodes.get(entry.skill.id)}`,
        );
    lines.push(
      '```',
      '',
      '| Stufe / Einheit | Fähigkeit (DE) | Skill-ID | Ziel (EN-US / EN-GB) | Direkte Voraussetzungen | Status |',
      '|---|---|---|---|---|---|',
    );
    for (const entry of own) {
      const us = title(entry.skill.titleKey, 'en-US');
      const gb = title(entry.skill.titleKey, 'en-GB');
      const requirements = entry.skill.prerequisites.map((id) => `\`${id}\``).join(', ') || '—';
      lines.push(
        `| ${entry.level.number} · ${title(entry.unit.titleKey)} | ${title(entry.skill.titleKey)} | \`${entry.skill.id}\` | ${us}${us === gb ? '' : ` / ${gb}`} | ${requirements} | ${entry.skill.status} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
