/*
 * While setTimeout and setInterval work well enough for typical application demands on reasonably modern computers,
 * JavaScript runtimes make no guarantee of timely execution. The delay passed to these functions only guarantees
 * that the callback will not be executed before the specified delay has elapsed. There is no guarantee of how promptly
 * the callback will be executed after the delay.
 *
 * Given this situation it is best to avoid automated tests that assume timely execution of delayed callbacks. This
 * is especially relevant in cloud testing services where the resources allocated for the test machine may be
 * severely limited, causing unexpected test failures.
 *
 * Additionally, while it is very convenient in test code to use setTimeout to schedule something at a certain time
 * or to see if something has transpired after a certain interval, it should be avoided when possible due to its
 * unreliability.
 */

import registerSuite = require('intern!object');
import assert = require('intern/chai!assert');
import sinon = require('sinon');
import { Handle } from 'src/interfaces';
import * as util from 'src/util';

const TIMEOUT = 3000;

registerSuite({
	name: 'utility functions',

	createTimer: (function () {
		let timer: Handle;

		return {
			afterEach() {
				timer && timer.destroy();
				timer = null;
			},

			destroy() {
				const dfd = this.async(1000);
				const spy = sinon.spy();
				timer = util.createTimer(spy, 100);

				setTimeout(function () {
					timer.destroy();
				}, 50);

				setTimeout(dfd.callback(function () {
					assert.strictEqual(spy.callCount, 0);
				}), 110);
			},

			timeout() {
				const dfd = this.async(1000);
				const spy = sinon.spy();
				timer = util.createTimer(spy, 100);

				setTimeout(dfd.callback(function () {
					assert.strictEqual(spy.callCount, 1);
				}), 110);
			}
		};
	})(),

	debounce: {
		'preserves context'() {
			const dfd = this.async(TIMEOUT);
			const foo = {
				bar: util.debounce(dfd.callback(function() {
					assert.strictEqual(this, foo, 'Function should be executed with correct context');
				}), 0)
			};

			foo.bar();
		},

		'receives arguments'() {
			const dfd = this.async(TIMEOUT);
			const testArg1 = 5;
			const testArg2 = 'a';
			const debouncedFunction = util.debounce(dfd.callback(function (a: number, b: string) {
				assert.strictEqual(a, testArg1, 'Function should receive correct arguments');
				assert.strictEqual(b, testArg2, 'Function should receive correct arguments');
			}), 0);

			debouncedFunction(testArg1, testArg2);
		},

		'debounces callback'() {
			const dfd = this.async(TIMEOUT);
			const debouncedFunction = util.debounce(dfd.callback(function () {
				assert.isAbove(Date.now() - lastCallTick, 24,
					'Function should not be called until period has elapsed without further calls');

				// Typically, we expect the 3rd invocation to be the one that is executed.
				// Although the setTimeout in 'run' specifies a delay of 20ms, a very slow test environment may
				// take longer. If 100+ ms has actually elapsed, then the first or second invocation may end up
				// being eligible for execution.
				// If the first or second invocation has been called there's no need to let the run loop continue.
				clearTimeout(handle);
			}), 25);

			let runCount = 1;
			let lastCallTick: number;
			let handle: any;

			function run() {
				lastCallTick = Date.now();
				debouncedFunction();
				runCount += 1;

				if (runCount < 4) {
					handle = setTimeout(run, 5);
				}
			}

			run();
		}
	},

	throttle: {
		'preserves context'() {
			const dfd = this.async(TIMEOUT);
			const foo = {
				bar: util.throttle(dfd.callback(function() {
					assert.strictEqual(this, foo, 'Function should be executed with correct context');
				}), 0)
			};

			foo.bar();
		},

		'receives arguments'() {
			const dfd = this.async(TIMEOUT);
			const testArg1 = 5;
			const testArg2 = 'a';
			const throttledFunction = util.throttle(dfd.callback(function (a: number, b: string) {
				assert.strictEqual(a, testArg1, 'Function should receive correct arguments');
				assert.strictEqual(b, testArg2, 'Function should receive correct arguments');
			}), 0);

			throttledFunction(testArg1, testArg2);
		},

		'throttles callback'() {
			const dfd = this.async(TIMEOUT);
			const spy = sinon.spy(function (a: number) {
				assert.isAbove(Date.now() - lastRunTick, 24,
					'Function should not be called until period has elapsed');

				lastRunTick = Date.now();
				if (spy.callCount > 1) {
					dfd.resolve();
					clearTimeout(handle);
				}
			});
			const throttledFunction = util.throttle(spy, 25);

			let runCount = 1;
			let lastRunTick = 0;
			let handle: any;

			function run() {
				throttledFunction();
				throttledFunction();
				runCount += 1;

				if (runCount < 6) {
					handle = setTimeout(run, 5);
				}
			}

			run();
			assert.strictEqual(spy.callCount, 1,
				'Function should be called as soon as it is first invoked');
		}
	},

	throttleAfter: {
		'preserves context'() {
			const dfd = this.async(TIMEOUT);
			const foo = {
				bar: util.throttleAfter(dfd.callback(function() {
					assert.strictEqual(this, foo, 'Function should be executed with correct context');
				}), 0)
			};

			foo.bar();
		},

		'receives arguments'() {
			const dfd = this.async(TIMEOUT);
			const testArg1 = 5;
			const testArg2 = 'a';
			const throttledFunction = util.throttleAfter(dfd.callback(function (a: number, b: string) {
				assert.strictEqual(a, testArg1, 'Function should receive correct arguments');
				assert.strictEqual(b, testArg2, 'Function should receive correct arguments');
			}), 0);

			throttledFunction(testArg1, testArg2);
		},

		'throttles callback'() {
			const dfd = this.async(1000);
			const spy = sinon.spy();
			const throttledFunction = util.throttleAfter(spy, 100);

			throttledFunction();
			assert.strictEqual(spy.callCount, 0,
				'Function should not be called until end of interval');

			setTimeout(function () {
				throttledFunction();
				throttledFunction();
				throttledFunction();
			}, 90);

			setTimeout(dfd.callback(function () {
				assert.strictEqual(spy.callCount, 1,
					'Function should be called once by end of interval');
			}), 150);
		}
	}
});
