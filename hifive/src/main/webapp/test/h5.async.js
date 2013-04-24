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

	test('then', 1, function() {
		var dfd = h5.async.deferred();
		var ret = null;
		dfd.then(null, null, function(value) {
			ret = value;
		});
		dfd.notify(3);
		strictEqual(ret, 3, 'then()で登録したprogressCallbackは動作するか');
	});

	asyncTest(
			'[jquery#1.7-]pipeのdoneコールバックがPromiseを返す場合、pipeの実行がPromiseの完了を待っているか',
			6, function() {
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

	asyncTest(
			'[jquery#1.7-]pipeのfailコールバックがPromiseを返す場合、pipeの実行がPromiseの完了を待っているか',
			6, function() {
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

	test(
			'commonFailHandlerの動作',
			6,
			function() {
				var ret = '';
				var cfhm = 'commonFailHandler';
				h5.settings.commonFailHandler = function() {
					ret += cfhm;
				};
				var dfd = h5.async.deferred();
				dfd.promise().then(function() {
					ret += 'then doneCallback';
				});
				dfd.reject();
				strictEqual(ret, cfhm,
						'deferred.then() で第1引数(doneCallback)のみを指定した時にrejectを呼ぶと、commonFailHandlerが呼ばれるか');
				ret = '';

				dfd = h5.async.deferred();
				dfd.promise().then(function() {
					ret += 'then doneCallback';
				});
				dfd.rejectWith(null, [1]);
				strictEqual(ret, cfhm,
						'deferred.then() で第1引数(doneCallback)のみを指定した時にrejectWithを呼ぶと、commonFailHandlerが呼ばれるか');
				ret = '';

				dfd = h5.async.deferred();
				dfd.promise().then(function() {
					ret += 'then doneCallback';
				}, function() {
					ret += 'then failCallback';
				});
				dfd.reject();
				strictEqual(ret, 'then failCallback',
						'deferred.then() で第2引数(failCallback)を指定した時に、commonFailHandlerが呼ばれないか');
				ret = '';

				dfd = h5.async.deferred();
				dfd.promise().always(function() {
					ret += 'alwaysCallback';
				});
				dfd.reject();
				strictEqual(ret, 'alwaysCallback',
						'deferred.always() でコールバックを指定した時に、commonFailHandlerが呼ばれないか');
				ret = '';

				dfd = h5.async.deferred();
				dfd.promise().fail(function() {
					ret += 'failCallback';
				});
				dfd.reject();
				strictEqual(ret, 'failCallback',
						'deferred.fail() でコールバックを指定した時に、commonFailHandlerが呼ばれないか');

				h5.settings.commonFailHandler = undefined;
				ok(!h5.settings.commonFailHandler, '（設定のクリーンアップ）');
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