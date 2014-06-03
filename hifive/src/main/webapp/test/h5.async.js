/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * hifive
 */

$(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	// testutils
	var isResolved = testutils.u.isResolved;

	var ERR = ERRCODE.h5.async;

	// jQueryのthenとpipeが同じかどうか(jQuery1.8以上なら同じ)
	var thenEqualsPipe = (function() {
		var dfd = $.Deferred();
		return dfd.then === dfd.pipe;
	})();

	// 非同期をチェーンさせるメソッド名。thenとpipeが同じならthen、そうでないならpipe
	var thenCompatMethod = thenEqualsPipe ? 'then' : 'pipe';

	//=============================
	// Functions
	//=============================
	/**
	 * 何もしない空の関数。コールバックの指定で使用する。
	 */
	function emptyFunc() {
	// 何もしない
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module("Async - isPromise");

	//=============================
	// Body
	//=============================

	test('promiseオブジェクトを判定', 4, function() {
		ok(h5.async.isPromise(h5.async.deferred().promise()),
				'h5.async.deferred().promise()はpromiseオブジェクト');
		ok(h5.async.isPromise($.Deferred().promise()), '$.Deferred().promise()はpromiseオブジェクト');
		ok(!h5.async.isPromise(h5.async.deferred()), 'h5.async.deferred()はpromiseオブジェクトではない。');
		ok(!h5.async.isPromise($.Deferred()), '$.Deferred().promise()はpromiseオブジェクトではない。');
	});

	//=============================
	// Definition
	//=============================

	module("Async - deferred");

	//=============================
	// Body
	//=============================

	test('Deferredオブジェクトは作成できたか()', 5, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		ok(dfd, 'Deferredオブジェクトは作成できたか');
		ok(dfd.notify, 'Deferredオブジェクトにnotifyメソッドが用意されているか');
		ok(dfd.notifyWith, 'DeferredオブジェクトにnotifyWithメソッドが用意されているか');
		ok(dfd.progress, 'Deferredオブジェクトにprogressメソッドが用意されているか');
		ok(promise.progress, 'Promiseオブジェクトにprogressメソッドが用意されているか');
	});

	//=============================
	// Definition
	//=============================

	module("Async - notify/progress");

	//=============================
	// Body
	//=============================
	test('progressフィルタの動作タイミング', 3, function() {
		var dfd = h5.async.deferred();
		var isCalled1 = false;
		var isCalled2 = false;
		dfd.progress(function() {
			isCalled1 = true;
		});
		strictEqual(isCalled1, false, 'notifyされていないDeferredにprogressを登録しても即実行されないこと');

		dfd.notify();
		strictEqual(isCalled1, true, 'notifyを呼んだときに、登録済みのprogressフィルタが実行されること');
		dfd.progress(function() {
			isCalled2 = true;
		});
		strictEqual(isCalled2, true, 'notifyを呼んだあとに、progressを登録すると即実行されること');
	});

	test('notifyを引数なしで呼び出し', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().progress(function() {
			strictEqual(arguments.length, 0, 'notifyの引数を省略した時、progressコールバックに引数は渡されないこと');
		});
		dfd.notify();
	});

	test('notifyWithの第2引数を指定せずに呼び出し', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().progress(function() {
			strictEqual(arguments.length, 0, 'notifyWithの第2引数を省略した時、progressコールバックに引数は渡されないこと');
		});
		dfd.notifyWith(dfd);
	});

	test('progressフィルタの引数', 8, function() {
		var dfd = h5.async.deferred();
		var ary = [1];
		dfd.progress(function() {
			strictEqual(arguments[0], ary, 'notifyで渡した引数がprogressフィルタで受け取れること(第1引数)');
			strictEqual(arguments[1], 2, 'notifyで渡した引数がprogressフィルタで受け取れること(第2引数)');
			strictEqual(arguments[2], null, 'notifyで渡した引数がprogressフィルタで受け取れること(第3引数)');
			strictEqual(arguments.length, 3, 'notifyで渡した引数の数とprogressフィルタで受け取った引数の数が同じであること');
		}).notify(ary, 2, null);

		dfd = h5.async.deferred();
		dfd.progress(function() {
			strictEqual(arguments[0], ary, 'notifyWithで渡した引数がprogressフィルタで受け取れること(第1引数)');
			strictEqual(arguments[1], 2, 'notifyWithで渡した引数がprogressフィルタで受け取れること(第2引数)');
			strictEqual(arguments[2], null, 'notifyWithで渡した引数がprogressフィルタで受け取れること(第3引数)');
			strictEqual(arguments.length, 3, 'notifyWithで渡した引数の数とprogressフィルタで受け取った引数の数が同じであること');
		}).notifyWith(this, [ary, 2, null]);
	});

	test('notifyの第1引数が、null,undefinedの時、null,undefinedがprogressコールバックに渡されること', 4, function() {
		var dfd = h5.async.deferred();
		var expectArg = null;
		dfd.promise().progress(function(arg) {
			strictEqual(arguments.length, 1, '引数は1つ');
			strictEqual(arg, expectArg, expectArg + 'が引数で渡されていること');
		});
		dfd.notify(null);
		expectArg = undefined;
		dfd.notify(undefined);
	});

	test('notifyWithの第2引数がnull,undefinedの時、無視されてprogressコールバックに引数は渡されないこと', 2, function() {
		var dfd = h5.async.deferred();
		dfd.promise().progress(function() {
			strictEqual(arguments.length, 0, '引数なしで実行された');
		});
		dfd.notifyWith(dfd, null);
		dfd.notifyWith(dfd, undefined);
	});

	test('progressフィルタのthis(各jQuery共通)', 1, function() {
		var dfd = h5.async.deferred();
		var obj = {};

		dfd = h5.async.deferred();
		dfd.progress(function() {
			strictEqual(this, obj, 'notifyをcallでコンテキストを変更して呼んだので、thisは指し替わっていること');
		}).notify.call(obj);
	});

	test('[jquery#1.9-]progressフィルタのthis', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		dfd.progress(function() {
			strictEqual(this, dfd, 'dfd.progressで登録したprogressフィルタのthisはdeferredオブジェクトであること');
		});
		promise.progress(function() {
			strictEqual(this, dfd, 'promise.progressで登録したprogressフィルタのthisはdeferredオブジェクトであること');
		});
		dfd.notify();
	});

	test('[jquery#-1.8]progressフィルタのthis', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		dfd.progress(function() {
			strictEqual(this, dfd.promise(),
					'dfd.progressで登録したprogressフィルタのthisはpromiseオブジェクトであること');
		});
		promise.progress(function() {
			strictEqual(this, dfd.promise(),
					'promise.progressで登録したprogressフィルタのthisはpromiseオブジェクトであること');
		});
		dfd.notify();
	});

	test('notifyWith()で呼ばれたprogressコールバックの引数とthis', 1, function() {
		var obj = {};
		var dfd;
		dfd = h5.async.deferred();
		dfd.progress(function() {
			strictEqual(this, obj, 'notifyWith()の第一引数に指定したオブジェクトがprogressフィルタのthisであること');
		}).notifyWith(obj);
	});

	test('progressの引数は配列、多重配列、可変長、配列を含む可変長で渡せること', 7, function() {
		var dfd = h5.async.deferred();
		var count = 0;
		dfd.promise().progress(function() {
			strictEqual(++count, 1, '1番目に渡した関数');
		}, [function() {
			strictEqual(++count, 2, '2番目に渡した関数');
		}, function() {
			strictEqual(++count, 3, '3番目に渡した関数');
		}, [function() {
			strictEqual(++count, 4, '4番目に渡した関数');
		}], function() {
			strictEqual(++count, 5, '5番目に渡した関数');
		}], function() {
			strictEqual(++count, 6, '6番目に渡した関数');
		});
		strictEqual(count, 0, 'notifyする前には実行されていないこと');
		dfd.notify();
	});

	test('progressの引数で、関数以外は無視されること', 3, function() {
		var dfd = h5.async.deferred();
		var count = 0;
		dfd.promise().progress(function() {
			strictEqual(++count, 1, '1番目に渡した関数');
		}, [1, 2, null, function() {
			strictEqual(++count, 2, '2番目に渡した関数');
		}], {}, function() {
			strictEqual(++count, 3, '3番目に渡した関数');
		});
		dfd.notify();
	});

	//=============================
	// Definition
	//=============================

	module('Async - reject/fail');

	//=============================
	// Body
	//=============================

	test('failフィルタの動作タイミング', 3, function() {
		var dfd = h5.async.deferred();
		var isCalled1 = false;
		var isCalled2 = false;
		dfd.fail(function() {
			isCalled1 = true;
		});
		strictEqual(isCalled1, false, 'rejectされていないDeferredにfailを登録しても即実行されないこと');

		dfd.reject();
		strictEqual(isCalled1, true, 'rejectを呼んだときに、登録済みのfailフィルタが実行されること');
		dfd.fail(function() {
			isCalled2 = true;
		});
		strictEqual(isCalled2, true, 'rejectを呼んだあとに、failを登録すると即実行されること');
	});

	test('rejectを引数なしで呼び出し', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().fail(function() {
			strictEqual(arguments.length, 0, 'rejectの引数を省略した時、failコールバックに引数は渡されないこと');
		});
		dfd.reject();
	});

	test('rejectWithの第2引数を指定せずに呼び出し', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().fail(function() {
			strictEqual(arguments.length, 0, 'rejectWithの第2引数を省略した時、failコールバックに引数は渡されないこと');
		});
		dfd.rejectWith(dfd);
	});

	test('failフィルタの引数', 8, function() {
		var dfd = h5.async.deferred();
		var ary = [1];
		dfd.fail(function() {
			strictEqual(arguments[0], ary, 'rejectで渡した引数がfailフィルタで受け取れること(第1引数)');
			strictEqual(arguments[1], 2, 'rejectで渡した引数がfailフィルタで受け取れること(第2引数)');
			strictEqual(arguments[2], null, 'rejectで渡した引数がfailフィルタで受け取れること(第3引数)');
			strictEqual(arguments.length, 3, 'rejectで渡した引数の数とfailフィルタで受け取った引数の数が同じであること');
		}).reject(ary, 2, null);

		dfd = h5.async.deferred();
		dfd.fail(function() {
			strictEqual(arguments[0], ary, 'rejectWithで渡した引数がfailフィルタで受け取れること(第1引数)');
			strictEqual(arguments[1], 2, 'rejectWithで渡した引数がfailフィルタで受け取れること(第2引数)');
			strictEqual(arguments[2], null, 'rejectWithで渡した引数がfailフィルタで受け取れること(第3引数)');
			strictEqual(arguments.length, 3, 'rejectWithで渡した引数の数とfailフィルタで受け取った引数の数が同じであること');
		}).rejectWith(this, [ary, 2, null]);
	});

	test('rejectの第1引数が、null,undefinedの時、null,undefinedがfailフィルタに渡されること', 4, function() {
		var dfd = h5.async.deferred();
		var expectArg = null;
		dfd.promise().fail(function(arg) {
			strictEqual(arguments.length, 1, '引数は1つ');
			strictEqual(arg, expectArg, expectArg + 'が引数で渡されていること');
		});
		dfd.reject(null);

		dfd = h5.async.deferred();
		expectArg = undefined;
		dfd.promise().fail(function(arg) {
			strictEqual(arguments.length, 1, '引数は1つ');
			strictEqual(arg, expectArg, expectArg + 'が引数で渡されていること');
		});
		dfd.reject(undefined);
	});

	test('rejectWithの第2引数がnull,undefinedの時、無視されてfailコールバックに引数は渡されないこと', 2, function() {
		var dfd = h5.async.deferred();
		dfd.promise().fail(function() {
			strictEqual(arguments.length, 0, '引数なしで実行された');
		});
		dfd.rejectWith(dfd, null);

		dfd = h5.async.deferred();
		dfd.promise().fail(function() {
			strictEqual(arguments.length, 0, '引数なしで実行された');
		});
		dfd.rejectWith(dfd, undefined);
	});

	test('failフィルタのthis(各jQuery共通)', 1, function() {
		var dfd = h5.async.deferred();
		var obj = {};

		dfd = h5.async.deferred();
		dfd.fail(function() {
			strictEqual(this, obj, 'rejectをcallでコンテキストを変更して呼んだので、thisは指し替わっていること');
		}).reject.call(obj);
	});

	test('[jquery#1.9-]failフィルタのthis', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		dfd.fail(function() {
			strictEqual(this, dfd, 'dfd.failで登録したfailフィルタのthisはdeferredオブジェクトであること');
		});
		promise.fail(function() {
			strictEqual(this, dfd, 'promise.failで登録したfailフィルタのthisはdeferredオブジェクトであること');
		});
		dfd.reject();
	});

	test('[jquery#-1.8]failフィルタのthis', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		dfd.fail(function() {
			strictEqual(this, dfd.promise(), 'dfd.failで登録したfailフィルタのthisはpromiseオブジェクトであること');
		});
		promise.fail(function() {
			strictEqual(this, dfd.promise(), 'promise.failで登録したfailフィルタのthisはpromiseオブジェクトであること');
		});
		dfd.reject();
	});

	test('rejectWith()で呼ばれたfailコールバックの引数とthis', 1, function() {
		var obj = {};
		var dfd;
		dfd = h5.async.deferred();
		dfd.fail(function() {
			strictEqual(this, obj, 'rejectWith()の第一引数に指定したオブジェクトがfailフィルタのthisであること');
		}).rejectWith(obj);
	});

	test('failの引数は配列、多重配列、可変長、配列を含む可変長で渡せること', 7, function() {
		var dfd = h5.async.deferred();
		var count = 0;
		dfd.promise().fail(function() {
			strictEqual(++count, 1, '1番目に渡した関数');
		}, [function() {
			strictEqual(++count, 2, '2番目に渡した関数');
		}, function() {
			strictEqual(++count, 3, '3番目に渡した関数');
		}, [function() {
			strictEqual(++count, 4, '4番目に渡した関数');
		}], function() {
			strictEqual(++count, 5, '5番目に渡した関数');
		}], function() {
			strictEqual(++count, 6, '6番目に渡した関数');
		});
		strictEqual(count, 0, 'rejectする前には実行されていないこと');
		dfd.reject();
	});

	test('failの引数で、関数以外は無視されること', 3, function() {
		var dfd = h5.async.deferred();
		var count = 0;
		dfd.promise().fail(function() {
			strictEqual(++count, 1, '1番目に渡した関数');
		}, [1, 2, null, function() {
			strictEqual(++count, 2, '2番目に渡した関数');
		}], {}, function() {
			strictEqual(++count, 3, '3番目に渡した関数');
		});
		dfd.reject();
	});

	//=============================
	// Definition
	//=============================

	module('[jquery#1.8-]Async - then(!==pipe)');

	//=============================
	// Body
	//=============================

	test('thenとpipeは別関数であること', function() {
		var dfd = h5.async.deferred();
		notStrictEqual(dfd.then, dfd.pipe, 'thenとpipeは別関数であること');
	});

	test('thenはthenを呼んだ時のthisを返すこと。', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		var p = promise.then();
		ok(dfd.promise() === p, 'promise.then()の戻り値はpromiseであること');
		p = dfd.then();
		ok(dfd === p, 'deferred.then()の戻り値はdeferredであること');
	});

	test('thenはpipeとはことなり、登録した関数がpromiseを返しても無視して次のコールバックが呼ばれること。', 3, function() {
		var doneCalled = failCalled = progressCalled = false;
		var dfd = h5.async.deferred();
		dfd.then(function() {
			var dfd = $.Deferred();
			return dfd.promise();
		}).then(function() {
			doneCalled = true;
		});
		dfd.resolve();
		ok(doneCalled, 'thenで2つ目に登録したコールバックがpromiseを返していても、関係なく次のdoneコールバックが実行されること');

		dfd = h5.async.deferred();
		dfd.then(null, function() {
			var dfd = $.Deferred();
			return dfd.promise();
		}).then(null, function() {
			failCalled = true;
		});
		dfd.reject();
		ok(failCalled, 'thenで2つ目に登録したコールバックがpromiseを返していても、関係なく次のfailコールバックが実行されること');

		dfd = h5.async.deferred();
		dfd.then(null, null, function() {
			var dfd = $.Deferred();
			return dfd.promise();
		}).then(null, null, function() {
			progressCalled = true;
		});
		dfd.notify();
		ok(progressCalled, 'thenで2つ目に登録したコールバックがpromiseを返していても、関係なく次のdoneコールバックが実行されること');
	});

	//=============================
	// Definition
	//=============================

	module('Async - then(pipe)');

	//=============================
	// Body
	//=============================

	test('[jquery#-1.7]thenとpipeは同一関数であること', function() {
		var dfd = h5.async.deferred();
		strictEqual(dfd.then, dfd.pipe, 'thenとpipeは===であること');
	});

	test('[jquery#-1.7]thenはpromiseを返し、deferred.promise()の返すpromiseとは別のものであること', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		var p = promise.then();
		ok($.isFunction(p.promise), 'deferred.then()がpromiseを返すこと');
		ok(promise !== p, 'then()の戻り値はdeferred.promise()の戻り値とは別のPromiseであること');
	});

	test('then(またはpipe)でprogressフィルタを登録したときの動作タイミング',
			function() {
				var dfd = h5.async.deferred();
				var isCalled1 = false;
				var isCalled2 = false;
				var isCalled3 = false;
				var isCalled4 = false;
				var p = dfd[thenCompatMethod](null, null, function() {
					isCalled1 = true;
				});
				p[thenCompatMethod](null, null, function() {
					isCalled2 = true;
				});
				strictEqual(isCalled1, false, 'notifyされていないDeferredにthen(またはpipe)を登録しても即実行されないこと');
				strictEqual(isCalled2, false,
						'notifyされていないDeferredのthen(またはpipe)の戻り値にprogressを登録しても即実行されないこと');

				dfd.notify();
				strictEqual(isCalled1, true,
						'notifyを呼んだときに、Deferredのthen(またはpipe)で登録したprogressフィルタが実行されること');
				strictEqual(isCalled2, true,
						'notifyを呼んだときに、then(またはpipe)の戻り値のthen(またはpipe)で登録したprogressフィルタが実行されること');
				dfd.progress(function() {
					isCalled3 = true;
				});
				strictEqual(isCalled3, true,
						'notifyを呼んだあとに、Deferredのthen(またはpipe)でprogressを登録すると即実行されること');
				p.progress(function() {
					isCalled4 = true;
				});
				strictEqual(isCalled4, true,
						'notifyを呼んだあとに、then(またはpipe)の戻り値のthen(またはpipe)でprogressを登録すると即実行されること');
			});

	test('then(またはpipe)で登録したprogressフィルタがPromiseでない値を返した場合', function() {
		// 後でnotifyWith
		var dfd1 = h5.async.deferred();
		var filtered3 = dfd1[thenCompatMethod](null, null, function(value) {
			return value * 3;
		});
		var filtered4 = filtered3[thenCompatMethod](null, null, function(value) {
			return value * 4;
		});
		dfd1.notify(5);
		filtered3.progress(function(value) {
			strictEqual(value, 15,
					'then(またはpipe)()で登録したprogressフィルタの戻り値が次に実行されるprogressフィルタに引数で渡されること');
		});
		filtered4.progress(function(value) {
			strictEqual(value, 60,
					'then(またはpipe)()で登録したprogressフィルタの戻り値が次に実行されるprogressフィルタに引数で渡されること');
		});
	});

	asyncTest('then(またはpipe)のdoneコールバックがPromiseを返す場合', 6, function() {
		var count = 1;

		h5.async.deferred().resolve()[thenCompatMethod](function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(pipe1)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 2, '2番目に実行されること。(pipe1のdoneコールバック)');
		})[thenCompatMethod](function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(pipe2)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 4, '4番目に実行されること。(pipe2のdoneコールバック)');
		})[thenCompatMethod](function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(pipe3)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 6, '6番目に実行されること。(pipe3のdoneコールバック)');
			start();
		});
	});

	test('then(またはpipe)は新しいプロミスを返すこと', 2, function() {
		var dfd = h5.async.deferred();
		var p = dfd[thenCompatMethod]();
		ok(h5.async.isPromise(p), 'deferred.then(またはpipe)はpromiseを返すこと');
		ok(dfd.promise() != p, 'pipe()の戻り値はdeferred.promise()の戻り値とは別のPromiseであること');
	});

	test('then(またはpipe)の返したPromiseで登録したdone/failハンドラが、元のDeferredでresolve/rejectされたときに動作すること', 2,
			function() {
				var dfd = h5.async.deferred();
				var p = dfd[thenCompatMethod]();
				var doneFlg = false;
				p.done(function() {
					doneFlg = true;
				});
				dfd.resolve();
				ok(doneFlg, 'doneハンドラが実行されたこと');

				dfd = h5.async.deferred();
				p = dfd[thenCompatMethod]();
				var failFlg = false;
				p.fail(function() {
					failFlg = true;
				});
				dfd.reject();
				ok(failFlg, 'failハンドラが実行されたこと');
			});

	test(
			'then(またはpipe)の返したPromiseで登録したdone/failハンドラのthisが、元のDeferredのresolveWith/rejectWithで指定した値であること',
			2, function() {
				var dfd = h5.async.deferred();
				var p = dfd[thenCompatMethod]();
				var obj = {};
				var doneThis = null;
				p.done(function() {
					doneThis = this;
				});
				dfd.resolveWith(obj);
				strictEqual(doneThis, obj, 'resolveWith()で指定したオブジェクトがdoneハンドラのthisになっていること');

				dfd = h5.async.deferred();
				p = dfd[thenCompatMethod]();
				var failThis = null;
				p.fail(function() {
					failThis = this;
				});
				dfd.rejectWith(obj);
				strictEqual(failThis, obj, 'rejectWith()で指定したオブジェクトがfailハンドラのthisになっていること');
			});

	test('then(またはpipe)の返したPromiseで登録したdone/failハンドラに渡される引数が、pipeに渡した関数が返した値であること', 2, function() {
		var dfd = h5.async.deferred();
		var obj = {};
		var p = dfd[thenCompatMethod](function() {
			return obj;
		});
		var doneArg = null;
		p.done(function(arg) {
			doneArg = arg;
		});
		dfd.resolve(obj);
		strictEqual(doneArg, obj, 'pipeに渡した関数が返した値がdoneハンドラに渡されること');

		dfd = h5.async.deferred();
		p = dfd[thenCompatMethod](null, function() {
			return obj;
		});
		var failArg = null;
		p.fail(function(arg) {
			failArg = arg;
		});
		dfd.reject(obj);
		strictEqual(failArg, obj, 'pipeに渡した関数が返した値がfailハンドラに渡されること');
	});

	asyncTest('then(またはpipe)のfailコールバックがPromiseを返す場合、pipeの実行がPromiseの完了を待っているか', 6, function() {
		var count = 1;

		h5.async.deferred().reject()[thenCompatMethod](null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(pipe1)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 2, '2番目に実行されること。(pipe1のfailコールバック)');
		})[thenCompatMethod](null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(pipe2)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 4, '4番目に実行されること。(pipe2のfailコールバック)');
		})[thenCompatMethod](null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(pipe3)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 6, '6番目に実行されること。(pipe3のfailコールバック)');
			start();
		});
	});

	asyncTest('then(またはpipe)のdoneコールバックがPromiseを返す場合、then(またはpipe)の実行がPromiseの完了を待っているか', 6,
			function() {
				var count = 1;

				h5.async.deferred().resolve()[thenCompatMethod](function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 1, '1番目に実行されること。(then1)');
						dfd.resolve();
					}, 0);

					return dfd.promise();
				}).done(function() {
					equal(count++, 2, '2番目に実行されること。(then1のdoneコールバック)');
				})[thenCompatMethod](function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 3, '3番目に実行されること。(then2)');
						dfd.resolve();
					}, 0);

					return dfd.promise();
				}).done(function() {
					equal(count++, 4, '4番目に実行されること。(then2のdoneコールバック)');
				})[thenCompatMethod](function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 5, '5番目に実行されること。(then3)');
						dfd.resolve();
					}, 0);

					return dfd.promise();
				}).done(function() {
					equal(count++, 6, '6番目に実行されること。(then3のdoneコールバック)');
					start();
				});
			});

	asyncTest('then(またはpipe)のfailコールバックがPromiseを返す場合、then(またはpipe)の実行がPromiseの完了を待っているか', 6,
			function() {
				var count = 1;

				h5.async.deferred().reject()[thenCompatMethod](null, function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 1, '1番目に実行されること。(then1)');
						dfd.reject();
					}, 0);

					return dfd.promise();
				}).fail(function() {
					equal(count++, 2, '2番目に実行されること。(then1のfailコールバック)');
				})[thenCompatMethod](null, function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 3, '3番目に実行されること。(then2)');
						dfd.reject();
					}, 0);

					return dfd.promise();
				}).fail(function() {
					equal(count++, 4, '4番目に実行されること。(then2のfailコールバック)');
				})[thenCompatMethod](null, function() {
					var dfd = $.Deferred();

					setTimeout(function() {
						equal(count++, 5, '5番目に実行されること。(then3)');
						dfd.reject();
					}, 0);

					return dfd.promise();
				}).fail(function() {
					equal(count++, 6, '6番目に実行されること。(then3のfailコールバック)');
					start();
				});
			});

	test(
			'then(またはpipe)で登録した関数がpromiseを返した時、そのpromiseがreject/resolveされたらthen(またはpipe)の戻り値もreject/resolveされること',
			2,
			function() {
				var dfd = h5.async.deferred();
				var p = dfd[thenCompatMethod](function() {
					return h5.async.deferred().reject().promise();
				});
				dfd.resolve();
				p
						.fail(function() {
							ok(true,
									'thenで登録した関数が返したpromiseがreject()された時に、thenの戻り値に登録したfailコールバックが実行されること');
						});

				dfd = h5.async.deferred();
				p = dfd[thenCompatMethod](function() {
					return h5.async.deferred().resolve().promise();
				});
				dfd.resolve();
				p
						.done(function() {
							ok(true,
									'thenで登録した関数が返したpromiseがresolve()された時に、thenの戻り値に登録したdoneコールバックが実行されること');
						});
			});

	//=============================
	// Definition
	//=============================

	module('Async - commonFailHandlerの動作', {
		setup: function() {
			var that = this;
			h5.settings.commonFailHandler = function() {
				that.cfhFlag = true;
			};
		},
		teardown: function() {
			h5.settings.commonFailHandler = undefined;
			this.cfhFlag = false;
		},
		cfhFlag: false
	});

	//=============================
	// Body
	//=============================

	test('deferred.resolve()が呼ばれた時、commonFailHandlerは動作しないこと', 1, function() {
		var dfd = h5.async.deferred();
		dfd.resolve();
		strictEqual(this.cfhFlag, false, 'commonFailHandlerは動作しないこと');
	});

	test('failコールバックが登録されていない時、reject()を呼んだ時にcommonFailHandlerが1回だけ動作すること', 1, function() {
		var count = 0;
		h5.settings.commonFailHandler = function() {
			count++;
		};
		var dfd = h5.async.deferred();
		dfd.reject();
		strictEqual(count, 1, 'commonFailHandlerが1度だけ実行されたこと');
	});

	test('failコールバックが登録されていない時、rejectWith()を呼んだ時にcommonFailHandlerが1回だけ動作すること', 1, function() {
		var count = 0;
		h5.settings.commonFailHandler = function() {
			count++;
		};
		var dfd = h5.async.deferred();
		dfd.rejectWith();
		strictEqual(count, 1, 'commonFailHandlerが1度だけ実行されたこと');
	});

	test('doneコールバックが登録されていて、failコールバックが登録されていない時、reject()でcommonFailHandlerが動作すること', 1,
			function() {
				var dfd = h5.async.deferred().done(emptyFunc);
				dfd.reject();
				strictEqual(this.cfhFlag, true, 'commonFailHandlerが動作していること');
			});

	test('progressコールバックが登録されていて、failコールバックが登録されていない時、reject()でcommonFailHandlerが動作すること', 1,
			function() {
				var dfd = h5.async.deferred().progress(emptyFunc);
				dfd.reject();
				strictEqual(this.cfhFlag, true, 'commonFailHandlerが動作していること');
			});

	test('then(またはpipe)でfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		var dfd = h5.async.deferred();
		// pipeでfailハンドラを登録。pipeが返すpromiseにfailを登録。
		dfd.promise()[thenCompatMethod](null, emptyFunc).fail(emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag,
				'deferred.then(またはpipe) で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないこと');
	});

	test('then(またはpipe)でfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		var dfd = h5.async.deferred();
		// pipeでfailハンドラを登録しない。pipeが返すpromiseにfailを登録。
		dfd.promise()[thenCompatMethod]()[thenCompatMethod](emptyFunc);
		dfd.reject();
		ok(this.cfhFlag, 'deferred.then(またはpipe) でfailコールバックを登録しなければ、commonFailHandlerは呼ばれること');
	});

	test('[jquery#1.8-]thenでfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise().then(null, emptyFunc, null);
		if (promise !== dfd.promise()) {
			// thenが新しいプロミスを返した場合は、そのプロミスにはfailコールバックを登録する
			promise.fail(emptyFunc);
		}
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.then() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないこと');
	});

	test('[jquery#1.8-]thenでfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise().then(emptyFunc, null, emptyFunc);
		if (promise !== dfd.promise()) {
			// thenが新しいプロミスを返した場合は、そのプロミスにはfailコールバックを登録する
			promise.fail(emptyFunc);
		}
		dfd.reject();
		ok(this.cfhFlag, 'deferred.then() でfailコールバックを登録しなければ、commonFailHandlerは呼ばれること');
	});

	test(
			'.then(またはpipe)のコールバックが返したプロミスがrejectされた時、commonFailHandlerが呼ばれること',
			1,
			function() {
				var d1 = h5.async.deferred();
				var d2 = h5.async.deferred();
				d1[thenCompatMethod](function() {
					return d2.promise();
				});
				d1.resolve();
				d2.reject();
				ok(this.cfhFlag,
						'deferred.then()に登録したコールバック関数が返したプロミスがrejectされた時、commonFailHandlerが呼ばれること');
			});

	test(
			'[jquery#1.8-]thenのコールバックが返したプロミスがrejectされた時、commonFailHandlerが呼ばれること',
			1,
			function() {
				var d1 = h5.async.deferred();
				var d2 = h5.async.deferred();
				d1.then(function() {
					return d2.promise();
				});
				d1.resolve();
				d2.reject();
				ok(this.cfhFlag,
						'deferred.then()に登録したコールバック関数が返したプロミスがrejectされた時、commonFailHandlerが呼ばれること');
			});

	test('alwaysでfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().always(emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.always() でコールバックを指定した時に、commonFailHandlerが呼ばれないこと');
	});

	test('alwaysでfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		var dfd = h5.async.deferred();
		dfd.always();
		dfd.reject();
		ok(this.cfhFlag, 'deferred.always() でコールバックを登録しなければ、commonFailHandlerは呼ばれること');
	});

	test('fail()の引数に有効なコールバックを指定せずに呼び出した場合、commonFailHandlerは動作すること', 4, function() {
		var dfd = h5.async.deferred();
		dfd.fail().reject();
		ok(this.cfhFlag, '引数なしで登録しても、commonFailHandlerは呼ばれないこと');
		this.cfhFlag = false;

		dfd = h5.async.deferred();
		dfd.fail(null).reject();
		ok(this.cfhFlag, 'fail(null) で、commonFailHandlerが呼ばれないこと');
		this.cfhFlag = false;

		dfd = h5.async.deferred();
		dfd.fail([1, null]).reject();
		ok(this.cfhFlag, 'fail([1, null]) で、commonFailHandlerが呼ばれないこと');
		this.cfhFlag = false;

		dfd = h5.async.deferred();
		dfd.fail(1, null).reject();
		ok(this.cfhFlag, 'fail(1, null) で、commonFailHandlerが呼ばれないこと');
		this.cfhFlag = false;
	});

	test('reject()で呼ばれたcommonFailHandlerの引数とthis', 3,
			function() {
				var dfd;
				h5.settings.commonFailHandler = function() {
					var args = Array.prototype.slice.call(arguments);
					deepEqual(args, [[1], 2, null], 'reject()で渡した引数がcommonFailHandlerに渡されていること');
					ok(this === dfd || this === dfd.promise(),
							'deferredからrejectを呼んだので、thisはdeferredであること');
				};
				dfd = h5.async.deferred();
				dfd.reject([1], 2, null);

				var obj = {};
				h5.settings.commonFailHandler = function() {
					strictEqual(this, obj, 'rejectをcallでコンテキストを変更して呼んだので、thisは指し替わっていること');
				};
				dfd = h5.async.deferred();
				dfd.reject.call(obj, [1], 2, null);
			});

	test('rejectWith()で呼ばれたcommonFailHandlerの引数とthis', 2, function() {
		var obj = {};
		var dfd;
		h5.settings.commonFailHandler = function() {
			var args = Array.prototype.slice.call(arguments);
			deepEqual(args, [[1], 2, null], 'rejectWith()で渡した引数がcommonFailHandlerに渡されていること');
			strictEqual(this, obj, 'rejectWith()の第一引数に指定したオブジェクトがcommonFailHandler内のthisであること');
		};
		dfd = h5.async.deferred();
		dfd.rejectWith(obj, [[1], 2, null]);
	});
	//=============================
	// Definition
	//=============================

	module("Async - when");
	// h5.async.whenは、jQuery1.7以上の場合はh5.async.whenをラップしているが、
	// jQuery1.6.xの場合はhifiveがh5.async.when相当のものを独自実装しているため、whenの機能全般をここでテストする。

	//=============================
	// Body
	//=============================

	test('戻り値にprogressメソッドがあること', 1, function() {
		var df1 = $.Deferred();
		ok(h5.async.when(df1.promise()).progress);
	});

	test('引数に配列で複数のpromiseを渡してwhenの動作をすること', 3, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var doneCount = 0;

		h5.async.when([df1.promise(), df2.promise()]).done(function() {
			doneCount++;
		});
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df2.resolve(2);
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df1.resolve(1);
		strictEqual(doneCount, 1, '全てresolveされたのでdoneコールバックは1度だけ実行されていること');
	});

	test('引数に可変長で複数のpromiseを渡してwhenの動作をすること', 3, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var doneCount = 0;

		h5.async.when(df1.promise(), df2.promise()).done(function() {
			doneCount++;
		});
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df2.resolve(2);
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df1.resolve(1);
		strictEqual(doneCount, 1, '全てresolveされたのでdoneコールバックは1度だけ実行されていること');
	});

	test('jQuery.Deferred()、そのプロミス、h5.async.deferred()、そのプロミス、を引数で受け取れること', 5, function() {
		var df1 = $.Deferred();
		var df2 = $.Deferred();
		var df3 = h5.async.deferred();
		var df4 = h5.async.deferred();

		var doneCount = 0;

		h5.async.when(df1, df2.promise(), df3, df4.promise()).done(function() {
			doneCount++;
		});
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df1.resolve();
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df2.resolve();
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df3.resolve();
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df4.resolve();
		strictEqual(doneCount, 1, '全てresolveされたのでdoneコールバックは1度だけ実行されていること');
	});

	test('プロミスオブジェクトでないものは無視されること', 3, function() {
		var df1 = h5.async.deferred();

		var doneCount = 0;

		h5.async.when(df1, 3, {}).done(function() {
			doneCount++;
		});
		ok(!doneCount, '全てresolveされるまでdoneコールバックは実行されないこと');
		df1.resolve();
		strictEqual(doneCount, 1, 'プロミスオブジェクトが全てresolveされたのでdoneコールバックは1度だけ実行されていること');

		doneCount = 0;
		h5.async.when(3, {}).done(function() {
			doneCount++;
		});
		strictEqual(doneCount, 1, 'プロミスオブジェクトが引数に一つもない場合、即座にdoneコールバックが1度だけ実行されること');
	});

	test('resolveされた時のdoneコールバックの動作', 3, function() {
		var df1 = $.Deferred();
		var df2 = $.Deferred();

		var doneCount = 0;
		h5.async.when(df1, df2).done(
				function() {
					doneCount++;
					ok(true, '$.Deferred()のPromiseがresolveされたので、doneコールバックが実行されること。');
					deepEqual([1, 2], h5.u.obj.argsToArray(arguments),
							'引数にそれぞれのdeferredのresolveで渡された値が格納されていること');
				});
		df2.resolve(2);
		strictEqual(doneCount, 0, 'doneコールバックはすべてのプロミスがresolveされるまで実行されていないこと');
		df1.resolve(1);
	});

	test('rejectされた時のfailコールバックの動作', 3, function() {
		var df1 = $.Deferred();
		var df2 = $.Deferred();

		var failCount = 0;
		h5.async.when(df1, df2).done(function() {
			ok(false, 'テスト失敗');
		}).fail(function(args) {
			failCount++;
			ok(true, '$.Deferred()のPromiseの一つがrejectされたので、failコールバックが実行されること。');
			deepEqual(h5.u.obj.argsToArray(arguments), [1, 2, 3], 'rejectで渡された値が引数で受け取れていること');
		});
		df1.resolve(11);
		strictEqual(failCount, 0, 'failコールバックはいずれかのプロミスがrejectされるまで実行されていないこと');
		df2.reject(1, 2, 3);
	});

	test('notifyされた時のprogressコールバックの動作', 3, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		var expectArgs;
		h5.async.when([df1, df2]).progress(function(name, name2) {
			deepEqual(expectArgs, h5.u.obj.argsToArray(arguments), '引数にnotifyで渡された値が格納されていること');
		});

		expectArgs = ['df1', undefined];
		df1.notify('df1');
		expectArgs = ['df1', 'df2'];
		df2.notify('df2');
		expectArgs = [['df1-1', 'df1-2'], 'df2'];
		df1.notify('df1-1', 'df1-2');
	});

	// jQuery1.7以下、jQuery1.8、jQuery1.9以上でdoneコールバックのthisの値が違うのでテストケースを分けています
	// 1.7以下では、resolve/resolveWithに関わらず、thisはwhenの戻り値のpromiseオブジェクト
	// 1.8では、resolveを呼んだdeferredと、resolveWithで指定したcontextの配列
	// 1.9以降では、resolveを呼んだdeferredのpromiseと、resolveWithで指定したcontextの配列
	test('[jquery#1.8-]resolve/resolveWithした時のdoneコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var obj = {
			a: 1
		};
		var expectThis = null;
		var p = h5.async.when(df1, df2).done(function() {
			ok(this && this.resolve, 'thisはdeferredオブジェクトであること');
			strictEqual(this.promise(), expectThis, 'this.promise()はwhenの戻り値であるプロミスであること');
		});

		expectThis = p;
		df1.resolve(1, 2);
		df2.resolveWith(obj, [3, 4]);
	});

	test(
			'[jquery#-1.7,1.9-]resolve/resolveWithした時のdoneコールバックのthis',
			1,
			function() {
				var df1 = h5.async.deferred();
				var df2 = h5.async.deferred();
				var obj = {
					a: 1
				};
				var p = h5.async
						.when(df1, df2)
						.done(
								function() {
									deepEqual(this, [df1, obj],
											'thisはresolveを呼んだdeferredのpromiseと、resolveWithで指定したものがそれぞれ格納されている配列であること');
								});
				df1.resolve(1, 2);
				df2.resolveWith(obj, [3, 4]);
			});

	test(
			'[jquery#-1.8]resolve/resolveWithした時のdoneコールバックのthis',
			1,
			function() {
				var df1 = h5.async.deferred();
				var df2 = h5.async.deferred();
				var obj = {
					a: 1
				};
				var p = h5.async
						.when(df1, df2)
						.done(
								function() {
									deepEqual(this, [df1.promise(), obj],
											'thisはresolveを呼んだdeferredのpromiseと、resolveWithで指定したものがそれぞれ格納されている配列であること');
								});
				df1.resolve(1, 2);
				df2.resolveWith(obj, [3, 4]);
			});

	// jQuery1.8以下とjQuery1.9以上でrejectを呼んだ時のfailコールバックのthisの値が違うのでテストケースを分けています
	// 1.8以下では、rejectを呼んだdeferred
	// 1.9以降では、rejectされたdeferredのpromise
	test('[jquery#1.9-]reject/rejectWithした時のprogressコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		h5.async.when(df1, df2).fail(function() {
			strictEqual(this, df2, 'thisはreject()を呼んだdeferred');
		});
		df1.resolve();
		df2.reject();

		var df3 = h5.async.deferred();
		var obj = {
			a: 1
		};
		h5.async.when(df3).fail(function() {
			strictEqual(this, obj, 'thisはrejectWith()第1引数');
		});
		df3.rejectWith(obj);
	});

	test('[jquery#-1.8]reject/rejectWithした時のprogressコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		h5.async.when(df1, df2).fail(function() {
			strictEqual(this, df2.promise(), 'thisはreject()を呼んだdeferredのpromise');
		});
		df1.resolve();
		df2.reject();

		var df3 = h5.async.deferred();
		var obj = {
			a: 1
		};
		h5.async.when(df3).fail(function() {
			strictEqual(this, obj, 'thisはrejectWith()第1引数');
		});
		df3.rejectWith(obj);
	});

	// jQuery1.7以下、jQuery1.8、jQuery1.9以上でprogressコールバックのthisの値が違うのでテストケースを分けています
	// 1.7以下では、notify/notifyWithに関わらず、thisはwhenの戻り値のpromiseオブジェクト
	// 1.8では、notifyを呼んだdeferredと、resolveWithで指定したcontextの配列
	// 1.9以降では、notifyを呼んだdeferredのpromiseと、resolveWithで指定したcontextの配列
	test('[jquery#1.8-]notify/notifyWithした時のprogressコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var obj = {
			a: 1
		};
		var p = h5.async.when(df1, df2).progress(function() {
			strictEqual(this, p, 'thisはwhenの戻り値であるプロミスであること');
		});
		df1.notify();
		df2.notifyWith(obj);
	});

	test('[jquery#-1.7,1.9-]notify/notifyWithした時のprogressコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var obj = {
			a: 1
		};
		var expectThis = null;
		h5.async.when(df1, df2).progress(function() {
			deepEqual(this, expectThis, 'thisはwhenの戻り値であるプロミスであること');
		});
		expectThis = [df1, undefined];
		df1.notify();
		expectThis = [df1, obj];
		df2.notifyWith(obj);
	});

	test('[jquery#-1.8]notify/notifyWithした時のprogressコールバックのthis', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();
		var obj = {
			a: 1
		};
		var expectThis = null;
		var p = h5.async.when(df1, df2).progress(function() {
			deepEqual(this, expectThis, 'thisはwhenの戻り値であるプロミスであること');
		});
		expectThis = [df1.promise(), undefined];
		df1.notify();
		expectThis = [df1.promise(), obj];
		df2.notifyWith(obj);
	});

	test('commonFailHandlerの動作確認 rejectされなければCFHは動作しないこと', 4, function() {
		var ret = '';
		var cfhm = 'commonFailHandler';
		h5.settings.commonFailHandler = function() {
			ret += cfhm;
		};
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
		whenPromise.done(function() {
			ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること。');
			ok(isResolved(dfd2), '2番目の引数のプロミスオブジェクトがresolveされていること。');
		});
		dfd1.resolve();
		dfd2.resolve();
		strictEqual(ret, '', 'rejectしていないので、commonFailHandlerは実行されていないこと。');
		h5.settings.commonFailHandler = undefined;
		ok(!h5.settings.commonFailHandler, '（設定のクリーンアップ）');
	});

	test('commonFailHandlerの動作確認 failコールバックを指定していればCFHは動作しないこと', 3, function() {
		var ret = '';
		var cfhm = 'commonFailHandler';
		h5.settings.commonFailHandler = function() {
			ret += cfhm;
		};
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
		whenPromise.done(function() {
			ok(false, 'テスト失敗。doneコールバックが実行された');
		}).fail(function() {
			ok(true, 'h5.async.whenに渡したpromiseオブジェクトが一つでもrejectされたら、whenのfailコールバックが実行されること');
		});
		dfd1.resolve();
		dfd2.reject();

		strictEqual(ret, '', 'failコールバックを指定しているので、commonFailHandlerは実行されていないこと。');
		h5.settings.commonFailHandler = undefined;
		ok(!h5.settings.commonFailHandler, '（設定のクリーンアップ）');
	});

	test(
			'commonFailHandlerの動作確認 failコールバックを指定していない場合、whenの引数のプロミスについてのCFHは動作はしないが、whenで作成されたpromiseについてのCFHが動作すること。',
			4,
			function() {
				var ret = '';
				var cfhm = 'commonFailHandler';
				h5.settings.commonFailHandler = function() {
					ret += cfhm;
				};
				var dfd1 = h5.async.deferred();
				var dfd2 = h5.async.deferred();
				var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
				whenPromise.done(function() {
					ok(false, 'テスト失敗。doneコールバックが実行された');
				});
				dfd1.resolve();
				dfd2.reject();
				strictEqual(ret, cfhm, 'failコールバックを指定していないので、commonFailHandlerが実行されること。');


				ret = '';
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();
				var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
				whenPromise.done(function() {
					ok(false, 'テスト失敗。doneコールバックが実行された');
				});
				dfd2
						.fail(function() {
							ok(true,
									'h5.async.whenに渡したpromiseオブジェクトがrejectされたとき、そのpromiseオブジェクトのfailコールバックが実行されること。');
						});
				dfd1.resolve();
				dfd2.reject();
				strictEqual(
						ret,
						cfhm,
						'h5.async.whenに渡したpromiseオブジェクトのfailコールバックが実行されても、h5.async.whenの戻り値にfailコールバックを指定していないので、commonFailHandlerが実行されること。');

				h5.settings.commonFailHandler = undefined;
				ok(!h5.settings.commonFailHandler, '（設定のクリーンアップ）');
			});

	test('done/failコールバックでresolve/reject時に渡した引数が受け取れること', 7, function() {
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
		whenPromise.done(function() {
			ok(false, 'テスト失敗。doneコールバックが実行された');
		}).fail(function(one, two, three) {
			strictEqual(one, 1, 'failコールバックで引数が受け取れること。');
			strictEqual(two, 2, 'failコールバックで引数が受け取れること。');
			strictEqual(three, 3, 'failコールバックで引数が受け取れること。');
		});
		dfd1.resolve(3, 2, 1);
		dfd2.reject(1, 2, 3);

		var ret = '';
		dfd1 = h5.async.deferred();
		dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
		whenPromise.done(function(one, two) {
			strictEqual(one, 1, 'doneコールバックで引数が受け取れること。');
			strictEqual(two, 2, 'doneコールバックで引数が受け取れること。');
		});
		dfd1.resolve(1);
		dfd2.resolve(2);

		ret = '';
		dfd1 = h5.async.deferred();
		dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when(dfd1.promise(), dfd2.promise());
		whenPromise.done(function(one, two) {
			deepEqual(one, [1, 2], 'doneコールバックで引数が受け取れること。');
			strictEqual(two, 2, 'doneコールバックで引数が受け取れること。');
		});
		dfd1.resolve(1, 2);
		dfd2.resolve(2);
	});

	test('配列を引数に取れること', 4, function() {
		var ret = '';
		var cfhm = 'commonFailHandler';
		h5.settings.commonFailHandler = function() {
			ret += cfhm;
		};
		var dfd1 = h5.async.deferred();
		var dfd2 = h5.async.deferred();
		var whenPromise = h5.async.when([dfd1.promise(), dfd2.promise()]);
		whenPromise.done(function() {
			ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること。');
			ok(isResolved(dfd2), '2番目の引数のプロミスオブジェクトがresolveされていること。');
		});
		dfd1.resolve();
		dfd2.resolve();
		strictEqual(ret, '', 'rejectしていないので、commonFailHandlerは実行されていないこと。');
		h5.settings.commonFailHandler = undefined;
		ok(!h5.settings.commonFailHandler, '（設定のクリーンアップ）');
	});

	test('※要目視確認：引数なしの場合は、即実行されること。ログは出力されないこと。', 2, function() {
		var count = 0;
		h5.async.when().done(function() {
			strictEqual(++count, 1, '引数なしの場合、即doneコールバックが実行されること');
			ok(true, '※要目視確認：引数なしの場合はログが出力されないこと。');
		});
		++count;
	});


	test('※要目視確認：引数にnull/undefinedを渡した場合は、即実行されること。ログは出力されないこと。', 3, function() {
		var count = 0;
		h5.async.when(undefined).done(function() {
			strictEqual(count, 0, '引数undefinedの場合、即doneコールバックが実行されること');
		});
		count++;

		count = 0;
		h5.async.when(null).done(function() {
			strictEqual(count, 0, '引数undefinedの場合、即doneコールバックが実行されること');
		});
		count++;

		ok(true, '※要目視確認：null/undefinedの場合はログが出力されないこと。');
	});

	test('※要目視確認：引数にプロミスオブジェクトと配列以外のものを渡した場合は、同期実行されること。ログが出力されること。', 11, function() {
		var argArray = [0, 1, true, false, {}];

		for (var i = 0, l = argArray.length; i < l; i++) {
			var count = 0;
			h5.async.when(argArray[i]).done(function() {
				equal(count++, 0, '引数が' + argArray[i].toString() + 'の場合、doneコールバックが同期的に実行されること。');
			});

			equal(count, 1, 'h5.async.whenのdoneコールバックの実行が同期的に行われること。');
		}
		ok(true, '※要目視確認：次のようなログが' + argArray.length
				+ '回出力されていること。『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
	});

	test('※要目視確認：引数を2つ以上渡して、プロミス以外のものがある場合、プロミス以外のものだけを無視してpromiseオブジェクトのresolveを待つこと。ログが出力されること。',
			13, function() {
				var dfd1;
				var argArray = [0, 1, true, false, {}, []];

				for (var i = 0, l = argArray.length; i < l; i++) {
					// deferredを初期化する
					dfd1 = h5.async.deferred();

					h5.async.when(dfd1.promise(), argArray).done(function() {
						ok(true, 'doneコールバックが実行されること');
						ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること');

					});
					dfd1.resolve();
				}
				ok(true, '※要目視確認：次のようなログが、INFOレベルで' + argArray.length
						+ '回出力されていること。『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
			});

	test(
			'※要目視確認：引数を2つ以上渡して、プロミスの配列がある場合、配列は無視して配列以外のpromiseオブジェクトのresolveだけを待つこと。ログが出力されること。',
			5,
			function() {
				var dfd1, dfd2, dfd3;
				// deferredを初期化する
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();
				h5.async.when(dfd1, [dfd2]).done(function() {
					ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneコールバックが実行されること');
					ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること');
				});
				dfd1.resolve();
				dfd2.reject();

				// deferredを初期化する
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();
				dfd3 = h5.async.deferred();
				h5.async.when(dfd1, [dfd2, dfd3]).done(function() {
					ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneコールバックが実行されること');
					ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること');
				});
				dfd2.resolve();
				dfd3.resolve();
				dfd1.resolve();
				ok(true,
						'※要目視確認：次のようなログが、INFOレベルで2回出力されていること。 『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
			});


	test(
			'配列の中身は再帰的に評価されないこと',
			3,
			function() {
				var dfd1 = h5.async.deferred();
				var dfd2 = h5.async.deferred();
				var dfd3 = h5.async.deferred();
				var whenPromise = h5.async.when([dfd1.promise(), [dfd2.promise(), dfd3.promise()]]);
				whenPromise
						.done(function() {
							ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneコールバックが実行されること');
							ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること');
							ok(true,
									'※要目視確認：次のようなログが、INFOレベルで出力されていること 『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
						});
				dfd2.reject();
				dfd3.reject();
				dfd1.resolve();
			});


	//=============================
	// Definition
	//=============================

	module("Async - loop");

	//=============================
	// Body
	//=============================

	asyncTest('同期', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			ret.push(value);
		}, 2);
		p.always(function() {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', '順番に関数が実行されていること');
		});
	});

	asyncTest('非同期', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			var dfd = h5.async.deferred();
			// 奇数なら非同期
			if (index % 2) {
				setTimeout(function() {
					ret.push(value);
					dfd.resolve();
				}, 0);
				return dfd.promise();
			}
			// 偶数なら同期
			ret.push(value);
		}, 2);
		p.always(function() {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', '順番に関数が実行されていること');
		});
	});

	asyncTest('loopControl#stop', 2, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			if (index === 4) {
				return loopControl.stop();
			}
			ret.push(value);
		}, 2);
		p.done(function(data) {
			start();
			ok(true, 'loopControl.stop()でdoneコールバックが呼ばれるか');
			strictEqual(ret.join(';'), '0;1;2;3', 'return falseで処理が止まるか');
		}).fail(function(data) {
			start();
			ok(false, 'loopControl.stop()でdoneコールバックが呼ばれるか');
		});
	});

	asyncTest('done', 2, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var time = 2;
		var p = h5.async.loop(array, function(index, value, loopControl) {
			loopControl.pause();
			setTimeout(function() {
				ret.push(value);
				if (index === 3) {
					loopControl.stop();
				} else {
					loopControl.resume();
				}
			}, 0);
		}, time);
		p.done(function(data) {
			start();
			ok(true, 'loopControl.stop()でdoneコールバックが呼ばれるか');
			strictEqual(ret.join(';'), '0;1;2;3', 'loopControler.stop()で処理が中断しているか');
		}).fail(function(data) {
			start();
			ok(false, 'loopControl.stop()でdoneコールバックが呼ばれるか');
		});
	});

	asyncTest('fail loop処理の途中で失敗するコールバックがある場合', 2, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			var dfd = h5.async.deferred();
			if (index % 2) {
				setTimeout(function() {
					ret.push(value);
					if (index === 3) {
						dfd.reject();
					} else {
						dfd.resolve();
					}
				}, 0);
				return dfd.promise();
			}
			ret.push(value);
		}, 2);
		p.fail(function() {
			start();
			ok(true, 'ユーザが作成したDeferredがrejectされるとfailコールバックが呼ばれるか');
			strictEqual(ret.join(';'), '0;1;2;3', 'promiseを返してrejectすると処理が止まるか');
		}).done(function() {
			start();
			ok(false, 'ユーザが作成したDeferredがrejectされるとfailコールバックが呼ばれるか');
		});
	});

	asyncTest('fail loop処理の最後に失敗するコールバックがある場合', 2, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			var dfd = h5.async.deferred();
			setTimeout(function() {
				ret.push(value);
				if (index === 5) {
					dfd.reject();
				} else {
					dfd.resolve();
				}
			}, 0);
			return dfd.promise();
		}, 2);
		p.fail(function() {
			start();
			ok(true, 'ユーザが作成したDeferredがrejectされるとfailコールバックが呼ばれるか');
			strictEqual(ret.join(';'), '0;1;2;3;4;5', 'loop処理は全て実行されていること');
		}).done(function() {
			start();
			ok(false, 'ユーザが作成したDeferredがrejectされるとfailコールバックが呼ばれるか');
		});
	});

	asyncTest('pause(),resume()', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			loopControl.pause();
			setTimeout(function() {
				ret.push(value);
				loopControl.resume();
			}, 0);
		}, 2);
		p.always(function(data) {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', 'loopControlは動作しているか');
		});
	});

	asyncTest('progress 同期', 10, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var time = 2;
		var p = h5.async.loop(array, function(index, value, loopControl) {
			ret.push(value);
		}, time);
		var count = 1;
		p.progress(function(status) {
			strictEqual(count * time - 1, status.index, 'progressで渡されるstatus.indexは正しいか');
			strictEqual(array[count * time - 1], status.value, 'progressで渡されるstatus.valueは正しいか');
			strictEqual(array, status.data, 'progressで渡されるstatus.dataは正しいか');
			count++;
		}).always(function(data) {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', '基本動作の確認');
		});
	});
	asyncTest('progress 非同期', 10, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var time = 2;
		var p = h5.async.loop(array, function(index, value, loopControl) {
			loopControl.pause();
			setTimeout(function() {
				ret.push(value);
				loopControl.resume();
			}, 0);
		}, time);
		var count = 1;
		p.progress(function(status) {
			strictEqual(count * time - 1, status.index, 'progressで渡されるstatus.indexは正しいか');
			strictEqual(array[count * time - 1], status.value, 'progressで渡されるstatus.valueは正しいか');
			strictEqual(array, status.data, 'progressで渡されるstatus.dataは正しいか');
			count++;
		}).always(function(data) {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', '基本動作の確認');
		});
	});

	asyncTest('引数チェック', 3, function() {
		var noArrayObjs = [1, {}, 'aaa'];
		for (var i = 0, len = noArrayObjs.length; i < len; i++) {
			try {
				h5.async.loop(noArrayObjs[i], function() {
				//
				}, 2);
			} catch (e) {
				ok(true, e.message);
			}
		}
		start();
	});
});