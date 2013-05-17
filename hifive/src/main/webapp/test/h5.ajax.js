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

	/**
	 * commonFailHandlerが実行されるかどうかを待機する時間
	 */
	var COMMON_FAIL_HANDLER_WAIT = 5000;

	//=============================
	// Functions
	//=============================

	/**
	 * 何もしない空の関数。コールバックやリトライフィルタの指定で使用する。
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

	module("h5.ajax");

	//=============================
	// Body
	//=============================

	test('h5.ajax()の戻り値にprogressメソッドが追加されているか', 1, function() {

		// 戻り値をチェックするだけなのでurlは何でもOK。
		// ただし指定しない場合、現在のページへのリクエストが飛ぶので、
		// リクエストの負荷を無くすためにdummyURLにする
		var jqXHR = h5.ajax({
			url: 'dummyURL'
		});

		ok($.isFunction(jqXHR.progress), 'h5.async.ajax() の戻り値のオブジェクトにprogressメソッドが追加されているか');
	});

	asyncTest('$.ajaxSettingsの設定が有効であること', 1, function() {
		// 同期に設定
		$.ajaxSettings.async = false;
		var promise = h5.ajax({
			url: 'data/sample.data',
			cache: false
		});
		var a = false;
		promise.done(function() {
			ok(!a, '$.ajaxSettingsの設定が有効であること');
			$.ajaxSettings.async = true;
			start();
		}).fail(function() {
			ok(false, 'fail');
			$.ajaxSettings.async = true;
			start();
		});
		a = true;
	});

	asyncTest('$.ajaxSettingsの設定より引数で渡した値が優先されていること', 1, function() {
		// 同期に設定
		$.ajaxSettings.async = false;
		// 非同期で呼び出し
		var jqXHR = h5.ajax({
			url: 'data/sample.data',
			cache: false,
			async: true
		});
		var a = false;
		jqXHR.done(function() {
			ok(a, '引数で渡した設定が優先されて非同期で実行されること');
			$.ajaxSettings.async = true;
			start();
		}).fail(function() {
			ok(false, 'fail');
			$.ajaxSettings.async = true;
			start();
		});
		a = true;
	});

	asyncTest('failコールバックに渡される引数とthis', 5, function() {
		h5.ajax('dummyURL').fail(function(jqXHR, textStatus, errorThrown) {
			strictEqual(arguments.length, 3, '引数は3つ渡されること');
			strictEqual(jqXHR.status, 404, '第一引数がjqXHRであり、statusが格納されていること');
			strictEqual(textStatus, 'error', '第二引数にtextStatusが格納されていること');
			strictEqual(errorThrown, 'Not Found', '第三引数にerrorThrownが格納されていること');
			strictEqual(this.url, 'dummyURL', 'thisはajaxの設定オブジェクトであること');
			start();
		});
	});

	asyncTest('doneコールバックに渡される引数とthis', 5, function() {
		h5.ajax('data/sample.data', {
			dataType: 'text'
		}).done(function(data, textStatus, jqXHR) {
			console.log(data);
			strictEqual(arguments.length, 3, '引数は3つ渡されること');
			strictEqual(data, 'sample', '第一引数に取得した文字列であること');
			strictEqual(textStatus, 'success', '第二引数にtextStatusであること');
			strictEqual(jqXHR.status, 200, '第三引数がjqXHRであり、statusが格納されていること');
			strictEqual(this.url, 'data/sample.data', 'thisはajaxの設定オブジェクトであること');
			start();
		});
	});

	asyncTest('h5.ajax().promise()がpromiseオブジェクトを返すこと', 2, function() {
		var p = h5.ajax('dummyURL').promise();
		ok(h5.async.isPromise(p), '戻り値がpromiseオブジェクトであること');
		p.always(function() {
			ok(true, 'コールバックが動作すること');
			start();
		});
	});

	asyncTest('h5.ajax().promise(target)でtargetをpromise化でき、コールバックを登録できること', 4, function() {
		var p = {
			customProp: true
		};
		var ret = h5.ajax('dummyURL').promise(p);
		ok(h5.async.isPromise(p), '戻り値がpromiseオブジェクトであること');
		ok(p.customProp, '引数をpromise化できていること');
		strictEqual(ret, p, 'promise化した引数が戻り値であること');
		p.always(function() {
			ok(true, 'コールバックが動作すること');
			start();
		});
	})

	//=============================
	// Definition
	//=============================

	module('progressCallbackの登録', {
		teardown: function() {
			h5.settings.commonFailHandler = null;
		}
	});

	//=============================
	// Body
	//=============================

	test(
			'commonFailHandlerが設定されている時、jqXHR#then()でprogressCallbackを登録しようとしてもエラーにならないか',
			1,
			function() {

				h5.settings.commonFailHandler = function() {
				// 何もしない
				};
				var jqXHR = h5.ajax({
					url: 'dummyURL'
				});

				var error = false;
				try {
					jqXHR.then(function() {
					// doneCallback
					}, function() {
					// failCallback
					}, function() {
					// progressCallback
					});
				} catch (e) {
					error = true;
				}
				ok(!error, 'h5.async.ajax() の戻り値のオブジェクトのthen()でprogressCallbackを登録しようとしてもエラーにならないか');
			});

	//=============================
	// Definition
	//=============================
	module('commonFailHandlerの動作', {
		setup: function() {
			var that = this;
			h5.settings.commonFailHandler = function() {
				// フラグを立てる
				that.cfhFlag = true;
			};
		},
		teardown: function() {
			h5.settings.commonFailHandler = null;
			this.chfFlag = false;
		},
		cfhFlag: false
	});

	//=============================
	// Body
	//=============================

	asyncTest('commonFailHandlerが設定されていて、コールバックが登録されていない時にcommonFailHandlerが動作すること', 1, function() {
		var timerId = setTimeout(function() {
			// timerが止められてない = commonFailHandlerに入ってないので失敗
			ok(false);
			start();
		}, COMMON_FAIL_HANDLER_WAIT);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			// テスト成功
			ok(true);
			start();
		};

		// 存在しないURLをajaxで読む。コールバックを登録していないので、commonFailHandlerに入るはず
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		});
	});

	asyncTest('オプションでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', 1, function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1,
			error: function() {
				setTimeout(function() {
					ok(!that.cfhFlag);
					start();
				}, 0);
			}
		});
	});

	asyncTest('オプションでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', 1, function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1,
			complete: function() {
				setTimeout(function() {
					ok(!that.cfhFlag);
					start();
				}, 0);
			}
		});
	});

	asyncTest('メソッドチェーンでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', 1, function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		}).fail(function() {
			setTimeout(function() {
				ok(!that.cfhFlag);
				start();
			}, 0);
		});
	});

	asyncTest('メソッドチェーンでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', 1, function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		}).always(function() {
			setTimeout(function() {
				ok(!that.cfhFlag);
				start();
			}, 0);
		});
	});

	asyncTest('promise()で取得したプロミスオブジェクトにエラーコールバック関数を登録したとき、commonFailHandlerは動作しないこと', 1,
			function() {
				var that = this;
				h5.ajax({
					url: 'dummyURL',
					timeout: 1
				}).promise().fail(function() {
					setTimeout(function() {
						ok(!that.cfhFlag);
						start();
					}, 0);
				});
			});

	asyncTest('promise(target)で取得したプロミスオブジェクトにエラーコールバック関数を登録したとき、commonFailHandlerは動作しないこと',
			function() {
				var that = this;
				var promise = h5.ajax({
					url: 'dummyURL',
					timeout: 1
				}).promise({
					a: 1
				});
				promise.fail(function() {
					setTimeout(function() {
						ok(!that.cfhFlag);
						start();
					}, 0);
				});
			});
	//=============================
	// Definition
	//=============================

	module('h5.ajax リトライ指定のある場合(非同期)', {
		setup: function() {
			// リトライ回数を2回、インターバルを0
			var that = this;
			h5.settings.ajax = {
				retryCount: 2,
				retryInterval: 0,
				retryFilter: that.originalSettingsAjax.retryFilter
			};
			h5.settings.commonFailHandler = function() {
				// フラグを立てる
				that.cfhFlag = true;
			};
		},
		teardown: function() {
			h5.settings.ajax = this.originalSettingsAjax;
			$.ajax = this.originalAjax;
			h5.settings.commonFailHandler = null;
		},
		originalSettingsAjax: $.extend({}, h5.settings.ajax),
		originalAjax: $.ajax,
		cfhFlag: false
	});

	//=============================
	// Body
	//=============================

	asyncTest('status=0(タイムアウト)の場合にリトライが実行されること。', 1, function() {
		var that = this;
		// $.ajaxを、タイムアウト時の挙動をする関数に置き換える
		var ajaxCallCount = 0;
		$.ajax = function() {
			ajaxCallCount++;
			// jqXHRを取得
			var jqXHR = that.originalAjax('', {
				async: false
			});
			// timeout時のjqXHRを簡単に模倣したものを作成
			jqXHR.status = 0;
			jqXHR.statusText = 'timeout';
			jqXHR.readyState = 0;
			var dfd = $.Deferred();
			var promise = dfd.promise(jqXHR);
			setTimeout(function() {
				dfd.reject(promise);
			}, 0);
			return promise;
		};

		h5.ajax('').done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(ajaxCallCount, 3, '$.ajaxは計3回実行されること');
			start();
		});
	});

	asyncTest('status=12029(ERROR_INTERNET_CANNOT_CONNECT)の場合にリトライが実行されること', 1, function() {
		var that = this;
		// $.ajaxを、satet=12029で失敗をする関数に置き換える
		var ajaxCallCount = 0;
		$.ajax = function() {
			ajaxCallCount++;
			// jqXHRを取得
			var jqXHR = that.originalAjax('', {
				async: false
			});
			// timeout時のjqXHRを簡単に模倣したものを作成
			jqXHR.status = 12029;
			jqXHR.readyState = 0;
			var dfd = $.Deferred();
			var promise = dfd.promise(jqXHR);
			setTimeout(function() {
				dfd.reject(promise);
			}, 0);
			return promise;
		};

		h5.ajax('').done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(ajaxCallCount, 3, '$.ajaxは計3回実行されること');
			start();
		});
	});

	asyncTest('status=404(Not Found)の場合はリトライが実行されないこと', 1, function() {
		var that = this;
		var ajaxCallCount = 0;
		// $.ajaxをラップ
		$.ajax = function(var_args) {
			ajaxCallCount++;
			return that.originalAjax.apply($, arguments);
		};
		h5.ajax('dummyURL').done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(ajaxCallCount, 1, '$.ajaxは計1回実行されること');
			start();
		});
	});

	asyncTest('リトライ前にリトライフィルタが実行されること', 6, function() {
		var callCount = 1;
		var ajaxCallCount = 0;
		var callRetryFilterCount = 0;
		h5.settings.ajax.retryFilter = function() {
			callRetryFilterCount++;
			strictEqual(callCount++, callRetryFilterCount * 2, 'retryFilter');
		};
		var callCount = 1;

		var that = this;
		// $.ajaxをラップ
		$.ajax = function(var_args) {
			ajaxCallCount++;
			strictEqual(callCount++, ajaxCallCount * 2 - 1, '$.ajaxの呼び出し ' + ajaxCallCount + '回目');
			return that.originalAjax.apply($, arguments);
		};

		h5.ajax('dummyURL').done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(callCount++, 6, 'fail');
			start();
		});
	});

	asyncTest('リトライフィルタがfalseを返した時はリトライが中止されること', 1, function() {
		var ajaxCallCount = 0;
		var retryFilterCount = 0;
		h5.settings.ajax.retryFilter = function() {
			if (++retryFilterCount == 2) {
				// 2回目でfalseを返す。ajaxは2回だけ呼ばれるはず。
				return false;
			}
		};
		var that = this;
		// $.ajaxをラップ
		$.ajax = function(var_args) {
			ajaxCallCount++;
			return that.originalAjax.apply($, arguments);
		};

		h5.ajax('dummyURL').done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(ajaxCallCount, 2, '$.ajaxは計2回実行されること');
			start();
		});
	});

	asyncTest('リトライ回数をh5.ajaxに渡す引数で指定できること', 1, function() {
		var ajaxCallCount = 0;
		h5.settings.ajax.retryFilter = emptyFunc;
		var that = this;
		// $.ajaxをラップ
		$.ajax = function(var_args) {
			ajaxCallCount++;
			return that.originalAjax.apply($, arguments);
		};

		h5.ajax('dummyURL', {
			retryCount: 5
		}).done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			strictEqual(ajaxCallCount, 6, '$.ajaxは計6回実行されること');
			start();
		});
	});

	asyncTest('リトライインターバルをh5.ajaxに渡す引数で指定できること', 1, function() {
		var ajaxCallCount = 0;
		var retryFilterCount = 0;
		var intervalCheckFlag = false;
		h5.settings.ajax.retryFilter = function() {
			retryFilterCount++;
			if (retryFilterCount === 2) {
				return false;
			}
			setTimeout(function() {
				intervalCheckFlag = true;
			}, 10);
		};
		var that = this;
		// $.ajaxをラップ
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount === 2) {
				ok(intervalCheckFlag, 'retryFilter実行から指定したretryInterval時間が経過していること');
			}
			return that.originalAjax.apply($, arguments);
		};

		h5.ajax('dummyURL', {
			retryInterval: 50
		}).done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			start();
		});
	});

	asyncTest('リトライフィルタをh5.ajaxに渡す引数で指定できること', 1, function() {
		h5.settings.ajax.retryFilter = function() {
			ok(false, 'h5.settings.ajax.retryFilterは実行されないこと');
		};

		h5.ajax('dummyURL', {
			retryCount: 1,
			retryFilter: function() {
				ok(true, '引数で指定したretryFilterが実行される');
			}
		}).done(function() {
			ok(false, 'done');
			start();
		}).fail(function() {
			start();
		});
	});

	asyncTest('リトライフィルタに渡される引数とthis', 6, function() {
		var stockJqXHR = null;
		h5.settings.ajax.retryFilter = function(jqXHR, textStatus, errorThrown) {
			if (stockJqXHR) {
				ok(stockJqXHR != jqXHR, '引数のjqXHRはretryFilterの直前に実行した$.ajaxの戻り値であること');
				return;
			}
			stockJqXHR = jqXHR;
			strictEqual(arguments.length, 3, '引数は3つ渡されること');
			strictEqual(jqXHR.status, 404, '第一引数がjqXHRであり、statusが格納されていること');
			strictEqual(textStatus, 'error', '第二引数にtextStatusが格納されていること');
			strictEqual(errorThrown, 'Not Found', '第三引数にerrorThrownが格納されていること');
			strictEqual(this.url, 'dummyURL', 'thisはajaxの設定オブジェクトであること');
		};
		// $.ajaxをラップ
		var that = this;
		var ajaxCallCount = 0;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount < 3) {
				return that.originalAjax.apply($, ['dummyURL']);
			}
			// 3回目(2回目のリトライ)で成功
			return that.originalAjax.apply($, ['data/sample.data']);
		};
		h5.ajax('dummyURL').always(function() {
			start();
		});
	});

	asyncTest('ajaxの通信に成功したらリトライはしない', 1, function() {
		var ajaxCallCount = 0;
		h5.settings.ajax.retryFilter = function() {
			ok(false, 'retryFilterが実行されました');
		};

		// $.ajaxをラップ
		var that = this;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			return that.originalAjax.apply($, arguments);
		};

		h5.ajax('data/sample.data').done(function() {
			strictEqual(ajaxCallCount, 1, 'doneに入る。$.ajaxは一度しか呼ばれていない');
			start();
		}).fail(function() {
			ok(false, 'fail');
			start();
		});
	});

	asyncTest('リトライしてajaxの通信に成功した場合の動作', 1, function() {
		var ajaxCallCount = 0;
		h5.settings.ajax.retryFilter = emptyFunc;

		// $.ajaxをラップ
		var that = this;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount < 3) {
				return that.originalAjax.apply($, ['dummyURL'], {
					timeout: 1
				});
			}
			// 3回目(2回目のリトライ)で成功
			return that.originalAjax.apply($, ['data/sample.data']);
		};

		h5.ajax('data/sample.data').done(function() {
			strictEqual(ajaxCallCount, 3, 'doneにはいる。$.ajaxは3回(リトライ2回)呼ばれる。');
			start();
		}).fail(function() {
			ok(false, 'fail');
			start();
		});
	});

	asyncTest('failハンドラを登録していない場合、リトライ時にajaxの通信に成功した場合はcommonFailHandlerは動作しない', 2, function() {
		var ajaxCallCount = 0;
		h5.settings.ajax.retryFilter = emptyFunc;

		// $.ajaxをラップ
		var that = this;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount < 3) {
				return that.originalAjax.apply($, [{
					url: 'dummyURL',
					timeout: 1
				}]);
			}
			// 3回目(2回目のリトライ)で成功
			return that.originalAjax.apply($, ['data/sample.data']);
		};

		h5.ajax('data/sample.data').done(function() {
			strictEqual(ajaxCallCount, 3, 'doneにはいる。$.ajaxは3回(リトライ2回)呼ばれる。');
			strictEqual(that.cfhFlag, false, 'commonFailHandlerは実行されない');
			start();
		});
	});

	asyncTest('failハンドラを登録していない場合、リトライしてもajaxの通信に失敗した場合はcommonFailHandlerは動作する', 2, function() {
		var retryFilterCount = 0;
		h5.settings.ajax.retryFilter = function() {
			retryFilterCount++;
		};
		h5.ajax('dummyURL', {
			timeout: 1
		});

		var timerId = setTimeout(function() {
			// timerが止められてない = commonFailHandlerに入ってないので失敗
			ok(false);
			start();
		}, COMMON_FAIL_HANDLER_WAIT);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);
			// テスト成功
			ok(true, 'commonFailHandlerは動作した');
			strictEqual(retryFilterCount, 2, 'リトライは指定回数回実行されている');
			start();
		};
	});

	asyncTest('引数で指定したコールバックは1度だけ動作すること 失敗時', 1, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		var result = '';
		var expect = 'error, complete, ';
		h5.ajax('dummyURL', {
			timeout: 1,
			success: function() {
				result += 'success, ';
			},
			error: function() {
				result += 'error, ';
			},
			complete: function() {
				result += 'complete, ';
			}
		}).fail(function() {
			strictEqual(result, expect, expect + 'が実行される');
			start();
		});
	});

	asyncTest('引数で指定したコールバックは1度だけ動作すること 成功時', 1, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		var result = '';
		var expect = 'success, complete, ';
		h5.ajax('data/sample.data', {
			success: function() {
				result += 'success, ';
			},
			error: function() {
				result += 'error, ';
			},
			complete: function() {
				result += 'complete, ';
			}
		}).done(function() {
			strictEqual(result, expect, expect + 'が実行される');
			start();
		});
	});

	//=============================
	// Definition
	//=============================

	module('h5.ajax リトライ指定のある場合(同期)', {
		setup: function() {
			// リトライ回数を2回、インターバルを0
			var that = this;
			h5.settings.ajax = {
				retryCount: 2,
				retryInterval: 0,
				retryFilter: that.originalSettingsAjax.retryFilter
			};
			h5.settings.commonFailHandler = function() {
				// フラグを立てる
				that.cfhFlag = true;
			};
			$.ajaxSettings.async = false;
		},
		teardown: function() {
			h5.settings.ajax = this.originalSettingsAjax;
			$.ajax = this.originalAjax;
			h5.settings.commonFailHandler = null;
			$.ajaxSettings.async = true;
		},
		originalSettingsAjax: $.extend({}, h5.settings.ajax),
		originalAjax: $.ajax,
		cfhFlag: false
	});

	//=============================
	// Body
	//=============================

	test('リトライしても失敗する場合、同期で結果が返ってくること', 3, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		var jqXHR = h5.ajax('dummyURL', {
			timeout: 1,
			cache: false
		}).done(function() {
			ok(false, 'doneで登録したハンドラ');
		}).fail(function() {
			ok(true, 'failで登録したハンドラ');
		}).always(function() {
			ok(true, 'alwaysで登録したハンドラ');
		});
		strictEqual(jqXHR.status, 404, '同期で結果が返ってきていること');
	});

	test('1回目で成功した場合、同期で結果が返ってくること', 3, function() {
		var jqXHR = h5.ajax('data/sample.data', {
			timeout: 1,
			cache: false
		}).done(function() {
			ok(true, 'doneで登録したハンドラ');
		}).fail(function() {
			ok(false, 'failで登録したハンドラ');
		}).always(function() {
			ok(true, 'alwaysで登録したハンドラ');
		});
		strictEqual(jqXHR.status, 200, '同期で結果が返ってきていること');
	});

	test('リトライ途中で成功した場合、同期で結果が返ってくること', 3, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		var ajaxCallCount = 0;

		// $.ajaxをラップ
		var that = this;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount < 3) {
				return that.originalAjax.apply($, ['dummyURL', {
					timeout: 1
				}]);
			}
			// 3回目(2回目のリトライ)で成功
			return that.originalAjax.apply($, ['data/sample.data', {
				timeout: 1,
				cache: false
			}]);
		};
		var jqXHR = h5.ajax('data/sample.data', {
			timeout: 1,
			cache: false
		}).done(function() {
			ok(true, 'doneで登録したハンドラ');
		}).fail(function() {
			ok(false, 'failで登録したハンドラ');
		}).always(function() {
			ok(true, 'alwaysで登録したハンドラ');
		});
		strictEqual(jqXHR.status, 200, '同期で結果が返ってきていること');
	});

	test('リトライフィルタが同期で実行されること', 2, function() {
		var flag = false;
		h5.ajax('dummyURL', {
			timeout: 1,
			retryFilter: function() {
				ok(!flag, 'retryFilterは同期で実行されている');
			}
		});
		flag = true;
	});

	test('リトライして失敗した場合commonFailHandlerが実行されること', 1, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		h5.ajax('dummyURL', {
			timeout: 1,
			cache: false
		});
		ok(this.cfhFlag);
	});

	test('リトライ途中で成功した場合commonFailHandlerは実行されないこと', 1, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		// $.ajaxをラップ
		var that = this;
		var ajaxCallCount = 0;
		$.ajax = function(var_args) {
			ajaxCallCount++;
			if (ajaxCallCount < 3) {
				return that.originalAjax.apply($, ['dummyURL', {
					timeout: 1
				}]);
			}
			// 3回目(2回目のリトライ)で成功
			return that.originalAjax.apply($, ['data/sample.data', {
				cache: false
			}]);
		};
		h5.ajax('dummyURL', {
			timeout: 1,
			cache: false
		});
		ok(!this.cfhFlag);
	});

	test('error,completeでコールバックを渡していた場合は失敗してもcommonFailHandlerは実行されないこと', 2, function() {
		h5.settings.ajax.retryFilter = emptyFunc;
		h5.ajax('dummyURL', {
			timeout: 1,
			cache: false,
			error: emptyFunc
		});
		ok(!this.cfhFlag, 'errorを指定しているのでcommonFailHandlerは実行されていない');
		this.cfhFlag = false;

		h5.settings.ajax.retryFilter = emptyFunc;
		h5.ajax('dummyURL', {
			timeout: 1,
			cache: false,
			complete: emptyFunc
		});
		ok(!this.cfhFlag, 'completeを指定しているのでcommonFailHandlerは実行されていない');
	});
});