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
	var BUILD_TYPE_PARAM = 'h5testenv.buildType=' + H5_TEST_ENV.buildType;

	// テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.scene;

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
		this.container.dispose().done(
				function() {
					var mainContainer = h5.scene.getMainSceneContainer();
					strictEqual(mainContainer, null,
							'dispose後はh5.scene.getMainSceneContainer()がnullを返すこと');
				}).always(start);
	});

	asyncTest('dispose後にh5.scene.getSceneContainerByName()はnullを返すこと', function() {
		this.container.dispose().done(
				function() {
					var mainContainer = h5.scene
							.getSceneContainerByName('data-h5-main-scene-container');
					strictEqual(mainContainer, null,
							'dispose後はh5.scene.getSceneContainerByName()がnullを返すこと');
				}).always(start);
	});

	asyncTest('dispose後にh5.scene.getSceneContainers()は空配列を返すこと', function() {
		this.container.dispose().done(
				function() {
					var mainContainer = h5.scene
							.getSceneContainers('[data-h5-main-scene-container]');
					strictEqual(mainContainer.length, 0,
							'dispose後はh5.scene.getSceneContainers()が空配列を返すこと');
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
			ok(false, '例外がスローされなかったためテスト失敗');
		} catch (e) {
			strictEqual(e.code, ERR.ERR_CODE_MAIN_CONTAINER_ALREADY_CREATED, e.message);
		}
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]createSceneContainer', {
		setup: function() {
			this.originalTitle = document.title;
			this.$container = $('<div class="testContainer">');
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
	test('メインシーンコンテナを生成できること', function() {
		var container = h5.scene.createSceneContainer(this.$container, true);
		var mainContainer = h5.scene.getMainSceneContainer();
		strictEqual(mainContainer, container, 'メインシーンコンテナを生成できること');
	});

	test('メインでないシーンコンテナを生成できること', function() {
		var container = h5.scene.createSceneContainer(this.$container, false);
		strictEqual(h5.scene.getSceneContainers()[0], container, 'メインシーンコンテナを生成できること');
	});

	test('第1引数にDOMを指定した場合はシーンコンテナを生成できること', function() {
		var container = h5.scene.createSceneContainer(this.$container.get(0));
		strictEqual(h5.scene.getSceneContainers()[0], container, 'シーンコンテナを生成できること');
	});

	test('第1引数にjQueryオブジェクトを指定した場合はシーンコンテナを生成できること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		strictEqual(h5.scene.getSceneContainers()[0], container, 'シーンコンテナを生成できること');
	});

	test('第1引数にセレクタ文字列を指定した場合はシーンコンテナを生成できること', function() {
		var container = h5.scene.createSceneContainer('.testContainer');
		strictEqual(h5.scene.getSceneContainers()[0], container, 'シーンコンテナを生成できること');
	});

	test('第1引数に対象要素が複数あるDOMを指定すると例外を投げること', function() {
		this.$container.after('<div class="testContainer"></div');
		try {
			h5.scene.createSceneContainer(document.getElementsByClassName('.testContainer'));
			ok(false, '例外を投げない');
		} catch (e) {
			ok(true, '第1引数に対象要素が複数あるDOMを指定すると例外を投げること');
		}
	});

	test('第1引数に対象要素が複数あるjQueryを指定すると例外を投げること', function() {
		this.$container.after('<div class="testContainer"></div');
		try {
			h5.scene.createSceneContainer($('.testContainer'));
			ok(false, '例外を投げない');
		} catch (e) {
			ok(true, '第1引数に対象要素が複数あるjQueryを指定すると例外を投げること');
		}
	});

	test('第1引数に対象要素が複数あるセレクタ文字列を指定すると例外を投げること', function() {
		this.$container.after('<div class="testContainer"></div');
		try {
			h5.scene.createSceneContainer('.testContainer');
			ok(false, '例外を投げない');
		} catch (e) {
			ok(true, '第1引数に対象要素が複数あるセレクタ文字列を指定すると例外を投げること');
		}
	});

	test('第1引数に対象要素が1つもない要素を指定すると例外を投げること', function() {
		try {
			h5.scene.createSceneContainer('.dummy');
			ok(false, '例外を投げない');
		} catch (e) {
			ok(true, '第1引数に対象要素が1つもない要素を指定すると例外を投げること');
		}
	});

	test('DOM|jQuery|Selector以外を指定した場合例外を投げること', function() {
		try {
			h5.scene.createSceneContainer(100);
			ok(false, '例外を投げない');
		} catch (e) {
			ok(true, 'DOM|jQuery|Selector以外を指定した場合例外を投げること');
		}
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]メインシーンコンテナの取得', {
		setup: function() {
			this.originalTitle = document.title;
			var $container = $('<div class="testContainer">');
			$('#qunit-fixture').append($container);
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			clearController();
			document.title = this.originalTitle;
		}
	});

	//=============================
	// Body
	//=============================
	test('scene.getMainSceneContainer()', function() {
		strictEqual(h5.scene.getMainSceneContainer(), this.container, 'メインシーンコンテナを取得できること');
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナの取得 scene.getSceneContainerByName()', {
		setup: function() {
			this.originalTitle = document.title;
		},
		teardown: function() {
			clearController();
			document.title = this.originalTitle;
		}
	});

	//=============================
	// Body
	//=============================
	test('指定したシーンコンテナ名のメインでないシーンコンテナを取得できること', function() {
		var $container = $('<div data-h5-scene-container="testContainer">');
		$('#qunit-fixture').append($container);
		var container = h5.scene.createSceneContainer($container);
		strictEqual(h5.scene.getSceneContainerByName('testContainer'), container,
				'メインでないシーンコンテナを取得できること');
	});

	test('指定したシーンコンテナ名のメインシーンコンテナを取得できること', function() {
		var $container = $('<div data-h5-main-scene-container="testContainer">');
		$('#qunit-fixture').append($container);
		var container = h5.scene.createSceneContainer($container, true);
		strictEqual(h5.scene.getSceneContainerByName('testContainer'), container,
				'メインシーンコンテナを取得できること');
	});

	//=============================
	// Definition
	//=============================
	module(
			'[jquery#-1.6.4]シーンコンテナの取得 scene.getSceneContainers()',
			{
				setup: function() {
					this.originalTitle = document.title;
					this.$containerA = $('<div class="testContainerA" data-h5-scene-container>');
					this.$containerB = $('<div class="testContainerB" data-h5-scene-container>');
					this.$mainContainer = $('<div class="testMainContainer" data-h5-main-scene-container>');
					$('#qunit-fixture').append(this.$containerA);
					$('body').append(this.$containerB);
					$('#qunit-fixture').append(this.$mainContainer);
				},
				teardown: function() {
					clearController();
					this.$containerB.remove();
					document.title = this.originalTitle;
				}
			});

	//=============================
	// Body
	//=============================
	test('第1引数を指定しない場合はbody以下からメインシーンコンテナ、メインでないシーンコンテナが取得できること', function() {
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer(this.$containerB);
		h5.scene.createSceneContainer(this.$mainContainer, true);
		var containers = h5.scene.getSceneContainers();
		strictEqual(containers.length, 3, 'メインシーンコンテナ、メインでないシーンコンテナを取得できること');
	});

	test('第1引数に指定したDOM要素以下からメインシーンコンテナ、メインでないシーンコンテナが取得できること', function() {
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer(this.$containerB);
		h5.scene.createSceneContainer(this.$mainContainer, true);
		var containers = h5.scene.getSceneContainers(document.getElementById('qunit-fixture'));
		strictEqual(containers.length, 2, '第1引数に指定したDOM要素以下から取得できること');
	});

	test('第1引数に指定したjQueryオブジェクト要素以下からメインシーンコンテナ、メインでないシーンコンテナが取得できること', function() {
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer(this.$containerB);
		h5.scene.createSceneContainer(this.$mainContainer, true);
		var containers = h5.scene.getSceneContainers($('#qunit-fixture'));
		strictEqual(containers.length, 2, '第1引数に指定したjQuery要素以下から取得できること');
	});

	test('第1引数に指定したセレクタ文字列以下からメインシーンコンテナ、メインでないシーンコンテナが取得できること', function() {
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer(this.$containerB);
		h5.scene.createSceneContainer(this.$mainContainer, true);
		var containers = h5.scene.getSceneContainers('#qunit-fixture');
		strictEqual(containers.length, 2, '第1引数に指定したセレクタ文字列以下から取得できること');
	});

	test('第2引数を省略した場合は第1引数に指定した要素の子孫要素にバインドされているコントローラが取得できること', function() {
		// MEMO 子孫要素のシーンコンテナも取得できるということ
		var $containerZ = $('<div class="testContainerZ">');
		this.$containerA.append($containerZ);
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer($containerZ);
		var containers = h5.scene.getSceneContainers('#qunit-fixture');
		strictEqual(containers.length, 2, '第1引数に指定した要素の子孫にバインドされているコントローラも取得できること');
	});

	test('第2引数にtrueを指定した場合は第1引数に指定した要素の子孫要素にバインドされているコントローラが取得できること', function() {
		// MEMO 子孫要素のシーンコンテナも取得できるということ
		var $containerZ = $('<div class="testContainerZ">');
		this.$containerA.append($containerZ);
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer($containerZ);
		var containers = h5.scene.getSceneContainers('#qunit-fixture', {
			deep: true
		});
		strictEqual(containers.length, 2, '第1引数に指定した要素の子孫にバインドされているコントローラも取得できること');
	});

	test('第2引数にfalseを指定した場合は子孫要素にバインドされているコントローラは含まないこと', function() {
		// MEMO 子孫要素のシーンコンテナも取得できるということ
		var $containerZ = $('<div class="testContainerZ">');
		this.$containerA.append($containerZ);
		h5.scene.createSceneContainer(this.$containerA);
		h5.scene.createSceneContainer($containerZ);
		var containers = h5.scene.getSceneContainers(this.$containerA, {
			deep: false
		});
		strictEqual(containers.length, 1, '第1引数に指定した要素の子孫にバインドされているコントローラも取得できること');
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナの取得 Controller.scene.getParentSceneContainer()', {
		setup: function() {
			stop();
			var that = this;
			var html = '<div class="testContainer" data-h5-scene-container>';
			html += '<div class="testController" data-h5-scene>';
			html += '</div></div>';
			$('#qunit-fixture').append(html);
			var controllerDef = {
				__name: 'testController'
			};
			h5.core.expose(controllerDef);
			this.controller = h5.core.controller('.testController', controllerDef);
			this.controller.readyPromise.done(function() {
				that.container = h5.scene.createSceneContainer('.testContainer');
				start();
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('自身が所属するシーンコンテナを取得できること', function() {
		var container = this.controller.scene.getParentContainer();
		strictEqual(container, this.container, '自身が所属するシーンコンテナを取得できること');
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナ内の遷移方法', {
		setup: function() {
			this.url = 'scenedata/page/navigate/toWithBody.html';
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('SceneContainer.navigate()', function() {
		var $container = this.$container;
		var container = h5.scene.createSceneContainer($container);
		container.navigate(this.url).done(function() {
			var msg = $container.find('.message').text();
			strictEqual(msg, 'toWithBody', 'SceneContainer.navigate()でシーンの遷移が行えること');
		}).always(start);
	});

	asyncTest('sceneChangeRequestイベント', function() {
		var $container = this.$container;
		h5.scene.createSceneContainer($container);
		$container.trigger('sceneChangeRequest', {
			to: this.url
		});
		// FIXME シーンが遷移し終わったタイミングの判定方法
		setTimeout(function() {
			var msg = $container.find('.message').text();
			strictEqual(msg, 'toWithBody', 'SceneContainer.navigate()でシーンの遷移が行えること');
			start();
		}, 1000);
	});

	asyncTest('Controller.scene.navigate()', function() {
		var that = this;
		var $container = this.$container;
		var testController = {
			__name: 'testController'
		};
		h5.core.expose(testController);
		$container.append('<div class="test" data-h5-scene>');
		var controller = h5.core.controller('.test', testController);
		controller.readyPromise.done(function() {
			h5.scene.createSceneContainer($container);
			controller.scene.navigate(that.url);
			// FIXME シーンが遷移し終わったタイミングの判定方法
			setTimeout(function() {
				var msg = $container.find('.message').text();
				strictEqual(msg, 'toWithBody', 'SceneContainer.navigate()でシーンの遷移が行えること');
				start();
			}, 1000);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナの遷移先にコントローラを指定', {
		setup: function() {
			var html = '<div class="testContainer" data-h5-scene-container>';
			html += '<div class="testController" data-h5-scene></div></div>';
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('既に存在するコントローラ', function() {
		var controllerDef = {
			__name: 'testController',
			__init: function() {
				$(this.rootElement).append('<div class="message">testController</div>');
			}
		};
		h5.core.expose(controllerDef);
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate('testController').done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				strictEqual($('.message').text(), 'testController', 'コントローラを指定できること');
				start();
			}, 0);
		});
	});

	asyncTest('存在しないコントローラ', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate('scenedata.controller.ToController').done(function() {
			// TODO 指定したコントローラの__initが終わる前にresolveされているので
			// messageクラス要素に値がまだ入っていない
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				strictEqual($('.message').text(), 'ToController', 'コントローラを指定できること');
				start();
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナの遷移先にHTMLを指定', {
		setup: function() {
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
			this.container = h5.scene.createSceneContainer('.testContainer');
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('bodyがありシーンコンテナがない場合', function() {
		this.container.navigate('scenedata/page/navigate/toWithBody.html').done(function() {
			strictEqual($('.message').text(), 'toWithBody', 'bodyタグ以下のHTMLがシーンコンテナに表示されること');
		}).always(start);
	});

	asyncTest('bodyもシーンコンテナもない場合', function() {
		this.container.navigate('scenedata/page/navigate/toWithoutBodyAndContainer.html').done(
				function() {
					strictEqual($('.message').text(), 'toWithoutBodyAndContainer',
							'HTMLがシーンコンテナに表示されること');
				}).always(start);
	});

	asyncTest('シーンコンテナがある場合', function() {
		this.container.navigate('scenedata/page/navigate/toWithContainer.html').done(function() {
			strictEqual($('.message').text(), 'toWithContainer', 'シーンコンテナ以下のHTMLがシーンコンテナに表示されること');
		}).always(start);
	});

	asyncTest('シーンコンテナが複数ある場合', function() {
		this.container.navigate('scenedata/page/navigate/toWithMultiSceneContainer.html').done(
				function() {
					strictEqual($('.message').text(), 'toWithMultiSceneContainer1',
							'先頭のシーンコンテナが表示されること');
				}).always(start);
	});

	//=============================
	// Definition
	//=============================
	// FIXME JSエラーが起きている
	module('[jquery#-1.6.4]履歴管理', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			this.container;
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					document.title = that.originalTitle;
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('メインシーンコンテナは遷移時にブラウザ履歴が残る', function() {
		var container = this.container = h5.scene.createSceneContainer('.testContainer', true);
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html'
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html',
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return $('.message').text() === 'to';
									},
									failMsg: 'シーンが遷移しない',
									maxWait: 1000
								}).done(function() {
									strictEqual($('.message').text(), 'to', 'ブラウザ履歴が残ること');
								}).always(start);
							});
						}, 0);
					});
				});
			}, 0);
		});
	});

	asyncTest('履歴遷移（戻る、進む）で、メインシーンコンテナ以外の要素は変わらない', function() {
		this.$container.wrap('<div class="outOfContainer"></div>');
		this.$container.after('<div class="afterOfContainer">afterOfContainer</div>');
		var $container = this.$container;
		var container = this.container = h5.scene.createSceneContainer('.testContainer', true);
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html'
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html',
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return $('.message').text() === 'to';
									},
									failMsg: 'シーンが遷移しない',
									maxWait: 1000
								}).done(function() {
									var assertMsg = 'ブラウザバックしてもメインシーンコンテナ以外の要素は変わらないこと';
									var parentEl = $container.parent('.outOfContainer');
									var afterEl = $container.next('.afterOfContainer');
									strictEqual(parentEl.length, 1, assertMsg);
									strictEqual(afterEl.length, 1, assertMsg);
									window.history.forward();
									gate({
										func: function() {
											return $('.message').text() === 'toWithBody';
										},
										failMsg: 'シーンが遷移しない',
										maxWait: 1000
									}).done(function() {
										assertMsg = 'ブラウザフォワードしてもメインシーンコンテナ以外の要素は変わらないこと';
										parentEl = $container.parent('.outOfContainer');
										afterEl = $container.next('.afterOfContainer');
										strictEqual(parentEl.length, 1, assertMsg);
										strictEqual(afterEl.length, 1, assertMsg);
									}).always(start);
								});
							});
						}, 0);
					});
				});
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナのタイトルとdocument.title', {
		setup: function() {
			this.url = location.href;
			this.defaultTitle = document.title;
			document.title = 'defaultTitle';
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.url).done(function() {
				document.title = that.defaultTitle;
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					clearController();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('メインシーンコンテナのタイトルがdocument.titleに反映されること', function() {
		var that = this;
		this.container = h5.scene.createSceneContainer(this.$container, true);
		this.container.navigate('scenedata/page/title/dataTitle.html').done(
				function() {
					strictEqual(document.title, that.container.getTitle(),
							'メインシーンコンテナのタイトルがdocument.titleに反映されること');
					start();
				});
	});

	asyncTest('メインでないシーンコンテナのタイトルがdocument.titleに反映されないこと', function() {
		this.container = h5.scene.createSceneContainer(this.$container);
		this.container.navigate('scenedata/page/title/dataTitle.html').done(
				function() {
					strictEqual(document.title, 'defaultTitle',
							'メインでないシーンコンテナのタイトルがdocument.titleに反映されないこと');
					start();
				});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナのタイトルを設定', {
		setup: function() {
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('navigate()のtitleプロパティ値がシーンコンテナのタイトルに設定されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata/page/title/dataTitle.html',
			title: 'changeTitleByProperty'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitleByProperty',
							'navigate()のtitleプロパティ値がシーンコンテナのタイトルに設定されること');
					start();
				});
	});

	asyncTest('コントローラ遷移の場合、遷移先のシーンコントローラのsceneTitleプロパティ値がシーンコンテナのタイトルに設定されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata.controller.ToController'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitleBySceneTitleProperty',
							'遷移先のシーンコントローラのsceneTitleプロパティ値がシーンコンテナのタイトルに設定されること');
					start();
				});
	});

	asyncTest('遷移先シーン要素のdata-h5-scene-title属性値がシーンコンテナのタイトルに設定されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata/page/title/dataTitle.html'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitle',
							'遷移先シーン要素のdata-h5-scene-title属性値がシーンコンテナのタイトルに設定されること');
					start();
				});
	});

	asyncTest('遷移先シーン要素の子孫のタイトルタグの値がシーンコンテナのタイトルに設定されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata/page/title/childTitleTag.html'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitleByTitleTag',
							'遷移先シーン要素の子孫のタイトルタグの値がシーンコンテナのタイトルに設定されること');
					start();
				});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]シーンコンテナのタイトルを設定(優先順位)', {
		setup: function() {
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'navigate()のtitleプロパティと遷移先シーンコントローラにsceneTitleプロパティが存在する場合、titleプロパティが優先されること',
			function() {
				var container = h5.scene.createSceneContainer(this.$container);
				container
						.navigate({
							to: 'scenedata.controller.ToController',
							title: 'changeTitleByProperty'
						})
						.done(
								function() {
									strictEqual(container.getTitle(), 'changeTitleByProperty',
											'navigate()のtitleプロパティと遷移先シーンコントローラにsceneTitleプロパティが存在する場合、titleプロパティが優先されること');
									start();
								});
			});

	asyncTest('navigate()のtitleプロパティと遷移先シーン要素の子孫のタイトルタグが存在する場合、titleプロパティが優先されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata/page/title/childTitleTag.html',
			title: 'changeTitleByProperty'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitleByProperty',
							'navigate()のtitleプロパティと遷移先シーン要素の子孫のタイトルタグが存在する場合、titleプロパティが優先されること');
					start();
				});
	});

	asyncTest(
			'コントローラ遷移で指定したコントローラのsceneTitleプロパティと遷移先HTMLにdata-h5-scene-title属性が存在する場合、sceneTitleプロパティが優先されること',
			function() {
				var container = h5.scene.createSceneContainer(this.$container);
				container
						.navigate({
							to: 'scenedata.controller.SceneTitleAndDataTitleController',
						})
						.done(
								function() {
									strictEqual(container.getTitle(),
											'changeTitleBySceneTitleProperty',
											'コントローラ遷移で指定したコントローラのsceneTitleプロパティと遷移先HTMLにdata-h5-scene-title属性が存在する場合、sceneTitleプロパティが優先されること');
									start();
								});
			});

	asyncTest(
			'遷移先HTMLのシーン要素にdata-h5-scene-title属性とタイトルタグが存在する場合、data-h5-scene-title属性が優先されること',
			function() {
				var container = h5.scene.createSceneContainer(this.$container);
				container
						.navigate({
							to: 'scenedata/page/title/dataTitleAndTitleTag.html'
						})
						.done(
								function() {
									strictEqual(container.getTitle(), 'changeTitle',
											'遷移先HTMLのシーン要素にdata-h5-scene-title属性とタイトルタグが存在する場合、data-h5-scene-title属性が優先されること');
									start();
								});
			});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]createSceneContainer() data-h5-scene-title属性', {
		setup: function() {
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('対象シーンコンテナ要素の直下先頭シーン要素のdata-h5-scene-titleプロパティがシーンコンテナのタイトルに設定されること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		container.navigate({
			to: 'scenedata/page/title/multiDataTitle.html'
		}).done(
				function() {
					strictEqual(container.getTitle(), 'changeTitleA',
							'対象シーンコンテナ要素の直下先頭シーン要素のdata-h5-scene-titleプロパティがシーンコンテナのタイトルに設定されること');
					start();
				});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]setTitle()', {
		setup: function() {
			this.originalTitle = document.title;
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
		},
		teardown: function() {
			document.title = this.originalTitle;
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('setTitleで指定したタイトルがシーンコンテナのタイトルになること', function() {
		var container = h5.scene.createSceneContainer(this.$container);
		var title = 'settingTitle';
		container.setTitle(title);
		strictEqual(container.getTitle(), title, 'setTitleで指定したタイトルがシーンコンテナのタイトルになること');
	});

	test('メインシーンコンテナの場合、document.titleにも反映されること', function() {
		var container = h5.scene.createSceneContainer(this.$container, true);
		var title = 'settingTitle';
		container.setTitle(title);
		strictEqual(container.getTitle(), title, 'setTitleで指定したタイトルがメインシーンコンテナのタイトルになること');
		strictEqual(document.title, title, 'setTitleで指定したタイトルがdocument.titleに反映されること');
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate(文字列)', {
		setup: function() {
			this.originalTitle = document.title;
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
			this.container = h5.scene.createSceneContainer(this.$container);
		},
		teardown: function() {
			document.title = this.originalTitle;
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('ページURLを指定', function() {
		var container = this.container;
		container.navigate('scenedata/page/navigate/toWithContainer.html').done(function() {
			strictEqual($('.message').text(), 'toWithContainer', '指定したHTMLにシーン遷移すること');
			start();
		});
	});

	asyncTest('コントローラ名を指定', function() {
		var container = this.container;
		container.navigate('scenedata.controller.ToController').done(function() {
			// FIXME 指定したコントローラのコントローラ化が終わる前にアサートしているため失敗している
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				strictEqual($('.message').text(), 'ToController', '指定したコントローラをバインドすること');
				start();
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate()のargsプロパティ', {
		setup: function() {
			this.originalTitle = document.title;
			this.$container = $('<div class="testContainer">');
			$('#qunit-fixture').append(this.$container);
			this.container = h5.scene.createSceneContainer(this.$container);
		},
		teardown: function() {
			document.title = this.originalTitle;
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('最初に表示されるシーンのコントローラ生成時の第3引数に設定されること', function() {
		var container = this.container;
		container.navigate({
			to: 'scenedata.controller.SceneTitleAndDataTitleController',
			args: {
				test: 'testValue'
			}
		}).done(
				function() {
					// FIXME 指定したコントローラのコントローラ化が終わる前にアサートしているため失敗している
					// MEMO toプロパティで指定したコントローラの__initでargs.testをmessageクラス要素に出力している
					// TODO 仮実装に合わせたタイムアウト処理
					setTimeout(function() {
						strictEqual($('.message').text(), 'testValue',
								'最初に表示されるシーンのコントローラ生成時の第3引数に設定されること');
						start();
					}, 0);
				});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate()のnavigationTypeプロパティ', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			var html = '<div class="testContainer"><div data-h5-scene>';

			html += '</div></div>';
			// FIXME qunit-fixtureの下に配置するとqunit-fixtureの入れ子構造が何故かできる
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				document.title = that.originalTitle;
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('normalを指定した場合はURLに開発者指定のパラメータが入ること', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			navigationType: 'normal',
			args: {
				test: 'testValue'
			}
		}).done(function() {
			gate({
				func: function() {
					return $('.message').text() === 'to';
				},
				failMsg: 'シーンが遷移しない',
				maxWait: 1000
			}).done(function() {
				// FIXME 指定したコントローラのコントローラ化が終わる前にアサートしているため失敗している
				// MEMO toプロパティで指定したコントローラの__initでargs.testをmessageクラス要素に出力している
				var reg = /\??\&?_cltest_/;
				var search = location.search;
				ok(reg.test(search), 'URLに開発者指定のパラメータが入ること');
			}).always(start);
		});
	});

	asyncTest('normalを指定した場合はブラウザバックで再表示できること', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			navigationType: 'normal'
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html'
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return $('.message').text() === 'to';
									},
									maxWait: 1000,
									failMsg: 'ブラウザバックで再表示できない'
								}).done(function() {
									strictEqual($('.message').text(), 'to', 'ブラウザバックで再表示できること');
								}).always(start);
							});
						}, 0);
					});
				}).fail(start);
			}, 0);
		});
	});

	asyncTest('normalを指定した場合はブラウザバックでパラメータが再表示できること', function() {
		var container = this.container;
		var url = '/hifive/test/scenedata/page/navigate/toWithBody.html';
		container.navigate({
			to: url,
			navigationType: 'normal',
			args: {
				test: 'testValue'
			}
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'toWithBody';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					var parameter = location.search;
					url = '/hifive/test/scenedata/page/navigate/to.html';
					container.navigate({
						to: url
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'to';
								},
								maxWait: 1000,
								failMsg: 'シーンが遷移しない'
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return location.search === parameter;
									},
									maxWait: 1000,
									failMsg: 'パラメータが再表示されない'
								}).done(function() {
									var assertMsg = 'ブラウザバックでパラメータが再表示できること';
									strictEqual(location.search, parameter, assertMsg);
								}).always(start);
							}).fail(start);
						}, 0);
					});
				}).fail(start);
			}, 0);
		});
	});

	asyncTest('onceを指定した場合はURLに開発者指定のパラメータを入れず、フレームワーク用パラメータのみとなること', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			navigationType: 'once',
			args: {
				test: 'testValue'
			}
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					maxWait: 1000,
					failMsg: 'シーンが遷移しない'
				}).done(function() {
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html',
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {

							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								maxWait: 1000,
								failMsg: 'シーンが遷移しない'
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										var $el = $('.testContainer > div > h1');
										return $el.text() === 'この画面は再表示できません。';
									},
									maxWait: 1000,
									failMsg: 'シーンが遷移しない'
								}).done(function() {
									var search = location.search;
									var reg = /\??\&?_cltest_/;
									ok(!reg.test(search), 'URLに開発者指定のパラメータが入らないこと');
								}).always(start);
							});
						}, 0);
					}).fail(start);
				});
			}, 0);
		}).fail(start);
	});

	asyncTest('onceを指定した場合はブラウザバックで再表示不可のメッセージ画面を表示すること', function() {
		var notShowableMsg = 'この画面は再表示できません。';
		var container = this.container;
		var toUrl = '/hifive/test/scenedata/page/navigate/to.html';
		var toWithBodyUrl = '/hifive/test/scenedata/page/navigate/toWithBody.html';
		container.navigate({
			to: toUrl,
			navigationType: 'once',
			args: {
				test: 'testValue'
			}
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					maxWait: 1000,
					failMsg: 'シーンが遷移しない'
				}).done(function() {
					container.navigate({
						to: toWithBodyUrl,
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								maxWait: 1000,
								failMsg: 'シーンが遷移しない'
							}).done(function() {
								window.history.back();
								var $h1;
								gate({
									func: function() {
										$h1 = $('.testContainer > div > h1');
										return $h1.text() === notShowableMsg;
									},
									maxWait: 1000,
									failMsg: 'シーンが遷移しない'
								}).done(function() {
									var assertMsg = '再表示不可のメッセージ画面を表示すること';
									strictEqual($h1.text(), notShowableMsg, assertMsg);
								}).always(start);
							});
						}, 0);
					}).fail(start);
				});
			}, 0);
		}).fail(start);
	});

	asyncTest('silentを指定した場合はURLが変化せずに遷移すること', function() {
		var container = this.container;
		var beforeHref = location.href;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			navigationType: 'silent',
			args: {
				test: 'testValue'
			}
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					maxWait: 1000,
					failMsg: 'シーンが遷移しない'
				}).done(function() {
					var afterHref = location.href;
					strictEqual(beforeHref, afterHref, 'URLが変化せずに遷移すること');
				}).always(start);
			}, 0);
		}).fail(start);
	});

	asyncTest('silentを指定した場合はブラウザバックで戻れないこと', function() {
		// messageクラス要素の文字列を返す
		var getMsgClassElText = function(window) {
			return window.$('.message').text();
		};
		// FIXME ブラウザバックを行うと画面遷移してしまうので、新しいウィンドウで行う必要があるか
		openPopupWindow().done(function(nWindow) {
			var w = nWindow;
			w.location.href = 'scenedata/page/from.html?' + BUILD_TYPE_PARAM;
			gate({
				func: createFuncForWaitPouupMainContainer(w)
			}).done(function() {
				var container = w.h5.scene.getMainSceneContainer();
				var toUrl = '/hifive/test/scenedata/page/navigate/to.html';
				container.navigate({
					to: toUrl,
					navigationType: 'silent'
				}).done(function() {
					// TODO 仮実装に合わせたタイムアウト処理
					setTimeout(function() {
						gate({
							func: function() {
								return getMsgClassElText(w) === 'to';
							},
							maxWait: 1000,
							failMsg: 'シーンが遷移しない'
						}).done(function() {
							w.history.back();
							gate({
								func: function() {
									return getMsgClassElText(w) === 'to';
								},
								maxWait: 1000
							}).done(function() {
								var assertMsg = 'ブラウザバックができないこと';
								strictEqual(getMsgClassElText(w), 'to', assertMsg);
							}).always(function() {
								closePopupWindow(w);
								start();
							});
						});
					}, 0);
				}).fail(start);
			});
		}).fail(function(e) {
			throw e;
		});
	});

	asyncTest('指定なしの場合はurlHistoryMode設定が使用されること(デフォルトはnormal)', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html'
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					var parameter = location.search;
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html'
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return $('.message').text() === 'to';
									},
									maxWait: 1000,
									failMsg: 'ブラウザバックで再表示できない'
								}).done(function() {
									strictEqual($('.message').text(), 'to', 'ブラウザバックで再表示できること');
									strictEqual(location.search, parameter, 'パラメータを再表示できること');
								}).always(start);
							});
						}, 0);
					});
				}).fail(start);
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate()のreplaceHistoryプロパティを指定', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			var html = '<div class="testContainer"><div data-h5-scene>';

			html += '</div></div>';
			// FIXME qunit-fixtureの下に配置するとqunit-fixtureの入れ子構造が何故かできる
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					document.title = that.originalTitle;
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('falseの場合は置換しないで遷移すること(デフォルト)', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			replaceHistory: false
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {

				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					var search = location.search;
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html'
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {

							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								gate({
									func: function() {
										return $('.message').text() === 'to';
									},
									failMsg: 'シーンが遷移しない',
									maxWait: 1000
								}).done(function() {
									strictEqual(location.search, search, 'ブラウザバックでシーンが遷移すること');
								}).always(start);
							});

						}, 0);
					});
				});

			}, 0);
		});
	});

	asyncTest('trueの場合はブラウザバックでシーンが遷移できなくなること', function() {
		// messageクラス要素の文字列を返す
		var getMsgClassElText = function(window) {
			return window.$('.message').text();
		};
		var toUrl = '/hifive/test/scenedata/page/navigate/to.html';
		var toWithBodyUrl = '/hifive/test/scenedata/page/navigate/toWithBody.html';
		openPopupWindow().done(function(nWindow) {
			var w = nWindow;
			w.location.href = 'scenedata/page/from.html?' + BUILD_TYPE_PARAM;
			gate({
				func: createFuncForWaitPouupMainContainer(w)
			}).done(function() {
				var container = w.h5.scene.getMainSceneContainer();
				container.navigate({
					to: toUrl,
					replaceHistory: true
				}).done(function() {
					// TODO 仮実装に合わせたタイムアウト処理
					setTimeout(function() {

						gate({
							func: function() {
								return getMsgClassElText(w) === 'to';
							},
							maxWait: 1000,
							failMsg: 'シーンが遷移しない'
						}).done(function() {
							container.navigate({
								to: toWithBodyUrl
							}).done(function() {
								// TODO 仮実装に合わせたタイムアウト処理
								setTimeout(function() {

									gate({
										func: function() {
											return getMsgClassElText(w) === 'toWithBody';
										},
										maxWait: 1000,
										failMsg: 'シーンが遷移しない'
									}).done(function() {
										w.history.back();
										gate({
											func: function() {
												return getMsgClassElText(w) === 'to';
											},
											maxWait: 1000
										}).done(function() {
											gate({
												func: function() {
													return w.document.readyState === 'complete';
												}
											}).done(function() {
												var assertMsg = '前のシーンに遷移ができず画面遷移となること';
												strictEqual(w.location.pathname, toUrl, assertMsg);
												closePopupWindow(w);
											}).always(start);
										});
									});

								}, 0);
							}).fail(start);
						});

					}, 0);
				}).fail(start);
			});
		}).fail(function(e) {
			throw e;
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate()のmethodプロパティを指定', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			var html = '<div class="testContainer"><div data-h5-scene>';
			html += '</div></div>';
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				document.title = that.originalTitle;
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('getの場合はgetメソッドで取得すること(デフォルト)', function() {
		var isGetMethod;
		var oldH5Ajax = h5.ajax;
		h5.ajax = function() {
			isGetMethod = arguments[0].method === 'get';
			return oldH5Ajax(arguments);
		};
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			method: 'get'
		}).done(function() {
			ok(isGetMethod, 'getメソッドで取得すること');
		}).always(function() {
			h5.ajax = oldH5Ajax;
			start();
		});
	});

	asyncTest('postの場合はpostメソッドで取得すること', function() {
		var isPostMethod;
		var oldH5Ajax = h5.ajax;
		h5.ajax = function() {
			isPostMethod = arguments[0].method === 'post';
			return oldH5Ajax(arguments);
		};
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			method: 'post'
		}).done(function() {
			ok(isPostMethod, 'postメソッドで取得すること');
		}).always(function() {
			h5.ajax = oldH5Ajax;
			start();
		});
	});

	// FIXME テストが止まる
	asyncTest('postの場合はブラウザバックで再表示不可のメッセージ画面を表示すること', function() {
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			method: 'post'
		}).done(function() {
			// TODO 仮実装に合わせたタイムアウト処理
			setTimeout(function() {
				gate({
					func: function() {
						return $('.message').text() === 'to';
					},
					failMsg: 'シーンが遷移しない',
					maxWait: 1000
				}).done(function() {
					container.navigate({
						to: '/hifive/test/scenedata/page/navigate/toWithBody.html'
					}).done(function() {
						// TODO 仮実装に合わせたタイムアウト処理
						setTimeout(function() {
							gate({
								func: function() {
									return $('.message').text() === 'toWithBody';
								},
								failMsg: 'シーンが遷移しない',
								maxWait: 1000
							}).done(function() {
								window.history.back();
								var expectMsg = 'この画面は再表示できません。';
								gate({
									func: function() {
										return $('.testContainer > div > h1').text() === expectMsg;
									},
									maxWait: 1000
								}).done(function() {
									var resultMsg = $('.testContainer > div > h1').text();
									var assertMsg = '再表示不可のメッセージ画面が表示されること';
									strictEqual(resultMsg, expectMsg, assertMsg);
								}).always(start);
							});
						}, 0);
					});
				});
			}, 0);
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]navigate()のserverArgsプロパティを指定', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			var html = '<div class="testContainer"><div data-h5-scene>';

			html += '</div></div>';
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				document.title = that.originalTitle;
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('serverArgsがAjaxでのHTMLデータ取得時にdataプロパティとして設定されること', function() {
		var serverArgs = {
			test: 'testValue'
		};
		var data;
		var oldH5Ajax = h5.ajax;
		h5.ajax = function() {
			data = arguments[0].data;
			return oldH5Ajax(arguments);
		};
		var container = this.container;
		container.navigate({
			to: '/hifive/test/scenedata/page/navigate/to.html',
			method: 'post',
			serverArgs: serverArgs
		}).done(
				function() {
					strictEqual(JSON.stringify(data), JSON.stringify(serverArgs),
							'HTMLデータ取得時にdataプロパティとして設定されること');
				}).always(function() {
			h5.ajax = oldH5Ajax;
			start();
		});
	});

	//=============================
	// Definition
	//=============================
	module('[jquery#-1.6.4]h5.settings.scene.urlMaxLength', {
		setup: function() {
			this.href = location.href;
			this.originalTitle = document.title;
			var html = '<div class="testContainer"><div data-h5-scene>';

			html += '</div></div>';
			$('#qunit-fixture').append(html);
			this.$container = $('.testContainer');
			this.container = h5.scene.createSceneContainer(this.$container, true);
		},
		teardown: function() {
			stop();
			var that = this;
			this.container.navigate(this.href).done(function() {
				document.title = that.originalTitle;
				// TODO 仮実装に合わせたタイムアウト処理
				setTimeout(function() {
					clearController();
					$('.testContainer').remove();
					start();
				}, 0);
			});
		}
	});

	//=============================
	// Body
	//=============================
	test('[build#min]遷移先のURL長(URL全体)が1800(デフォルト)を超過した場合、dev版ではエラーを出すこと', function() {
		var str = '';
		for (var i = 0; i < 180; i++) {
			str += '0123456789';
		}
		var container = this.container;
		try {
			container.navigate({
				to: '/hifive/test/scenedata/page/to.html',
				args: {
					test: str
				}
			});
		} catch (e) {
			ok(true, 'dev版ではエラーを出すこと');
		}
	});

	test('[build#dev]遷移先のURL長(URL全体)が1800(デフォルト)を超過した場合、min版では警告ログを出力すること', function() {
		var str = '';
		for (var i = 0; i < 180; i++) {
			str += '0123456789';
		}
		var container = this.container;
		try {
			container.navigate({
				to: '/hifive/test/scenedata/page/to.html',
				args: {
					test: str
				}
			});
			// FIXME 警告ログを出していることの確認が必要
			ok(true, 'エラーを出さないこと');
		} catch (e) {
			ok(false, 'エラーがでる');
		}
	});

});
