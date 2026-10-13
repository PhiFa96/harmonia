import type { Playback } from '@harmonia/audio';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from './exercise-task';
import { getAudioEngine } from '@/audio';
import { playExample } from '@/exercises/play-example';
import type { OnboardingData } from '@/onboarding/model';
import { miniSession, nextOnboarding } from '@/onboarding/model';
import { updateOnboarding } from '@/state/device';

export function OnboardingMini({
  data,
  scroll,
}: {
  readonly data: OnboardingData;
  readonly scroll: RefObject<ScrollView | null>;
}) {
  const { t } = useTranslation(),
    session = useMemo(() => miniSession(data), [data.mini]),
    item = session.items[0],
    question = useRef<View>(null),
    playback = useRef<Playback | null>(null),
    mounted = useRef(true),
    generation = useRef(0);
  const [playing, setPlaying] = useState(false),
    [audioError, setAudioError] = useState(false);
  const active = useRef(!['background', 'inactive'].includes(AppState.currentState));
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      if (!active.current) {
        generation.current++;
        playback.current?.stop();
        playback.current = null;
        setPlaying(false);
      }
    });
    return () => {
      mounted.current = false;
      generation.current++;
      playback.current?.stop();
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (playback.current && getAudioEngine().context.currentTime >= playback.current.endTime) {
        playback.current = null;
        setPlaying(false);
      }
    }, 50);
    return () => {
      clearInterval(timer);
    };
  }, [playing]);
  if (item?.type !== 'INTERVAL_IDENTIFY_VISUAL') return null;
  const stop = () => {
    generation.current++;
    playback.current?.stop();
    playback.current = null;
    setPlaying(false);
  };
  const play = async () => {
    const canPlay = () => active.current;
    if (!canPlay()) return;
    const current = ++generation.current;
    setAudioError(false);
    try {
      const engine = getAudioEngine();
      await engine.resume();
      if (!mounted.current || !canPlay() || current !== generation.current) return;
      playback.current?.stop();
      playback.current = playExample(engine, item.score);
      setPlaying(true);
    } catch {
      if (mounted.current && current === generation.current) setAudioError(true);
    }
  };
  return (
    <>
      <Card>
        <AppText>{t('onboarding.audioHint')}</AppText>
        <Button
          variant="ghost"
          icon="speaker"
          label={t(playing ? 'onboarding.audioStop' : 'onboarding.audioStart')}
          onPress={() => {
            if (playing) stop();
            else void play();
          }}
        />
        {audioError ? (
          <AppText tone="danger" aria-live="polite">
            {t('onboarding.audioError')}
          </AppText>
        ) : null}
      </Card>
      <ExerciseTask
        session={session}
        item={item}
        answer={data.mini.answer}
        question={question}
        scroll={scroll}
        progressText={t('onboarding.miniProgress')}
        progressLabel={t('onboarding.miniProgressLabel')}
        hearingPausedText=""
        continueLabel={t('onboarding.miniNext')}
        onSelect={(answer) => {
          updateOnboarding((d) => (d.mini.checked ? d : { ...d, mini: { ...d.mini, answer } }));
        }}
        onCheck={(answer) => {
          stop();
          updateOnboarding((d) =>
            d.mini.checked ? d : { ...d, mini: { ...d.mini, answer, checked: true } },
          );
        }}
        onHint={() => {
          updateOnboarding((d) =>
            d.mini.checked
              ? d
              : {
                  ...d,
                  mini: {
                    ...d.mini,
                    hintLevel: Math.min(3, d.mini.hintLevel + 1) as 0 | 1 | 2 | 3,
                  },
                },
          );
        }}
        onSkip={() => {
          /* Die Mini-Aufgabe ist visuell und bleibt ohne Klang lösbar. */
        }}
        onNext={() => {
          stop();
          updateOnboarding((d) => nextOnboarding(d, Date.now()));
        }}
      />
    </>
  );
}
