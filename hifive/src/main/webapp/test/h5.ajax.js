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

	test('h5.async.ajax()', function() {

		var jqXHR = h5.ajax();

		ok($.isFunction(jqXHR.progress), 'h5.async.ajax() の戻り値のオブジェクトにprogressメソッドが追加されているか');
	});


	//=============================
	// Definition
	//=============================

	module('then', {
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
		}, timeoutTime);

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

	asyncTest('オプションでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
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

	asyncTest('オプションでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
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

	asyncTest('メソッドチェーンでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		}).error(function() {
			setTimeout(function() {
				ok(!that.cfhFlag);
				start();
			}, 0);
		});
	});

	asyncTest('メソッドチェーンでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
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

	asyncTest('メソッドチェーンでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		}).complete(function() {
			setTimeout(function() {
				ok(!that.cfhFlag);
				start();
			}, 0);
		});
	});

	asyncTest('メソッドチェーンでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないこと', function() {
		var that = this;
		h5.ajax({
			url: 'dummyURL',
			timeout: 1
		}).complete(function() {
			setTimeout(function() {
				ok(!that.cfhFlag);
				start();
			}, 0);
		});
	});
});