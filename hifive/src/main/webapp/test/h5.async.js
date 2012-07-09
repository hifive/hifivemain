/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
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

	module("Async");

	test('Deferredオブジェクトは作成できたか(h5.async.deferred)', 5, function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		ok(dfd, 'Deferredオブジェクトは作成できたか');
		ok(dfd.notify, 'Deferredオブジェクトにnotifyメソッドが用意されているか');
		ok(dfd.notifyWith, 'DeferredオブジェクトにnotifyWithメソッドが用意されているか');
		ok(dfd.progress, 'Deferredオブジェクトにprogressメソッドが用意されているか');
		ok(promise.progress, 'Promiseオブジェクトにprogressメソッドが用意されているか');
	});

	test('h5.async.isPromise() promiseオブジェクトかどうか判定できること。', 4, function() {
		ok(h5.async.isPromise(h5.async.deferred().promise()),
				'h5.async.deferred().promise()はpromiseオブジェクト');
		ok(h5.async.isPromise($.Deferred().promise()), '$.Deferred().promise()はpromiseオブジェクト');
		ok(!h5.async.isPromise(h5.async.deferred()), 'h5.async.deferred()はpromiseオブジェクトではない。');
		ok(!h5.async.isPromise($.Deferred()), '$.Deferred().promise()はpromiseオブジェクトではない。');
	});

	test('Deferredオブジェクトでnotify/progressは使用できるか(h5.async.deferred)', 8, function() {
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

	test('Deferred#then()の動作(h5.async.deferred)', 1, function() {
		var dfd = h5.async.deferred();
		var ret = null;
		dfd.then(null, null, function(value) {
			ret = value;
		});
		dfd.notify(3);
		strictEqual(ret, 3, 'Deferred#then()で登録したprogressCallbackは動作するか');
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


	test('h5.async.whenの動作 commonFailHandlerの動作確認 1', 4, function() {
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

	test('h5.async.whenの動作  commonFailHandlerの動作確認 2', 3, function() {
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
			'h5.async.whenの動作 commonFailHandlerの動作確認 3',
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

	test('h5.async.whenの動作 done/failハンドラでresolve/reject時に渡した引数が受け取れること', 7, function() {
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

		ret = '';
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

	test('h5.async.whenの動作 配列を引数に取れること', 4, function() {
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

	test('※要目視確認：h5.async.whenの動作 引数なしの場合は、即実行されること。ログは出力されないこと。', 2, function() {
		var count = 0;
		h5.async.when().done(function() {
			strictEqual(++count, 1, '引数なしの場合、即doneハンドラが実行されること');
			ok(true, '※要目視確認：引数なしの場合はログが出力されないこと。')
		});
		++count;
	});


	test('※要目視確認：h5.async.whenの動作 引数にnull/undefinedを渡した場合は、即実行されること。ログは出力されないこと。', 3, function() {
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

	test('※要目視確認：h5.async.whenの動作 引数にプロミスオブジェクトと配列以外のものを渡した場合は、即実行されること。ログが出力されること。', function() {
		var argArray = [0, 1, true, false, {}];
		expect(argArray.length + 1);

		for ( var i = 0, l = argArray.length; i < l; i++) {
			count = 0;
			h5.async.when(argArray[i]).done(function() {
				strictEqual(count, 0, '引数が' + argArray[i].toString() + 'の場合、即doneハンドラが実行されること');
			});
			count++;
		}
		ok(true, '※要目視確認：次のようなログが' + argArray.length
				+ '回出力されていること。『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』');
	});

	test(
			'※要目視確認：h5.async.whenの動作 引数を2つ以上渡して、プロミス以外のものがある場合、プロミス以外のものだけを無視してpromiseオブジェクトのresolveを待つこと。ログが出力されること。',
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
			'※要目視確認：h5.async.whenの動作 引数を2つ以上渡して、プロミスの配列がある場合、配列は無視して配列以外のpromiseオブジェクトのresolveだけを待つこと。ログが出力されること。',
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
			'h5.async.whenの動作 配列の中身は再帰的に評価されないこと',
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
									'※要目視確認：次のようなログが、INFOレベルで出力されていること 『h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。 』')
						});
				dfd2.reject();
				dfd3.reject();
				dfd1.resolve();
			});

	asyncTest('h5.async.loop()の動作1', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			ret.push(value);
		}, 2);
		p.always(function() {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', 'ちゃんとループしているか');
		});
	});
	asyncTest('h5.async.loop()の動作2', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			var dfd = h5.async.deferred();
			var time = index % 2 === 0 ? 200 : 10;
			setTimeout(function() {
				ret.push(value);
				dfd.resolve();
			}, time);
			return dfd.promise();
		}, 2);
		p.always(function() {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', 'promiseを返した時に処理を待っているか');
		});
	});
	asyncTest('h5.async.loop()の動作3', 2, function() {
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
	asyncTest('h5.async.loop()の動作4', 2, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			var dfd = h5.async.deferred();
			var time = index % 2 === 0 ? 200 : 10;
			setTimeout(function() {
				ret.push(value);
				if (index === 3) {
					dfd.reject();
				} else {
					dfd.resolve();
				}
			}, time);
			return dfd.promise();
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
	asyncTest('h5.async.loop()の動作5', 1, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var p = h5.async.loop(array, function(index, value, loopControl) {
			loopControl.pause();
			setTimeout(function() {
				ret.push(value);
				loopControl.resume();
			}, 100);
		}, 2);
		p.always(function(data) {
			start();
			strictEqual(ret.join(';'), '0;1;2;3;4;5', 'loopControlは動作しているか');
		});
	});
	asyncTest('h5.async.loop()の動作6', 10, function() {
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
	asyncTest('h5.async.loop()の動作7', 10, function() {
		var ret = [];
		var array = [0, 1, 2, 3, 4, 5];
		var time = 2;
		var p = h5.async.loop(array, function(index, value, loopControl) {
			loopControl.pause();
			setTimeout(function() {
				ret.push(value);
				loopControl.resume();
			}, 100);
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
	asyncTest('h5.async.loop()の動作8', 2, function() {
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
			}, 100);
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
	asyncTest('h5.async.loop()の動作9', 3, function() {
		var noArrayObjs = [1, {}, 'aaa'];
		var time = 2;
		for ( var i = 0, len = noArrayObjs.length; i < len; i++) {
			try {
				h5.async.loop(noArrayObjs[i], function(index, value, loopControl) {}, time);
			} catch (e) {
				ok(true, e.message);
			}
		}
		start();
	});
});
