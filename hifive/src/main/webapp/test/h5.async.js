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

	test('Deferredオブジェクトは作成できたか(h5.async.deferred)', function() {
		var dfd = h5.async.deferred();
		var promise = dfd.promise();
		ok(dfd, 'Deferredオブジェクトは作成できたか');
		ok(dfd.notify, 'Deferredオブジェクトにnotifyメソッドが用意されているか');
		ok(dfd.notifyWith, 'DeferredオブジェクトにnotifyWithメソッドが用意されているか');
		ok(dfd.progress, 'Deferredオブジェクトにprogressメソッドが用意されているか');
		ok(promise.progress, 'Promiseオブジェクトにprogressメソッドが用意されているか');
	});


	test('Deferredオブジェクトでnotify/progressは使用できるか(h5.async.deferred)', function() {
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

	test('Deferred#then()の動作(h5.async.deferred)', function() {
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

	asyncTest('h5.async.loop()の動作1', function() {
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
	asyncTest('h5.async.loop()の動作2', function() {
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
	asyncTest('h5.async.loop()の動作3', function() {
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
	asyncTest('h5.async.loop()の動作4', function() {
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
	asyncTest('h5.async.loop()の動作5', function() {
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
	asyncTest('h5.async.loop()の動作6', function() {
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
	asyncTest('h5.async.loop()の動作7', function() {
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
	asyncTest('h5.async.loop()の動作8', function() {
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
