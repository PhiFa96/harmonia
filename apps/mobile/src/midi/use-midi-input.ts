import type { MIDIAccess, MIDIInput } from '@motiz88/react-native-midi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { currentMidiAccess, requestMidiAccess } from './access';
import { MidiNotes } from './message';

export interface MidiDevice {
  readonly id: string;
  readonly name: string;
}

let preferredInput: string | null = null;

export function useMidiInput(onNote: (note: number) => void, enabled: boolean) {
  const [access, setAccess] = useState<MIDIAccess | null>(null);
  const [devices, setDevices] = useState<readonly MidiDevice[]>([]);
  const [selected, setSelected] = useState<string | null>(preferredInput);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'unavailable'>('idle');
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set());
  const [velocity, setVelocity] = useState<number | null>(null);
  const [sustain, setSustain] = useState(false);
  const notes = useRef(new MidiNotes());
  const foreground = useRef(true);
  const mounted = useRef(true);
  const onNoteRef = useRef(onNote);
  onNoteRef.current = onNote;
  const clear = useCallback(() => {
    notes.current.clear();
    setHeld(new Set());
    setVelocity(null);
    setSustain(false);
  }, []);

  const attach = useCallback((next: MIDIAccess) => {
    setAccess(next);
    setStatus('ready');
  }, []);

  useEffect(() => {
    mounted.current = true;
    void currentMidiAccess()?.then((value) => {
      if (mounted.current) attach(value);
    });
    return () => {
      mounted.current = false;
    };
  }, [attach]);

  const connect = async () => {
    setStatus('connecting');
    try {
      const next = await requestMidiAccess();
      if (mounted.current) attach(next);
    } catch {
      if (mounted.current) setStatus('unavailable');
    }
  };

  useEffect(() => {
    if (!access) return;
    const refresh = () => {
      const available = [...access.inputs.values()]
        .filter((port) => port.state === 'connected')
        .map((port) => ({ id: port.id, name: port.name || port.manufacturer || port.id }));
      setDevices(available);
      if (!preferredInput && available[0]) {
        preferredInput = available[0].id;
        setSelected(preferredInput);
      }
      if (!available.some((port) => port.id === preferredInput)) clear();
    };
    refresh();
    access.addEventListener('statechange', refresh);
    return () => {
      access.removeEventListener('statechange', refresh);
    };
  }, [access, clear]);

  const chosen: MIDIInput | undefined = selected ? access?.inputs.get(selected) : undefined;
  const connected = chosen?.state === 'connected';
  useEffect(() => {
    if (!chosen || !connected || !enabled) {
      clear();
      return;
    }
    const message = (event: Event) => {
      if (!foreground.current) return;
      const data = (event as Event & { data?: Uint8Array }).data;
      if (!data) return;
      const strike = notes.current.receive(data);
      setHeld(notes.current.held);
      setSustain(notes.current.sustain);
      if (strike) {
        setVelocity(strike.velocity);
        onNoteRef.current(strike.note);
      }
    };
    chosen.addEventListener('midimessage', message);
    return () => {
      chosen.removeEventListener('midimessage', message);
      void chosen.close();
      clear();
    };
  }, [chosen, connected, enabled, clear]);

  useEffect(() => {
    if (!access) return;
    const app = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
      if (!foreground.current) clear();
    });
    const visibility = () => {
      foreground.current = !document.hidden;
      if (!foreground.current) clear();
    };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', visibility);
    return () => {
      app.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visibility);
    };
  }, [access, clear]);

  const select = (id: string | null) => {
    clear();
    preferredInput = id;
    setSelected(id);
  };

  return { connect, devices, selected, select, status, connected, held, velocity, sustain };
}
