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
	var clearController = testutils.u.clearController;

	// エラーコード
	var ERR = ERRCODE.h5.core.controller;

	//=============================
	// Functions
	//=============================
	// testutils
	var cleanAllAspects = testutils.u.cleanAllAspects;

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================
	//=============================
	// Definition
	//=============================
	module('Logic __construct');

	//=============================
	// Body
	//=============================
	test('ロジックの__construct', 2, function() {
		$('#qunit-fixture').append('<div id="controllerTest"></div>');
		var logic = h5.core.logic({
			__name: 'logic',
			__construct: function() {
				this.isExecuted = true;
			},
			isExecuted: false,
			childLogic: {
				__name: 'childLogic',
				__construct: function() {
					this.isExecuted = true;
				},
				isExecuted: false
			}
		});
		ok(logic.isExecuted, 'ロジックの__constructが実行されていること');
		ok(logic.childLogic.isExecuted, '子ロジックの__constructが実行されていること');
	});

	asyncTest('コントローラの持つロジックの__construct', 3, function() {
		$('#qunit-fixture').append('<div id="controllerTest"></div>');
		var myLogic = {
			__name: 'logic',
			__construct: function() {
				this.isExecuted = true;
			},
			isExecuted: false,
			childLogic: {
				__name: 'childLogic',
				__construct: function() {
					this.isExecuted = true;
				},
				isExecuted: false
			}
		};
		h5.core.controller('#controllerTest',
				{
					__name: 'controller',
					myLogic: myLogic,
					childController: {
						__name: 'childController',
						myLogic: myLogic
					},
					__construct: function() {
						ok(this.myLogic.isExecuted,
								'ロジックの__constructがルートコントローラの__constructよりも前に実行されていること');
						ok(this.myLogic.childLogic.isExecuted,
								'子ロジックの__constructがルートコントローラの__constructよりも前に実行されていること');
						ok(this.childController.myLogic.isExecuted,
								'子コントローラのロジックの__constructがルートコントローラの__constructよりも前に実行されていること');
					}
				}).readyPromise.done(function() {
			clearController();
			start();
		});
	});

	test('__constructが例外を投げる場合', 1, function() {
		var errorObj = new Error();
		var myLogic = {
			__name: 'logic',
			__construct: function() {
				throw errorObj;
			}
		};
		try {
			h5.core.logic({
				__name: 'controller',
				myLogic: myLogic
			});
		} catch (e) {
			strictEqual(e, errorObj, 'ロジックの__constructが例外を投げた時、try-catchで拾えること');
		}
	});

	test('h5.core.logic()で__constructが実行されること', 1, function() {
		var logic = h5.core.logic({
			__name: 'logic',
			__construct: function() {
				this.isExecuted = true;
			},
			isExecuted: false
		});
		ok(logic.isExecuted, '__constructが実行されること');
	});

	test('__constructの時点でロジックのメソッドが用意されていること', 4, function() {
		h5.core.logic({
			__name: 'logic',
			__construct: function() {
				ok(this.log, 'this.log');
				ok(this.own, 'this.own');
				ok(this.ownWithOrg, 'this.ownWithOrg');
				ok(this.deferred, 'this.deferred');
			}
		});
	});

	//=============================
	// Definition
	//=============================
	module('Logic 異常系', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"><input type="button"></div>');
		},
		teardown: function() {
			cleanAllAspects();
		}
	});

	//=============================
	// Body
	//=============================
	test('コントローラの持つロジックが循環参照', 1, function() {
		$('#qunit-fixture').append('<div id="controllerTest"><input type="button"></div>');
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
		clearController();
	});

	test('h5.core.logic()に既にロジック化されているものを渡す', function() {
		var logic = h5.core.logic({
			__name: 'logic'
		});
		try {
			h5.core.logic(logic);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_ALREADY_CREATED, e.message);
		}
	});

	test('既にロジック化されているものをコントローラのロジックとして持たせる', function() {
		$('#qunit-fixture').append('<div id="testController"></div>');
		var logic = h5.core.logic({
			__name: 'logic'
		});
		try {
			h5.core.controller('#testController', {
				__name: 'controller',
				myLogic: logic
			});
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_ALREADY_CREATED, e.message);
		}
		clearController();
	});

	//=============================
	// Definition
	//=============================
	module('Logicのメソッド');

	//=============================
	// Body
	//=============================
	test('this.deferred()は使用できるか', function() {
		var logic = h5.core.logic({
			__name: 'logic',
			childLogic: {
				__name: 'child',
				check: function() {
					ok($.isFunction(this.deferred), '子ロジックのthis.deferred();は動作しているか');
				}
			},
			check: function() {
				ok($.isFunction(this.deferred), 'ロジックのthis.deferred();は動作しているか');
			}
		});
		logic.check();
		logic.childLogic.check();
	});

	test('this.log()は使用できるか', function() {
		var category = null;
		var logic = h5.core.logic({
			__name: 'TestLogic',
			check: function() {
				this.log.info("-------------- ロジックのログ出力 ここから --------------");
				this.log.error('Logic: ERRORレベルのログ');
				this.log.warn('Logic: WARNレベルのログ');
				this.log.info('Logic: INFOレベルのログ');
				this.log.debug('Logic: DEBUGレベルのログ');
				this.log.trace('Logic: TRACEレベルのログ');
				this.log.info("-------------- ロジックのログ出力 ここまで --------------");
				category = this.log.category;
			}
		});
		logic.check();
		ok(category === 'TestLogic', 'ロジックのロガーのカテゴリは正しいか');
		ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');
	});

	test('own()の動作', 4, function() {
		function Test(callback) {
			this.callback = callback;
		}
		Test.prototype.execute = function() {
			this.callback(100, 200);
		};

		var logic = h5.core.logic({
			__name: 'MyLogic',
			check: function() {
				new Test(this.own(this.callback)).execute();
			},
			callback: function(arg1, arg2) {
				strictEqual(this, logic, 'thisがロジックになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
				var returnVal = this.own(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownで作成した関数を呼び出して戻り値が返ってくること');
			}
		});
		logic.check();
	});

	test('ownWithOrg()の動作', 5, function() {
		function Test(callback) {
			this.callback = callback;
		}

		Test.prototype.execute = function() {
			this.callback(100, 200);
		};
		var org;
		var logic = h5.core.logic({
			__name: 'MyLogic',
			check: function() {
				org = new Test(this.ownWithOrg(this.callback));
				org.execute();
			},
			callback: function(originalThis, arg1, arg2) {
				ok(originalThis === org, '元々のthisは第1引数に追加されているか');
				strictEqual(this, logic, 'thisがロジックになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
				var returnVal = this.ownWithOrg(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownWithOrgで作成した関数を呼び出して戻り値が返ってくること');
			}
		});
		logic.check();
	});

	//=============================
	// Definition
	//=============================
	module('Logic アスペクト', {
		teardown: function() {
			cleanAllAspects();
		}
	});

	//=============================
	// Body
	//=============================
	test('[build#min]ロジックのAOPは動作しているか', function() {
		var isExecuted;
		var logicAspect = {
			target: /TestLogic/,
			interceptors: function(invocation) {
				isExecuted = true;
				invocation.proceed();
			}
		};

		h5.core.__compileAspects(logicAspect);
		var logic = h5.core.logic({
			__name: 'TestLogic',
			test: function() {
			// 何もしない
			},
			_private: function() {
			// 何もしない
			}
		});
		logic.test();
		ok(isExecuted, 'ロジックのパブリックメソッドにインターセプタはかかっているか');
		isExecuted = false;
		logic._private();
		ok(isExecuted, 'ロジックのプライベートメソッドにインターセプタはかかっていないか');
	});

	test('[build#min]__constructに対してアスペクトが適用されること', 1, function() {
		var isInterceptorExecuted;
		var logicAspect = {
			target: /TestLogic/,
			interceptors: function(invocation) {
				isInterceptorExecuted = true;
				invocation.proceed();
			}
		};
		h5.core.__compileAspects(logicAspect);
		h5.core.logic({
			__name: 'TestLogic',
			__construct: function() {
			// 何もしない
			}
		});
		ok(isInterceptorExecuted);
	});
});
