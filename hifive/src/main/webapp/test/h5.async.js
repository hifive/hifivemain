/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
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

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.async;

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

	test('notify/progress', 8, function() {
		var dfd = h5.async.deferred();

		var filtered1 = dfd.pipe(null, null, function(value) {
			return value * 10;
		});
		var filtered2 = filtered1.pipe(null, null, function(value) {
			return value * 2;
		});

		// 先にnotify
		var object = {
			a: 1
		};
		dfd.notifyWith(object, [5]);
		filtered1.progress(function(value) {
			strictEqual(this, object, 'notifyWith()実行後でコールバック登録と同時に実行される場合に、指定したコンテキストで実行されているか');
			strictEqual(value, 50,
					'notifyWith()実行後でコールバック登録と同時に実行される場合に、pipe()で登録したprogressFilterは通っているか1');
		});
		filtered2.progress(function(value) {
			strictEqual(value, 100,
					'notifyWith()実行後でコールバック登録と同時に実行される場合に、pipe()で登録したprogressFilterは通っているか2');
		});

		// 後でnotifyWith
		var dfd1 = h5.async.deferred();
		var filtered3 = dfd1.pipe(null, null, function(value) {
			return value * 3;
		});
		var filtered4 = filtered3.pipe(null, null, function(value) {
			return value * 4;
		});
		filtered3.progress(function(value) {
			strictEqual(this, object, 'notifyWith()で指定したコンテキストで実行されているか');
			strictEqual(value, 15, 'pipe()で登録したprogressFilterは通っているか1');
		});
		filtered4.progress(function(value) {
			strictEqual(value, 60, 'pipe()で登録したprogressFilterは通っているか2');
		});
		dfd1.notifyWith(object, [5]);

		// 後でnotify
		var dfd2 = h5.async.deferred();
		var filtered5 = dfd2.pipe(null, null, function(value) {
			return value * 1;
		});
		var filtered6 = filtered5.pipe(null, null, function(value) {
			return value * 10;
		});
		filtered5.progress(function(value) {
			strictEqual(value, 10, 'pipe()で登録したprogressFilterは通っているか3');
		});
		filtered6.progress(function(value) {
			strictEqual(value, 100, 'pipe()で登録したprogressFilterは通っているか4');
		});
		dfd2.notify(10);
	});

	test('pipeからprogressFilterの登録', function() {
		var dfd = h5.async.deferred();

		var filtered1 = dfd.pipe(null, null, function(value) {
			return value * 10;
		});
		var filtered2 = filtered1.pipe(null, null, function(value) {
			return value * 2;
		});

		// 先にnotify
		var object = {
			a: 1
		};
		dfd.notifyWith(object, [5]);
		filtered1.progress(function(value) {
			strictEqual(this, object, 'notifyWith()実行後でコールバック登録と同時に実行される場合に、指定したコンテキストで実行されているか');
			strictEqual(value, 50,
					'notifyWith()実行後でコールバック登録と同時に実行される場合に、pipe()で登録したprogressFilterは通っていること');
		});
		filtered2.progress(function(value) {
			strictEqual(value, 100, 'pipe()の戻り値のpromiseにpipe()で登録したprogressFilterは通っていること');
		});

		dfd = h5.async.deferred();
		var d = h5.async.deferred();
		var ret = '';
		var arg;
		var p = dfd.pipe(null, null, function() {
			ret += '1';
			return d.promise();
		});
		dfd.pipe(null, null, function() {
			ret += '2';
		});
		p.pipe(null, null, function(a) {
			ret += '3';
			arg = a;
		});
		dfd.notify();
		strictEqual(ret, '12', 'progressFilterがpromiseを返すとき、次のprogressFilterに連鎖しないこと');
		d.notify(1);
		strictEqual(ret, '123', 'notify()されて次のprogressFilterが実行されること');
		strictEqual(arg, 1, 'notify()で指定した引数がprogressFilterに渡されること');
	});

	asyncTest('pipeのdoneコールバックがPromiseを返す場合、pipeの実行がPromiseの完了を待っているか', 6, function() {
		var count = 1;

		h5.async.deferred().resolve().pipe(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(pipe1)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 2, '2番目に実行されること。(pipe1のdoneハンドラ)');
		}).pipe(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(pipe2)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 4, '4番目に実行されること。(pipe2のdoneハンドラ)');
		}).pipe(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(pipe3)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 6, '6番目に実行されること。(pipe3のdoneハンドラ)');
			start();
		});
	});

	test('pipeはpromiseを返し、deferred.promise()の返すpromiseとは別のものであること', 2, function() {
		var dfd = h5.async.deferred();
		var p = dfd.pipe();
		ok(h5.async.isPromise(p), 'deferred.pipe()がpromiseを返すこと');
		ok(dfd.promise() != p, 'pipe()の戻り値はdeferred.promise()の戻り値とは別のPromiseであること');
	});

	asyncTest('pipeのfailコールバックがPromiseを返す場合、pipeの実行がPromiseの完了を待っているか', 6, function() {
		var count = 1;

		h5.async.deferred().reject().pipe(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(pipe1)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 2, '2番目に実行されること。(pipe1のfailハンドラ)');
		}).pipe(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(pipe2)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 4, '4番目に実行されること。(pipe2のfailハンドラ)');
		}).pipe(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(pipe3)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 6, '6番目に実行されること。(pipe3のfailハンドラ)');
			start();
		});
	});

	test('[jquery#-1.7]thenはpromiseを返し、deferred.promise()の返すpromiseとは別のものであること', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		var p = promise.then();
		ok($.isFunction(p.promise), 'deferred.then()がpromiseを返すこと');
		ok(promise !== p, 'then()の戻り値はdeferred.promise()の戻り値とは別のPromiseであること');
	});

	test('[jquery#1.8-]thenはthenを呼んだ時のthisを返すこと。', 2, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		var p = promise.then();
		ok(dfd.promise() === p, 'promise.then()の戻り値はpromiseであること');
		p = dfd.then();
		ok(dfd === p, 'deferred.then()の戻り値はdeferredであること');
	});

	test('deferred.thenの第3引数にprogressCallbackを渡して、動作すること', 1, function() {
		var dfd = h5.async.deferred();
		var ret = null;
		dfd.then(null, null, function(value) {
			ret = value;
		});
		dfd.notify(3);
		strictEqual(ret, 3, 'then()で登録したprogressCallbackは動作するか');
	});

	test('promise.thenの第3引数にprogressCallbackを渡して、動作すること', 1, function() {
		var dfd = h5.async.deferred();
		var ret = null;
		dfd.promise().then(null, null, function(value) {
			ret = value;
		});
		dfd.notify(3);
		strictEqual(ret, 3, 'then()で登録したprogressCallbackは動作するか');
	});

	asyncTest('[jquery#-1.7]thenのdoneコールバックがPromiseを返す場合、thenの実行がPromiseの完了を待っているか', 6, function() {
		var count = 1;

		h5.async.deferred().resolve().then(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(then1)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 2, '2番目に実行されること。(then1のdoneハンドラ)');
		}).then(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(then2)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 4, '4番目に実行されること。(then2のdoneハンドラ)');
		}).then(function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(then3)');
				dfd.resolve();
			}, 0);

			return dfd.promise();
		}).done(function() {
			equal(count++, 6, '6番目に実行されること。(then3のdoneハンドラ)');
			start();
		});
	});

	asyncTest('[jquery#-1.7]thenのfailコールバックがPromiseを返す場合、thenの実行がPromiseの完了を待っているか', 6, function() {
		var count = 1;

		h5.async.deferred().reject().then(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 1, '1番目に実行されること。(then1)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 2, '2番目に実行されること。(then1のfailハンドラ)');
		}).then(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 3, '3番目に実行されること。(then2)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 4, '4番目に実行されること。(then2のfailハンドラ)');
		}).then(null, function() {
			var dfd = $.Deferred();

			setTimeout(function() {
				equal(count++, 5, '5番目に実行されること。(then3)');
				dfd.reject();
			}, 0);

			return dfd.promise();
		}).fail(function() {
			equal(count++, 6, '6番目に実行されること。(then3のfailハンドラ)');
			start();
		});
	});

	test('[jquery#1.8-]thenはpipeとはことなり、登録した関数がpromiseを返しても無視して次のコールバックが呼ばれること。', 3, function() {
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

	test('reject()で呼ばれたfailコールバックの引数とthis', 3, function() {
		var dfd;
		dfd = h5.async.deferred();
		dfd.fail(
				function() {
					var args = Array.prototype.slice.call(arguments);
					deepEqual(args, [[1], 2, null], 'reject()で渡した引数がfailコールバックに渡されていること');
					ok(this === dfd || this === dfd.promise(),
							'deferredからrejectを読んだので、thisはdeferredであること');
				}).reject([1], 2, null);

		var obj = {};
		dfd = h5.async.deferred();
		dfd.fail(function() {
			strictEqual(this, obj, 'rejectをcallでコンテキストを変更して呼んだので、thisは指し替わっていること');
		}).reject.call(obj, [1], 2, null);
	});

	test('rejectWith()で呼ばれたfailコールバックの引数とthis', 2, function() {
		var obj = {};
		var dfd;
		dfd = h5.async.deferred();
		dfd.fail(function() {
			var args = Array.prototype.slice.call(arguments);
			deepEqual(args, [[1], 2, null], 'reject()で渡した引数がfailコールバックに渡されていること');
			strictEqual(this, obj, 'rejectWith()の第一引数に指定したオブジェクトがcommonFailHandler内のthisであること');
		}).rejectWith(obj, [[1], 2, null]);
	});

	test('notify()で呼ばれたprogressコールバックの引数とthis', 3, function() {
		var dfd;
		dfd = h5.async.deferred();
		dfd.progress(function() {
			var args = Array.prototype.slice.call(arguments);
			deepEqual(args, [[1], 2, null], 'notify()で渡した引数がfailコールバックに渡されていること');
			ok(this === dfd || this === dfd.promise(), 'thisはdeferred(またはpromise)であること');
		}).notify([1], 2, null);

		var obj = {};
		dfd = h5.async.deferred();
		dfd.progress(function() {
			strictEqual(this, obj, 'notifyをcallでコンテキストを変更して呼んだので、thisは指し替わっていること');
		}).notify.call(obj, [1], 2, null);
	});

	test('notifyWith()で呼ばれたprogressコールバックの引数とthis', 2, function() {
		var obj = {};
		var dfd;
		dfd = h5.async.deferred();
		dfd.progress(function() {
			var args = Array.prototype.slice.call(arguments);
			deepEqual(args, [[1], 2, null], 'notifyWith()で渡した引数がcommonFailHandlerに渡されていること');
			strictEqual(this, obj, 'notifyWith()の第一引数に指定したオブジェクトがcommonFailHandler内のthisであること');
		}).notifyWith(obj, [[1], 2, null]);
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

	test('failハンドラが登録されていない時、reject()を呼んだ時にcommonFailHandlerが1回だけ動作すること', 1, function() {
		var count = 0;
		h5.settings.commonFailHandler = function() {
			count++;
		};
		var dfd = h5.async.deferred();
		dfd.reject();
		strictEqual(count, 1, 'commonFailHandlerが1度だけ実行されたこと');
	});

	test('failハンドラが登録されていない時、rejectWith()を呼んだ時にcommonFailHandlerが1回だけ動作すること', 1, function() {
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

	test('pipeでfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().pipe(null, emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.pipe() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないか');
		this.cfhFlag = false;
	});

	test('pipeでfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().pipe(null, emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.pipe() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないか');
		this.cfhFlag = false;
	});

	test('thenでfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().then(null, emptyFunc, null);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.then() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないか');
		this.cfhFlag = false;
	});

	test('thenでfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		var dfd = h5.async.deferred();
		dfd.promise().then(null, emptyFunc, null);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.then() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないか');
		this.cfhFlag = false;
	});

	test('alwaysでfailコールバックを登録してreject()された場合、commonFailHandlerが呼ばれないこと', 1, function() {
		dfd = h5.async.deferred();
		dfd.promise().always(emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.always() でコールバックを指定した時に、commonFailHandlerが呼ばれないか');
	});

	test('alwaysでfailコールバックを登録せずにreject()された場合、commonFailHandlerは呼ばれること', 1, function() {
		dfd = h5.async.deferred();
		dfd.always(emptyFunc);
		dfd.reject();
		ok(!this.cfhFlag, 'deferred.always() でコールバックを指定した時に、commonFailHandlerが呼ばれないか');
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
							'deferredからrejectを読んだので、thisはdeferredであること');
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
	// h5.async.whenは、jQuery1.7以上の場合は$.whenをラップしているが、
	// jQuery1.6.xの場合はhifiveが$.when相当のものを独自実装しているため、whenの機能全般をここでテストする。

	//=============================
	// Body
	//=============================

	test('$.Deferred()のPromiseを引数に指定して実行 - done()', 1, function() {
		var df1 = $.Deferred();
		var df2 = $.Deferred();

		h5.async.when([df1, df2]).done(function() {
			ok(true, '$.Deferred()のPromiseがresolveされたので、doneコールバックが実行されること。');
		});

		df1.resolve();
		df2.resolve();
	});

	test('$.Deferred()のPromiseを引数に指定して実行 - fail()', 1, function() {
		var df1 = $.Deferred();
		var df2 = $.Deferred();

		h5.async.when([df1, df2]).done(function() {
			ok(false, 'テスト失敗');
		}).fail(function() {
			ok(true, '$.Deferred()のPromiseの一つがrejectされたので、failコールバックが実行されること。');
		});

		df1.reject();
		df2.resolve();
	});

	test('Promiseを引数に指定して実行 - done()', 1, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).done(function() {
			ok(true, '$.Deferred()のPromiseがresolveされたので、doneコールバックが実行されること。');
		});

		df1.resolve();
		df2.resolve();
	});

	test('Promiseを引数に指定して実行 - fail()', 1, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).done(function() {
			ok(false, 'テスト失敗');
		}).fail(function() {
			ok(true, '$.Deferred()のPromiseの一つがrejectされたので、failコールバックが実行されること。');
		});

		df1.reject();
		df2.resolve();
	});

	test('値を指定してh5.async.deferred().resolve()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).done(function(name, name2) {
			equal(name, 'df1', 'df1のresolve()が実行され、doneコールバックが実行されること。');
			equal(name2, 'df2', 'df2のresolve()が実行され、doneコールバックが実行されること。');
		});

		df1.resolve('df1');
		df2.resolve('df2');
	});

	test('値を指定してh5.async.deferred().resolveWith()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).done(function(name, name2) {
			equal(name, 'df1', 'df1のresolveWith()が実行され、doneコールバックが実行されること。');
			equal(name2, 'df2', 'df2のresolveWith()が実行され、doneコールバックが実行されること。');
		});

		df1.resolveWith(null, ['df1']);
		df2.resolveWith(null, ['df2']);
	});

	test('値を指定してh5.async.deferred().reject()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).fail(function(name, name2) {
			equal(name, 'df1', 'df1のreject()が実行され、doneコールバックが実行されること。');
			equal(name2, undefined, 'df1のreject()が実行されたので、第二引数のname2には何も入っていないこと。');
		});

		df1.reject('df1');
		df2.reject('df2');
	});

	test('値を指定してh5.async.deferred().rejectWith()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).fail(function(name, name2) {
			equal(name, 'df1', 'df1のrejectWith()が実行され、doneコールバックが実行されること。');
			equal(name2, undefined, 'df1のrejectWith()が実行されたので、第二引数のname2には何も入っていないこと。');
		});

		df1.rejectWith(null, ['df1']);
		df2.rejectWith(null, ['df2']);
	});

	test('値を指定して h5.async.deferred().notify()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).progress(function(name, name2) {
			if (name == 'df1' && name2 == undefined) {
				ok(true, 'df1のnotifyが実行され、progressコールバックが実行されること。');
			} else if (name == 'df1' && name2 == 'df2') {
				ok(true, 'df2のnotifyが実行され、progressコールバックが実行されること。');
			}
		});

		df1.notify('df1');
		df2.notify('df2');
	});

	test('値を指定して h5.async.deferred().notifyWith()を実行', 2, function() {
		var df1 = h5.async.deferred();
		var df2 = h5.async.deferred();

		h5.async.when([df1, df2]).progress(function(name, name2) {
			if (name == 'df1' && name2 == undefined) {
				ok(true, 'df1のnotifyが実行され、progressコールバックが実行されること。');
			} else if (name == 'df1' && name2 == 'df2') {
				ok(true, 'df2のnotifyが実行され、progressコールバックが実行されること。');
			}
		});

		df1.notifyWith(df1, ['df1']);
		df2.notifyWith(df2, ['df2']);
	});


	test('commonFailHandlerの動作確認 1', 4, function() {
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

	test('commonFailHandlerの動作確認 2', 3, function() {
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
			'commonFailHandlerの動作確認 3',
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

	test('done/failハンドラでresolve/reject時に渡した引数が受け取れること', 7, function() {
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
			strictEqual(++count, 1, '引数なしの場合、即doneハンドラが実行されること');
			ok(true, '※要目視確認：引数なしの場合はログが出力されないこと。');
		});
		++count;
	});


	test('※要目視確認：引数にnull/undefinedを渡した場合は、即実行されること。ログは出力されないこと。', 3, function() {
		var count = 0;
		h5.async.when(undefined).done(function() {
			strictEqual(count, 0, '引数undefinedの場合、即doneハンドラが実行されること');
		});
		count++;

		count = 0;
		h5.async.when(null).done(function() {
			strictEqual(count, 0, '引数undefinedの場合、即doneハンドラが実行されること');
		});
		count++;

		ok(true, '※要目視確認：null/undefinedの場合はログが出力されないこと。');
	});

	test('※要目視確認：引数にプロミスオブジェクトと配列以外のものを渡した場合は、同期実行されること。ログが出力されること。', 11, function() {
		var argArray = [0, 1, true, false, {}];

		for ( var i = 0, l = argArray.length; i < l; i++) {
			var count = 0;
			h5.async.when(argArray[i]).done(function() {
				equal(count++, 0, '引数が' + argArray[i].toString() + 'の場合、doneハンドラが同期的に実行されること。');
			});

			equal(count, 1, 'h5.async.whenのdoneハンドラの実行が同期的に行われること。');
		}
		ok(true, '※要目視確認：次のようなログが' + argArray.length
				+ '回出力されていること。『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
	});

	test('※要目視確認：引数を2つ以上渡して、プロミス以外のものがある場合、プロミス以外のものだけを無視してpromiseオブジェクトのresolveを待つこと。ログが出力されること。',
			13, function() {
				var dfd1;
				var argArray = [0, 1, true, false, {}, []];

				for ( var i = 0, l = argArray.length; i < l; i++) {
					// deferredを初期化する
					dfd1 = h5.async.deferred();

					h5.async.when(dfd1.promise(), argArray).done(function() {
						ok(true, 'doneハンドラが実行されること');
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
				var dfd1,dfd2,dfd3;
				// deferredを初期化する
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();
				h5.async.when(dfd1, [dfd2]).done(function() {
					ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneハンドラが実行されること');
					ok(isResolved(dfd1), '1番目の引数のプロミスオブジェクトがresolveされていること');
				});
				dfd1.resolve();
				dfd2.reject();

				// deferredを初期化する
				dfd1 = h5.async.deferred();
				dfd2 = h5.async.deferred();
				dfd3 = h5.async.deferred();
				h5.async.when(dfd1, [dfd2, dfd3]).done(function() {
					ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneハンドラが実行されること');
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
							ok(true, '入れ子になった配列の中のプロミスオブジェクトがrejectされても関係なく、doneハンドラが実行されること');
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

	asyncTest('fail', 2, function() {
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
		for ( var i = 0, len = noArrayObjs.length; i < len; i++) {
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