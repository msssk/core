import { Handle } from './interfaces';
import { createHandle } from './lang';

/*
 * A note about timing-sensitive functions in JS: JS is not a real-time environment. setTimeout only ensures
 * that a minimum amount of time will pass before the callback is executed - there is no maximum. In low
 * resource environments the actual delay may be well over the specified delay. We can get closer to achieving
 * correct behavior by using time diffs where possible.
 */

/**
 * Wraps a setTimeout call in a handle, allowing the timeout to be cleared by calling destroy.
 *
 * @param callback Callback to be called when the timeout elapses
 * @param delay Number of milliseconds to wait before calling the callback
 * @return Handle which can be destroyed to clear the timeout
 */
export function createTimer(callback: (...args: any[]) => void, delay?: number): Handle {
	let timerId = setTimeout(callback, delay);

	return createHandle(function () {
		clearTimeout(timerId);
		timerId = null;
	});
}

/**
 * Wraps a callback, returning a function which fires after no further calls are received over a set interval.
 *
 * @param callback Callback to wrap
 * @param delay Number of milliseconds to wait after any invocations before calling the original callback
 * @return Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	// node.d.ts clobbers setTimeout/clearTimeout with versions that return/receive NodeJS.Timer,
	// but browsers return/receive a number
	let timer: any;

	return <T> function (...args: any[]) {
		timer && clearTimeout(timer);

		let context = this;

		timer = setTimeout(function () {
			callback.apply(context, args);
			context = null;
			timer = null;
		}, delay);
	};
}

/**
 * Wraps a callback, returning a function which fires at most once per set interval.
 *
 * @param callback Callback to wrap
 * @param delay Number of milliseconds to wait before allowing the original callback to be called again
 * @return Throttled function
 */
export function throttle<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	let lastRunTick = 0;

	return <T> function (...args: any[]) {
		if (!lastRunTick || (Date.now() - lastRunTick) >= delay) {
			callback.apply(this, args);
			lastRunTick = Date.now();
		}
	};
}

/**
 * Debounces and throttles a function. The first invocation will run debounced. Additional calls during the delay
 * will be throttled (ignored). After the debounced execution, the next invocation will run debounced.
 * Useful for e.g. resize or scroll events, when debounce would appear unresponsive.
 *
 * @param callback Callback to wrap
 * @param delay Number of milliseconds to wait before calling the original callback and allowing it to be called again
 * @return Throttled function
 */
export function throttleAfter<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	let ran = false;

	return <T> function (...args: any[]) {
		if (!ran) {
			let context = this;

			ran = true;

			setTimeout(function () {
				callback.apply(context, args);
				context = null;
				ran = false;
			}, delay);
		}
	};
}
