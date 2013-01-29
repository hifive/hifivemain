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
	var timeoutTime = 5000;

	//=============================
	// Functions
	//=============================

	/**
	 * コールバックに指定するダミー関数
	 */
	function dummyFunc() {
	//
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

	test('jqXHRにprogressメソッドが追加されているか', function() {

		var jqXHR = h5.ajax();

		ok($.isFunction(jqXHR.progress), 'h5.async.ajax() の戻り値のオブジェクトにprogressメソッドが追加されているか');
	});


	//=============================
	// Definition
	//=============================

	module('commonFailHandler', {
		teardown: function() {
			h5.settings.commonFailHandler = null;
		}
	});

	//=============================
	// Body
	//=============================

	test('commonFailHandlerが設定されている時、jqXHR#then()でprogressCallbackを登録しようとしてもエラーにならないか', function() {

		h5.settings.commonFailHandler = function() {
		// 何もしない
		};
		var jqXHR = h5.ajax();

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

	asyncTest(
			'commonFailHandlerの動作1',
			function() {
				var msg = 'fail, error, always, completeに登録されたコールバックがない場合にh5.ajax() でcommonFailHandlerが動作すること';
				var timerId = setTimeout(function() {
					// timerが止められてない = commonFailHandlerに入ってないので失敗
					ok(false, msg);
					start();
				}, timeoutTime);

				h5.settings.commonFailHandler = function() {
					// タイマーを止める
					clearTimeout(timerId);

					// テスト成功
					ok(true, msg);
					start();
				};

				// 存在しないURLをajaxで読む。コールバックを登録していないので、commonFailHandlerに入るはず
				h5.ajax('dummyURL');
			});

	asyncTest('commonFailHandlerの動作2', function() {
		var msg = 'オプションでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};

		h5.ajax({
			url: 'dummyURL',
			error: dummyFunc
		});
	});

	asyncTest('commonFailHandlerの動作3', function() {
		var msg = 'オプションでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};


		h5.ajax({
			url: 'dummyURL',
			fail: dummyFunc
		});
	});

	asyncTest('commonFailHandlerの動作4', function() {
		var msg = 'オプションでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};


		h5.ajax({
			url: 'dummyURL',
			complete: dummyFunc
		});
	});

	asyncTest('commonFailHandlerの動作5', function() {
		var msg = 'オプションでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};


		h5.ajax({
			url: 'dummyURL',
			always: dummyFunc
		});
	});

	asyncTest('commonFailHandlerの動作6', function() {
		var msg = 'メソッドチェーンでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};

		h5.ajax({
			url: 'dummyURL'
		}).error(dummyFunc);
	});

	asyncTest('commonFailHandlerの動作7', function() {
		var msg = 'メソッドチェーンでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};


		h5.ajax({
			url: 'dummyURL'
		}).fail(dummyFunc);
	});

	asyncTest('commonFailHandlerの動作8', function() {
		var msg = 'メソッドチェーンでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};

		h5.ajax({
			url: 'dummyURL',
			fail: dummyFunc
		}).complete(dummyFunc);
	});

	asyncTest('commonFailHandlerの動作9', function() {
		var msg = 'メソッドチェーンでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと';
		var timerId = setTimeout(function() {
			ok(true, msg);
			start();
		}, timeoutTime);

		h5.settings.commonFailHandler = function() {
			// タイマーを止める
			clearTimeout(timerId);

			ok(false, msg);
			start();
		};

		h5.ajax({
			url: 'dummyURL'
		}).always(dummyFunc);
	});
});