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
	module('Logic h5.core.logic()', {
		teardown: function() {
			cleanAllAspects();
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('h5.core.logic()でロジックを生成できること', 1, function() {
		var logic = h5.core.logic({
			__name: 'logic'
		});
		// ownメソッドが追加されていることでロジック化されていることを確認
		ok($.isFunction(logic.own), 'ロジック化されていること');
	});

	test('ネストしたロジックがロジック化されること', 2, function() {
		var logic = h5.core.logic({
			__name: 'logic',
			childLogic: {
				__name: 'child',
				childLogic: {
					__name: 'grand'
				}
			}
		});
		// ownメソッドが追加されていることでロジック化されていることを確認
		ok($.isFunction(logic.childLogic.own), '子ロジックがロジック化されていること');
		ok($.isFunction(logic.childLogic.childLogic.own), '孫ロジックがロジック化されていること');
	});

	//=============================
	// Definition
	//=============================
	module('Logic 異常系', {
		teardown: function() {
			cleanAllAspects();
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('__nameがない', function() {
		try {
			h5.core.logic({});
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_LOGIC_NAME, e.message);
		}
	});

	test('__nameが文字列でない', function() {
		var names = ['', '   ', 1, {}, ["MyLogic"]];
		var l = names.length;
		expect(l);
		for (var i = 0, l = names.length; i < l; i++) {
			try {
				h5.core.logic({
					__name: names[i]
				});
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_INVALID_LOGIC_NAME, e.message);
			}
		}
	});

	test('__nameが無いロジックを子に持つロジック', 1, function() {
		try {
			h5.core.logic({
				__name: 'logic',
				childLogic: {}
			});
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_INVALID_LOGIC_NAME, e.message);
		}
	});

	test('既にロジック化されているロジック', 1, function() {
		var logic = h5.core.logic({
			__name: 'logic'
		});
		try {
			h5.core.logic(logic);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_ALREADY_CREATED, e.message);
		}
	});

	test('既にロジック化されているロジックを子に持つロジック', 1, function() {
		var logic = h5.core.logic({
			__name: 'logic'
		});
		try {
			h5.core.logic({
				__name: 'parent',
				myLogic: logic
			});
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_ALREADY_CREATED, e.message);
		}
	});

	test('循環参照するロジック', 1, function() {
		var logicDef = {
			__name: 'logic'
		};
		logicDef.childLogic = logicDef;
		try {
			h5.core.logic(logicDef);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_CIRCULAR_REF, e.message);
		}
	});

	test('子のロジックが循環参照している場合', 1, function() {
		var logicDef = {
			__name: 'logic'
		};
		logicDef.childLogic = logicDef;
		try {
			h5.core.logic({
				__name: 'parent',
				childLogic: logicDef
			});
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_LOGIC_CIRCULAR_REF, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('Logic __construct', {
		teardown: function() {
			cleanAllAspects();
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('ロジック化すると__constructが実行される', 1, function() {
		var logic = h5.core.logic({
			__name: 'logic',
			__construct: function() {
				this.isExecuted = true;
			},
			isExecuted: false
		});
		ok(logic.isExecuted, 'ロジックの__constructが実行されていること');
	});

	test('ネストしたロジックの__constructが実行される', 2, function() {
		var logic = h5.core.logic({
			__name: 'logic',
			childLogic: {
				__name: 'child',
				__construct: function() {
					this.isExecuted = true;
				},
				isExecuted: false,
				childLogic: {
					__name: 'grand',
					__construct: function() {
						this.isExecuted = true;
					},
					isExecuted: false
				}
			}
		});
		ok(logic.childLogic.isExecuted, '子ロジックの__constructが実行されていること');
		ok(logic.childLogic.childLogic.isExecuted, '孫ロジックの__constructが実行されていること');
	});

	test('子から順に__constructが実行される', 3, function() {
		h5.core.logic({
			__name: 'logic',
			__construct: function() {
				ok(this.child1Logic.isExecuted,
						'ルートロジックの__constructの時点で子ロジック１の__constructが実行されていること');
				ok(this.child2Logic.isExecuted,
						'ルートロジックの__constructの時点で子ロジック２の__constructが実行されていること');
			},
			isExecuted: false,
			child1Logic: {
				__name: 'child1',
				__construct: function() {
					this.isExecuted = true;
				},
				isExecuted: false
			},
			child2Logic: {
				__name: 'child2',
				__construct: function() {
					this.isExecuted = true;
					ok(this.childLogic.isExecuted,
							'子ロジックの__constructの時点で孫ロジックの__constructが実行されていること');
				},
				isExecuted: false,
				childLogic: {
					__name: 'grandChild',
					__construct: function() {
						this.isExecuted = true;
					},
					isExecuted: false
				}
			}
		});
	});

	test('__constructが例外を投げる場合', 1, function() {
		var errorObj = new Error();
		var myLogic = {
			__name: 'myLogic',
			__construct: function() {
				throw errorObj;
			}
		};
		try {
			h5.core.logic({
				__name: 'logic',
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
	module('Logicのメソッド', {
		teardown: function() {
			clearController();
		}
	});

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
			clearController();
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

	//=============================
	// Definition
	//=============================
	module('Logic キャッシュ', {
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('clear()でロジックのキャッシュをクリアできること', 2, function() {
		h5.core.logic({
			__name: 'logic',
			hoge: function() {
			// 何もしない
			}
		});
		h5.core.definitionCacheManager.clear('logic');
		var logic = h5.core.logic({
			__name: 'logic',
			fuga: function() {
			// 何もしない
			}
		});
		ok($.isFunction(logic.fuga), 'clearすると新しいロジック定義が反映されること');
		ok(!$.isFunction(logic.hoge), 'clearするとclearする前のロジック定義は使用されないこと');
	});

	test('clearAll()でロジックのキャッシュをクリアできること', 2, function() {
		h5.core.logic({
			__name: 'logic',
			hoge: function() {
			// 何もしない
			}
		});
		h5.core.definitionCacheManager.clearAll('logic');
		var logic = h5.core.logic({
			__name: 'logic',
			fuga: function() {
			// 何もしない
			}
		});
		ok($.isFunction(logic.fuga), 'clearAllすると新しいロジック定義が反映されること');
		ok(!$.isFunction(logic.hoge), 'clearAllするとclearする前のロジック定義は使用されないこと');
	});
});
