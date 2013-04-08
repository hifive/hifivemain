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

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.controller;
	var ERR_VIEW = ERRCODE.h5.core.view;

	// タッチイベントがあるか
	var hasTouchEvent = typeof document.ontouchstart !== 'undefined';

	// trackするためのイベント
	var startTrackEventName = hasTouchEvent ? 'touchstart' : 'mousedown';
	var moveTrackEventName = hasTouchEvent ? 'touchmove' : 'mousemove';
	var endTrackEventName = hasTouchEvent ? 'touchend' : 'mouseup';

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	//=============================
	// Functions
	//=============================

	function cleanAspects() {
		h5.settings.aspects = null;
	}

	// タッチイベントの位置を設定する関数
	function setPos(ev, pos) {
		if (ev.type.indexOf('touch') != -1) {
			// タッチイベントの場合
			var touch = {};
			touch.pageX = pos;
			touch.pageY = pos;
			touch.screenX = pos;
			touch.screenY = pos;
			touch.clientX = pos;
			touch.clientY = pos;
			// touchendならchangedTouches、そうでないならtouchesにtouch情報を格納する
			// touchendの場合は通常changedTouchesに入る
			var originalEvent = {};
			originalEvent[ev.type === 'touchend' ? 'changedTouches' : 'touches'] = [touch];
			ev.originalEvent = originalEvent;
		} else {
			// それ以外(マウスイベントの場合)
			ev.pageX = pos;
			ev.pageY = pos;
			ev.screenX = pos;
			ev.screenY = pos;
			ev.clientX = pos;
			ev.clientY = pos;
		}
		return ev;
	}

	// h5trackイベントをtriggerさせるためのイベントを作成する
	function createDummyTrackEvent(eventName, pos) {
		var ev = new $.Event(eventName);
		return setPos(ev, pos);

	}

	// マウスイベントをディスパッチする関数
	function dispatchMouseEvent(elm, eventName, x, y) {
		var ev = {};
		if (elm.dispatchEvent) {
			ev = document.createEvent('MouseEvent');
			ev.initMouseEvent(eventName, true, true, window, 0, x, y, x, y, false, false, false,
					false, 0, null);
			elm.dispatchEvent(ev);
		} else {
			ev = document.createEventObject();
			ev.clientX = x;
			ev.clientY = y;
			ev.screenX = x;
			ev.screenY = y;
			elm.fireEvent('on' + eventName, ev);
		}
	}

	// タッチイベントをディスパッチする関数
	function dispatchTouchEvent(elm, eventName, x, y) {
		var ev = {};
		//android 1-3
		if (/Android\s+[123]\./i.test(navigator.userAgent)) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent(eventName, true, true, window, 0, x, y, x, y, false, false, false,
					false, 0, null);
			var touches = [];
			if (document.createTouch) {
				// android2.3.6はcreateTouchあるが、2.2.1にはなかった
				touches = [document.createTouch(window, elm, 0, x, y, x, y)];
			} else {
				touches = [{
					clientX: x,
					clientY: y,
					pageX: x,
					pageY: y,
					identifier: 1,
					screenX: x,
					screenY: y,
					target: elm
				}];
			}
			ev.touches = touches;
			ev.changedTouches = touches;
			ev.scale = 1;
			ev.rotation = 0;
		} else {
			ev = document.createEvent('TouchEvent');
			var touch = document.createTouch(window, elm, 0, x, y, x, y);
			var touches = document.createTouchList(touch);

			// android4
			if (/Android\s+4\./i.test(navigator.userAgent)) {
				ev.initTouchEvent(touches, touches, touches, eventName, window, x, y, x, y, false,
						false, false, false);
			} else {
				// iOS
				ev = document.createEvent('TouchEvent');

				ev.initTouchEvent(eventName, true, true, window, 0, x, y, x, y, false, false,
						false, false, touches, touches, touches, 1, 0);
			}
		}
		elm.dispatchEvent(ev);
	}

	// イベントを生成し、dispatchEvent(fireEvent)を使ってイベントをディスパッチする関数
	function dispatchTrackSrcNativeEvent($elm, eventName, x, y) {
		var elm = $elm[0] || $elm;
		// イベント名からマウスかタッチかを判別する
		if (eventName.indexOf('mouse') === 0) {
			dispatchMouseEvent(elm, eventName, x, y);
		} else if (eventName.indexOf('touch') === 0) {
			dispatchTouchEvent(elm, eventName, x, y);
		}
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

	asyncTest('[build#min]コントローラの作成と要素へのバインド(AOPあり)', 3, function() {
		if (!h5.core.__compileAspects) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
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

	test('h5.core.controller() 不正な引数を渡した場合、及び指定された要素が存在しないまたは、複数ある場合にエラーが出ること', 7, function() {
		$('#controllerTest').append('<div class="test">a</div>');
		$('#controllerTest').append('<div class="test">b</div>');
		var controller = {
			__name: 'TestController'
		};

		try {
			h5.core.controller(controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_TOO_FEW_ARGS, e.message);
		}
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

	asyncTest('bind: 引数が不正、またはコントローラ化されたコントローラからの呼び出しでない場合、及び指定された要素が存在しないまたは、複数ある場合にエラーが出ること', 6,
			function() {
				$('#controllerTest').append('<div class="test">a</div>');
				$('#controllerTest').append('<div class="test">b</div>');
				var controller = {
					__name: 'TestController'
				};
				var testController = h5.core.controller('#controllerTest', controller);
				testController.readyPromise.done(function() {
					testController.unbind();

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

	asyncTest('unbind: コントローラのアンバインド、再バインド', function() {
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

	asyncTest('bind: 子コントローラではbind()はできない', function() {
		var rootController = {
			__name: 'Root',
			childController: {
				__name: 'Child'
			}
		};

		var root = h5.core.controller('#controllerResult', rootController);
		root.readyPromise.done(function() {
			root.unbind();
			try {
				root.childController.bind();
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_BIND_ROOT_ONLY, e.message);
			}

			root.dispose();

			start();
		});
	});

	asyncTest('unbind: 子コントローラではunbind()はできない', function() {
		var rootController = {
			__name: 'Root',
			childController: {
				__name: 'Child'
			}
		};

		var root = h5.core.controller('#controllerResult', rootController);
		root.readyPromise.done(function() {
			try {
				root.childController.unbind();
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_BIND_ROOT_ONLY, e.message);
			}

			root.dispose();

			start();
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

	asyncTest('テンプレートが存在しない時のコントローラの動作 2', 22, function() {
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
		testController.preinitPromise.fail(function() {
			// 親のpreinitPromiseのfailが呼ばれたらテスト失敗。
			// doneについては、呼ばれるか呼ばれないか不定であるため、チェックしない。
			//   子のテンプレートロードが失敗する前に親のテンプレートロードが始まっていればdoneは実行されるが、
			//   そうでない時は親はテンプレートをロードしないため、doneもfailも実行されない。
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
					that.__name === 'ChildController';
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
					that.__name === 'TestController';
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

	asyncTest('コントローラ内のthis(AOPなし)', 1, function() {
		var capturedController = null;
		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.test();
			},

			test: function() {
				capturedController = this;
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise
				.done(function() {

					$('#controllerTest input[type=button]').click();

					strictEqual(capturedController.__name, 'TestController',
							'コントローラ内のthisはコントローラ自身を指しているか');

					testController.unbind();
					capturedController = undefined;
					start();
				});
	});

	asyncTest('[build#min]コントローラ内のthis(AOPあり)', 1, function() {
		var controllerContext = null;
		var controller = {
			__name: 'TestController',

			'input[type=button] click': function(context) {
				this.test();
			},

			test: function() {
				controllerContext = this;
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

					strictEqual(controllerContext.__name, 'TestController',
							'コントローラ内のthisはコントローラ自身を指しているか');

					testController.unbind();
					cleanAspects();
					start();
				});
	});

	asyncTest('[build#min]アスペクトの動作1', function() {
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
			strictEqual(ret.join(';'), '0;1;2', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});

	});

	asyncTest('[build#min]アスペクトの動作2', function() {
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
			strictEqual(ret.join(';'), '0;1;2', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});
	});

	asyncTest('[build#min]アスペクトの動作3', function() {
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
			strictEqual(ret.join(';'), '0;1;2;3', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});
	});

	asyncTest('[build#min]アスペクトの動作4', function() {
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
					ok($.inArray(testController.__name, ret) !== -1,
							'aspectのtargetとpointCutにマッチするのでインターセプタは動作するはず。');
					ok($.inArray(test2Controller.__name, ret) === -1,
							'aspectのtargetにマッチしないのでインターセプタは動作しないはず。');

					testController.unbind();
					test2Controller.unbind();
					cleanAspects();
					start();
				});
	});

	asyncTest('[build#min]アスペクトの動作5', function() {
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
					ok($.inArray(testController.__name, ret) !== -1,
							'aspectのtargetとpointCutにマッチするのでインターセプタは動作するはず。');
					ok($.inArray(test2Controller.__name, ret) === -1,
							'aspectのtargetにはマッチするが、pointCutにマッチしないのでインターセプタは動作しないはず。');

					testController.unbind();
					test2Controller.unbind();
					cleanAspects();
					start();
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
			$('#controllerTest').click();
			ok(isSame, '"{rootElement} eventName" でコントローラをバインドした要素自身にイベントハンドラが紐付いているか');
			testController.unbind();
			start();
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
			start();
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
			strictEqual(ret, 1000, '__readyは動作しているか');

			testController.unbind();
			start();
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
			$('#controllerTest input[type=button]').click();
			ok(html.length > 0, 'this.view.getでテンプレートからHTML文字列を取得できたか');
			testController.unbind();
			start();
		});
	});

	asyncTest(
			'テンプレートを使用できるか2 view.append()に指定されたDOM要素が{window*},{document*}である時にエラーが発生すること',
			function() {
				var html = '';
				var updateView = 0;
				var append = '';
				var append2 = '';
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
		var html = '';
		var html2 = '';
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
			$('#controllerTest input[type=button]').click();
			var html = $('#template_cascade').html();
			ok(html != null && html.length > 0, 'ビューがカスケードした場合でもターゲットは自身のrootElementからfindしているか');
			testController.unbind();
			start();
		});
	});

	//TODO モジュールに分割する
	test('コントローラの取得（getControllers）、コントローラをバインドしていない場合', function() {
		var controllers = h5.core.controllerManager.getControllers('#controllerTest');
		strictEqual($.isArray(controllers), true, 'コントローラをバインドしていないときも配列が返る');
		strictEqual(controllers.length, 0, '配列の要素数は0');
	});

	asyncTest('コントローラの取得（getControllers）、コントローラを1つバインドした場合、および引数のパターンへの対応', function() {
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
			var controllers = h5.core.controllerManager.getControllers('#controllerTest');
			strictEqual($.isArray(controllers), true, '配列が返る');
			strictEqual(controllers.length, 1, '配列の要素数は1');
			strictEqual(controllers[0], testController, '配列の要素はバインドしたコントローラインスタンスである');

			var idController = h5.core.controllerManager.getControllers('#controllerTest')[0];
			var jqController = h5.core.controllerManager.getControllers($('#controllerTest'))[0];
			var domController = h5.core.controllerManager.getControllers(document
					.getElementById('controllerTest'))[0];
			// strictEqualを使うと何故かスタックオーバーフローが発生する.
			ok(idController === testController, 'セレクタでコントローラが取得できたか');
			ok(jqController === testController, 'jQueryオブジェクトでコントローラが取得できたか');
			ok(domController === testController, 'DOMでコントローラが取得できたか');

			testController.dispose();
			start();
		});
	});

	asyncTest('コントローラの取得（getControllers）、同じ要素にバインドする子コントローラが存在する場合', function() {
		var child = {
			__name: 'ChildController'
		};

		var parent = {
			__name: 'ParentController',
			childController: child
		};

		var pInst = h5.core.controller('#controllerTest', parent);

		pInst.readyPromise.done(function() {
			var controllers = h5.core.controllerManager.getControllers('#controllerTest');
			strictEqual(controllers.length, 1, '子コントローラは含まれないので戻り値に含まれるコントローラは1つ');
			notStrictEqual($.inArray(pInst, controllers), -1, '親コントローラが含まれている');
			strictEqual($.inArray(pInst.childController, controllers), -1, '子コントローラは含まれていない');

			pInst.dispose();
		}).fail(function() {
			ok(false, 'コントローラの初期化に失敗した');
		}).always(function() {
			start();
		});

	});

	asyncTest('コントローラの取得（getControllers）、内包する子コントローラをmeta指定で親と別の要素にバインドする場合', function() {
		var child = {
			__name: 'ChildController'
		};

		var CHILD_BIND_TARGET = '#a';

		var parent = {
			__name: 'ParentController',
			__meta: {
				childController: {
					rootElement: CHILD_BIND_TARGET
				}
			},
			childController: child
		};

		var pInst = h5.core.controller('#controllerTest', parent);

		pInst.readyPromise.done(function() {
			var controllers = h5.core.controllerManager.getControllers(CHILD_BIND_TARGET);

			strictEqual(controllers.length, 0, '子コントローラはgetControllersでは取得できない');

			pInst.dispose();
		}).fail(function() {
			ok(false, 'コントローラの初期化に失敗した');
		}).always(function() {
			start();
		});

	});

	asyncTest('コントローラの取得（getControllers）、同一要素に独立した複数のコントローラがバインドされている場合', function() {
		var c1 = {
			__name: 'TestController1'
		};
		var c2 = {
			__name: 'TestController2'
		};

		var cInst1 = h5.core.controller('#controllerTest', c1);
		var cInst2 = h5.core.controller('#controllerTest', c2);

		h5.async.when(cInst1.readyPromise, cInst2.readyPromise).done(function() {
			var controllers = h5.core.controllerManager.getControllers('#controllerTest');

			strictEqual(controllers.length, 2, '独立してバインドした場合はそれぞれ独立して存在する');
			notStrictEqual($.inArray(cInst1, controllers), -1, 'コントローラ1が含まれているか');
			notStrictEqual($.inArray(cInst2, controllers), -1, 'コントローラ2が含まれているか');

			cInst1.dispose();
			cInst2.dispose();
		}).fail(function() {
			ok(false, '2つのコントローラが正しく初期化されなかった');
		}).always(function() {
			start();
		});

	});

	asyncTest(
			'[build#min]h5.core.interceptor.logInterceptorの動作',
			function() {
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
							$('#controllerTest input[type=button]').click();

							var message = '[ INFO]{timestamp}: TestController "input[type=button] click"が開始されました。 \n';
							message += '    (中略) \n';
							message += '[ INFO]{timestamp}: TestController "input[type=button] click"が終了しました。 \n';
							message += 'というメッセージがデバッグコンソールに表示されていることを確認してください。';
							ok(true, message);

							testController.unbind();
							cleanAspects();
							start();
						});

			});

	asyncTest(
			'[build#min]h5.core.interceptor.lapInterceptorの動作',
			function() {
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
							$('#controllerTest input[type=button]').click();

							var message = '[ INFO]{timestamp}: TestController "input[type=button] click": {time}ms';
							message += 'というメッセージがデバッグコンソールに表示されていることを確認してください。';
							ok(true, message);

							testController.unbind();
							cleanAspects();
							start();
						});
			});

	asyncTest('[build#min]h5.core.interceptor.errorInterceptorの動作', function() {
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
			strictEqual(errMsg, 'error interceptor test',
					'errorInterceptorによって例外がcatchされ、commonFailHandlerが呼ばれたか');

			testController.unbind();
			cleanAspects();
			start();
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
			$('#controllerTest input[type=button]').click();

			ok(dfd, 'this.deferred();でDeferredオブジェクトが取得できたか');

			testController.unbind();
			start();
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
			$('#controllerTest input[type=button]').click();

			ok(element1, 'this.$find();でコントローラ内の要素が取得できたか');
			ok(!element2, 'this.$find();でコントローラ外の要素が取得できなかったか');

			testController.unbind();
			start();
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
			$('#controllerTest input[type=button]').click();

			ok(category === 'TestController', 'コントローラのロガーのカテゴリは正しいか');
			ok(true, 'デバッグコンソールを確認し、ERROR, WARN, INFO, DEBUG, TRACEのレベル順にメッセージが出ていることを確認してください。');

			testController.unbind();
			start();
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

	asyncTest('this.triggerIndicator() FWがtriggerIndicatorイベントを受け取りインジケータを表示', 7, function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',

			'input[type=button] click': function() {
				var indicator = this.triggerIndicator({
					message: 'BlockMessageTest',
					percent: 20,
					block: true
				}).show();

				notEqual(indicator, null, 'FWが生成したインジケータオブジェクトが返ってくること');
				strictEqual(indicator._target, document.body, 'FWがスクリーンロックでインジケータを表示');

				strictEqual($(indicator._target).find(
						'.h5-indicator.a.content > .indicator-message').text(), 'BlockMessageTest',
						'オプションで指定したメッセージが表示されること');
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');

				var $percentElem = $(indicator._target).find('.throbber-percent');

				if ($percentElem.length > 0) {
					strictEqual($percentElem.text(), '20', 'Indicator#show() 進捗率が表示されること');
				} else {
					ok(false, 'スロバーが描画できないためテスト失敗。');
				}

				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');

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

	asyncTest('this.triggerIndicator() 親要素にバインドしたコントローラがtriggerIndicatorイベントを受け取りインジケータを表示', 6,
			function() {
				$('#controllerTest').append('<div id="childDiv"></div>');

				var parentIndicator = null;

				var testController = {
					__name: 'TestController',
					'{rootElement} triggerIndicator': function(context) {
						context.event.stopPropagation();
						parentIndicator = this.indicator({
							target: this.rootElement,
							percent: 30,
							message: 'indicator testController'
						}).show();
						context.evArg.indicator = parentIndicator;
					}
				};
				var childController = {
					__name: 'TestController',

					'{rootElement} click': function() {
						var indicator = this.triggerIndicator();

						strictEqual($(indicator._target).find(
								'.h5-indicator.a.content > .indicator-message').text(),
								'indicator testController');
						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
								'Indicator#show() インジケータが表示されること');

						var $percentElem = $(indicator._target).find('.throbber-percent');

						if ($percentElem.length > 0) {
							strictEqual($percentElem.text(), '30',
									'Indicator#show() インジケータが表示されること');
						} else {
							ok(false, 'スロバーが描画できないためテスト失敗。');
						}

						strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css(
								'display'), 'block', 'オーバーレイが表示されていること');

						strictEqual(indicator, parentIndicator,
								'triggerIndicatorイベントを受け取ったハンドラで生成されたインジケータであること');

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

	asyncTest('this.indicator() Indicator#percent()で指定した進捗率に更新されること', function() {
		var testController = null;
		var testController2 = null;
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
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');

				var $percentElem = $(indicator._target).find('.throbber-percent');

				if ($percentElem.length > 0) {
					expect(22);
					strictEqual($percentElem.text(), '10', 'Indicator#show() インジケータが表示されること');
					indicator.percent(30);
					strictEqual($percentElem.text(), '30',
							'Indicator#show() インジケータの進捗率表示が30に更新されていること');
					indicator.percent(100);
					strictEqual($percentElem.text(), '100',
							'Indicator#show() インジケータの進捗率表示が100に更新されていること');
					indicator.percent(5);
					strictEqual($percentElem.text(), '5',
							'Indicator#show() インジケータの進捗率表示が5に更新されていること');
					indicator.percent(-1);
					strictEqual($percentElem.text(), '5',
							'Indicator#show() インジケータの進捗率に負の数を指定したときは値が変わらないこと。');
					indicator.percent(101);
					strictEqual($percentElem.text(), '5',
							'Indicator#show() インジケータの進捗率に100より大きい数を指定したときは値が変わらないこと。');
					indicator.percent(33.3333333);
					strictEqual($percentElem.text(), '33.3333333',
							'Indicator#show() インジケータの進捗率に小数を指定できること');
				} else {
					expect(10);
					ok(false, 'スロバーが描写できないためテスト失敗。');
				}

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
					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay')
							.css('display'), 'block', 'オーバーレイが表示されていること');

					var $percentElem2 = $(indicator2._target).find('.throbber-percent');

					if ($percentElem2.length > 0) {
						strictEqual($(indicator2._target).find('.throbber-percent').text(), '10',
								'Indicator#show() インジケータの進捗率が表示されること');
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
					} else {
						ok(false, 'スロバーが描画できないためテスト失敗。');
					}

					indicator2.hide();
					setTimeout(function() {
						strictEqual($('.h5-indicator', indicator2._target).length, 0,
								'Indicator#hide() インジケータが除去されていること');
						testController.readyPromise.done(function() {
							$('#controllerTest').click();
						});
						testController2.unbind();
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
		testController2 = h5.core.controller(window, controllerBaseGrobal);
		testController2.readyPromise.done(function() {
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
				strictEqual($(indicator._target).find('.h5-indicator.a.overlay').css('display'),
						'block', 'オーバーレイが表示されていること');


				var $percentElem = $(indicator._target).find('.throbber-percent');

				if ($percentElem.length > 0) {
					strictEqual($percentElem.text(), '10', 'Indicator#show() インジケータが表示されること');
				} else {
					ok(false, 'スロバーが描画できないためテスト失敗。');
				}

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
					strictEqual($(indicator2._target).find('.h5-indicator.a.overlay')
							.css('display'), 'block', 'オーバーレイが表示されていること');

					var $percentElem2 = $(indicator2._target).find('.throbber-percent');

					if ($percentElem2.length > 0) {
						strictEqual($percentElem2.text(), '10', 'Indicator#show() インジケータが表示されること');
					} else {
						ok(false, 'スロバーが描画できないためテスト失敗。');
					}

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

					testController.unbind();
					start();
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

	asyncTest('h5.ui.indicator()', 5,
			function() {
				var testController = null;
				var controllerBase = {
					__name: 'TestController',
					'input[type=button] click': function() {
						var indicator = h5.ui.indicator(document, {
							message: 'BlockMessageTest2',
							percent: 20
						});
						indicator.show();

						strictEqual($(indicator._target).find(
								'.h5-indicator.a.content > .indicator-message').text(),
								'BlockMessageTest2');
						strictEqual($(indicator._target).find('.h5-indicator.overlay').length, 1,
								'Indicator#show() インジケータが表示されること');

						var $percentElem = $(indicator._target).find('.throbber-percent');

						if ($percentElem.length > 0) {
							strictEqual($percentElem.text(), '20',
									'Indicator#show() インジケータが表示されること');
						} else {
							ok(false, 'スロバーが描画できないためテスト失敗。');
						}

						strictEqual($(indicator._target).find('.h5-indicator.overlay').css(
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

	asyncTest('h5.ui.indicator() テーマを変更して実行', 5, function() {

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


				// IEで、$().css()で参照されるcurrentStyleオブジェクトは非同期であるため、
				// スタイルが適用されているかどうかを非同期でチェックしています。
				//
				// - currentStyle Object
				//    MSDN: http://msdn.microsoft.com/en-us/library/ie/ms535231(v=vs.85).aspx
				//    日本語訳: http://homepage3.nifty.com/rains/makeweb/dhtml/currentstyle.html

				setTimeout(function() {

					strictEqual($(indicator2._target).find(
							'.h5-indicator.b.content > .indicator-message').text(),
							'BlockMessageTest2');

					var $percentElem = $(indicator2._target).find(
							'.h5-indicator.b.content .throbber-percent');
					if ($percentElem.length > 0) {

						strictEqual(rgbToHex($percentElem.css('color')), '#c20',
								'スロバー:変更したテーマのCSSがインジケータに適用されていること');
					} else {
						ok(false, 'スロバーが描画できないためテスト失敗。');
					}

					var $messageElem = $(indicator2._target).find(
							'.h5-indicator.b.content .indicator-message');
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
				}, 100);
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
			testController.unbind();
			start();
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

	asyncTest('Controller.triggerによるイベントのトリガで、イベントが発火し、context.evArgに引数が格納されること', 6, function() {
		var init = function() {
			$('#qunit-fixture').append('<div id="controllerTest1"></div>');
		};
		init();

		var evArg = "初期値";
		var triggered = false;
		h5.core.controller('#controllerTest1', {
			__name: 'Test1Controller',

			__ready: function() {
				this.trigger('click');
				ok(triggered, 'イベントをトリガできること');
				strictEqual(evArg, undefined, '引数を渡していない時はevArgはundefinedであること');

				var obj = {
					message: 'dispatchTest'
				};
				this.trigger('click', obj);
				strictEqual(evArg, obj, 'triggerの第2引数がevArgに格納されていること');

				var ary = [1, [1, 2], 3];
				this.trigger('click', ary);
				deepEqual(evArg, ary, 'triggerで配列で渡した時にevArgに中身の同じ配列が格納されていること');

				this.trigger('click', [ary]);
				strictEqual(evArg, ary, '要素が１つの配列を渡した時、その配列の中身がevArgに格納されていること');

				this.trigger('click', null);
				strictEqual(evArg, undefined, '引数にnull渡した時、evArgはnullであること');

				$('#controllerTest1').remove();
				start();
			},

			'{rootElement} click': function(context) {
				triggered = true;
				evArg = context.evArg;
			}
		});
	});

	asyncTest('jQueryのtriggerによるイベントのトリガで、context.evArgに引数が格納されること', 6, function() {
		var init = function() {
			$('#qunit-fixture').append('<div id="controllerTest1"></div>');
		};
		init();

		var evArg = "初期値";
		var triggered = false;
		h5.core.controller('#controllerTest1', {
			__name: 'Test1Controller',

			__ready: function() {
				$('#controllerTest1').trigger('click');
				ok(triggered, 'イベントをトリガできること');
				strictEqual(evArg, undefined, '引数を渡していない時はevArgはundefinedであること');

				var obj = {
					message: 'dispatchTest'
				};
				$('#controllerTest1').trigger('click', obj);
				strictEqual(evArg, obj, 'triggerの第2引数がevArgに格納されていること');

				var ary = [1, [1, 2], 3];
				$('#controllerTest1').trigger('click', ary);
				deepEqual(evArg, ary, 'triggerで配列で渡した時にevArgに中身の同じ配列が格納されていること');

				$('#controllerTest1').trigger('click', [ary]);
				strictEqual(evArg, ary, '要素が１つの配列を渡した時、その配列の中身がevArgに格納されていること');

				$('#controllerTest1').trigger('click', null);
				strictEqual(evArg, undefined, '引数にnull渡した時、evArgはnullであること');

				$('#controllerTest1').remove();
				start();
			},

			'{rootElement} click': function(context) {
				triggered = true;
				evArg = context.evArg;
			}
		});
	});

	asyncTest('h5track*イベントハンドラを、mouse(touch)イベントのトリガで発火させたときにcontext.evArgに引数が格納されること。', 6,
			function() {
				var evArg = null;
				var $elm = $('#controllerTest');
				var h5TrackTestController = h5.core.controller($elm, {
					__name: 'h5TrackTestController',
					'{rootElement} h5trackstart': function(context) {
						evArg = context.evArg;
					},
					'{rootElement} h5trackmove': function(context) {
						evArg = context.evArg;
					},
					'{rootElement} h5trackend': function(context) {
						evArg = context.evArg;
					}
				});

				h5TrackTestController.readyPromise.done(function() {
					var obj = {
						a: 1,
						b: 2
					};
					var ary = [1, 'a'];
					// ドラッグ開始
					$elm.trigger(createDummyTrackEvent(startTrackEventName, 0), obj);
					strictEqual(evArg, obj, startTrackEventName
							+ 'のtriggerで渡した引数がh5trackstartハンドラののcontext.evArgに格納されていること');
					evArg = null;

					// ドラッグ
					$elm.trigger(createDummyTrackEvent(moveTrackEventName, 10), 1);
					strictEqual(evArg, 1, moveTrackEventName
							+ 'のtriggerで渡した引数がh5trackmoveハンドラののcontext.evArgに格納されていること');
					evArg = null;

					// ドラッグ終了
					$elm.trigger(createDummyTrackEvent(endTrackEventName, 10), 'a');
					strictEqual(evArg, 'a', endTrackEventName
							+ 'のtriggerで渡した引数がh5trackendハンドラののcontext.evArgに格納されていること');
					evArg = null;

					// 配列で複数渡した場合
					// ドラッグ開始
					$elm.trigger(createDummyTrackEvent(startTrackEventName, 0), [1, obj, ary]);
					deepEqual(evArg, [1, obj, ary], startTrackEventName
							+ 'のtriggerで渡した引数がh5trackstartハンドラののcontext.evArgに格納されていること');
					evArg = null;

					// ドラッグ
					$elm.trigger(createDummyTrackEvent(moveTrackEventName, 10), [1, obj, ary]);
					deepEqual(evArg, [1, obj, ary], moveTrackEventName
							+ 'のtriggerで渡した引数がh5trackmoveハンドラののcontext.evArgに格納されていること');
					evArg = null;

					// ドラッグ終了
					$elm.trigger(createDummyTrackEvent(endTrackEventName, 10), [1, obj, ary]);
					deepEqual(evArg, [1, obj, ary], endTrackEventName
							+ 'のtriggerで渡した引数がh5trackendハンドラののcontext.evArgに格納されていること');
					evArg = null;

					h5TrackTestController.unbind();
					start();
				});
			});

	asyncTest(
			'dispatchEvent(またはfireEvent)でmouse(touch)イベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントが正しい回数実行されること',
			3, function() {
				var fired = [];
				var elm = $('#controllerTest')[0];
				var h5TrackTestController = h5.core.controller(elm, {
					__name: 'h5TrackTestController',
					'{rootElement} h5trackstart': function(context) {
						fired.push('start');
					},
					'{rootElement} h5trackmove': function(context) {
						fired.push('move');
					},
					'{rootElement} h5trackend': function(context) {
						fired.push('end');
					}
				});

				h5TrackTestController.readyPromise.done(function() {
					// ドラッグ開始
					dispatchTrackSrcNativeEvent(elm, startTrackEventName, 10, 10);
					deepEqual(fired, ['start'], 'h5trackstartのハンドラが1度だけ実行されていること');
					fired = [];

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 11, 12);
					deepEqual(fired, ['move'], 'h5trackmoveのハンドラが1度だけ実行されていること');
					fired = [];

					// ドラッグ終了
					dispatchTrackSrcNativeEvent(elm, endTrackEventName, 9, 15);
					deepEqual(fired, ['end'], 'h5trackendのハンドラが1度だけ実行されていること');
					fired = [];

					h5TrackTestController.unbind();
					start();
				});
			});

	asyncTest(
			'dispatchEvent(またはfireEvent)でmouse(touch)イベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, function() {
				var ev = {};
				var elm = $('#controllerTest')[0];
				var h5TrackTestController = h5.core.controller(elm, {
					__name: 'h5TrackTestController',
					'{rootElement} h5trackstart': function(context) {
						ev = context.event;
					},
					'{rootElement} h5trackmove': function(context) {
						ev = context.event;
					},
					'{rootElement} h5trackend': function(context) {
						ev = context.event;
					}
				});

				h5TrackTestController.readyPromise.done(function() {
					// ドラッグ開始
					dispatchTrackSrcNativeEvent(elm, startTrackEventName, 10, 10);
					ev = {};

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 11, 12);
					strictEqual(ev.dx, 1, 'dxの値が計算されていること');
					strictEqual(ev.dy, 2, 'dyの値が計算されていること');
					ev = {};

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 9, 15);
					strictEqual(ev.dx, -2, 'dxの値が計算されていること');
					strictEqual(ev.dy, 3, 'dyの値が計算されていること');
					ev = {};

					// ドラッグ終了
					dispatchTrackSrcNativeEvent(elm, endTrackEventName, 9, 15);
					ev = {};

					h5TrackTestController.unbind();
					start();
				});
			});

	asyncTest(
			'dispatchEvent(またはfireEvent)でmouse(touch)イベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントが正しい回数実行されること',
			3, function() {
				var fired = [];
				var elm = $('<div id="h5track-target"></div>')[0];
				$('#controllerTest').append(elm);
				var h5TrackTestController = h5.core.controller('#controllerTest', {
					__name: 'h5TrackTestController',
					'#h5track-target h5trackstart': function(context) {
						fired.push('start');
					},
					'#h5track-target h5trackmove': function(context) {
						fired.push('move');
					},
					'#h5track-target h5trackend': function(context) {
						fired.push('end');
					}
				});

				h5TrackTestController.readyPromise.done(function() {
					// ドラッグ開始
					dispatchTrackSrcNativeEvent(elm, startTrackEventName, 10, 10);
					deepEqual(fired, ['start'], 'h5trackstartのハンドラが1度だけ実行されていること');
					fired = [];

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 11, 12);
					deepEqual(fired, ['move'], 'h5trackmoveのハンドラが1度だけ実行されていること');
					fired = [];

					// ドラッグ終了
					dispatchTrackSrcNativeEvent(elm, endTrackEventName, 9, 15);
					deepEqual(fired, ['end'], 'h5trackendのハンドラが1度だけ実行されていること');
					fired = [];

					h5TrackTestController.unbind();
					start();
				});
			});

	asyncTest(
			'dispatchEvent(またはfireEvent)でmouse(touch)イベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, function() {
				var ev = {};
				var elm = $('<div id="h5track-target"></div>')[0];
				$('#controllerTest').append(elm);
				var h5TrackTestController = h5.core.controller('#controllerTest', {
					__name: 'h5TrackTestController',
					'#h5track-target h5trackstart': function(context) {
						ev = context.event;
					},
					'#h5track-target h5trackmove': function(context) {
						ev = context.event;
					},
					'#h5track-target h5trackend': function(context) {
						ev = context.event;
					}
				});

				h5TrackTestController.readyPromise.done(function() {
					// ドラッグ開始
					dispatchTrackSrcNativeEvent(elm, startTrackEventName, 10, 10);
					ev = {};

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 11, 12);
					strictEqual(ev.dx, 1, 'dxの値が計算されていること');
					strictEqual(ev.dy, 2, 'dyの値が計算されていること');
					ev = {};

					// ドラッグ
					dispatchTrackSrcNativeEvent(elm, moveTrackEventName, 9, 15);
					strictEqual(ev.dx, -2, 'dxの値が計算されていること');
					strictEqual(ev.dy, 3, 'dyの値が計算されていること');
					ev = {};

					// ドラッグ終了
					dispatchTrackSrcNativeEvent(elm, endTrackEventName, 9, 15);
					ev = {};

					h5TrackTestController.unbind();
					start();
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
							: $innerDiv.trigger(startTrackEventName);
					typeof document.ontouchend === 'undefined' ? $innerDiv.mouseup() : $innerDiv
							.trigger(endTrackEventName);

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

	asyncTest('多重にネストしたコントローラで一番下の子がテンプレートを保持している場合に正しい順番で初期化処理が行われること', function() {
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
			$('#controllerTest input[type=button]').click();

			strictEqual(result.join(';'), '0;1', 'xxxControllerが動作しているか');
			strictEqual(root3, root1, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか1');
			strictEqual(root3, root2, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか2');
			strictEqual(root2, root1, 'コントローラ内コントローラのrootElementは親コントローラと同じ参照を持っているか3');


			strictEqual(constructResult.join(';'), '0;1;2', '__constructイベントが適切に発火しているか');
			strictEqual(initResult.join(';'), '0;1;2', '__initイベントが適切に発火しているか');
			strictEqual(readyResult.join(';'), '0;1;2', '__readyイベントが適切に発火しているか');

			testController.unbind();
			start();
		});
	});

	asyncTest('[build#min]__metaのuseHandlersオプションはデフォルトでtrueになっているか', function() {
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
			start();
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
			$('#controllerTest input[type=button]').mouseover();
			$('#controllerTest input[type=button]').trigger('customEvent');

			ok(childRet, '__metaのuseHandlersオプションは動作しているか');
			ok(!rootRet, '親コントローラのイベントハンドラは動作しているか');

			testController.unbind();
			start();
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
			$(document).click();
			ok(msg.length > 0, 'イベントハンドラが動作するか');

			msg = '';
			testController.unbind();
			$(document).click();
			ok(msg.length === 0, 'イベントハンドラが動作しないことを確認');
			start();
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

					testController.unbind();
					noTemplateController.unbind();
					start();
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
			strictEqual(ret.join(';'), '0;1;2;3;4;5;6;7;8',
					'子、孫コントローラがある場合に、__construct, __init, __readyの発火順は正しいか');

			c.unbind();
			start();
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
							strictEqual(ret.join(';'), '0;1;2;3;4;5;6;7;8',
									'子、孫コントローラがあり、__init, __readyでPromiseオブジェクトを返している場合、__construct, __init, __readyの発火順は正しいか');

							c.unbind();
							start();
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
							start();
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
							start();
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

		var args = {
			param: 100
		};

		var rootController = h5.core.controller('#controllerTest', rController, args);
		rootController.readyPromise.done(function() {
			strictEqual(rConstruct, args, '__constructでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(rConstruct.param, args.param, '__constructでルートに渡された初期化パラメータのプロパティは正しいか');
			strictEqual(rInit, args, '__initでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(rInit.param, args.param, '__initでルートに渡された初期化パラメータのプロパティは正しいか');
			strictEqual(rReady, args, '__readyでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(rReady.param, args.param, '__readyでルートに渡された初期化パラメータのプロパティは正しいか');

			strictEqual(pConstruct, args, '__constructで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pConstruct.param, args.param, '__constructで子に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(pInit, args, '__initで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pInit.param, args.param, '__initで子に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(pReady, args, '__readyで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pReady.param, args.param, '__readyで子に渡された初期化パラメータのプロパティは正しいか');

			strictEqual(cConstruct, args, '__constructで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cConstruct.param, args.param, '__constructで孫に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(cInit, args, '__initで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cInit.param, args.param, '__initで孫に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(cReady, args, '__readyで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cReady.param, args.param, '__readyで孫に渡された初期化パラメータのプロパティは正しいか');

			rootController.dispose();
			start();
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
			start();
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
			start();
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
							strictEqual(e.code, ERR.ERR_CODE_TOO_FEW_ARGUMENTS,
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
					c.unbind();
					start();
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
			ok(c, 'xxxControllerというプロパティの値が設定されていない時にエラーが発生せず処理が終了するか');
			c.unbind();
			start();
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
			'h5trackイベントハンドラがマウス(タッチ)イベントのトリガで実行され、h5trackstart、h5trackmove、h5trackendの順で発火し、それぞれのハンドラでポインタの位置情報を取得できること',
			26,
			function() {
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
					var startTrackEvent = createDummyTrackEvent(startTrackEventName, 10);
					var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 15);
					var endTrackEvent = createDummyTrackEvent(endTrackEventName, 20);

					// ドラッグ中じゃないので実行されない
					$('#controllerResult').trigger(moveTrackEvent, {
						aa: "実行されない"
					});
					$('#controllerResult').trigger(endTrackEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$('#controllerResult').trigger(startTrackEvent);

					// ドラッグ中なので実行されない
					$('#controllerResult').trigger(startTrackEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('#controllerResult').trigger(moveTrackEvent);

					// ドラッグ終了
					$('#controllerResult').trigger(endTrackEvent);

					// ドラッグ中じゃないので実行されない
					$('#controllerResult').trigger(moveTrackEvent, {
						aa: "実行されない"
					});
					$('#controllerResult').trigger(endTrackEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('#controllerResult').trigger(startTrackEvent);
					$('#controllerResult').trigger(moveTrackEvent);
					$('#controllerResult').trigger(endTrackEvent);

					start();
				});
			});

	asyncTest(
			'[browser#ie:0-8|ie:8-10:docmode=7|ie:8-10:docmode=8|ie-wp:9:docmode=7|and-and:0-2]SVG内要素にバインドしたh5trackイベントが実行されること ※SVGを動的に追加できないブラウザでは失敗します。',
			26,
			function() {
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
					var startTrackEvent = createDummyTrackEvent(startTrackEventName, 10);
					var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 15);
					var endTrackEvent = createDummyTrackEvent(endTrackEventName, 20);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveTrackEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endTrackEvent, {
						aa: "実行されない"
					});

					// ドラッグ開始
					$('#svgElem rect').trigger(startTrackEvent);

					// ドラッグ中なので実行されない
					$('#svgElem rect').trigger(startTrackEvent, {
						aa: "実行されない"
					});

					// ドラッグ
					$('#svgElem rect').trigger(moveTrackEvent);

					// ドラッグ終了
					$('#svgElem rect').trigger(endTrackEvent);

					// ドラッグ中じゃないので実行されない
					$('#svgElem rect').trigger(moveTrackEvent, {
						aa: "実行されない"
					});
					$('#svgElem rect').trigger(endTrackEvent, {
						aa: "実行されない"
					});

					testController.unbind();

					// ちゃんとアンバインドされているかどうかを確認。
					// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
					$('#svgElem rect').trigger(startTrackEvent);
					$('#svgElem rect').trigger(moveTrackEvent);
					$('#svgElem rect').trigger(endTrackEvent);

					start();
				});
			});
	asyncTest('親コントローラと子コントローラがh5trackイベントをバインドしているときにイベントが正しい回数発生すること', 3, function() {
		var startTrackEvent = createDummyTrackEvent(startTrackEventName, 0);
		var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 10);
		var endTrackEvent = createDummyTrackEvent(endTrackEventName, 10);

		var events = [];
		var $elm = $('#controllerTest');
		var h5TrackTestController = h5.core.controller($elm, {
			__name: 'h5TrackTestController',
			childController: {
				__name: 'child',
				'{rootElement} h5trackstart': function() {
					events.push('child-h5trackstart');
				},
				'{rootElement} h5trackmove': function() {
					events.push('child-h5trackmove');
				},
				'{rootElement} h5trackend': function() {
					events.push('child-h5trackend');
				}
			},
			'{rootElement} h5trackstart': function() {
				events.push('parent-h5trackstart');
			},
			'{rootElement} h5trackmove': function() {
				events.push('parent-h5trackmove');
			},
			'{rootElement} h5trackend': function() {
				events.push('parent-h5trackend');
			}
		});

		h5TrackTestController.readyPromise
				.done(function() {
					// ドラッグ開始
					$elm.trigger(startTrackEvent);
					deepEqual(events, ['parent-h5trackstart', 'child-h5trackstart'],
							'h5trackstartイベントが発火すること');
					events = [];

					// ドラッグ
					$elm.trigger(moveTrackEvent);
					deepEqual(events, ['parent-h5trackmove', 'child-h5trackmove'],
							'h5trackmoveイベントが発火すること');
					events = [];

					// ドラッグ終了
					$elm.trigger(endTrackEvent);
					deepEqual(events, ['parent-h5trackend', 'child-h5trackend'],
							'h5trackendイベントが発火すること');
					events = [];

					h5TrackTestController.unbind();
					start();
				});
	});

	asyncTest('2つのコントローラが同一要素にh5trackイベントをバインドしているときにイベントが正しい回数発生すること', 3, function() {
		var startTrackEvent = createDummyTrackEvent(startTrackEventName, 0);
		var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 10);
		var endTrackEvent = createDummyTrackEvent(endTrackEventName, 10);

		var events = [];
		var $elm = $('#controllerTest');
		$elm.append('<div id="divInControllerTest"></div>');
		var $inElm = $('#divInControllerTest');
		var aController = h5.core.controller('body', {
			__name: 'aController',

			'#divInControllerTest h5trackstart': function() {
				events.push('a-h5trackstart');
			},
			'#divInControllerTest h5trackmove': function() {
				events.push('a-h5trackmove');
			},
			'#divInControllerTest h5trackend': function() {
				events.push('a-h5trackend');
			}
		});
		aController.readyPromise.done(function() {
			var bController = h5.core.controller($elm, {
				__name: 'bController',
				'#divInControllerTest h5trackstart': function() {
					events.push('b-h5trackstart');
				},
				'#divInControllerTest h5trackmove': function() {
					events.push('b-h5trackmove');
				},
				'#divInControllerTest h5trackend': function() {
					events.push('b-h5trackend');
				}
			});
			bController.readyPromise.done(function() {
				// ドラッグ開始
				$inElm.trigger(startTrackEvent);
				deepEqual(events, ['b-h5trackstart', 'a-h5trackstart'], 'h5trackstartイベントが発火すること');
				events = [];

				// ドラッグ
				$inElm.trigger(moveTrackEvent);
				deepEqual(events, ['b-h5trackmove', 'a-h5trackmove'], 'h5trackmoveイベントが発火すること');
				events = [];

				// ドラッグ終了
				$inElm.trigger(endTrackEvent);
				deepEqual(events, ['b-h5trackend', 'a-h5trackend'], 'h5trackendイベントが発火すること');
				events = [];

				aController.unbind();
				bController.unbind();
				$elm.remove();
				start();
			});
		});
	});

	asyncTest(
			'mouse系(touch系)とh5track系のイベントを両方バインドした場合、両方のハンドラが動作すること',
			6,
			function() {
				var startTrackEvent = createDummyTrackEvent(startTrackEventName, 0);
				var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 10);
				var endTrackEvent = createDummyTrackEvent(endTrackEventName, 10);

				var trackEvents = {};
				var mouseEvents = {};
				var $elm = $('#controllerTest');
				$elm.append('<div id="divInControllerTest"></div>');
				var $inElm = $('#divInControllerTest');
				var aController = h5.core
						.controller(
								$elm,
								{
									__name: 'aController',

									'{rootElement} h5trackstart': function(context) {
										trackEvents.p_h5trackstart = trackEvents.p_h5trackstart ? trackEvents.p_h5trackstart + 1
												: 1;
									},
									'{rootElement} h5trackmove': function(context) {
										trackEvents.p_h5trackmove = trackEvents.p_h5trackmove ? trackEvents.p_h5trackmove + 1
												: 1;
									},
									'{rootElement} h5trackend': function(context) {
										trackEvents.p_h5trackend = trackEvents.p_h5trackend ? trackEvents.p_h5trackend + 1
												: 1;
									},
									'{rootElement} mousedown': function(context) {
										mouseEvents.p_mousedown = mouseEvents.p_mousedown ? mouseEvents.p_mousedown + 1
												: 1;
									},
									'{rootElement} mousemove': function(context) {
										mouseEvents.p_mousemove = mouseEvents.p_mousemove ? mouseEvents.p_mousemove + 1
												: 1;
									},
									'{rootElement} mouseup': function(context) {
										mouseEvents.p_mouseup = mouseEvents.p_mouseup ? mouseEvents.p_mouseup + 1
												: 1;
									},
									'{rootElement} touchstart': function(context) {
										mouseEvents.p_touchstart = mouseEvents.p_touchstart ? mouseEvents.p_touchstart + 1
												: 1;
									},
									'{rootElement} touchmove': function(context) {
										mouseEvents.p_touchmove = mouseEvents.p_touchmove ? mouseEvents.p_touchmove + 1
												: 1;
									},
									'{rootElement} touchend': function(context) {
										mouseEvents.p_touchend = mouseEvents.p_touchend ? mouseEvents.p_touchend + 1
												: 1;
									},
									'#divInControllerTest h5trackstart': function(context) {
										trackEvents.c_h5trackstart = trackEvents.c_h5trackstart ? trackEvents.c_h5trackstart + 1
												: 1;
									},
									'#divInControllerTest h5trackmove': function(context) {
										trackEvents.c_h5trackmove = trackEvents.c_h5trackmove ? trackEvents.c_h5trackmove + 1
												: 1;
									},
									'#divInControllerTest h5trackend': function(context) {
										trackEvents.c_h5trackend = trackEvents.c_h5trackend ? trackEvents.c_h5trackend + 1
												: 1;
									},
									'#divInControllerTest mousedown': function(context) {
										mouseEvents.c_mousedown = mouseEvents.c_mousedown ? mouseEvents.c_mousedown + 1
												: 1;
									},
									'#divInControllerTest mousemove': function(context) {
										mouseEvents.c_mousemove = mouseEvents.c_mousemove ? mouseEvents.c_mousemove + 1
												: 1;
									},
									'#divInControllerTest mouseup': function(context) {
										mouseEvents.c_mouseup = mouseEvents.c_mouseup ? mouseEvents.c_mouseup + 1
												: 1;
									},
									'#divInControllerTest touchstart': function(context) {
										mouseEvents.c_touchstart = mouseEvents.c_touchstart ? mouseEvents.c_touchstart + 1
												: 1;
									},
									'#divInControllerTest touchmove': function(context) {
										mouseEvents.c_touchmove = mouseEvents.c_touchmove ? mouseEvents.c_touchmove + 1
												: 1;
									},
									'#divInControllerTest touchend': function(context) {
										mouseEvents.c_touchend = mouseEvents.c_touchend ? mouseEvents.c_touchend + 1
												: 1;
									}
								});

				aController.readyPromise.done(function() {
					var exp = {};

					// ドラッグ開始
					$inElm.trigger(startTrackEvent);
					deepEqual(trackEvents, {
						c_h5trackstart: 1,
						p_h5trackstart: 1
					}, 'h5trackstartイベントハンドラが実行されていること');
					exp = {};
					exp['c_' + startTrackEventName] = 1;
					exp['p_' + startTrackEventName] = 1;
					deepEqual(mouseEvents, exp, startTrackEventName + 'イベントハンドラが実行されていること');
					trackEvents = {};
					mouseEvents = {};

					// ドラッグ
					$inElm.trigger(moveTrackEvent);
					deepEqual(trackEvents, {
						c_h5trackmove: 1,
						p_h5trackmove: 1
					}, 'h5trackmoveイベントハンドラが実行されていること');

					exp = {};
					exp['c_' + moveTrackEventName] = 1;
					exp['p_' + moveTrackEventName] = 1;
					deepEqual(mouseEvents, exp, moveTrackEventName + 'イベントハンドラが実行されていること');
					trackEvents = {};
					mouseEvents = {};


					// ドラッグ終了
					$inElm.trigger(endTrackEvent);
					deepEqual(trackEvents, {
						c_h5trackend: 1,
						p_h5trackend: 1
					}, 'h5trackendイベントハンドラが実行されていること');
					exp = {};
					exp['c_' + endTrackEventName] = 1;
					exp['p_' + endTrackEventName] = 1;
					deepEqual(mouseEvents, exp, endTrackEventName + 'イベントハンドラが実行されていること');
					trackEvents = {};
					mouseEvents = {};

					aController.unbind();
					$elm.remove();
					start();
				});
			});

	asyncTest(
			'ルートエレメントより外のエレメントでmouse系イベント(touch系イベント)がstopPropagation()されていて、documentまでmouse系イベント(touch系イベント)がバブリングしない状態でも、h5trackイベントハンドラは実行されること',
			3, function() {
				var startTrackEvent = createDummyTrackEvent(startTrackEventName, 0);
				var moveTrackEvent = createDummyTrackEvent(moveTrackEventName, 10);
				var endTrackEvent = createDummyTrackEvent(endTrackEventName, 10);

				var trackEvents = [];
				var $elm = $('#controllerTest');
				$elm.append('<div id="divInControllerTest"></div>');
				var $inElm = $('#divInControllerTest');
				var aController = h5.core.controller($elm, {
					__name: 'aController',
					'{rootElement} mousedown': function(context) {
						context.event.stopPropagation();
					},
					'{rootElement} mousemove': function(context) {
						context.event.stopPropagation();
					},
					'{rootElement} mouseup': function(context) {
						context.event.stopPropagation();
					},
					'{rootElement} touchstart': function(context) {
						context.event.stopPropagation();
					},
					'{rootElement} touchmove': function(context) {
						context.event.stopPropagation();
					},
					'{rootElement} touchend': function(context) {
						context.event.stopPropagation();
					}
				});

				var bController = h5.core.controller('#divInControllerTest', {
					__name: 'aController',
					'{rootElement} h5trackstart': function(context) {
						trackEvents.push('c-h5trackstart');
					},
					'{rootElement} h5trackmove': function(context) {
						trackEvents.push('c-h5trackmove');
					},
					'{rootElement} h5trackend': function(context) {
						trackEvents.push('c-h5trackend');
					}
				});

				$.when(aController.readyPromise, bController.readyPromise).done(function() {
					// ドラッグ開始
					$inElm.trigger(startTrackEvent);
					deepEqual(trackEvents, ['c-h5trackstart'], 'h5trackstartイベントが伝播していないこと');
					trackEvents = [];

					// ドラッグ
					$inElm.trigger(moveTrackEvent);
					deepEqual(trackEvents, ['c-h5trackmove'], 'h5trackmoveイベントが伝播していないこと');
					trackEvents = [];


					// ドラッグ終了
					$inElm.trigger(endTrackEvent);
					deepEqual(trackEvents, ['c-h5trackend'], 'h5trackendイベントが伝播していないこと');
					trackEvents = [];

					aController.unbind();
					$elm.remove();
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
				},
				testTimeoutFunc: function(msg) {
					var id = setTimeout(function() {
						ok(false, 'window.onerrorが実行されませんでした。');
						start();
					}, 5000);
					return id;
				}
			});

	//=============================
	// Body
	//=============================
	test('__construct()で例外をスローする。', 1, function() {
		// __construct()は同期なのでwindow.onerrorの拾えないandroid0-3でもテストできる
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

	asyncTest('[browser#and-and:-3]__init()で例外をスローする。', 1, function() {
		var errorMsg = '__init error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
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

	asyncTest('[browser#and-and:-3]__ready()で例外をスローする。', 1, function() {
		var errorMsg = '__ready error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__ready()内で発生した例外がFW内で握りつぶされずcatchできること。');
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

	asyncTest('[browser#and-and:-3]__unbind()で例外をスローする。', 1, function() {
		var errorMsg = '__unbind error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__unbind()内で発生した例外がFW内で握りつぶされずcatchできること。');
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

	asyncTest('[browser#and-and:-3]__dispose()で例外をスローする。', 1, function() {
		var errorMsg = '__dispose error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__dispose()内で発生した例外がFW内で握りつぶされずcatchできること。');
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

	asyncTest('__init()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。', 11, function() {
		window.onerror = function() {};
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

	asyncTest('__ready()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。', 14, function() {
		window.onerror = function() {};
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

	asyncTest('h5controllerreadyイベントのevArgにコントローラが渡されること', 4, function() {
		var order = 1;
		var conIns = null;

		var controller = {
			__name: 'TestController',
			'{rootElement} h5controllerready': function(context) {
				equal(order, 2, '__readyのあとに発火すること');
				strictEqual(context.evArg, conIns, '引数にコントローラが返ってくること');
				equal(context.evArg.isReady, true, 'isReadyはtrueであること');
				start();
			},
			__ready: function() {
				equal(conIns.isReady, false, 'isReadyはfalseであること');
				order++;
			}
		};

		conIns = h5.core.controller('#controllerTest', controller);
	});

	asyncTest('__readyで返したPromiseがrejectされた場合、h5controllerreadyイベントは発生しないこと', 1, function() {
		var conIns = null;

		var controller = {
			__name: 'TestController',
			'{rootElement} h5controllerready': function(context) {
				ok(false, 'h5controllerreadyイベントが発生したためテスト失敗');
			},
			__ready: function() {
				var df = this.deferred();
				df.reject();

				return df.promise();
			},
			__dispose: function() {
				equal(conIns.isReady, false, 'isReadyはfalseであること');
				start();
			}
		};

		conIns = h5.core.controller('#controllerTest', controller);
	});
});
