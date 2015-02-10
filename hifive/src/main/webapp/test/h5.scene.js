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
	var WAIT_TIME_FOR_OPEN_WINDOW = 3000;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('openWindow', {
		setup: function() {
			stop();
			var that = this;
			h5.scene.openWindow('data/scene.html', 'popup',
					'width=400, height=300, menubar=no, toolbar=no, scrollbars=yes').done(
					function(remoteWindow) {
						that.remoteWindow = remoteWindow;
						setTimeout(function() {
							// FIXME 仮実装に合わせたタイムアウト処理。待機処理が実装されれば要らない
							start();
						}, WAIT_TIME_FOR_OPEN_WINDOW);
					}).fail(function(e) {
				throw e;
			});
		},
		teardown: function() {
			if (this.remoteWindow) {
				stop();
				start(); // FIXME
				this.remoteWindow.close().always(function() {
					start();
				});
			}
		},
		remoteWindow: null
	});

	//=============================
	// Body
	//=============================
	test(
			'リモートウィンドウオブジェクトの取得',
			function() {
				ok(this.remoteWindow, 'リモートウィンドウオブジェクトが取得できること');
				strictEqual(this.remoteWindow.window.opener, window,
						'windowオブジェクトが取得でき、openerがwindowであること');
				strictEqual(this.remoteWindow.window.innerHeight, 300,
						'開いたウィンドウはfeatureで指定した高さであること');
				strictEqual(this.remoteWindow.window.innerWidth, 400, '開いたウィンドウはfeatureで指定した幅であること');
			});

	asyncTest('メインシーンのメソッド呼び出し(同期)', function() {
		this.remoteWindow.invoke('getValue', [1, 2]).done(function(result) {
			strictEqual(result, '3PageController', 'メインシーンのメソッドが実行され戻り値が取得できること');
		}).fail(function() {
			ok(false, 'invokeが失敗した');
		}).always(start);
	});

	asyncTest('メインシーンのメソッド呼び出し(非同期)', function() {
		this.remoteWindow.invoke('getValueAsync', [1, 2]).done(function(result) {
			strictEqual(result, '3PageController', 'メインシーンのメソッドが実行され戻り値が取得できること');
		}).fail(function() {
			ok(false, 'invokeが失敗した');
		}).always(start);
	});

	test('モーダル化', function() {
		this.remoteWindow.setModal(true);
		strictEqual($('.h5-indicator.overlay').length, 1, 'setModal(true)で親ウィンドウにオーバレイが表示されること');
		this.remoteWindow.setModal(false);
		strictEqual($('.h5-indicator.overlay').length, 0, 'setModal(false)で親ウィンドウのオーバレイが消去されること');
	});

//	test('プロキシオブジェクトの取得', function() {
//		var proxy = this.remoteWindow.getControllerProxy();
//	});
//
//	test('セレクタを指定してプロキシオブジェクトの取得', function() {
//		var proxy = this.remoteWindow.getControllerProxy('.target1');
//	});

	//	//=============================
	//	// Definition
	//	//=============================
	//	module('openWindow先から親ウィンドウのRemoteWindowの操作', {
	//		setup: function() {
	//			stop();
	//			var that = this;
	//			// 親ウィンドウのbodyにコントろらをバインド
	//			var controller = h5.core.controller(document.body, {
	//				__name: 'PageController',
	//				__ready: function() {
	//					var dfd = h5.async.deferred();
	//					this.methodExecutedDeferred = dfd;
	//					this.methodExecutedPromise = dfd.promise();
	//				},
	//				method: function(arg) {
	//					this.executedMethodArg = arg;
	//					dfd.resolve();
	//				}
	//			});
	//			this.parentWindowPageController = controller;
	//			controller.readyPromise.done(function(){
	//				h5.scene.openWindow('data/scene-getParentWindow.html?' + new Date().getTime(),
	//						'popup' + new Date().getTime(),
	//						'width=400, height=300, menubar=no, toolbar=no, scrollbars=yes').done(
	//						function(remoteWindow) {
	//							that.remoteWindow = remoteWindow;
	//							setTimeout(function() {
	//								// FIXME 仮実装に合わせたタイムアウト処理。待機処理が実装されれば要らない
	//								start();
	//							}, WAIT_TIME_FOR_OPEN_WINDOW);
	//						}).fail(function(e) {
	//					throw e;
	//				});
	//			});
	//		},
	//		teardown: function() {
	//			if (this.remoteWindow) {
	//				stop();
	//				start(); // FIXME
	//				this.remoteWindow.close().always(function() {
	//					start();
	//				});
	//			}
	//			this.parentWindowPageController.dispose();
	//		},
	//		remoteWindow: null,
	//		parentWindowPageController:null
	//	});
	//
	//	//=============================
	//	// Body
	//	//=============================
	//	asyncTest('openWindow先から親ウィンドウのメソッド呼び出し', function() {
	//		window.checkRemoteWindowCall = function() {
	//			ok('子ウィンドウから親ウィンドウを参照できること');
	//			delete window.checkRemoteWindowCall;
	//		}
	//		var moduleObj = this;
	//		this.parentWindowPageController.methodExecutedDeferred.done(function(){
	//			ok(true, '子ウィンドウから親ウィンドウのメソッドをinvokeで呼べること');
	//			strictEqual(moduleObj.executedMethodArg, 'ok', 'invokeで実行したメソッドに引数が渡されていること');
	//		});
	//	});
});