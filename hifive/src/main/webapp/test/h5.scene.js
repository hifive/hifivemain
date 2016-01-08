/*
 * Copyright (C) 2014-2016 NS Solutions Corporation
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
	var WAIT_TIME_FOR_OPEN_WINDOW = 100;

	var BUILD_TYPE_PARAM = 'h5testenv.buildType=' + H5_TEST_ENV.buildType;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================
	// testutils
	var deleteProperty = testutils.u.deleteProperty;
	var clearController = testutils.u.clearController;
	var gate = testutils.async.gate;
	var openPopupWindow = testutils.dom.openPopupWindow;
	var closePopupWindow = testutils.dom.closePopupWindow;

	/** createTestControllerを使って作成されたコントローラ定義がバインドされた時にそのコントローラインスタンスを覚えておくマップ */
	var boundControllerMap = {
	// 空オブジェクト
	};
	//=============================
	// Functions
	//=============================
	/**
	 * コントローラを作成してグローバルに公開する
	 */
	function createTestController(name) {
		function construct() {
			boundControllerMap[this.__name] = this;
		}

		h5.core.expose({
			__name: 'h5scenetest.' + name,
			__construct: construct
		});
	}

	/**
	 * ポップアップウィンドウのメインシーンコンテナが取得できるまで待機する関数を作成する関数(gateに渡す判定関数)
	 *
	 * @param {Window}
	 * @returns {Function}
	 */
	function createFuncForWaitPouupMainContainer(w) {
		return function() {
			try {
				var readyState = w.document.readyState;
				if (readyState !== 'complete') {
					return;
				}
			} catch (e) {
				// IEの場合、ステータスがlodingの場合に、window以下のオブジェクトを参照しただけでエラーになる場合がある
				// その場合は待機する
				return;
			}
			// メインシーンコンテナが取得できるまで待機
			return w.h5 && w.h5.scene.getMainSceneContainer();
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
	module('[jquery#-1.6.4]HTML要素の記述に基づいたコントローラの自動バインド', {
		teardown: function() {
			deleteProperty(window, 'h5scenetest');
			deleteProperty(window, 'scenedata');
			clearController();
			$('[data-h5-controller]').removeAttr('data-h5-controller');
			$('[data-h5-dyn-controller-bound]').removeAttr('data-h5-dyn-controller-bound');
			boundControllerMap = {};
		},
		$fixture: $('#qunit-fixture')
	});

	//=============================
	// Body
	//=============================
	test('data-h5-controller指定要素について、init()呼び出し時に指定したコントローラがバインドされること', function() {
		createTestController('Body');
		createTestController('Test');
		$(document.body).attr('data-h5-controller', 'h5scenetest.Body');
		var $test = $('<div data-h5-controller="h5scenetest.Test">');
		this.$fixture.append($test);

		h5.scene.init();
		var testCtrl = boundControllerMap['h5scenetest.Test'];
		var bodyCtrl = boundControllerMap['h5scenetest.Body'];
		ok(testCtrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
		strictEqual(testCtrl.rootElement, $test[0], 'コントローラのバインド先はdata-h5-controller指定をした要素であること');
		ok(bodyCtrl, 'body要素でdata-h5-controller指定をしたコントローラがバインドされていること');
		strictEqual(bodyCtrl.rootElement, document.body.children[0],
				'body要素の場合メインシーンになるため、コントローラのバインド先はbody直下の要素になること');

		// initは一度しか呼び出せないので、このケース以外でinit()の呼び出しはしない
		// このケースで二度目のinit()を呼んでも何も起こらないことを確認している
		createTestController('Test2');
		var $test2 = $('<div data-h5-controller="h5scenetest.Test2">');
		this.$fixture.append($test2);
		h5.scene.init();
		ok(!boundControllerMap['h5scenetest.Test2'],
				'init()呼び出し後に追加したdata-h5-controller指定要素があっても、もう一度init()を呼んでもコントローラはバインドされないこと');
	});

	// TODO scan()は1.2.0では非公開APIとなったため、テストをコメントアウトしている #492
	//	test('data-h5-controller指定要素について、scan()呼び出し時に指定したコントローラがバインドされること', function() {
	//		createTestController('Body');
	//		createTestController('Test');
	//		$(document.body).attr('data-h5-controller', 'h5scenetest.Body');
	//		var $test = $('<div data-h5-controller="h5scenetest.Test">');
	//		this.$fixture.append($test);
	//
	//		h5.scene.scan();
	//		var testCtrl = boundControllerMap['h5scenetest.Test'];
	//		var bodyCtrl = boundControllerMap['h5scenetest.Body'];
	//		ok(testCtrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(testCtrl.rootElement, $test[0], 'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//		ok(bodyCtrl, 'body要素でdata-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(bodyCtrl.rootElement, document.body,
	//				'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//	});
	//
	//	test('bodyをルートに指定してscan()', function() {
	//		createTestController('Body');
	//		createTestController('Test');
	//		$(document.body).attr('data-h5-controller', 'h5scenetest.Body');
	//		var $test = $('<div data-h5-controller="h5scenetest.Test">');
	//		this.$fixture.append($test);
	//
	//		h5.scene.scan(document.body);
	//		var testCtrl = boundControllerMap['h5scenetest.Test'];
	//		var bodyCtrl = boundControllerMap['h5scenetest.Body'];
	//		ok(testCtrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(testCtrl.rootElement, $test[0], 'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//		ok(bodyCtrl, 'body要素でdata-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(bodyCtrl.rootElement, document.body,
	//				'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//	});
	//
	//	test('body以下の要素をルートに指定してscan()', function() {
	//		createTestController('Root');
	//		createTestController('Brother');
	//		createTestController('Test');
	//
	//		var $root = $('<div data-h5-controller="h5scenetest.Root">');
	//		var $brother = $('<div data-h5-controller="h5scenetest.Brother">');
	//		var $test = $('<div data-h5-controller="h5scenetest.Test">');
	//		$root.append($test);
	//		this.$fixture.append($root);
	//		this.$fixture.append($brother);
	//
	//		h5.scene.scan($root);
	//		var testCtrl = boundControllerMap['h5scenetest.Test'];
	//		var rootCtrl = boundControllerMap['h5scenetest.Root'];
	//		var brotherCtrl = boundControllerMap['h5scenetest.Brother'];
	//
	//		ok(testCtrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(testCtrl.rootElement, $test[0], 'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//		ok(rootCtrl, 'ルート要素でdata-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(rootCtrl.rootElement, $root[0], 'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//		ok(!brotherCtrl, '指定したルートの兄弟要素にdata-h5-controller記述がしてあってもコントローラはバインドされないこと');
	//	});
	//
	//	test('複数コントローラのバインド',
	//			function() {
	//				createTestController('Test1');
	//				createTestController('Test2');
	//				var $test = $('<div data-h5-controller="h5scenetest.Test1,h5scenetest.Test2">');
	//				this.$fixture.append($test);
	//
	//				h5.scene.scan();
	//				var test1Ctrl = boundControllerMap['h5scenetest.Test1'];
	//				var test2Ctrl = boundControllerMap['h5scenetest.Test2'];
	//
	//				ok(test1Ctrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//				strictEqual(test1Ctrl.rootElement, $test[0],
	//						'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//				ok(test2Ctrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//				strictEqual(test2Ctrl.rootElement, $test[0],
	//						'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//			});
	//
	//	asyncTest('リソースキー指定によるバインド', function() {
	//		var $test = $('<div data-h5-controller="scenedata.controller.SampleController">');
	//		this.$fixture.append($test);
	//
	//		h5.scene.scan();
	//		gate({
	//			func: function() {
	//				return h5.core.controllerManager.getControllers($test)[0];
	//			},
	//			failMsg: 'コントローラがバインドされませんでした'
	//		}).done(
	//				function(a) {
	//					var testCtrl = h5.core.controllerManager.getControllers($test)[0];
	//					ok(testCtrl, 'data-h5-controller指定をしたコントローラがリソースキーから解決されてバインドされていること');
	//					strictEqual(testCtrl.rootElement, $test[0],
	//							'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//				}).always(start);
	//	});
	//
	//	test('シーン要素のdata-h5-controller指定',
	//			function() {
	//				createTestController('Test');
	//				var $container = $('<div data-h5-scene-container>');
	//				var $scene = $('<div data-h5-scene data-h5-controller="h5scenetest.Test">');
	//				$container.append($scene);
	//				this.$fixture.append($container);
	//
	//				h5.scene.scan();
	//				var test1Ctrl = boundControllerMap['h5scenetest.Test'];
	//
	//				ok(test1Ctrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//				strictEqual(test1Ctrl.rootElement, $scene[0],
	//						'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//			});
	//
	//	test(
	//			'シーンを持つシーンコンテナ要素のdata-h5-controller指定',
	//			function() {
	//				createTestController('Test1');
	//				createTestController('Container');
	//				var $container = $('<div data-h5-scene-container data-h5-scene-container="h5scenetest.Container">');
	//				var $scene = $('<div data-h5-scene data-h5-controller="h5scenetest.Test1">');
	//				$container.append($scene);
	//				this.$fixture.append($container);
	//
	//				h5.scene.scan();
	//				var test1Ctrl = boundControllerMap['h5scenetest.Test1'];
	//				var containerCtrl = boundControllerMap['Container'];
	//				ok(test1Ctrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//				strictEqual(test1Ctrl.rootElement, $scene[0],
	//						'コントローラのバインド先はdata-h5-controller指定をした要素であること');
	//				ok(!containerCtrl, 'シーンコンテナ要素のdata-h5-controller指定は無効でコントローラはバインドされないこと');
	//			});
	//
	//	test('シーンを持たないシーンコンテナ要素のdata-h5-controller指定', function() {
	//		createTestController('Test');
	//		var $container = $('<div data-h5-scene-container data-h5-controller="h5scenetest.Test">');
	//		this.$fixture.append($container);
	//
	//		h5.scene.scan();
	//		var testCtrl = boundControllerMap['h5scenetest.Test'];
	//		ok(testCtrl, 'data-h5-controller指定をしたコントローラがバインドされていること');
	//		strictEqual(testCtrl.rootElement, $container.children()[0],
	//				'コントローラのバインド先はシーンコンテナ直下に作られたシーン要素であること');
	//	});
	//
	//	test(
	//			'data-h5-scene指定の要素の位置がシーンコンテナ直下でない場合のdata-h5-controller指定',
	//			function() {
	//				createTestController('Test1');
	//				createTestController('Test2');
	//				var $root = $('<div>');
	//				var $container = $('<div data-h5-scene-container>');
	//				var $scene1 = $('<div data-h5-scene data-h5-controller="h5scenetest.Test1">');
	//				var $scene2 = $('<div data-h5-scene data-h5-controller="h5scenetest.Test2">');
	//				var $div = $('<div>');
	//				$root.append($scene1);
	//				$div.append($scene2);
	//				$container.append($div);
	//				$root.append($container);
	//				this.$fixture.append($root);
	//				h5.scene.scan();
	//
	//				var test1Ctrl = boundControllerMap['h5scenetest.Test1'];
	//				var test2Ctrl = boundControllerMap['h5scenetest.Test2'];
	//
	//				ok(!test1Ctrl,
	//						'data-h5-scene指定要素がコンテナ以下でない要素の場合、data-h5-controller指定は無効でコントローラはバインドされないこと');
	//				ok(!test2Ctrl,
	//						'data-h5-scene指定要素がコンテナの直下でない要素の場合、data-h5-controller指定は無効でコントローラはバインドされないこと');
	//			});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナとシーン', {
		teardown: function() {
			deleteProperty(window, 'h5scenetest');
			deleteProperty(window, 'scenedata');
			clearController();
			$('[data-h5-controller]').removeAttr('data-h5-controller');
			$('[data-h5-dyn-controller-bound]').removeAttr('data-h5-dyn-controller-bound');
			boundControllerMap = {};
		},
		$fixture: $('#qunit-fixture')
	});

	//=============================
	// Body
	//=============================
	//	asyncTest('createContainer()で初期表示シーンにHTMLを指定', function() {
	//		var $container = $('<div>');
	//		this.$fixture.append($container);
	//		h5.scene.createSceneContainer($container, false, 'scenedata/page/to1.html');
	//		gate({
	//			func: function() {
	//				return $container.text() === 'to1';
	//			},
	//			failMsg: 'シーンが初期表示されませんでした'
	//		}).done(function() {
	//			strictEqual($container.text(), 'to1', 'シーンが初期表示されること');
	//			start();
	//		}).fail(start);
	//	});
	//
	//	asyncTest('createContainer()で初期表示シーンにコントローラーを指定', function() {
	//		var $container = $('<div>');
	//		this.$fixture.append($container);
	//		var container = h5.scene.createSceneContainer($container, false, 'scenedata.controller.ControllerSubController');
	//		gate({
	//			func: function() {
	//				return $container.find('h2').text() === 'CONTROLLER_SUB';
	//			},
	//			failMsg: 'シーンが初期表示されませんでした'
	//		}).done(
	//				function() {
	//					strictEqual(container._currentController.$find('h2').text(), 'CONTROLLER_SUB',
	//							'シーンが初期表示されること');
	//				}).always(start);
	//	});


	asyncTest('createContainer()で生成したシーンコンテナのメソッドによる遷移', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/to1.html');
		gate({
			func: function() {
				return $container.text() === 'to1';
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($container.text(), 'to1', 'シーンが変更されること');
			ok(!$scene.parent()[0], '遷移前のシーン要素は削除されていること');
			var $scene1 = $container.children();
			container.navigate({
				to: 'scenedata/page/to2.html',
				args: {
					test: 'TEST'
				}
			});
			gate({
				func: function() {
					return $container.text() === 'to2';
				},
				failMsg: 'シーンが変更されませんでした'
			}).done(function() {
				strictEqual($container.text(), 'to2', 'シーンが変更されること');
				ok(!$scene1.parent()[0], '遷移前のシーン要素は削除されていること');
				ok(container._currentController.args.test === 'TEST', '遷移パラメータが渡されていること');
			}).always(start);
		}).fail(start);
	});

	asyncTest('createContainer()で生成したシーンコンテナのイベントによる遷移', function() {
		var $container = $('<div>');
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		this.$fixture.append($container);
		var container = h5.scene.createSceneContainer($container);
		$(container.rootElement).trigger('sceneChangeRequest', 'scenedata/page/to1.html');
		gate({
			func: function() {
				return $container.text() === 'to1' && container._currentController;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($container.text(), 'to1', 'シーンが変更されること');
			ok(!$scene.parent()[0], '遷移前のシーン要素は削除されていること');
			var scene1 = container._currentController;
			var $scene1 = $(scene1.rootElement);
			scene1.scene.navigate({
				to: 'scenedata/page/to2.html',
				args: {
					test: 'TEST'
				}
			});
			gate({
				func: function() {
					return $container.text() === 'to2';
				},
				failMsg: 'シーンが変更されませんでした'
			}).done(function() {
				strictEqual($container.text(), 'to2', 'シーンが変更されること');
				ok(!$scene1.parent()[0], '遷移前のシーン要素は削除されていること');
				ok(container._currentController.args.test === 'TEST', '遷移パラメータが渡されていること');
			}).always(start);
		}).fail(start);
	});

	// TODO scan()は1.2.0では非公開APIとなったため、テストをコメントアウトしている #492
	//	asyncTest('scan()で生成したシーンコンテナのイベントによる遷移', function() {
	//		var $container = $('<div data-h5-scene-container>');
	//		var $scene = $('<div data-h5-scene>');
	//		$container.append($scene);
	//		this.$fixture.append($container);
	//		h5.scene.scan();
	//		$scene.trigger('sceneChangeRequest', {
	//			to: 'scenedata/page/to1.html'
	//		});
	//		gate({
	//			func: function() {
	//				return $container.text() === 'to1';
	//			},
	//			failMsg: 'シーンが変更されませんでした'
	//		}).done(function() {
	//			strictEqual($container.text(), 'to1', 'シーンが変更されること');
	//			ok(!$scene.parent()[0], '遷移前のシーン要素は削除されていること');
	//			var $scene1 = $container.children();
	//			$scene1.trigger('sceneChangeRequest', {
	//				to: 'scenedata/page/to2.html',
	//				args: {
	//					test: 'TEST'
	//				}
	//			});
	//			gate({
	//				func: function() {
	//					return $container.text() === 'to2';
	//				},
	//				failMsg: 'シーンが変更されませんでした'
	//			}).done(function() {
	//				strictEqual($container.text(), 'to2', 'シーンが変更されること');
	//				ok(!$scene1.parent()[0], '遷移前のシーン要素は削除されていること');
	//				//scanの場合、containerが取れないので遷移パラメーター確認はスキップ
	//			}).always(start);
	//		}).fail(start);
	//	});

	asyncTest('コントローラーベースの遷移', function() {
		var $container = $('<div>');
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		this.$fixture.append($container);
		var container = h5.scene.createSceneContainer($container);
		container.navigate({
			to: 'scenedata.controller.ControllerSubController',
			args: {
				test: 'CTRL'
			}
		});
		gate({
			func: function() {
				return container._currentController.$find('h2').text() === 'CONTROLLER_SUB';
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(
				function() {
					strictEqual(container._currentController.$find('h2').text(), 'CONTROLLER_SUB',
							'シーンが変更されること');
					ok(!$scene.parent()[0], '遷移前のシーン要素は削除されていること');
					ok(container._currentController.args.test === 'CTRL', '遷移パラメータが渡されていること');
				}).always(start);
	});
	asyncTest('遷移先のHTMLのbodyにシーンコンテナ要素が無い場合はbodyの中身が一つのシーンになる', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/noContainerBody.html');
		var expect = 'no container';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	asyncTest('遷移先のHTMLのbodyがテキストノードのみ', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/textNodeBody.html');
		var expect = 'text body';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	asyncTest('遷移先のHTMLのbodyがテキストノードで始まるHTML文字列', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/textNodeAndElementBody.html');
		var expect = 'text and element body';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	asyncTest('遷移先の部分HTMLにシーンコンテナ要素が無い場合はhtmlファイルの中身が一つのシーンになる', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/noContainerPart.html');
		var expect = 'no container';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	asyncTest('遷移先の部分HTMLの中身がテキストノードのみ', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/textNodePart.html');
		var expect = 'plain text';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	asyncTest('遷移先の部分HTMLの中身がテキストノードで始まるHTML文字列', function() {
		var $container = $('<div>');
		this.$fixture.append($container);
		var $scene = $('<div data-h5-scene>');
		$container.append($scene);
		var container = h5.scene.createSceneContainer($container);
		container.navigate('scenedata/page/textNodeAndElementPart.html');
		var expect = 'plain text and element';
		gate({
			func: function() {
				return $.trim($container.text()) === expect;
			},
			failMsg: 'シーンが変更されませんでした'
		}).done(function() {
			strictEqual($.trim($container.text()), expect, 'シーンが変更されること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナの取得', {
		setup: function() {
			stop();
			var $container = $('<div data-h5-scene-container="testContainer">');
			var $mainContainer = $('<div data-h5-scene-container="testMainContainer">');
			this.$fixture.append($container);
			this.$fixture.append($mainContainer);
			var container = h5.scene.createSceneContainer($container);
			var mainContainer = h5.scene.createSceneContainer($mainContainer);
			var containerBound, mainContainerBound;
			var arg = {};
			this.$container = $container;
			this.$mainContainer = $mainContainer;
			this.container = container;
			this.mainContainer = mainContainer;
			var that = this;
			$container.bind('h5controllerbound', function(e, controller) {
				containerBound = true;
				that.sceneController = controller;
				if (mainContainerBound) {
					start();
				}
			});
			$mainContainer.bind('h5controllerbound', function(e, controller) {
				mainContainerBound = true;
				that.mainSceneController = controller;
				if (containerBound) {
					start();
				}
			});
		},
		teardown: function() {
			clearController();
		},
		$fixture: $('#qunit-fixture')
	});

	//=============================
	// Body
	//=============================

	test('シーンコンテナの取得', function() {
		var sceneController = this.sceneController;
		var mainSceneController = this.mainSceneController;
		var $container = this.$container;
		var $mainContainer = this.$mainContainer;
		var container = this.container;
		var mainContainer = this.mainContainer;
		strictEqual(sceneController.scene.getParentContainer(), container,
				'ControllerのgetParentContainerで所属するシーンコンテナが取得できること');
		strictEqual(mainSceneController.scene.getParentContainer(), mainContainer,
				'ControllerのgetParentContainerで所属するシーンコンテナが取得できること');

		var ret = h5.scene.getSceneContainerByName('testContainer');
		strictEqual(ret, container, 'h5.scene.getSceneContainerByNameで名前を指定してシーンコンテナが取得できること');
		ret = h5.scene.getSceneContainerByName('testMainContainer');
		strictEqual(ret, mainContainer, 'h5.scene.getSceneContainerByNameで名前を指定してシーンコンテナが取得できること');

		ret = h5.scene.getSceneContainers();
		if (ret[0] !== container) {
			var tmp = ret[0];
			ret[0] = ret[1];
			ret[1] = tmp;
		}
		strictEqual(ret[0], container, 'h5.scene.getSceneContainersで引数なしでシーンコンテナが取得できること');
		strictEqual(ret[1], mainContainer, 'h5.scene.getSceneContainersで引数なしでシーンコンテナが取得できること');
		strictEqual(ret.length, 2, '取得できるシーンコンテナの数が正しいこと');

		ret = h5.scene.getSceneContainers($container);
		strictEqual(ret[0], container, 'h5.scene.getSceneContainersに要素を指定した時、シーンコンテナが取得できること');
		strictEqual(ret.length, 1, '取得できるシーンコンテナの数が正しいこと');

		ret = h5.scene.getSceneContainers('#qunit-fixture');
		if (ret[0] !== container) {
			var tmp = ret[0];
			ret[0] = ret[1];
			ret[1] = tmp;
		}
		strictEqual(ret[0], container,
				'h5.scene.getSceneContainersに要素を指定した時、指定した要素以下のシーンコンテナが取得できること');
		strictEqual(ret[1], mainContainer,
				'h5.scene.getSceneContainersに要素を指定した時、指定した要素以下のシーンコンテナが取得できること');
		strictEqual(ret.length, 2, '取得できるシーンコンテナの数が正しいこと');

		ret = h5.scene.getSceneContainers('#qunit-fixture', {
			deep: false
		});
		strictEqual(ret.length, 0,
				'h5.scene.getSceneContainersで、deep:falseを指定した時、指定した要素以下のシーンコンテナは取得できないこと');
		ret = h5.scene.getSceneContainers($container, {
			deep: false
		});
		strictEqual(ret[0], container,
				'h5.scene.getSceneContainersで、deep:falseを指定した時、指定した要素のシーンコンテナのみ取得できること');
		strictEqual(ret.length, 1, '取得できるシーンコンテナの数が正しいこと');
	});



	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4;browser#ie:-9|op|and-and:all|sa-ios:all|ie-wp:all]メインシーンコンテナ', {
		setup: function() {
			stop();
			var that = this;
			openPopupWindow().done(function(w) {
				that.w = w;
				//window.focus(); //Chromeだと効かない
				start();
			}).fail(function(e) {
				throw e;
			});
		},
		teardown: function() {
			deleteProperty(window, 'h5scenetest');
			stop();
			closePopupWindow(this.w).done(function() {
				start();
			});
		},
		$fixture: $('#qunit-fixture')
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'ブラウザ履歴連動遷移',
			function() {
				this.w.location.href = 'scenedata/page/from.html?' + BUILD_TYPE_PARAM;
				var that = this;
				gate({
					func: createFuncForWaitPouupMainContainer(this.w),
					failMsg: 'メインシーンコンテナが取得できませんでした'
				})
						.done(
								function() {
									var mainContainer = that.w.h5.scene.getMainSceneContainer();
									gate({
										func: function() {
											return !!mainContainer._currentController;
										}
									})
											.done(
													function() {
														var controller = mainContainer._currentController;
														var title = controller.$find('h1').text();
														strictEqual(title, 'FROM',
																'直接アクセスで画面が表示されていること');
														//strictEqual(controller.__name, 'scenedata.controller.FromController', 'コントローラーバインド確認');
														mainContainer.navigate({
															to: 'to.html?' + BUILD_TYPE_PARAM,
															args: {
																test: 'hoge'
															}
														});
														gate(
																{
																	func: function() {
																		return mainContainer._currentController
																				&& mainContainer._currentController.__name === 'scenedata.controller.ToController';
																	},
																	failMsg: 'シーンが変更されませんでした'
																})
																.done(
																		function() {
																			var controller = mainContainer._currentController;
																			var title = controller
																					.$find('h1')
																					.text();
																			strictEqual(title,
																					'TO',
																					'画面が遷移されていること');
																			var param = controller.args.test;
																			strictEqual(param,
																					'hoge',
																					'画面間パラメータが渡されていること');
																			ok(
																					/\/to\.html(?:\?|#|$)/
																							.test(that.w.location.href),
																					'URLが連動していること');

																			controller = null;

																			that.w.history.back();
																			gate(
																					{
																						func: function() {
																							return mainContainer._currentController
																									&& mainContainer._currentController.__name === 'scenedata.controller.FromController';
																						},
																						failMsg: 'シーンが変更されませんでした'
																					})
																					.done(
																							function() {
																								var controller = mainContainer._currentController;
																								var title = controller
																										.$find(
																												'h1')
																										.text();
																								strictEqual(
																										title,
																										'FROM',
																										'histroy.back()で画面が遷移されていること');
																								ok(
																										/\/from\.html(?:\?|#|$)/
																												.test(that.w.location.href),
																										'URLが連動していること');
																								//履歴遷移でのパラメーター取得は未対応

																								controller = null;

																								that.w.history
																										.forward();
																								gate(
																										{
																											func: function() {
																												return mainContainer._currentController
																														&& mainContainer._currentController.__name === 'scenedata.controller.ToController';
																											},
																											failMsg: 'シーンが変更されませんでした'
																										})
																										.done(
																												function() {
																													var controller = mainContainer._currentController;
																													var title = controller
																															.$find(
																																	'h1')
																															.text();
																													strictEqual(
																															title,
																															'TO',
																															'histroy.forward()で画面が遷移されていること');
																													ok(
																															/\/to\.html(?:\?|#|$)/
																																	.test(that.w.location.href),
																															'URLが連動していること');
																													//履歴遷移でのパラメーター取得は未対応

																													mainContainer = controller = null;

																													that.w.location
																															.reload(true);
																													gate(
																															{
																																func: createFuncForWaitPouupMainContainer(that.w),
																																failMsg: 'メインシーンコンテナが取得できませんでした'
																															})
																															.done(
																																	function() {
																																		mainContainer = that.w.h5.scene
																																				.getMainSceneContainer(); //リロードしたので再度取得
																																		gate(
																																				{
																																					func: function() {
																																						return !!mainContainer._currentController;
																																					},
																																					failMsg: 'currentControllerが取得できませんでした'
																																				})
																																				.done(
																																						function() {
																																							var controller = mainContainer._currentController;
																																							var title = controller
																																									.$find(
																																											'h1')
																																									.text();
																																							strictEqual(
																																									title,
																																									'TO',
																																									'location.reload()で画面が再表示されていること');
																																							ok(
																																									/\/to\.html(?:\?|#|$)/
																																											.test(that.w.location.href),
																																									'URLが連動していること');
																																							//履歴遷移でのパラメーター取得は未対応

																																						})
																																				.always(
																																						start);
																																	})
																															.fail(
																																	start);
																												})
																										.fail(
																												start);
																							})
																					.fail(start);
																		}).fail(start);
													}).fail(start);
								}).fail(start);
			});

	//	asyncTest(
	//			'メインシーンコンテナの初期表示シーンの確認',
	//			function() {
	//				this.w.location.href = 'scenedata/page/init_scene.html?' + BUILD_TYPE_PARAM;
	//				var that = this;
	//				gate({
	//					func: function() {
	//						return that.w.h5 && that.w.h5.scene && that.w.h5.scene.getMainSceneContainer();
	//					},
	//					failMsg: 'メインシーンコンテナが取得できませんでした'
	//				})
	//						.done(
	//								function() {
	//									var mainContainer = that.w.h5.scene.getMainSceneContainer();
	//									var controller = mainContainer._currentController;
	//									var title = controller.$find('h1').text();
	//									strictEqual(title, 'FROM', '初期表示シーンの画面が表示されていること');
	//									ok(/\/init_scene\.html(?:\?|#|$)/.test(that.w.location.href),
	//											'初期表示シーンはURL連動していないこと');
	//									mainContainer.navigate('to.html?' + BUILD_TYPE_PARAM);
	//									gate(
	//											{
	//												func: function() {
	//													return mainContainer._currentController
	//															&& mainContainer._currentController.__name === 'scenedata.controller.ToController';
	//												},
	//												failMsg: 'シーンが変更されませんでした'
	//											})
	//											.done(
	//													function() {
	//														var controller = mainContainer._currentController;
	//														var title = controller.$find('h1').text();
	//														strictEqual(title, 'TO', '画面が遷移されていること');
	//														ok(/\/to\.html(?:\?|#|$)/
	//																.test(that.w.location.href),
	//																'URLが連動していること');
	//													}).always(start);
	//								}).fail(start);
	//			});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4;browser#and-and:all|sa-ios:all|ie-wp:all]フラグの確認', {
		setup: function() {
			stop();
			var that = this;
			openPopupWindow().done(function(w) {
				that.w = w;
				//window.focus(); //Chromeだと効かない
				start();
			}).fail(function(e) {
				throw e;
			});
		},
		teardown: function() {
			deleteProperty(window, 'h5scenetest');
			stop();
			closePopupWindow(this.w).done(function() {
				start();
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'h5.settings.scene.autoInitフラグの確認',
			function() {
				this.w.location.href = 'scenedata/page/from.html?' + BUILD_TYPE_PARAM;
				var that = this;
				gate({
					func: createFuncForWaitPouupMainContainer(this.w),
					failMsg: 'メインシーンコンテナが取得できませんでした'
				})
						.done(
								function() {
									strictEqual(that.w.h5.settings.scene.autoInit, true, 'フラグの確認');
									var mainContainer = that.w.h5.scene.getMainSceneContainer();
									ok(!!mainContainer, 'メインシーンコンテナが生成されていること');
									ok(that.w.$('[data-h5-scene-container="sub_from"]').is(
											'[data-h5-dyn-container-bound]'),
											'通常のシーンコンテナが生成されていること');
									var elm = that.w
											.$('[data-h5-controller="scenedata.controller.SubController"]');
									gate(
											{
												func: function() {
													return !!that.w.h5.core.controllerManager
															.getControllers(elm)[0];
												},
												failMsg: 'ポップアップウィンドウのDOM要素に記述されているコントローラがバインドされませんでした'
											}).done(
											function() {
												var controller = that.w.h5.core.controllerManager
														.getControllers(elm)[0];
												strictEqual(controller && controller.__name,
														'scenedata.controller.SubController',
														'コントローラーがバインドされていること');
											}).always(start);
								}).fail(start);
			});

	//	//=============================
	//	// Definition
	//	//=============================
	//	module('openWindow', {
	//		setup: function() {
	//			stop();
	//			var that = this;
	//			h5.scene.openWindow('data/scene.html', 'popup',
	//					'width=400, height=300, menubar=no, toolbar=no, scrollbars=yes').done(
	//					function(remoteWindow) {
	//						that.remoteWindow = remoteWindow;
	//						setTimeout(function() {
	//							// FIXME 仮実装に合わせたタイムアウト処理。待機処理が実装されれば要らない
	//							start();
	//						}, WAIT_TIME_FOR_OPEN_WINDOW);
	//					}).fail(function(e) {
	//				throw e;
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
	//		},
	//		remoteWindow: null
	//	});
	//
	//	//=============================
	//	// Body
	//	//=============================
	//	test(
	//			'リモートウィンドウオブジェクトの取得',
	//			function() {
	//				ok(this.remoteWindow, 'リモートウィンドウオブジェクトが取得できること');
	//				strictEqual(this.remoteWindow.window.opener, window,
	//						'windowオブジェクトが取得でき、openerがwindowであること');
	//				strictEqual(this.remoteWindow.window.innerHeight, 300,
	//						'開いたウィンドウはfeatureで指定した高さであること');
	//				strictEqual(this.remoteWindow.window.innerWidth, 400, '開いたウィンドウはfeatureで指定した幅であること');
	//			});
	//
	//	asyncTest('メインシーンのメソッド呼び出し(同期)', function() {
	//		this.remoteWindow.invoke('getValue', [1, 2]).done(function(result) {
	//			strictEqual(result, '3PageController', 'メインシーンのメソッドが実行され戻り値が取得できること');
	//		}).fail(function() {
	//			ok(false, 'invokeが失敗した');
	//		}).always(start);
	//	});
	//
	//	asyncTest('メインシーンのメソッド呼び出し(非同期)', function() {
	//		this.remoteWindow.invoke('getValueAsync', [1, 2]).done(function(result) {
	//			strictEqual(result, '3PageController', 'メインシーンのメソッドが実行され戻り値が取得できること');
	//		}).fail(function() {
	//			ok(false, 'invokeが失敗した');
	//		}).always(start);
	//	});
	//
	//	test('モーダル化', function() {
	//		this.remoteWindow.setModal(true);
	//		strictEqual($('.h5-indicator.overlay').length, 1, 'setModal(true)で親ウィンドウにオーバレイが表示されること');
	//		this.remoteWindow.setModal(false);
	//		strictEqual($('.h5-indicator.overlay').length, 0, 'setModal(false)で親ウィンドウのオーバレイが消去されること');
	//	});

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

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]メインシーンコンテナをdispose', {
		setup: function() {
			this.originalTitle = document.title;
			var $container = $('<div>');
			var $scene = $('<div data-h5-scene>');
			$container.append($scene);
			$('#qunit-fixture').append($container);
			this.container = h5.scene.createSceneContainer($container, true);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('メインシーンコンテナをdispose後に再生成できること', function() {
		var container = this.container;
		container.dispose().done(function() {
			var $container = $('<div>');
			var $scene = $('<div data-h5-scene>');
			$container.append($scene);
			$('#qunit-fixture').append($container);
			try {
				h5.scene.createSceneContainer($container, true);
				ok(true, 'メインシーンコンテナを再生成できること');
			} catch (e) {
				ok(false, 'メインシーンコンテナの再生成に失敗');
			}
		}).always(start);
	});

	asyncTest('dispose後にh5.scene.getMainSceneContainer()はnullを返すこと', function() {
		var mainContainer = h5.scene.getMainSceneContainer();
		ok(mainContainer != null , 'dispose前はh5.scene.getMainSceneContainer()で取得できること');
		this.container.dispose().done(function() {
			mainContainer = h5.scene.getMainSceneContainer();
			ok(mainContainer == null, 'dispose後はh5.scene.getMainSceneContainer()がnullを返すこと');
		}).always(start);
	});

	asyncTest('dispose後にh5.scene.getSceneContainerByName()はnullを返すこと', function() {
		var mainContainer = h5.scene.getSceneContainerByName('data-h5-main-scene-container');
		ok(mainContainer != null, 'dispose前はh5.scene.getSceneContainerByName()で取得できること');
		this.container.dispose().done(function() {
			mainContainer = h5.scene.getSceneContainerByName('data-h5-main-scene-container');
			ok(mainContainer == null, 'dispose後はh5.scene.getSceneContainerByName()がnullを返すこと');
		}).always(start);
	});

	asyncTest('dispose後にh5.scene.getSceneContainers()は空配列を返すこと', function() {
		var mainContainer = h5.scene.getSceneContainers('[data-h5-main-scene-container]');
		ok(mainContainer.length === 1, 'dispose前はh5.scene.getSceneContainers()で取得できること');
		this.container.dispose().done(function() {
			mainContainer = h5.scene.getSceneContainers('[data-h5-main-scene-container]');
			ok(mainContainer.length === 0, 'dispose後はh5.scene.getSceneContainers()が空配列を返すこと');
		}).always(start);
	});

	asyncTest('dispose後に再生成しh5.scene.getMainSceneContainer()で取得できること', function() {
		this.container.dispose().done(function() {
			var $container = $('<div>');
			var $scene = $('<div data-h5-scene>');
			$container.append($scene);
			$('#qunit-fixture').append($container);
			h5.scene.createSceneContainer($container, true);
			var container = h5.scene.getMainSceneContainer();
			ok(container != null, 'メインシーンコンテナを取得できること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]メインシーンコンテナを複数生成', {
		setup: function() {
			this.originalTitle = document.title;
			var $container = $('<div>');
			var $scene = $('<div data-h5-scene>');
			$container.append($scene);
			$('#qunit-fixture').append($container);
			this.container = h5.scene.createSceneContainer($container, true);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('メインシーンコンテナを複数生成できないこと', function() {
		var $newCcontainer = $('<div>');
		var $scene = $('<div data-h5-scene>');
		$newCcontainer.append($scene);
		$('#qunit-fixture').append($newCcontainer);
		try {
			h5.scene.createSceneContainer($newCcontainer, true);
		} catch (e) {
			ok(true, 'メインシーンコンテナを複数生成すると例外を投げること');
		}
	});

	//=============================
	// Definition
	//=============================
	module(
			'[jquery#-1.6.4;browser#ie:-9|op|and-and:all|sa-ios:all|ie-wp:all]メインシーンコンテナのnavigate()のtoプロパティでページURLを指定。シーン要素がdata-h5-scene-title属性を持つこと',
			{
				setup: function() {
					this.pathname = location.pathname;
					this.url = 'scenedata/page/title/dataTitle.html';
					this.originalTitle = document.title;
					this.$container = $('<div>');
					var $scene = $('<div data-h5-scene>');
					this.$container.append($scene);
					$('#qunit-fixture').append(this.$container);
					this.container = h5.scene.createSceneContainer(this.$container, true);
				},
				teardown: function() {
					clearController();
					document.title = this.originalTitle;
					history.pushState(null, null, this.pathname);
				}
			});

	//=============================
	// Body
	//=============================
	asyncTest('タイトルに設定すること', function() {
		var container = this.container;
		container.navigate({
			to: this.url
		}).done(function() {
			var title = container.getTitle();
			strictEqual(title, 'changeTitle', 'シーン要素のdata-h5-scene-titleをgetTitle()で取得できること');
		}).always(start);
	});

	asyncTest('document.titleへ反映すること', function() {
		var container = this.container;
		container.navigate({
			to: this.url
		}).done(function() {
			strictEqual(document.title, 'changeTitle', 'シーン要素のdata-h5-scene-titleをdocument.titleに反映すること');
		}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナのnavigate()のtoプロパティでページURLを指定。シーン要素がdata-h5-scene-title属性を持つ', {
		setup: function() {
			this.url = 'scenedata/page/title/dataTitle.html';
			this.originalTitle = document.title;
			this.$container = $('<div>');
			var $scene = $('<div data-h5-scene>');
			this.$container.append($scene);
			$('#qunit-fixture').append(this.$container);
			this.container = h5.scene.createSceneContainer(this.$container, false);
		},
		teardown: function() {
			clearController();
			document.title = this.originalTitle;
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('タイトルに設定すること', function() {
		var container = this.container;
		container.navigate({
			to: this.url
		}).done(function() {
			var title = container.getTitle();
			strictEqual(title, 'changeTitle', 'シーン要素のdata-h5-scene-titleをgetTitle()で取得できること');
		}).always(start);
	});

	asyncTest('document.titleへ反映しない', function() {
		var container = this.container;
		var that = this;
		container.navigate({
			to: this.url
		}).done(
				function() {
					strictEqual(document.title, that.originalTitle,
							'シーン要素のdata-h5-scene-titleをdocument.titleに反映しないこと');
				}).always(start);
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]createSceneContainer() シーン要素がdata-h5-scene-title属性を持っている', {
		setup: function() {
			this.originalTitle = document.title;
			this.$container = $('<div>');
			var $scene = $('<div data-h5-scene data-h5-scene-title="testDataTitle">');
			this.$container.append($scene);
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			clearController();
			document.title = this.originalTitle;
		}
	});

	//=============================
	// Body
	//=============================
	test('メインシーンコンテナ', function() {
		var container = h5.scene.createSceneContainer(this.$container, true);
		var title = container.getTitle();
		strictEqual(title, 'testDataTitle', 'タイトルに設定すること');
		strictEqual(document.title, 'testDataTitle', 'document.titleに反映すること');
	});

	test('シーンコンテナ', function() {
		var container = h5.scene.createSceneContainer(this.$container, false);
		var title = container.getTitle();
		strictEqual(title, 'testDataTitle', 'タイトルに設定すること');
		strictEqual(document.title, this.originalTitle, 'document.titleに反映しないこと');
	});

});
