/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   finishRedirect.ts                                  :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/16 13:30:43 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/16 13:31:55 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { writable, type Readable } from "svelte/store";

type Options = {
  seconds: number;
  isFinished: () => boolean;
  onDone: () => void;
};

export function createFinishRedirect(opts: Options): {
  countdown: Readable<number>;
  start: () => () => void;
  reset: () => void;
} {
  const { seconds, isFinished, onDone } = opts;

  const countdownW = writable<number>(seconds);

  let timer: ReturnType<typeof setInterval> | null = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function reset() {
    stop();
    countdownW.set(seconds);
  }

  function tickStart() {
    stop();
    countdownW.set(seconds);

    timer = setInterval(() => {
      let next = 0;

      countdownW.update((v) => {
        next = v - 1;
        return next;
      });

      if (next <= 0) {
        stop();
        onDone();
      }
    }, 1000);
  }

  /**
   * Starts watching `isFinished()` on an interval tick.
   * Returns cleanup.
   */
  function start() {
    const watch = setInterval(() => {
      if (isFinished()) {
        if (!timer) tickStart();
      } else {
        if (timer) reset();
      }
    }, 160);

    return () => {
      clearInterval(watch);
      reset();
    };
  }

  return {
    countdown: { subscribe: countdownW.subscribe },
    start,
    reset,
  };
}
