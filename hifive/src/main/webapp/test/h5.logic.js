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
	var cleanAspects = testutils.u.cleanAspects;

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================
	//=============================
	// Definition
	//=============================
	module('Logic __construct', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('__constructの実行', 3, function() {
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
			h5.core.controller('#controllerTest', {
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
		setup:function(){
			$('#qunit-fixture').append('<div id="controllerTest"><input type="button"></div>');
		},
		teardown: function() {
			cleanAspects();
		}
	});

	//=============================
	// Body
	//=============================
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
	//=============================
	// Definition
	//=============================
	module('Logicのメソッド', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"><input type="button"></div>');
		},
		teardown: function() {
			clearController();
			cleanAspects();
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

	asyncTest('own()の動作', 4, function() {
		function Test(callback) {
			this.callback = callback;
		}

		Test.prototype.execute = function() {
			this.callback(100, 200);
		};

		var myLogic = {
			__name: 'MyLogic',
			test: function() {
				new Test(this.own(this.callback)).execute();
			},
			callback: function(arg1, arg2) {
				ok(this.__name === 'MyLogic', 'thisがロジックになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
				var returnVal = this.own(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownで作成した関数を呼び出して戻り値が返ってくること');
			}
		};

		var controller = {
			__name: 'TestController',
			myLogic: myLogic,
			__ready: function() {
				this.myLogic.test();
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			testController.unbind();
			start();
		});
	});

	asyncTest('ownWithOrg()の動作', 5, function() {
		function Test(callback) {
			this.callback = callback;
		}

		Test.prototype.execute = function() {
			this.callback(100, 200);
		};
		var org;
		var myLogic = {
			__name: 'MyLogic',
			test: function() {
				org = new Test(this.ownWithOrg(this.callback));
				org.execute();
			},
			callback: function(originalThis, arg1, arg2) {
				ok(originalThis === org, '元々のthisは第1引数に追加されているか');
				ok(this.__name === 'MyLogic', 'thisがロジックになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
				var returnVal = this.ownWithOrg(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownWithOrgで作成した関数を呼び出して戻り値が返ってくること');
			}
		};

		var controller = {
			__name: 'TestController',
			myLogic: myLogic,
			__ready: function() {
				this.myLogic.test();
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			testController.unbind();
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('Logic アスペクト', {
		setup:function(){
			$('#qunit-fixture').append('<div id="controllerTest"><input type="button"></div>');
		},
		teardown: function() {
			cleanAspects();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('[build#min]ロジックのAOPは動作しているか', function() {
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
		});
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

	test('[build#min]h5.core.logic() の動作', function() {
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
	});
});
