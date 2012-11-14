/*
 * Copyright (C) 2012 NS Solutions Corporation
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
	var ERR = ERRCODE.h5.core.controller;

	//=============================
	// Functions
	//=============================

	function cleanAspects() {
		h5.settings.aspects = null;
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================
	//=============================
	// Definition
	//=============================

	module(
			"Logic",
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest" style="display: none;"><div id="controllerResult"></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					$('#controllerTest').remove();
				}
			});

	//=============================
	// Body
	//=============================

	asyncTest('this.deferred()は使用できるか', function() {
		var innerDfd = null;
		function InnerLogic() {
		//
		}
		InnerLogic.prototype = {
			__name: 'InnerLogic',

			inner: function() {
				innerDfd = this.deferred();
			}
		};

		var dfd = null;
		function TestLogic() {
		//
		}
		TestLogic.prototype = {
			__name: 'TestLogic',

			innerLogic: new InnerLogic(),

			test: function() {
				dfd = this.deferred();
				this.innerLogic.inner();
			}
		};

		var controllerBase = {
			__name: 'TestController',

			testLogic: new TestLogic(),
			'input[type=button] click': function(context) {
				this.testLogic.test();
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').click();

			ok(dfd, 'ロジックのthis.deferred();は動作しているか');
			ok(innerDfd, 'ロジック内ロジックのthis.deferred();は動作しているか');

			testController.unbind();
		});

	});

	asyncTest('this.log()は使用できるか', function() {
		var category = null;
		function TestLogic() {
		//
		}
		TestLogic.prototype = {
			__name: 'TestLogic',

			test: function() {
				this.log.info("-------------- ロジックのログ出力 ここから --------------");
				this.log.error('Logic: ERRORレベルのログ');
				this.log.warn('Logic: WARNレベルのログ');
				this.log.info('Logic: INFOレベルのログ');
				this.log.debug('Logic: DEBUGレベルのログ');
				this.log.trace('Logic: TRACEレベルのログ');
				this.log.info("-------------- ロジックのログ出力 ここまで --------------");
				category = this.log.category;
			}
		};

		var controllerBase = {
			__name: 'TestController',

			testLogic: new TestLogic(),
			'input[type=button] click': function(context) {
				this.testLogic.test();
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').click();

			ok(category === 'TestLogic', 'ロジックのロガーのカテゴリは正しいか');
			ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');

			testController.unbind();
		});
	});

	asyncTest('ロジックのAOPは動作しているか ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			start();
			return;
		}

		var result = [];
		function TestLogic() {
		//
		}
		TestLogic.prototype = {
			__name: 'TestLogic',

			test: function() {
				result.push(1);
			},

			_private: function() {
				result.push(2);
			}
		};

		var logicAspect = {
			target: /TestLogic/,
			interceptors: function(invocation) {
				result.push(0);
				invocation.proceed();
			},
			pointCut: 'te*'
		};

		var ret1 = '';
		var ret2 = '';
		var controllerBase = {
			__name: 'TestController',

			testLogic: new TestLogic(),
			'input[type=button] click': function(el, ev) {
				this.testLogic.test();
				ret1 = result.join(';');
				result = [];
				this.testLogic._private();
				ret2 = result.join(';');
			}
		};
		h5.core.__compileAspects(logicAspect);
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').click();

			strictEqual(ret1, '0;1', 'ロジックのパブリックメソッドにインターセプタはかかっているか');
			strictEqual(ret2, '2', 'ロジックのプライベートメソッドにインターセプタはかかっていないか');

			testController.unbind();
			cleanAspects();
		});
	});

	test('h5.core.logic() の動作 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			return;
		}

		var dfd = null;
		var logger = null;
		var result = [];
		function TestLogic() {
		//
		}
		TestLogic.prototype = {
			__name: 'TestLogic',

			test: function() {
				dfd = this.deferred();
				logger = this.log;
				result.push(1);
			},

			_private: function() {
				result.push(2);
			}
		};

		var logicAspect = {
			interceptors: function(invocation) {
				result.push(0);
				invocation.proceed();
			}
		};
		h5.core.__compileAspects(logicAspect);

		var logic = h5.core.logic(new TestLogic());

		logic.test();
		ok(dfd, 'this.deferred() が使えるか');
		ok(logger, 'this.log が使えるか');
		strictEqual(result.join(';'), '0;1', 'ロジックの全てのメソッドにインターセプタはかかっているか1');
		result = [];
		logic._private();
		strictEqual(result.join(';'), '0;2', 'ロジックの全てのメソッドにインターセプタはかかっているか2');

		var error = false;
		try {
			h5.core.logic(logic);
		} catch (e) {
			error = true;
		}
		ok(error, 'ロジック化したオブジェクトを再度h5.core.logic() に渡すとエラーが発生するか');
		cleanAspects();

	});

	test('ロジックの循環参照チェックに引っかかるとエラーが発生するか', 1, function() {
		var test1Logic = {
			__name: 'Test1Logic'
		};
		var test2Logic = {
			__name: 'Test2Logic',

			test1Logic: test1Logic
		};

		test1Logic.test2Logic = test2Logic;

		var testController = {
			__name: 'TestController',
			test1Logic: test1Logic
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_CIRCULAR_REF, 'エラーが発生したか');
		}

	});
});
