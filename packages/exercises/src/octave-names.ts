import { pitchName } from '@harmonia/theory';
import type { TextLocale } from '@harmonia/i18n';
import { notationSystem } from '@harmonia/i18n';
import type { NoteItem } from './types.ts';

/** Quelle des angezeigten Namens; beschädigte oder mehrdeutige Quellen werden abgewiesen. */
export function octaveNamePitch(item: NoteItem) {
  const staff = item.score.staves[0];
  const measure = staff?.measures[0];
  const event = measure?.voices[0]?.events[0];
  if (
    item.presentation !== 'octave-name' ||
    !['helmholtz', 'scientific'].includes(item.sourceSystem ?? '') ||
    item.score.staves.length !== 1 ||
    staff?.keySignature.fifths !== 0 ||
    staff.measures.length !== 1 ||
    !measure ||
    measure.changes !== undefined ||
    measure.voices.length !== 1 ||
    measure.voices[0]?.events.length !== 1 ||
    event?.kind !== 'note' ||
    event.tie ||
    event.pitch.alter !== 0 ||
    event.duration.value !== 'whole' ||
    event.duration.dots !== 0
  )
    throw new RangeError('Oktavnamen brauchen genau einen natürlichen ganzen Quellton');
  return event.pitch;
}
export function octaveName(
  item: NoteItem,
  locale: TextLocale,
  source = true,
  pitch = octaveNamePitch(item),
): string {
  octaveNamePitch(item);
  const system = source
    ? (item.sourceSystem ?? 'helmholtz')
    : item.sourceSystem === 'helmholtz'
      ? 'scientific'
      : 'helmholtz';
  return pitchName(pitch, {
    octave: system,
    system: system === 'scientific' ? 'intl' : notationSystem(locale),
  });
}
