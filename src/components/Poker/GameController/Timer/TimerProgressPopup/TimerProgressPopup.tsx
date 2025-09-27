import { ChangeEvent, useEffect, useRef, useState, useCallback } from 'react';
import CircularProgressBar from '../../../../elements/CircularProgressBar';

type TimerProps = {
  isMod?: boolean;
  currentSeconds?: number;
  totalSeconds?: number;
  soundOn?: boolean;
  timerPaused?: boolean;
  onTimerClose: () => void;
  onTimerStateUpdate: (update: {
    currentSeconds: number;
    totalSeconds: number;
    soundOn: boolean;
    timerPaused: boolean;
  }) => void;
};

const getMinutesAndSeconds = (time: number) => [Math.floor(time / 60), time % 60];
const audio = typeof Audio !== 'undefined' ? new Audio('/timer-notification.mp3') : null;

export const TimerProgress: React.FC<TimerProps> = ({
  currentSeconds = 0,
  totalSeconds = 300,
  onTimerClose,
  isMod,
  onTimerStateUpdate,
  soundOn = true,
  timerPaused = false,
}) => {
  const [total, setTotal] = useState(totalSeconds);
  const [current, setCurrent] = useState(currentSeconds);
  const [inProgress, setInProgress] = useState(!isMod && !timerPaused);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [_soundOn, setSoundOn] = useState(soundOn);

  useEffect(() => {
    if (!isMod) {
      setInProgress(false);
      setCurrent(currentSeconds);
      setTotal(totalSeconds);
      setSoundOn(soundOn);
    }
  }, [isMod, currentSeconds, totalSeconds, soundOn]);

  useEffect(() => {
    if (inProgress && isMod) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => {
          if (prev + 1 >= total) {
            clearInterval(intervalRef.current as NodeJS.Timeout);
            setInProgress(false);
            if (audio && _soundOn) audio.play();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current as NodeJS.Timeout);
  }, [inProgress, total, _soundOn, isMod]);

  useEffect(() => {
    if (isMod) {
      onTimerStateUpdate({
        totalSeconds: total,
        currentSeconds: current,
        timerPaused: !inProgress,
        soundOn: _soundOn,
      });
    }
  }, [current, total, inProgress, _soundOn, isMod, onTimerStateUpdate]);

  const startTimer = useCallback(() => setInProgress(true), []);
  const pauseTimer = useCallback(() => {
    setInProgress(false);
    clearInterval(intervalRef.current as NodeJS.Timeout);
  }, []);
  const handleReset = useCallback(() => {
    setCurrent(0);
    setInProgress(false);
    clearInterval(intervalRef.current as NodeJS.Timeout);
  }, []);
  const onAddSeconds = useCallback(() => setTotal((prev) => prev + 60), []);
  const onReduceSeconds = useCallback(
    () => setTotal((prev) => (prev - 60 > 30 ? prev - 60 : prev)),
    [],
  );
  const onMinutesChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const minutes = Number(event.target.value.slice(-2));
      setTotal(minutes * 60 + (total % 60));
      setCurrent(0);
    },
    [total],
  );
  const onSecondsChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const seconds = Number(event.target.value.slice(-2));
      setTotal(Math.floor(total / 60) * 60 + seconds);
      setCurrent(0);
    },
    [total],
  );

  const [minutes, seconds] = getMinutesAndSeconds(total);
  const [runningMinutes, runningSeconds] = getMinutesAndSeconds(total - current);
  const percentage = total > 0 ? 100 - (current / total) * 100 : 100;

  return (
    <div className='absolute top-13 right-2 shadow-xl rounded-lg bg-white p-4 w-[15rem] h-fit border-gray-200 border-1'>
      <button
        title={_soundOn ? 'Mute sound' : 'Unmute sound'}
        className='absolute top-3 left-3 p-1 cursor-pointer'
        onClick={() => isMod && setSoundOn((s) => !s)}
      >
        {_soundOn ? '🔊' : '🔇'}
      </button>
      {isMod && (
        <div
          className='absolute top-3 right-3 cursor-pointer'
          title='Close Timer'
          onClick={onTimerClose}
        >
          X
        </div>
      )}
      <div className='flex h-full w-full justify-center items-center space-y-2 flex-col'>
        <CircularProgressBar percentage={percentage}>
          <div className='flex space-x-2 items-center text-lg'>
            <div title={`${minutes} Minutes, ${seconds} Seconds`} className='text-4xl'>
              <input
                type='text'
                value={
                  intervalRef.current && inProgress
                    ? runningMinutes.toString().padStart(2, '0')
                    : minutes.toString().padStart(2, '0')
                }
                maxLength={3}
                pattern='[0-9]*'
                className='w-[2.5rem] border-none focus:outline-none'
                onChange={onMinutesChange}
                disabled={!!intervalRef.current || inProgress}
              />
              :
              <input
                type='text'
                value={
                  intervalRef.current && inProgress
                    ? runningSeconds.toString().padStart(2, '0')
                    : seconds.toString().padStart(2, '0')
                }
                maxLength={3}
                pattern='[0-9]*'
                className='w-[2.5rem] border-none focus:outline-none'
                onChange={onSecondsChange}
                disabled={!!intervalRef.current || inProgress}
              />
            </div>
          </div>
        </CircularProgressBar>
        {isMod && (
          <>
            <hr className='h-px my-3 bg-gray-200 border-0 dark:bg-gray-700 w-full' />
            <div className='flex space-x-2 w-full'>
              <button
                title='Reset Timer'
                className='p-2 border-2 border-gray-400 h-8 w-8 flex items-center justify-center text-gray-400 pointer hover:text-gray-600 hover:border-gray-600'
                onClick={handleReset}
              >
                {'\u23F9'}
              </button>
              <div className='flex-grow w-full'>
                {!inProgress && (
                  <div className='flex justify-center items-center gap-x-2 w-full h-8' role='group'>
                    <button
                      type='button'
                      className='p-2 border-2 border-gray-200 h-8 w-8 flex items-center justify-center text-xl hover:text-gray-600 hover:border-gray-600'
                      onClick={onReduceSeconds}
                      title='Minus 1 minute'
                    >
                      -
                    </button>
                    <button
                      type='button'
                      className='p-2 border-2 border-gray-200 h-8 w-8 flex items-center justify-center text-xl hover:text-gray-600 hover:border-gray-600'
                      onClick={onAddSeconds}
                      title='Add 1 minute'
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
              {!inProgress && (
                <button
                  title='Start Timer'
                  className='p-2 border-2 border-gray-400 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-600'
                  onClick={startTimer}
                  disabled={total === 0}
                >
                  {'\u25B6'}
                </button>
              )}
              {inProgress && (
                <button
                  title='Pause Timer'
                  className='p-2 border-2 border-gray-400 h-8 w-8 flex items-center justify-center text-gray-400'
                  onClick={pauseTimer}
                >
                  {'\u23F8'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
