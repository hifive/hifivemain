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
	var isDisposed = testutils.u.isDisposed;
	var isResolved = testutils.u.isResolved;
	var isRejected = testutils.u.isRejected;
	var rgbToHex = testutils.u.rgbToHex;
	var deleteProperty = testutils.u.deleteProperty;
	var clearController = testutils.u.clearController;
	var abortTest = testutils.qunit.abortTest;
	var openPopupWindow = testutils.dom.openPopupWindow;
	var closePopupWindow = testutils.dom.closePopupWindow;
	var createIFrameElement = testutils.dom.createIFrameElement;
	var skipTest = testutils.qunit.skipTest;

	// コントローラのエラーコード
	var ERR = ERRCODE.h5.core.controller;
	// viewのエラーコード
	var ERR_VIEW = ERRCODE.h5.core.view;

	// タッチイベントがあるか
	var hasTouchEvent = typeof document.ontouchstart !== 'undefined';
	// マウスイベントがあるか
	var hasMouseEvent = typeof document.onmousedown !== 'undefined';

	// trackするためのイベント
	var touchTrackEvents = {
		start: 'touchstart',
		move: 'touchmove',
		end: 'touchend'
	};
	var mouseTrackEvents = {
		start: 'mousedown',
		move: 'mousemove',
		end: 'mouseup'
	};

	// touch-action、-ms-touch-actionプロパティに対応しているかどうか
	var touchActionProp = null;
	if (typeof document.body.style.touchAction !== 'undefined') {
		touchActionProp = 'touchAction';
	} else if (typeof document.body.style.msTouchAction !== 'undefined') {
		touchActionProp = 'msTouchAction';
	}

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	//=============================
	// Functions
	//=============================
	// aspectのリセット
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
			x = x || 0;
			y = y || 0;
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

	// マウスホイールイベントをディスパッチする関数
	// IE8-ではwheelDeltaをセットできない(createEventObjectでwheelDeltaに値をセットできないため)
	function dispatchMouseWheelEvent(elm, wheelDelta) {
		var ev;
		if (typeof document.onmousewheel !== 'undefined') {
			if (elm.dispatchEvent) {

				function createUIEvent() {
					// opera, android2
					// wheelDeltaが負ならdetailを3、正なら-3のイベントを作成。
					ev = document.createEvent('UIEvent');
					ev.initUIEvent('mousewheel', false, false, window, wheelDelta < 0 ? 3 : -3);
				}
				try {
					ev = document.createEvent('WheelEvent');

					if (ev.initWebKitWheelEvent) {
						// chrome,safari,android3+
						// wheelDeltaが正ならwheelDeltaYを正、負なら負のイベントを作成。
						ev.initWebKitWheelEvent(0, wheelDelta > 0 ? 1 : -1, window, 0, 0, 0, 0,
								false, false, false, false);
					} else if (ev.initWheelEvent) {
						// IE9+
						// wheelDeltaが負ならdetailを3、正なら-3のイベントを作成。
						ev.initWheelEvent('mousewheel', false, false, window, wheelDelta < 0 ? 3
								: -3, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0);

					} else {
						// android2
						createUIEvent();
					}
				} catch (e) {
					// opera
					createUIEvent();
				}
				elm.dispatchEvent(ev);
			} else {
				// dispatchEventがない場合(IE8-)
				ev = document.createEventObject();
				elm.fireEvent('onmousewheel', ev);
			}
		} else {
			// Firefoxの場合
			ev = document.createEvent('MouseScrollEvents');
			// wheelDeltaが負ならdetailを3、正なら-3のイベントを作成。
			ev.initMouseScrollEvent('DOMMouseScroll', ev.canBubble, ev.cancelable, ev.view,
					wheelDelta < 0 ? 3 : -3, ev.screenX, ev.screenY, ev.clientX, ev.clientY,
					ev.ctrlKey, ev.altKey, ev.shiftKey, ev.metaKey, ev.button, ev.relatedTarget,
					ev.axis);
			elm.dispatchEvent(ev);
		}
	}

	/**
	 * タッチイベントをディスパッチする関数
	 */
	function dispatchTouchEvent(elm, eventName, x, y) {
		var ev = null;
		if (/Android\s+[123]\./i.test(navigator.userAgent)) {
			//android 1-3 はcreateEvent('mouseEvents')で作ったイベントにtouchesを持たせてタッチイベントを作成する
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent(eventName, true, true, window, 0, x, y, x, y, false, false, false,
					false, 0, null);
			var touches = null;
			// touchesの作成
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
			// iOS、android4、またはタッチ対応PCのブラウザ
			ev = document.createEvent('TouchEvent');
			var touch = document.createTouch(window, elm, 0, x, y, x, y);
			var touches = document.createTouchList(touch);

			if (h5.env.ua.isiOS) {
				// iOS
				ev.initTouchEvent(eventName, true, true, window, 0, x, y, x, y, false, false,
						false, false, touches, touches, touches, 1, 0);
			} else {
				ev.initTouchEvent(touches, touches, touches, eventName, window, x, y, x, y, false,
						false, false, false);
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

	/**
	 * touchTrackEventsまたはmouseTrackEventsを引数にとって、使用しているブラウザにそのイベントがあるか判定する関数
	 *
	 * @param {Object} events
	 * @returns {Boolean}
	 */
	function isExistEvents(events) {
		if (!hasTouchEvent && events === touchTrackEvents) {
			ok(true, 'タッチイベントの無い端末で実行できないテストです');
			return false;
		}
		if (!hasMouseEvent && events === mouseTrackEvents) {
			ok(true, 'マウスイベントの無い端末で実行できないテストです');
			return false;
		}
		return true;
	}

	//----------- h5trackイベントのテスト関数を、mouseEvents、touchEventsのいずれかを引数にとって生成する関数 --------------//

	/**
	 * 『h5track*イベントハンドラを、mouse(またはtouch)イベントのトリガで発火させたときにcontext.evArgに引数が格納されること。』 。
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckEvArg(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}

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
				$elm.trigger(createDummyTrackEvent(events.start, 0), obj);
				strictEqual(evArg, obj, events.start
						+ 'のtriggerで渡した引数がh5trackstartハンドラののcontext.evArgに格納されていること');
				evArg = null;

				// ドラッグ
				$elm.trigger(createDummyTrackEvent(events.move, 10), 1);
				strictEqual(evArg, 1, events.move
						+ 'のtriggerで渡した引数がh5trackmoveハンドラののcontext.evArgに格納されていること');
				evArg = null;

				// ドラッグ終了
				$elm.trigger(createDummyTrackEvent(events.end, 10), 'a');
				strictEqual(evArg, 'a', events.end
						+ 'のtriggerで渡した引数がh5trackendハンドラののcontext.evArgに格納されていること');
				evArg = null;

				// 配列で複数渡した場合
				// ドラッグ開始
				$elm.trigger(createDummyTrackEvent(events.start, 0), [1, obj, ary]);
				deepEqual(evArg, [1, obj, ary], events.start
						+ 'のtriggerで渡した引数がh5trackstartハンドラののcontext.evArgに格納されていること');
				evArg = null;

				// ドラッグ
				$elm.trigger(createDummyTrackEvent(events.move, 10), [1, obj, ary]);
				deepEqual(evArg, [1, obj, ary], events.move
						+ 'のtriggerで渡した引数がh5trackmoveハンドラののcontext.evArgに格納されていること');
				evArg = null;

				// ドラッグ終了
				$elm.trigger(createDummyTrackEvent(events.end, 10), [1, obj, ary]);
				deepEqual(evArg, [1, obj, ary], events.end
						+ 'のtriggerで渡した引数がh5trackendハンドラののcontext.evArgに格納されていること');
				evArg = null;

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『dispatchEvent(またはfireEvent)でtouch/mouseイベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントが正しい回数実行されること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckDispatchEvent(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
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
				dispatchTrackSrcNativeEvent(elm, events.start, 10, 10);
				deepEqual(fired, ['start'], 'h5trackstartのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 11, 12);
				deepEqual(fired, ['move'], 'h5trackmoveのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ終了
				dispatchTrackSrcNativeEvent(elm, events.end, 9, 15);
				deepEqual(fired, ['end'], 'h5trackendのハンドラが1度だけ実行されていること');
				fired = [];

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『dispatchEvent(またはfireEvent)でtouch/mouseイベントを発火させたときに、ルートエレメントに直接バインド記法でバインドしたh5track*イベントが正しい回数実行されること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckDirectBindDispatchEvent(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
			var fired = [];
			var elm = $('#controllerTest')[0];
			var h5TrackTestController = h5.core.controller(elm, {
				__name: 'h5TrackTestController',
				'{rootElement} [h5trackstart]': function(context) {
					fired.push('start');
				},
				'{rootElement} [h5trackmove]': function(context) {
					fired.push('move');
				},
				'{rootElement} [h5trackend]': function(context) {
					fired.push('end');
				}
			});

			h5TrackTestController.readyPromise.done(function() {
				// ドラッグ開始
				dispatchTrackSrcNativeEvent(elm, events.start, 10, 10);
				deepEqual(fired, ['start'], 'h5trackstartのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 11, 12);
				deepEqual(fired, ['move'], 'h5trackmoveのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ終了
				dispatchTrackSrcNativeEvent(elm, events.end, 9, 15);
				deepEqual(fired, ['end'], 'h5trackendのハンドラが1度だけ実行されていること');
				fired = [];

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『dispatchEvent(またはfireEvent)でmouse/touchイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckDispatchEventDxDy(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
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
				dispatchTrackSrcNativeEvent(elm, events.start, 10, 10);
				ev = {};

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 11, 12);
				strictEqual(ev.dx, 1, 'dxの値が計算されていること');
				strictEqual(ev.dy, 2, 'dyの値が計算されていること');
				ev = {};

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 9, 15);
				strictEqual(ev.dx, -2, 'dxの値が計算されていること');
				strictEqual(ev.dy, 3, 'dyの値が計算されていること');
				ev = {};

				// ドラッグ終了
				dispatchTrackSrcNativeEvent(elm, events.end, 9, 15);
				ev = {};

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『dispatchEvent(またはfireEvent)でmouse/touchイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントが正しい回数実行されること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckChildEvent(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
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
				dispatchTrackSrcNativeEvent(elm, events.start, 10, 10);
				deepEqual(fired, ['start'], 'h5trackstartのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 11, 12);
				deepEqual(fired, ['move'], 'h5trackmoveのハンドラが1度だけ実行されていること');
				fired = [];

				// ドラッグ終了
				dispatchTrackSrcNativeEvent(elm, events.end, 9, 15);
				deepEqual(fired, ['end'], 'h5trackendのハンドラが1度だけ実行されていること');
				fired = [];

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckChildEventDxDy(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
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
				dispatchTrackSrcNativeEvent(elm, events.start, 10, 10);
				ev = {};

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 11, 12);
				strictEqual(ev.dx, 1, 'dxの値が計算されていること');
				strictEqual(ev.dy, 2, 'dyの値が計算されていること');
				ev = {};

				// ドラッグ
				dispatchTrackSrcNativeEvent(elm, events.move, 9, 15);
				strictEqual(ev.dx, -2, 'dxの値が計算されていること');
				strictEqual(ev.dy, 3, 'dyの値が計算されていること');
				ev = {};

				// ドラッグ終了
				dispatchTrackSrcNativeEvent(elm, events.end, 9, 15);
				ev = {};

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『h5trackイベントハンドラがmouse/touchイベントのトリガで実行され、h5trackstart、h5trackmove、h5trackendの順で発火し、それぞれのハンドラでポインタの位置情報を取得できること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckPosition(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
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
					strictEqual(event.screenX, 10, 'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
					strictEqual(event.screenY, 10, 'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
					strictEqual(event.clientX, 10, 'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
					strictEqual(event.clientY, 10, 'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
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
							&& ok(false,
									'h5trackendがトラック中でないとき(h5trackendが呼ばれた後)に呼ばれても、1度しか実行されないこと。');
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
				var startTrackEvent = createDummyTrackEvent(events.start, 10);
				var moveTrackEvent = createDummyTrackEvent(events.move, 15);
				var endTrackEvent = createDummyTrackEvent(events.end, 20);

				// ドラッグ中じゃないので実行されない
				$('#child1').trigger(moveTrackEvent, {
					aa: "実行されない"
				});
				$('#child1').trigger(endTrackEvent, {
					aa: "実行されない"
				});

				// ドラッグ開始
				$('#child1').trigger(startTrackEvent);

				// ドラッグ中なので実行されない
				$('#child1').trigger(startTrackEvent, {
					aa: "実行されない"
				});

				// ドラッグ
				$('#child1').trigger(moveTrackEvent);

				// ドラッグ終了
				$('#child1').trigger(endTrackEvent);

				// ドラッグ中じゃないので実行されない
				$('#child1').trigger(moveTrackEvent, {
					aa: "実行されない"
				});
				$('#child1').trigger(endTrackEvent, {
					aa: "実行されない"
				});

				testController.unbind();

				// ちゃんとアンバインドされているかどうかを確認。
				// もしアンバインドされていなければアサーションが動作し、想定されている数と異なりfailするはず。
				$('#child1').trigger(startTrackEvent);
				$('#child1').trigger(moveTrackEvent);
				$('#child1').trigger(endTrackEvent);

				start();
			});
		};
	}

	/**
	 * 『SVG内要素にバインドしたコントローラでmouse/touchイベントでh5trackイベントが実行されること ※SVGを動的に追加できないブラウザでは失敗します。』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckSVGPosition(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
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
					strictEqual(event.screenX, 10, 'h5trackstartイベントのEventオブジェクトにscreenXは設定されているか');
					strictEqual(event.screenY, 10, 'h5trackstartイベントのEventオブジェクトにscreenYは設定されているか');
					strictEqual(event.clientX, 10, 'h5trackstartイベントのEventオブジェクトにclientXは設定されているか');
					strictEqual(event.clientY, 10, 'h5trackstartイベントのEventオブジェクトにclientYは設定されているか');
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
					strictEqual(event.screenX, 15, 'h5trackmoveイベントのEventオブジェクトにscreenXは設定されているか');
					strictEqual(event.screenY, 15, 'h5trackmoveイベントのEventオブジェクトにscreenYは設定されているか');
					strictEqual(event.clientX, 15, 'h5trackmoveイベントのEventオブジェクトにclientXは設定されているか');
					strictEqual(event.clientY, 15, 'h5trackmoveイベントのEventオブジェクトにclientYは設定されているか');
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
					strictEqual(event.screenX, 20, 'h5trackendイベントのEventオブジェクトにscreenXは設定されているか');
					strictEqual(event.screenY, 20, 'h5trackendイベントのEventオブジェクトにscreenYは設定されているか');
					strictEqual(event.clientX, 20, 'h5trackendイベントのEventオブジェクトにclientXは設定されているか');
					strictEqual(event.clientY, 20, 'h5trackendイベントのEventオブジェクトにclientYは設定されているか');
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
				var startTrackEvent = createDummyTrackEvent(events.start, 10);
				var moveTrackEvent = createDummyTrackEvent(events.move, 15);
				var endTrackEvent = createDummyTrackEvent(events.end, 20);

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
		};
	}

	/**
	 * 『親コントローラと子コントローラがh5trackイベントをバインドしているときにtouchイベントでh5grackイベントが正しい回数発生すること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckNumOfRuns(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
			var startTrackEvent = createDummyTrackEvent(events.start, 0);
			var moveTrackEvent = createDummyTrackEvent(events.move, 10);
			var endTrackEvent = createDummyTrackEvent(events.end, 10);

			var results = [];
			var $elm = $('#controllerTest');
			var h5TrackTestController = h5.core.controller($elm, {
				__name: 'h5TrackTestController',
				childController: {
					__name: 'child',
					'{rootElement} h5trackstart': function() {
						results.push('child-h5trackstart');
					},
					'{rootElement} h5trackmove': function() {
						results.push('child-h5trackmove');
					},
					'{rootElement} h5trackend': function() {
						results.push('child-h5trackend');
					}
				},
				'{rootElement} h5trackstart': function() {
					results.push('parent-h5trackstart');
				},
				'{rootElement} h5trackmove': function() {
					results.push('parent-h5trackmove');
				},
				'{rootElement} h5trackend': function() {
					results.push('parent-h5trackend');
				}
			});

			h5TrackTestController.readyPromise.done(function() {
				// ドラッグ開始
				$elm.trigger(startTrackEvent);
				deepEqual(results, ['parent-h5trackstart', 'child-h5trackstart'],
						'h5trackstartイベントが発火すること');
				results = [];

				// ドラッグ
				$elm.trigger(moveTrackEvent);
				deepEqual(results, ['parent-h5trackmove', 'child-h5trackmove'],
						'h5trackmoveイベントが発火すること');
				results = [];

				// ドラッグ終了
				$elm.trigger(endTrackEvent);
				deepEqual(results, ['parent-h5trackend', 'child-h5trackend'],
						'h5trackendイベントが発火すること');

				h5TrackTestController.unbind();
				start();
			});
		};
	}

	/**
	 * 『2つのコントローラが同一要素にh5trackイベントをバインドしているときにmouse/touchイベントでh5trackイベントが正しい回数発生すること』 で実行するテスト』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckNumOfRunsAtSameElement(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
			var startTrackEvent = createDummyTrackEvent(events.start, 0);
			var moveTrackEvent = createDummyTrackEvent(events.move, 10);
			var endTrackEvent = createDummyTrackEvent(events.end, 10);

			var results = [];
			var $elm = $('#controllerTest');
			$elm.append('<div id="divInControllerTest"></div>');
			var $inElm = $('#divInControllerTest');
			var aController = h5.core.controller('body', {
				__name: 'aController',

				'#divInControllerTest h5trackstart': function() {
					results.push('a-h5trackstart');
				},
				'#divInControllerTest h5trackmove': function() {
					results.push('a-h5trackmove');
				},
				'#divInControllerTest h5trackend': function() {
					results.push('a-h5trackend');
				}
			});
			aController.readyPromise.done(function() {
				var bController = h5.core.controller($elm, {
					__name: 'bController',
					'#divInControllerTest h5trackstart': function() {
						results.push('b-h5trackstart');
					},
					'#divInControllerTest h5trackmove': function() {
						results.push('b-h5trackmove');
					},
					'#divInControllerTest h5trackend': function() {
						results.push('b-h5trackend');
					}
				});
				bController.readyPromise
						.done(function() {
							// ドラッグ開始
							$inElm.trigger(startTrackEvent);
							deepEqual(results, ['b-h5trackstart', 'a-h5trackstart'],
									'h5trackstartイベントが発火すること');
							results = [];

							// ドラッグ
							$inElm.trigger(moveTrackEvent);
							deepEqual(results, ['b-h5trackmove', 'a-h5trackmove'],
									'h5trackmoveイベントが発火すること');
							results = [];

							// ドラッグ終了
							$inElm.trigger(endTrackEvent);
							deepEqual(results, ['b-h5trackend', 'a-h5trackend'],
									'h5trackendイベントが発火すること');
							results = [];

							aController.unbind();
							bController.unbind();
							$elm.remove();
							start();
						});
			});
		};
	}

	/**
	 * 『touchイベントとh5trackイベントを両方バインドした場合、両方のハンドラが動作すること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckOriginal(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
			var startTrackEvent = createDummyTrackEvent(events.start, 0);
			var moveTrackEvent = createDummyTrackEvent(events.move, 10);
			var endTrackEvent = createDummyTrackEvent(events.end, 10);

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
				exp['c_' + events.start] = 1;
				exp['p_' + events.start] = 1;
				deepEqual(mouseEvents, exp, events.start + 'イベントハンドラが実行されていること');
				trackEvents = {};
				mouseEvents = {};

				// ドラッグ
				$inElm.trigger(moveTrackEvent);
				deepEqual(trackEvents, {
					c_h5trackmove: 1,
					p_h5trackmove: 1
				}, 'h5trackmoveイベントハンドラが実行されていること');

				exp = {};
				exp['c_' + events.move] = 1;
				exp['p_' + events.move] = 1;
				deepEqual(mouseEvents, exp, events.move + 'イベントハンドラが実行されていること');
				trackEvents = {};
				mouseEvents = {};


				// ドラッグ終了
				$inElm.trigger(endTrackEvent);
				deepEqual(trackEvents, {
					c_h5trackend: 1,
					p_h5trackend: 1
				}, 'h5trackendイベントハンドラが実行されていること');
				exp = {};
				exp['c_' + events.end] = 1;
				exp['p_' + events.end] = 1;
				deepEqual(mouseEvents, exp, events.end + 'イベントハンドラが実行されていること');
				trackEvents = {};
				mouseEvents = {};

				aController.unbind();
				$elm.remove();
				start();
			});
		};
	}

	/**
	 * 『ルートエレメントより外のエレメントでmouse/touch系イベントがstopPropagation()されていて、documentまでmouse/touch系イベントがバブリングしない状態でも、h5trackイベントハンドラは実行されること』
	 *
	 * @param {Object} events touchTrackEventsまたはmouseTrackEvents
	 * @returns {Function} テスト関数
	 */
	function getH5trackTestCheckStopPropagation(events) {
		return function() {
			if (!isExistEvents(events)) {
				abortTest();
				start();
				return;
			}
			var startTrackEvent = createDummyTrackEvent(events.start, 0);
			var moveTrackEvent = createDummyTrackEvent(events.move, 10);
			var endTrackEvent = createDummyTrackEvent(events.end, 10);

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
				__name: 'bController',
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
				start();
			});
		};
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
			'Controller - expose',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
				}
			});

	//=============================
	// Body
	//=============================
	test('h5.core.expose()を実行', 3, function() {
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
		strictEqual(c1, window.TestController, '"."を含まない__nameの場合、window直下に紐付けられること');
		h5.core.expose(c2);
		strictEqual(c2, window.com.htmlhifive.test.controller.TestController,
				'"."を含む__nameの場合、window以下に名前空間が作られて紐付けられること');
		try {
			h5.core.expose(c3);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_EXPOSE_NAME_REQUIRED,
					'コントローラ、ロジック以外(__nameプロパティがない)のオブジェクトをh5.core.expose()に渡すとエラーが発生すること');
		}
		deleteProperty(window, 'TestController');
	});

	//=============================
	// Definition
	//=============================
	module('Controller - controller', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"><input type="button"/></div>');
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('コントローラの作成と要素へのバインド', 1, function() {
		var result;
		var controller = {
			__name: 'TestController',
			'input[type=button] click': function(context) {
				result = true;
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			ok(result, 'コントローラが要素にバインドされていて、イベントハンドラが実行されること');
			start();
		});
	});

	test('__name属性のないオブジェクトをコントローラとしてバインドしようとするとエラーが出ること', 1, function() {
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		var controller = {
			name: 'TestController'
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, errorCode, e.message);
		}
	});

	test('__name属性が文字列でないオブジェクトをコントローラとしてバインドしようとするとエラーが出ること', 5, function() {
		var names = ['', '   ', 1, {}, ["MyController"]];
		var l = names.length;
		expect(l);
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		for (var i = 0; i < l; i++) {
			try {
				h5.core.controller('#controllerTest', {
					__name: names[i]
				});
				ok(false, 'エラーが発生していません。');
			} catch (e) {
				strictEqual(e.code, errorCode, e.message);
			}
		}
	});

	test('__name属性のないロジックを持つコントローラをバインドしようとするとエラーが出ること', 1, function() {
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
			strictEqual(e.code, errorCode, e.message);
		}
	});

	test('__name属性が文字列でないロジックを持つコントローラをバインドしようとするとエラーが出ること', 5, function() {
		var names = ['', '   ', 1, {}, ["MyLogic"]];
		var l = names.length;
		expect(l);
		var errorCode = ERR.ERR_CODE_INVALID_LOGIC_NAME;
		for (var i = 0; i < l; i++) {
			try {
				h5.core.controller('#controllerTest', {
					__name: 'TestController',
					myLogic: {
						__name: names[i]
					}
				});
				ok(false, 'エラーが発生していません。');
			} catch (e) {
				strictEqual(e.code, errorCode, e.message);
			}
		}
	});

	test('コントローラのバインド対象のチェック 引数の数が1つ以下の場合はエラー', 2, function() {
		var controller = {
			__name: 'TestController'
		};
		try {
			h5.core.controller();
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_TOO_FEW_ARGS, e.message);
		}
		try {
			h5.core.controller(controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_TOO_FEW_ARGS, e.message);
		}
	});
	test('コントローラのバインド対象のチェック 第1引数がnull,undefinedの場合はエラー', 2, function() {
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
	});
	test('コントローラのバインド対象のチェック 指定したセレクタにマッチする要素が存在しない場合はエラー', 2, function() {
		var controller = {
			__name: 'TestController'
		};
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
	});
	test('コントローラのバインド対象のチェック 指定したセレクタにマッチする要素が複数存在する場合はエラー', 1, function() {
		$('#qunit-fixture').append('<div class="test"></div><div class="test"></div>');
		var controller = {
			__name: 'TestController'
		};
		try {
			h5.core.controller('.test', controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TOO_MANY_TARGET, e.message);
		}
	});
	test('コントローラのバインド対象のチェック 第1引数が文字列でもDOM要素でもない場合はエラー', 2, function() {
		var controller = {
			__name: 'TestController'
		};
		try {
			h5.core.controller(1, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_TARGET_ILLEGAL, e.message);
		}
		try {
			h5.core.controller({}, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_NODE, e.message);
		}
	});
	test('コントローラのバインド対象のチェック バインド先にwindowが指定された場合はエラー', 2, function() {
		var controller = {
			__name: 'TestController'
		};
		try {
			h5.core.controller(window, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_NODE, e.message);
		}
		try {
			h5.core.controller($(window), controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_NODE, e.message);
		}
	});

	asyncTest('コントローラ内のthis', 3, function() {
		var lifecycleThis, eventHandlerThis, methodThis;
		var controller = {
			__name: 'TestController',
			__construct: function() {
				lifecycleThis = this;
			},
			'input click': function() {
				eventHandlerThis = this;
			},
			test: function(context) {
				methodThis = this;
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			strictEqual(lifecycleThis, c, '__construct内のthisはコントローラ自身を指しているか');
			$('#controllerTest input[type=button]').click();
			strictEqual(eventHandlerThis, c, 'イベントハンドラ内のthisはコントローラ自身を指しているか');
			this.test();
			strictEqual(methodThis, c, 'メソッド内のthisはコントローラ自身を指しているか');
			start();
		});
	});

	asyncTest('子コントローラのバインド', 2, function() {
		var result;
		var c = {
			__name: 'A',
			childController: {
				__name: 'B',
				'input[type=button] click': function(context) {
					result = true;
				}
			}
		};
		h5.core.controller('#controllerTest', c).readyPromise.done(function() {
			ok(this.childController.parentController, this,
					'子コントローラとして定義したオブジェクトががコントローラ化され、parentControllerが設定されていること');
			this.$find('input[type=button]').click();
			ok(result, '子コントローラで定義したイベントハンドラが動作すること');
			start();
		});
	});

	asyncTest('xxxControllerがnull,関数,undefinedの場合は子コントローラとして扱わず、エラーにならない', 4, function() {
		function f() {
		// 何もしない
		}
		var controller = {
			__name: 'TestController',
			aController: null,
			bControlelr: undefined,
			cController: f
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			ok(true, 'xxxControllerプロパティにnull,undefined,functionが設定されているコントローラをバインドできること');
			strictEqual(this.aController, null, '指定した値を取得できること');
			strictEqual(this.bController, undefined, '指定した値を取得できること');
			strictEqual(this.cController, f, '指定した値を取得できること');
			start();
		});
	});

	test('__name属性のないオブジェクトを子コントローラとしてバインドしようとするとエラーが出ること', 1, function() {
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		var controller = {
			__name: 'A',
			childController: {}
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			strictEqual(e.code, errorCode, e.message);
		}
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

	test('コントローラに渡す初期化パラメータがプレーンオブジェクトではない時の動作', 1, function() {
		var testController = {
			__name: 'TestController'
		};

		var instance = new (function() {
		//空コンストラクタ
		})();
		try {
			h5.core.controller('#controllerTest', testController, instance);
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
				strictEqual(e.code, ERR.ERR_CODE_CONTROLLER_ALREADY_CREATED,
						'コントローラ化済みのオブジェクトを渡すとエラーが発生したか');
			}
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('Controller - コントローラが上げるイベント', {
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
	asyncTest('h5controllerboundイベントの上がるタイミング', 3, function() {
		var callcount = 0;
		var controllerHandler = false;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				strictEqual(callcount, 1, '__readyの前にh5controllerboundが呼ばれること');
				ok(controllerHandler,
						'イベントの発火はイベントバインドが終わった後なので、自身のh5controllerreadyイベントをを自身のイベントハンドラで拾えること');
			},
			__childController: {
				__name: 'ChildController'
			},
			'{rootElement} h5controllerbound': function() {
				controllerHandler = true;
				start();
			}
		};
		function handler(event) {
			callcount++;
			$('body').unbind('h5controllerbound', handler);
		}
		var c = h5.core.controller('#controllerTest', controller);
		c.initPromise.done(function() {
			strictEqual(callcount, 0, 'initPromiseが終わった時点ではh5controllerboundは呼ばれていないこと');
		});
		$('body').bind('h5controllerbound', handler);
	});

	asyncTest('h5controllerboundイベントオブジェクト', 3, function() {
		var controller = {
			__name: 'TestController',
			__childController: {
				__name: 'ChildController'
			},
			'{rootElement} h5controllerbound': function(context) {
				var event = context.event;
				strictEqual(event.type, 'h5controllerbound',
						'イベントオブジェトのtypeがh5controllerboundであること');
				strictEqual(event.target, $('#controllerTest')[0],
						'イベントオブジェトのtargetがコントローラのバインド先であること');
				strictEqual(context.evArg, this, 'イベントハンドラの引数にルートコントローラのインスタンスが渡されること');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('__initで返したPromiseがrejectされた場合、h5controllerboundイベントは発生しないこと', 1, function() {
		var eventFired = false;
		var controller = {
			__name: 'TestController',
			'{rootElement} h5controllerbound': function(context) {
				eventFired = true;
			},
			__init: function() {
				var df = this.deferred();
				df.reject();
				return df.promise();
			},
			__dispose: function() {
				ok(!eventFired, 'h5controllerreadyイベントが発生していないこと');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('h5controllerreadyイベントの上がるタイミング', 3, function() {
		var callcount = 0;
		var controllerHandler = false;
		var controller = {
			__name: 'TestController',
			__childController: {
				__name: 'ChildController'
			},
			'{rootElement} h5controllerready': function() {
				controllerHandler = true;
			}
		};
		function handler(event, c) {
			callcount++;
			strictEqual(callcount, 1, 'readyPromiseが終わったらh5controllerreadyが呼ばれること');
			ok(controllerHandler,
					'イベントの発火はイベントバインドが終わった後なので、自身のh5controllerreadyイベントをを自身のイベントハンドラで拾えること');

			$('body').unbind('h5controllerready', handler);
			start();
		}
		h5.core.controller('#controllerTest', controller).readyPromise.done(function() {
			strictEqual(callcount, 0, 'readyPromise.doneの時点ではh5controllerreadyイベントは上がっていないこと');
		});
		$('body').bind('h5controllerready', handler);
	});

	asyncTest('h5controllerreadyイベントオブジェクト', 3, function() {
		var controller = {
			__name: 'TestController',
			__childController: {
				__name: 'ChildController'
			},
			'{rootElement} h5controllerready': function(context) {
				var event = context.event;
				strictEqual(event.type, 'h5controllerready',
						'イベントオブジェトのtypeがh5controllerreadyであること');
				strictEqual(event.target, $('#controllerTest')[0],
						'イベントオブジェトのtargetがコントローラのバインド先であること');
				strictEqual(context.evArg, this, 'イベントハンドラの引数にルートコントローラのインスタンスが渡されること');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('__readyで返したPromiseがrejectされた場合、h5controllerreadyイベントは発生しないこと', 1, function() {
		var eventFired = false;
		var controller = {
			__name: 'TestController',
			'{rootElement} h5controllerready': function(context) {
				eventFired = true;
			},
			__ready: function() {
				var df = this.deferred();
				df.reject();
				return df.promise();
			},
			__dispose: function() {
				ok(!eventFired, 'h5controllerreadyイベントが発生していないこと');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('h5controllerunboundイベントの上がるタイミング', 4, function() {
		var callcount = 0;
		var controllerHandler = false;
		var controller = {
			__name: 'TestController',
			__childController: {
				__name: 'ChildController'
			},
			__unbind: function() {
				strictEqual(callcount, 0, '__unbindの時点ではh5controllerunboundイベントは上がっていないこと');
			},
			'{rootElement} h5controllerunbound': function() {
				controllerHandler = true;
			}
		};
		function handler(event, c) {
			callcount++;
		}
		h5.core.controller('#controllerTest', controller).readyPromise.done(function() {
			strictEqual(callcount, 0, 'unbind()を呼ぶ前にh5controllerunboundイベントは上がっていないこと');
			this.unbind();
			strictEqual(callcount, 1, 'unbind()を呼ぶとh5coontrollerunboundイベントがあがること');
			ok(!controllerHandler,
					'自身がunbindされた時、コントローラがh5controllerunboundにバインドしたハンドラはunbind済みなので動作しないこと');
			$(document.body).unbind('h5controllerunbound', handler);
			start();
		});
		$(document.body).bind('h5controllerunbound', handler);
	});

	asyncTest('h5controllerunboundイベントオブジェクト', 3,
			function() {
				var controller = {
					__name: 'TestController',
					__childController: {
						__name: 'ChildController'
					}
				};
				function handler(event, c) {
					var event = event;
					strictEqual(event.type, 'h5controllerunbound',
							'イベントオブジェトのtypeがh5controllerunboundであること');
					strictEqual(event.target, $('#controllerTest')[0],
							'イベントオブジェトのtargetがコントローラのバインド先であること');
					strictEqual(c, c, 'イベントハンドラの引数にルートコントローラのインスタンスが渡されること');
					$(document.body).unbind('h5controllerunbound', handler);
					start();
				}
				var c = h5.core.controller('#controllerTest', controller);
				c.readyPromise.done(function() {
					this.unbind();
				});
				$(document.body).bind('h5controllerunbound', handler);
			});

	//=============================
	// Definition
	//=============================
	module('Controller - イベントハンドラ', {
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
	asyncTest('イベントハンドラの動作', 4, function() {
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append('<input type="button" />');
		var result;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.$find('input[type=button]').trigger('click');
				ok(result, '__readyの時点でイベントハンドラが動作していること');
				result = false;

				var $newTarget = $('<input type="button"/>');
				$(this.rootElement).append($newTarget);
				$newTarget.click();
				ok(result, '新しく追加した要素がセレクタにマッチした場合にハンドラが動作すること(delegateを使ってバインドされていること)');
				result = false;

				$('#qunit-fixture').append($newTarget);
				$newTarget.click();
				ok(!result, 'コントローラのバインド範囲外の要素のイベントでハンドラは動作しないこと');
				result = false;

				this.unbind();
				this.$find('input[type=button]').trigger('click');
				ok(!result, 'unbindするとイベントハンドラは動作しなくなること');
				start();
			},
			'input[type=button] click': function(context) {
				result = true;
			}
		};
		h5.core.controller($controllerTarget, controller);
	});

	asyncTest('イベントハンドラの動作 直接バインド記法', 3, function() {
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append('<input type="button" />');
		var result;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.$find('input[type=button]').trigger('click');
				ok(result, 'イベントハンドラが動作していること');
				result = false;

				var $newTarget = $('<input type="button"/>');
				$(this.rootElement).append($newTarget);
				$newTarget.click();
				ok(!result, '新しく追加した要素のイベントでハンドラは動作しないこと(bindを使ってバインドされていること)');
				result = false;

				this.unbind();
				this.$find('input[type=button]').trigger('click');
				ok(!result, 'unbindするとイベントハンドラは動作しなくなること');
				start();
			},
			'input[type=button] [click]': function(context) {
				result = true;
			}
		};
		h5.core.controller($controllerTarget, controller);
	});

	asyncTest('イベントハンドラの動作 {}記法で外側の要素を含めて指定', 8, function() {
		var $eventTarget1 = $('<div id="target1" class="event-target">');
		var $eventTarget2 = $('<div id="target2" class="event-target">');
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append($eventTarget1);
		$controllerTarget.after($eventTarget2);
		var result1 = false;
		var result2 = false;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				$eventTarget1.click();
				ok(result1, '.event-targetにバインドしたイベントハンドラが動作していること');
				ok(result2, '{.event-target}にバインドしたイベントハンドラが動作していること');
				result1 = result2 = false;
				$eventTarget2.click();
				ok(!result1, '.event-targetにバインドしたイベントハンドラは動作しないこと');
				ok(result2, '{.event-target}にバインドしたイベントハンドラが動作していること');
				result1 = result2 = false;

				var $newTarget = $('<div id="target3" class="event-target">');
				$('#qunit-fixture').append($newTarget);
				$newTarget.click();
				ok(result2, '新しく追加した要素がセレクタにマッチすればイベントハンドラが動作すること');
				result2 = false;

				this.unbind();
				result1 = result2 = false;
				$eventTarget1.click();
				ok(!result1, 'unbindすると.event-targetにバインドしたイベントハンドラが動作しないこと');
				ok(!result2, 'unbindすると{.event-target}にバインドしたイベントハンドラが動作しないこと');
				result1 = result2 = false;
				$eventTarget2.click();
				ok(!result2, 'unbindすると{.event-target}にバインドしたイベントハンドラが動作しないこと');
				start();
			},
			'.event-target click': function() {
				result1 = true;
			},
			'{.event-target} click': function() {
				result2 = true;
			}
		};
		h5.core.controller($controllerTarget, controller);
	});

	asyncTest('イベントハンドラの動作 {rootElement}を指定', 2, function() {
		var $controllerTarget = $('#controllerTest');
		var result = false;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				$controllerTarget.click();
				ok(result, '{rootElement}にバインドしたイベントハンドラが動作していること');
				this.unbind();
				result = false;
				$controllerTarget.click();
				ok(!result, 'unbindするとイベントハンドラは動作しなくなること');

				start();
			},
			'{rootElement} click': function(context) {
				result = true;
			}
		};
		h5.core.controller($controllerTarget, controller);
	});

	asyncTest('イベントハンドラの動作 window,document,navigator以下にあるオブジェクトへのバインド', 6, function() {
		var $eventTarget = $('<div id="target1">');
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append($eventTarget);
		window.h5test1 = {
			target: $eventTarget
		};
		var eventDispatcher = {};
		h5.mixin.eventDispatcher.mix(eventDispatcher);
		navigator.h5test1 = eventDispatcher;
		var winResult, docResult, navResult;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.$find('#target1').click();
				eventDispatcher.dispatchEvent({
					type: 'myevent'
				});
				ok(winResult, '{window.h5test1.target}にバインドしたイベントハンドラが動作していること');
				ok(docResult, '{document.body}にバインドしたイベントハンドラが動作していること');
				ok(navResult, '{navigator.target}にバインドしたイベントハンドラが動作していること');
				this.unbind();
				winResult = docResult = navResult = false;
				eventDispatcher.dispatchEvent({
					type: 'myevent'
				});
				this.$find('#target1').click();
				ok(!winResult, 'unbindすると{window.h5test1.target}にバインドしたイベントハンドラは動作しなくなること');
				ok(!docResult, 'unbindすると{document.body}にバインドしたイベントハンドラは動作しなくなること');
				ok(!navResult, 'unbindすると{navigator.target}にバインドしたイベントハンドラは動作しなくなること');

				// テストで作成したプロパティを削除
				deleteProperty(window, 'h5test1');
				deleteProperty(navigator, 'h5test1');
				start();
			},
			'{window.h5test1.target} click': function(context) {
				winResult = true;
			},
			'{document.body} click': function(context) {
				docResult = true;
			},
			'{navigator.h5test1} myevent': function(context) {
				navResult = true;
			}
		};
		h5.core.controller($controllerTarget, controller);
	});

	asyncTest('コントローラの作成と要素へのバインド セレクタ、イベントの前後にスペースがあってもイベントハンドリングできること', 9, function() {
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append('<input type="button" /><div id="a"><div class="b"></div></div>');
		var result;
		function handler() {
			result = true;
		}

		var controller = {
			__name: 'TestController',
			' input[type=button] click': handler,
			'  input[type=button]  dblclick       ': handler,
			' #a .b click1': handler,
			'      #a .b    click2 ': handler,
			'      #a    .b  click3': handler,
			' {#a .b} click4': handler,
			' { #a .b}    click5': handler,
			' { #a  .b} click6   ': handler,
			'  {   #a    .b    }    click7   ': handler
		};

		h5.core.controller($controllerTarget, controller).readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			ok(result, '前後にスペースがあってもイベントハンドラが動作すること');
			result = false;

			$('#controllerTest input[type=button]').dblclick();
			ok(result, '前後にスペースがあってもイベントハンドラが動作すること');
			result = false;

			for (var i = 1; i <= 7; i++) {
				$('#controllerTest #a .b').trigger('click' + i);
				ok(result, '前後にスペースがあってもイベントハンドラが動作すること');
				result = false;
			}
			start();
		});
	});

	test('"{this} eventName"の指定はエラーになってコントローラをバインドできない', 1, function() {
		var errorController = {
			__name: 'ErrorController',
			'{this} click': function(context) {
			// nothing to do
			}
		};
		try {
			h5.core.controller('body', errorController);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_EVENT_HANDLER_SELECTOR_THIS,
					'セレクタに{this}が指定された時にエラーが発生するか');
		}
	});

	asyncTest('"{this.target} xxx"でコントローラの持つオブジェクトにバインドできること', 3, function() {
		var target = {};
		var executed;
		h5.mixin.eventDispatcher.mix(target);
		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			target: target,
			'{this.target} [myevent1]': function() {
				executed = true;
			},
			'{this.target} myevent2': function() {
				executed = true;
			}
		}).readyPromise.done(function() {
			this.target.dispatchEvent({
				type: 'myevent1'
			});
			ok(executed, '直接バインド記法でバインドしたthis.targetのイベントハンドラが動作すること');
			executed = false;
			this.target.dispatchEvent({
				type: 'myevent2'
			});
			ok(executed, '直接バインド記法でない場合もthis.targetのイベントハンドラが動作すること');
			executed = false;
			this.unbind();

			this.target.dispatchEvent({
				type: 'myevent1'
			});
			ok(!executed, 'コントローラをunbindするとイベントハンドラは動作しないこと');

			start();
		});
	});

	asyncTest('セレクタが {document}, {window} の場合にイベント名の記述に関わらず、bindが使用されているか', 8, function() {
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
			strictEqual(ret2, 2, 'セレクタが{document}の場合、イベント名に"[]"があってもbindが使用されているか');
			strictEqual(ret1, 1, 'セレクタが{window}の場合、イベント名に"[]"がなくてもbindが使用されているか');
			strictEqual(ret2, 2, 'セレクタが{window}の場合、イベント名に"[]"があってもbindが使用されているか');

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

	asyncTest('mousewheelイベントハンドラが動作すること', 2, function() {
		var result;
		var testController = {
			__name: 'TestController',

			'{rootElement} mousewheel': function(context) {
				result = true;
			}
		};
		var c = h5.core.controller('#controllerTest', testController);
		c.readyPromise.done(function() {
			dispatchMouseWheelEvent($('#controllerTest')[0], 120);
			ok(result, 'mousewheelハンドラが動作すること');
			result = false;
			c.unbind();
			ok(!result, 'コントローラのアンバインドでmousewheelハンドラがアンバインドされていること');
			start();
		});
	});

	asyncTest(
			'[browser#ie:-8|ie:9-:docmode=7-8|ie-wp:9:docmode=7]mousewheelイベントハンドラにwheelDeltaが正負正しく格納されていること',
			2, function() {
				var isPositiveValue = false;
				var testController = {
					__name: 'TestController',

					'{rootElement} mousewheel': function(context) {
						ok(isPositiveValue ? context.event.wheelDelta > 0
								: context.event.wheelDelta < 0, 'wheelDeltaに値格納されていて、正負が正しいこと');
					}
				};
				var c = h5.core.controller('#controllerTest', testController);
				c.readyPromise.done(function() {
					isPositiveValue = true;
					dispatchMouseWheelEvent($('#controllerTest')[0], 120);
					isPositiveValue = false;
					dispatchMouseWheelEvent($('#controllerTest')[0], -120);
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
	//=============================
	// Definition
	//=============================
	module('Controller - イベントハンドラのcontextオブジェクト', {
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
	asyncTest('context.eventにjQueryイベントオブジェクトが格納されること', 1, function() {
		var jQueryEvent, contextEvent;
		$('#controllerTest').bind('click', function(e) {
			jQueryEvent = e;
		});
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			'{rootElement} click': function(context) {
				contextEvent = context.event;
			}
		});
		c.readyPromise.done(function() {
			$('#controllerTest').trigger('click');
			strictEqual(contextEvent, jQueryEvent, 'context.eventにjQueryイベントオブジェクトが格納されていること');
			start();
		});
	});

	asyncTest('jQueryのtriggerによるイベントのトリガで、context.evArgに引数が格納されること', 6, function() {
		var evArg = "初期値";
		var triggered = false;
		h5.core.controller('#controllerTest', {
			__name: 'Test1Controller',

			__ready: function() {
				$('#controllerTest').trigger('click');
				ok(triggered, 'イベントをトリガできること');
				strictEqual(evArg, undefined, '引数を渡していない時はevArgはundefinedであること');

				var obj = {
					message: 'dispatchTest'
				};
				$('#controllerTest').trigger('click', obj);
				strictEqual(evArg, obj, 'triggerの第2引数がevArgに格納されていること');

				var ary = [1, [1, 2], 3];
				$('#controllerTest').trigger('click', ary);
				deepEqual(evArg, ary, 'triggerで配列で渡した時にevArgに中身の同じ配列が格納されていること');

				$('#controllerTest').trigger('click', [ary]);
				strictEqual(evArg, ary, '要素が１つの配列を渡した時、その配列の中身がevArgに格納されていること');

				$('#controllerTest').trigger('click', null);
				strictEqual(evArg, undefined, '引数にnull渡した時、evArgはnullであること');

				start();
			},

			'{rootElement} click': function(context) {
				triggered = true;
				evArg = context.evArg;
			}
		});
	});

	asyncTest(
			'context.selectorとselectorTypeが取得できること',
			19,
			function() {
				$('#qunit-fixture')
						.append(
								'<div id="controllerTest3"><input type="button" class="testclass" value="click" /><div id="test"><div id="innertest"  class="innerdiv"></div></div></div>');
				$('#qunit-fixture').append('<div id="controllerTest4"></div>');

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
					start();
				});
			});

	//=============================
	// Definition
	//=============================
	module(
			'イベントハンドラの第2引数',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="parent"><div id="child"></div></div></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.listenerElementType = this.originalListenerElementType;
				},
				originalListenerElementType: h5.settings.listenerElementType
			});

	//=============================
	// Body
	//=============================
	asyncTest('イベントをバインド指定した要素が第二引数に渡されること', 14, function() {
		var parentElm = $('#controllerTest #parent')[0];
		var childElm = $('#controllerTest #child')[0];
		window.h5test1 = {
			target: parentElm
		};
		// navigator以下にEventDispatcherのMixInを持たせる
		var eventDispatcher = {};
		h5.mixin.eventDispatcher.mix(eventDispatcher);
		navigator.h5test1 = eventDispatcher;
		var controller = {
			__name: 'TestController',
			'#child click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], childElm, '第二引数がバインド先の要素であること');
			},
			'#parent click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], parentElm, '第二引数がバインド先の要素であること');
			},
			'{rootElement} click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], this.rootElement, '第二引数がバインド先の要素(rootElement)であること');
			},
			'{document} click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], document, '第二引数がバインド先の要素(document)であること');
			},
			'{navigator.h5test1} myevent': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], navigator.h5test1,
						'第二引数がバインド先のEventDispatcherオブジェクト(navigator.target)であること');
			},
			'{window} click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], window, '第二引数がバインド先の要素(window)であること');
			},
			'{window.h5test1.target} click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], window.h5test1.target,
						'第二引数がバインド先の要素(window.h5test1.parentElm)であること');
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			$('#child').click();
			eventDispatcher.dispatchEvent({
				type: 'myevent'
			});
			deleteProperty(window, 'h5test1');
			deleteProperty(navigator, 'h5test1');
			start();
		});
	});

	asyncTest('子要素でイベントが発生した場合、バインド指定した要素が第二引数に渡されること', 2, function() {
		var parentElm = $('#controllerTest #parent')[0];
		var controller = {
			__name: 'TestController',
			'#parent click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], parentElm, '第二引数がバインド先の要素であること');
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			$('#child').click();
			start();
		});
	});

	asyncTest('listenerElementTypeの変更', 1, function() {
		var parentElm = $('#controllerTest #parent')[0];
		var controller = {
			__name: 'TestController',
			'#parent click': function(context, el) {
				strictEqual(el, parentElm,
						'listenerElementType = 0 の時、第二引数がバンド先のDOM要素(≠jQueryオブジェクト)であること');
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			h5.settings.listenerElementType = 0;
			$('#parent').click();
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module(
			'Controller - イベントハンドラ - h5trackイベント',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div class="touch"></div><div id="controllerTest"><div id="child1"></div><div class="touch"></div></div>');
				},
				teardown: function() {
					clearController();
				}
			});

	//=============================
	// Body
	//=============================
	// タッチでのテストとマウスでのテストを両方行う(無い場合はabortTestして、成功扱いでスキップ)。
	// テスト関数はgetH5trackTestCheckXXXXにマウスイベントかタッチイベントかを引数に渡して取得する
	asyncTest('h5track*イベントハンドラを、mouseイベントのトリガで発火させたときにcontext.evArgに引数が格納されること。', 6,
			getH5trackTestCheckEvArg(mouseTrackEvents));
	asyncTest('h5track*イベントハンドラを、touchイベントのトリガで発火させたときにcontext.evArgに引数が格納されること。', 6,
			getH5trackTestCheckEvArg(touchTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckDispatchEvent(mouseTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でtouchイベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckDispatchEvent(touchTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントに直接バインド記法でバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckDirectBindDispatchEvent(mouseTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でtouchイベントを発火させたときに、ルートエレメントに直接バインド記法でバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckDirectBindDispatchEvent(touchTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, getH5trackTestCheckDispatchEventDxDy(mouseTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でtouchイベントを発火させたときに、ルートエレメントにバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, getH5trackTestCheckDispatchEventDxDy(touchTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckChildEvent(mouseTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でtouchイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントが正しい回数実行されること',
			3, getH5trackTestCheckChildEvent(touchTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でmouseイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, getH5trackTestCheckChildEventDxDy(mouseTrackEvents));
	asyncTest(
			'dispatchEvent(またはfireEvent)でtouchイベントを発火させたときに、ルートエレメントの子要素にバインドしたh5track*イベントに渡されるイベントオブジェクトのdx,dyに正しい値が格納されていること',
			4, getH5trackTestCheckChildEventDxDy(touchTrackEvents));
	asyncTest(
			'h5trackイベントハンドラがmouseイベントのトリガで実行され、h5trackstart、h5trackmove、h5trackendの順で発火し、それぞれのハンドラでポインタの位置情報を取得できること',
			26, getH5trackTestCheckPosition(mouseTrackEvents));
	asyncTest(
			'h5trackイベントハンドラがtouchイベントのトリガで実行され、h5trackstart、h5trackmove、h5trackendの順で発火し、それぞれのハンドラでポインタの位置情報を取得できること',
			26, getH5trackTestCheckPosition(touchTrackEvents));
	asyncTest(
			'[browser#ie:-8|ie:9-:docmode=7-8|ie-wp:9:docmode=7|and-and:0-2]SVG内要素にバインドしたコントローラでmouseイベントでh5trackイベントが実行されること ※SVGを動的に追加できないブラウザでは失敗します。',
			26, getH5trackTestCheckSVGPosition(mouseTrackEvents));
	asyncTest(
			'[browser#ie:-8|ie:9-:docmode=7-8|ie-wp:9:docmode=7|and-and:0-2]SVG内要素にバインドしたコントローラでtouchイベントでh5trackイベントが実行されること ※SVGを動的に追加できないブラウザでは失敗します。',
			26, getH5trackTestCheckSVGPosition(touchTrackEvents));
	asyncTest('親コントローラと子コントローラがh5trackイベントをバインドしているときにmouseイベントでh5trackイベントが正しい回数発生すること', 3,
			getH5trackTestCheckNumOfRuns(mouseTrackEvents));
	asyncTest('親コントローラと子コントローラがh5trackイベントをバインドしているときにtouchイベントでh5grackイベントが正しい回数発生すること', 3,
			getH5trackTestCheckNumOfRuns(touchTrackEvents));
	asyncTest('2つのコントローラが同一要素にh5trackイベントをバインドしているときにmouseイベントでh5trackイベントが正しい回数発生すること', 3,
			getH5trackTestCheckNumOfRunsAtSameElement(mouseTrackEvents));
	asyncTest('2つのコントローラが同一要素にh5trackイベントをバインドしているときにtouchイベントでh5trackイベントが正しい回数発生すること', 3,
			getH5trackTestCheckNumOfRunsAtSameElement(touchTrackEvents));
	asyncTest('mouseイベントとh5trackイベントを両方バインドした場合、両方のハンドラが動作すること', 6,
			getH5trackTestCheckOriginal(mouseTrackEvents));
	asyncTest('touchイベントとh5trackイベントを両方バインドした場合、両方のハンドラが動作すること', 6,
			getH5trackTestCheckOriginal(touchTrackEvents));
	asyncTest(
			'ルートエレメントより外のエレメントでmouse系イベントがstopPropagation()されていて、documentまでmouse系イベントがバブリングしない状態でも、h5trackイベントハンドラは実行されること',
			3, getH5trackTestCheckStopPropagation(mouseTrackEvents));
	asyncTest(
			'ルートエレメントより外のエレメントでtouch系イベントがstopPropagation()されていて、documentまでtouch系イベントがバブリングしない状態でも、h5trackイベントハンドラは実行されること',
			3, getH5trackTestCheckStopPropagation(touchTrackEvents));

	asyncTest(
			'touch-actionプロパティに対応しているブラウザについて、h5trackイベントハンドラを記述した要素にtouch-action(-ms-touch-action)プロパティが設定されること',
			2, function() {
				if (!touchActionProp) {
					// touch-action, -ms-touch-actionに対応していないブラウザなら中断
					abortTest();
					start();
					return;
				}
				h5.core.controller('#controllerTest', {
					__name: 'TouchActionTest',
					'.touch h5trackstart': function() {
					// 何もしない
					}
				}).readyPromise.done(function() {
					strictEqual(this.$find('.touch')[0].style[touchActionProp], 'none',
							touchActionProp + 'にnoneが設定されていること');
					strictEqual($('#qunit-fixture>.touch')[0].style[touchActionProp], '',
							'コントローラの範囲外(バインドの対象外)には影響がないこと');
					this.dispose();
					start();
				});
			});

	asyncTest(
			'touch-actionプロパティに対応しているブラウザについて、h5trackイベントハンドラを直接バインド記法で記述した要素にtouch-action(-ms-touch-action)プロパティが設定されること',
			2, function() {
				if (!touchActionProp) {
					// touch-action, -ms-touch-actionに対応していないブラウザなら中断
					abortTest();
					start();
					return;
				}
				h5.core.controller('#controllerTest', {
					__name: 'TouchActionTest',
					'.touch [h5trackstart]': function() {
					// 何もしない
					}
				}).readyPromise.done(function() {
					strictEqual(this.$find('.touch')[0].style[touchActionProp], 'none',
							touchActionProp + 'にnoneが設定されていること');
					strictEqual($('#qunit-fixture>.touch')[0].style[touchActionProp], '',
							'コントローラの範囲外(バインドの対象外)には影響がないこと');
					this.dispose();
					start();
				});
			});

	asyncTest(
			'touch-actionプロパティに対応しているブラウザについて、h5trackイベントハンドラをグローバルセレクタを使って記述した要素にtouch-action(-ms-touch-action)プロパティが設定されること',
			2, function() {
				if (!touchActionProp) {
					// touch-action, -ms-touch-actionに対応していないブラウザなら中断
					abortTest();
					start();
					return;
				}
				h5.core.controller('#controllerTest', {
					__name: 'TouchActionTest',
					'{.touch} h5trackstart': function() {
					// 何もしない
					}
				}).readyPromise.done(function() {
					strictEqual(this.$find('.touch')[0].style[touchActionProp], 'none',
							touchActionProp + 'にnoneが設定されていること');
					strictEqual($('#qunit-fixture>.touch')[0].style[touchActionProp], 'none',
							'コントローラの範囲外でバインドの対象である要素にも' + touchActionProp + 'にnoneが設定されていること');
					this.dispose();
					start();
				});
			});

	asyncTest(
			'touch-actionプロパティに対応しているブラウザについて、h5trackイベントハンドラを記述した要素のtouch-action(-ms-touch-action)プロパティにh5.settings.trackstartTouchActionの値が設定されること',
			1, function() {
				var defaultTouchAction = h5.settings.trackstartTouchAction;
				h5.settings.trackstartTouchAction = 'pan-x';
				if (!touchActionProp) {
					// touch-action, -ms-touch-actionに対応していないブラウザなら中断
					abortTest();
					start();
					return;
				}
				h5.core.controller('#controllerTest', {
					__name: 'TouchActionTest',
					'.touch h5trackstart': function() {
					// 何もしない
					}
				}).readyPromise.done(function() {
					strictEqual(this.$find('.touch')[0].style[touchActionProp], 'pan-x',
							touchActionProp + 'にpan-xが設定されていること');
					this.dispose();
					h5.settings.trackstartTouchAction = defaultTouchAction;
					start();
				});
			});

	asyncTest(
			'touch-actionプロパティに対応しているブラウザについて、h5.settings.trackstartTouchActionがnullの時にtouchAction(msTouchAction)プロパティに値は設定されないこと',
			2, function() {
				var defaultTouchAction = h5.settings.trackstartTouchAction;
				h5.settings.trackstartTouchAction = null;
				if (!touchActionProp) {
					// touch-action, -ms-touch-actionに対応していないブラウザなら中断
					abortTest();
					start();
					return;
				}
				$('#qunit-fixture>.touch')[0].style[touchActionProp] = 'pan-y';
				h5.core.controller('#controllerTest', {
					__name: 'TouchActionTest',
					'{.touch} h5trackstart': function() {
					// 何もしない
					}
				}).readyPromise.done(function() {
					strictEqual(this.$find('.touch')[0].style[touchActionProp], '', touchActionProp
							+ 'には何も値が設定されていないこと');
					strictEqual($('#qunit-fixture>.touch')[0].style[touchActionProp], 'pan-y',
							touchActionProp + 'にもともと値が設定されていた場合、値が変更されていないこと');
					this.dispose();
					h5.settings.trackstartTouchAction = defaultTouchAction;
					start();
				});
			});

	//=============================
	// Definition
	//=============================
	module('Controller - __meta', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
			h5.settings.commonFailHandler = undefined;
			h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
			h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
		},
		originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
		originalRetryCount: h5.settings.dynamicLoading.retryCount
	});

	//=============================
	// Body
	//=============================
	asyncTest('useHandlersにfalseを指定', 2, function() {
		var childExecuted = false;
		var importController = {
			__name: 'ImportController',
			'{rootElement} mouseover': function() {
				childExecuted = true;
			}
		};
		var rootExecuted = false;
		var controllerBase = {
			__name: 'TestController',
			__meta: {
				importController: {
					useHandlers: false
				}
			},
			importController: importController,
			'{rootElement} customEvent': function() {
				rootExecuted = true;
			}
		};

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest').mouseover();
			$('#controllerTest').trigger('customEvent');
			ok(!childExecuted, 'useHandlers:falseの設定されたコントローラのイベントハンドラは動作しないこと');
			ok(rootExecuted, '親コントローラのイベントハンドラは動作すること');
			start();
		});
	});

	asyncTest('useHandlersにtrueを指定', 2, function() {
		var childExecuted = false;
		var importController = {
			__name: 'ImportController',
			'{rootElement} mouseover': function() {
				childExecuted = true;
			}
		};
		var rootExecuted = false;
		var controllerBase = {
			__name: 'TestController',
			__meta: {
				importController: {
					useHandlers: true
				}
			},
			importController: importController,
			'{rootElement} customEvent': function() {
				rootExecuted = true;
			}
		};

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest').mouseover();
			$('#controllerTest').trigger('customEvent');
			ok(childExecuted, 'useHandlers:trueの設定されたコントローラのイベントハンドラは動作すること');
			ok(rootExecuted, '親コントローラのイベントハンドラは動作すること');
			start();
		});
	});

	asyncTest('useHandlersオプションを__readyが実行される前(postInitPromise.done時)にfalseにする', 2, function() {
		var childExecuted = false;
		var importController = {
			__name: 'ImportController',
			'{rootElement} mouseover': function() {
				childExecuted = true;
			}
		};
		var rootExecuted = false;
		var controllerBase = {
			__name: 'TestController',
			importController: importController,
			'{rootElement} customEvent': function() {
				rootExecuted = true;
			}
		};

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.postInitPromise.done(function() {
			this.__meta = {
				importController: {
					useHandlers: false
				}
			};
		});
		testController.readyPromise.done(function() {
			$('#controllerTest').mouseover();
			$('#controllerTest').trigger('customEvent');
			ok(!childExecuted, 'useHandlers:falseの設定されたコントローラのイベントハンドラは動作しないこと');
			ok(rootExecuted, '親コントローラのイベントハンドラは動作すること');
			start();
		});
	});

	asyncTest('rootElementを指定', 1, function() {
		var $child = $('<div id="child"></div>');
		$('#controllerTest').append($child);
		var rootElm = null;
		var testController = {
			__name: 'TestController',
			__meta: {
				childController: {
					rootElement: '#child'
				}
			},
			childController: {
				__name: 'ChildController',
				__init: function() {
					rootElm = this.rootElement;
				}
			}
		};

		h5.core.controller('#controllerTest', testController).readyPromise.done(function() {
			strictEqual(rootElm, $child[0], '__metaのrootElementで指定した要素がルートエレメントになっていること');
			start();
		});
	});

	asyncTest('rootElementに親コントローラのバインド先の外にある要素を指定', 1, function() {
		var $child1 = $('<div id="child1"></div>');
		var $child2 = $('<div id="child2"></div>');
		$('#controllerTest').append($child1, $child2);
		var rootElm = null;
		var testController = {
			__name: 'TestController',
			__meta: {
				childController: {
					rootElement: $child2
				}
			},
			childController: {
				__name: 'ChildController',
				__init: function() {
					rootElm = this.rootElement;
				}
			}
		};

		h5.core.controller($child1, testController).readyPromise.done(function() {
			strictEqual(rootElm, $child2[0], '__metaのrootElementで指定した要素がルートエレメントになっていること');
			start();
		});
	});

	asyncTest('rootElementにセレクタを指定した場合はルートエレメントから探索されること', 2, function() {
		var $child1 = $('<div class="child cls1"></div>');
		var $child2 = $('<div class="child cls2"></div>');
		var $child3 = $('<div class="child cls3"></div>');
		var $child4 = $('<div class="child cls4"></div>');
		$child1.append($child2.append($child3));
		$('#controllerTest').append($child1, $child4);
		var childRootElm = null;
		var grandChildRootElm = null;
		var testController = {
			__name: 'TestController',
			__meta: {
				childController: {
					rootElement: '>.child'
				}
			},
			childController: {
				__name: 'ChildController1',
				__init: function() {
					childRootElm = this.rootElement;
				},
				__meta: {
					childController: {
						rootElement: '>.child'
					}
				},
				childController: {
					__name: 'ChildController2',
					__init: function() {
						grandChildRootElm = this.rootElement;
					}
				}
			}
		};

		h5.core.controller($child1, testController).readyPromise
				.done(function() {
					strictEqual(childRootElm, $child2[0],
							'ルートエレメントから探索した要素が子コントローラのルートエレメントになっていること');
					strictEqual(grandChildRootElm, $child3[0],
							'ルートエレメントから探索した要素が子コントローラのルートエレメントになっていること');
					start();
				});
	});

	asyncTest('子コントローラのルートエレメントを親の__initでテンプレートで追加した要素にする', 1, function() {
		var a = {
			__name: 'A',
			__templates: 'template/test2.ejs',
			bController: {
				__name: 'B',
				__init: function() {
					strictEqual($(this.rootElement).attr('name'), 'table1',
							'親のテンプレートから追加した要素にバインドされていること');
				}
			},
			__meta: {
				bController: {}
			},
			__init: function() {
				this.view.append(this.rootElement, 'template2');
				this.__meta.bController.rootElement = this.$find('[name="table1"]');
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			start();
		});
	});

	asyncTest('子コントローラのルートエレメントを親の__initでテンプレートで追加した要素を選択するセレクタにする', 1, function() {
		var a = {
			__name: 'A',
			__templates: 'template/test2.ejs',
			bController: {
				__name: 'B',
				__init: function() {
					strictEqual($(this.rootElement).attr('name'), 'table1',
							'親のテンプレートから追加した要素にバインドされていること');
				}
			},
			__meta: {
				bController: {
					rootElement: '[name="table1"]'
				}
			},
			__init: function() {
				this.view.append(this.rootElement, 'template2');
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			start();
		});
	});

	asyncTest('rootElementにnullを指定', 1, function() {
		var bindTarget = $('#controllerTest')[0];
		var a = {
			__name: 'A',
			__templates: 'template/test2.ejs',
			bController: {
				__name: 'B',
				__init: function() {
					strictEqual(this.rootElement, bindTarget,
							'__metaに指定されたrootElementがnullの場合は親と同じrootElementになっていること');
				}
			},
			__meta: {
				bController: {
					rootElement: null
				}
			}
		};
		h5.core.controller(bindTarget, a).readyPromise.done(function() {
			start();
		});
	});

	asyncTest('rootElementにundefinedを指定', 1, function() {
		var bindTarget = $('#controllerTest')[0];
		var a = {
			__name: 'A',
			__templates: 'template/test2.ejs',
			bController: {
				__name: 'B',
				__init: function() {
					strictEqual(this.rootElement, bindTarget,
							'__metaに指定されたrootElementがundefinedの場合は親と同じrootElementになっていること');
				}
			},
			__meta: {
				bController: {
					rootElement: undefined
				}
			}
		};
		h5.core.controller(bindTarget, a).readyPromise.done(function() {
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('Controller - unbind', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');
		},
		teardown: function() {
			clearController();
			h5.settings.commonFailHandler = undefined;
			h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
			h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
		},
		originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
		originalRetryCount: h5.settings.dynamicLoading.retryCount
	});

	//=============================
	// Body
	//=============================
	asyncTest('コントローラをunbindするとイベントハンドラがアンバインドされる', 1, function() {
		var ret = '';
		var $inA = $('<div class="a"></div>');
		var $outA = $('<div class="a"></div>');
		$('#controllerTest').append($inA);
		$('#qunit-fixture').append($outA);
		window.eventTargetTest = {
			target: $('')
		};
		function handler(context) {
			ret += context.selector + ' ';
		}
		var controller = {
			__name: 'a',
			'.a click': handler,
			'{rootElement} click': handler,
			'{.a} click': handler,
			'{document} click': handler,
			'{window.eventTargetTest.target} click': handler,
			childController: {
				__name: 'b',
				'.a click': handler,
				'{rootElement} click': handler,
				'{.a} click': handler,
				'{document} click': handler,
				'{window.eventTargetTest.target} click': handler
			}
		};
		h5.core.controller('#controllerTest', controller).readyPromise.done(function() {
			this.unbind();
			$('.a').click();
			ok(!ret, 'unbindした後、イベントハンドラは1つも動作しないこと');
			deleteProperty(window, 'eventTargetTest');
			start();
		});
	});

	asyncTest('unbindで[eventName]のハンドラが削除できるか', 2, function() {
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

	asyncTest('子コントローラではunbind()はできないこと', 1, function() {
		var rootController = {
			__name: 'Root',
			childController: {
				__name: 'Child'
			}
		};

		var root = h5.core.controller('#controllerTest', rootController);
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

	// TODO コントローラがcontrollerManager管理下に置かれる前(__readyより前)にunbindした時の挙動の確認


	//=============================
	// Definition
	//=============================
	module('Controller - dispose', {
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
	asyncTest('コントローラのdispose', 3, function() {
		var handlerResult = false;
		function f() {
		// 何もしない関数
		}
		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			prop: 'A',
			__construct: f,
			__init: f,
			__postInit: f,
			__ready: f,
			method: f,
			'{rootElement} click': function() {
				handlerResult = true;
			},
			childController: {
				__name: 'ChildController'
			}
		}).readyPromise.done(function() {
			var c = this;
			var child = c.childController;
			var dp = c.dispose();
			dp.done(function() {
				ok(isDisposed(c), 'ルートコントローラのリソースはすべて削除(dispose)されていること');
				ok(isDisposed(child), '子コントローラのリソースはすべて削除(dispose)されていること');
				$('#controllerTest').click();
				ok(!handlerResult, 'イベントハンドラは動作しないこと');
				start();
			});
		});
	});

	asyncTest('子コントローラはdisposeできない', 3, function() {
		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			childController: {
				__name: 'ChildController'
			}
		}).readyPromise.done(function() {
			try {
				this.childController.dispose();
			} catch (e) {
				strictEqual(e.code, ERR.ERR_CODE_BIND_ROOT_ONLY, e.message);
			}
			ok(!isDisposed(this), 'コントローラはdisposeされていないこと');
			ok(!isDisposed(this.childController), '子コントローラはdisposeされていないこと');
			start();
		});
	});

	test('__constructで自分をdisposeできること', 2, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'ConstructDispose',
			__construct: function() {
				var dp = this.dispose();
				dp.done(this.own(function() {
					ok(isDisposed(this), 'コントローラがdisposeされていること');
				}));
			}
		});
		strictEqual(c, null, '__constructでdisposeするとh5.core.controllerの戻り値はnullであること');
	});

	test('__constructで自分をdisposeした時、コントローラの初期化処理は中断されること', 7, function() {
		var initExecuted, postInitExecuted, readyExecuted, childConstructExecuted;
		h5.core.controller('#controllerTest', {
			__name: 'ConstructDispose',
			__construct: function() {
				var initPromise = this.initPromise;
				var postInitPromise = this.postInitPromise;
				var readyPromise = this.readyPromise;
				this.dispose().done(function() {
					ok(isRejected(initPromise), 'initPromiseがrejectされること');
					ok(isRejected(postInitPromise), 'postInitPromiseがrejectされること');
					ok(isRejected(readyPromise), 'readyPromiseがrejectされること');
					ok(!childConstructExecuted, '子の__constructは実行されていないこと');
					ok(!initExecuted, '__initは実行されていないこと');
					ok(!postInitExecuted, '__postInitは実行されていないこと');
					ok(!readyExecuted, '__readyは実行されていないこと');
				});
			},
			__init: function() {
				initExecuted = true;
			},
			__postInit: function() {
				postInitExecuted = true;
			},
			__ready: function() {
				readyExecuted = true;
			},
			childCOntroller: {
				__construct: function() {
					childConstructExecuted = true;
				}
			}
		});
	});

	asyncTest('__initで自分をdisposeできること', 2, function() {
		h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				this.dispose();
			}
		}).readyPromise.fail(function() {
			var c = this;
			ok(!isDisposed(c), '__initでdisposeするとdisposeされる前にreadyPromiseのfailハンドラが実行されること');
			setTimeout(function() {
				ok(isDisposed(c), '__initでdisposeできること');
				start();
			}, 0);
		});
	});

	asyncTest('__initでルートコントローラをdisposeした時、コントローラの初期化処理は中断されること', 21, function() {
		var resultMap = {};
		h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				resultMap.root__init = true;
			},
			__postInit: function() {
				resultMap.root__postInit = true;
			},
			__ready: function() {
				resultMap.root__ready = true;
			},
			childController: {
				__name: 'child',
				__init: function() {
					resultMap.child__init = true;
					var root = this.rootController;
					var child = this;
					var grandChild = this.childController;

					var rootInitPromise = root.initPromise;
					var rootPostInitPromise = root.postInitPromise;
					var rootReadyPromise = root.readyPromise;
					var childInitPromise = child.initPromise;
					var childPostInitPromise = child.postInitPromise;
					var childReadyPromise = child.readyPromise;
					var grandChildInitPromise = grandChild.initPromise;
					var grandChildPostInitPromise = grandChild.postInitPromise;
					var grandChildReadyPromise = grandChild.readyPromise;

					// ルートコントローラをdispose
					root.dispose().done(
							function() {
								ok(isDisposed(root), 'ルートコントローラがdisposeされていること');
								ok(isDisposed(child), '子コントローラがdisposeされていること');
								ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');

								ok(resultMap.root__init, '親の__initは実行されていること');
								ok(isResolved(rootInitPromise), '親のinitPromiseはresolveされること');
								ok(!resultMap.root__postInit, '親の__postInitは実行されていないこと');
								ok(isRejected(rootPostInitPromise),
										'親のpostInitPromiseはrejectされていること');
								ok(!resultMap.root__ready, '親の__readyは実行されていないこと');
								ok(isRejected(rootReadyPromise), '親のreadyPromiseはrejectされていること');

								ok(resultMap.child__init, '子の__initは実行されていること');
								ok(isRejected(childInitPromise), '子のinitPromiseはrejectされること');
								ok(!resultMap.child__postInit, '子の__postInitは実行されていないこと');
								ok(isRejected(childPostInitPromise),
										'子のpostInitPromiseはrejectされていること');
								ok(!resultMap.child__ready, '子の__readyは実行されていないこと');
								ok(isRejected(childReadyPromise), '子のreadyPromiseはrejectされていること');

								ok(!resultMap.grandChild__init, '孫の__initは実行されていないこと');
								ok(isRejected(grandChildInitPromise), '孫のinitPromiseはrejectされること');
								ok(!resultMap.grandChild__postInit, '孫の__postInitは実行されていないこと');
								ok(isRejected(grandChildPostInitPromise),
										'孫のpostInitPromiseはrejectされていること');
								ok(!resultMap.grandChild__ready, '孫の__readyは実行されていないこと');
								ok(isRejected(grandChildReadyPromise),
										'孫のreadyPromiseはrejectされていること');

								start();
							});
				},
				__postInit: function() {
					resultMap.child__postInit = true;
				},
				__ready: function() {
					resultMap.child__ready = true;
				},
				childController: {
					__name: 'grandChild',
					__init: function() {
						resultMap.grandChild__init = true;
					},
					__postInit: function() {
						resultMap.grandChild__postInit = true;
					},
					__ready: function() {
						resultMap.grandChild__ready = true;
					}
				}
			}
		});
	});

	asyncTest('__postInitで自分をdisposeできること', 2, function() {
		h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__postInit: function() {
				this.dispose();
			}
		}).readyPromise.fail(function() {
			var c = this;
			ok(!isDisposed(c), '__postInitでdisposeするとdisposeされる前にreadyPromiseのfailハンドラが実行されること');
			setTimeout(function() {
				ok(isDisposed(c), '__postInitでdisposeできること');
				start();
			}, 0);
		});
	});

	asyncTest(
			'__postInitでルートコントローラをdisposeした時、コントローラの初期化処理は中断されること',
			21,
			function() {
				var resultMap = {};
				h5.core
						.controller(
								'#controllerTest',
								{
									__name: 'InitDispose',
									__init: function() {
										resultMap.root__init = true;
									},
									__postInit: function() {
										resultMap.root__postInit = true;
									},
									__ready: function() {
										resultMap.root__ready = true;
									},
									childController: {
										__name: 'child',
										__init: function() {
											resultMap.child__init = true;
										},
										__postInit: function() {
											resultMap.child__postInit = true;
											var root = this.rootController;
											var child = this;
											var grandChild = this.childController;

											var rootInitPromise = root.initPromise;
											var rootPostInitPromise = root.postInitPromise;
											var rootReadyPromise = root.readyPromise;
											var childInitPromise = child.initPromise;
											var childPostInitPromise = child.postInitPromise;
											var childReadyPromise = child.readyPromise;
											var grandChildInitPromise = grandChild.initPromise;
											var grandChildPostInitPromise = grandChild.postInitPromise;
											var grandChildReadyPromise = grandChild.readyPromise;

											// ルートコントローラをdispose
											root
													.dispose()
													.done(
															function() {
																ok(isDisposed(root),
																		'ルートコントローラがdisposeされていること');
																ok(isDisposed(child),
																		'子コントローラがdisposeされていること');
																ok(isDisposed(grandChild),
																		'孫コントローラがdisposeされていること');

																ok(resultMap.root__init,
																		'親の__initは実行されていること');
																ok(isResolved(rootInitPromise),
																		'親のinitPromiseはresolveされること');
																ok(!resultMap.root__postInit,
																		'親の__postInitは実行されていないこと');
																ok(isRejected(rootPostInitPromise),
																		'親のpostInitPromiseはrejectされていること');
																ok(!resultMap.root__ready,
																		'親の__readyは実行されていないこと');
																ok(isRejected(rootReadyPromise),
																		'親のreadyPromiseはrejectされていること');

																ok(resultMap.child__init,
																		'子の__initは実行されていること');
																ok(isResolved(childInitPromise),
																		'子のinitPromiseはresolveされること');
																ok(resultMap.child__postInit,
																		'子の__postInitは実行されていること');
																ok(
																		isRejected(childPostInitPromise),
																		'子のpostInitPromiseはrejectされていること');
																ok(!resultMap.child__ready,
																		'子の__readyは実行されていないこと');
																ok(isRejected(childReadyPromise),
																		'子のreadyPromiseはrejectされていること');

																ok(resultMap.grandChild__init,
																		'孫の__initは実行されていること');
																ok(
																		isResolved(grandChildInitPromise),
																		'孫のinitPromiseはresolveされること');
																ok(resultMap.grandChild__postInit,
																		'孫の__postInitは実行されていること');
																ok(
																		isResolved(grandChildPostInitPromise),
																		'孫のpostInitPromiseはresolveされていること');
																ok(!resultMap.grandChild__ready,
																		'孫の__readyは実行されていないこと');
																ok(
																		isRejected(grandChildReadyPromise),
																		'孫のreadyPromiseはrejectされていること');

																start();
															});
										},
										__ready: function() {
											resultMap.child__ready = true;
										},
										childController: {
											__name: 'grandChild',
											__init: function() {
												resultMap.grandChild__init = true;
											},
											__postInit: function() {
												resultMap.grandChild__postInit = true;
											},
											__ready: function() {
												resultMap.grandChild__ready = true;
											}
										}
									}
								});
			});

	asyncTest('__readyで自分をdisposeできること', 2, function() {
		h5.core.controller('#controllerTest', {
			__name: 'ReadyDispose',
			__ready: function() {
				this.dispose();
			}
		}).readyPromise.fail(function() {
			var c = this;
			ok(!isDisposed(c), '__readyでdisposeするとdisposeされる前にreadyPromiseのfailハンドラが実行されること');
			setTimeout(function() {
				ok(isDisposed(c), '__readyでdisposeできること');
				start();
			}, 0);
		});
	});

	asyncTest(
			'__readyでルートコントローラをdisposeした時、コントローラの初期化処理は中断されること',
			21,
			function() {
				var resultMap = {};
				h5.core
						.controller(
								'#controllerTest',
								{
									__name: 'InitDispose',
									__init: function() {
										resultMap.root__init = true;
									},
									__postInit: function() {
										resultMap.root__postInit = true;
									},
									__ready: function() {
										resultMap.root__ready = true;
									},
									childController: {
										__name: 'child',
										__init: function() {
											resultMap.child__init = true;
										},
										__postInit: function() {
											resultMap.child__postInit = true;
										},
										__ready: function() {
											resultMap.child__ready = true;
											var root = this.rootController;
											var child = this;
											var grandChild = this.childController;

											var rootInitPromise = root.initPromise;
											var rootPostInitPromise = root.postInitPromise;
											var rootReadyPromise = root.readyPromise;
											var childInitPromise = child.initPromise;
											var childPostInitPromise = child.postInitPromise;
											var childReadyPromise = child.readyPromise;
											var grandChildInitPromise = grandChild.initPromise;
											var grandChildPostInitPromise = grandChild.postInitPromise;
											var grandChildReadyPromise = grandChild.readyPromise;

											// ルートコントローラをdispose
											root
													.dispose()
													.done(
															function() {
																ok(isDisposed(root),
																		'ルートコントローラがdisposeされていること');
																ok(isDisposed(child),
																		'子コントローラがdisposeされていること');
																ok(isDisposed(grandChild),
																		'孫コントローラがdisposeされていること');

																ok(resultMap.root__init,
																		'親の__initは実行されていること');
																ok(isResolved(rootInitPromise),
																		'親のinitPromiseはresolveされること');
																ok(resultMap.root__postInit,
																		'親の__postInitは実行されていること');
																ok(isResolved(rootPostInitPromise),
																		'親のpostInitPromiseはresolveされていること');
																ok(!resultMap.root__ready,
																		'親の__readyは実行されていないこと');
																ok(isRejected(rootReadyPromise),
																		'親のreadyPromiseはrejectされていること');

																ok(resultMap.child__init,
																		'子の__initは実行されていること');
																ok(isResolved(childInitPromise),
																		'子のinitPromiseはresolveされること');
																ok(resultMap.child__postInit,
																		'子の__postInitは実行されていること');
																ok(
																		isResolved(childPostInitPromise),
																		'子のpostInitPromiseはresolveされていること');
																ok(resultMap.child__ready,
																		'子の__readyは実行されていること');
																ok(isRejected(childReadyPromise),
																		'子のreadyPromiseはrejectされていること');

																ok(resultMap.grandChild__init,
																		'孫の__initは実行されていること');
																ok(
																		isResolved(grandChildInitPromise),
																		'孫のinitPromiseはresolveされること');
																ok(resultMap.grandChild__postInit,
																		'孫の__postInitは実行されていること');
																ok(
																		isResolved(grandChildPostInitPromise),
																		'孫のpostInitPromiseはresolveされていること');
																ok(resultMap.grandChild__ready,
																		'孫の__readyは実行されていること');
																ok(
																		isResolved(grandChildReadyPromise),
																		'孫のreadyPromiseはresolveされていること');

																start();
															});
										},
										childController: {
											__name: 'grandChild',
											__init: function() {
												resultMap.grandChild__init = true;
											},
											__postInit: function() {
												resultMap.grandChild__postInit = true;
											},
											__ready: function() {
												resultMap.grandChild__ready = true;
											}
										}
									}
								});
			});

	asyncTest('preInitProimseのdoneハンドラの中で自身をdisposeできること', 2, function() {
		var controller = {
			__name: 'TestController'
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.fail(function() {
			ok(true, 'readyPromiseのfailが実行されること');
			setTimeout(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされていること');
				start();
			}, 0);
		});
		testController.preInitPromise.done(function() {
			this.dispose();
		});
	});

	asyncTest('preInitProimseのdoneハンドラで自身をdisposeした時、コントローラの初期化処理は中断されること', 19, function() {
		var resultMap = {};
		var c = h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				resultMap.root__init = true;
			},
			__postInit: function() {
				resultMap.root__postInit = true;
			},
			__ready: function() {
				resultMap.root__ready = true;
			},
			childController: {
				__name: 'child',
				__init: function() {
					resultMap.child__init = true;
				},
				__postInit: function() {
					resultMap.child__postInit = true;
				},
				__ready: function() {
					resultMap.child__ready = true;
				},
				childController: {
					__name: 'grandChild',
					__init: function() {
						resultMap.grandChild__init = true;
					},
					__postInit: function() {
						resultMap.grandChild__postInit = true;
					},
					__ready: function() {
						resultMap.grandChild__ready = true;
					}
				}
			}
		});
		c.childController.preInitPromise.done(function() {
			var root = this.rootController;
			var child = this;
			var grandChild = this.childController;

			var rootPostInitPromise = root.postInitPromise;
			var rootReadyPromise = root.readyPromise;
			var childInitPromise = child.initPromise;
			var childPostInitPromise = child.postInitPromise;
			var childReadyPromise = child.readyPromise;
			var grandChildInitPromise = grandChild.initPromise;
			var grandChildPostInitPromise = grandChild.postInitPromise;
			var grandChildReadyPromise = grandChild.readyPromise;

			// ルートコントローラをdispose
			root.dispose().done(function() {
				ok(isDisposed(root), 'ルートコントローラがdisposeされていること');
				ok(isDisposed(child), '子コントローラがdisposeされていること');
				ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');

				// 親と子のpreInitPromiseがresolveされる順番は不定なので、親の__initが実行されているかどうかは決まらない
				// 親のpostInitからチェックする
				ok(!resultMap.root__postInit, '親の__postInitは実行されていないこと');
				ok(isRejected(rootPostInitPromise), '親のpostInitPromiseはrejectされていること');
				ok(!resultMap.root__ready, '親の__readyは実行されていないこと');
				ok(isRejected(rootReadyPromise), '親のreadyPromiseはrejectされていること');

				ok(!resultMap.child__init, '子の__initは実行されていないこと');
				ok(isRejected(childInitPromise), '子のinitPromiseはrejectされること');
				ok(!resultMap.child__postInit, '子の__postInitは実行されていないこと');
				ok(isRejected(childPostInitPromise), '子のpostInitPromiseはrejectされていること');
				ok(!resultMap.child__ready, '子の__readyは実行されていないこと');
				ok(isRejected(childReadyPromise), '子のreadyPromiseはrejectされていること');

				ok(!resultMap.grandChild__init, '孫の__initは実行されていないこと');
				ok(isRejected(grandChildInitPromise), '孫のinitPromiseはrejectされること');
				ok(!resultMap.grandChild__postInit, '孫の__postInitは実行されていないこと');
				ok(isRejected(grandChildPostInitPromise), '孫のpostInitPromiseはrejectされていること');
				ok(!resultMap.grandChild__ready, '孫の__readyは実行されていないこと');
				ok(isRejected(grandChildReadyPromise), '孫のreadyPromiseはrejectされていること');

				start();
			});
		});
	});

	asyncTest('initProimseのdoneハンドラの中で自身をdisposeできること', 2, function() {
		var controller = {
			__name: 'TestController'
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.fail(function() {
			ok(true, 'readyPromiseのfailが実行されること');
			setTimeout(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされていること');
				start();
			}, 0);
		});
		testController.initPromise.done(function() {
			this.dispose();
		});
	});

	asyncTest('initProimseのdoneハンドラで自身をdisposeした時、コントローラの初期化処理は中断されること', 21, function() {
		var resultMap = {};
		var c = h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				resultMap.root__init = true;
			},
			__postInit: function() {
				resultMap.root__postInit = true;
			},
			__ready: function() {
				resultMap.root__ready = true;
			},
			childController: {
				__name: 'child',
				__init: function() {
					resultMap.child__init = true;
				},
				__postInit: function() {
					resultMap.child__postInit = true;
				},
				__ready: function() {
					resultMap.child__ready = true;
				},
				childController: {
					__name: 'grandChild',
					__init: function() {
						resultMap.grandChild__init = true;
					},
					__postInit: function() {
						resultMap.grandChild__postInit = true;
					},
					__ready: function() {
						resultMap.grandChild__ready = true;
					}
				}
			}
		});
		c.childController.initPromise.done(function() {
			var root = this.rootController;
			var child = this;
			var grandChild = this.childController;

			var rootInitPromise = root.initPromise;
			var rootPostInitPromise = root.postInitPromise;
			var rootReadyPromise = root.readyPromise;
			var childInitPromise = child.initPromise;
			var childPostInitPromise = child.postInitPromise;
			var childReadyPromise = child.readyPromise;
			var grandChildInitPromise = grandChild.initPromise;
			var grandChildPostInitPromise = grandChild.postInitPromise;
			var grandChildReadyPromise = grandChild.readyPromise;

			// ルートコントローラをdispose
			root.dispose().done(function() {
				ok(isDisposed(root), 'ルートコントローラがdisposeされていること');
				ok(isDisposed(child), '子コントローラがdisposeされていること');
				ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');

				ok(resultMap.root__init, '親の__initは実行されていること');
				ok(isResolved(rootInitPromise), '親のinitPromiseはresolveされること');
				ok(!resultMap.root__postInit, '親の__postInitは実行されていないこと');
				ok(isRejected(rootPostInitPromise), '親のpostInitPromiseはrejectされていること');
				ok(!resultMap.root__ready, '親の__readyは実行されていないこと');
				ok(isRejected(rootReadyPromise), '親のreadyPromiseはrejectされていること');

				ok(resultMap.child__init, '子の__initは実行されていること');
				ok(isResolved(childInitPromise), '子のinitPromiseはresolveされること');
				ok(!resultMap.child__postInit, '子の__postInitは実行されていないこと');
				ok(isRejected(childPostInitPromise), '子のpostInitPromiseはrejectされていること');
				ok(!resultMap.child__ready, '子の__readyは実行されていないこと');
				ok(isRejected(childReadyPromise), '子のreadyPromiseはrejectされていること');

				ok(!resultMap.grandChild__init, '孫の__initは実行されていないこと');
				ok(isRejected(grandChildInitPromise), '孫のinitPromiseはrejectされること');
				ok(!resultMap.grandChild__postInit, '孫の__postInitは実行されていないこと');
				ok(isRejected(grandChildPostInitPromise), '孫のpostInitPromiseはrejectされていること');
				ok(!resultMap.grandChild__ready, '孫の__readyは実行されていないこと');
				ok(isRejected(grandChildReadyPromise), '孫のreadyPromiseはrejectされていること');

				start();
			});
		});
	});

	asyncTest('postInitProimseのdoneハンドラの中で自身をdisposeできること', 2, function() {
		var controller = {
			__name: 'TestController'
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.fail(function() {
			ok(true, 'readyPromiseのfailが実行されること');
			setTimeout(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされていること');
				start();
			}, 0);
		});
		testController.postInitPromise.done(function() {
			this.dispose();
		});
	});

	asyncTest('postInitProimseのdoneハンドラで自身をdisposeした時、コントローラの初期化処理は中断されること', 21, function() {
		var resultMap = {};
		var c = h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				resultMap.root__init = true;
			},
			__postInit: function() {
				resultMap.root__postInit = true;
			},
			__ready: function() {
				resultMap.root__ready = true;
			},
			childController: {
				__name: 'child',
				__init: function() {
					resultMap.child__init = true;
				},
				__postInit: function() {
					resultMap.child__postInit = true;
				},
				__ready: function() {
					resultMap.child__ready = true;
				},
				childController: {
					__name: 'grandChild',
					__init: function() {
						resultMap.grandChild__init = true;
					},
					__postInit: function() {
						resultMap.grandChild__postInit = true;
					},
					__ready: function() {
						resultMap.grandChild__ready = true;
					}
				}
			}
		});
		c.childController.postInitPromise.done(function() {
			var root = this.rootController;
			var child = this;
			var grandChild = this.childController;

			var rootInitPromise = root.initPromise;
			var rootPostInitPromise = root.postInitPromise;
			var rootReadyPromise = root.readyPromise;
			var childInitPromise = child.initPromise;
			var childPostInitPromise = child.postInitPromise;
			var childReadyPromise = child.readyPromise;
			var grandChildInitPromise = grandChild.initPromise;
			var grandChildPostInitPromise = grandChild.postInitPromise;
			var grandChildReadyPromise = grandChild.readyPromise;

			// ルートコントローラをdispose
			root.dispose().done(function() {
				ok(isDisposed(root), 'ルートコントローラがdisposeされていること');
				ok(isDisposed(child), '子コントローラがdisposeされていること');
				ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');

				ok(resultMap.root__init, '親の__initは実行されていること');
				ok(isResolved(rootInitPromise), '親のinitPromiseはresolveされること');
				ok(!resultMap.root__postInit, '親の__postInitは実行されていないこと');
				ok(isRejected(rootPostInitPromise), '親のpostInitPromiseはrejectされていること');
				ok(!resultMap.root__ready, '親の__readyは実行されていないこと');
				ok(isRejected(rootReadyPromise), '親のreadyPromiseはrejectされていること');

				ok(resultMap.child__init, '子の__initは実行されていること');
				ok(isResolved(childInitPromise), '子のinitPromiseはresolveされること');
				ok(resultMap.child__postInit, '子の__postInitは実行されていること');
				ok(isResolved(childPostInitPromise), '子のpostInitPromiseはresolveされていること');
				ok(!resultMap.child__ready, '子の__readyは実行されていないこと');
				ok(isRejected(childReadyPromise), '子のreadyPromiseはrejectされていること');

				ok(resultMap.grandChild__init, '孫の__initは実行されていること');
				ok(isResolved(grandChildInitPromise), '孫のinitPromiseはresolveされること');
				ok(resultMap.grandChild__postInit, '孫の__postInitは実行されていること');
				ok(isResolved(grandChildPostInitPromise), '孫のpostInitPromiseはresolveされていること');
				ok(!resultMap.grandChild__ready, '孫の__readyは実行されていないこと');
				ok(isRejected(grandChildReadyPromise), '孫のreadyPromiseはrejectされていること');

				start();
			});
		});
	});

	asyncTest('readyProimseのdoneハンドラの中で自身をdisposeできること', 1, function() {
		var controller = {
			__name: 'TestController'
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var dp = this.dispose();
			dp.done(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされていること');
				start();
			});
		});
	});

	asyncTest('readyProimseのdoneハンドラで自身をdisposeした時、コントローラの初期化処理は中断されること', 21, function() {
		var resultMap = {};
		var c = h5.core.controller('#controllerTest', {
			__name: 'InitDispose',
			__init: function() {
				resultMap.root__init = true;
			},
			__postInit: function() {
				resultMap.root__postInit = true;
			},
			__ready: function() {
				resultMap.root__ready = true;
			},
			childController: {
				__name: 'child',
				__init: function() {
					resultMap.child__init = true;
				},
				__postInit: function() {
					resultMap.child__postInit = true;
				},
				__ready: function() {
					resultMap.child__ready = true;
				},
				childController: {
					__name: 'grandChild',
					__init: function() {
						resultMap.grandChild__init = true;
					},
					__postInit: function() {
						resultMap.grandChild__postInit = true;
					},
					__ready: function() {
						resultMap.grandChild__ready = true;
					}
				}
			}
		});
		c.childController.readyPromise.done(function() {
			var root = this.rootController;
			var child = this;
			var grandChild = this.childController;

			var rootInitPromise = root.initPromise;
			var rootPostInitPromise = root.postInitPromise;
			var rootReadyPromise = root.readyPromise;
			var childInitPromise = child.initPromise;
			var childPostInitPromise = child.postInitPromise;
			var childReadyPromise = child.readyPromise;
			var grandChildInitPromise = grandChild.initPromise;
			var grandChildPostInitPromise = grandChild.postInitPromise;
			var grandChildReadyPromise = grandChild.readyPromise;

			// ルートコントローラをdispose
			root.dispose().done(function() {
				ok(isDisposed(root), 'ルートコントローラがdisposeされていること');
				ok(isDisposed(child), '子コントローラがdisposeされていること');
				ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');

				ok(resultMap.root__init, '親の__initは実行されていること');
				ok(isResolved(rootInitPromise), '親のinitPromiseはresolveされること');
				ok(resultMap.root__postInit, '親の__postInitは実行されていること');
				ok(isResolved(rootPostInitPromise), '親のpostInitPromiseはresolveされていること');
				ok(!resultMap.root__ready, '親の__readyは実行されていないこと');
				ok(isRejected(rootReadyPromise), '親のreadyPromiseはrejectされていること');

				ok(resultMap.child__init, '子の__initは実行されていること');
				ok(isResolved(childInitPromise), '子のinitPromiseはresolveされること');
				ok(resultMap.child__postInit, '子の__postInitは実行されていること');
				ok(isResolved(childPostInitPromise), '子のpostInitPromiseはresolveされていること');
				ok(resultMap.child__ready, '子の__readyは実行されていること');
				ok(isResolved(childReadyPromise), '子のreadyPromiseはresolveされていること');

				ok(resultMap.grandChild__init, '孫の__initは実行されていること');
				ok(isResolved(grandChildInitPromise), '孫のinitPromiseはresolveされること');
				ok(resultMap.grandChild__postInit, '孫の__postInitは実行されていること');
				ok(isResolved(grandChildPostInitPromise), '孫のpostInitPromiseはresolveされていること');
				ok(resultMap.grandChild__ready, '孫の__readyは実行されていること');
				ok(isResolved(grandChildReadyPromise), '孫のreadyPromiseはresolveされていること');

				start();
			});
		});
	});

	asyncTest('__dispose()の実行順序をテスト', 3, function() {
		var ret = [];
		var childController = {
			__name: 'child',

			__dispose: function() {
				ret.push(this.__name);
			}
		};
		var controller = {
			__name: 'parent',

			childController: childController,

			__dispose: function() {
				ret.push(this.__name);
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			var cc = testController.childController;
			var dp = testController.dispose();

			dp.done(function() {
				strictEqual(ret.join(','), 'child,parent', '__disposeイベントは子から順に実行されること');
				ok(isDisposed(testController), 'ルートコントローラはdisposeされること');
				ok(isDisposed(cc), '子コントローラはdisposeされたこと');
				start();
			});
		});
	});

	asyncTest('__dispose()で、resolveされるpromiseを返す。', 3, function() {
		var childDfd = $.Deferred();
		var rootDfd = $.Deferred();
		var childController = {
			__name: 'ChildController',

			__dispose: function() {
				setTimeout(function() {
					childDfd.resolve();
				}, 0);
				return childDfd.promise();
			}
		};
		var controller = {
			__name: 'TestController',

			childController: childController,

			__dispose: function() {
				setTimeout(function() {
					rootDfd.resolve();
				}, 0);
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

	asyncTest('__dispose()で rejectされるpromiseを返す。', 3, function() {
		var childDfd = $.Deferred();
		var rootDfd = $.Deferred();

		var childController = {
			__name: 'ChildController',

			__dispose: function() {
				var that = this;
				setTimeout(function() {
					that.__name === 'ChildController';
					childDfd.resolve();
				}, 0);
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
				}, 0);
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

	//=============================
	// Definition
	//=============================
	module(
			'Controller - bind(コントローラの再利用)',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
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

	asyncTest('unbind: コントローラのアンバインド、再バインド', 11, function() {
		var disposeRet = null;
		var disposeRoot = null;
		var rebind = null;
		var exeUnbind = [];
		var childController = {
			__name: 'child',

			__unbind: function() {
				exeUnbind.push(this.__name);
			}
		};
		var controller = {
			__name: 'parent',

			childController: childController,

			__init: function(context) {
				rebind = context.args.param1;
			},

			__unbind: function() {
				disposeRet = 1;
				disposeRoot = this.rootElement;
				exeUnbind.push(this.__name);
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

			strictEqual(exeUnbind.join(','), 'child,parent', '__unbindハンドラは子から順に動作すること');

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

	asyncTest('bind: 子コントローラではbind()はできない', 1, function() {
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

	//=============================
	// Definition
	//=============================
	module(
			'Controller - テンプレート',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
	asyncTest('コントローラでテンプレートが使用できること', 1, function() {
		var controller = {
			__name: 'TestController',
			__templates: 'template/test2.ejs',
			__init: function() {
				this.view.append(this.rootElement, 'template2');
				ok(this.$find('table[name="table1"]')[0], 'テンプレートが__initの時点で使用できること');
				start();
			}
		};
		h5.core.controller('#controllerTest', controller);
	});

	asyncTest('h5.core.viewがない時のコントローラの動作', 2, function() {
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

	test('h5.core.viewがない時のコントローラの動作 テンプレートを指定されている場合はエラー', 1, function() {
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
			strictEqual(e.code, errorCode, e.message);
		}
		h5.core.view = view;
	});

	asyncTest('テンプレートのロードに失敗するとコントローラはdisposeされること', 3, function() {
		var count = 0;
		var errorCode = ERR_VIEW.ERR_CODE_TEMPLATE_AJAX;
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath']
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
			start();
		}).fail(function(e, opt) {
			ok(true, 'reaedyPromiseのfailハンドラが実行される');
			strictEqual(e.code, errorCode, e.message);
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子コントローラでテンプレートのロードに失敗するとコントローラはdisposeされること', 5, function() {
		var errorCode = ERR_VIEW.ERR_CODE_TEMPLATE_AJAX;
		var controller = {
			__name: 'TestController',
			childController: {
				__name: 'child',
				__templates: ['./noExistPath'],
				childController: {
					__name: 'grandChild'
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
			start();
		}).fail(function(e, opt) {
			ok(true, 'reaedyPromiseのfailハンドラが実行される');
			strictEqual(e.code, errorCode, e.message);
			// 自分以下のコントローラがdisposeされていることをチェック
			var test = this;
			var child = this.childController;
			var grandChild = child.childController;
			setTimeout(function() {
				ok(isDisposed(test), '親コントローラがdisposeされていること');
				ok(isDisposed(child), '子コントローラがdisposeされていること');
				ok(isDisposed(grandChild), '孫コントローラがdisposeされていること');
				start();
			}, 0);
		});
	});

	asyncTest('h5.settings.dynamicLoading.retryCountでテンプレートのロードのリトライ回数を設定できること', 2, function() {
		// テンプレートロードのリトライ時のインターバルを0msに設定
		h5.settings.dynamicLoading.retryInterval = 0;
		// リトライ回数を2回に設定
		h5.settings.dynamicLoading.retryCount = 2;
		// view.load()をスタブに差し替え
		var loadCount = 0;
		var errorObj = {
			detail: {
				error: {
					status: h5.env.ua.isIE ? 0 : 12029
				}
			}
		};
		function load() {
			loadCount++;
			var dfd = $.Deferred();
			dfd.reject(errorObj);
			return dfd.promise();
		}
		;
		var originalCreateView = h5.core.view.createView;
		h5.core.view.createView = function() {
			var view = originalCreateView();
			view.load = load;
			return view;
		};
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath']
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preInitPromise.done(function(a) {
			ok(false, 'ロードできないテンプレートを指定してコントローラのバインドが失敗しませんでした');
			h5.core.view.createView = originalCreateView;
			start();
		}).fail(function(e) {
			strictEqual(loadCount, 3, 'リトライ回数2回なのでロードを試みた回数は3回になっていること');
			strictEqual(e, errorObj, 'view.loadが投げたエラーオブジェクトが取得できること');
			h5.core.view.createView = originalCreateView;
			start();
		});
	});

	asyncTest('テンプレートのロードが通信エラーで失敗した場合、3回リトライして、3回目で成功したらコントローラ化が行われること', 2, function() {
		// テンプレートロードのリトライ時のインターバルを0msに設定
		h5.settings.dynamicLoading.retryInterval = 0;
		// view.load()をスタブに差し替え
		var retryCount = 0;
		var retryLimit = 3;
		var errorObj = {
			detail: {
				error: {
					status: h5.env.ua.isIE ? 0 : 12029
				}
			}
		};
		function load() {
			var dfd = $.Deferred();
			if (retryCount++ == retryLimit) {
				dfd.resolve();
			} else {
				dfd.reject(errorObj);
			}
			return dfd.promise();
		}
		var originalCreateView = h5.core.view.createView;
		h5.core.view.createView = function() {
			var view = originalCreateView();
			view.load = load;
			return view;
		};
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath']
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preInitPromise.done(function() {
			ok(true, 'preInitPromiseがresolve()されること');
		}).fail(function() {
			ok(false, 'テスト失敗。initPromiseがreject()された');
		});
		testController.readyPromise.done(function() {
			ok(true, 'readyPromiseがresolve()されること');
			h5.core.view.createView = originalCreateView;
			start();
		});
	});

	asyncTest('テンプレートのロードが通信エラーで失敗した場合、3回リトライして失敗ならpreInitPromiseのfailが呼ばれること', 7, function() {
		// テンプレートロードのリトライ時のインターバルを0msに設定
		h5.settings.dynamicLoading.retryInterval = 0;
		// view.load()をスタブに差し替え
		var retryCount = 0;
		var retryLimit = 3;
		var errorObj = {
			detail: {
				error: {
					status: h5.env.ua.isIE ? 0 : 12029
				}
			}
		};
		function load() {
			var dfd = $.Deferred();
			if (retryCount++ == retryLimit + 1) {
				dfd.resolve();
			} else {
				dfd.reject(errorObj);
			}
			return dfd.promise();
		}
		var originalCreateView = h5.core.view.createView;
		h5.core.view.createView = function() {
			var view = originalCreateView();
			view.load = load;
			return view;
		};
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./noExistPath']
		};

		var testController = h5.core.controller('#controllerTest', controller);

		testController.preInitPromise.done(function() {
			// createViewを元に戻す
			h5.core.view.createView = originalCreateView;
			ok(false, 'テスト失敗。preInitPromiseがresolve()された');
			start();
		}).fail(function(e) {
			// createViewを元に戻す
			h5.core.view.createView = originalCreateView;
			ok(true, 'preInitPromiseのfailハンドラが実行されること');
			strictEqual(this, testController, 'thisはコントローラインスタンスであること');
			strictEqual(e, errorObj, 'view.loadが投げたエラーオブジェクトが取得できること');
		});
		testController.readyPromise.fail(function(e) {
			ok(true, 'readyPromiseのfailハンドラが実行されること');
			strictEqual(this, testController, 'thisはコントローラインスタンスであること');
			strictEqual(e, errorObj, 'view.loadが投げたエラーオブジェクトが取得できること');
			setTimeout(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('テンプレートのロードが失敗したとき、commonFailHandlerのthisはコントローラインスタンス、引数はview.loadのエラーオブジェクトであること',
			2, function() {
				var childControllerDef = {
					__name: 'ChildController',
					__templates: 'dummy'
				};
				h5.settings.commonFailHandler = function(arg) {
					strictEqual(this, c, 'commonFailHandlerのthisはルートコントローラのインスタンスであること');
					strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
							'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
					h5.settings.commonFailHandler = undefined;
					start();
				};
				var c = h5.core.controller('#controllerTest', {
					__name: 'TestController',
					childController: childControllerDef
				});
			});

	asyncTest('テンプレートのコンパイルに失敗するとコントローラはdisposeされること', 4, function() {
		var count = 0;
		var controller = {
			__name: 'TestController',
			__templates: ['./template/test13.ejs?'],
			__construct: function(context) {
				ok(true, 'コンストラクタが実行される。');
			},
			__init: function(context) {
				ok(false, 'テスト失敗。__initが実行された');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
			start();
		}).fail(function(e) {
			ok(true, 'readyPromiseがreject()された');
			strictEqual(e.code, ERR_VIEW.ERR_CODE_TEMPLATE_COMPILE_SYNTAX_ERR, 'エラーコードが取得できること');
			setTimeout(function() {
				ok(isDisposed(testController), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('this.view.get()', 1, function() {
		var controller = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: ['./template/test8.ejs'],
			__ready: function() {
				strictEqual(this.view.get('template8'), '<span class="test">test</span>',
						'this.view.getでテンプレートからHTML文字列を取得できたか');
			}
		}).readyPromise.done(function() {
			this.unbind();
			start();
		});
	});

	asyncTest('this.view.append()', 2, function() {
		var controller = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: ['./template/test8.ejs'],
			__ready: function() {
				var $result = $('#controllerResult');
				$result.append('<div id="viewTest"></div>');
				var ret = this.view.append($result, 'template8');
				ok($('#viewTest').next().hasClass('test'), 'view.appendでテンプレートから取得したHTMLを追加できること');
				strictEqual(ret.get(0), $result.get(0), '戻り値は追加先のDOM要素(jQueryオブジェクトであること)');
			}
		}).readyPromise.done(function() {
			this.unbind();
			start();
		});
	});

	asyncTest('this.view.prepend()', 2, function() {
		var controller = h5.core
				.controller('#controllerTest',
						{
							__name: 'TestController',
							__templates: ['./template/test8.ejs'],
							__ready: function() {
								var $result = $('#controllerResult');
								$result.prepend('<div id="viewTest"></div>');
								var ret = this.view.prepend($result, 'template8');
								ok($('#viewTest').prev().hasClass('test'),
										'view.prependでテンプレートから取得したHTMLを追加できること');
								strictEqual(ret.get(0), $result.get(0),
										'戻り値は追加先のDOM要素(jQueryオブジェクトであること)');
							}
						}).readyPromise.done(function() {
			this.unbind();
			start();
		});
	});

	asyncTest('this.view.update()', 3, function() {
		var controller = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: ['./template/test8.ejs'],
			__ready: function() {
				var $result = $('#controllerResult');
				$result.append('<div id="viewTest"><span class="original-span"></span></div>');
				var ret = this.view.update('#viewTest', 'template8');
				ok(!$('#viewTest').children().hasClass('original-span'),
						'view.updateで指定した要素がもともと持っていた子要素は無くなっていること');
				ok($('#viewTest').children().hasClass('test'),
						'view.updateでテンプレートから取得したHTMLが指定した要素の子要素になること');
				strictEqual(ret.get(0), $('#viewTest').get(0), '戻り値は追加先のDOM要素(jQueryオブジェクトであること)');
			}
		}).readyPromise.done(function() {
			this.unbind();
			start();
		});
	});

	asyncTest('view.append()のターゲットは、コントローラのルートエレメントを起点に選択されること', 2, function() {
		$('#qunit-fixture').append('<span class="view-target outer-target"></span>');
		$('#controllerTest').append('<span class="view-target inner-target"></span>');
		h5.core.controller('#controllerTest', {
			__name: 'TestController'
		}).readyPromise.done(function() {
			this.view.register('test', 'test');
			this.view.append('.view-target', 'test');
			strictEqual($('.inner-target').text(), 'test', 'コントローラのルートエレメント内の要素にテンプレートが出力されていること');
			strictEqual($('.outer-target').text(), '', 'コントローラのルートエレメントの外の要素にテンプレートは出力されていないこと');
			start();
		});
	});

	asyncTest('view.append()のターゲット指定にグローバルセレクタが使用できること', 4, function() {
		var $qunit = $('#qunit-fixture');
		$qunit.append('<span class="outer-target"></span>');
		$qunit.append('<span class="controller-target1"></span>');
		$qunit.append('<span class="global-target1');
		window.h5test1 = {
			target: $('global-target1')
		};

		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			target: $('controller-target1')
		}).readyPromise
				.done(function() {
					this.view.register('test', 'test');
					this.view.append('{.outer-target}', 'test');
					strictEqual($('.outer-target').text(), 'test',
							'グローバルセレクタ使用でコントローラのルートエレメントの外側の要素を指定できること');

					this.view.append('{rootElement}', 'test');
					strictEqual($(this.rootElement).text(), 'test',
							'{rootElement}でコントローラのルートエレメントを指定できること');

					this.view.append('{this.target}', 'test');
					strictEqual($(this.rootElement).text(), 'test',
							'{this.target1}でコントローラの持つプロパティを指定できること');

					this.view.append('{window.h5test1.target}', 'test');
					strictEqual($(this.rootElement).text(), 'test',
							'{window.h5test1.target}でグローバルから辿れる要素を指定できること');

					deleteProperty(window, 'h5test1');
					start();
				});
	});

	asyncTest('view操作', 6, function() {
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

	asyncTest('テンプレートのカスケーディング1', 3, function() {
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
			// h5.core.viewに追加したテンプレートをクリア
			h5.core.view.clear('template3');
			testController.unbind();
			start();
		});
	});

	asyncTest('テンプレートのカスケーディング2', 1, function() {
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

	//=============================
	// Definition
	//=============================
	module(
			'Controller - ライフサイクルイベント',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
	asyncTest('ライフサイクルイベントの実行順序', 1, function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		var c = {
			__name: 'parent',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'child',
				__construct: construct,
				__init: init,
				__postInit: postInit,
				__ready: ready,
				cController: {
					__name: 'gchild',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', c).readyPromise.done(function() {
			deepEqual(result, ['parent__construct', 'child__construct', 'gchild__construct',
					'parent__init', 'child__init', 'gchild__init', 'gchild__postInit',
					'child__postInit', 'parent__postInit', 'gchild__ready', 'child__ready',
					'parent__ready'], 'コントローラの各ライフサイクルの実行順序が正しいこと');
			start();
		});
	});

	asyncTest('ライフサイクルイベントの実行順序(非同期)', 1, function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		function asyncConstruct() {
			var dfd = $.Deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__construct');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncInit() {
			var dfd = $.Deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__init');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncPostInit() {
			var dfd = $.Deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__postInit');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncReady() {
			var dfd = $.Deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__ready');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		var c = {
			__name: 'parent',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'child',
				__construct: asyncConstruct,
				__init: asyncInit,
				__postInit: asyncPostInit,
				__ready: asyncReady,
				cController: {
					__name: 'gchild',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', c).readyPromise.done(function() {
			deepEqual(result, ['parent__construct', 'gchild__construct', 'child__construct',
					'parent__init', 'child__init', 'gchild__init', 'gchild__postInit',
					'child__postInit', 'parent__postInit', 'gchild__ready', 'child__ready',
					'parent__ready'], 'ライフサイクルがプロミスを返して非同期で動作する場合、コントローラの各ライフサイクルの実行順序が正しいこと');
			start();
		});
	});

	asyncTest('テンプレート使用時のライフサイクルイベントの実行順序', 1, function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		var c = {
			__name: 'parent',
			__template: 'template/test2.ejs',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'child',
				__template: 'template/test3.ejs',
				__construct: construct,
				__init: init,
				__postInit: postInit,
				__ready: ready,
				cController: {
					__name: 'gchild',
					__template: 'template/test8.ejs',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', c).readyPromise.done(function() {
			deepEqual(result, ['parent__construct', 'child__construct', 'gchild__construct',
					'parent__init', 'child__init', 'gchild__init', 'gchild__postInit',
					'child__postInit', 'parent__postInit', 'gchild__ready', 'child__ready',
					'parent__ready'], 'テンプレートの指定されたコントローラがある場合、コントローラの各ライフサイクルの実行順序が正しいこと');
			start();
		});
	});

	asyncTest('テンプレート使用時のライフサイクルイベントの実行順序(子はテンプレートを持っていない場合)', 1, function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		var c = {
			__name: 'parent',
			__template: 'template/test2.ejs',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'child',
				__construct: construct,
				__init: init,
				__postInit: postInit,
				__ready: ready,
				cController: {
					__name: 'gchild',
					__template: 'template/test8.ejs',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', c).readyPromise.done(function() {
			deepEqual(result, ['parent__construct', 'child__construct', 'gchild__construct',
					'parent__init', 'child__init', 'gchild__init', 'gchild__postInit',
					'child__postInit', 'parent__postInit', 'gchild__ready', 'child__ready',
					'parent__ready'], 'テンプレートの指定されたコントローラがある場合、コントローラの各ライフサイクルの実行順序が正しいこと');
			start();
		});
	});

	asyncTest('__constructの時点で使用可能なコントローラのメソッドとプロパティ', 41, function() {
		var props = ['preInitPromise', 'initPromise', 'postInitPromise', 'readyPromise', 'view',
				'$find', 'bind', 'deferred', 'disableListeners', 'indicator', 'own', 'ownWithOrg',
				'throwCustomError', 'throwError', 'trigger', 'triggerIndicator', 'unbind',
				'isInit', 'isPostInit', 'isReady'];
		var length = props.length;
		function checkControllerProp(c) {
			for (var i = 0; i < length; i++) {
				var p = props[i];
				ok(c[p] != null, p);
			}
		}
		h5.core.controller('#controllerTest', {
			__name: 'Test',
			__construct: function() {
				checkControllerProp(this);
				strictEqual(this.rootElement, $('#controllerTest')[0],
						'ルートコントローラの場合、ルートエレメントが__constructの時点で設定されていること');
			},
			childController: {
				__name: 'Child',
				__construct: function() {
					checkControllerProp(this);
				}
			}
		}).readyPromise.done(start);
	});

	asyncTest('__initの時点でルートコントローラ、ルートエレメントが設定されていること', 4, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'Test',
			__init: function() {
				strictEqual(this.rootElement, $('#controllerTest')[0],
						'ルートエレメントが__initの時点で設定されていること');
				strictEqual(this.rootController, c, 'ルートコントローラが__initの時点で設定されていること');
			},
			childController: {
				__name: 'Child',
				__init: function() {
					strictEqual(this.rootElement, $('#controllerTest')[0],
							'ルートエレメントが__initの時点で設定されていること');
					strictEqual(this.rootController, c, 'ルートコントローラが__initの時点で設定されていること');
				}
			}
		});
		c.readyPromise.done(start);
	});

	asyncTest('コントローラの持つプロミスに登録したdoneハンドラのthisはコントローラインスタンスであること', 8, function() {
		var childControllerDef = {
			__name: 'ChildController',
			__construct: function() {
				this
			}
		};
		var child = null;
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__construct: function() {
				child = this.childController;
			},
			childController: childControllerDef
		});
		c.preInitPromise.done(function() {
			strictEqual(this, c, 'root preInit');
		});
		c.initPromise.done(function() {
			strictEqual(this, c, 'root init');
		});
		c.postInitPromise.done(function() {
			strictEqual(this, c, 'root postInit');
		});
		c.readyPromise.done(function() {
			strictEqual(this, c, 'root ready');
			start();
		});
		child.preInitPromise.done(function() {
			strictEqual(this, child, 'child preInit');
		});
		child.initPromise.done(function() {
			strictEqual(this, child, 'child init');
		});
		child.postInitPromise.done(function() {
			strictEqual(this, child, 'child postInit');
		});
		child.readyPromise.done(function() {
			strictEqual(this, child, 'child ready');
		});
	});

	asyncTest('コントローラの持つプロミスに登録したfailハンドラのthisはコントローラインスタンス、引数はエラーオブジェクトであること', 16, function() {
		var childControllerDef = {
			__name: 'ChildController',
			__templates: 'dummy'
		};
		var child = null;
		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__templates: 'dummy',
			__construct: function() {
				child = this.childController;
			},
			childController: childControllerDef
		});
		c.preInitPromise.fail(function(arg) {
			strictEqual(this, c, 'preInitPromiseのfailハンドラ:thisはコントローラインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		c.initPromise.fail(function(arg) {
			strictEqual(this, c, 'initPromiseのfailハンドラ:thisはコントローラインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		c.postInitPromise.fail(function(arg) {
			strictEqual(this, c, 'postInitPromiseのfailハンドラ:thisはコントローラインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		c.readyPromise.fail(function(arg) {
			strictEqual(this, c, 'readyPromiseのfailハンドラ:thisはコントローラインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
			start();
		});
		child.preInitPromise.fail(function(arg) {
			strictEqual(this, child, '子コントローラのpreInitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		child.initPromise.fail(function(arg) {
			strictEqual(this, child, '子コントローラのinitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		child.postInitPromise.fail(function(arg) {
			strictEqual(this, child, '子コントローラのpostInitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
		child.readyPromise.fail(function(arg) {
			strictEqual(this, child, '子コントローラのreadyPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
			strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
					'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
		});
	});

	asyncTest('ルートの__initが返すpromiseがrejectされる時の挙動', 5, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller'
			},
			__init: function() {
				setTimeout(function() {
					dfd.reject(1, 2);
				}, 0);
				return dfd.promise();
			},
			__postInit: function() {
				nextLifecycleExecuted = true;
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.initPromise.fail(function(e) {
			ok(true, 'initPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			ok(!nextLifecycleExecuted, 'rejectしなければ次に実行されるはずだったライフサイクルイベントは実行されないこと');
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('ルートの__postInitが返すpromiseがrejectされる時の挙動', 5, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller'
			},
			__postInit: function() {
				setTimeout(function() {
					dfd.reject(1, 2);
				}, 0);
				return dfd.promise();
			},
			__ready: function() {
				nextLifecycleExecuted = true;
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.postInitPromise.fail(function(e) {
			ok(true, 'postInitPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			ok(!nextLifecycleExecuted, 'rejectしなければ次に実行されるはずだったライフサイクルイベントは実行されないこと');
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('ルートの__readyが返すpromiseがrejectされる時の挙動', 4, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller'
			},
			__ready: function() {
				setTimeout(function() {
					dfd.reject(1, 2);
				}, 0);
				return dfd.promise();
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'readyPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子の__initが返すpromiseがrejectされる時の挙動', 7, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					setTimeout(function() {
						dfd.reject(1, 2);
					}, 0);
					return dfd.promise();
				},
				__postInit: function() {
					nextLifecycleExecuted = true;
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'readyPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			ok(!nextLifecycleExecuted, 'rejectしなければ次に実行されるはずだったライフサイクルイベントは実行されないこと');
			var child1 = c.child1Controller;
			var child2 = c.child2Controller;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child1), '子コントローラはdisposeされること');
				ok(isDisposed(child2), '子コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子の__postInitが返すpromiseがrejectされる時の挙動', 7, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			__postInit: function() {
				nextLifecycleExecuted = true;
			},
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller',
				__postInit: function() {
					setTimeout(function() {
						dfd.reject(1, 2);
					}, 0);
					return dfd.promise();
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'readyPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			ok(!nextLifecycleExecuted, 'rejectしなければ次に実行されるはずだったライフサイクルイベントは実行されないこと');
			var child1 = c.child1Controller;
			var child2 = c.child2Controller;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child1), '子コントローラはdisposeされること');
				ok(isDisposed(child2), '子コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子の__readyが返すpromiseがrejectされる時の挙動', 7, function() {
		var dfd = $.Deferred();
		var errorCode = ERR.ERR_CODE_CONTROLLER_REJECTED_BY_USER;
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				nextLifecycleExecuted = true;
			},
			child1Controller: {
				__name: 'child1Controller'
			},
			child2Controller: {
				__name: 'child2Controller',
				__ready: function() {
					setTimeout(function() {
						dfd.reject(1, 2);
					}, 0);
					return dfd.promise();
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'readyPromiseのfailハンドラが実行されること');
			strictEqual(e.code, errorCode, e.message);
			deepEqual(e.detail, [1, 2], 'rejectで渡された引数がエラーオブジェクトのdetailに格納されていること');
			ok(!nextLifecycleExecuted, 'rejectしなければ次に実行されるはずだったライフサイクルイベントは実行されないこと');
			var child1 = c.child1Controller;
			var child2 = c.child2Controller;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child1), '子コントローラはdisposeされること');
				ok(isDisposed(child2), '子コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('ライフサイクルイベントがjQueryオブジェクトを返した時にプロミスオブジェクトと判定されないこと', 1, function() {
		// jQueryオブジェクトはpromiseメソッドを持つが、jQueryオブジェクト自体はプロミスじゃないので、
		// 正しく判定できているかどうかのテスト (#234)
		var jQueryObj = $(document.body);
		var controller = {
			__name: 'TestController',
			__init: function() {
				return jQueryObj;
			}
		};
		h5.core.controller('#controllerTest', controller).readyPromise.done(function() {
			ok(true, '__initでjQueryオブジェクトを返していても、待機せずにコントローラ化されること');
			start();
		});
	});



	asyncTest(
			'各ライフサイクルイベントでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数と順序は正しいか(テンプレートなし)',
			function() {
				var cdfd = $.Deferred();
				var cRet = [];
				var cController = {
					__name: 'CController',

					__construct: function() {
						cRet.push('__construct');
					},

					__init: function() {
						cRet.push('__init');
					},

					__postInit: function() {
						cRet.push('__postInit');
					},

					__ready: function() {
						cRet.push('__ready');
						this.readyPromise.done(function() {
							cdfd.resolve();
						});
					}
				};

				var idfd = $.Deferred();
				var iRet = [];
				var iController = {
					__name: 'IController',

					__construct: function() {
						iRet.push('__construct');
					},

					__init: function() {
						iRet.push('__init');
					},

					__postInit: function() {
						iRet.push('__postInit');
					},

					__ready: function() {
						iRet.push('__ready');
						this.readyPromise.done(function() {
							idfd.resolve();
						});
					}
				};

				var pdfd = $.Deferred();
				var pRet = [];
				var pController = {
					__name: 'PController',

					__construct: function() {
						pRet.push('__construct');
					},

					__init: function() {
						pRet.push('__init');
					},

					__postInit: function() {
						pRet.push('__postInit');
					},

					__ready: function() {
						pRet.push('__ready');
						this.readyPromise.done(function() {
							pdfd.resolve();
						});
					}
				};

				var rdfd = $.Deferred();
				var rRet = [];
				var rController = {
					__name: 'RController',

					__construct: function() {
						rRet.push('__construct');
					},

					__init: function() {
						rRet.push('__init');
					},

					__postInit: function() {
						rRet.push('__postInit');
					},

					__ready: function() {
						rRet.push('__ready');
						this.readyPromise.done(function() {
							rdfd.resolve();
						});
					}
				};

				var testController = {
					__name: 'TestController',
					cController: null,
					iController: null,
					pController: null,
					rController: null,

					__construct: function() {
						this.cController = h5.core.controller('#controllerTest', cController);
					},

					__init: function() {
						this.iController = h5.core.controller('#controllerTest', iController);
					},

					__postInit: function() {
						this.pController = h5.core.controller('#controllerTest', pController);
					},

					__ready: function() {
						this.rController = h5.core.controller('#controllerTest', rController);
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, cdfd.promise(), idfd.promise(), pdfd.promise(),
						rdfd.promise()).done(
						function() {
							strictEqual(cRet.join(','), '__construct,__init,__postInit,__ready',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(','), '__construct,__init,__postInit,__ready',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(pRet.join(','), '__construct,__init,__postInit,__ready',
									'__postInitでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(','), '__construct,__init,__postInit,__ready',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							start();
						});
			});

	asyncTest(
			'各ライフサイクルイベントでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数と順序は正しいか(テンプレートあり)',
			function() {
				var cdfd = $.Deferred();
				var cRet = [];
				var cController = {
					__name: 'CController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						cRet.push('__construct');
					},

					__init: function() {
						cRet.push('__init');
					},

					__postInit: function() {
						cRet.push('__postInit');
					},

					__ready: function() {
						cRet.push('__ready');
						this.readyPromise.done(function() {
							cdfd.resolve();
						});
					}
				};

				var idfd = $.Deferred();
				var iRet = [];
				var iController = {
					__name: 'IController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						iRet.push('__construct');
					},

					__init: function() {
						iRet.push('__init');
					},

					__postInit: function() {
						iRet.push('__postInit');
					},

					__ready: function() {
						iRet.push('__ready');
						this.readyPromise.done(function() {
							idfd.resolve();
						});
					}
				};

				var pdfd = $.Deferred();
				var pRet = [];
				var pController = {
					__name: 'PController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						pRet.push('__construct');
					},

					__init: function() {
						pRet.push('__init');
					},

					__postInit: function() {
						pRet.push('__postInit');
					},

					__ready: function() {
						pRet.push('__ready');
						this.readyPromise.done(function() {
							pdfd.resolve();
						});
					}
				};

				var rdfd = $.Deferred();
				var rRet = [];
				var rController = {
					__name: 'RController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						rRet.push('__construct');
					},

					__init: function() {
						rRet.push('__init');
					},

					__postInit: function() {
						rRet.push('__postInit');
					},

					__ready: function() {
						rRet.push('__ready');
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
					pController: null,
					rController: null,

					__construct: function() {
						this.cController = h5.core.controller('#controllerTest', cController);
					},

					__init: function() {
						this.iController = h5.core.controller('#controllerTest', iController);
					},

					__postInit: function() {
						this.pController = h5.core.controller('#controllerTest', pController);
					},

					__ready: function() {
						this.rController = h5.core.controller('#controllerTest', rController);
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, cdfd.promise(), idfd.promise(), pdfd.promise(),
						rdfd.promise()).done(
						function() {
							strictEqual(cRet.join(','), '__construct,__init,__postInit,__ready',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(','), '__construct,__init,__postInit,__ready',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(pRet.join(','), '__construct,__init,__postInit,__ready',
									'__postInitでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(','), '__construct,__init,__postInit,__ready',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							start();
						});
			});

	asyncTest('各ライフサイクルで子コントローラに親コントローラのインスタンスを持たせた時に無限ループにならないか', 4, function() {


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

			__postInit: function() {
				this.c3Controller.pController = this;
			}
		};

		var c4Controller = {
			__name: 'C4Controller',

			pController: null
		};

		var p4Controller = {
			__name: 'P4Controller',

			c4Controller: c4Controller,

			__ready: function() {
				this.c4Controller.pController = this;
			}
		};

		var d1 = $.Deferred();
		var d2 = $.Deferred();
		var d3 = $.Deferred();
		var d4 = $.Deferred();

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
			ok(p3 === p3.c3Controller.pController, '__postInitで無限ループが発生しないか');
			p3.unbind();
		});

		var p4 = h5.core.controller('#controllerTest', p4Controller);
		p4.readyPromise.done(function() {
			d4.resolve();
			ok(p4 === p4.c4Controller.pController, '__readyで無限ループが発生しないか');
			p4.unbind();
		});

		h5.async.when(d1.promise(), d2.promise(), d3.promise(), d4.promise()).done(function() {
			start();
		});
	});

	asyncTest('初期化パラメータを渡せるか', 24, function() {
		var cConstruct = null;
		var cInit = null;
		var cPostInit = null;
		var cReady = null;
		var cController = {
			__name: 'CController',

			__construct: function(context) {
				cConstruct = context.args;
			},

			__init: function(context) {
				cInit = context.args;
			},

			__postInit: function(context) {
				cPostInit = context.args;
			},

			__ready: function(context) {
				cReady = context.args;
			}
		};

		var pConstruct = null;
		var pInit = null;
		var pPostInit = null;
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

			__postInit: function(context) {
				pPostInit = context.args;
			},

			__ready: function(context) {
				pReady = context.args;
			}
		};

		var rConstruct = null;
		var rInit = null;
		var rPostInit = null;
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

			__postInit: function(context) {
				rPostInit = context.args;
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
			strictEqual(rPostInit, args, '__postInitでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(rPostInit.param, args.param, '__postInitでルートに渡された初期化パラメータのプロパティは正しいか');
			strictEqual(rReady, args, '__readyでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(rReady.param, args.param, '__readyでルートに渡された初期化パラメータのプロパティは正しいか');

			strictEqual(pConstruct, args, '__constructで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pConstruct.param, args.param, '__constructで子に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(pInit, args, '__initで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pInit.param, args.param, '__initで子に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(pPostInit, args, '__postInitでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pPostInit.param, args.param, '__postInitでルートに渡された初期化パラメータのプロパティは正しいか');
			strictEqual(pReady, args, '__readyで子に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(pReady.param, args.param, '__readyで子に渡された初期化パラメータのプロパティは正しいか');

			strictEqual(cConstruct, args, '__constructで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cConstruct.param, args.param, '__constructで孫に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(cInit, args, '__initで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cInit.param, args.param, '__initで孫に渡された初期化パラメータのプロパティは正しいか');
			strictEqual(cPostInit, args, '__postInitでルートに渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cPostInit.param, args.param, '__postInitでルートに渡された初期化パラメータのプロパティは正しいか');
			strictEqual(cReady, args, '__readyで孫に渡された初期化パラメータの参照は引数で渡したものと同一');
			strictEqual(cReady.param, args.param, '__readyで孫に渡された初期化パラメータのプロパティは正しいか');

			rootController.dispose();
			start();
		});
	});
	//=============================
	// Definition
	//=============================
	module(
			'Controller - CommonFailHandler',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
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
						}, 0);
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
						}, 0);
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

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __postInitでpromiseを返してrejectする場合 1', 1,
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
					__postInit: function() {
						setTimeout(function() {
							dfd.reject();
						}, 0);
						return dfd.promise();
					},
					__dispose: function() {
						strictEqual(cfh, 1, 'commonFailHandlerが1回だけ実行されていること');
						start();
					}
				};
				h5.core.controller('#controllerTest', controller);
			});

	asyncTest('コントローラの初期化処理中にエラーが起きた時のcommonFailHandlerの動作 __postInitでpromiseを返してrejectする場合 2', 2,
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
					__postInit: function() {
						setTimeout(function() {
							dfd.reject();
						}, 0);
						var p = dfd.promise();
						p.fail(function() {
							ok(true, '__postInitが返すpromiseのfailハンドラが実行される');
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
						}, 0);
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
						}, 0);
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
			8, function() {
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
						this.childController.preInitPromise.fail(function() {
							ok(true, '子コントローラのpreInitPromiseのfailが実行された');
						});
						this.childController.postInitPromise.fail(function() {
							ok(true, '子コントローラのpostInitPromiseのfailが実行された');
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
				c.preInitPromise.done(function() {
					ok(true, 'ルートコントローラのpreInitPromiseのdoneが実行される');
				}).fail(function() {
					ok(false, 'テスト失敗。ルートコントローラのpreInitPromiseのfailが実行された');
				});
				c.initPromise.done(function() {
					ok(true, 'ルートコントローラのinitPromiseのdoneが実行された');
				}).fail(function() {
					ok(false, 'テスト失敗。ルートコントローラのinitPromiseのfailが実行された');
				});
				c.postInitPromise.fail(function() {
					ok(true, 'ルートコントローラのpostInitPromiseのfailが実行された');
				});
				c.readyPromise.done(function() {
					ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
				});
			});

	//=============================
	// Definition
	//=============================
	module(
			'[build#min]Controller - アスペクト',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
	asyncTest('コントローラの作成と要素へのバインド(AOPあり)', 3, function() {
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
	asyncTest('コントローラ内のthis', 3, function() {
		var lifecycleThis, eventHandlerThis, methodThis;
		var controller = {
			__name: 'TestController',
			__construct: function() {
				lifecycleThis = this;
			},
			'input click': function() {
				eventHandlerThis = this;
			},
			test: function(context) {
				methodThis = this;
			}
		};
		var aop1 = {
			interceptors: function(invocation) {
				invocation.proceed();
			}
		};

		var aop2 = {
			interceptors: function(invocation) {
				invocation.proceed();
			}
		};
		h5.core.__compileAspects([aop1, aop2]);
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			strictEqual(lifecycleThis, c, '__construct内のthisはコントローラ自身を指しているか');
			$('#controllerTest input[type=button]').click();
			strictEqual(eventHandlerThis, c, 'イベントハンドラ内のthisはコントローラ自身を指しているか');
			this.test();
			strictEqual(methodThis, c, 'メソッド内のthisはコントローラ自身を指しているか');
			start();
		});
	});

	asyncTest('[build#min]アスペクトの動作1', 1, function() {
		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push('__init');
			}
		};

		var aop1 = {
			interceptors: function(invocation) {
				ret.push('interceptor1');
				invocation.proceed();
			}
		};

		var aop2 = {
			interceptors: function(invocation) {
				ret.push('interceptor2');
				invocation.proceed();
			}
		};
		h5.core.__compileAspects([aop1, aop2]);

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			strictEqual(ret.join(','), 'interceptor1,interceptor2,__init', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});

	});

	asyncTest('[build#min]アスペクトの動作2', 1, function() {
		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push('__init');
			}
		};

		var ic1 = function(invocation) {
			ret.push('interceptor1');
			invocation.proceed();
		};

		var ic2 = function(invocation) {
			ret.push('interceptor2');
			invocation.proceed();
		};
		h5.core.__compileAspects({
			interceptors: [ic1, ic2]
		});

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			strictEqual(ret.join(','), 'interceptor1,interceptor2,__init', 'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});
	});

	asyncTest('[build#min]アスペクトの動作3', 1, function() {
		var ret = [];
		var controller = {
			__name: 'com.htmlhifive.test.controller.TestController',

			__init: function() {
				ret.push('__init');
			}
		};

		var ic1 = function(invocation) {
			ret.push('interceptor1');
			invocation.proceed();
		};

		var ic2 = function(invocation) {
			ret.push('interceptor2');
			invocation.proceed();
		};

		var ic3 = function(invocation) {
			ret.push('interceptor3');
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
			strictEqual(ret.join(','), 'interceptor1,interceptor2,interceptor3,__init',
					'インターセプタの動作順は正しいか');

			testController.unbind();
			cleanAspects();
			start();
		});
	});

	asyncTest('[build#min]アスペクトの動作4', 2, function() {
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

	asyncTest('[build#min]アスペクトの動作5', 2, function() {
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

	asyncTest(
			'[build#min]アスペクト対象のメソッドがjQueryオブジェクトを返した時にpromiseオブジェクトと判定されずにreject/resolveを待たないこと',
			4, function() {
				var order = 1;
				var ic = h5.u.createInterceptor(function(invocation) {
					strictEqual(order++, 1, 'pre()が1番目に実行されること');
					return invocation.proceed();
				}, function(invocation, data) {
					strictEqual(order++, 3, 'post()が3番目に実行されること');
				});
				var logicAspect = {
					target: '*',
					interceptors: ic,
					pointCut: 'f'
				};
				h5.core.__compileAspects(logicAspect);
				var c = h5.core.controller('#controllerTest', {
					__name: 'TestController',
					f: function() {
						strictEqual(order++, 2, 'アスペクト対象のメソッドが2番目に実行されること');
						return $('body');
					}
				});
				c.readyPromise.done(function() {
					c.f();
					strictEqual(order++, 4, 'インターセプタが同期で実行されていること');
					cleanAspects();
					start();
				});
			});

	//=============================
	// Definition
	//=============================
	module(
			'Controller - コントローラのプロパティ・メソッド',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
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

	asyncTest('this.deferred()は動作しているか', 1, function() {

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


	asyncTest('this.$find()は動作しているか', 2, function() {

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

	asyncTest('this.logは動作しているか', 2, function() {

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

	asyncTest('this.own()の動作', 4, function() {
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
				var returnVal = this.own(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownで作成した関数を呼び出して戻り値が返ってくること');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			testController.unbind();
			start();
		});
	});

	asyncTest('this.ownWithOrg()の動作', 5, function() {
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

				var returnVal = this.ownWithOrg(function() {
					return 1;
				})();
				strictEqual(returnVal, 1, 'this.ownWithOrgで作成した関数を呼び出して戻り値が返ってくること');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.readyPromise.done(function() {
			start();

			testController.unbind();
		});
	});

	asyncTest('Controller.triggerによるイベントのトリガで、イベントが発火し、context.evArgに引数が格納されること', 6, function() {
		var evArg = "初期値";
		var triggered = false;
		h5.core.controller('#controllerTest', {
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

				start();
			},

			'{rootElement} click': function(context) {
				triggered = true;
				evArg = context.evArg;
			}
		});
	});

	asyncTest('Controller.triggerの戻り値はイベントオブジェクトであること', 3, function() {
		var clickEvent = '';
		h5.core.controller('#controllerTest', {
			__name: 'test',
			__ready: function() {
				var e = this.trigger('click');
				strictEqual(e, clickEvent,
						'triggerの戻り値はイベントオブジェクトで、イベントハンドラに渡されるイベントオブジェクトと同一インスタンスであること');
				var jqev = $.Event('click');
				e = this.trigger(jqev);
				strictEqual(e, jqev,
						'jQueryEventオブジェクトをtriggerに渡すと、戻り値はそのjQueryEventオブジェクトインスタンスであること');
				strictEqual(e, clickEvent,
						'triggerの戻り値はイベントオブジェクトで、イベントハンドラに渡されるイベントオブジェクトと同一インスタンスであること');
				start();
			},
			'{rootElement} click': function(context) {
				clickEvent = context.event;
			}
		});
	});

	asyncTest('rootController, parentControllerは正しくセットされているか', 24, function() {
		var cir = null;
		var cip = null;
		var cpr = null;
		var cpp = null;
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

			__postInit: function(context) {
				cpr = this.rootController;
				cpp = this.parentController;
			},

			__ready: function(context) {
				crr = this.rootController;
				crp = this.parentController;
			}
		};

		var pir = null;
		var pip = null;
		var ppr = null;
		var ppp = null;
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

			__postInit: function(context) {
				ppr = this.rootController;
				ppp = this.parentController;
			},

			__ready: function(context) {
				prr = this.rootController;
				prp = this.parentController;
			}
		};

		var rir = null;
		var rip = null;
		var rpr = null;
		var rpp = null;
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

			__postInit: function(context) {
				rpr = this.rootController;
				rpp = this.parentController;
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

			ok(cpr === rootController, '__postInitで孫コントローラのrootControllerは正しいか');
			ok(cpp === parentController, '__postInitで孫コントローラのparentControllerは正しいか');
			ok(ppr === rootController, '__postInitで子コントローラのrootControllerは正しいか');
			ok(ppp === rootController, '__postInitで子コントローラのparentControllerは正しいか');
			ok(rpr === rootController, '__postInitでルートコントローラのrootControllerは自分自身を指しているか');
			ok(rpp === null, '__postInitでルートコントローラのparentControllerはnullか');

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

	asyncTest('enableListeners() / disableListeners() の動作', 8, function() {
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
							strictEqual(e.code, ERR.ERR_CODE_TOO_FEW_ARGUMENTS,
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

	//=============================
	// Definition
	//=============================
	module('ライフサイクルイベント内の例外', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');

			// 元のwindow.onerror(QUnitのもの)を一時的に保管する
			this.onerrorHandler = window.onerror;
		},
		teardown: function() {
			clearController();
			// window.onerrorを元に戻す
			window.onerror = this.onerrorHandler;
		},
		/** window.onerrorが起こるまで待機して、待機時間(5秒)を過ぎたらテストを失敗させる関数 */
		testTimeoutFunc: function() {
			var id = setTimeout(function() {
				ok(false, 'window.onerrorが実行されませんでした。');
				// __unbind, __disposeにundefinedを代入して、teardown時にdisposeするときエラーが出ないようにする
				var controllers = h5.core.controllerManager.getControllers('#controllerTest');
				for (var i = 0, l = controllers.length; i < l; i++) {
					controllers[i].__unbind = undefined;
					controllers[i].__dispose = undefined;
				}
				start();
			}, 5000);
			return id;
		},
		/** window.onerrorを保管しておく変数 */
		onerrorHandler: null,
		/** エラーをキャッチするための何もしない関数 */
		dummyHandler: function() {
		// 何もしない
		}
	});

	//=============================
	// Body
	//=============================
	test('__construct()で例外をスローする', 1, function() {
		// __construct()は同期なのでwindow.onerrorの拾えないandroid0-3でもテストできる
		var errorObj = new Error('__construct error.');
		var controller = {
			__name: 'TestController',
			__construct: function() {
				throw errorObj;
			}
		};

		try {
			h5.core.controller('#controllerTest', controller);
		} catch (e) {
			strictEqual(e, errorObj, '__constructで投げた例外をtry-catchでキャッチできること');
		}
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__init()で例外をスローする', 2, function() {
		var errorObj = new Error('__init error.');
		var id = this.testTimeoutFunc();

		window.onerror = function(e) {
			clearTimeout(id);
			ok(e, errorObj, '__init()内で発生した例外がFW内で握りつぶされずにwindow.onerrorで取得できること');
			ok(isDisposed(c), 'コントローラはdisposeされていること');
			start();
		};

		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__init: function() {
				throw errorObj;
			}
		});
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__postInit()で例外をスローする', 2, function() {
		var errorObj = new Error('__postInit error.');
		var id = this.testTimeoutFunc();

		window.onerror = function(e) {
			clearTimeout(id);
			ok(e, errorObj, '__postInit()内で発生した例外がFW内で握りつぶされずにwindow.onerrorで取得できること');
			ok(isDisposed(c), 'コントローラはdisposeされていること');
			start();
		};

		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__postInit: function() {
				throw errorObj;
			}
		});
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__ready()で例外をスローする', 2, function() {
		var errorObj = new Error('__ready error.');
		var id = this.testTimeoutFunc();

		window.onerror = function(e) {
			clearTimeout(id);
			ok(e, errorObj, '__ready()内で発生した例外がFW内で握りつぶされずにwindow.onerrorで取得できること');
			ok(isDisposed(c), 'コントローラはdisposeされていること');
			start();
		};

		var c = h5.core.controller('#controllerTest', {
			__name: 'TestController',
			__ready: function() {
				throw errorObj;
			}
		});
	});

	// TODO __unbind, __disposeで例外をスローした時の挙動について整理してから、テストコードの対応を行う。(#329)
	//
	//	asyncTest('[browser#and-and:-3|sa-ios:-4]__unbind()で例外をスローする。コントローラのunbindを呼んだ場合。', 3,
	//			function() {
	//				var errorMsg = '__unbind error.';
	//				var id = this.testTimeoutFunc(errorMsg);
	//
	//				window.onerror = function(ev) {
	//					clearTimeout(id);
	//					ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
	//					$(c.rootElement).click();
	//					ok(!evHandlerFlag, 'コントローラのイベントハンドラは動作しないこと');
	//					ok(c.__name, 'コントローラはdisposeされていないこと');
	//					start();
	//				};
	//
	//				var evHandlerFlag;
	//				var controller = {
	//					__name: 'TestController',
	//					__unbind: function() {
	//						throw new Error(errorMsg);
	//					},
	//					'{rootElement} click': function() {
	//						evHandlerFlag = true;
	//					}
	//				};
	//
	//				var c = h5.core.controller('#controllerTest', controller);
	//				c.readyPromise.done(function() {
	//					c.unbind();
	//				});
	//			});
	//
	//	asyncTest('[browser#and-and:-3|sa-ios:-4]__unbind()で例外をスローする。コントローラのdisposeを呼んだ場合。', 3,
	//			function() {
	//				var errorMsg = '__unbind error.';
	//				var id = this.testTimeoutFunc(errorMsg);
	//
	//				window.onerror = function(ev) {
	//					clearTimeout(id);
	//					ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
	//					$(c.rootElement).click();
	//					ok(!evHandlerFlag, 'コントローラのイベントハンドラは動作しないこと');
	//					ok(!c.__name, 'コントローラはdisposeされていること');
	//					start();
	//				};
	//
	//				var evHandlerFlag;
	//				var controller = {
	//					__name: 'TestController',
	//					__unbind: function() {
	//						throw new Error(errorMsg);
	//					},
	//					'{rootElement} click': function() {
	//						evHandlerFlag = true;
	//					}
	//				};
	//
	//				var c = h5.core.controller('#controllerTest', controller);
	//				c.readyPromise.done(function() {
	//					c.dispose();
	//				});
	//			});
	//
	//	asyncTest('[browser#and-and:-3|sa-ios:-4]__dispose()で例外をスローする。', 2, function() {
	//		var errorMsg = '__dispose error.';
	//		var id = this.testTimeoutFunc(errorMsg);
	//
	//		window.onerror = function(ev) {
	//			clearTimeout(id);
	//			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
	//			ok(!c.__name, 'コントローラはdisposeされていること');
	//			start();
	//		};
	//
	//		var controller = {
	//			__name: 'TestController',
	//			__dispose: function() {
	//				throw new Error(errorMsg);
	//			}
	//		};
	//
	//		var c = h5.core.controller('#controllerTest', controller);
	//		c.readyPromise.done(function() {
	//			c.dispose();
	//		});
	//	});

	asyncTest('子コントローラの__init()で例外をスローしたとき、コントローラは連鎖的にdisposeされること', 6, function() {
		window.onerror = this.dummyHandler;
		var errorObj = new Error('__init');
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			childController: {
				__name: 'childController',
				__init: function() {
					throw errorObj;
				},
				grandchildController: {
					__name: 'grandchildController',
					__init: function() {
						nextLifecycleExecuted = true;
					}
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			ok(!nextLifecycleExecuted, 'コントローラの初期化処理は中断されていること');
			ok(isRejected(c.childController.initPromise), '子コントローラのinitPromiseはrejectされていること');
			var child = c.childController;
			var grandChild = c.childController.grandchildController;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child), '子コントローラはdisposeされること');
				ok(isDisposed(grandChild), '孫コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子コントローラの__postInit()で例外をスローしたとき、コントローラは連鎖的にdisposeされること', 6, function() {
		window.onerror = this.dummyHandler;
		var errorObj = new Error('__postInit');
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			__postInit: function() {
				nextLifecycleExecuted = true;
			},
			childController: {
				__name: 'childController',
				__postInit: function() {
					throw errorObj;
				},
				grandchildController: {
					__name: 'grandchildController'
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			ok(!nextLifecycleExecuted, 'コントローラの初期化処理は中断されていること');
			ok(isRejected(c.childController.postInitPromise),
					'子コントローラのpostInitPromiseはrejectされていること');
			var child = c.childController;
			var grandChild = c.childController.grandchildController;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child), '子コントローラはdisposeされること');
				ok(isDisposed(grandChild), '孫コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	asyncTest('子コントローラの__ready()で例外をスローしたとき、コントローラは連鎖的にdisposeされること', 6, function() {
		window.onerror = this.dummyHandler;
		var errorObj = new Error('__ready');
		var nextLifecycleExecuted;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				nextLifecycleExecuted = true;
			},
			childController: {
				__name: 'childController',
				__ready: function() {
					throw errorObj;
				},
				grandchildController: {
					__name: 'grandchildController'
				}
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.fail(function(e) {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			ok(!nextLifecycleExecuted, 'コントローラの初期化処理は中断されていること');
			ok(isRejected(c.childController.readyPromise), '子コントローラのreadyPromiseはrejectされていること');
			var child = c.childController;
			var grandChild = c.childController.grandchildController;
			setTimeout(function() {
				ok(isDisposed(c), 'コントローラはdisposeされること');
				ok(isDisposed(child), '子コントローラはdisposeされること');
				ok(isDisposed(grandChild), '孫コントローラはdisposeされること');
				start();
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module(
			'Controller - indicator',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');

					$('#qunit-fixture')
							.append(
									'<div id="scrollable" style="width:400px; height:300px; overflow:scroll"><div id="for-scroll" style="height:888px; width:777px;"></div></div>');
				},
				teardown: function() {
					clearController();
					$('#scrollable').remove();
					h5.settings.commonFailHandler = undefined;
					h5.settings.dynamicLoading.retryInterval = this.originalRetryInterval;
					h5.settings.dynamicLoading.retryCount = this.originalRetryCount;
				},
				originalRetryInterval: h5.settings.dynamicLoading.retryInterval,
				originalRetryCount: h5.settings.dynamicLoading.retryCount
			});

	//=============================
	// Body
	//=============================
	asyncTest('ターゲットを指定しない場合はルートエレメントにインジケータが表示されること', 3, function() {
		h5.core.controller('#controllerTest', {
			__name: 'TestController'
		}).readyPromise.done(function() {
						var indicator = this.indicator({
							message: 'BlockMessageTest'
						}).show();

			strictEqual(this.$find('>.h5-indicator.a.overlay').length, 1, 'オーバレイ要素が追加されていること');
			strictEqual(this.$find('>.h5-indicator.a.content>.indicator-message').text(),
					'BlockMessageTest', 'メッセージが表示されていること');

						setTimeout(function() {
							indicator.hide();

							setTimeout(function() {
					strictEqual($('.h5-indicator').length, 0, 'Indicator#hide() インジケータが除去されていること');
					start();
				}, 0);
			}, 0);
		});
	});

	asyncTest('ターゲットの指定は、ルートエレメントを起点にして選択されること', 3, function() {
		$('#qunit-fixture').append('<div class="indicator-target outer"></div>');
		$('#controllerTest').append('<div class="indicator-target inner"></div>');
		h5.core.controller('#controllerTest', {
			__name: 'TestController'
		}).readyPromise.done(function() {
			var indicator = this.indicator({
				target: '.indicator-target'
			}).show();

			strictEqual(this.$find('>.inner>.h5-indicator.a.overlay').length, 1,
					'オーバレイ要素が追加されていること');

			strictEqual($('>.outer>.h5-indicator').length, 0, 'ルートエレメントの外側の要素にはインジケータは表示されていないこと');

			setTimeout(function() {
				indicator.hide();
				setTimeout(function() {
					strictEqual($('.h5-indicator').length, 0, 'Indicator#hide() インジケータが除去されていること');
								start();
							}, 0);
						}, 0);
		});
	});

	asyncTest('ターゲットの指定にグローバルセレクタが使用できること', 6, function() {
		var $qunit = $('#qunit-fixture');
		$qunit.append('<div class="indicator-target outer"></div>');
		$('#controllerTest').append('<div class="indicator-target inner"></div>');
		$qunit.append('<div class="global-target"></div>');
		window.h5test1 = {
			target: $('.global-target')
				};
		$qunit.append('<div class="controller-target"></div>');

		h5.core.controller('#controllerTest', {
			__name: 'TestController',
			target: $('.controller-target')
		}).readyPromise.done(function() {
			var indicator1 = this.indicator({
				target: '{.indicator-target}'
			}).show();

			strictEqual(this.$find('>.inner>.h5-indicator.a.overlay').length, 1,
					'ルートエレメントの内側の要素にオーバレイ要素が追加されていること');
			strictEqual($('.outer>.h5-indicator.a.overlay').length, 1,
					'ルートエレメントの外側の要素にオーバレイ要素が追加されていること');

			var indicator2 = this.indicator({
				target: '{rootElement}'
			}).show();

			strictEqual(this.$find('>.h5-indicator.a.overlay').length, 1,
					'ルートエレメントにオーバレイ要素が追加されていること');

			var indicator3 = this.indicator({
				target: '{window.h5test1.target}'
			}).show();
			strictEqual($('.global-target>.h5-indicator.a.overlay').length, 1,
					'{window.h5test1.target}にオーバレイ要素が追加されていること');

			var indicator4 = this.indicator({
				target: '{this.target}'
			}).show();
			strictEqual($('.controller-target>.h5-indicator.a.overlay').length, 1,
					'{this.target}にオーバレイ要素が追加されていること');

			setTimeout(function() {
				indicator1.hide();
				indicator2.hide();
				indicator3.hide();
				indicator4.hide();
				setTimeout(function() {
					strictEqual($('.h5-indicator').length, 0, 'Indicator#hide() インジケータが除去されていること');
					deleteProperty(window, 'h5test1');
					start();
				}, 0);
			}, 0);
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
					__name: 'ChildController',

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

	asyncTest('this.indicator() 親要素と子要素でインジケータを表示する', 6, function() {
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

	asyncTest('this.indicator() 存在しないターゲットを指定したときはインジケータが表示されないこと', 3, function() {
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

	asyncTest('this.indicator() Indicator#percent()で指定した進捗率に更新されること', 20, function() {
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
		testController2 = h5.core.controller(document, controllerBaseGrobal);
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

	asyncTest('this.indicator() promises', 4, function() {
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
				}, 0);

				setTimeout(function() {
					strictEqual($(indicator._target).find('.h5-indicator.a.overlay').length, 1,
							'resolve()していないので、インジケータが表示されること');

					df2.resolve();
				}, 0);
				h5.async.when(df.promise(), df2.promise()).done(
						function() {
							setTimeout(
									function() {
										strictEqual($(indicator._target).find(
												'.h5-indicator.a.overlay').length, 0,
												'全てのresolve()が呼ばれたら、インジケータが非表示になること');

										testController.unbind();
										start();
									}, 0);
						});
			}
		};
		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});

	});

	asyncTest('this.indicator() 複数要素にマッチするセレクタをtargetに指定する', 2, function() {
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

	asyncTest('body、document、windowをターゲットにした場合', 6, function() {
		var controllerBase = {
			__name: 'TestController',
			__ready: function() {
				this._showIndocator(window).done(this.own(function() {
					this._showIndocator(document).done(this.own(function() {
						this._showIndocator(document.body).done(start);
					}));
				}));
			},

			_showIndocator: function(target) {
				var dfd = $.Deferred();

				var indicator = this.indicator({
					target: target,
					message: 'テストテストテスト2'
				}).show();

				setTimeout(function() {
					strictEqual($(document.body).children('.h5-indicator.a.content').length, 1,
							'body直下に1つインジケータが表示されていること');
					indicator.hide();

					setTimeout(function() {
						strictEqual($('#controllerTes').children('.h5-indicator.a.content').length,
								0, 'Indicator#hide() インジケータが除去されていること');
						dfd.resolve();
					}, 0);
				}, 0);
				return dfd.promise();
			}
		};

		$('#controllerTest').append('<li class="hoge"></li>').append('<li class="hoge"></li>');

		var testController = h5.core.controller('#controllerTest', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			testController.unbind();
		});
	});

	asyncTest('this.indicator() 同一要素に２つのインジケータを表示する', 2, function() {
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

						indicator.hide();

						setTimeout(function() {
							strictEqual($('.h5-indicator', indicator._target).length, 0,
									'Indicator#hide() インジケータが除去されていること');
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

	asyncTest('overflow:scrollな要素へのインジケータ', 7, function() {
		var testController = null;
		var controllerBase = {
			__name: 'TestController',
			__ready: function() {
				var indicator = h5.ui.indicator(this.rootElement, {
					message: 'a',
					percent: 20
				});
				indicator.show();

				strictEqual($(indicator._target).find(
						'.h5-indicator.a.content > .indicator-message').text(), 'a');
				strictEqual($(indicator._target).find('.h5-indicator.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');

				// overlayの大きさはスクロールで見えている箇所だけではなく、見えてない箇所も含む
				var $overlay = $('.h5-indicator.overlay');
				var overlayWidth = $overlay.width();
				var overlayHeight = $overlay.height();
				ok(Math.abs(overlayWidth - $('#for-scroll').width()) <= 2,
						'オーバレイの幅がscroll要素の中身の大きさと同じ(誤差2px以内)');
				ok(Math.abs(overlayHeight - $('#for-scroll').height()) <= 2,
						'オーバレイの高さがscroll要素の中身の大きさと同じ(誤差2px以内)');

				// contentの場所は見えている箇所の真ん中
				var $content = $('.h5-indicator.content');
				var content = $content[0];
				var $scrollable = $('#scrollable');
				var expectContentLeft = ($scrollable.innerWidth() - $content.outerWidth()) / 2;
				var expectContentTop = ($scrollable.innerHeight() - $content.outerHeight()) / 2;
				ok(Math.abs(content.offsetLeft - expectContentLeft) <= 2,
						'コンテントのleftがscroll要素の見えている位置の真ん中(誤差2px以内)');
				ok(Math.abs(content.offsetTop - expectContentTop) <= 2,
						'コンテントのtopがscroll要素の見えている位置の真ん中(誤差2px以内)');

				indicator.hide();
				setTimeout(function() {
					strictEqual($('.h5-indicator', indicator._target).length, 0,
							'Indicator#hide() インジケータが除去されていること');
					testController.unbind();
					start();
				}, 0);
			}
		};

		testController = h5.core.controller('#scrollable', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});


	asyncTest('overflow:scrollな要素がスクロールされている場合', 7, function() {
		var testController = null;
		// 10,20へスクロール
		var scrollable = $('#scrollable')[0];
		scrollable.scrollLeft = 10;
		scrollable.scrollTop = 20;

		var controllerBase = {
			__name: 'TestController',
			__ready: function() {
				var indicator = h5.ui.indicator(this.rootElement, {
					message: 'a',
					percent: 20
				});
				indicator.show();

				strictEqual($(indicator._target).find(
						'.h5-indicator.a.content > .indicator-message').text(), 'a');
				strictEqual($(indicator._target).find('.h5-indicator.overlay').length, 1,
						'Indicator#show() インジケータが表示されること');

				// overlayの大きさはスクロールで見えている箇所だけではなく、見えてない箇所も含む
				var $overlay = $('.h5-indicator.overlay');
				var overlayWidth = $overlay.width();
				var overlayHeight = $overlay.height();
				ok(Math.abs(overlayWidth - $('#for-scroll').width()) <= 2,
						'オーバレイの幅がscroll要素の中身の大きさと同じ(誤差2px以内)');
				ok(Math.abs(overlayHeight - $('#for-scroll').height()) <= 2,
						'オーバレイの高さがscroll要素の中身の大きさと同じ(誤差2px以内)');

				// contentの場所は見えている箇所の真ん中
				var $content = $('.h5-indicator.content');
				var content = $content[0];
				var $scrollable = $('#scrollable');
				var expectContentLeft = $scrollable.scrollLeft()
						+ ($scrollable.innerWidth() - $content.outerWidth()) / 2;
				var expectContentTop = $scrollable.scrollTop()
						+ ($scrollable.innerHeight() - $content.outerHeight()) / 2;
				ok(Math.abs(content.offsetLeft - expectContentLeft) <= 2,
						'コンテントのleftがscroll要素の見えている位置の真ん中(誤差2px以内)');
				ok(Math.abs(content.offsetTop - expectContentTop) <= 2,
						'コンテントのtopがscroll要素の見えている位置の真ん中(誤差2px以内)');

				indicator.hide();
				setTimeout(function() {
					strictEqual($('.h5-indicator', indicator._target).length, 0,
							'Indicator#hide() インジケータが除去されていること');
					testController.unbind();
					start();
				}, 0);
			}
		};

		testController = h5.core.controller('#scrollable', controllerBase);
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
		});
	});

	//=============================
	// Definition
	//=============================
	module(
			'controllerManager',
			{
				setup: function() {
					$('#qunit-fixture')
							.append(
									'<div id="controllerTest-r"><div id="controllerTest-c"><div id="controllerTest-g1"></div><div id="controllerTest-g2"></div></div></div>');

					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="a"></div></div><div id="controllerTest2"></div>');
				},
				teardown: function() {
					clearController();
				}
			});

	//=============================
	// Body
	//=============================
	test('コントローラの取得（getControllers）、コントローラをバインドしていない場合', 2, function() {
		var controllers = h5.core.controllerManager.getControllers('#controllerTest');
		strictEqual($.isArray(controllers), true, 'コントローラをバインドしていないときも配列が返る');
		strictEqual(controllers.length, 0, '配列の要素数は0');
	});

	asyncTest('コントローラの取得（getControllers）、コントローラを1つバインドした場合、および引数のパターンへの対応', 6, function() {
		var controllerBase = {
			__name: 'TestController'
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
			// strictEqualを使うと循環参照しているオブジェジェクトを出力しようとするため、
			// ok(hoge === fuga) で判定。
			ok(idController === testController, 'セレクタでコントローラが取得できたか');
			ok(jqController === testController, 'jQueryオブジェクトでコントローラが取得できたか');
			ok(domController === testController, 'DOMでコントローラが取得できたか');

			testController.dispose();
			start();
		});
	});

	asyncTest('コントローラの取得（getControllers）、同じ要素にバインドする子コントローラが存在する場合', 3, function() {
		var childController = {
			__name: 'ChildController'
		};

		var parentController = {
			__name: 'ParentController',
			childController: childController
		};

		var pInst = h5.core.controller('#controllerTest', parentController);

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

	asyncTest('コントローラの取得（getControllers）、内包する子コントローラをmeta指定で親と別の要素にバインドする場合', 1, function() {
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

	asyncTest('コントローラの取得（getControllers）、同一要素に独立した複数のコントローラがバインドされている場合', 3, function() {
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

	asyncTest('getAllControllersで全てのバインドされているコントローラが取得できること', 5, function() {
		var c1 = h5.core.controller('#controllerTest-r', {
			__name: 'c1'
		});
		var c2 = h5.core.controller('#controllerTest-r', {
			__name: 'c2'
		});
		var c3 = h5.core.controller('#controllerTest-c', {
			__name: 'c3'
		});
		var c4 = h5.core.controller('#controllerTest2', {
			__name: 'c4'
		});
		h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise).done(
				function() {
					var controllers = h5.core.controllerManager.getAllControllers();
					var expects = [c1, c2, c3, c4];
					strictEqual(controllers.length, expects.length, 'バインドしたコントローラの数分だけ取得できていること');
					for (var i = 0, l = expects.length; i < l; i++) {
						ok($.inArray(expects[i], controllers) != -1, 'バインドしたコントローラが取得できること');
					}
					start();
				});
	});

	asyncTest('getControllersで引数で指定した要素にバインドしたコントローラが取得できること', 3, function() {
		var c1 = h5.core.controller('#controllerTest-r', {
			__name: 'c1'
		});
		var c2 = h5.core.controller('#controllerTest-r', {
			__name: 'c2'
		});
		var c3 = h5.core.controller('#controllerTest-c', {
			__name: 'c3'
		});
		var c4 = h5.core.controller('#controllerTest2', {
			__name: 'c4'
		});
		h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise)
				.done(
						function() {
							var controllers = h5.core.controllerManager
									.getControllers('#controllerTest-r');
							var expects = [c1, c2];
							strictEqual(controllers.length, expects.length,
									'指定した要素にバインドした、コントローラの数分だけ取得できていること');
							for (var i = 0, l = expects.length; i < l; i++) {
								ok($.inArray(expects[i], controllers) != -1,
										'バインドされているコントローラが取得できること');
							}
							start();
						});
	});

	asyncTest('getControllers deep:true を指定すると子要素にバインドしたコントローラも取得できること', 5, function() {
		var c1 = h5.core.controller('#controllerTest-r', {
			__name: 'c1'
		});
		var c2 = h5.core.controller('#controllerTest-c', {
			__name: 'c2'
		});
		var c3 = h5.core.controller('#controllerTest-g1', {
			__name: 'c3'
		});
		var c4 = h5.core.controller('#controllerTest-g2', {
			__name: 'c4'
		});
		h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise).done(
				function() {
					var controllers = h5.core.controllerManager.getControllers('#controllerTest-r',
							{
								deep: true
							});
					var expects = [c1, c2, c3, c4];
					strictEqual(controllers.length, expects.length,
							'指定した要素以下にバインドしたコントローラの数分だけ取得できていること');
					for (var i = 0, l = expects.length; i < l; i++) {
						ok($.inArray(expects[i], controllers) != -1, 'バインドされているコントローラが取得できること');
					}
					start();
				});
	});

	asyncTest('getControllers name指定 指定した要素にバインドされた指定した名前のコントローラが取得できること', 3, function() {
		var c1 = h5.core.controller('#controllerTest-r', {
			__name: 'name1'
		});
		var c2 = h5.core.controller('#controllerTest-r', {
			__name: 'name2'
		});
		var c3 = h5.core.controller('#controllerTest-r', {
			__name: 'name1'
		});
		var c4 = h5.core.controller('#controllerTest-c', {
			__name: 'name1'
		});
		h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise).done(
				function() {
					var controllers = h5.core.controllerManager.getControllers('#controllerTest-r',
							{
								name: 'name1'
							});
					var expects = [c1, c3];
					strictEqual(controllers.length, expects.length,
							'name指定された名前を持つコントローラの数分だけ取得できていること');
					for (var i = 0, l = expects.length; i < l; i++) {
						ok($.inArray(expects[i], controllers) != -1, 'バインドされているコントローラが取得できること');
					}
					start();
				});
	});

	asyncTest('getControllers name指定 配列で複数のコントローラ名を指定でき、いずれかにマッチする名前のコントローラが取得できること', 3,
			function() {
				var c1 = h5.core.controller('#controllerTest-r', {
					__name: 'name1'
				});
				var c2 = h5.core.controller('#controllerTest-r', {
					__name: 'name2'
				});
				var c3 = h5.core.controller('#controllerTest-r', {
					__name: 'name3'
				});
				var c4 = h5.core.controller('#controllerTest-c', {
					__name: 'name1'
				});
				h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise)
						.done(
								function() {
									var controllers = h5.core.controllerManager.getControllers(
											'#controllerTest-r', {
												name: ['name1', 'name2']
											});
									var expects = [c1, c2];
									strictEqual(controllers.length, expects.length,
											'name指定された名前を持つコントローラの数分だけ取得できていること');
									for (var i = 0, l = expects.length; i < l; i++) {
										ok($.inArray(expects[i], controllers) != -1,
												'バインドされているコントローラが取得できること');
									}
									start();
								});
			});

	asyncTest('getControllers deep:trueかつname指定 指定した要素以下の要素にバインドされた指定した名前のコントローラが取得できること', 4,
			function() {
				var c1 = h5.core.controller('#controllerTest-r', {
					__name: 'name1'
				});
				var c2 = h5.core.controller('#controllerTest-r', {
					__name: 'name2'
				});
				var c3 = h5.core.controller('#controllerTest-c', {
					__name: 'name1'
				});
				var c4 = h5.core.controller('#controllerTest-g1', {
					__name: 'name1'
				});
				var c5 = h5.core.controller('#controllerTest-g1', {
					__name: 'name2'
				});
				h5.async.when(c1.readyPromise, c2.readyPromise, c3.readyPromsie, c4.readyPromise,
						c5.readyPromise).done(
						function() {
							var controllers = h5.core.controllerManager.getControllers(
									'#controllerTest-r', {
										name: 'name1',
										deep: true
									});
							var expects = [c1, c3, c4];
							strictEqual(controllers.length, expects.length,
									'name指定された名前を持つコントローラの数分だけ取得できていること');
							for (var i = 0, l = expects.length; i < l; i++) {
								ok($.inArray(expects[i], controllers) != -1,
										'バインドされているコントローラが取得できること');
							}
							start();
						});
			});

	//=============================
	// Definition
	//=============================
	module(
			'window.open()で開いたウィンドウの要素にコントローラをバインド',
			{
				setup: function() {
					// (IE8-またはIE11)かつ(jQuery1.10.1または2.0.2)の場合はポップアップウィンドウを使用するテストは行わずにスキップする。
					// いずれの場合もポップアップウィンドウのDOM操作をjQueryで行う時にエラーになるからである。
					// IE8-の場合、jQuery1.10.1,2.0.2で、ポップアップウィンドウ内の要素をjQueryを使って操作すると、
					// 内部(setDocument内)でownerDocument.parentWindow.frameElementが参照されるが、
					// IE8-ではポップアップウィンドウのframeElementにアクセスするとエラーになる。、
					// また、IE11の場合でjQuery1.10.1,2.0.2の場合setDocument内でattachEventが呼ばれるがIE11にはattachEventはなくエラーになる
					if (h5.env.ua.isIE
							&& (h5.env.ua.browserVersion === 11 || h5.env.ua.browserVersion <= 8)
							&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
						skipTest();
						return;
					}

					$('#qunit-fixture')
							.append(
									'<div id="controllerTest"><div id="controllerResult"></div><div id="a"><div class="b"></div></div><input type="button" value="click" /><button id="btn" name="click">btn</button></div>');
				},
				teardown: function() {
					clearController();
				}
			});
	//=============================
	// Body
	//=============================
	asyncTest(
			'[browser#and-and:all|sa-ios:all|ie-wp:all]window.open()で開いた先のコントローラを取得できること',
			3,
			function() {
				// 空のページを開く
				openPopupWindow()
						.done(
								function(w) {
									var div = w.document.createElement('div');
									w.document.body.appendChild(div);
									var c = h5.core.controller(div, {
										__name: 'popupWindowController'
									});
									c.readyPromise
											.done(function() {
												strictEqual(h5.core.controllerManager
														.getControllers(div)[0], c,
														'ポップアップウィンドウ内の要素のコントローラを取得できること');

												strictEqual(h5.core.controllerManager
														.getControllers(w.document.body, {
															deep: true
														})[0], c,
														'deep:trueオプションで、ポップアップウィンドウの要素内のコントローラを取得できること');
												notEqual($.inArray(this, h5.core.controllerManager
														.getAllControllers()), -1,
														'getAllControllers()でポップアップウィンドウ内の要素のコントローラを取得できること');
												c.dispose();
												closePopupWindow(w).done(function() {
													start();
												});
											});
								}).fail(function() {
							// ウィンドウが開けない(=ポップアップブロックされている)場合はテストをスキップ
							abortTest();
							start();
						});
			});

	//=============================
	// Definition
	//=============================
	module('iframe内の要素にコントローラをバインド', {
		setup: function() {
			// IE11EdgeかつjQuery1.10.1または2.0.2の場合はテストしない
			if (h5.env.ua.isIE && h5.env.ua.browserVersion === 11
					&& ($().jquery === '1.10.1' || $().jquery === '2.0.2')) {
				skipTest();
				return;
			}
			stop();
			var that = this;
			createIFrameElement().done(function(iframe, doc) {
				that.iframe = iframe;
				that.ifDoc = doc;

				// 要素の追加
				var div = doc.createElement('div');
				div.id = 'parent-div';
				var childDiv = doc.createElement('div');
				childDiv.id = 'controllerTest-1';
				var btn = doc.createElement('button');
				childDiv.appendChild(btn);
				div.appendChild(childDiv);
				doc.body.appendChild(div);
				that.parentDiv = div;
				that.childDiv = childDiv;
				start();
			});
		},
		teardown: function() {
			clearController();
			// iframe内のコントローラをdispose
			var iframeControllers = h5.core.controllerManager.getControllers(this.ifDoc, {
				deep: true
			});
			for (var i = iframeControllers.length - 1; i >= 0; i--) {
				iframeControllers[i].dispose();
			}
			$(this.iframe).remove();
		},
		parentDiv: null,
		childDiv: null,
		iframe: null,
		ifDoc: null
	});

	//=============================
	// Body
	//=============================
	asyncTest('イベントハンドラが動作すること', 1, function() {
		var that = this;
		// iframeの準備が終わるまで待機
		var result = '';
		var c = {
			__name: 'InIframeController',
			'button click': function() {
				result = 'button click';
			}
		};
		h5.core.controller($(that.ifDoc.body).find('#controllerTest-1'), c).readyPromise
				.done(function() {
					dispatchMouseEvent(this.$find('button')[0], 'click');
					strictEqual(result, 'button click', 'イベントハンドラが動作すること');
					start();
				});
	});
	asyncTest('グローバルセレクタで指定したイベントハンドラが動作すること', 1, function() {
		// iframeの準備が終わるまで待機
		var result = '';
		var c = {
			__name: 'InIframeController',
			'{#parent-div} click': function() {
				result = '{#parent-div} click';
			}
		};
		h5.core.controller($(this.ifDoc.body).find('#controllerTest-1'), c).readyPromise
				.done(function() {
					// jQuery1.6.4でtriggerだとwindowにバインドしないので、dispatchを使っている
					dispatchMouseEvent(this.$find('button')[0], 'click');
					strictEqual(result, '{#parent-div} click', 'イベントハンドラが動作すること');
					start();
				});
	});
	asyncTest(
			'{window},{document}にバインドしたイベントハンドラがiframeのもつwindow,documentに対して動作すること',
			4,
			function() {
				// iframeの準備が終わるまで待機
				var result = [];
				var c = {
					__name: 'InIframeController',
					'{window} myEvent': function() {
						result.push('{window} myEvent');
					},
					'{document} click': function() {
						result.push('{document} click');
					}
				};
				// ルートのwindow側にバインドしたイベントハンドラが実行されないことを確認
				function winHandler(event) {
					result.push('root window ' + event.type);
				}
				function docHandler(event) {
					result.push('root document ' + event.type);
				}
				$(window).bind('myEvent', winHandler);
				$(document).bind('click', docHandler);
				var that = this;
				h5.core.controller($(this.ifDoc.body).find('#controllerTest-1'), c).readyPromise
						.done(function() {
							dispatchMouseEvent(this.$find('button')[0], 'click');
							deepEqual(result, ['{document} click'],
									'iframe内のイベントがバブリングして、iframeの{document}のイベントハンドラが動作すること');

							result = [];
							$(that.iframe.contentWindow).trigger('myEvent');
							deepEqual(result, ['{window} myEvent'],
									'iframeのwindowにバインドしたイベントハンドラが、iframeのwindowでtriggerした時に動作すること');

							result = [];
							dispatchMouseEvent(document, 'click');
							deepEqual(result, ['root document click'],
									'元ページのdocumentでイベントを実行しても、iframeのdocumentにバインドしたハンドラは動作しないこと');

							result = [];
							$(window).trigger('myEvent');
							deepEqual(result, ['root window myEvent'],
									'元ページのwindowでイベントを実行しても、iframeのdocumentにバインドしたハンドラは動作しないこと');

							// unbind
							$(window).unbind('myEvent', winHandler);
							$(document).unbind('click', docHandler);
							start();
						});
			});
	asyncTest('iframe内の要素にバインドしたコントローラでルート要素にインジケータを表示', 4,
			function() {
				var controllerBase = {
					__name: 'TestController',

					'button click': function() {
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

						var that = this;
						setTimeout(function() {
							indicator.hide();

							setTimeout(function() {
								strictEqual($('.h5-indicator', indicator._target).length, 0,
										'Indicator#hide() インジケータが除去されていること');

								that.unbind();
								start();
							}, 0);
						}, 0);
					}
				};
				h5.core.controller(this.parentDiv, controllerBase).readyPromise.done(function() {
					this.$find('button').click();
				});
			});

	//=============================
	// Definition
	//=============================
	module('プロパティ"xxxController"に子コントローラでないものを持たせる', {
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
	asyncTest('親をdisposeした時、子コントローラでないコントローラはdisposeされないこと', 2, function() {
		var c1 = h5.core.controller('#controllerTest', {
			__name: 'C1',
			__ready: function() {
				this.childController = c2;
			}
		});
		var c2 = h5.core.controller('#controllerTest', {
			__name: 'C2'
		});
		h5.async.when(c1.readyPromise, c2.readyPromise).done(function() {
			c1.dispose().done(function() {
				ok(isDisposed(c1), 'ルートコントローラがdisposeされていること');
				ok(!isDisposed(c2), '子コントローラでないコントローラはdisposeされていないこと');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('親をdisposeした時、別の親に属する子コントローラはdisposeされないこと', 2, function() {
		var c1 = h5.core.controller('#controllerTest', {
			__name: 'C1'
		});
		var c2 = h5.core.controller('#controllerTest', {
			__name: 'C2',
			childController: {
				__name: 'C2Child'
			}
		});
		h5.async.when(c1.readyPromise, c2.readyPromise).done(function() {
			c1.childController = c2.childController
			c1.dispose().done(function() {
				ok(!isDisposed(c2.childController), '子コントローラでないコントローラはdisposeされていないこと');
				strictEqual(c1.childController, null, 'コントローラを持っていたプロパティにはnullが代入されていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('xxxControllerに自分自身を持っていても正しくdisposeできること', 1, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'C1',
			__ready: function() {
				this.childController = this;
			}
		});
		c.readyPromise.done(function() {
			c.dispose().done(function() {
				ok(isDisposed(c), 'コントローラがdisposeされていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('xxxControllerに親コントローラを持っていても正しくdisposeできること', 2, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'C1',
			childController: {
				__name: 'C2',
				__ready: function() {
					this.pController = this.parentController;
				}
			}
		});
		c.readyPromise.done(function() {
			var childController = c.childController;
			c.dispose().done(function() {
				ok(isDisposed(c), 'コントローラがdisposeされていること');
				ok(isDisposed(childController), '子コントローラがdisposeされていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('xxxControllerに孫コントローラを持っていても正しくdisposeできること', 3, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'C1',
			childController: {
				__name: 'C2',
				childController: {
					__name: 'C3',
					__ready: function() {
						this.gpController = this.rootController;
					}
				}

			}
		});
		c.readyPromise.done(function() {
			var childController = c.childController;
			var gchildController = c.childController.childController;
			c.dispose().done(function() {
				ok(isDisposed(c), 'コントローラがdisposeされていること');
				ok(isDisposed(childController), '子コントローラがdisposeされていること');
				ok(isDisposed(gchildController), '子コントローラがdisposeされていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('同じ子コントローラを参照するxxxControllerが複数ある場合、正しくdisposeできること', 2, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'C1',
			childController: {
				__name: 'C2'
			},
			__ready: function() {
				this.child2Controller = this.childController;
			}
		});
		c.readyPromise.done(function() {
			var childController = c.childController;
			c.dispose().done(function() {
				ok(isDisposed(c), 'コントローラがdisposeされていること');
				ok(isDisposed(childController), '子コントローラがdisposeされていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});
});
