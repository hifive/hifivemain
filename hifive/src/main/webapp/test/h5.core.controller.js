/*
 * Copyright (C) 2012 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
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
	var ERR_VIEW = ERRCODE.h5.core.view;

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	// svgをサポートしているか
	var isSupportSVG = document.createElementNS
			&& $
					.isFunction(document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);

	//=============================
	// Functions
	//=============================

	function rgbToHex(rgbStr) {
		if (/^#\d{3,6}$/.test(rgbStr)) {
			return rgbStr;
		}

		var hexStr = '#';
		var patterns = rgbStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

		if (!patterns) {
			return rgbStr;
		}

		var hexs = [];

		for ( var i = 1; i < patterns.length; i++) {
			hexs.push(("0" + parseInt(patterns[i]).toString(16)).slice(-2));
		}

		// #9922ff->#92fのようにショートハンドに変換する
		if (hexs[0][0] === hexs[0][1] && hexs[1][0] === hexs[1][1] && hexs[2][0] === hexs[2][1]) {
			hexStr += (hexs[0][0] + hexs[1][0] + hexs[2][0]);
		} else {
			hexStr += hexs.join();
		}

		return hexStr;
	}

	// コントローラがdisposeされているかどうかチェックする関数
	function isDisposed(controller) {
		var ret = true;
		for ( var p in controller) {
			if (controller.hasOwnProperty(p) && controller[p] !== null) {
				ret = false;
			}
		}
		return ret;
	}


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
			"Controller - expose",
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest" style="display: none;"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					$('#controllerTest').remove();
					h5.settings.commonFailHandler = undefined;
				}
			});

	//=============================
	// Body
	//=============================

	test('h5.core.expose()を実行', function() {

		var c1 = {
			__name: 'TestController'
		};
		var c2 = {
			__name: 'com.htmlhifive.test.controller.TestController'
		};
		var c3 = {
			a: 1
		};

		h5.core.expose(c1);
		strictEqual(c1, window.TestController, '"."を含まない__nameの場合、window直下に紐付けられたか');
		h5.core.expose(c2);
		strictEqual(c2, window.com.htmlhifive.test.controller.TestController,
				'"."を含む__nameの場合、window以下に名前空間が作られて紐付けられたか');

		try {
			h5.core.expose(c3);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_EXPOSE_NAME_REQUIRED,
					'コントローラ、ロジック以外(__nameプロパティがない)のオブジェクトをh5.core.expose()に渡すとエラーが発生するか');
		}

		window.TestController = undefined;
		window.jp = undefined;
		strictEqual(undefined, window.TestController, '（名前空間のクリーンアップ1）');
		strictEqual(undefined, window.jp, '（名前空間のクリーンアップ2）');
	});

	//=============================
	// Definition
	//=============================

	module(
			"Controller",
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest" style="display: none;"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					$('#controllerTest').remove();
					h5.settings.commonFailHandler = undefined;
				}
			});


	//=============================
	// Body
	//=============================

	asyncTest('コントローラの作成と要素へのバインド(AOPなし)', 3, function() {
		var cc = null;
		var controller = {

			__name: 'TestController',

			'input[type=button] click': function(context) {
				cc = context.controller;
				this.test();
			},
			test: function() {
				$('#controllerResult').empty().text('ok');
			},

			dblTest: function() {
				$('#controllerResult').empty().text('dblok');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {

			$('#controllerTest input[type=button]').click();
			var clickResult = $('#controllerResult').text();

			strictEqual(clickResult, 'ok', 'コントローラが要素にバインドされているか');
			ok(testController === cc, 'イベントコンテキストにコントローラの参照(context.controller)が格納されているか');

			var result = [];
			var outControllerBase = {
				__name: 'OutController',

				'{body} click': function() {
					result.push(0);
				}
			};

			var outController = h5.core.controller('#controllerResult', outControllerBase);
			outController.readyPromise.done(function() {

				$('body').click();
				ok(result.length, 'コントローラの外にある要素にイベントコールバックが設定できたか');

				testController.unbind();
				outController.unbind();
				start();
			});
		});
	});

	asyncTest('コントローラの作成と要素へのバインド(AOPあり) ※min版ではエラーになります', 3, function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}


		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.test();
			},
			test: function() {
				$('#controllerResult').empty().text('ok');
			},

			dblTest: function() {
				$('#controllerResult').empty().text('dblok');
			}
		};

		var aop1 = {
			interceptors: function(invocation) {
				var rootElement = this.rootElement;
				$(rootElement).append('<div id="aop1"></div>');
				invocation.proceed();
			}
		};

		var aop2 = {
			interceptors: function(invocation) {
				var rootElement = this.rootElement;
				$(rootElement).append('<div id="aop2"></div>');

				invocation.proceed();
			}
		};

		h5.core.__compileAspects([aop1, aop2]);

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();

			strictEqual($('#controllerResult').text(), 'ok', 'コントローラが要素にバインドされているか');
			ok($('#controllerTest #aop1').length, 'AOP1は動作しているか');
			ok($('#controllerTest #aop2').length, 'AOP2は動作しているか');

			testController.unbind();
			cleanAspects();
			start();
		});

	});

	asyncTest('コントローラの作成と要素へのバインド セレクタ、イベントの前後にスペースがあってもイベントハンドリングできること', 9, function() {
		var controller = {

			__name: 'TestController',

			' input[type=button] click': function(context) {
				this.test(0);
			},
			'  input[type=button]  dblclick       ': function(context) {
				this.dblTest();
			},
			' #a .b click1': function(context) {
				this.test(1);
			},
			'      #a .b    click2 ': function(context) {
				this.test(2);
			},
			'      #a    .b  click3': function(context) {
				this.test(3);
			},
			' {#a .b} click4': function(context) {
				this.test(4);
			},
			' { #a .b}    click5': function(context) {
				this.test(5);
			},
			' { #a  .b} click6   ': function(context) {
				this.test(6);
			},
			'  {   #a    .b    }    click7   ': function(context) {
				this.test(7);
			},
			test: function(n) {
				$('#controllerResult').empty().text(n);
			},

			dblTest: function() {
				$('#controllerResult').empty().text('dblok');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var $result = $('#controllerResult');

			$('#controllerTest input[type=button]').click();
			strictEqual($result.text(), '0', 'コントローラが要素にバインドされているか');

			$('#controllerTest input[type=button]').dblclick();
			strictEqual($result.text(), 'dblok', 'コントローラが要素にバインドされているか');

			for ( var i = 1; i <= 7; i++) {
				$('#controllerTest #a .b').trigger('click' + i);
				strictEqual($result.text(), '' + i, 'コントローラが要素にバインドされているか');
			}
			start();
		});
	});

	test('h5.core.controller() 不正な引数を渡した場合、及び指定された要素が存在しないまたは、複数ある場合にエラーが出ること', 6, function() {
		$('#controllerTest').append('<div class="test">a</div>');
		$('#controllerTest').append('<div class="test">b</div>');
		var controller = {
			__name: 'TestController'
		};
		try {
			h5.core.controller(null, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_REQUIRED, e.message);
		}
		try {
			h5.core.controller(undefined, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_REQUIRED, e.message);
		}
		try {
			h5.core.controller('#noexist', controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NO_TARGET, e.message);
		}
		try {
			h5.core.controller('', controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NO_TARGET, e.message);
		}
		try {
			h5.core.controller('.test', controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TOO_MANY_TARGET, e.message);
		}
		try {
			h5.core.controller(1, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_ILLEGAL, e.message);
		}
	});

	asyncTest('bind() 引数が不正、またはコントローラ化されたコントローラからの呼び出しでない場合、及び指定された要素が存在しないまたは、複数ある場合にエラーが出ること', 7,
			function() {
				$('#controllerTest').append('<div class="test">a</div>');
				$('#controllerTest').append('<div class="test">b</div>');
				var controller = {
					__name: 'TestController'
				};
				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise.done(function() {
					try {
						testController.bind();
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_REQUIRED, e.message);
					}
					try {
						testController.bind(null);
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_REQUIRED, e.message);
					}
					try {
						var bind = testController.bind;
						bind('#controllerTest');
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_CONTROLLER, e.message);
					}
					try {
						testController.bind('#noexist');
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_NO_TARGET, e.message);
					}
					try {
						testController.bind('');
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_NO_TARGET, e.message);
					}
					try {
						testController.bind('.test');
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_TOO_MANY_TARGET, e.message);
					}
					try {
						testController.bind(1);
					} catch (e) {
						strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_ILLEGAL, e.message);
					}
					testController.dispose().done(function() {
						start();
					});
				});
			});

	asyncTest('イベントハンドラの{}記法でオブジェクトを指定する時に2階層以上下のオブジェクトを指定できるか', function() {
		window.test1 = {
			test2: $('#controllerResult')
		};
		var ret = false;
		var controller = {

			__name: 'TestController',

			'{window.test1.test2} click': function(context) {
				ret = true;
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			$('#controllerResult').click();
			ok(ret, '{}記法で2階層以上下のオブジェクトを指定できたか');

			testController.unbind();
			start();
		});
	});

	test('__name属性のないオブジェクトをコントローラとしてバインドしようとするとエラーが出ること', function() {
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		var controller = {
			name: 'TestController'
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});

	test('__name属性が不正なオブジェクトをコントローラとしてバインドしようとするとエラーが出ること', function() {
		var names = ['', '   ', 1, {}, ["MyController"]];
		var l = names.length;
		expect(l);
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		for ( var i = 0; i < l; i++) {
			try {
				h5.core.controller('#controllerTest', {
					__name: names[i]
				});
				ok(false, 'エラーが発生していません。');
			} catch (e) {
				deepEqual(e.code, errorCode, e.message);
			}
		}
	});


	test('__name属性のないロジックを持つコントローラをバインドしようとするとエラーが出ること', function() {
		var errorCode = ERR.ERR_CODE_INVALID_LOGIC_NAME;
		var controller = {
			__name: 'TestController',
			myLogic: {
				name: 'MyLogic'
			}
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
	});


	test('__name属性が不正なロジックを持つコントローラをバインドしようとするとエラーが出ること', function() {
		var names = ['', '   ', 1, {}, ["MyLogic"]];
		var l = names.length;
		expect(l);
		var errorCode = ERR.ERR_CODE_INVALID_LOGIC_NAME;
		for ( var i = 0; i < l; i++) {
			try {
				h5.core.controller('#controllerTest', {
					__name: 'TestController',
					myLogic: {
						__name: names[i]
					}
				});
				ok(false, 'エラーが発生していません。');
			} catch (e) {
				deepEqual(e.code, errorCode, e.message);
			}
		}
	});

	test('存在しない要素・複数要素へのバインド', function() {

		var controller = {
			__name: 'TestController'
		};
		var err1 = '';
		var err2 = '';

		try {
			h5.core.controller('div.noexistclass', controller);
		} catch (e) {
			err1 = e;
		}
		try {
			h5.core.controller('div', controller);
		} catch (e) {
			err2 = e;
		}

		strictEqual(err1.code, ERR.ERR_CODE_BIND_NO_TARGET, 'バインド対象がない場合エラーとなるか');
		strictEqual(err2.code, ERR.ERR_CODE_BIND_TOO_MANY_TARGET, 'バインド対象が複数ある場合エラーとなるか');
	});

	asyncTest('コントローラのアンバインド', function() {
		var disposeRet = null;
		var disposeRoot = null;
		var rebind = null;
		var exeUnbind = [];
		var childController = {
			__name: 'ChildController',

			__unbind: function() {
				exeUnbind.push(0);
			}
		};
		var controller = {
			__name: 'TestController',

			childController: childController,

			__init: function(context) {
				rebind = context.args.param1;
			},

			__unbind: function() {
				disposeRet = 1;
				disposeRoot = this.rootElement;
				exeUnbind.push(1);
			},

			'input[type=button] click': function(context) {
				this.test();
			},

			'{document} [click]': function(context) {
				this.test();
			},

			'#btn [click]': function(context) {
				this.test();
			},

			'{body} click': function(context) {
				this.test();
			},

			test: function() {
				$('#controllerResult').empty().text('ok');
			}
		};
		var testController = h5.core.controller('#controllerTest', controller, {
			param1: 50
		});
		testController.readyPromise.done(function() {
			testController.unbind();

			strictEqual(exeUnbind.join(';'), '0;1', '__unbindハンドラは動作したか');

			$('#controllerTest input[type=button]').click();
			strictEqual($('#controllerResult').text(), '', 'コントローラ内要素はundelegateされているか');
			$('#controllerResult').empty();

			$('#btn').click();
			strictEqual($('#controllerResult').text(), '', 'コントローラ内要素はunbindされているか');
			$('#controllerResult').empty();

			$(document).click();
			strictEqual($('#controllerResult').text(), '', 'コントローラ外の要素はunbindされているか');
			$('#controllerResult').empty();

			$('body').click();
			strictEqual($('#controllerResult').text(), '', 'コントローラ外の要素はdieされているか');
			$('#controllerResult').empty();

			strictEqual(testController.rootElement, null, 'コントローラのrootElementはnullであるか');
			strictEqual(testController.childController.rootElement, null,
					'子コントローラのrootElementはnullであるか');
			ok(disposeRet, '__unbindは動作しているか');
			ok(disposeRoot, '__unbindの中でrootElementに触れるか');

			// アンバインドしたコントローラを再びバインド
			testController.bind('#controllerTest', {
				param1: 100
			});
			testController.readyPromise.done(function() {

				strictEqual(rebind, 100, '1度アンバインドしたコントローラを再びバインドして__initハンドラが動作するか');
				$('#controllerTest input[type=button]').click();
				strictEqual($('#controllerResult').text(), 'ok',
						'1度アンバインドしたコントローラを再びバインドしてイベントハンドラが動作するか');
				testController.unbind();
				start();
			});
		});
	});

	asyncTest(
			'h5.core.controllerManager.getAllControllers() で現在バインドされているすべてのコントローラを取得できること',
			function() {
				// 現在バインドされているコントローラを全てunbindする
				for ( var i = 0, controllers = h5.core.controllerManager.getAllControllers(), l = controllers.length; i < l; i++) {
					controllers[i].unbind();
				}
				var names = ['Test1Controller', 'Test2Controller', 'Test3Controller'];
				var p = [];
				for ( var i = 0, l = names.length; i < l; i++) {
					p[i] = h5.core.controller('#controllerTest', {
						__name: names[i]
					});
				}
				p[0].readyPromise.done(function() {
					p[1].readyPromise.done(function() {
						p[2].readyPromise.done(function() {
							var controllers = h5.core.controllerManager.getAllControllers();
							for ( var i = 0, l = controllers.length; i < l; i++) {
								controllers[i] = controllers[i].__name;
							}
							deepEqual(controllers, names, '3つバインドしたコントローラが取得できること');
							start();
						});
					});
				});
			});

	asyncTest('h5.core.viewがない時のコントローラの動作', function() {
		var index = h5.core.controllerManager.getAllControllers().length;
		var view = h5.core.view;
		h5.core.view = null;
		var controller = {
			__name: 'TestController'
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			ok(h5.core.controllerManager.controllers[index] === testController,
					'Viewがなくてもコントローラは動作するか');
			ok(!h5.core.view, 'Viewは落ちているか');
			h5.core.view = view;
			start();
		});
	});

	asyncTest('テンプレートが存在しない時のコントローラの動作', 7, function() {
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath'],
			__construct: function(context) {
				deepEqual(++count, 1, '1. コンストラクタが実行される。');
			},
			__init: function(context) {
				ok(false, 'テスト失敗。__initが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。__readyが実行された');
			},
			__dispose: function(context) {
				deepEqual(++count, 4, '4. __disposeが実行されること');
				start();
			},
			__unbind: function(context) {
				deepEqual(++count, 3, '3. __unbindが実行されること');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preinitPromise.done(function() {
			ok(false, 'テスト失敗。preinitPromiseがresolve()された');
		}).fail(function(e) {
			deepEqual(++count, 2, 'preinitPromiseのfailハンドラが実行される。');
			strictEqual(e.controllerDefObject, controller, 'エラーオブジェクトからコントローラオブジェクトが取得できる');
		});
		testController.initPromise.done(function(a) {
			ok(false, 'テスト失敗。initPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(true, 'initPromiseのfailハンドラが実行される');
		});
		testController.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(true, 'reaedyPromiseのfailハンドラが実行される');
		});
	});

	asyncTest('テンプレートが存在しない時のコントローラの動作 2', 23, function() {
		var disposedController = {};
		var bController = {
			__name: 'BController',

			__construct: function(context) {
				ok(true, '孫コントローラのコンストラクタが実行される。');
				this.preinitPromise.done(function() {
					ok(true, '孫コントローラのpreinitPromiseのdoneハンドラが呼ばれる。');
				}).fail(function() {
					ok(false, 'テスト失敗。孫コントローラのpreinitPromiseのfailハンドラが呼ばれた。');
				});
				this.initPromise.done(function() {
					ok(true, '孫コントローラのinitPromiseのdoneハンドラが呼ばれる。');
				}).fail(function() {
					ok(false, 'テスト失敗。孫コントローラのinitPromiseのfailハンドラが呼ばれた。');
				});
				this.readyPromise.done(function() {
					ok(false, 'テスト失敗。孫コントローラのreadyPromiseのdoneハンドラが呼ばれた。');
					start();
				}).fail(function() {
					ok(true, '孫コントローラのreadyPromiseのfailハンドラが呼ばれる。');
				});

			},
			__init: function(context) {
			// 孫の__initは、その前にコントローラ群がdisposeされていれば実行されない
			},
			__ready: function(context) {
			// 孫の__readyは、その前にコントローラ群がdisposeされていれば実行されない
			},
			__dispose: function(context) {
				ok(true, '孫コントローラの__disposeが実行される。');
				disposedController.b = this;
			},
			__unbind: function(context) {
				ok(true, '孫コントローラの__unbindが実行される。');
			}
		};
		var aController = {
			__name: 'AController',
			__templates: '/noExistPath',
			childController: bController,

			__construct: function(context) {
				ok(true, '子コントローラのコンストラクタが実行される。');
				this.preinitPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのpreinitPromiseのdoneハンドラが呼ばれた。');
				}).fail(function() {
					ok(true, '子コントローラのpreinitPromiseのfailハンドラが呼ばれる。');
				});
				this.initPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのinitPromiseのdoneハンドラが呼ばれた。');
				}).fail(function() {
					ok(true, '子コントローラのinitPromiseのfailハンドラが呼ばれる。');
				});
				this.readyPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのreadyPromiseのdoneハンドラが呼ばれた。');
				}).fail(function() {
					ok(true, '子コントローラのreadyPromiseのfailハンドラが呼ばれる。');
				});
			},
			__init: function(context) {
				ok(false, 'テスト失敗。子コントローラの__initが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。子コントローラの__readyが実行された');
			},
			__dispose: function(context) {
				ok(true, '子コントローラの__disposeが実行される。');
				disposedController.a = this;
			},
			__unbind: function(context) {
				ok(true, '子コントローラの__unbindが実行される。');
			}
		};

		var controller = {
			__name: 'TestController',
			__templates: ['./template/test2.ejs'],
			childController: aController,

			__construct: function(context) {
				ok(true, '親コントローラのコンストラクタが実行される。');
			},
			__init: function(context) {
				ok(false, 'テスト失敗。親コントローラの__initが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。親コントローラの__readyが実行された');
			},
			__dispose: function(context) {
				ok(true, '親コントローラの__disposeが実行される。');
				disposedController.test = this;
				setTimeout(function() {
					for ( var i = 0; i < 3; i++) {
						var prop = ['b', 'a', 'test'][i];
						var str = ['孫', '子', '親'][i];
						ok(isDisposed(disposedController[prop]), str + 'コントローラがdisposeされていること');
					}
					start();
				}, 0);
			},
			__unbind: function(context) {
				ok(true, '親コントローラの__unbindが実行される。');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preinitPromise.done(function() {
			ok(true, '親コントローラのpreinitPromiseのdoneハンドラが呼ばれる。');
		}).fail(function() {
			ok(false, 'テスト失敗。親コントローラのpreinitPromiseのfailハンドラが呼ばれた。');
		});
		testController.initPromise.done(function() {
			ok(false, 'テスト失敗。親コントローラのinitPromiseのdoneハンドラが呼ばれた。');
		}).fail(function(result) {
			equal(result.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX);
			ok(true, '親コントローラのinitPromiseのfailハンドラが呼ばれる。');
		});
		testController.readyPromise.done(function() {
			ok(false, 'テスト失敗。親コントローラのreadyPromiseのdoneハンドラが呼ばれた。');
		}).fail(function(result) {
			equal(result.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX);
			ok(true, '親コントローラのreadyPromiseのfailハンドラが呼ばれる。');
		});
	});

	asyncTest('テンプレートのロードが通信エラーで失敗した場合、3回リトライして、3回目で成功したらコントローラ化が行われること', 5, function() {
		// view.load()をスタブに差し替え
		var retryCount = 0;
		var retryLimit = 3;
		var load = function() {
			var dfd = h5.async.deferred();
			var e = {
				detail: {
					error: {
						status: h5.env.ua.isIE ? 0 : 12029
					}
				}
			};
			if (retryCount++ == retryLimit) {
				dfd.resolve();
			} else {
				dfd.reject(e);
			}
			return dfd.promise();
		};
		var originalCreateView = h5.core.view.createView;
		h5.core.view.createView = function() {
			var view = originalCreateView();
			view.load = load;
			return view;
		};
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath'],
			__construct: function(context) {
				deepEqual(++count, 1, '__constructが実行される。');
			},
			__init: function(context) {
				deepEqual(++count, 2, '__initが実行される。');
			},
			__ready: function(context) {
				deepEqual(++count, 4, '__readyが実行される。');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.initPromise.done(function(a) {
			deepEqual(++count, 3, 'initPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(false, 'テスト失敗。initPromiseがreject()された');
		});
		testController.readyPromise.done(function(a) {
			deepEqual(++count, 5, 'readyPromiseがresolve()された');
			h5.core.view.createView = originalCreateView;
			start();
		});
	});


	asyncTest(
			'テンプレートのロードが通信エラーで失敗した場合、3回リトライして失敗ならpreinitPromiseのfailが呼ばれること',
			11,
			function() {
				// view.load()をスタブに差し替え
				var retryCount = 0;
				var retryLimit = 3;
				var load = function() {
					var dfd = $.Deferred();
					var e = {
						detail: {
							error: {
								status: h5.env.ua.isIE ? 0 : 12029
							}
						}
					};
					if (retryCount++ == retryLimit + 1) {
						dfd.resolve();
					} else {
						dfd.reject(e);
					}
					return dfd.promise();
				};
				var originalCreateView = h5.core.view.createView;
				h5.core.view.createView = function() {
					var view = originalCreateView();
					view.load = load;
					return view;
				};
				var count = 0;
				var controller = {
					__name: 'TestController',
					__templates: ['./noExistPath'],
					__construct: function(context) {
						deepEqual(++count, 1, 'コンストラクタが実行される。');
					},
					__init: function(context) {
						ok(false, 'テスト失敗。__initが実行された');
					},
					__ready: function(context) {
						ok(false, 'テスト失敗。__readyが実行された');
					},
					__dispose: function(context) {
						deepEqual(++count, 6, '__disposeが実行される。');
					},
					__unbind: function(context) {
						deepEqual(++count, 5, '__unbindが実行される。');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);

				var errorObj = null;
				testController.preinitPromise.done(function() {
					// createViewを元に戻す
					h5.core.view.createView = originalCreateView;
					ok(false, 'テスト失敗。preinitPromiseがresolve()された');
					h5.core.view.createView = originalCreateView;
					start();
				}).fail(
						function(e) {
							// createViewを元に戻す
							h5.core.view.createView = originalCreateView;
							errorObj = e;
							deepEqual(++count, 2, 'preinitPromiseのfailハンドラが実行される。');
							strictEqual(e.controllerDefObject, controller,
									'エラーオブジェクトからコントローラオブジェクトが取得できること');
						});
				testController.initPromise
						.done(function(a) {
							ok(false, 'テスト失敗。initPromiseがresolve()された');
							start();
						})
						.fail(
								function(e) {
									deepEqual(++count, 3, 'initPromiseがreject()された');
									strictEqual(e.controllerDefObject, controller,
											'エラーオブジェクトからコントローラオブジェクトが取得できること');
									strictEqual(e, errorObj,
											'preinitPromiseのfailで取得したエラーオブジェクトとinitPromiseのfailで取得したエラーオブジェクトが同じであること');
								});
				testController.readyPromise
						.done(function() {
							ok(false, 'テスト失敗。 readyPromiseがresolve()された');
							start();
						})
						.fail(
								function(e) {
									strictEqual(++count, 4, 'readyPromiseがreject()された');
									strictEqual(e.controllerDefObject, controller,
											'エラーオブジェクトからコントローラオブジェクトが取得できること');
									strictEqual(e, errorObj,
											'preinitPromiseのfailで取得したエラーオブジェクトとreadyPromiseのfailで取得したエラーオブジェクトが同じであること');
									start();
								});
			});

	asyncTest('テンプレートがコンパイルできない時のコントローラの動作', 7, function() {
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./template/test13.ejs?'],
			__construct: function(context) {
				deepEqual(++count, 1, '1. コンストラクタが実行される。');
			},
			__init: function(context) {
				ok(false, 'テスト失敗。__initが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。__readyが実行された');
			},
			__dispose: function(context) {
				deepEqual(++count, 6, '__disposeが実行される。');
				start();
			},
			__unbind: function(context) {
				deepEqual(++count, 5, '__unbindが実行される。');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preinitPromise.done(function() {
			ok(false, 'テスト失敗。preinitPromiseがresolve()された');
		}).fail(function(e) {
			deepEqual(++count, 2, 'preinitPromiseのfailハンドラが実行される。');
			strictEqual(e.controllerDefObject, controller, 'エラーオブジェクトからコントローラオブジェクトが取得できる');
		});
		testController.initPromise.done(function(a) {
			ok(false, 'テスト失敗。initPromiseがresolve()された');
		}).fail(function(e, opt) {
			deepEqual(++count, 3, 'initPromiseがreject()された');
		});
		testController.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
			start();
		}).fail(function(e, opt) {
			deepEqual(++count, 4, 'readyPromiseがreject()された');
			start();
		});
	});

	test('h5.core.viewがない時のコントローラの動作 テンプレートがあるときはエラー', 1, function() {
		var errorCode = ERR.ERR_CODE_NOT_VIEW;
		var view = h5.core.view;
		h5.core.view = null;
		var controller = {
			__name: 'TestController',
			__templates: ['./template/test2.ejs']
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが起きていません');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
		}
		h5.core.view = view;
	});

	asyncTest('コントローラのdispose (同期処理) - __dispose()の実行順序をテスト', function() {
		var ret = [];
		var childController = {
			__name: 'ChildController',

			__dispose: function() {
				ret.push(0);
			}
		};
		var controller = {
			__name: 'TestController',

			childController: childController,

			__dispose: function() {
				ret.push(1);
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var cc = testController.childController;
			var dp = testController.dispose();

			dp.done(function() {
				strictEqual(ret.join(';'), '0;1', '__disposeイベントは実行されたか');
				ok(isDisposed(testController), 'ルートコントローラのリソースはすべて削除されたか');
				ok(isDisposed(cc), '子コントローラのリソースはすべて削除されたか');
				start();
			});
		});
	});

	asyncTest('コントローラのdispose (非同期処理) - __dispose()で、resolveされるpromiseを返す。', 3, function() {
		var childDfd = h5.async.deferred();
		var rootDfd = h5.async.deferred();
		var childController = {
			__name: 'ChildController',

			__dispose: function() {
				setTimeout(function() {
					childDfd.resolve();
				}, 400);
				return childDfd.promise();
			}
		};
		var controller = {
			__name: 'TestController',

			childController: childController,

			__dispose: function() {
				setTimeout(function() {
					rootDfd.resolve();
				}, 100);
				return rootDfd.promise();
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var cc = testController.childController;
			var dp = testController.dispose();

			dp.done(function() {
				ok(isResolved(rootDfd) && isResolved(childDfd),
						'全てのコントローラの__dispose()が返すPromiseがresolveまたはrejectされてからコントローラを破棄する');
				ok(isDisposed(testController), 'ルートコントローラのリソースはすべて削除されたか');
				ok(isDisposed(cc), '子コントローラのリソースはすべて削除されたか');
				start();
			});
		});
	});

	asyncTest('コントローラのdispose (非同期処理) - __dispose()で rejectされるpromiseを返す。', 3, function() {
		var childDfd = h5.async.deferred();
		var rootDfd = h5.async.deferred();

		var childController = {
			__name: 'ChildController',

			__dispose: function() {
				var that = this;
				setTimeout(function() {
					child = that.__name === 'ChildController';
					childDfd.resolve();
				}, 800);
				return childDfd.promise();
			}
		};
		var controller = {
			__name: 'TestController',

			childController: childController,

			__dispose: function() {
				var that = this;
				setTimeout(function() {
					root = that.__name === 'TestController';
					rootDfd.reject();
				}, 100);
				return rootDfd.promise();
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var cc = testController.childController;
			var dp = testController.dispose();

			dp.done(function() {
				ok(isRejected(rootDfd) && isResolved(childDfd),
						'全てのコントローラの__dispose()が返すPromiseがresolveまたはrejectされてからコントローラを破棄する');
				ok(isDisposed(testController), 'ルートコントローラのリソースはすべて削除されたか');
				ok(isDisposed(cc), '子コントローラのリソースはすべて削除されたか');
				start();
			});
		});
	});

	asyncTest(
			'コントローラのdispose __constructでthis.disposeを呼ぶと__init,__readyは実行されず、initPromise,readyPromiseのfailハンドラが実行される',
			7, function() {
				var flag = false;
				var controller = {
					__name: 'TestController',
					__construct: function() {

						this.preinitPromise.done(function() {
							ok(true, 'preinitPromiseのdoneハンドラが実行された');
						}).fail(function() {
							ok(false, 'テスト失敗。preinitPromiseのfailハンドラが実行された');
						});
						this.initPromise.done(function() {
							ok(false, 'テスト失敗。initPromiseのdoneハンドラが実行された');
						}).fail(function() {
							ok(true, 'initPromiseのfailハンドラが実行された');
						});
						this.readyPromise.done(function() {
							ok(false, 'テスト失敗。readyPromiseのdoneハンドラが実行された');
						}).fail(function() {
							ok(true, 'readyPromiseのfailハンドラが実行された');
						});

						// disposeを2回呼んでも、__disposeが1度だけ呼ばれることを確認する
						this.dispose();
						this.dispose();
						ok(true, 'コンストラクタは実行されること');
					},
					__init: function() {
						ok(false, 'テスト失敗。__initが実行された');
					},
					__ready: function() {
						ok(false, 'テスト失敗。__readyが実行された');
						start();
					},
					__dispose: function() {
						ok(!flag, '__disposeが1度だけ実行されること');
						flag = true;
						setTimeout(function() {
							start();
						}, 0);
					},
					__unbind: function() {
						ok(true, '__unbindが実行されること');
					}
				};

				ok(h5.core.controller('#controllerTest', controller) === null,
						'h5.core.controller()がnullを返すこと');
			});

	asyncTest(
			'コントローラのdispose preinitProimseのdoneハンドラでthis.disposeを呼ぶと__init,__readyは実行されず、initPromise,readyPromiseのfailハンドラが実行されること',
			8, function() {
				var flag = false;
				var errorObj = {};
				var controller = {

					__name: 'TestController',
					__construct: function() {
						ok(true, 'コンストラクタは実行されること');
					},
					__init: function() {
						ok(false, 'テスト失敗。__initが実行された');
					},
					__ready: function() {
						ok(false, 'テスト失敗。__readyが実行された');
						setTimeout(function() {
							start();
						}, 0);
					},
					__dispose: function() {
						ok(!flag, '__disposeが1度だけ実行されること');
						flag = true;
						setTimeout(function() {
							start();
						}, 0);
					},
					__unbind: function() {
						ok(true, '__unbindが実行されること');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);
				testController.initPromise.done(function() {
					ok(false, 'テスト失敗。initPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'initPromiseのfailハンドラが実行されること');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
				testController.readyPromise.done(function() {
					ok(false, 'テスト失敗。initPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'initPromiseのfailハンドラが実行されること');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
				testController.preinitPromise.done(function() {
					ok(true, 'preinitPromiseのdoneハンドラが実行されること');
					// disposeを2回呼んでも、__disposeが1度だけ呼ばれることを確認する
					var dispose = testController.dispose;
					testController.dispose(errorObj);
					testController.dispose(errorObj);
				});
			});

	asyncTest(
			'コントローラのdispose __initでthis.disposeを呼ぶと__readyは実行されず、initPromise,readyPromiseのfailハンドラが実行されること',
			9, function() {
				var errorObj = {};
				var flag = false;
				var controller = {

					__name: 'TestController',
					__construct: function() {
						ok(true, 'コンストラクタは実行されること');
					},
					__init: function() {
						// disposeを2回呼ぶ
						this.dispose(errorObj);
						this.dispose(errorObj);
						ok(true, '__initが実行されること');
					},
					__ready: function() {
						ok(false, 'テスト失敗。__readyが実行された');
						start();
					},
					__dispose: function() {
						ok(!flag, '__disposeが1度だけ実行されること');
						flag = true;
						setTimeout(function() {
							start();
						}, 0);
					},
					__unbind: function() {
						ok(true, '__unbindが実行されること');
					}
				};
				var testController = h5.core.controller('#controllerTest', controller);
				testController.preinitPromise.done(function() {
					ok(true, 'preinitPromiseのdoneハンドラが実行されること');
				});
				testController.initPromise.done(function() {
					ok(false, 'テスト失敗。initPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'initPromiseのfailハンドラが実行された');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
				testController.readyPromise.done(function() {
					ok(false, 'テスト失敗。initPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'initPromiseのfailハンドラが実行された');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
			});

	asyncTest(
			'コントローラのdispose initPromiseのdoneハンドラでdisposeを呼ぶと__readyは実行されず、readyPromiseのfailハンドラが実行されること',
			7, function() {
				var errorObj = {};
				var flag = false;
				var controller = {

					__name: 'TestController',
					__construct: function() {
						ok(true, 'コンストラクタは実行されること');
					},
					__init: function() {
						ok(true, '__initが実行されること');
					},
					__ready: function() {
						ok(false, 'テスト失敗。__readyが実行された');
						start();
					},
					__dispose: function() {
						ok(!flag, '__disposeが1度だけ実行されること');
						flag = true;
						setTimeout(function() {
							start();
						}, 0);
					},
					__unbind: function() {
						ok(true, '__unbindが実行されること');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);

				testController.initPromise.done(function() {
					ok(true, 'initPromiseのdoneハンドラが実行されること');
					// dispose()を2回呼ぶ
					testController.dispose(errorObj);
					testController.dispose(errorObj);
				}).fail(function() {
					ok(true, 'テスト失敗。initPromiseのfailハンドラが実行された');
				});
				testController.readyPromise.done(function() {
					ok(false, 'テスト失敗。readyPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'readyPromiseのfailハンドラが実行された');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
			});

	asyncTest('コントローラのdispose __readyでthis.disposeを呼ぶとreadyPromiseのfailハンドラが実行されること', 7,
			function() {
				var errorObj = {};
				var flag = false;
				var controller = {

					__name: 'TestController',
					__construct: function() {
						ok(true, 'コンストラクタは実行されること');
					},
					__init: function() {
						ok(true, '__initが実行されること');
					},
					__ready: function() {
						// disposeを2回呼ぶ
						this.dispose(errorObj);
						this.dispose(errorObj);
						ok(true, '__readyが実行されること');
					},
					__dispose: function() {
						ok(!flag, '__disposeが1度だけ実行されること');
						flag = true;
						setTimeout(function() {
							start();
						}, 0);
					},
					__unbind: function() {
						ok(true, '__unbindが実行されること');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise.done(function() {
					ok(false, 'テスト失敗。redayPromiseのdoneハンドラが実行された');
				}).fail(function(e) {
					ok(true, 'readyPromiseのfailハンドラが実行された');
					strictEqual(e, errorObj, 'disposeに渡した引数が、failハンドラで受け取れること');
				});
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 テンプレートのロードに失敗した場合', 1, function() {
		var cfh = 0;
		h5.settings.commonFailHandler = function() {
			cfh++;
		};
		var controller = {
			__name: 'TestController',
			__templates: './noExistPath',
			childController: {
				__name: 'childController'
			},
			__dispose: function() {
				strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 子コントローラでテンプレートのロードに失敗した場合', 1,
			function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var controller = {
					__name: 'TestController',
					childController: {
						__name: 'childController',
						__templates: './noExistPath'
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __initでpromiseを返してrejectする場合 1', 1,
			function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var dfd = h5.async.deferred();
				var controller = {
					childController: {
						__name: 'childController'
					},
					__name: 'TestController',
					__init: function() {
						setTimeout(function() {
							dfd.reject();
						});
						return dfd.promise();
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __initでpromiseを返してrejectする場合 2', 2,
			function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var dfd = h5.async.deferred();
				var controller = {
					childController: {
						__name: 'childController'
					},
					__name: 'TestController',
					__init: function() {
						setTimeout(function() {
							dfd.reject();
						});
						var p = dfd.promise();
						p.fail(function() {
							ok(true, '__initが返すpromiseのfailハンドラが実行される');
						});
						return p;
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});


	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __readyでpromiseを返してrejectする場合 1', 1,
			function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var dfd = h5.async.deferred();
				var controller = {
					childController: {
						__name: 'childController'
					},
					__name: 'TestController',
					__ready: function() {
						setTimeout(function() {
							dfd.reject();
						});
						return dfd.promise();
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __readyでpromiseを返してrejectする場合 2', 2,
			function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var dfd = h5.async.deferred();
				var controller = {
					childController: {
						__name: 'childController'
					},
					__name: 'TestController',
					__ready: function() {
						setTimeout(function() {
							dfd.reject();
						});
						var p = dfd.promise();
						p.fail(function() {
							ok(true, '__readyが返すpromiseのfailハンドラが実行される');
						});
						return p;
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 ルートコントローラのreadyPromiseにfailハンドラを登録した場合',
			2, function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var controller = {
					__name: 'TestController',
					childController: {
						__name: 'childController',
						__templates: './noExistPath'
					},
					__dispose: function() {
						strictEqual(cfh, 0, 'commonFailHandlerが実行されていないこと');
						start();
					}
				};
				var c = h5.core.controller('#controllerTest', controller);
				c.readyPromise.fail(function() {
					ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
				});
			});

	asyncTest(
			'コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 ルートコントローラのreadyPromise以外にfailハンドラを登録した場合',
			6, function() {
				var cfh = 0;
				h5.settings.commonFailHandler = function() {
					cfh++;
				};
				var controller = {
					__name: 'TestController',
					childController: {
						__name: 'childController',
						__templates: './noExistPath'
					},
					__construct: function() {
						this.childController.preinitPromise.fail(function() {
							ok(true, '子コントローラのpreinitPromiseのfailが実行された');
						});
						this.childController.initPromise.fail(function() {
							ok(true, '子コントローラのinitPromiseのfailが実行された');
						});
						this.childController.readyPromise.fail(function() {
							ok(true, '子コントローラのreadyPromiseのfailが実行された');
						});
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				var c = h5.core.controller('#controllerTest', controller);
				c.preinitPromise.done(function() {
					ok(true, 'ルートコントローラのpreinitPromiseのdoneが実行される');
				}).fail(function() {
					ok(false, 'テスト失敗。ルートコントローラのpreinitPromiseのfailが実行された');
				});
				c.initPromise.fail(function() {
					ok(true, 'ルートコントローラのinitPromiseのfailが実行された');
				});
				c.readyPromise.done(function() {
					ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
				});
			});

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 __init, __readyで、resolveされる時の挙動', 14, function() {
		var dfdChild1Init = h5.async.deferred();
		var dfdChild1Ready = h5.async.deferred();
		var dfdChild2Init = h5.async.deferred();
		var dfdChild2Ready = h5.async.deferred();
		var dfdRootInit = h5.async.deferred();
		var dfdRootReady = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller',
				__init: function() {
					setTimeout(function() {
						dfdChild1Init.resolve();
					}, 0);
					return dfdChild1Init.promise();
				},
				__ready: function() {
					ok(true, '子コントローラ１の__readyが実行される');
					ok(isResolved(dfdRootInit), 'ルートコントローラの__initが返したpromiseがresolveされていること');
					setTimeout(function() {
						dfdChild1Ready.resolve();
					}, 0);
					return dfdChild1Ready.promise();
				}
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					setTimeout(function() {
						dfdChild2Init.resolve();
					}, 0);
					return dfdChild2Init.promise();
				},
				__ready: function() {
					ok(true, '子コントローラ２の__readyが実行される');
					ok(isResolved(dfdRootInit), 'ルートコントローラの__initが返したpromiseがresolveされていること');
					setTimeout(function() {
						dfdChild2Ready.resolve();
					}, 0);
					return dfdChild2Ready.promise();
				}
			},
			__init: function() {
				ok(true, 'ルートコントローラの__initが実行されること');
				ok(isResolved(dfdChild1Init), '子コントローラ１の__initが返したpromiseがresolveされていること');
				ok(isResolved(dfdChild2Init), '子コントローラ２の__initが返したpromiseがresolveされていること');
				setTimeout(function() {
					dfdRootInit.resolve();
				}, 0);
				return dfdRootInit.promise();
			},
			__ready: function() {
				ok(true, 'ルートコントローラの__readyが実行されること');
				ok(isResolved(dfdChild1Ready), '子コントローラ１の__readyが返したpromiseがresolveされていること');
				ok(isResolved(dfdChild2Ready), '子コントローラ２の__readyが返したpromiseがresolveされていること');
				setTimeout(function() {
					dfdRootReady.resolve();
				}, 0);
				return dfdRootReady.promise();
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.initPromise.done(function() {
			ok(true, 'ルートコントローラのinitPromiseのdoneハンドラが実行されること');
			ok(isResolved(dfdRootInit), 'ルートコントローラの__initが返したpromiseがresolveされていること');
		}).fail(function() {
			ok(false, 'テスト失敗。ルートコントローラのinitPromiseのfailが実行された');
		});
		c.readyPromise.done(function() {
			ok(true, 'ルートコントローラのreadyPromiseのdoneハンドラが実行されること');
			ok(isResolved(dfdRootReady), 'ルートコントローラの__initが返したpromiseがresolveされていること');
			start();
		}).fail(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのfailが実行された');
			start();
		});
	});

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 ルートの__initが返すpromiseがrejectされる時の挙動', 7, function() {
		var dfd = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller',
				__init: function() {
					ok(true, '子コントローラの__initは実行されること');
				},
				__ready: function() {
					ok(false, '子コントローラの__readyは実行されないこと');
				}
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					ok(true, '子コントローラの__initは実行されること');
				},
				__ready: function() {
					ok(false, '子コントローラの__readyは実行されない');
				}
			},
			__init: function() {
				ok(true, 'ルートコントローラの__initが実行されること');
				setTimeout(function() {
					dfd.reject();
				}, 0);
				return dfd.promise();
			},
			__ready: function() {
				ok(false, 'ルートコントローラの__readyは実行されないこと');
			},
			__dispose: function() {
				setTimeout(function() {
					ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
					start();
				}, 0);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.initPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのinitPromiseのdoneが実行された');
		}).fail(function() {
			ok(true, 'ルートコントローラのinitPromiseのfailハンドラが実行されること');
			ok(isRejected(dfd), 'ルートコントローラの__initが返したpromiseがrejectされていること');
		});
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
		});
	});

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 ルートの__readyが返すpromiseがrejectされる時の挙動', 6, function() {
		var dfd = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller',
				__ready: function() {
					ok(true, '子コントローラの__readyが実行されること');
				}
			},
			child2Controller: {
				__name: 'child2Controller',
				__ready: function() {
					ok(true, '子コントローラの__readyが実行されること');
				}
			},
			__ready: function() {
				ok(true, 'ルートコントローラの__initが実行されること');
				setTimeout(function() {
					dfd.reject();
				}, 0);
				return dfd.promise();
			},
			__dispose: function() {
				setTimeout(function() {
					ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
					start();
				}, 0);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			ok(isRejected(dfd), 'ルートコントローラの__readyが返したpromiseがrejectされていること');
		});
	});

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 子の__initが返すpromiseがrejectされる時の挙動', 4, function() {
		var dfd = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					ok(true, '子コントローラの__initが実行されること');
					setTimeout(function() {
						dfd.reject();
					}, 0);
					return dfd.promise();
				}
			},
			__init: function() {
				ok(false, 'テスト失敗。ルートの__initが実行された');
			},
			__dispose: function() {
				setTimeout(function() {
					ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
					start();
				}, 0);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.initPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのinitPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのinitPromiseのfailハンドラが実行されること');
			ok(isRejected(dfd), '子コントローラの__initが返したpromiseがrejectされていること');
		});
	});


	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 子の__readyが返すpromiseがrejectされる時の挙動', 4, function() {
		var dfd = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller',
				__ready: function() {
					ok(true, '子コントローラの__initが実行されること');
					setTimeout(function() {
						dfd.reject();
					}, 0);
					return dfd.promise();
				}
			},
			__ready: function() {
				ok(false, 'テスト失敗。ルートの__readyが実行された。');
			},
			__dispose: function() {
				setTimeout(function() {
					ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
					start();
				}, 0);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			ok(isRejected(dfd), '子コントローラの__readyが返したpromiseがrejectされていること');
		});
	});

	asyncTest('コントローラ内のthis(AOPなし)', 2, function() {

		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.test();
			},

			test: function() {
				window.controller = this;
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise
				.done(function() {

					$('#controllerTest input[type=button]').click();

					strictEqual(window.controller.__name, 'TestController',
							'コントローラ内のthisはコントローラ自身を指しているか');

					testController.unbind();
					window.controller = undefined;
					strictEqual(window.controller, undefined, '（名前空間のクリーンアップ）');
					start();
				});
	});

	asyncTest('コントローラ内のthis(AOPあり) ※min版ではエラーになります', 2, function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.test();
			},

			test: function() {
				window.controller = this;
			}
		};

		var aop1 = {
			interceptors: function(invocation) {
				var rootElement = this.rootElement;
				$(rootElement).append('<div id="aop1"></div>');
				invocation.proceed();
			}
		};

		var aop2 = {
			interceptors: function(invocation) {
				var rootElement = this.rootElement;
				$(rootElement).append('<div id="aop2"></div>');

				invocation.proceed();
			}
		};
		h5.core.__compileAspects([aop1, aop2]);

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise
				.done(function() {

					$('#controllerTest input[type=button]').click();

					strictEqual(window.controller.__name, 'TestController',
							'コントローラ内のthisはコントローラ自身を指しているか');

					testController.unbind();
					cleanAspects();
					window.controller = undefined;
					strictEqual(window.controller, undefined, '（名前空間のクリーンアップ）');
					start();
				});
	});

	asyncTest('アスペクトの動作1 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push(2);
			}
		};

		var aop1 = {
			interceptors: function(invocation) {
				ret.push(0);
				invocation.proceed();
			}
		};

		var aop2 = {
			interceptors: function(invocation) {
				ret.push(1);
				invocation.proceed();
			}
		};
		h5.core.__compileAspects([aop1, aop2]);

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			strictEqual(ret.join(';'), '0;1;2', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
		});

	});

	asyncTest('アスペクトの動作2 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push(2);
			}
		};

		var ic1 = function(invocation) {
			ret.push(0);
			invocation.proceed();
		};

		var ic2 = function(invocation) {
			ret.push(1);
			invocation.proceed();
		};
		h5.core.__compileAspects({
			interceptors: [ic1, ic2]
		});

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			strictEqual(ret.join(';'), '0;1;2', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
		});
	});

	asyncTest('アスペクトの動作3 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push(3);
			}
		};

		var ic1 = function(invocation) {
			ret.push(0);
			invocation.proceed();
		};

		var ic2 = function(invocation) {
			ret.push(1);
			invocation.proceed();
		};

		var ic3 = function(invocation) {
			ret.push(2);
			invocation.proceed();
		};
		var aspects = [{
			interceptors: [ic1, ic2]
		}, {
			interceptors: ic3
		}];
		h5.core.__compileAspects(aspects);

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			strictEqual(ret.join(';'), '0;1;2;3', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
		});
	});

	asyncTest('アスペクトの動作4 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
			// 何もしない
			}
		};

		var controller2 = {
			__name: 'com.htmlhifive.test2.controller.Test2Controller',

			__init: function() {
			// 何もしない
			}
		};

		var ic = function(invocation) {
			ret.push(this.__name);
			invocation.proceed();
		};
		h5.core.__compileAspects({
			target: 'com.htmlhifive.test.controller*',
			interceptors: ic,
			pointCut: null
		});

		var testController = h5.core.controller('#controllerTest', controller);
		var test2Controller = h5.core.controller('#controllerTest', controller2);
		h5.async.when(testController.readyPromise, test2Controller.readyPromise).done(
				function() {
					start();

					ok($.inArray(testController.__name, ret) !== -1,
							'aspectのtargetとpointCutにマッチするのでインターセプタは動作するはず。');
					ok($.inArray(test2Controller.__name, ret) === -1,
							'aspectのtargetにマッチしないのでインターセプタは動作しないはず。');

					testController.unbind();
					test2Controller.unbind();
					cleanAspects();
				});
	});

	asyncTest('アスペクトの動作5 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
			// 何もしない
			}
		};

		var controller2 = {
			__name: 'com.htmlhifive.test.controller.Test2Controller',

			__ready: function() {
			// 何もしない
			}
		};

		var ic = function(invocation) {
			ret.push(this.__name);
			invocation.proceed();
		};
		h5.core.__compileAspects({
			target: 'com.htmlhifive.test.controller*',
			interceptors: ic,
			pointCut: /^\_\_i.*$/
		});

		var testController = h5.core.controller('#controllerTest', controller);
		var test2Controller = h5.core.controller('#controllerTest', controller2);
		h5.async.when(testController.readyPromise, test2Controller.readyPromise).done(
				function() {
					start();

					ok($.inArray(testController.__name, ret) !== -1,
							'aspectのtargetとpointCutにマッチするのでインターセプタは動作するはず。');
					ok($.inArray(test2Controller.__name, ret) === -1,
							'aspectのtargetにはマッチするが、pointCutにマッチしないのでインターセプタは動作しないはず。');

					testController.unbind();
					test2Controller.unbind();
					cleanAspects();
				});
	});

	asyncTest('"{rootElement} eventName" でコントローラをバインドした要素自身にイベントハンドラが紐付いているか', function() {


		var isSame = false;

		var errorController = {
			__name: 'ErrorController',

			'{this} click': function(context) {
			// nothing to do
			}
		};

		var controller = {

			__name: 'TestController',

			'{rootElement} click': function(context) {
				var id = this.rootElement.id;
				isSame = id === 'controllerTest' && context.event.target.id === id;
			}
		};

		try {
			h5.core.controller('body', errorController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_EVENT_HANDLER_SELECTOR_THIS,
					'セレクタに{this}が指定された時にエラーが発生するか');
		}

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();
			$('#controllerTest').click();
			ok(isSame, '"{rootElement} eventName" でコントローラをバインドした要素自身にイベントハンドラが紐付いているか');
			testController.unbind();
		});
	});

	asyncTest('セレクタが {document}, {window} の場合にイベント名の記述に関わらず、bindが使用されているか', function() {

		var ret1 = null;
		var ret2 = null;
		var ret3 = null;
		var ret4 = null;
		var controller = {
			__name: 'TestController',

			'{document} click': function(context) {
				ret1 = 1;
			},

			'{document} [click]': function(context) {
				ret2 = 2;
			},

			'{window} mousedown': function(context) {
				ret3 = 3;
			},

			'{window} [mousedown]': function(context) {
				ret4 = 4;
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			$(document).click();
			$(window).click();

			strictEqual(ret1, 1, 'セレクタが{document}の場合、イベント名に"[]"がなくてもbindが使用されているか');
			strictEqual(ret2, 2, 'セレクタが{document}の場合、イベント名に"[]"がってもbindが使用されているか');
			strictEqual(ret1, 1, 'セレクタが{window}の場合、イベント名に"[]"がなくてもbindが使用されているか');
			strictEqual(ret2, 2, 'セレクタが{window}の場合、イベント名に"[]"がってもbindが使用されているか');

			testController.unbind();

			ret1 = null;
			ret2 = null;
			ret3 = null;
			ret4 = null;

			$(document).click();
			$(window).click();

			strictEqual(ret1, null,
					'セレクタが{document}でイベント名に"[]"がない場合、Controller.unbind()でアンバインドされているか');
			strictEqual(ret2, null,
					'セレクタが{document}でイベント名に"[]"がある場合、Controller.unbind()でアンバインドされているか');
			strictEqual(ret3, null,
					'セレクタが{window}でイベント名に"[]"がない場合、Controller.unbind()でアンバインドされているか');
			strictEqual(ret4, null,
					'セレクタが{window}でイベント名に"[]"がある場合、Controller.unbind()でアンバインドされているか');

			window.controller = undefined;
			strictEqual(window.controller, undefined, '（名前空間のクリーンアップ）');
		});
	});

	asyncTest('コントローラの__ready処理', function() {
		var ret = 0;
		var controller = {
			__name: 'TestController',

			__ready: function() {
				ret = 1000;
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			strictEqual(ret, 1000, '__readyは動作しているか');

			testController.unbind();
		});

	});

	asyncTest('テンプレートを使用できるか1', function() {
		var html = '';
		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			'input[type=button] click': function(context) {
				html = this.view.get('template2');
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();
			$('#controllerTest input[type=button]').click();
			ok(html.length > 0, 'this.view.getでテンプレートからHTML文字列を取得できたか');
			testController.unbind();
		});
	});

	asyncTest(
			'テンプレートを使用できるか2 view.append()に指定されたDOM要素が{window*},{document*}である時にエラーが発生すること',
			function() {
				var html = '';
				var updateView = 0;
				var append = '';
				var prepend = '';
				var viewError1 = null;
				var viewError2 = null;
				var viewError3 = null;
				var viewError4 = null;
				var controller = {
					__name: 'TestController',

					__templates: ['./template/test2.ejs', './template/test3.ejs',
							'./template/test8.ejs'],

					'input[type=button] click': function(context) {
						html = this.view.get('template2', {});
						this.view.update('#controllerResult', 'template3', {
							ar: 2
						});
						updateView = $('#controllerResult').find('table').length;

						$('#controllerResult').append(
								'<div id="appendViewTest"><span class="abc">abc</span></div>');
						$('#controllerResult').append(
								'<div id="appendViewTest2"><span class="abc">abc</span></div>');
						$('#controllerResult').append(
								'<div id="prependViewTest"><span class="abc">abc</span></div>');
						this.view.append('#appendViewTest', 'template8', {});
						this.view.append('{#appendViewTest2}', 'template8', {});
						this.view.prepend('#prependViewTest', 'template8', {});

						append = $(this.$find('#appendViewTest').children('span')[1]).text();
						append2 = $(this.$find('#appendViewTest2').children('span')[1]).text();
						prepend = $(this.$find('#prependViewTest').children('span')[0]).text();
						try {
							this.view.append('{window}', 'template8', {});
						} catch (e) {
							viewError1 = e;
						}
						try {
							this.view.update('{window.a}', 'template8', {});
						} catch (e) {
							viewError2 = e;
						}
						try {
							this.view.prepend('{navigator}', 'template8', {});
						} catch (e) {
							viewError3 = e;
						}
						try {
							this.view.append('{navigator.userAgent}', 'template8', {});
						} catch (e) {
							viewError4 = e;
						}

					}
				};
				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise
						.done(function() {
							$('#controllerTest input[type=button]').click();
							ok(html.length > 0, 'this.view.getでテンプレートからHTML文字列を取得できたか');
							ok(updateView, 'this.view.updateでテンプレートからHTML文字列を取得し、指定要素に出力できたか');
							strictEqual(append, 'test',
									'this.view.appendでテンプレートからHTML文字列を取得し、指定要素に出力できたか');
							strictEqual(append2, 'test',
									'this.view.appendでテンプレートからHTML文字列を取得し、グローバルセレクタで指定した要素に出力できたか');
							strictEqual(prepend, 'test',
									'this.view.prependでテンプレートからHTML文字列を取得し、指定要素に出力できたか');

							var errorCode = ERR.ERR_CODE_INVALID_TEMPLATE_SELECTOR;
							strictEqual(viewError1.code, errorCode,
									'this.update/append/prependで、"{window}"を指定するとエラーになるか');
							strictEqual(viewError2.code, errorCode,
									'this.update/append/prependで、"{window.xxx}"を指定するとエラーになるか');
							strictEqual(viewError3.code, errorCode,
									'this.update/append/prependで、"{navigator}"を指定するとエラーになるか');
							strictEqual(viewError4.code, errorCode,
									'this.update/append/prependで、"{navigator.xxx}"を指定するとエラーになるか');

							testController.unbind();
							start();
						});
			});

	asyncTest('view操作', function() {
		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			'{rootElement} click': function(context) {
				this.view.register('templateId1', '111');
				deepEqual(this.view.get('templateId1'), '111',
						'this.view.register(id, template)でテンプレートを登録できること');
				deepEqual(this.view.isValid('[%= data %]'), true,
						'this.view.isValid(template)でテンプレートがコンパイルできるかどうか判定できること');
				deepEqual(this.view.isValid('<div>[%= hoge fuga %]</div>'), false,
						'this.view.isValid(template)でテンプレートがコンパイルできるかどうか判定できること');
				deepEqual(this.view.isAvailable('templateId1'), true,
						'this.view.isAvailable(template)でテンプレートが利用可能かどうか判定できること');
				deepEqual(this.view.isAvailable('templateId2'), false,
						'this.view.isAvailable(template)でテンプレートが利用可能かどうか判定できること');
				this.view.clear();
				deepEqual(this.view.isAvailable('templateId1'), false,
						'this.view.clear()でテンプレートを削除できること');
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			start();
		});
	});


	asyncTest('テンプレートのカスケーディング1', function() {
		var html = html2 = '';
		var errorObj = {};
		var expectErrorObj = {
			code: 7005,
			message: "テンプレートID:template4 テンプレートがありません。(code=7005)"
		};

		var childController = {
			__name: 'ChildController',

			'input[type=button] click': function(context) {
				html = this.view.get('template2');
				html2 = this.view.get('template3');
				try {
					this.view.get('template4');
				} catch (e) {
					errorObj = e;
				}
			}
		};

		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			childController: childController
		};
		var testController = h5.core.controller('#controllerTest', controller);
		h5.core.view.register('template3', 'ok');
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			ok(html.length > 0, '指定されたテンプレートIDを自身のビューが扱っていない場合、親コントローラのビューへカスケードされること');
			ok(html2.length > 0, '指定されたテンプレートIDを自身のビューも親も扱っていない場合、h5.core.viewまでカスケードされること');
			strictEqual(errorObj.code, ERR_VIEW.ERR_CODE_TEMPLATE_ID_UNAVAILABLE,
					'指定されたテンプレートIDを自身のビューも親もh5.core.viewも扱っていない場合はエラーが発生すること');
			testController.unbind();
			start();
		});
	});

	asyncTest('テンプレートのカスケーディング2', function() {
		var childController = {
			__name: 'ChildController',

			__ready: function() {
				var dfd = this.deferred();
				var rootElement = this.rootElement;
				setTimeout(function() {
					$(rootElement).append('<div id="template_cascade"></div>');
					dfd.resolve();
				}, 0);
				return dfd.promise();
			},

			'{input[type=button]} click': function(context) {
				this.view.update('#template_cascade', 'template2');
			}
		};

		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			childController: childController,

			__meta: {
				childController: {
					rootElement: '#controllerResult'
				}
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();
			$('#controllerTest input[type=button]').click();
			var html = $('#template_cascade').html();
			ok(html != null && html.length > 0, 'ビューがカスケードした場合でもターゲットは自身のrootElementからfindしているか');
			testController.unbind();
		});
	});

	asyncTest('コントローラの取得', function() {
		var array = [];
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function(promise, resolve, reject) {
				setTimeout(function() {
					array.push('eventCallback');
					resolve();
				}, 1000);
				return promise();
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			var idController = h5.core.controllerManager.getController('#controllerTest');
			var jqController = h5.core.controllerManager.getController($('#controllerTest'));
			var domController = h5.core.controllerManager.getController(document
					.getElementById('controllerTest'));
			// strictEqualを使うと何故かスタックオーバーフローが発生する.
			ok(idController === testController, 'セレクタでコントローラが取得できたか');
			ok(jqController === testController, 'jQueryオブジェクトでコントローラが取得できたか');
			ok(domController === testController, 'DOMでコントローラが取得できたか');

			testController.unbind();
		});
	});

	asyncTest(
			'h5.core.interceptor.logInterceptorの動作 ※min版ではエラーになります',
			function() {
				if (!h5.core.__compileAspects) {
					expect(1);
					ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
					start();
					return;
				}

				var log = {
					interceptors: h5.core.interceptor.logInterceptor
				};
				h5.core.__compileAspects([log]);

				var controller = {
					__name: 'TestController',

					'input[type=button] click': function(context) {
						this.test();
					},

					test: function() {
						$('#controllerResult').empty().text('ok');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise
						.done(function() {
							start();

							$('#controllerTest input[type=button]').click();

							var message = '[ INFO]{timestamp}: TestController "input[type=button] click"が開始されました。 \n';
							message += '    (中略) \n';
							message += '[ INFO]{timestamp}: TestController "input[type=button] click"が終了しました。 \n';
							message += 'というメッセージがデバッグコンソールに表示されていることを確認してください。';
							ok(true, message);

							testController.unbind();
							cleanAspects();
						});

			});

	asyncTest(
			'h5.core.interceptor.lapInterceptorの動作 ※min版ではエラーになります',
			function() {
				if (!h5.core.__compileAspects) {
					expect(1);
					ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
					start();
					return;
				}

				var lap = {
					interceptors: h5.core.interceptor.lapInterceptor
				};
				h5.core.__compileAspects([lap]);

				var controller = {
					__name: 'TestController',

					'input[type=button] click': function(context) {
						// this.test();
						var dfd = this.deferred();
						setTimeout(function() {
							dfd.resolve();
						}, 2000);
						return dfd.promise();
					},

					test: function() {
						$('#controllerResult').empty().text('ok');
					}
				};
				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise
						.done(function() {
							start();

							$('#controllerTest input[type=button]').click();

							var message = '[ INFO]{timestamp}: TestController "input[type=button] click": {time}ms';
							message += 'というメッセージがデバッグコンソールに表示されていることを確認してください。';
							ok(true, message);

							testController.unbind();
							cleanAspects();
						});
			});

	asyncTest('h5.core.interceptor.errorInterceptorの動作 ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}

		var errorInterceptor = {
			interceptors: h5.core.interceptor.errorInterceptor
		};
		h5.core.__compileAspects([errorInterceptor]);

		var errMsg = null;
		h5.settings.commonFailHandler = function(e) {
			errMsg = e.message;
		};

		var controller = {
			__name: 'TestController',

			__init: function() {
				throw new Error('error interceptor test');
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			strictEqual(errMsg, 'error interceptor test',
					'errorInterceptorによって例外がcatchされ、commonFailHandlerが呼ばれたか');

			testController.unbind();
			cleanAspects();
		});
	});

	asyncTest('this.deferred()は動作しているか', function() {

		var dfd = null;
		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				dfd = this.deferred();
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').click();

			ok(dfd, 'this.deferred();でDeferredオブジェクトが取得できたか');

			testController.unbind();
		});
	});


	asyncTest('this.$find()は動作しているか', function() {

		var element1 = null;
		var element2 = null;
		var controller = {

			__name: 'TestController',

			'input[type=button] click': function(context) {
				element1 = this.$find('#controllerResult').length;
				element2 = this.$find('#qunit-fixture').length;
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').click();

			ok(element1, 'this.$find();でコントローラ内の要素が取得できたか');
			ok(!element2, 'this.$find();でコントローラ外の要素が取得できなかったか');

			testController.unbind();
		});
	});

	asyncTest('this.logは動作しているか', function() {

		var category = null;
		var controller = {

			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.log.info("-------------- コントローラのログ出力 ここから --------------");
				this.log.error('Controller: ERRORレベルのログ');
				this.log.warn('Controller: WARNレベルのログ');
				this.log.info('Controller: INFOレベルのログ');
				this.log.debug('Controller: DEBUGレベルのログ');
				this.log.trace('Controller: TRACEレベルのログ');
				this.log.info("-------------- コントローラのログ出力 ここまで --------------");
				category = this.log.category;

			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();
			$('#controllerTest input[type=button]').click();

			ok(category === 'TestController', 'コントローラのロガーのカテゴリは正しいか');
			ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');

			testController.unbind();
		});
	});



	asyncTest('this.indicator() ルート要素にインジケータを表示',
			function() {
				var testController = null;
				var controllerBase = {
					__name: 'TestController',

					'input[type=button] click': function() {
						var indicator = this.indicator({
							message: 'BlockMessageTest'
						}).show();

						strictEqual($(indicator._target).find(
								'.h5-indicator.a.content > .indicator-message').text(),
								'BlockMessageTest');
						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
								'Indicator#show() インジケータが表示されること');

						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css(
								'display'), 'block', 'オーバーレイが表示されていること');

						setTimeout(function() {
							indicator.hide();

							setTimeout(function() {
								start();
								strictEqual($('.h5-indicator', indicator._target).length, 0,
										'Indicator#hide() インジケータが除去されていること');

								testController.unbind();
							}, 0);
						}, 0);
					}
				};

				testController = h5.core.controller('#controllerTest', controllerBase);
				testController.readyPromise.done(function() {
					$('#controllerTest input[type=button]').click();
				});
			});

	asyncTest('this.triggerIndicator() triggerIndicator()でスクリーンロックでインジケータを表示', 5,
			function() {
				var testController = null;
				var controllerBase = {
					__name: 'TestController',

					'input[type=button] click': function() {
						var indicator = this.triggerIndicator({
							message: 'BlockMessageTest',
							percent: 20,
							block: true
						}).show();

						strictEqual($(indicator._target).find(
								'.h5-indicator.a.content > .indicator-message').text(),
								'BlockMessageTest');
						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
								'Indicator#show() インジケータが表示されること');
						strictEqual($(indicator._target).find('.throbber-percent').text(), '20',
								'Indicator#show() 進捗率が表示されること');

						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css(
								'display'), 'block', 'オーバーレイが表示されていること');

						setTimeout(function() {
							indicator.hide();

							setTimeout(function() {
								strictEqual($('.h5-indicator', indicator._target).length, 0,
										'Indicator#hide() インジケータが除去されていること');

								testController.unbind();

								start();
							}, 0);
						}, 0);
					}
				};

				testController = h5.core.controller('#controllerTest', controllerBase);
				testController.readyPromise.done(function() {
					$('#controllerTest input[type=button]').click();
				});
			});

	asyncTest('this.triggerIndicator() triggerIndicator()で親要素が定義したインジケータを表示', function() {
		$('#controllerTest').append('<div id="childDiv"></div>');
		var indicator = null;
		var testController = {
			__name: 'TestController',
			'{rootElement} triggerIndicator': function(context) {
				context.event.stopPropagation();
				indicator = this.indicator({
					target: this.rootElement,
					percent: 30,
					message: 'indicator testController'
				}).show();
			}
		};
		var childController = {
			__name: 'TestController',

			'{rootElement} click': function() {
				this.triggerIndicator();

				strictEqual($(indicator._target).find(
						'.h5-indicator.a.content > .indicator-message').text(),
						'indicator testController');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');
				strictEqual($(indicator._target).find('.throbber-percent').text(), '30',
						'Indicator#show() インジケータが表示されること');

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');

				setTimeout(function() {
					indicator.hide();

					setTimeout(function() {
						strictEqual($('.h5-indicator', indicator._target).length, 0,
								'Indicator#hide() インジケータが除去されていること');
						start();
					}, 0);
				}, 0);
			}
		};

		testController = h5.core.controller('#controllerTest', testController);

		testController = h5.core.controller('#childDiv', childController);
		testController.readyPromise.done(function() {
			$('#childDiv').click();
		});
	});

	asyncTest('this.indicator() オプションにプレーンオブジェクト以外を渡した時は無視されること', 4, function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				function NoPlain() {
					this.message = 'Test';
				}
				var indicator = this.indicator(new NoPlain()).show();

				deepEqual($(indicator._target).find('.h5-indicator.a.content > .indicator-message')
						.text(), '', 'オプションは無視されて、メッセージは表示されていないこと。');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');

				setTimeout(function() {
					indicator.hide();

					setTimeout(function() {
						start();
						strictEqual($('.h5-indicator', indicator._target).length, 0,
								'Indicator#hide() インジケータが除去されていること');

						testController.unbind();
					}, 0);
				}, 0);
			}
		};

		testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});

	asyncTest('this.indicator() 親要素と子要素でインジケータを表示する', function() {
		var controllerBase = {
			__name: 'TestController',
			'input[type=button] click': function() {
				var that = this;
				var indicator2 = this.indicator({
					target: '#controllerResult',
					message: 'BlockMessageTest-child'
				});
				indicator2.show();

				strictEqual($(indicator2._target).find('.indicator-message').text(),
						'BlockMessageTest-child');
				strictEqual($(indicator2._target).find('.h5-indicator.a.overlay').length, 1);

				var indicator = this.indicator({
					target: $(this.rootElement).parent(),
					message: 'BlockMessageTest-parent'
				});
				indicator.show();

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 2,
						'親コントローラでインジケータを表示しても、子コントローラのインジケータは除去されないこと。');

				setTimeout(function() {
					indicator.hide();

					setTimeout(function() {
						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
								'Indicator#hide() インジケータが除去されていること');

						that.deferredFunc();
					}, 0);
				}, 0);
			},

			deferredFunc: function() {
				var df = this.deferred();
				var indicator = this.indicator({
					target: document,
					promises: df.promise()
				}).show();

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 2,
						'promiseオブジェクトを渡して、インジケータが表示されること');

				setTimeout(function() {
					df.resolve();

					setTimeout(function() {
						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
								'resolve()が呼ばれると、インジケータが非表示になること');
						start();
					}, 0);
				}, 0);

				return df.promise();
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();

			testController.unbind();
		});
	});

	asyncTest('this.indicator() 存在しないターゲットを指定したときはインジケータが表示されないこと', function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				var indicator = this.indicator({
					message: 'BlockMessageTest',
					target: '#child'
				}).show();

				deepEqual($(indicator._target).find('.h5-indicator.a.content').length, 0,
						'インジケータが表示されていないこと');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 0,
						'Indicator#show() インジケータ(オーバーレイ)が表示されていないこと。');

				setTimeout(function() {
					indicator.hide();
					ok(true, 'Indicator#hide() hide()を呼んでもエラーにならないこと。');
					testController.unbind();
					start();
				}, 0);
			}
		};

		testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});

	asyncTest('this.indicator() Indicator#percent()で指定した進捗率に更新されること', 22, function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				var indicator = this.indicator({
					message: 'BlockMessageTest',
					percent: 10
				}).show();


				strictEqual($(indicator._target).find('.indicator-message').text(),
						'BlockMessageTest');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');
				strictEqual($(indicator._target).find('.throbber-percent').text(), '10',
						'Indicator#show() インジケータが表示されること');

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');
				indicator.percent(30);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '30',
						'Indicator#show() インジケータの進捗率表示が30に更新されていること');
				indicator.percent(100);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '100',
						'Indicator#show() インジケータの進捗率表示が100に更新されていること');
				indicator.percent(5);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '5',
						'Indicator#show() インジケータの進捗率表示が5に更新されていること');
				indicator.percent(-1);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '5',
						'Indicator#show() インジケータの進捗率に負の数を指定したときは値が変わらないこと。');
				indicator.percent(101);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '5',
						'Indicator#show() インジケータの進捗率に100より大きい数を指定したときは値が変わらないこと。');
				indicator.percent(33.3333333);
				strictEqual($(indicator._target).find('.throbber-percent').text(), '33.3333333',
						'Indicator#show() インジケータの進捗率に小数を指定できること');
				indicator.hide();
				var that = this;
				setTimeout(function() {
					strictEqual($('.h5-indicator', indicator._target).length, 0,
							'Indicator#hide() インジケータが除去されていること');

					var indicator2 = that.indicator({
						message: 'BlockMessageTestGrobal',
						percent: 10,
						target: document.body
					}).show();

					strictEqual($(indicator2._target).find('.indicator-message').text(),
							'BlockMessageTestGrobal');
					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay').length, 1,
							'Indicator#show() インジケータが表示されること');
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '10',
							'Indicator#show() インジケータの進捗率が表示されること');
					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay')
							.css('display'), 'block', 'オーバーレイが表示されていること');
					indicator2.percent(30);
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '30',
							'Indicator#show() インジケータの進捗率表示が30に更新されていること');
					indicator2.percent(100);
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '100',
							'Indicator#show() インジケータの進捗率表示が100に更新されていること');
					indicator2.percent(5);
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '5',
							'Indicator#show() インジケータの進捗率表示が5に更新されていること');
					indicator2.percent(-1);
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '5',
							'Indicator#show() インジケータの進捗率に負の数を指定したときは値が変わらないこと。');
					indicator2.percent(101);
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '5',
							'Indicator#show() インジケータの進捗率に100より大きい数を指定したときは値が変わらないこと。');
					indicator2.percent(33.3333333);
					strictEqual($(indicator2._target).find('.throbber-percent').text(),
							'33.3333333', 'Indicator#show() インジケータの進捗率に小数を指定できること');
					indicator2.hide();
					setTimeout(function() {
						strictEqual($('.h5-indicator', indicator2._target).length, 0,
								'Indicator#hide() インジケータが除去されていること');
						testController.readyPromise.done(function() {
							$('#controllerTest').click();
						});
						testControllerGrobal.unbind();
						start();
					}, 0);

					testController.unbind();
				}, 0);
			}
		};

		var controllerBaseGrobal = {
			__name: 'TestGrobalController',

			'input[type=button] test': function() {
			//
			}
		};

		testController = h5.core.controller('#controllerTest', controllerBase);
		testControllerGrobal = h5.core.controller(window, controllerBaseGrobal);
		testControllerGrobal.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});

	asyncTest('this.indicator() Indicator#message()で指定したメッセージに更新されること', 26, function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				var indicator = this.indicator({
					message: 'BlockMessageTest',
					percent: 10
				}).show();

				strictEqual($(indicator._target).find('.indicator-message').text(),
						'BlockMessageTest');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');
				strictEqual($(indicator._target).find('.throbber-percent').text(), '10',
						'Indicator#show() インジケータが表示されること');

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');

				indicator.message('changeMessage');
				strictEqual($(indicator._target).find('.indicator-message').text(),
						'changeMessage', 'メッセージがに変更されたこと。');
				indicator.message('  ');
				strictEqual($(indicator._target).find('.indicator-message').text(), '  ',
						'メッセージが変更されたこと。');
				indicator.message('');
				strictEqual($(indicator._target).find('.indicator-message').text(), '',
						'メッセージが変更されたこと。');
				indicator.message('abc');
				strictEqual($(indicator._target).find('.indicator-message').text(), 'abc',
						'メッセージが変更されたこと。');
				indicator.message();
				strictEqual($(indicator._target).find('.indicator-message').text(), 'abc',
						'文字列以外ではメッセージは変更されないこと');
				indicator.message(new String('def'));
				strictEqual($(indicator._target).find('.indicator-message').text(), 'abc',
						'文字列以外ではメッセージは変更されないこと');
				indicator.message(null);
				strictEqual($(indicator._target).find('.indicator-message').text(), 'abc',
						'文字列以外ではメッセージは変更されないこと');
				indicator.message(undefined);
				strictEqual($(indicator._target).find('.indicator-message').text(), 'abc',
						'文字列以外ではメッセージは変更されないこと');
				indicator.hide();
				var that = this;
				setTimeout(function() {
					strictEqual($('.h5-indicator', indicator._target).length, 0,
							'Indicator#hide() インジケータが除去されていること');

					var indicator2 = that.indicator({
						message: 'BlockMessageTestGrobal',
						percent: 10,
						target: document.body
					}).show();

					strictEqual($(indicator2._target).find('.indicator-message').text(),
							'BlockMessageTestGrobal');
					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay').length, 1,
							'Indicator#show() インジケータが表示されること');
					strictEqual($(indicator2._target).find('.throbber-percent').text(), '10',
							'Indicator#show() インジケータが表示されること');

					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay')
							.css('display'), 'block', 'オーバーレイが表示されていること');

					indicator2.message('changeMessage');
					strictEqual($(indicator2._target).find('.indicator-message').text(),
							'changeMessage', 'メッセージがに変更されたこと。');
					indicator2.message('  ');
					strictEqual($(indicator2._target).find('.indicator-message').text(), '  ',
							'メッセージが変更されたこと。');
					indicator2.message('');
					strictEqual($(indicator2._target).find('.indicator-message').text(), '',
							'メッセージが変更されたこと。');
					indicator2.message('abc');
					strictEqual($(indicator2._target).find('.indicator-message').text(), 'abc',
							'メッセージが変更されたこと。');
					indicator2.message();
					strictEqual($(indicator2._target).find('.indicator-message').text(), 'abc',
							'文字列以外ではメッセージは変更されないこと');
					indicator2.message(new String('def'));
					strictEqual($(indicator2._target).find('.indicator-message').text(), 'abc',
							'文字列以外ではメッセージは変更されないこと');
					indicator2.message(null);
					strictEqual($(indicator2._target).find('.indicator-message').text(), 'abc',
							'文字列以外ではメッセージは変更されないこと');
					indicator2.message(undefined);
					strictEqual($(indicator2._target).find('.indicator-message').text(), 'abc',
							'文字列以外ではメッセージは変更されないこと');
					indicator2.hide();
					setTimeout(function() {
						strictEqual($('.h5-indicator', indicator._target).length, 0,
								'Indicator#hide() インジケータが除去されていること');

						testController.unbind();
						start();
					}, 0);
				}, 0);
			}
		};

		testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});

	asyncTest('this.indicator() promises', function() {
		var dfd = h5.async.deferred();
		var indicator = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				this.deferredFunc();
			},

			deferredFunc: function() {
				var df = this.deferred();
				var df2 = this.deferred();
				indicator = this.indicator({
					target: document,
					promises: [df.promise(), df2.promise()]
				}).show();

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'promiseオブジェクトを渡して、インジケータが表示されること');

				setTimeout(function() {
					strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
							'resolve()していないので、インジケータが表示されること');

					df.resolve();
				}, 100);

				setTimeout(function() {
					strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
							'resolve()していないので、インジケータが表示されること');

					df2.resolve();
				}, 200);
				h5.async.when(df.promise(), df2.promise()).done(function() {
					setTimeout(function() {
						dfd.resolve();
					}, 0);
				});
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});

		dfd.promise().done(
				function() {
					strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 0,
							'全てのresolve()が呼ばれたら、インジケータが非表示になること');

					start();
					testController.unbind();
				});
	});

	asyncTest('this.indicator() 複数要素にマッチするセレクタをtargetに指定する', function() {
		var controllerBase = {
			__name: 'TestController',
			'input[type=button] click': function() {
				var indicator = this.indicator({
					target: '.hoge',
					message: 'テストテストテスト'
				}).show();

				setTimeout(
						function() {
							strictEqual($('#controllerTest > .hoge').children(
									'.h5-indicator.a.content').length, 2,
									'指定したセレクタで複数の要素にマッチした場合は両方にインジケータが表示されること');
							indicator.hide();

							setTimeout(function() {
								strictEqual($('#controllerTest > .hoge').children(
										'.h5-indicator.a.content').length, 0,
										'Indicator#hide() インジケータが除去されていること');
								start();
							}, 0);
						}, 0);
			}
		};

		$('#controllerTest').append('<li class="hoge"></li>').append('<li class="hoge"></li>');

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			testController.unbind();
		});
	});

	asyncTest('this.indicator() 同一要素に２つのインジケータを表示する', function() {
		var controllerBase = {
			__name: 'TestController',
			'input[type=button] click': function() {
				var indicator = this.indicator({
					target: this.rootElement,
					message: 'テストテストテスト1'
				}).show();

				this.indicator({
					target: this.rootElement,
					message: 'テストテストテスト2'
				}).show();

				setTimeout(function() {
					strictEqual($('#controllerTest').children('.h5-indicator.a.content').length, 1,
							'1つの要素に2つ以上のインジケータは表示されないこと');
					indicator.hide();

					setTimeout(function() {
						strictEqual($('#controllerTes').children('.h5-indicator.a.content').length,
								0, 'Indicator#hide() インジケータが除去されていること');
						start();
					}, 0);
				}, 0);
			}
		};

		$('#controllerTest').append('<li class="hoge"></li>').append('<li class="hoge"></li>');

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			testController.unbind();
		});
	});

	asyncTest('this.indicator() orientation/resizeイベントの発生につき1度だけハンドラが実行されているか', 1, function() {
		var controllerBase = {
			__name: 'TestController',
			'input[type=button] click': function() {

				var indicator = this.indicator({
					target: this.rootElement,
					message: 'テストテストテスト1'
				});

				var fired = false;

				indicator.show();

				// _handleResizeEvent()はresizeイベント中1度だけ呼ばれるメソッドなので、このメソッドをフックして呼ばれたことを確認する
				indicator._handleResizeEvent = function() {
					ok(true, '1回のresizeイベントのハンドラは1度だけ実行されること');
					fired = true;
					start();
				};


				$(window).trigger('resize');
				if (!fired) {
					$(window).trigger('orientationchange');
				}

				indicator.hide();
			}
		};

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			testController.unbind();
		});
	});

	asyncTest('h5.ui.indicator()',
			function() {
				var testController = null;
				var controllerBase = {
					__name: 'TestController',
					'input[type=button] click': function() {
						var indicator2 = h5.ui.indicator(document, {
							message: 'BlockMessageTest2',
							percent: 20
						});
						indicator2.show();

						strictEqual($(indicator2._target).find(
								'.h5-indicator.a.content > .indicator-message').text(),
								'BlockMessageTest2');
						strictEqual($(indicator2._target).find('.h5-indicator.overlay').length, 1,
								'Indicator#show() インジケータが表示されること');
						strictEqual($(indicator2._target).find('.throbber-percent').text(), '20',
								'Indicator#show() インジケータが表示されること');

						strictEqual($(indicator2._target).find('.h5-indicator.overlay').css(
								'display'), 'block', 'オーバーレイが表示されていること');

						setTimeout(function() {
							indicator2.hide();

							setTimeout(function() {
								strictEqual($('.h5-indicator', indicator2._target).length, 0,
										'Indicator#hide() インジケータが除去されていること');
								testController.unbind();
								start();
							}, 0);
						}, 0);
					}
				};

				testController = h5.core.controller('#controllerTest', controllerBase);
				testController.readyPromise.done(function() {
					$('#controllerTest input[type=button]').click();
				});
			});

	asyncTest('h5.ui.indicator() テーマを変更して実行',
			function() {

				var testController = null;
				var controllerBase = {
					__name: 'TestController',

					'input[type=button] click': function() {
						var indicator2 = h5.ui.indicator(document, {
							message: 'BlockMessageTest2',
							percent: 20,
							theme: 'b'
						});
						indicator2.show();

						strictEqual($(indicator2._target).find(
								'.h5-indicator.b.content > .indicator-message').text(),
								'BlockMessageTest2');
						var $percentElem = $(indicator2._target).find(
								'.h5-indicator.b.content .throbber-percent');
						strictEqual($percentElem.css('font-size'), '18px',
								'スロバー:変更したテーマのCSSがインジケータに適用されていること');
						strictEqual(rgbToHex($percentElem.css('color')), '#c20',
								'スロバー:変更したテーマのCSSがインジケータに適用されていること');

						var $messageElem = $(indicator2._target).find(
								'.h5-indicator.b.content .indicator-message');
						strictEqual($messageElem.css('font-size'), '20px',
								'メッセージ:変更したテーマのCSSがインジケータに適用されていること');
						strictEqual(rgbToHex($messageElem.css('color')), '#480',
								'メッセージ:変更したテーマのCSSがインジケータに適用されていること');

						var $indicatorB = $(indicator2._target).find('.h5-indicator.b');
						strictEqual(rgbToHex($indicatorB.css('background-color')), '#409',
								'インジケータ本体:変更したテーマのCSSがインジケータに適用されていること');

						setTimeout(function() {
							indicator2.hide();

							setTimeout(function() {
								strictEqual($('.h5-indicator').length, 0,
										'Indicator#hide() インジケータが除去されていること');
								testController.unbind();
								start();
							}, 0);
						}, 0);
					}
				};

				testController = h5.core.controller('#controllerTest', controllerBase);
				testController.readyPromise.done(function() {
					$('#controllerTest input[type=button]').click();
				});
			});

	test('プロパティの重複チェック', 1, function() {


		var testController = {
			/**
			 * コントローラ名
			 */
			__name: 'TestController',

			indicator: function() {
			// 何もしない
			}
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_SAME_PROPERTY,
					'コントローラ化によって追加されるプロパティと名前が重複するプロパティがある場合、エラーが出るか');
		}
	});

	asyncTest('this.own()の動作', function() {
		function Test(callback) {
			this.callback = callback;
		}

		Test.prototype.execute = function() {
			this.callback(100, 200);
		};

		var controller = {

			__name: 'TestController',

			__ready: function() {
				var test = new Test(this.own(this.callback));
				test.execute();
			},

			callback: function(arg1, arg2) {
				ok(this.__name === 'TestController', 'thisがコントローラになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			testController.unbind();
		});
	});

	asyncTest('this.ownWithOrg()の動作', function() {
		function Test(callback) {
			this.callback = callback;
		}

		Test.prototype.execute = function() {
			this.callback(100, 200);
		};

		var org = null;
		var controller = {

			__name: 'TestController',

			__ready: function() {
				org = new Test(this.ownWithOrg(this.callback));
				org.execute();
			},

			callback: function(originalThis, arg1, arg2) {
				ok(originalThis === org, '元々のthisは第1引数に追加されているか');
				ok(this.__name === 'TestController', 'thisがコントローラになっているか');
				strictEqual(arg1, 100, '引数は渡されているか1');
				strictEqual(arg2, 200, '引数は渡されているか2');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			testController.unbind();
		});
	});

	asyncTest(
			'triggerを使ったイベントの送出',
			function() {
				var init = function() {
					$('#controllerTest').remove();
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest1" style="display: none;"><input type="button" value="click" /></div>');
					$('#qunit-fixture').append(
							'<div id="controllerTest2" style="display: none;"></div>');
				};
				init();


				var triggerEvent = false;
				var message = '';
				var controllerBase1 = {
					__name: 'Test1Controller',

					'input[type=button] click': function() {
						this.trigger('triggerTest', {
							message: 'dispatchTest'
						});
					}
				};

				var controllerBase2 = {
					__name: 'Test2Controller',

					'{#controllerTest1} triggerTest': function(context) {
						triggerEvent = true;
						var option = context.evArg;
						message = option.message;
					}
				};
				var test1Controller = h5.core.controller('#controllerTest1', controllerBase1);
				var test2Controller = h5.core.controller('#controllerTest2', controllerBase2);
				h5.async.when(test1Controller.readyPromise, test2Controller.readyPromise).done(
						function() {
							start();

							$('#controllerTest1 input[type=button]').click();

							ok(triggerEvent, 'イベントの送出ができたか');
							strictEqual(message, 'dispatchTest', 'dispatchを使ってパラメータは渡せたか');

							test1Controller.unbind();
							test2Controller.unbind();
							$('#controllerTest1').remove();
							$('#controllerTest2').remove();
							ok(!$('#parent').length, '（DOMのクリーンアップ）');
						});
			});

	asyncTest(
			'context.selectorが取得できること',
			20,
			function() {
				$('#qunit-fixture')
						.append(
								'<div id="controllerTest3" style="display: none;"><input type="button" class="testclass" value="click" /><div id="test"><div id="innertest"  class="innerdiv"></div></div></div>');
				$('#qunit-fixture').append(
						'<div id="controllerTest4" style="display: none;"></div>');

				var controllerBase1 = {
					__name: 'Test1Controller',

					'input click': function(context) {
						var exSelector = 'input';
						strictEqual(context.SELECTOR_TYPE_LOCAL, 1, 'selectorTypeを表す定数が格納されていること 1');
						strictEqual(context.SELECTOR_TYPE_GLOBAL, 2,
								'selectorTypeを表す定数が格納されていること 2');
						strictEqual(context.SELECTOR_TYPE_OBJECT, 3,
								'selectorTypeを表す定数が格納されていること 3');
						strictEqual(context.selectorType, context.SELECTOR_TYPE_LOCAL,
								'selectorTypeが取得できること');
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
					},
					'{input[type=button]} click': function(context) {
						var exSelector = 'input[type=button]';
						strictEqual(context.selectorType, context.SELECTOR_TYPE_GLOBAL,
								'selectorTypeが取得できること');
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
					},
					'.testclass click1': function(context) {
						var exSelector = '.testclass';
						strictEqual(context.selectorType, context.SELECTOR_TYPE_LOCAL,
								'selectorTypeが取得できること');
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
					},
					'{rootElement} click2': function(context) {
						strictEqual(context.selectorType, context.SELECTOR_TYPE_OBJECT,
								'selectorTypeが取得できること');
						strictEqual(context.selector, this.rootElement, 'ルートエレメントが取得できること');
					},
					'  {  body } click3': function(context) {
						var exSelector = 'body';
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
						strictEqual(context.selectorType, context.SELECTOR_TYPE_GLOBAL,
								'selectorTypeが取得できること');
					},
					'#test #innertest.innerdiv   h5trackstart': function(context) {
						var exSelector = '#test #innertest.innerdiv';
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
						strictEqual(context.selectorType, context.SELECTOR_TYPE_LOCAL,
								'selectorTypeが取得できること');
					},
					'       #test    #innertest.innerdiv   h5trackend': function(context) {
						var exSelector = '#test    #innertest.innerdiv';
						strictEqual(context.selector, exSelector, 'セレクタが取得できること ' + exSelector);
						strictEqual(context.selectorType, context.SELECTOR_TYPE_LOCAL,
								'selectorTypeが取得できること');
					},
					'{document} mousewheel': function(context) {
						strictEqual(context.selector, document, 'documentオブジェクトが取得できること');
						strictEqual(context.selectorType, context.SELECTOR_TYPE_OBJECT,
								'selectorTypeが取得できること');
					}
				};
				var test1Controller = h5.core.controller('#controllerTest3', controllerBase1);
				test1Controller.readyPromise.done(function() {
					var ua = h5.env.ua;

					$('#controllerTest3 input[type=button]').click();
					$('#controllerTest3 .testclass').trigger('click1');
					$('#controllerTest3').trigger('click2');
					$('body').trigger('click3');

					var $innerDiv = $('#controllerTest3 .innerdiv');
					typeof document.ontouchstart === 'undefined' ? $innerDiv.mousedown()
							: $innerDiv.trigger('touchstart');
					typeof document.ontouchend === 'undefined' ? $innerDiv.mouseup() : $innerDiv
							.trigger('touchend');

					var eventName = ua.isFirefox ? 'DOMMouseScroll' : 'mousewheel';
					$(document).trigger(new $.Event(eventName), {
						test: true
					});

					test1Controller.unbind();
					$('#controllerTest3').remove();
					ok(!$('#parent').length, '（DOMのクリーンアップ）');
					start();
				});
			});

	asyncTest('コントローラ内のxxxControllerが動作しているか(テンプレート使用)', function() {


		var result = [];
		var root1 = null;
		var root2 = null;
		var root3 = null;

		var constructResult = [];
		var initResult = [];
		var readyResult = [];
		var delegate1Controller = {
			__name: 'Delegate1Controller',

			__templates: ['template/test9.ejs'],

			__construct: function() {
				constructResult.push(0);
			},

			__init: function() {
				initResult.push(0);
			},

			__ready: function() {
				readyResult.push(0);
			},

			testHandler: function() {
				root1 = this.rootElement;
			}
		};
		var delegate2Controller = {
			__name: 'Delegate2Controller',

			__construct: function() {
				constructResult.push(1);
			},

			__init: function() {
				initResult.push(1);
			},

			__ready: function() {
				readyResult.push(1);
			},

			delegate1Controller: delegate1Controller,

			testHandler: function() {
				this.delegate1Controller.testHandler();
				root2 = this.rootElement;
				result.push(0);
			}
		};

		var controllerBase = {
			__name: 'TestController',

			__construct: function() {
				constructResult.push(2);
			},

			__init: function() {
				initResult.push(2);
			},

			__ready: function() {
				readyResult.push(2);
			},

			delegate2Controller: delegate2Controller,

			'input[type=button] click': function(context) {
				root3 = this.rootElement;
				this.delegate2Controller.testHandler();
				result.push(1);
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);

		testController.readyPromise.done(function() {

			start();
			$('#controllerTest input[type=button]').click();

			strictEqual(result.join(';'), '0;1', 'xxxControllerが動作しているか');
			strictEqual(root3, root1, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか1');
			strictEqual(root3, root2, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか2');
			strictEqual(root2, root1, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか3');


			strictEqual(constructResult.join(';'), '0;1;2', '__constructイベントが適切に発火しているか');
			strictEqual(initResult.join(';'), '0;1;2', '__initイベントが適切に発火しているか');
			strictEqual(readyResult.join(';'), '0;1;2', '__readyイベントが適切に発火しているか');

			testController.unbind();
		});
	});

	asyncTest('__metaのuseHandlersオプションはデフォルトでtrueになっているか ※min版ではエラーになります', function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'h5.core.__compileAspectsが公開されていないため、h5.jsでは失敗します。');
			start();
			return;
		}


		var count = 0;

		var countAspects = {
			interceptors: function(invocation) {
				count += 1;
				invocation.proceed();
			}
		};

		var result = [];

		var grandChildController = {
			__name: 'GrandChildController',

			'input[type=button] test': function() {
				result.push('test');
			}
		};

		var import1Controller = {
			__name: 'Test1Controller',

			grandChildController: grandChildController,

			'input[type=button] mouseover': function() {
				result.push('mouseover');
			}
		};


		var import2Controller = {
			__name: 'Test2Controller',

			'input[type=button] click': function() {
				result.push('click');
			},

			'input[type=button] dblclick': function() {
				result.push('dblclick');
			}
		};

		var controllerBase = {
			__name: 'TestController',

			import1Controller: import1Controller,
			import2Controller: import2Controller,

			'input[type=button] customEvent': function() {
				result.push('customEvent');
			}
		};
		h5.core.__compileAspects([countAspects]);

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').mouseover();
			$('#controllerTest input[type=button]').click();
			$('#controllerTest input[type=button]').dblclick();
			$('#controllerTest input[type=button]').trigger('customEvent');
			$('#controllerTest input[type=button]').trigger('test');

			ok($.inArray('mouseover', result) !== -1, '__metaのuseHandlersは動作しているか1');
			ok($.inArray('click', result) !== -1, '__metaのuseHandlersは動作しているか2');
			ok($.inArray('dblclick', result) !== -1, '__metaのuseHandlersは動作しているか3');
			ok($.inArray('customEvent', result) !== -1, '__metaのuseHandlersは動作しているか4');
			ok($.inArray('test', result) !== -1, '__metaのuseHandlersは動作しているか5');
			ok(count === 5, 'useHandlersしたハンドラのアスペクトは動作しているか');

			testController.unbind();

			$('#controllerTest input[type=button]').mouseover();
			ok(count === result.length && count === 5, '__metaのuseHandlersのunbindは動作したか1');
			$('#controllerTest input[type=button]').click();
			ok(count === result.length && count === 5, '__metaのuserHandlerのunbindは動作したか2');
			$('#controllerTest input[type=button]').dblclick();
			ok(count === result.length && count === 5, '__metaのuserHandlerのunbindは動作したか3');
			$('#controllerTest input[type=button]').trigger('customEvent');
			ok(count === result.length && count === 5, '__metaのuserHandlerのunbindは動作したか4');
			$('#controllerTest input[type=button]').trigger('test');
			ok(count === result.length && count === 5, '__metaのuserHandlerのunbindは動作したか5');

			cleanAspects();
		});
	});

	asyncTest('__metaのuseHandlersオプションをfalseにすると子コントローラのイベントハンドラはバインドされないか', function() {


		var childRet = true;
		var importController = {
			__name: 'ImportController',

			'input[type=button] mouseover': function() {
				childRet = false;
			}
		};

		var rootRet = true;
		var controllerBase = {
			__name: 'TestController',

			importController: importController,

			__meta: {
				importController: {
					useHandlers: false
				}
			},

			'input[type=button] customEvent': function() {
				rootRet = false;
			}
		};

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			start();

			$('#controllerTest input[type=button]').mouseover();
			$('#controllerTest input[type=button]').trigger('customEvent');

			ok(childRet, '__metaのuseHandlersオプションは動作しているか');
			ok(!rootRet, '親コントローラのイベントハンドラは動作しているか');

			testController.unbind();
		});
	});

	asyncTest('unbindで[eventName]のハンドラが削除できるか', function() {
		var msg = '';
		var controller = {
			__name: 'TestController',

			'{document} [click]': function(context) {
				msg = 'bindclick';
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			$(document).click();
			ok(msg.length > 0, 'イベントハンドラが動作するか');

			msg = '';
			testController.unbind();
			$(document).click();
			ok(msg.length === 0, 'イベントハンドラが動作しないことを確認');
		});
	});

	asyncTest('unbindしたコントローラだけが管理下から外されること', 4, function() {
		var controllerManager = h5.core.controllerManager;
		controllerManager.controllers = [];
		var msg = '';
		var controller1 = {
			__name: 'TestController1',

			'{document} [click]': function(context) {
				msg = this.__name;
			}
		};
		var controller2 = {
			__name: 'TestController1',

			'{document} [click]': function(context) {
				msg = this.__name;
			}
		};
		var controller3 = {
			__name: 'TestController1',

			'{document} [click]': function(context) {
				msg = this.__name;
			}
		};
		var c1 = h5.core.controller('#controllerTest', controller1);
		var c2 = h5.core.controller('#controllerTest', controller2);
		var c3 = h5.core.controller('#controllerTest', controller3);

		h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromise).done(
				function() {
					deepEqual(controllerManager.controllers, [c1, c2, c3],
							'コントローラが3つ、controllerManager.controllersに登録されていること');

					// controller1 をunbind
					c1.unbind();
					deepEqual(controllerManager.controllers, [c2, c3],
							'unbindしたコントローラがcontrollerManager.controllersから無くなっていること');

					// controller3 をunbind
					c3.unbind();
					deepEqual(controllerManager.controllers, [c2],
							'unbindしたコントローラがcontrollerManager.controllersから無くなっていること');

					// controller2 をunbind
					c2.unbind();
					deepEqual(controllerManager.controllers, [],
							'unbindしたコントローラがcontrollerManager.controllersから無くなっていること');

					start();
				}).fail(function() {
			ok(false, 'テスト失敗。コントローラ化に失敗しました');
		});
	});

	asyncTest('__construct, __init, __readyが動作するタイミングは正しいか1(テンプレート使用)', function() {
		var ip1 = null;
		var ip2 = null;
		var ip3 = null;
		var rp1 = null;
		var rp2 = null;
		var rp3 = null;
		var ir = null;
		var rr = null;
		var array = [];
		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			__construct: function() {
				ip1 = this.initPromise;
				rp1 = this.readyPromise;
				array.push(0);
			},

			__init: function() {
				ir = this.rootElement;
				ip2 = this.initPromise;
				rp2 = this.readyPromise;
				array.push(1);
			},

			__ready: function() {
				rr = this.rootElement;
				ip3 = this.initPromise;
				rp3 = this.readyPromise;
				array.push(2);
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);

		var noip1 = null;
		var noip2 = null;
		var noip3 = null;
		var norp1 = null;
		var norp2 = null;
		var norp3 = null;
		var noir = null;
		var norr = null;
		var controller2 = {
			__name: 'NoTemplateController',

			__construct: function() {
				noip1 = this.initPromise;
				norp1 = this.readyPromise;
			},

			__init: function() {
				noir = this.rootElement;
				noip2 = this.initPromise;
				norp2 = this.readyPromise;
			},

			__ready: function() {
				norr = this.rootElement;
				noip3 = this.initPromise;
				norp3 = this.readyPromise;
			}
		};

		var noTemplateController = h5.core.controller('#controllerTest', controller2);

		h5.async.when(testController.readyPromise, noTemplateController.readyPromise).done(
				function() {
					strictEqual(array.join(';'), '0;1;2',
							'__construct, __init, __readyは適切なタイミングで発火しているか');
					ok(ip1, '__constructイベントの中でinitPromiseに触れるか');
					ok(rp1, '__constructイベントの中でreadyPromiseに触れるか');
					ok(ip2, '__initイベントの中でinitPromiseに触れるか');
					ok(rp2, '__initイベントの中でreadyPromiseに触れるか');
					ok(ip3, '__readyイベントの中でinitPromiseに触れるか');
					ok(rp3, '__readyイベントの中でreadyPromiseに触れるか');


					ok(noip1, 'テンプレートを使わない場合でも、__constructイベントの中でinitPromiseに触れるか');
					ok(norp1, 'テンプレートを使わない場合でも、__constructイベントの中でreadyPromiseに触れるか');
					ok(noip2, 'テンプレートを使わない場合でも、__initイベントの中でinitPromiseに触れるか');
					ok(norp2, 'テンプレートを使わない場合でも、__initイベントの中でreadyPromiseに触れるか');
					ok(noip3, 'テンプレートを使わない場合でも、__readyイベントの中でinitPromiseに触れるか');
					ok(norp3, 'テンプレートを使わない場合でも、__readyイベントの中でreadyPromiseに触れるか');

					var root = $('#controllerTest').get(0);
					strictEqual(ir, root, '__initイベントの中でrootElementに触れるか');
					strictEqual(rr, root, '__readyイベントの中でrootElementに触れるか');
					strictEqual(noir, root, 'テンプレートを使わない場合でも、__initイベントの中でrootElementに触れるか');
					strictEqual(norr, root, 'テンプレートを使わない場合でも、__readyイベントの中でrootElementに触れるか');

					start();

					testController.unbind();
					noTemplateController.unbind();
				});
	});

	asyncTest('__construct, __init, __readyが動作するタイミングは正しいか2(テンプレート使用)', function() {


		var ret = [];
		var cController = {
			__name: 'CController',

			__templates: ['./template/test2.ejs'],

			__construct: function() {
				ret.push(0);
			},

			__init: function(context) {
				ret.push(3);
			},

			__ready: function(context) {
				ret.push(6);
			}
		};

		var pController = {
			__name: 'PController',

			cController: cController,

			__construct: function() {
				ret.push(1);
			},

			__init: function(context) {
				ret.push(4);
			},

			__ready: function(context) {
				ret.push(7);
			}
		};

		var rController = {
			__name: 'RController',

			__templates: ['./template/test8.ejs'],

			pController: pController,

			__construct: function() {
				ret.push(2);
			},

			__init: function(context) {
				ret.push(5);
			},

			__ready: function(context) {
				ret.push(8);
			}
		};

		var c = h5.core.controller('#controllerTest', rController);

		c.readyPromise.done(function() {

			start();

			strictEqual(ret.join(';'), '0;1;2;3;4;5;6;7;8',
					'子、孫コントローラがある場合に、__construct, __init, __readyの発火順は正しいか');

			c.unbind();
		});
	});

	asyncTest(
			'__construct, __init, __readyが動作するタイミングは正しいか3(テンプレート使用)',
			function() {


				var ret = [];
				var cController = {
					__name: 'CController',

					__templates: ['./template/test2.ejs'],

					__construct: function() {
						ret.push(0);
					},

					__init: function(context) {
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(3);
							dfd.resolve();
						}, 200);
						return dfd.promise();
					},

					__ready: function(context) {
						ret.push(6);
					}
				};

				var pController = {
					__name: 'PController',

					cController: cController,

					__construct: function() {
						ret.push(1);
					},

					__init: function(context) {
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(4);
							dfd.resolve();
						}, 120);
						return dfd.promise();
					},

					__ready: function(context) {
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(7);
							dfd.resolve();
						}, 100);
						return dfd.promise();
					}
				};

				var rController = {
					__name: 'RController',

					__templates: ['./template/test8.ejs'],

					pController: pController,

					__construct: function() {
						ret.push(2);
					},

					__init: function(context) {
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(5);
							dfd.resolve();
						}, 70);
						return dfd.promise();
					},

					__ready: function(context) {
						ret.push(8);
					}
				};

				var c = h5.core.controller('#controllerTest', rController);

				c.readyPromise
						.done(function() {

							start();

							strictEqual(ret.join(';'), '0;1;2;3;4;5;6;7;8',
									'子、孫コントローラがあり、__init, __readyでPromiseオブジェクトを返している場合、__construct, __init, __readyの発火順は正しいか');

							c.unbind();
						});
			});

	asyncTest(
			'__construct, __init, __readyのそれぞれでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数は正しいか(テンプレートなし)',
			function() {
				var cRet = [];
				var cController = {
					__name: 'CController',

					__construct: function() {
						cRet.push(0);
					},

					__init: function(context) {
						cRet.push(1);
					},

					__ready: function(context) {
						cRet.push(2);
					}
				};

				var iRet = [];
				var iController = {
					__name: 'IController',

					__construct: function() {
						iRet.push(0);
					},

					__init: function(context) {
						iRet.push(1);
					},

					__ready: function(context) {
						iRet.push(2);
					}
				};

				var rRet = [];
				var rController = {
					__name: 'RController',

					__construct: function() {
						rRet.push(0);
					},

					__init: function(context) {
						rRet.push(1);
					},

					__ready: function(context) {
						rRet.push(2);
					}
				};

				var d1 = h5.async.deferred();
				var d2 = h5.async.deferred();
				var d3 = h5.async.deferred();

				var testController = {
					__name: 'TestController',
					cController: null,
					iController: null,
					rController: null,

					__construct: function() {
						this.cController = h5.core.controller('#controllerTest', cController);
						this.cController.readyPromise.done(function() {
							d1.resolve();
						});
					},

					__init: function(context) {
						this.iController = h5.core.controller('#controllerTest', iController);
						this.iController.readyPromise.done(function() {
							d2.resolve();
						});
					},

					__ready: function(context) {
						this.rController = h5.core.controller('#controllerTest', rController);
						this.rController.readyPromise.done(function() {
							d3.resolve();
						});
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, d1.promise(), d2.promise(), d3.promise()).done(
						function() {

							start();

							strictEqual(cRet.join(';'), '0;1;2',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(';'), '0;1;2',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(';'), '0;1;2',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');

							c.cController.unbind();
							c.iController.unbind();
							c.rController.unbind();
							c.unbind();
						});
			});

	asyncTest(
			'__construct, __init, __readyのそれぞれでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数は正しいか(テンプレートあり)',
			function() {



				var cdfd = h5.async.deferred();
				var cp = cdfd.promise();
				var cRet = [];
				var cController = {
					__name: 'CController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						cRet.push(0);
					},

					__init: function(context) {
						cRet.push(1);
					},

					__ready: function(context) {
						cRet.push(2);
						this.readyPromise.done(function() {
							cdfd.resolve();
						});
					}
				};

				var idfd = h5.async.deferred();
				var ip = idfd.promise();
				var iRet = [];
				var iController = {
					__name: 'IController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						iRet.push(0);
					},

					__init: function(context) {
						iRet.push(1);
					},

					__ready: function(context) {
						iRet.push(2);
						this.readyPromise.done(function() {
							idfd.resolve();
						});
					}
				};

				var rdfd = h5.async.deferred();
				var rp = rdfd.promise();
				var rRet = [];
				var rController = {
					__name: 'RController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						rRet.push(0);
					},

					__init: function(context) {
						rRet.push(1);
					},

					__ready: function(context) {
						rRet.push(2);
						this.readyPromise.done(function() {
							rdfd.resolve();
						});
					}
				};

				var testController = {
					__name: 'TestController',
					__templates: ['./template/test2.ejs'],
					cController: null,
					iController: null,
					rController: null,

					__construct: function() {
						this.cController = h5.core.controller('#controllerTest', cController);
					},

					__init: function(context) {
						this.iController = h5.core.controller('#controllerTest', iController);
					},

					__ready: function(context) {
						this.rController = h5.core.controller('#controllerTest', rController);
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, cp, ip, rp).done(
						function() {

							start();

							strictEqual(cRet.join(';'), '0;1;2',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(';'), '0;1;2',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(';'), '0;1;2',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');

							c.cController.unbind();
							c.iController.unbind();
							c.rController.unbind();
							c.unbind();
						});
			});

	asyncTest('__construct, __init, __readyで子コントローラに親コントローラのインスタンスを持たせた時に無限ループにならないか', function() {


		var c1Controller = {
			__name: 'C1Controller',

			pController: null
		};

		var p1Controller = {
			__name: 'P1Controller',

			c1Controller: c1Controller,

			__construct: function() {
				this.c1Controller.pController = this;
			}
		};

		var c2Controller = {
			__name: 'C2Controller',

			pController: null
		};

		var p2Controller = {
			__name: 'P2Controller',

			c2Controller: c2Controller,

			__init: function() {
				this.c2Controller.pController = this;
			}
		};

		var c3Controller = {
			__name: 'C3Controller',

			pController: null
		};

		var p3Controller = {
			__name: 'P3Controller',

			c3Controller: c3Controller,

			__ready: function() {
				this.c3Controller.pController = this;
			}
		};

		var d1 = h5.async.deferred();
		var d2 = h5.async.deferred();
		var d3 = h5.async.deferred();

		var p1 = h5.core.controller('#controllerTest', p1Controller);
		p1.readyPromise.done(function() {
			d1.resolve();
			ok(p1 === p1.c1Controller.pController, '__constructで無限ループが発生しないか');
			p1.unbind();
		});

		var p2 = h5.core.controller('#controllerTest', p2Controller);
		p2.readyPromise.done(function() {
			d2.resolve();
			ok(p2 === p2.c2Controller.pController, '__initで無限ループが発生しないか');
			p2.unbind();
		});

		var p3 = h5.core.controller('#controllerTest', p3Controller);
		p3.readyPromise.done(function() {
			d3.resolve();
			ok(p3 === p3.c3Controller.pController, '__constructで無限ループが発生しないか');
			p3.unbind();
		});

		h5.async.when(d1.promise(), d2.promise(), d3.promise()).done(function() {
			start();
		});
	});

	asyncTest('初期化パラメータを渡せるか', function() {


		var args = {
			param: 100
		};

		var cConstruct = null;
		var cInit = null;
		var cReady = null;
		var cController = {
			__name: 'CController',

			__construct: function(context) {
				cConstruct = context.args;
			},

			__init: function(context) {
				cInit = context.args;
			},

			__ready: function(context) {
				cReady = context.args;
			}
		};

		var pConstruct = null;
		var pInit = null;
		var pReady = null;
		var pController = {
			__name: 'PController',

			cController: cController,

			__construct: function(context) {
				pConstruct = context.args;
			},

			__init: function(context) {
				pInit = context.args;
			},

			__ready: function(context) {
				pReady = context.args;
			}
		};

		var rConstruct = null;
		var rInit = null;
		var rReady = null;
		var rController = {
			__name: 'RController',

			pController: pController,

			__construct: function(context) {
				rConstruct = context.args;
			},

			__init: function(context) {
				rInit = context.args;
			},

			__ready: function(context) {
				rReady = context.args;
			}
		};

		var rootController = h5.core.controller('#controllerTest', rController, args);
		rootController.readyPromise.done(function() {
			start();

			ok(args !== rConstruct, '__constructでルートコントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === rConstruct.param, '__constructでルートコントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== rInit, '__initでルートコントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === rInit.param, '__initでルートコントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== rReady, '__readyでルートコントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === rReady.param, '__readyでルートコントローラに渡された初期化パラメータのプロパティは正しいか');

			ok(args !== pConstruct, '__constructで子コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === pConstruct.param, '__constructで子コントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== pInit, '__initで子コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === pInit.param, '__initで子コントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== pReady, '__readyで子コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === pReady.param, '__readyで子コントローラに渡された初期化パラメータのプロパティは正しいか');


			ok(args !== cConstruct, '__constructで孫コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === cConstruct.param, '__constructで孫コントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== cInit, '__initで孫コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === cInit.param, '__initで孫コントローラに渡された初期化パラメータのプロパティは正しいか');
			ok(args !== cReady, '__readyで孫コントローラに渡された初期化パラメータの参照は変わっているか');
			ok(args.param === cReady.param, '__readyで孫コントローラに渡された初期化パラメータのプロパティは正しいか');

			rootController.unbind();
		});
	});

	asyncTest('rootController, parentControllerは正しくセットされているか', function() {


		var cir = null;
		var cip = null;
		var crr = null;
		var crp = null;
		var cController = {
			__name: 'CController',

			__construct: function() {
				strictEqual(this.rootController, null,
						'__constructで孫コントローラのrootControllerはnullであるか');
				strictEqual(this.parentController, null,
						'__constructで孫コントローラのparentControllerはnullであるか');
			},

			__init: function(context) {
				cir = this.rootController;
				cip = this.parentController;
			},

			__ready: function(context) {
				crr = this.rootController;
				crp = this.parentController;
			}
		};

		var pir = null;
		var pip = null;
		var prr = null;
		var prp = null;
		var pController = {
			__name: 'PController',

			cController: cController,

			__construct: function() {
				strictEqual(this.rootController, null,
						'__constructで子コントローラのrootControllerはnullであるか');
				strictEqual(this.parentController, null,
						'__constructで子コントローラのparentControllerはnullであるか');
			},

			__init: function(context) {
				pir = this.rootController;
				pip = this.parentController;
			},

			__ready: function(context) {
				prr = this.rootController;
				prp = this.parentController;
			}
		};

		var rir = null;
		var rip = null;
		var rrr = null;
		var rrp = null;
		var rController = {
			__name: 'RController',

			pController: pController,

			__construct: function() {
				strictEqual(this.rootController, null,
						'__constructでルートコントローラのrootControllerはnullであるか');
				strictEqual(this.parentController, null,
						'__constructでルートコントローラのparentControllerはnullであるか');
			},

			__init: function(context) {
				rir = this.rootController;
				rip = this.parentController;
			},

			__ready: function(context) {
				rrr = this.rootController;
				rrp = this.parentController;
			}
		};

		var rootController = h5.core.controller('#controllerTest', rController);
		rootController.readyPromise.done(function() {
			start();

			var parentController = rootController.pController;

			ok(cir === rootController, '__initで孫コントローラのrootControllerは正しいか');
			ok(cip === parentController, '__initで孫コントローラのparentControllerは正しいか');
			ok(pir === rootController, '__initで子コントローラのrootControllerは正しいか');
			ok(pip === rootController, '__initで子コントローラのparentControllerは正しいか');
			ok(rir === rootController, '__initでルートコントローラのrootControllerは自分自身を指しているか');
			ok(rip === null, '__initでルートコントローラのparentControllerはnullか');

			ok(crr === rootController, '__readyで孫コントローラのrootControllerは正しいか');
			ok(crp === parentController, '__readyで孫コントローラのparentControllerは正しいか');
			ok(prr === rootController, '__readyで子コントローラのrootControllerは正しいか');
			ok(prp === rootController, '__readyで子コントローラのparentControllerは正しいか');
			ok(rrr === rootController, '__readyでルートコントローラのrootControllerは自分自身を指しているか');
			ok(rrp === null, '__readyでルートコントローラのparentControllerはnullか');

			rootController.unbind();
		});
	});

	asyncTest('enableListeners() / disableListeners() の動作', function() {


		var ret = null;
		var cController = {
			__name: 'CController',

			'{rootElement} childCustomEvent': function(context) {
				ret = 100;
			}
		};

		var pController = {
			__name: 'PController',

			cController: cController,

			__meta: {
				cController: {
					useHandlers: true
				}
			},

			'{rootElement} parentCustomEvent': function(context) {
				ret = 200;
			}
		};

		var c = h5.core.controller('#controllerTest', pController);
		c.readyPromise.done(function() {
			start();

			var root = $('#controllerTest');

			root.trigger('childCustomEvent');
			ok(ret === 100, 'useHandlersがtrueである子コントローラのイベントハンドラが動作しているか');
			root.trigger('parentCustomEvent');
			ok(ret === 200, 'イベントハンドラが動作しているか');

			ret = null;
			c.disableListeners();
			root.trigger('childCustomEvent');
			ok(ret === null,
					'親のdisableListeners()によって、useHandlersがtrueである子コントローラのイベントハンドラが動作しなくなったか');
			root.trigger('parentCustomEvent');
			ok(ret === null, '親のdisableListeners()によって、イベントハンドラが動作しなくなったか');

			c.cController.enableListeners();
			root.trigger('childCustomEvent');
			ok(ret === 100,
					'子のenableListeners()によって、useHandlersがtrueである子コントローラのイベントハンドラが動作するようになったか');
			ret = null;
			root.trigger('parentCustomEvent');
			ok(ret === null, '子のenableListeners()によって、イベントハンドラが動作しないままになっているか');

			c.enableListeners();
			root.trigger('childCustomEvent');
			ok(ret === 100, '親のenableListeners()によって、useHandlersがtrueである子コントローラのイベントハンドラが動作しているか');
			root.trigger('parentCustomEvent');
			ok(ret === 200, '親のenableListeners()によって、イベントハンドラが動作するようになったか');

			c.unbind();
		});
	});

	asyncTest(
			'throwError() / throwCustomError() の動作',
			14,
			function() {
				var testController = {
					__name: 'TestController',

					__ready: function(context) {
						try {
							this.throwError();
						} catch (e) {
							equal(e.code, ERR.ERR_CODE_TOO_FEW_ARGUMENTS,
									'codeプロパティにエラーコードを保持していること。');
						}

						try {
							this.throwError('コントローラ"{0}"における{1}のテスト', this.__name, 'throwError');
						} catch (e) {
							strictEqual(e.message, 'コントローラ"TestController"におけるthrowErrorのテスト',
									'throwErrorメソッドの第1引数が文字列の場合、可変長引数を取ってフォーマットされるか');
						}
						try {
							this.throwError('エラーメッセージ!!');
						} catch (e) {
							strictEqual(e.message, 'エラーメッセージ!!',
									'指定したメッセージがmessageプロパティに設定されていること。');
							strictEqual(e.customType, null, 'customTypeにnullが設定されていること。');
						}

						var obj = {
							a: 1
						};
						try {
							this.throwError(obj, obj);
						} catch (e) {
							if (h5.env.ua.isiOS && h5.env.ua.osVersion == 4) {
								equal(e.message, 'Unknown error',
										'第二引数にオブジェクトが指定された場合、messageに"Unkonwn error"が設定されていること。');
							} else {
								equal(e.message, '',
										'第二引数にオブジェクトが指定された場合は、messageには何も値が設定されていないこと。');
							}
							deepEqual(e.detail, obj, 'detailプロパティに第一引数に指定したオブジェクトが設定されていること。');
						}
						try {
							this.throwCustomError();
						} catch (e) {
							strictEqual(e.message, '正しい数の引数を指定して下さい。(code=6005)',
									'throwCustomError()で必須のパラメータが指定されていない場合、エラーが発生すること。');
						}

						try {
							this.throwCustomError(null, 'エラーメッセージ!');
						} catch (e) {
							strictEqual(e.message, 'エラーメッセージ!', '指定したメッセージがmessageプロパティに設定されていること。');
							strictEqual(e.customType, null, 'customTypeにnullが設定されていること。');
						}

						var err2 = null;
						var err2Type = null;
						try {
							this.throwCustomError('customType', '');
						} catch (e) {
							err2 = e;
							err2Type = e.customType;

						}
						ok(err2, 'エラータイプのみ指定してthrowCustomErrorメソッドを実行すると、エラーが投げられているか');
						strictEqual(err2Type, 'customType',
								'エラーオブジェクトのcustomTypeプロパティに指定したエラータイプが格納されているか');

						try {
							this.throwCustomError('customType', 'コントローラ"{0}"における{1}のテスト',
									this.__name, 'throwCustomError');
						} catch (e) {
							strictEqual(e.message,
									'コントローラ"TestController"におけるthrowCustomErrorのテスト',
									'throwCustomErrorメソッドの第2引数が文字列の場合、可変長引数を取ってフォーマットされるか');
						}
						try {
							this.throwCustomError('customType', obj, obj);
						} catch (e) {
							if (h5.env.ua.isiOS && h5.env.ua.osVersion == 4) {
								equal(e.message, 'Unknown error',
										'第二引数にオブジェクトが指定された場合、messageに"Unkonwn error"が設定されていること。');
							} else {
								equal(e.message, '',
										'第二引数にオブジェクトが指定された場合は、messageには何も値が設定されていないこと。');
							}
							deepEqual(e.detail, obj, 'detailプロパティに第二引数に指定したオブジェクトが設定されていること。');
						}
					}
				};

				var c = h5.core.controller('#controllerTest', testController);
				c.readyPromise.done(function() {
					start();
					c.unbind();
				});

			});

	test('コントローラの循環参照チェックに引っかかるとエラーが発生するか', 1, function() {
		var test2Controller = {
			__name: 'Test2Controller'
		};

		var test1Controller = {
			__name: 'Test1Controller',

			test2Controller: test2Controller
		};
		test2Controller.test1Controller = test1Controller;

		try {
			h5.core.controller('#controllerTest', test1Controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_CIRCULAR_REF, 'エラーが発生したか');
		}
	});

	asyncTest('mousewheelイベントの動作', function() {
		var type = null;
		var testController = {
			__name: 'TestController',

			'{rootElement} mousewheel': function(context) {
				type = context.event.type;
			}
		};

		var eventName = h5.env.ua.isFirefox ? 'DOMMouseScroll' : 'mousewheel';
		var c = h5.core.controller('#controllerTest', testController);
		c.readyPromise.done(function() {
			var event = new $.Event(eventName);
			if (h5.env.ua.isFirefox) {
				event.originalEvent = {
					detail: 3
				};
			}
			$('#controllerTest').trigger(event);

			strictEqual(type, eventName,
					'mousewheelイベントがあればmousewheelイベントに、なければDOMMouseScrollイベントにバインドされているか');
			c.unbind();
			start();
		});
	});

	test('コントローラに渡す初期化パラメータがプレーンオブジェクトではない時の動作', 1, function() {
		var testController = {
			__name: 'TestController'
		};

		try {
			h5.core.controller('#controllerTest', testController, '初期化パラメータ');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_INVALID_INIT_PARAM,
					'初期化パラメータがプレーンオブジェクトではない時にエラーが発生したか');
		}
	});

	asyncTest('h5.core.controller()にコントローラ化済みのオブジェクトを渡した時の動作', 1, function() {
		var testController = {
			__name: 'TestController'
		};
		var c = h5.core.controller('#controllerTest', testController);

		c.readyPromise.done(function() {
			try {
				h5.core.controller('#controllerTest', c);
			} catch (e) {
				equal(e.code, ERR.ERR_CODE_CONTROLLER_ALREADY_CREATED,
						'コントローラ化済みのオブジェクトを渡すとエラーが発生したか');
			}

			c.unbind();
			start();
		});
	});

	test('あるセレクタに対して重複するイベントハンドラを設定した時の動作', 1, function() {
		var testController = {
			__name: 'TestController',
			' {rootElement}   click': function(context) {},
			'{rootElement} click': function(context) {}
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_SAME_EVENT_HANDLER, '重複するイベントハンドラを設定した時にエラーが発生したか');
		}
	});

	asyncTest('xxxControllerというプロパティの値が設定されていない時にエラーにならないか', function() {
		var testController = {
			__name: 'TestController',

			childController: null
		};

		var c = h5.core.controller('#controllerTest', testController);
		c.readyPromise.done(function() {
			start();

			ok(c, 'xxxControllerというプロパティの値が設定されていない時にエラーが発生せず処理が終了するか');
			c.unbind();
		});

	});

	test('__metaのチェック1', 1, function() {
		var testController = {
			__name: 'TestController',

			__meta: {
				childController: {
					useHandlers: true
				}
			}
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_META_KEY_INVALID,
					'__metaに設定された名前と一致するプロパティ名を持つ子コントローラがundefinedの場合にエラーが発生するか');
		}
	});

	test('__metaのチェック2', 1, function() {
		var testController = {
			__name: 'TestController',

			childController: null,

			__meta: {
				childController: {
					useHandlers: true
				}
			}
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_META_KEY_NULL,
					'__metaに設定された名前と一致するプロパティ名を持つ子コントローラがnullの場合にエラーが発生するか');
		}
	});

	test('__metaのチェック3', 1, function() {
		var testController = {
			__name: 'TestController',

			child: {},

			__meta: {
				child: {
					useHandlers: true
				}
			}
		};

		try {
			h5.core.controller('#controllerTest', testController);
		} catch (e) {
			equal(e.code, ERR.ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER,
					'__metaに設定された名前と一致するプロパティの値がコントローラではないときにエラーが発生するか');
		}
	});

	asyncTest(
			'h5trackイベント(mousedown, mousemove, mouseup) ※タブレット、スマートフォンでは失敗します',
			26,
			function() {
				if (document.ontouchstart !== undefined) {
					expect(1);
					ok(false, 'タブレット、スマートフォンでは失敗します');
					start();
					return;
				}
				var controller = {

					__name: 'TestController',

					'{rootElement} h5trackstart': function(context) {
						context.evArg
								&& ok(false,
										'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 10,
								'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 10,
								'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 10,
								'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 10,
								'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
					},

					'{rootElement} h5trackmove': function(context) {
						context.evArg
								&& ok(false,
										'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 15,
								'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 15,
								'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
						strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
						strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
					},

					'{rootElement} h5trackend': function(context) {
						context.evArg
								&& ok(false,
										'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 20,
								'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 20,
								'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 20,
								'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 20,
								'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise.done(function() {
					var setPos = function(ev, pos) {
						ev.pageX = pos;
						ev.pageY = pos;
						ev.screenX = pos;
						ev.screenY = pos;
						ev.clientX = pos;
						ev.clientY = pos;
						return ev;
					};

					var moveMouseEvent = setPos(new $.Event('mousemove'), 15);
					var startMouseEvent = setPos(new $.Event('mousedown'), 10);
					var endMouseEvent = setPos(new $.Event('mouseup'), 20);

					// ドラッグ中じゃないので実行されない
					$('#controllerResult').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#controllerResult').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$('#controllerResult').trigger(startMouseEvent);

					// ドラッグ中なので実行されない
					$('#controllerResult').trigger(startMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('#controllerResult').trigger(moveMouseEvent);

					// ドラッグ終了
					$('#controllerResult').trigger(endMouseEvent);

					// ドラッグ中じゃないので実行されない
					$('#controllerResult').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#controllerResult').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('#controllerResult').trigger(startMouseEvent);
					$('#controllerResult').trigger(moveMouseEvent);
					$('#controllerResult').trigger(endMouseEvent);

					start();
				});
			});

	asyncTest('h5trackイベント(touchstart, touchmove, touchend) ※PCブラウザでは失敗します。', 26, function() {
		if (document.ontouchstart === undefined) {
			expect(1);
			ok(false, 'PCブラウザでは失敗します');
			start();
			return;
		}

		var controller = {
			__name: 'TestController',
			'{rootElement} h5trackstart': function(context) {
				context.evArg
						&& ok(false, 'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、実行されないこと。');
				var event = context.event;
				strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
				strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
				strictEqual(event.screenX, 10, 'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
				strictEqual(event.screenY, 10, 'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
				strictEqual(event.clientX, 10, 'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
				strictEqual(event.clientY, 10, 'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
				ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
				ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
			},
			'{rootElement} h5trackmove': function(context) {
				context.evArg
						&& ok(false, 'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、実行されないこと。');
				var event = context.event;
				strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
				strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
				strictEqual(event.screenX, 15, 'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
				strictEqual(event.screenY, 15, 'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
				strictEqual(event.clientX, 15, 'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
				strictEqual(event.clientY, 15, 'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
				ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
				ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
				strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
				strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
			},
			'{rootElement} h5trackend': function(context) {
				context.evArg
						&& ok(false, 'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、実行されないこと。');
				var event = context.event;
				strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
				strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
				strictEqual(event.screenX, 20, 'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
				strictEqual(event.screenY, 20, 'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
				strictEqual(event.clientX, 20, 'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
				strictEqual(event.clientY, 20, 'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
				ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
				ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var setPos = function(ev, pos, isEnd) {
				var touch = {};
				touch.pageX = pos;
				touch.pageY = pos;
				touch.screenX = pos;
				touch.screenY = pos;
				touch.clientX = pos;
				touch.clientY = pos;
				var originalEvent = {};
				originalEvent[isEnd ? 'changedTouches' : 'touches'] = [touch];
				ev.originalEvent = originalEvent;
				return ev;
			};

			var startMouseEvent = setPos(new $.Event('touchstart'), 10);
			var moveMouseEvent = setPos(new $.Event('touchmove'), 15);
			var endMouseEvent = setPos(new $.Event('touchend'), 20, true);

			// ドラッグ中じゃないので実行されない
			$('#controllerResult').trigger(moveMouseEvent, {
				aa: "実行されない"
			});
			$('#controllerResult').trigger(endMouseEvent, {
				aa: "実行されない"
			});

			// ドラッグ開始
			$('#controllerResult').trigger(startMouseEvent);

			// ドラッグ中なので実行されない
			$('#controllerResult').trigger(startMouseEvent, {
				aa: "実行されない"
			});

			// ドラッグ
			$('#controllerResult').trigger(moveMouseEvent);

			// ドラッグ終了
			$('#controllerResult').trigger(endMouseEvent);

			// ドラッグ中じゃないので実行されない
			$('#controllerResult').trigger(moveMouseEvent, {
				aa: "実行されない"
			});
			$('#controllerResult').trigger(endMouseEvent, {
				aa: "実行されない"
			});

			testController.unbind();

			// ちゃんとアンバインドされているかどうかを確認。
			// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
			$('#controllerResult').trigger(startMouseEvent);
			$('#controllerResult').trigger(moveMouseEvent);
			$('#controllerResult').trigger(endMouseEvent);
			start();
		});
	});

	asyncTest(
			'h5trackイベント(touchstart, touchmove, touchend) touchstart/move/end をtriggerした場合もh5trackイベントが発生するか ※PCブラウザでは失敗します。',
			27, function() {
				if (document.ontouchstart === undefined) {
					expect(1);
					ok(false, 'PCブラウザでは失敗します');
					start();
					return;
				}

				var controller = {
					__name: 'TestController',
					__ready: function() {
						$(this.rootElement).trigger('touchstart').trigger('touchmove').trigger(
								'touchend');
						testController.unbind();
						start();
					},
					'{rootElement} h5trackstart': function(context) {
						ok(true, 'touchstartイベントをトリガするとh5trackstartイベントが発火すること。');
						equal(context.event.pageX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.pageY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
					},

					'{rootElement} h5trackmove': function(context) {
						ok(true, 'mousemoveイベントをトリガするとh5trackmoveイベントが発火すること。');
						equal(context.event.pageX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.pageY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
					},

					'{rootElement} h5trackend': function(context) {
						ok(true, 'mouseupイベントをトリガするとh5trackendイベントが発火すること。');
						equal(context.event.pageX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.pageY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.screenY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.clientY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetX, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
						equal(context.event.offsetY, undefined,
								'originalEventが無い場合は、座標プロパティが設定されてないこと。');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);
			});

	asyncTest(
			'h5trackイベント(mousedown, mousemove, mouseup) SVG ※タブレット、スマートフォン、IE8-では失敗します',
			26,
			function() {
				if (document.ontouchstart !== undefined) {
					expect(1);
					ok(false, 'タブレット、スマートフォンでは失敗します');
					start();
					return;
				}
				if (!isSupportSVG) {
					expect(1);
					ok(false, 'このブラウザはSVG要素を動的に追加できません。このテストケースは実行できません。');
					start();
					return;
				}
				var controller = {

					__name: 'TestController',

					'#svgElem rect h5trackstart': function(context) {
						context.evArg
								&& ok(false,
										'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 10,
								'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 10,
								'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 10,
								'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 10,
								'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
					},

					'#svgElem rect h5trackmove': function(context) {
						context.evArg
								&& ok(false,
										'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 15,
								'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 15,
								'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
						strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
						strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
					},

					'#svgElem rect h5trackend': function(context) {
						context.evArg
								&& ok(false,
										'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 20,
								'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 20,
								'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 20,
								'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 20,
								'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
					}
				};

				var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				svg.setAttribute('id', 'svgElem');
				svg.setAttribute('width', '50');
				svg.setAttribute('height', '50');
				var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				rect.setAttribute('x', '50');
				rect.setAttribute('y', '50');
				rect.setAttribute('width', '50');
				rect.setAttribute('height', '50');
				svg.appendChild(rect);
				document.getElementById('controllerTest').appendChild(svg);

				var testController = h5.core.controller('#controllerTest', controller);

				testController.readyPromise.done(function() {
					var setPos = function(ev, pos) {
						ev.pageX = pos;
						ev.pageY = pos;
						ev.screenX = pos;
						ev.screenY = pos;
						ev.clientX = pos;
						ev.clientY = pos;
						return ev;
					};


					var moveMouseEvent = setPos(new $.Event('mousemove'), 15);
					var startMouseEvent = setPos(new $.Event('mousedown'), 10);
					var endMouseEvent = setPos(new $.Event('mouseup'), 20);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$('#svgElem rect').trigger(startMouseEvent);

					// ドラッグ中なので実行されない
					$('#svgElem rect').trigger(startMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('#svgElem rect').trigger(moveMouseEvent);

					// ドラッグ終了
					$('#svgElem rect').trigger(endMouseEvent);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('#svgElem rect').trigger(startMouseEvent);
					$('#svgElem rect').trigger(moveMouseEvent);
					$('#svgElem rect').trigger(endMouseEvent);

					start();
				});
			});

	asyncTest(
			'h5trackイベント(touchstart, touchmove, touchend) SVG ※PCブラウザでは失敗します',
			26,
			function() {
				if (document.ontouchstart === undefined) {
					expect(1);
					ok(false, 'PCブラウザでは失敗します');
					start();
					return;
				}

				if (!isSupportSVG) {
					expect(1);
					ok(false, 'このブラウザはSVG要素を動的に追加できません。このテストケースは実行できません。');
					start();
					return;
				}
				var controller = {
					__name: 'TestController',

					'#svgElem rect h5trackstart': function(context) {
						context.evArg
								&& ok(false,
										'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 10,
								'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 10,
								'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 10,
								'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 10,
								'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
					},

					'#svgElem rect h5trackmove': function(context) {
						context.evArg
								&& ok(false,
										'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 15,
								'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 15,
								'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
						strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
						strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
					},

					'#svgElem rect h5trackend': function(context) {
						context.evArg
								&& ok(false,
										'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 20,
								'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 20,
								'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 20,
								'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 20,
								'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
					}
				};

				var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				svg.setAttribute('id', 'svgElem');
				svg.setAttribute('width', '50');
				svg.setAttribute('height', '50');
				var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				rect.setAttribute('x', '50');
				rect.setAttribute('y', '50');
				rect.setAttribute('width', '50');
				rect.setAttribute('height', '50');
				svg.appendChild(rect);
				document.getElementById('controllerTest').appendChild(svg);

				var testController = h5.core.controller('#controllerTest', controller);

				testController.readyPromise.done(function() {
					var setPos = function(ev, pos, isEnd) {
						var touch = {};
						touch.pageX = pos;
						touch.pageY = pos;
						touch.screenX = pos;
						touch.screenY = pos;
						touch.clientX = pos;
						touch.clientY = pos;
						var originalEvent = {};
						originalEvent[isEnd ? 'changedTouches' : 'touches'] = [touch];
						ev.originalEvent = originalEvent;
						return ev;
					};

					var startMouseEvent = setPos(new $.Event('touchstart'), 10);
					var moveMouseEvent = setPos(new $.Event('touchmove'), 15);
					var endMouseEvent = setPos(new $.Event('touchend'), 20, true);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$('#svgElem rect').trigger(startMouseEvent);

					// ドラッグ中なので実行されない
					$('#svgElem rect').trigger(startMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('#svgElem rect').trigger(moveMouseEvent);

					// ドラッグ終了
					$('#svgElem rect').trigger(endMouseEvent);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('#svgElem rect').trigger(startMouseEvent);
					$('#svgElem rect').trigger(moveMouseEvent);
					$('#svgElem rect').trigger(endMouseEvent);
					start();
				});
			});

	asyncTest(
			'h5trackイベント(mousedown, mousemove, mouseup) window ※タブレット、スマートフォンでは失敗します',
			26,
			function() {
				if (document.ontouchstart !== undefined) {
					expect(1);
					ok(false, 'タブレット、スマートフォンでは失敗します');
					start();
					return;
				}
				var controller = {

					__name: 'TestController',

					'{rootElement} h5trackstart': function(context) {
						context.evArg
								&& ok(false,
										'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 10,
								'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 10,
								'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 10,
								'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 10,
								'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
					},

					'{rootElement} h5trackmove': function(context) {
						context.evArg
								&& ok(false,
										'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 15,
								'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 15,
								'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
						strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
						strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
					},

					'{rootElement}  h5trackend': function(context) {
						context.evArg
								&& ok(false,
										'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 20,
								'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 20,
								'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 20,
								'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 20,
								'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
					}
				};

				var testController = h5.core.controller(window, controller);

				testController.readyPromise.done(function() {
					var setPos = function(ev, pos) {
						ev.pageX = pos;
						ev.pageY = pos;
						ev.screenX = pos;
						ev.screenY = pos;
						ev.clientX = pos;
						ev.clientY = pos;
						return ev;
					};


					var moveMouseEvent = setPos(new $.Event('mousemove'), 15);
					var startMouseEvent = setPos(new $.Event('mousedown'), 10);
					var endMouseEvent = setPos(new $.Event('mouseup'), 20);

					// ドラッグ中じゃないので実行されない
					$('body').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('body').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$(window).trigger(startMouseEvent);

					// ドラッグ中なので実行されない
					$('body').trigger(startMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('body').trigger(moveMouseEvent);

					// ドラッグ終了
					$('body').trigger(endMouseEvent);

					// ドラッグ中じゃないので実行されない
					$('body').trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$('body').trigger(endMouseEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('body').trigger(startMouseEvent);
					$('body').trigger(moveMouseEvent);
					$('body').trigger(endMouseEvent);

					start();
				});
			});

	asyncTest(
			'h5trackイベント(touchstart, touchmove, touchend) window ※PCブラウザでは失敗します',
			26,
			function() {
				if (document.ontouchstart === undefined) {
					expect(1);
					ok(false, 'PCブラウザでは失敗します');
					start();
					return;
				}

				var controller = {
					__name: 'TestController',

					'{rootElement} h5trackstart': function(context) {
						context.evArg
								&& ok(false,
										'h5trackstartがトラック中(h5trackstartが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 10, 'h5trackstartイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 10, 'h5trackstartイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 10,
								'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 10,
								'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 10,
								'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 10,
								'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackstartイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackstartイベントのEventオブジェクトにoffsetYは設定されているか');
					},

					'{rootElement} h5trackmove': function(context) {
						context.evArg
								&& ok(false,
										'h5trackmoveがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 15, 'h5trackmoveイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 15, 'h5trackmoveイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 15,
								'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 15,
								'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 15,
								'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackmoveイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackmoveイベントのEventオブジェクトにoffsetYは設定されているか');
						strictEqual(event.dx, 5, 'h5trackmoveイベントのEventオブジェクトにdxは設定されているか');
						strictEqual(event.dy, 5, 'h5trackmoveイベントのEventオブジェクトにdyは設定されているか');
					},

					'{rootElement} h5trackend': function(context) {
						context.evArg
								&& ok(false,
										'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
						var event = context.event;
						strictEqual(event.pageX, 20, 'h5trackendイベントのEventオブジェクトにpageXは設定されているか');
						strictEqual(event.pageY, 20, 'h5trackendイベントのEventオブジェクトにpageYは設定されているか');
						strictEqual(event.screenX, 20,
								'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
						strictEqual(event.screenY, 20,
								'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
						strictEqual(event.clientX, 20,
								'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
						strictEqual(event.clientY, 20,
								'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
						ok(event.offsetX != null, 'h5trackendイベントのEventオブジェクトにoffsetXは設定されているか');
						ok(event.offsetY != null, 'h5trackendイベントのEventオブジェクトにoffsetYは設定されているか');
					}
				};

				var testController = h5.core.controller(window, controller);

				testController.readyPromise.done(function() {
					var setPos = function(ev, pos, isEnd) {
						var touch = {};
						touch.pageX = pos;
						touch.pageY = pos;
						touch.screenX = pos;
						touch.screenY = pos;
						touch.clientX = pos;
						touch.clientY = pos;
						var originalEvent = {};
						originalEvent[isEnd ? 'changedTouches' : 'touches'] = [touch];
						ev.originalEvent = originalEvent;
						return ev;
					};

					var startMouseEvent = setPos(new $.Event('touchstart'), 10);
					var moveMouseEvent = setPos(new $.Event('touchmove'), 15);
					var endMouseEvent = setPos(new $.Event('touchend'), 20, true);

					// ドラッグ中じゃないので実行されない
					$(window).trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$(window).trigger(endMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$(window).trigger(startMouseEvent);

					// ドラッグ中なので実行されない
					$(window).trigger(startMouseEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$(window).trigger(moveMouseEvent);

					// ドラッグ終了
					$(window).trigger(endMouseEvent);

					// ドラッグ中じゃないので実行されない
					$(window).trigger(moveMouseEvent, {
						aa: "実行されない"
					});
					$(window).trigger(endMouseEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$(window).trigger(startMouseEvent);
					$(window).trigger(moveMouseEvent);
					$(window).trigger(endMouseEvent);
					start();
				});
			});


	//=============================
	// Definition
	//=============================
	/**
	 * window.onerrorを保管しておく変数
	 */
	var onerrorHandler = null;
	module(
			'ライフサイクルイベント内の例外',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest" style="display: none;"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');

					// 元のwindow.onerror(QUnitのもの)を一時的に保管する
					onerrorHandler = window.onerror;
				},
				teardown: function() {
					$('#qunit-fixture #controllerTest').remove();
					h5.core.controllerManager.controllers = [];
					// window.onerrorを元に戻す
					window.onerror = onerrorHandler;
				}
			});

	//=============================
	// Body
	//=============================
	test('__construct()で例外をスローする。', 1, function() {
		var controller = {
			__name: 'TestController',
			__construct: function() {
				throw new Error('__construct error.');
			}
		};

		raises(function() {
			h5.core.controller('#controllerTest', controller);
		}, '__construct()内で発生した例外がFW内で握りつぶされずcatchできること。');
	});

	var testTimeoutFunc = function(msg) {
		var id = setTimeout(
				function() {
					ok(
							true,
							msg
									+ ' が、コンソールまたはスクリプトエラーのウィドウに表示されていること。IE6～9 は、非同期処理中に発生した例外がwindow.onerrorにトラップされない為、目視で確認して下さい。');
					start();
				}, 5000);
		return id;
	};

	asyncTest('※IE6～9の場合は要目視確認: __init()で例外をスローする。', 1, function() {
		var errorMsg = '__init error.';
		var id = testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg), '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
			start();
		};

		var controller = {
			__name: 'TestController',
			__init: function() {
				throw new Error(errorMsg);
			}
		};

		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('※IE6～9の場合は要目視確認: __ready()で例外をスローする。', 1, function() {
		var errorMsg = '__ready error.';
		var id = testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg), '__ready()内で発生した例外がFW内で握りつぶされずcatchできること。');
			start();
		};

		var controller = {
			__name: 'TestController',
			__ready: function() {
				throw new Error(errorMsg);
			}
		};

		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('※IE6～9の場合は要目視確認: __unbind()で例外をスローする。', 1, function() {
		var errorMsg = '__unbind error.';
		var id = testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg), '__unbind()内で発生した例外がFW内で握りつぶされずcatchできること。');
			start();
		};

		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.unbind();
			},
			__unbind: function() {
				throw new Error(errorMsg);
			}
		};

		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('※IE6～9の場合は要目視確認: __dispose()で例外をスローする。', 1, function() {
		var errorMsg = '__dispose error.';
		var id = testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg),
					'__dispose()内で発生した例外がFW内で握りつぶされずcatchできること。(出力されるログも目視で確認すること)');
			start();
		};

		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.dispose();
			},
			__dispose: function() {
				throw new Error(errorMsg);
			}
		};

		h5.core.controller('#controllerTest', controller);
	});

	asyncTest(
			'※要目視確認: __init()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。(出力されるログも目視で確認すること)',
			function() {
				var expectNum = 13;
				// Android2,3では、throwErrorされてもwindow.onerrorには入らないため、テスト数を1少なくする
				if (h5.env.ua.isAndroid && h5.env.ua.browserVersion < 4) {
					expect(expectNum - 1);
				}


				ok(
						true,
						'※要目視確認　コンソールに『コントローラchildControllerの__ready内でエラーが発生したため、コントローラの初期化を中断しdisposeしました。 』のログと、__initで発生したエラーが出力されていることを確認してください');
				var errorMsg = '__init error.';

				window.onerror = function(ev) {
					// Android2,3では、throwErrorされてもwindow.onerrorには入らないのでこのテストは実行されない。
					ok(ev.indexOf(errorMsg), '__ready()内で発生した例外がFW内で握りつぶされずcatchできること。');
				};

				var controller = {
					__name: 'TestController',
					child1Controller: {
						grandchildController: {
							__name: 'grandchildController',
							__init: function() {
								ok(true, '孫コントローラの__initは実行されること');
							},
							__ready: function() {
								ok(false, '孫コントローラの__readyは実行されない');
							},
							__unbind: function() {
								ok(true, '孫コントローラの__unbindが実行されること');
							},
							__dispose: function() {
								ok(true, '孫コントローラの__disposeが実行されること');
							}
						},
						__name: 'childController',
						__init: function() {
							ok(true, '子コントローラの__initは実行されること');
							throw new Error('__init');
						},
						__ready: function() {
							ok(false, '子コントローラの__readyは実行されないこと');
						},
						__unbind: function() {
							ok(true, '子コントローラの__unbindが実行されること');
						},
						__dispose: function() {
							ok(true, '子コントローラの__disposeが実行されること');

						}
					},
					__init: function() {
						ok(false, 'ルートコントローラの__initが実行されないこと');
					},
					__ready: function() {
						ok(false, 'ルートコントローラの__readyは実行されないこと');
					},
					__unbind: function() {
						ok(true, 'ルートコントローラの__unbindが実行されること');
					},
					__dispose: function() {
						ok(true, 'ルートコントローラの__disposeが実行されること');
						setTimeout(function() {
							ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
							start();
						}, 0);
					}
				};
				var c = h5.core.controller('#controllerTest', controller);
				c.initPromise.done(function() {
					ok(false, 'テスト失敗。ルートコントローラのinitPromiseのdoneが実行された');
				}).fail(function() {
					ok(true, 'ルートコントローラのinitPromiseのfailハンドラが実行されること');
				});
				c.readyPromise.done(function() {
					ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
					start();
				}).fail(function() {
					ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
				});
			});

	asyncTest(
			'※要目視確認: __ready()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。(出力されるログも目視で確認すること)',
			function() {
				var expectNum = 16;
				// Android2,3では、throwErrorされてもwindow.onerrorには入らないため、テスト数を1少なくする
				if (h5.env.ua.isAndroid && h5.env.ua.browserVersion < 4) {
					expect(expectNum - 1);
				}
				ok(
						true,
						'※要目視確認　コンソールに『コントローラchildControllerの__init内でエラーが発生したため、コントローラの初期化を中断しdisposeしました。 』のログと、__readyで発生したエラーが出力されていることを確認してください');
				var errorMsg = '__ready error.';

				window.onerror = function(ev) {
					// Android2,3では、throwErrorされてもwindow.onerrorには入らないのでこのテストは実行されない。
					ok(ev.indexOf(errorMsg), '__ready()内で発生した例外がFW内で握りつぶされずcatchできること。');
				};

				var controller = {
					__name: 'TestController',
					child1Controller: {
						grandchildController: {
							__name: 'grandchildController',
							__init: function() {
								ok(true, '孫コントローラの__initは実行されること');
							},
							__ready: function() {
								ok(true, '孫コントローラの__readyは実行されること');
							},
							__unbind: function() {
								ok(true, '孫コントローラの__unbindが実行されること');
							},
							__dispose: function() {
								ok(true, '孫コントローラの__disposeが実行されること');
							}
						},
						__name: 'childController',
						__init: function() {
							ok(true, '子コントローラの__initは実行されること');
						},
						__ready: function() {
							ok(true, '子コントローラの__readyは実行されること');
							throw new Error('__ready');
						},
						__unbind: function() {
							ok(true, '子コントローラの__unbindが実行されること');
						},
						__dispose: function() {
							ok(true, '子コントローラの__disposeが実行されること');
						}
					},
					__init: function() {
						ok(true, 'ルートコントローラの__initが実行されること');
					},
					__ready: function() {
						ok(false, 'ルートコントローラの__readyは実行されないこと');
					},
					__unbind: function() {
						ok(true, 'ルートコントローラの__unbindが実行されること');
					},
					__dispose: function() {
						ok(true, 'ルートコントローラの__disposeが実行されること');
						setTimeout(function() {
							ok(isDisposed(c), 'ルートコントローラはdisposeされたこと');
							start();
						}, 0);
					}
				};
				var c = h5.core.controller('#controllerTest', controller);
				c.initPromise.done(function() {
					ok(true, 'ルートコントローラのinitPromiseのdoneハンドラが実行されること');
				}).fail(function() {
					ok(false, 'テスト失敗。ルートコントローラのinitPromiseのfailハンドラが実行された');
				});
				c.readyPromise.done(function() {
					ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
					start();
				}).fail(function() {
					ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
				});
			});
});
