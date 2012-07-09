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

	module("h5.ajax");

	test('jqXHRにprogressメソッドが追加されているか', function() {

		var jqXHR = h5.ajax();

		ok($.isFunction(jqXHR.progress), 'h5.async.ajax() の戻り値のオブジェクトにprogressメソッドが追加されているか');
	});

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
		h5.settings.commonFailHandler = null;
		ok(!error, 'h5.async.ajax() の戻り値のオブジェクトのthen()でprogressCallbackを登録しようとしてもエラーにならないか');
	});

	asyncTest(
			'commonFailHandlerの動作1',
			function() {

				var triggerCommonFailHandler = false;
				h5.settings.commonFailHandler = function() {
					triggerCommonFailHandler = true;
				};

				h5.ajax('dummyURL');
				setTimeout(
						function() {
							start();
							ok(triggerCommonFailHandler,
									'fail, error, always, completeに登録されたコールバックがない場合にh5.ajax() でcommonFailHandlerは動作するか');
							h5.settings.commonFailHandler = null;
						}, 500);
			});

	asyncTest('commonFailHandlerの動作2', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL',
			error: function() {}
		});
		setTimeout(
				function() {
					start();
					ok(!triggerCommonFailHandler,
							'オプションでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
					h5.settings.commonFailHandler = null;
				}, 500);
	});

	asyncTest('commonFailHandlerの動作3', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL',
			fail: function() {}
		});
		setTimeout(
				function() {
					start();
					ok(!triggerCommonFailHandler,
							'オプションでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
					h5.settings.commonFailHandler = null;
				}, 500);
	});

	asyncTest('commonFailHandlerの動作4', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL',
			complete: function() {}
		});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'オプションでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

	asyncTest('commonFailHandlerの動作5', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL',
			always: function() {}
		});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'オプションでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

	asyncTest('commonFailHandlerの動作6', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL'
		}).error(function() {});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'メソッドチェーンでerrorを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

	asyncTest('commonFailHandlerの動作7', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL'
		}).fail(function() {});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'メソッドチェーンでfailを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

	asyncTest('commonFailHandlerの動作8', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL'
		}).complete(function() {});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'メソッドチェーンでcompleteを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

	asyncTest('commonFailHandlerの動作9', function() {

		var triggerCommonFailHandler = false;
		h5.settings.commonFailHandler = function() {
			triggerCommonFailHandler = true;
		};

		h5.ajax({
			url: 'dummyURL'
		}).always(function() {});
		setTimeout(function() {
			start();
			ok(!triggerCommonFailHandler,
					'メソッドチェーンでalwaysを登録した場合に、h5.ajax() でcommonFailHandlerは動作しないか');
			h5.settings.commonFailHandler = null;
		}, 500);
	});

});
