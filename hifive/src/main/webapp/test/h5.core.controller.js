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

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.controller;
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
			"Controller - expose",
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
	module("Controller - controller", {
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

	test('__name属性が文字列でないオブジェクトをコントローラとしてバインドしようとするとエラーが出ること', function() {
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

	test('__name属性が文字列でないロジックを持つコントローラをバインドしようとするとエラーが出ること', function() {
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
				deepEqual(e.code, errorCode, e.message);
			}
		}
	});

	test('h5.core.controller() 不正な引数を渡した場合、及び指定された要素が存在しないまたは、複数ある場合にエラーが出ること', 9, function() {
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
		try {
			h5.core.controller({}, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_NODE, e.message);
		}
		try {
			h5.core.controller(window, controller);
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_BIND_NOT_NODE, e.message);
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

	test('__name属性のないオブジェクトを子コントローラとしてバインドしようとするとエラーが出ること', function() {
		var errorCode = ERR.ERR_CODE_INVALID_CONTROLLER_NAME;
		var controller = {
			__name: 'A',
			childController: {}
		};
		try {
			h5.core.controller('#controllerTest', controller);
			ok(false, 'エラーが発生していません。');
		} catch (e) {
			deepEqual(e.code, errorCode, e.message);
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
				equal(e.code, ERR.ERR_CODE_CONTROLLER_ALREADY_CREATED,
						'コントローラ化済みのオブジェクトを渡すとエラーが発生したか');
			}
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module("Controller - コントローラが上げるイベント", {
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
	module("Controller - イベントハンドラ", {
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

	asyncTest('イベントハンドラの動作 {}記法で外側の要素を含めて指定', 7, function() {
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

	asyncTest('イベントハンドラの動作 {}記法でオブジェクトを指定', 2, function() {
		var $eventTarget = $('<div id="target1">');
		var $controllerTarget = $('#controllerTest');
		$controllerTarget.append($eventTarget);
		window.test1 = {
			target: $eventTarget
		};
		var result = false;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				this.$find('#target1').click();
				ok(result, '{window.test1.target}にバインドしたイベントハンドラが動作していること');
				this.unbind();
				result = false;
				this.$find('#target1').click();
				ok(!result, 'unbindするとイベントハンドラは動作しなくなること');

				// テストで作成したwindow.test1を削除
				deleteProperty(window, 'test1');
				start();
			},
			'{window.test1.target} click': function(context) {
				result = true;
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

	test('"{this} eventName"の指定はエラーになってコントローラをバインドできない', function() {
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
			'context.selectorが取得できること',
			20,
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

					test1Controller.unbind();
					$('#controllerTest3').remove();
					ok(!$('#parent').length, '（DOMのクリーンアップ）');
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
	asyncTest('イベントをバインド指定した要素が第二引数に渡されること', 10, function() {
		var parentElm = $('#controllerTest #parent')[0];
		var childElm = $('#controllerTest #child')[0];
		window.h5test1 = {
			target: parentElm
		};
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
			'{window} click': function(context, $el) {
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], window, '第二引数がバインド先の要素(window)であること');
			},
			'{window.h5test1.target} click': function(context, $el){
				ok(h5.u.obj.isJQueryObject($el), '第二引数がjQueryObjectであること');
				strictEqual($el[0], window.h5test1.target, '第二引数がバインド先の要素(window.h5test1.parentElm)であること');
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			$('#child').click();
			deleteProperty(window, 'h5test1');
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
				strictEqual(el, parentElm, 'listenerElementType = 0 の時、第二引数がバンド先のDOM要素(≠jQueryオブジェクト)であること');
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
			"Controller - イベントハンドラ - h5trackイベント",
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
	module("Controller - __meta", {
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

	asyncTest('子コントローラのルートエレメントを親の__initでテンプレートで追加した要素にする', function() {
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

	asyncTest('子コントローラのルートエレメントを親の__initでテンプレートで追加した要素を選択するセレクタにする', function() {
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

	asyncTest('rootElementにnullを指定', function() {
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

	asyncTest('rootElementにundefinedを指定', function() {
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
	module("Controller - unbind", {
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
	asyncTest('コントローラをunbindするとイベントハンドラがアンバインドされる', function() {
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

	asyncTest('子コントローラではunbind()はできないこと', function() {
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

	//=============================
	// Definition
	//=============================
	module(
			"Controller - bind(コントローラの再利用)",
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

	//=============================
	// Definition
	//=============================
	module(
			"Controller - テンプレート",
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

	asyncTest('テンプレートが存在しない時のコントローラの動作', 8, function() {
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
			__postInit: function(context) {
				ok(false, 'テスト失敗。__postInitが実行された');
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
		testController.preInitPromise.done(function() {
			ok(false, 'テスト失敗。preInitPromiseがresolve()された');
		}).fail(function(e) {
			deepEqual(++count, 2, 'preInitPromiseのfailハンドラが実行される。');
			strictEqual(this, testController, 'failハンドラのthisはコントローラインスタンス');
		});
		testController.postInitPromise.done(function(a) {
			ok(false, 'テスト失敗。postInitPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(true, 'postInitPromiseのfailハンドラが実行される');
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

	asyncTest('テンプレートのロードに失敗した時に実行されるライフサイクルイベント', 24, function() {
		var disposedController = {};
		var bController = {
			__name: 'BController',

			__construct: function(context) {
				ok(true, '孫コントローラのコンストラクタが実行される');
				var grandChildInstance = this;
				this.preInitPromise.done(function() {
					ok(true, '孫コントローラのpreInitPromiseのdoneハンドラが呼ばれる');
				}).fail(function() {
					ok(false, 'テスト失敗。孫コントローラのpreInitPromiseのfailハンドラが呼ばれた');
				});
				this.initPromise.done(function() {
					ok(false, 'テスト失敗。孫コントローラのinitPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '孫コントローラのinitPromiseのfailハンドラが呼ばれる');
				});
				this.postInitPromise.done(function() {
					ok(false, 'テスト失敗。孫コントローラのpostInitPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '孫コントローラのpostInitPromiseのfailハンドラが呼ばれる');
				});
				this.readyPromise.done(function() {
					ok(false, 'テスト失敗。孫コントローラのreadyPromiseのdoneハンドラが呼ばれた');
					start();
				}).fail(function() {
					ok(true, '孫コントローラのreadyPromiseのfailハンドラが呼ばれる');
				});
			},
			__init: function(context) {
				ok(false, 'テスト失敗。孫コントローラの__initが実行された');
			},
			__postInit: function(context) {
				ok(false, 'テスト失敗。孫コントローラの__postInitが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。孫コントローラの__readyが実行された');
			},
			__unbind: function(context) {
				ok(true, '孫コントローラの__unbindが実行される');
			},
			__dispose: function(context) {
				ok(true, '孫コントローラの__disposeが実行される');
				disposedController.b = this;
			}
		};
		var aController = {
			__name: 'AController',
			__templates: '/noExistPath',
			childController: bController,

			__construct: function(context) {
				ok(true, '子コントローラのコンストラクタが実行される');
				this.preInitPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのpreInitPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '子コントローラのpreInitPromiseのfailハンドラが呼ばれる');
				});
				this.initPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのinitPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '子コントローラのinitPromiseのfailハンドラが呼ばれる');
				});
				this.postInitPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのpostInitPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '子コントローラのpostInitPromiseのfailハンドラが呼ばれる');
				});
				this.readyPromise.done(function() {
					ok(false, 'テスト失敗。子コントローラのreadyPromiseのdoneハンドラが呼ばれた');
				}).fail(function() {
					ok(true, '子コントローラのreadyPromiseのfailハンドラが呼ばれる');
				});
			},
			__init: function(context) {
				ok(false, 'テスト失敗。子コントローラの__initが実行された');
			},
			__postInit: function(context) {
				ok(false, 'テスト失敗。子コントローラの__postInitが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。子コントローラの__readyが実行された');
			},
			__unbind: function(context) {
				ok(true, '子コントローラの__unbindが実行される');
			},
			__dispose: function(context) {
				ok(true, '子コントローラの__disposeが実行される');
				disposedController.a = this;
			}
		};

		var controller = {
			__name: 'TestController',
			__templates: ['./template/test2.ejs'],
			childController: aController,

			__construct: function(context) {
				ok(true, '親コントローラのコンストラクタが実行される');
			},
			__init: function(context) {
			// 親の__initは、その前にコントローラ群がdisposeされていれば実行されない
			},
			__postInit: function(context) {
				ok(false, 'テスト失敗。親コントローラの__postInitが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。親コントローラの__readyが実行された');
			},
			__dispose: function(context) {
				ok(true, '親コントローラの__disposeが実行される');
				// 自分以下のコントローラがdisposeされていることをチェック
				disposedController.test = this;
				setTimeout(function() {
					for (var i = 0; i < 3; i++) {
						var prop = ['b', 'a', 'test'][i];
						var str = ['孫', '子', '親'][i];
						ok(isDisposed(disposedController[prop]), str + 'コントローラがdisposeされていること');
					}
					start();
				}, 0);
			},
			__unbind: function(context) {
				ok(true, '親コントローラの__unbindが実行される');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		// 親のpreInitPromiseのfailが呼ばれたらテスト失敗。
		// doneについては、呼ばれるか呼ばれないか不定であるため、チェックしない。
		//   子のテンプレートロードが失敗する前に親のテンプレートロードが始まっていればdoneは実行されるが、
		//   そうでない時は親はテンプレートをロードしないため、doneもfailも実行されない。
		testController.preInitPromise.fail(function() {
			ok(false, 'テスト失敗。親コントローラのpreInitPromiseのfailハンドラが呼ばれた');
		});

		// 親のinitPromiseのfailが呼ばれたらテスト失敗。
		// doneについては、呼ばれるか呼ばれないか不定であるため、チェックしない。
		//   子のテンプレートロードが失敗する前に親のテンプレートロードが始まっていればdoneは実行されるが、
		//   そうでない時は親はテンプレートをロードしないため、doneもfailも実行されない。
		testController.initPromise.fail(function(result) {
			ok(false, '親コントローラのinitPromiseのfailハンドラが呼ばれた');
		});
		testController.postInitPromise.done(function() {
			ok(false, 'テスト失敗。親コントローラのpostInitPromiseのdoneハンドラが呼ばれた');
		}).fail(function(result) {
			equal(result.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX);
			ok(true, '親コントローラのpostInitPromiseのfailハンドラが呼ばれる');
		});
		testController.readyPromise.done(function() {
			ok(false, 'テスト失敗。親コントローラのreadyPromiseのdoneハンドラが呼ばれた');
		}).fail(function(result) {
			equal(result.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX);
			ok(true, '親コントローラのreadyPromiseのfailハンドラが呼ばれる');
		});
	});

	asyncTest('h5.settings.dynamicLoading.retryCountでテンプレートのロードのリトライ回数を設定できること', function() {
		// テンプレートロードのリトライ時のインターバルを0msに設定
		h5.settings.dynamicLoading.retryInterval = 0;
		// リトライ回数を2回に設定
		h5.settings.dynamicLoading.retryCount = 2;
		// view.load()をスタブに差し替え
		var loadCount = 0;
		var load = function() {
			loadCount++;
			var dfd = h5.async.deferred();
			var e = {
				detail: {
					error: {
						status: h5.env.ua.isIE ? 0 : 12029
					}
				}
			};
			dfd.reject(e);
			return dfd.promise();
		};
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
		testController.initPromise.done(function(a) {
			ok(false, 'ロードできないテンプレートを指定してコントローラのバインドが失敗しませんでした');
			h5.core.view.createView = originalCreateView;
			start();
		}).fail(function(e, opt) {
			strictEqual(loadCount, 3, 'リトライ回数2回なのでロードを試みた回数は3回になっていること');
			h5.core.view.createView = originalCreateView;
			start();
		});
	});

	asyncTest('テンプレートのロードが通信エラーで失敗した場合、3回リトライして、3回目で成功したらコントローラ化が行われること', 8, function() {
		// テンプレートロードのリトライ時のインターバルを0msに設定
		h5.settings.dynamicLoading.retryInterval = 0;
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
				deepEqual(++count, 3, '__initが実行される。');
			},
			__postInit: function(context) {
				deepEqual(++count, 5, '__postInitが実行される。');
			},
			__ready: function(context) {
				deepEqual(++count, 7, '__readyが実行される。');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preInitPromise.done(function(a) {
			deepEqual(++count, 2, 'preInitPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(false, 'テスト失敗。initPromiseがreject()された');
		});
		testController.initPromise.done(function(a) {
			deepEqual(++count, 4, 'initPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(false, 'テスト失敗。initPromiseがreject()された');
		});
		testController.postInitPromise.done(function(a) {
			deepEqual(++count, 6, 'postInitPromiseがresolve()された');
		}).fail(function(e, opt) {
			ok(false, 'テスト失敗。initPromiseがreject()された');
		});
		testController.readyPromise.done(function(a) {
			deepEqual(++count, 8, 'readyPromiseがresolve()された');
			h5.core.view.createView = originalCreateView;
			start();
		});
	});

	asyncTest(
			'テンプレートのロードが通信エラーで失敗した場合、3回リトライして失敗ならpreInitPromiseのfailが呼ばれること',
			14,
			function() {
				// テンプレートロードのリトライ時のインターバルを0msに設定
				h5.settings.dynamicLoading.retryInterval = 0;
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
					__postInit: function(context) {
						ok(false, 'テスト失敗。__postInitが実行された');
					},
					__ready: function(context) {
						ok(false, 'テスト失敗。__readyが実行された');
					},
					__dispose: function(context) {
						deepEqual(++count, 7, '__disposeが実行される。');
					},
					__unbind: function(context) {
						deepEqual(++count, 6, '__unbindが実行される。');
					}
				};

				var testController = h5.core.controller('#controllerTest', controller);

				var errorObj = null;
				testController.preInitPromise.done(function() {
					// createViewを元に戻す
					h5.core.view.createView = originalCreateView;
					ok(false, 'テスト失敗。preInitPromiseがresolve()された');
					h5.core.view.createView = originalCreateView;
					start();
				}).fail(function(e) {
					// createViewを元に戻す
					h5.core.view.createView = originalCreateView;
					errorObj = e;
					deepEqual(++count, 2, 'preInitPromiseのfailハンドラが実行される。');
					strictEqual(this, testController, 'thisはコントローラインスタンスであること');
				});
				testController.initPromise
						.done(function(a) {
							ok(false, 'テスト失敗。initPromiseがresolve()された');
							start();
						})
						.fail(
								function(e) {
									deepEqual(++count, 3, 'initPromiseがreject()された');
									strictEqual(this, testController, 'thisはコントローラインスタンスであること');
									strictEqual(e, errorObj,
											'preInitPromiseのfailで取得したエラーオブジェクトとinitPromiseのfailで取得したエラーオブジェクトが同じであること');
								});
				testController.postInitPromise
						.done(function(a) {
							ok(false, 'テスト失敗。postInitPromiseがresolve()された');
							start();
						})
						.fail(
								function(e) {
									deepEqual(++count, 4, 'postInitPromiseがreject()された');
									strictEqual(this, testController, 'thisはコントローラインスタンスであること');
									strictEqual(e, errorObj,
											'preInitPromiseのfailで取得したエラーオブジェクトとpostInitPromiseのfailで取得したエラーオブジェクトが同じであること');
								});
				testController.readyPromise
						.done(function() {
							ok(false, 'テスト失敗。 readyPromiseがresolve()された');
							start();
						})
						.fail(
								function(e) {
									strictEqual(++count, 5, 'readyPromiseがreject()された');
									strictEqual(this, testController, 'thisはコントローラインスタンスであること');
									strictEqual(e, errorObj,
											'preInitPromiseのfailで取得したエラーオブジェクトとreadyPromiseのfailで取得したエラーオブジェクトが同じであること');
									start();
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
			__postInit: function(context) {
				ok(false, 'テスト失敗。__postInitが実行された');
			},
			__ready: function(context) {
				ok(false, 'テスト失敗。__readyが実行された');
			},
			__dispose: function(context) {
				deepEqual(++count, 7, '__disposeが実行される。');
				start();
			},
			__unbind: function(context) {
				deepEqual(++count, 6, '__unbindが実行される。');
			}
		};

		var testController = h5.core.controller('#controllerTest', controller);
		testController.preInitPromise.done(function() {
			ok(false, 'テスト失敗。preInitPromiseがresolve()された');
		}).fail(function(e) {
			deepEqual(++count, 2, 'preInitPromiseのfailハンドラが実行される。');
		});
		testController.initPromise.done(function(a) {
			ok(false, 'テスト失敗。initPromiseがresolve()された');
		}).fail(function(e, opt) {
			deepEqual(++count, 3, 'initPromiseがreject()された');
		});
		testController.postInitPromise.done(function(a) {
			ok(false, 'テスト失敗。postInitPromiseがresolve()された');
		}).fail(function(e, opt) {
			deepEqual(++count, 4, 'postInitPromiseがreject()された');
		});
		testController.readyPromise.done(function(a) {
			ok(false, 'テスト失敗。readyPromiseがresolve()された');
			start();
		}).fail(function(e, opt) {
			deepEqual(++count, 5, 'readyPromiseがreject()された');
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

	asyncTest('view.append()に指定されたDOM要素が{window*},{document*}である時にエラーが発生すること', 7, function() {
		var append = '';
		var append2 = '';
		var prepend = '';
		var viewError1 = null;
		var viewError2 = null;
		var viewError3 = null;
		var viewError4 = null;
		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs', './template/test3.ejs', './template/test8.ejs'],

			'input[type=button] click': function(context) {
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
		testController.readyPromise.done(function() {
			$('#controllerTest input[type=button]').click();
			strictEqual(append, 'test', 'this.view.appendでテンプレートからHTML文字列を取得し、指定要素に出力できたか');
			strictEqual(append2, 'test',
					'this.view.appendでテンプレートからHTML文字列を取得し、グローバルセレクタで指定した要素に出力できたか');
			strictEqual(prepend, 'test', 'this.view.prependでテンプレートからHTML文字列を取得し、指定要素に出力できたか');

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
			// h5.core.viewに追加したテンプレートをクリア
			h5.core.view.clear('template3');
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

	asyncTest('多重にネストしたコントローラで一番下の子がテンプレートを保持している場合に正しい順番で初期化処理が行われること', function() {
		var result = [];
		var root1 = null;
		var root2 = null;
		var root3 = null;

		var constructResult = [];
		var initResult = [];
		var postInitResult = [];
		var readyResult = [];
		var delegate1Controller = {
			__name: 'Delegate1Controller',

			__templates: ['template/test9.ejs'],

			__construct: function() {
				constructResult.push(2);
			},

			__init: function() {
				initResult.push(2);
			},

			__postInit: function() {
				postInitResult.push(0);
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

			__postInit: function() {
				postInitResult.push(1);
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
				constructResult.push(0);
			},

			__init: function() {
				initResult.push(0);
			},

			__postInit: function() {
				postInitResult.push(2);
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

	//=============================
	// Definition
	//=============================
	module(
			"Controller - ライフサイクルイベント",
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
	asyncTest('ライフサイクルイベントの実行順序', function() {
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
		var a = {
			__name: 'A',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'B',
				__construct: construct,
				__init: init,
				__postInit: postInit,
				__ready: ready,
				cController: {
					__name: 'C',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			deepEqual(result, ['A__construct', 'B__construct', 'C__construct', 'A__init',
					'B__init', 'C__init', 'C__postInit', 'B__postInit', 'A__postInit', 'C__ready',
					'B__ready', 'A__ready'], '実行順序が正しいこと');
			start();
		});
	});

	asyncTest('ライフサイクルイベントの実行順序(非同期)', function() {
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
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__construct');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncInit() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__init');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncPostInit() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__postInit');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncReady() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__ready');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		var a = {
			__name: 'A',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'B',
				__construct: asyncConstruct,
				__init: asyncInit,
				__postInit: asyncPostInit,
				__ready: asyncReady,
				cController: {
					__name: 'C',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			deepEqual(result, ['A__construct', 'C__construct', 'B__construct', 'A__init',
					'B__init', 'C__init', 'C__postInit', 'B__postInit', 'A__postInit', 'C__ready',
					'B__ready', 'A__ready'], 'Bコントローラの各ライフサイクルが非同期の場合の実行順序が正しいこと');
			start();
		});
	});

	asyncTest(
			'preInitPromise,initPromise,postInitPromise,readyPromiseのdoneに登録したハンドラのthisはコントローラインスタンスであること',
			8, function() {
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

	asyncTest(
			'preInitPromise,initPromise,postInitPromise,readyPromise.failに登録したハンドラのthisはコントローラインスタンス、引数はview.loadのエラーオブジェクトであること',
			16, function() {
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
					strictEqual(this, child,
							'子コントローラのpreInitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
					strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
							'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
				});
				child.initPromise.fail(function(arg) {
					strictEqual(this, child,
							'子コントローラのinitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
					strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
							'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
				});
				child.postInitPromise.fail(function(arg) {
					strictEqual(this, child,
							'子コントローラのpostInitPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
					strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
							'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
				});
				child.readyPromise.fail(function(arg) {
					strictEqual(this, child,
							'子コントローラのreadyPromiseのfailハンドラ:thisは子コントローラのインスタンスであること');
					strictEqual(arg.code, ERR_VIEW.ERR_CODE_TEMPLATE_AJAX,
							'引数はloadのエラーオブジェクトであり、エラーコードが格納されていること');
				});
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

	asyncTest(
			'コントローラのdispose __constructでthis.disposeを呼ぶと__init,__readyは実行されず、initPromise,readyPromiseのfailハンドラが実行される',
			7, function() {
				var flag = false;
				var controller = {
					__name: 'TestController',
					__construct: function() {

						this.preInitPromise.done(function() {
							ok(true, 'preInitPromiseのdoneハンドラが実行された');
						}).fail(function() {
							ok(false, 'テスト失敗。preInitPromiseのfailハンドラが実行された');
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

				strictEqual(h5.core.controller('#controllerTest', controller), null,
						'h5.core.controller()がnullを返すこと');
			});

	asyncTest(
			'コントローラのdispose preInitProimseのdoneハンドラでthis.disposeを呼ぶと__init,__readyは実行されず、initPromise,readyPromiseのfailハンドラが実行されること',
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
				testController.preInitPromise.done(function() {
					ok(true, 'preInitPromiseのdoneハンドラが実行されること');
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
				testController.preInitPromise.done(function() {
					ok(true, 'preInitPromiseのdoneハンドラが実行されること');
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

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 __init, __readyで、resolveされる時の挙動', 20, function() {
		var dfdChild1Init = h5.async.deferred();
		var dfdChild1PostInit = h5.async.deferred();
		var dfdChild1Ready = h5.async.deferred();
		var dfdChild2Init = h5.async.deferred();
		var dfdChild2PostInit = h5.async.deferred();
		var dfdChild2Ready = h5.async.deferred();
		var dfdRootInit = h5.async.deferred();
		var dfdRootPostInit = h5.async.deferred();
		var dfdRootReady = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller',
				__init: function() {
					ok(true, '子コントローラ１の__initが実行される');
					ok(isResolved(dfdRootInit), 'ルートコントローラの__initが返したpromiseがresolveされていること');
					setTimeout(function() {
						dfdChild1Init.resolve();
					}, 0);
					return dfdChild1Init.promise();
				},
				__postInit: function() {
					ok(true, '子コントローラ１の__postInitが実行される');
					setTimeout(function() {
						dfdChild1PostInit.resolve();
					}, 0);
					return dfdChild1PostInit.promise();
				},
				__ready: function() {
					ok(true, '子コントローラ１の__readyが実行される');
					setTimeout(function() {
						dfdChild1Ready.resolve();
					}, 0);
					return dfdChild1Ready.promise();
				}
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					ok(true, '子コントローラ２の__initが実行される');
					ok(isResolved(dfdRootInit), 'ルートコントローラの__initが返したpromiseがresolveされていること');
					setTimeout(function() {
						dfdChild2Init.resolve();
					}, 0);
					return dfdChild2Init.promise();
				},
				__postInit: function() {
					ok(true, '子コントローラ２の__postInitが実行される');
					setTimeout(function() {
						dfdChild2PostInit.resolve();
					}, 0);
					return dfdChild2PostInit.promise();
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
				setTimeout(function() {
					dfdRootInit.resolve();
				}, 0);
				return dfdRootInit.promise();
			},
			__postInit: function() {
				ok(true, 'ルートコントローラの__postInitが実行される');
				ok(isResolved(dfdChild1PostInit), '子コントローラ１の__postInitが返したpromiseがresolveされていること');
				ok(isResolved(dfdChild2PostInit), '子コントローラ２の__postInitが返したpromiseがresolveされていること');
				setTimeout(function() {
					dfdRootPostInit.resolve();
				}, 0);
				return dfdRootPostInit.promise();
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

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 ルートの__initが返すpromiseがrejectされる時の挙動', 5, function() {
		var dfd = h5.async.deferred();
		var controller = {
			__name: 'TestController',
			child1Controller: {
				__name: 'child1Controller',
				__init: function() {
					ok(false, '子コントローラの__initは実行されないこと');
				},
				__postInit: function() {
					ok(false, '子コントローラの__postInitは実行されないこと');
				},
				__ready: function() {
					ok(false, '子コントローラの__readyは実行されないこと');
				}
			},
			child2Controller: {
				__name: 'child2Controller',
				__init: function() {
					ok(false, '子コントローラの__initは実行されないこと');
				},
				__postInit: function() {
					ok(false, '子コントローラの__postInitは実行されないこと');
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
			__postInit: function() {
				ok(false, 'ルートコントローラの__postInitは実行されないこと');
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

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 子の__initが返すpromiseがrejectされる時の挙動', 7, function() {
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
						dfd.reject(1, 2);
					}, 0);
					return dfd.promise();
				}
			},
			__init: function() {
				ok(true, 'ルートコントローラの__initが実行されること');
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
			ok(true, 'ルートコントローラのinitPromiseのdoneが実行されること');
			this.child2Controller.initPromise.fail(function(e) {
				ok(true, '子コントローラのinitPromiseのfailハンドラが実行されること');
				deepEqual(e.detail, [1, 2], 'reject時の引数が取得できること');
				ok(isRejected(dfd), '子コントローラの__initが返したpromiseがrejectされていること');
			});
		});
	});

	asyncTest('ライフサイクルイベントがpromiseを返す時の挙動 子の__readyが返すpromiseがrejectされる時の挙動', 5, function() {
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
						dfd.reject(1, 2);
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
		}).fail(function(e) {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
			deepEqual(e.detail, [1, 2], 'reject時の引数が取得できること');
			ok(isRejected(dfd), '子コントローラの__readyが返したpromiseがrejectされていること');
		});
	});

	asyncTest(
			'ライフサイクルイベントがjQueryオブジェクトを返す時の挙動 jQueryオブジェクトを返した場合にpromiseを返したとは判定されずに何も返していない時と同じ挙動になること',
			12, function() {
				var jQueryObj = $(document.body);
				var order = 1;
				var controller = {
					__name: 'TestController',
					child1Controller: {
						__name: 'child1Controller',
						__construct: function() {
							strictEqual(order++, 2, '子コントローラの___constructが2番目に実行されること');
							return jQueryObj;
						},
						__init: function() {
							strictEqual(order++, 4, '子コントローラの___initが4番目に実行されること');
							return jQueryObj;
						},
						__postInit: function() {
							strictEqual(order++, 5, '子コントローラの___postInitが5番目に実行されること');
							return jQueryObj;
						},
						__ready: function() {
							strictEqual(order++, 7, '子コントローラの___readyが7番目に実行されること');
							return jQueryObj;
						},
						__unbind: function() {
							strictEqual(order++, 9, '子コントローラの___unbindが9番目に実行されること');
							return jQueryObj;
						},
						__dispose: function() {
							strictEqual(order++, 11, '子コントローラの___disposeが11番目に実行されること');
							return jQueryObj;
						}
					},
					__construct: function() {
						strictEqual(order++, 1, 'ルートコントローラの___constructが1番目に実行されること');
						return jQueryObj;
					},
					__init: function() {
						strictEqual(order++, 3, 'ルートコントローラの___initが3番目に実行されること');
						return jQueryObj;
					},
					__postInit: function() {
						strictEqual(order++, 6, 'ルートコントローラの___postInitが6番目に実行されること');
						return jQueryObj;
					},
					__ready: function() {
						strictEqual(order++, 8, 'ルートコントローラの___readyが8番目に実行されること');
						return jQueryObj;
					},
					__unbind: function() {
						strictEqual(order++, 10, 'ルートコントローラの___unbindが10番目に実行されること');
						return jQueryObj;
					},
					__dispose: function() {
						strictEqual(order++, 12, 'ルートコントローラの___disposeが11番目に実行されること');
						return jQueryObj;
					}
				};
				var c = h5.core.controller('#controllerTest', controller);
				c.readyPromise.done(function() {
					c.dispose().done(function() {
						start();
					});
				}).fail(function(e) {
					ok(false, 'ルートコントローラのreadyPromiseのfailハンドラが実行された');
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

	asyncTest('__construct, __init, __postInit, __readyが動作するタイミングは正しいか1(テンプレート使用)', 31, function() {
		var ip1 = null;
		var ip2 = null;
		var ip3 = null;
		var ip4 = null;
		var pp1 = null;
		var pp2 = null;
		var pp3 = null;
		var pp4 = null;
		var rp1 = null;
		var rp2 = null;
		var rp3 = null;
		var rp4 = null;
		var ir = null;
		var pr = null;
		var rr = null;
		var array = [];
		var controller = {
			__name: 'TestController',

			__templates: ['./template/test2.ejs'],

			__construct: function() {
				ip1 = this.initPromise;
				pp1 = this.postInitPromise;
				rp1 = this.readyPromise;
				array.push(0);
			},

			__init: function() {
				ir = this.rootElement;
				ip2 = this.initPromise;
				pp2 = this.postInitPromise;
				rp2 = this.readyPromise;
				array.push(1);
			},
			__postInit: function() {
				pr = this.rootElement;
				ip3 = this.initPromise;
				pp3 = this.postInitPromise;
				rp3 = this.readyPromise;
				array.push(2);
			},

			__ready: function() {
				rr = this.rootElement;
				ip4 = this.initPromise;
				pp4 = this.postInitPromise;
				rp4 = this.readyPromise;
				array.push(3);
			}
		};
		var testController = h5.core.controller('#controllerTest', controller);

		var noip1 = null;
		var noip2 = null;
		var noip3 = null;
		var noip4 = null;
		var nopp1 = null;
		var nopp2 = null;
		var nopp3 = null;
		var nopp4 = null;
		var norp1 = null;
		var norp2 = null;
		var norp3 = null;
		var norp4 = null;
		var noir = null;
		var nopr = null;
		var norr = null;
		var controller2 = {
			__name: 'NoTemplateController',

			__construct: function() {
				noip1 = this.initPromise;
				nopp1 = this.postInitPromise;
				norp1 = this.readyPromise;
			},

			__init: function() {
				noir = this.rootElement;
				noip2 = this.initPromise;
				nopp2 = this.postInitPromise;
				norp2 = this.readyPromise;
			},

			__postInit: function() {
				nopr = this.rootElement;
				noip3 = this.initPromise;
				nopp3 = this.postInitPromise;
				norp3 = this.readyPromise;
			},

			__ready: function() {
				norr = this.rootElement;
				noip4 = this.initPromise;
				nopp4 = this.postInitPromise;
				norp4 = this.readyPromise;
			}
		};

		var noTemplateController = h5.core.controller('#controllerTest', controller2);

		h5.async.when(testController.readyPromise, noTemplateController.readyPromise).done(
				function() {
					strictEqual(array.join(';'), '0;1;2;3',
							'__construct, __init, __postInit, __readyは適切なタイミングで発火しているか');
					ok(ip1, '__constructイベントの中でinitPromiseに触れるか');
					ok(pp1, '__constructイベントの中でpostInitPromiseに触れるか');
					ok(rp1, '__constructイベントの中でreadyPromiseに触れるか');
					ok(ip2, '__initイベントの中でinitPromiseに触れるか');
					ok(pp2, '__initイベントの中でpostInitPromiseに触れるか');
					ok(rp2, '__initイベントの中でreadyPromiseに触れるか');
					ok(ip3, '__postInitイベントの中でinitPromiseに触れるか');
					ok(pp3, '__postInitイベントの中でpostInitPromiseに触れるか');
					ok(rp3, '__postInitイベントの中でreadyPromiseに触れるか');
					ok(ip4, '__readyイベントの中でinitPromiseに触れるか');
					ok(pp4, '__readyイベントの中でpostInitPromiseに触れるか');
					ok(rp4, '__readyイベントの中でreadyPromiseに触れるか');


					ok(noip1, 'テンプレートを使わない場合でも、__constructイベントの中でinitPromiseに触れるか');
					ok(nopp1, 'テンプレートを使わない場合でも、__constructイベントの中でpostInitPromiseに触れるか');
					ok(norp1, 'テンプレートを使わない場合でも、__constructイベントの中でreadyPromiseに触れるか');
					ok(noip2, 'テンプレートを使わない場合でも、__initイベントの中でinitPromiseに触れるか');
					ok(nopp2, 'テンプレートを使わない場合でも、__initイベントの中でpostInitPromiseに触れるか');
					ok(norp2, 'テンプレートを使わない場合でも、__initイベントの中でreadyPromiseに触れるか');
					ok(noip3, 'テンプレートを使わない場合でも、__postInitイベントの中でinitPromiseに触れるか');
					ok(nopp3, 'テンプレートを使わない場合でも、__postInitイベントの中でpostInitPromiseに触れるか');
					ok(norp3, 'テンプレートを使わない場合でも、__postInitイベントの中でreadyPromiseに触れるか');
					ok(noip4, 'テンプレートを使わない場合でも、__readyイベントの中でinitPromiseに触れるか');
					ok(nopp4, 'テンプレートを使わない場合でも、__readyイベントの中でpostInitPromiseに触れるか');
					ok(norp4, 'テンプレートを使わない場合でも、__readyイベントの中でreadyPromiseに触れるか');

					var root = $('#controllerTest').get(0);
					strictEqual(ir, root, '__initイベントの中でrootElementに触れるか');
					strictEqual(pr, root, '__postInitイベントの中でrootElementに触れるか');
					strictEqual(rr, root, '__readyイベントの中でrootElementに触れるか');
					strictEqual(noir, root, 'テンプレートを使わない場合でも、__initイベントの中でrootElementに触れるか');
					strictEqual(nopr, root, 'テンプレートを使わない場合でも、__postInitイベントの中でrootElementに触れるか');
					strictEqual(norr, root, 'テンプレートを使わない場合でも、__readyイベントの中でrootElementに触れるか');

					testController.unbind();
					noTemplateController.unbind();
					start();
				});
	});

	asyncTest('__construct, __init, __postInit, __readyが動作するタイミングは正しいか2(テンプレート使用)', function() {

		var ret = [];
		var cController = {
			__name: 'CController',
			__templates: ['./template/test2.ejs'],
			__construct: function() {
				ret.push(2);
			},
			__init: function(context) {
				ret.push(5);
			},
			__postInit: function(context) {
				ret.push(6);
			},
			__ready: function(context) {
				ret.push(9);
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
			__postInit: function(context) {
				ret.push(7);
			},
			__ready: function(context) {
				ret.push(10);
			}
		};

		var rController = {
			__name: 'RController',
			__templates: ['./template/test8.ejs'],
			pController: pController,
			__construct: function() {
				ret.push(0);
			},
			__init: function(context) {
				ret.push(3);
			},
			__postInit: function(context) {
				ret.push(8);
			},
			__ready: function(context) {
				ret.push(11);
			}
		};

		var c = h5.core.controller('#controllerTest', rController);

		c.readyPromise.done(function() {
			strictEqual(ret.join(';'), '0;1;2;3;4;5;6;7;8;9;10;11',
					'子、孫コントローラがある場合に、__construct, __init, __postInit, __readyの発火順は正しいか');

			c.dispose();
			start();
		});
	});

	asyncTest(
			'__construct, __init, __postInit, __readyが動作するタイミングは正しいか3(テンプレート使用)',
			function() {
				var ret = [];
				var cController = {
					__name: 'CController',
					__templates: ['./template/test2.ejs'],
					__construct: function() {
						ret.push(2);
					},
					__init: function(context) {
						ret.push(5);
					},
					__postInit: function(context) {
						ret.push(6);
					},
					__ready: function(context) {
						ret.push(9);
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
						}, 0);
						return dfd.promise();
					},
					__postInit: function(context) {
						// 非同期にしてこの間に親の__postInitは実行されないことを確認
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(7);
							dfd.resolve();
						}, 0);
						return dfd.promise();
					},
					__ready: function(context) {
						// 非同期にしてこの間に親の__readyは実行されないことを確認
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(10);
							dfd.resolve();
						}, 0);
						return dfd.promise();
					}
				};

				var rController = {
					__name: 'RController',
					__templates: ['./template/test8.ejs'],
					pController: pController,
					__construct: function() {
						ret.push(0);
					},
					__init: function(context) {
						// 非同期にしてこの間に子の__postInitは実行されないことを確認
						var dfd = this.deferred();
						setTimeout(function() {
							ret.push(3);
							dfd.resolve();
						}, 0);
						return dfd.promise();
					},
					__postInit: function(context) {
						ret.push(8);
					},
					__ready: function(context) {
						ret.push(11);
					}
				};

				var c = h5.core.controller('#controllerTest', rController);

				c.readyPromise
						.done(function() {
							strictEqual(
									ret.join(';'),
									'0;1;2;3;4;5;6;7;8;9;10;11',
									'子、孫コントローラがあり、__init, __postInit, __readyでPromiseオブジェクトを返している場合、__construct, __init, __readyの発火順は正しいか');
							c.dispose();
							start();
						});
			});

	asyncTest(
			'__construct, __init, __postInit, __readyのそれぞれでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数は正しいか(テンプレートなし)',
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

					__postInit: function(context) {
						cRet.push(2);
					},

					__ready: function(context) {
						cRet.push(3);
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

					__postInit: function(context) {
						iRet.push(2);
					},

					__ready: function(context) {
						iRet.push(3);
					}
				};

				var pRet = [];
				var pController = {
					__name: 'PController',

					__construct: function() {
						pRet.push(0);
					},

					__init: function(context) {
						pRet.push(1);
					},

					__postInit: function(context) {
						pRet.push(2);
					},

					__ready: function(context) {
						pRet.push(3);
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

					__postInit: function(context) {
						rRet.push(2);
					},

					__ready: function(context) {
						rRet.push(3);
					}
				};

				var d1 = h5.async.deferred();
				var d2 = h5.async.deferred();
				var d3 = h5.async.deferred();
				var d4 = h5.async.deferred();

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

					__postInit: function(context) {
						this.iController = h5.core.controller('#controllerTest', pController);
						this.iController.readyPromise.done(function() {
							d3.resolve();
						});
					},

					__ready: function(context) {
						this.rController = h5.core.controller('#controllerTest', rController);
						this.rController.readyPromise.done(function() {
							d4.resolve();
						});
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, d1.promise(), d2.promise(), d3.promise(),
						d4.promise()).done(
						function() {
							strictEqual(cRet.join(';'), '0;1;2;3',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(';'), '0;1;2;3',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(pRet.join(';'), '0;1;2;3',
									'__postInitでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(';'), '0;1;2;3',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');

							c.cController.unbind();
							c.iController.unbind();
							c.rController.unbind();
							c.unbind();
							start();
						});
			});

	asyncTest(
			'__construct, __init, __postInit, __readyのそれぞれでh5.core.controller()を使って独立したコントローラをプロパティに持たせた場合、ライフサイクルイベントの発火回数は正しいか(テンプレートあり)',
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

					__postInit: function(context) {
						cRet.push(2);
					},

					__ready: function(context) {
						cRet.push(3);
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

					__postInit: function(context) {
						iRet.push(2);
					},

					__ready: function(context) {
						iRet.push(3);
						this.readyPromise.done(function() {
							idfd.resolve();
						});
					}
				};

				var pdfd = h5.async.deferred();
				var pp = pdfd.promise();
				var pRet = [];
				var pController = {
					__name: 'PController',
					__templates: ['./template/test2.ejs'],

					__construct: function() {
						pRet.push(0);
					},

					__init: function(context) {
						pRet.push(1);
					},

					__postInit: function(context) {
						pRet.push(2);
					},

					__ready: function(context) {
						pRet.push(3);
						this.readyPromise.done(function() {
							pdfd.resolve();
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

					__postInit: function(context) {
						rRet.push(2);
					},

					__ready: function(context) {
						rRet.push(3);
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

					__init: function(context) {
						this.iController = h5.core.controller('#controllerTest', iController);
					},

					__postInit: function(context) {
						this.pController = h5.core.controller('#controllerTest', pController);
					},

					__ready: function(context) {
						this.rController = h5.core.controller('#controllerTest', rController);
					}
				};

				var c = h5.core.controller('#controllerTest', testController);

				h5.async.when(c.readyPromise, cp, ip, rp).done(
						function() {
							strictEqual(cRet.join(';'), '0;1;2;3',
									'__constructでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(iRet.join(';'), '0;1;2;3',
									'__initでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(pRet.join(';'), '0;1;2;3',
									'__postInitでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');
							strictEqual(rRet.join(';'), '0;1;2;3',
									'__readyでコントローラ化した独自コントローラのライフサイクルイベントの発火回数は正しいか');

							c.cController.unbind();
							c.iController.unbind();
							c.pController.unbind();
							c.rController.unbind();
							c.unbind();
							start();
						});
			});

	asyncTest('__construct, __init, __postInit, __readyで子コントローラに親コントローラのインスタンスを持たせた時に無限ループにならないか',
			function() {


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

				var d1 = h5.async.deferred();
				var d2 = h5.async.deferred();
				var d3 = h5.async.deferred();
				var d4 = h5.async.deferred();

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

				h5.async.when(d1.promise(), d2.promise(), d3.promise(), d4.promise()).done(
						function() {
							start();
						});
			});

	asyncTest('初期化パラメータを渡せるか', function() {
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
			"Controller - CommonFailHandler",
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
			"[build#min]Controller - アスペクト",
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
			"Controller - コントローラのプロパティ・メソッド",
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

	//=============================
	// Definition
	//=============================
	/**
	 * window.onerrorを保管しておく変数
	 */
	var onerrorHandler = null;
	module('ライフサイクルイベント内の例外', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest"></div>');

			// 元のwindow.onerror(QUnitのもの)を一時的に保管する
			onerrorHandler = window.onerror;
		},
		teardown: function() {
			clearController();
			// window.onerrorを元に戻す
			window.onerror = onerrorHandler;
		},
		/** window.onerrorが起こるまで待機して、待機時間(5秒)を過ぎたらテストを失敗させる関数 */
		testTimeoutFunc: function(msg) {
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

		throws(function() {
			h5.core.controller('#controllerTest', controller);
		}, '__construct()内で発生した例外がFW内で握りつぶされずcatchできること。');
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__init()で例外をスローする。', 2, function() {
		var errorMsg = '__init error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
			ok(!c.__name, 'コントローラはdisposeされていること');
			start();
		};

		var controller = {
			__name: 'TestController',
			__init: function() {
				throw new Error(errorMsg);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__postInit()で例外をスローする。', 2, function() {
		var errorMsg = '__postInit error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
			ok(!c.__name, 'コントローラはdisposeされていること');
			start();
		};

		var controller = {
			__name: 'TestController',
			__postInit: function() {
				throw new Error(errorMsg);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__ready()で例外をスローする。', 2, function() {
		var errorMsg = '__ready error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
			ok(!c.__name, 'コントローラはdisposeされていること');
			start();
		};

		var unbindFlag, disposeFlag;
		var controller = {
			__name: 'TestController',
			__ready: function() {
				throw new Error(errorMsg);
			}
		};
		var c = h5.core.controller('#controllerTest', controller);
	});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__unbind()で例外をスローする。コントローラのunbindを呼んだ場合。', 3,
			function() {
				var errorMsg = '__unbind error.';
				var id = this.testTimeoutFunc(errorMsg);

				window.onerror = function(ev) {
					clearTimeout(id);
					ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
					$(c.rootElement).click();
					ok(!evHandlerFlag, 'コントローラのイベントハンドラは動作しないこと');
					ok(c.__name, 'コントローラはdisposeされていないこと');
					start();
				};

				var evHandlerFlag;
				var controller = {
					__name: 'TestController',
					__unbind: function() {
						throw new Error(errorMsg);
					},
					'{rootElement} click': function() {
						evHandlerFlag = true;
					}
				};

				var c = h5.core.controller('#controllerTest', controller);
				c.readyPromise.done(function() {
					c.unbind();
				});
			});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__unbind()で例外をスローする。コントローラのdisposeを呼んだ場合。', 3,
			function() {
				var errorMsg = '__unbind error.';
				var id = this.testTimeoutFunc(errorMsg);

				window.onerror = function(ev) {
					clearTimeout(id);
					ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
					$(c.rootElement).click();
					ok(!evHandlerFlag, 'コントローラのイベントハンドラは動作しないこと');
					ok(!c.__name, 'コントローラはdisposeされていること');
					start();
				};

				var evHandlerFlag;
				var controller = {
					__name: 'TestController',
					__unbind: function() {
						throw new Error(errorMsg);
					},
					'{rootElement} click': function() {
						evHandlerFlag = true;
					}
				};

				var c = h5.core.controller('#controllerTest', controller);
				c.readyPromise.done(function() {
					c.dispose();
				});
			});

	asyncTest('[browser#and-and:-3|sa-ios:-4]__dispose()で例外をスローする。', 2, function() {
		var errorMsg = '__dispose error.';
		var id = this.testTimeoutFunc(errorMsg);

		window.onerror = function(ev) {
			clearTimeout(id);
			ok(ev.indexOf(errorMsg) != -1, '__init()内で発生した例外がFW内で握りつぶされずcatchできること。');
			ok(!c.__name, 'コントローラはdisposeされていること');
			start();
		};

		var controller = {
			__name: 'TestController',
			__dispose: function() {
				throw new Error(errorMsg);
			}
		};

		var c = h5.core.controller('#controllerTest', controller);
		c.readyPromise.done(function() {
			c.dispose();
		});
	});

	asyncTest('__init()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。', 11, function() {
		window.onerror = function() {};
		var controller = {
			__name: 'TestController',
			child1Controller: {
				grandchildController: {
					__name: 'grandchildController',
					__init: function() {
						ok(false, '孫コントローラの__initは実行されない');
					},
					__postInit: function() {
						ok(false, '孫コントローラの__postInitは実行されない');
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
				__postInit: function() {
					ok(false, '子コントローラの__postInitは実行されないこと');
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
				ok(true, 'ルートコントローラの__initは実行されること');
			},
			__postInit: function() {
				ok(false, 'ルートコントローラの__initは実行されないこと');
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
			ok(false, 'テスト失敗。ルートコントローラのinitPromiseのfailが実行された');
		});
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
		});
	});

	asyncTest('__postInit()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。', 15, function() {
		window.onerror = function() {};
		var controller = {
			__name: 'TestController',
			child1Controller: {
				grandchildController: {
					__name: 'grandchildController',
					__init: function() {
						ok(true, '孫コントローラの__initは実行されること');
					},
					__postInit: function() {
						ok(true, '孫コントローラの__postInitは実行さること');
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
				},
				__postInit: function() {
					ok(true, '子コントローラの__postInitは実行されること');
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
				ok(true, 'ルートコントローラの__initは実行されること');
			},
			__postInit: function() {
				ok(false, 'ルートコントローラの__postInitは実行されないこと');
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
			ok(false, 'テスト失敗。ルートコントローラのinitPromiseのfailが実行された');
		});
		c.postInitPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのpostInitPromiseのdoneが実行された');
		}).fail(function() {
			ok(true, 'ルートコントローラのpostInitPromiseのfailハンドラが実行されること');
		});
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
		});
	});

	asyncTest('__ready()で例外をスローしたとき、コントローラは連鎖的にdisposeされること。', 18, function() {
		window.onerror = function() {};
		var controller = {
			__name: 'TestController',
			child1Controller: {
				grandchildController: {
					__name: 'grandchildController',
					__init: function() {
						ok(true, '孫コントローラの__initは実行されること');
					},
					__postInit: function() {
						ok(true, '孫コントローラの__postInitは実行されること');
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
				__postInit: function() {
					ok(true, '子コントローラの__postInitは実行されること');
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
			__postInit: function() {
				ok(true, 'ルートコントローラの__postInitが実行されること');
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
		c.postInitPromise.done(function() {
			ok(true, 'ルートコントローラのpostInitPromiseのdoneハンドラが実行されること');
		}).fail(function() {
			ok(false, 'テスト失敗。ルートコントローラのpostInitPromiseのfailハンドラが実行された');
		});
		c.readyPromise.done(function() {
			ok(false, 'テスト失敗。ルートコントローラのreadyPromiseのdoneが実行された');
			start();
		}).fail(function() {
			ok(true, 'ルートコントローラのreadyPromiseのfailハンドラが実行されること');
		});
	});

	//=============================
	// Definition
	//=============================
	module(
			'indicator',
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

	asyncTest('this.indicator() promises', function() {
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

	asyncTest('body、document、windowをターゲットにした場合', function() {
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
				var dfd = h5.async.deferred();

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
			"controllerManager",
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
	test('コントローラの取得（getControllers）、コントローラをバインドしていない場合', function() {
		var controllers = h5.core.controllerManager.getControllers('#controllerTest');
		strictEqual($.isArray(controllers), true, 'コントローラをバインドしていないときも配列が返る');
		strictEqual(controllers.length, 0, '配列の要素数は0');
	});

	asyncTest('コントローラの取得（getControllers）、コントローラを1つバインドした場合、および引数のパターンへの対応', function() {
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

	asyncTest('コントローラの取得（getControllers）、同じ要素にバインドする子コントローラが存在する場合', function() {
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
			"window.open()で開いたウィンドウの要素にコントローラをバインド",
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
				strictEqual(c2.__name, 'C2', '子コントローラでないコントローラはdisposeされていないこと');
				strictEqual(c1.childController, null, 'コントローラを持っていたプロパティにはnullが代入されていること');
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
		h5.async.when(c1.readyPromise, c2.readyPromise).done(
				function() {
					c1.childController = c2.childController
					c1.dispose().done(
							function() {
								strictEqual(c2.childController.__name, 'C2Child',
										'子コントローラでないコントローラはdisposeされていないこと');
								strictEqual(c1.childController, null,
										'コントローラを持っていたプロパティにはnullが代入されていること');
								start();
							}).fail(function() {
						ok(false, 'コントローラのdispose中にエラーが起きました');
						start();
					});
				});
	});

	asyncTest('xxxControllerに自分自身を持っていても正しくdisposeできること', 2, function() {
		var c = h5.core.controller('#controllerTest', {
			__name: 'C1',
			__ready: function() {
				this.childController = this;
			}
		});
		c.readyPromise.done(function() {
			c.dispose().done(function() {
				strictEqual(c.__name, null, 'コントローラがdisposeされていること');
				strictEqual(c.childController, null, 'コントローラを持っていたプロパティにはnullが代入されていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('xxxControllerに親コントローラを持っていても正しくdisposeできること', 3, function() {
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
			c.dispose().done(
					function() {
						strictEqual(c.__name, null, 'コントローラがdisposeされていること');
						strictEqual(childController.__name, null, '子コントローラがdisposeされていること');
						strictEqual(childController.pController, null,
								'コントローラを持っていたプロパティにはnullが代入されていること');
						start();
					}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('xxxControllerに孫コントローラを持っていても正しくdisposeできること', 4, function() {
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
			c.dispose().done(
					function() {
						strictEqual(c.__name, null, 'コントローラがdisposeされていること');
						strictEqual(childController.__name, null, '子コントローラがdisposeされていること');
						strictEqual(gchildController.__name, null, '子コントローラがdisposeされていること');
						strictEqual(gchildController.gpController, null,
								'コントローラを持っていたプロパティにはnullが代入されていること');
						start();
					}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});

	asyncTest('同じ子コントローラを参照するxxxControllerが複数ある場合、正しくdisposeできること', 4, function() {
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
				strictEqual(c.__name, null, 'コントローラがdisposeされていること');
				strictEqual(childController.__name, null, '子コントローラがdisposeされていること');
				strictEqual(c.childController, null, 'コントローラを持っていたプロパティにはnullが代入されていること');
				strictEqual(c.child2Controller, null, 'コントローラを持っていたプロパティにはnullが代入されていること');
				start();
			}).fail(function() {
				ok(false, 'コントローラのdispose中にエラーが起きました');
				start();
			});
		});
	});
});
