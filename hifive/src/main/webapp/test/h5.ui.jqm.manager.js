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

	// testutils
	var compareVersion = testutils.u.compareVersion;
	var isDisposed = testutils.u.isDisposed;
	var gate = testutils.async.gate;

	// jQueryMobileを実際に読み込むことはせず、jQueryMobileをシミュレートする
	/**
	 * JQMSimulatorクラス
	 *
	 * @param {String} version シミュレートするjQueryMobileのバージョン
	 * @param {Object} mobileObject $.mobileに持たせるオブジェクト
	 */
	function JQMSimulator(version, mobileObject) {
		this._mobileObject = mobileObject;
		this._version = version;
	}
	$.extend(JQMSimulator.prototype, {
		/**
		 * jQueryMobileをロードした時に行われるシミュレートする
		 *
		 * @memberOf JQMSimulator
		 */
		init: function() {
			// $.findの拡張
			var oldFind = $.find;
			this._oldFind = oldFind;
			var jqmDataRE = /:jqmData\(([^)]*)\)/g;
			$.find = function(selector, context, ret, extra) {
				if (selector.indexOf(":jqmData") > -1) {
					selector = selector.replace(jqmDataRE, "[data-" + ($.mobile.ns || "") + "$1]");
				}
				return oldFind.call(this, selector, context, ret, extra);
			};
			$.extend($.find, oldFind);

			// $.find.matchesと$.find.matchesSelectorの拡張。差し替えた$.findを使用するようにする
			$.find.matches = function(expr, set) {
				return $.find(expr, null, null, set);
			};

			$.find.matchesSelector = function(node, expr) {
				return $.find(expr, null, null, [node]).length > 0;
			};

			// $.mobileにJQMManagerが使用するapiを公開
			h5.u.obj.expose('$.mobile', this._mobileObject);
			// initした時点でのactivePageを登録
			$.mobile.activePage = $('.ui-page-active');
		},

		/**
		 * initで変更したものを元に戻す
		 *
		 * @memberOf JQMSimulator
		 */
		dispose: function() {
			$.find = this._oldFind;
			try {
				delete $.mobile;
			} catch (e) {
				$.mobile = undefined;
			}
		},

		/**
		 * 擬似的にページ遷移を行う
		 *
		 * @param {selector} to 遷移先のページ
		 * @param {boolean} initialize
		 *            pageinitをトリガーするかどうか。(JQMによって遷移先のページがページ化されるときにpageinitがトリガーされる)
		 * @param {boolean} transition トランジション遷移をエミュレートするか
		 * @prama {boolean} fromPageRemove 遷移元のページに対してpageremoveイベントをトリガするか
		 */
		changePage: function(to, initialize, transition, fromPageRemove) {
			var $from = $.mobile.activePage;
			var $to = $(to);
			if (initialize) {
				$to.trigger('pagecreate');
				$to.trigger('pageinit');
			}
			$.mobile.activePage = $to;
			$from && $from.trigger('pagebeforehide');
			$to.trigger('pagebeforeshow');

			function func() {
				if (fromPageRemove) {
					$from && $from.trigger('pageremove');
				}
				$from && $from.trigger('pagehide', {
					nextPage: $to
				});
				$to.trigger('pageshow', {
					prevPage: $from || $('')
				});
			}

			if (transition) {
				setTimeout(function() {
					func();
				}, 0);
			} else {
				func();
			}
		}
	});

	/**
	 * JQMシミュレータの作成
	 *
	 * @param {String} version
	 */
	function createSimulator(version) {
		// jQueryMobileから引用
		var urlParseRE = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
		var path = {
			// jQueryMobileから引用
			parseUrl: function(url) {
				// If we're passed an object, we'll assume that it is
				// a parsed url object and just return it back to the caller.
				if ($.type(url) === "object") {
					return url;
				}

				var matches = urlParseRE.exec(url || "") || [];

				// Create an object that allows the caller to access the sub-matches
				// by name. Note that IE returns an empty string instead of undefined,
				// like all other browsers do, so we normalize everything so its consistent
				// no matter what browser we're running on.
				return {
					href: matches[0] || "",
					hrefNoHash: matches[1] || "",
					hrefNoSearch: matches[2] || "",
					domain: matches[3] || "",
					protocol: matches[4] || "",
					doubleSlash: matches[5] || "",
					authority: matches[6] || "",
					username: matches[8] || "",
					password: matches[9] || "",
					host: matches[10] || "",
					hostname: matches[11] || "",
					port: matches[12] || "",
					pathname: matches[13] || "",
					directory: matches[14] || "",
					filename: matches[15] || "",
					search: matches[16] || "",
					hash: matches[17] || ""
				};
			}
		};
		var mobileObject = {
			version: version,
			path: path,
			ns: ''
		};

		return new JQMSimulator(version, mobileObject);
	}

	h5.u.obj.expose('h5test.jqm', {
		createSimulator: createSimulator
	});

	// jQueryのバージョンを見て読み込むjqmのバージョンを変える。
	// 1.8以上なら1.4.2、1.7.Xなら1.3.1、1.6以下なら1.2.1。
	var jqueryVersion = $().jquery;
	var jqmVersion;
	if (compareVersion(jqueryVersion, '1.8') >= 0) {
		jqmVersion = '1.4.2';
	} else if (compareVersion(jqueryVersion, '1.7') < 0) {
		jqmVersion = '1.2.1';
	} else {
		jqmVersion = '1.3.1';
	}
	var jqmSimulator = h5test.jqm.createSimulator(jqmVersion);

	//=============================
	// Variables
	//=============================

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	//=============================
	// Functions
	//=============================
	/**
	 * JQMControllerのアンバインド
	 */
	function resetJQMManager() {
		$('body>div.testForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('body>div.testForJQM').remove();
		h5.ui.jqm.manager.__reset();
		// test*.cssをheadから削除する
		$('head > link[href*="test"]').remove();

		var controllers = h5.core.controllerManager.controllers;
		for (var i = 0, len = controllers.length; i < len; i++) {
			controllers[i].dispose();
		}
		h5.core.controllerManager.controllers = [];
		h5.core.definitionCacheManager.clearAll();
	}

	/**
	 * idからページを作る。jsが指定されていればdata-h5-script、activFlag=trueなら作成したページをactiveにする
	 */
	function createPage(id, _js, activeFlag) {
		var js = _js ? ' data-h5-script="' + _js + '?' + new Date().getTime() + '"' : '';
		var $page = $('<div id="' + id + '" class="testForJQM" data-role="page"' + js + '></div>');
		var $header = $('<div id="top_header" class="ui-bar-f ui-header appLogoHeader"><h1>header</h1></div>');
		var $content = $('<div id="top_content" >content<button id="test"></button></div>');
		var $footer = $('<div id="top_footer" data-role="footer" style="width:100%">footer</div>');
		$page.append($header).append($content).append($footer);
		$('body').append($page);
		if (activeFlag) {
			// activeなページにはクラスを追加する
			$page.addClass('ui-page ui-body-c ui-page-active');
			// jqmSimulator実行中ならactivePageを設定
			if ($.mobile) {
				$.mobile.activePage = $page;
			}
		}
		return $page;
	}

	var originalPrefix = '';

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================
	//=============================
	// Definition
	//=============================

	module('[build#min;browser#ie:6]JQMManager - define', {
		setup: function() {
			createPage("test1", 'data/testforJQM1.js', true);
			createPage("test2", 'data/testforJQM2.js');
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('init()を実行せず、define()を実行する', 1, function() {
		var controllerDefObj = {
			__name: 'DefineTestController',
			__ready: function() {
				ok(true, 'h5.ui.jqm.controller.define()でコントローラがバインドされ、__ready()が実行すること。');
				start();
			}
		};
		h5.ui.jqm.manager.define('test1', null, controllerDefObj);
	});

	asyncTest('init()を実行せずにdefine()を実行して、遷移を行う', 9, function() {
		var controller1 = {
			__name: 'Test1Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				var count = 20;

				gate({
					gateFunction: function() {
						return $('#test1 h1').css('font-size') === '111px';
					},
					failMsg: 'CSSファイルがダウンロードされませんでした'
				}).done(function() {
					strictEqual($('#test1 h1').css('font-size'), '111px', 'CSSが適応されている。');
					jqmSimulator.changePage('#test2', true);
				});
			},
			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};

		var controller2 = {
			__name: 'Test2Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				var count = 20;
				gate({
					gateFunction: function() {
						return $('#test2 h1').css('margin-left') === '33px';
					},
					failMsg: 'CSSファイルがダウンロードされませんでした'
				}).done(function() {
					deepEqual($('#test2 h1').css('margin-left'), '33px', 'CSSが適応されている。');
					ok($('#test2 h1').css('font-size') !== '111px', '遷移元ページのCSSは適用されていない。');
					start();
				});
			},
			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};

		h5.ui.jqm.manager.define('test1', 'css/test.css', controller1);
		h5.ui.jqm.manager.define('test2', 'css/test2.css', controller2);
	});

	//=============================
	// Definition
	//=============================

	module('[build#min;browser#ie:6]JQMManager - managed test', {
		setup: function() {
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqm.manager.init() JQMControllerはコントローラマネージャの管理対象に含まれていないこと。', 1, function() {

		h5.ui.jqm.manager.init();

		setTimeout(function() {
			equal(h5.core.controllerManager.controllers.length, 0);
			start();
		}, 0);
	});

	asyncTest('h5.ui.jqm.manager.define() JQMControllerはコントローラマネージャの管理対象に含まれていないこと。', 2,
			function() {
				createPage("test1", 'data/testforJQM1.js', true);

				var controllerDefObj = {
					__name: 'DefineTestController'
				};

				h5.ui.jqm.manager.define('test1', null, controllerDefObj);

				setTimeout(function() {
					equal(h5.core.controllerManager.controllers.length, 1);
					equal(h5.core.controllerManager.controllers[0].__name, 'DefineTestController',
							'define()でバインドしたコントローラはコントローラマネージャの管理対象に含まれていること。');
					start();
				}, 0);
			});



	asyncTest('h5.ui.jqm.manager.init() h5controllerboundイベントがトリガされないこと。', 1, function() {
		var testController = {
			__name: 'TestController',
			'{rootElement} h5controllerbound': function(context) {
				if (context.evArg.__name === 'JQMController') {
					ok(false, 'JQMControllerからh5controllerイベントがトリガされたためエラー');
				} else {
					ok(true);
					start();
					c.dispose();
				}
			}
		};

		var c = h5.core.controller('body', testController);

		h5.ui.jqm.manager.init();
	});

	asyncTest('h5.ui.jqm.manager.define() h5controllerboundイベントがトリガされないこと。', 2, function() {
		var testController = {
			__name: 'TestController',
			'{rootElement} h5controllerbound': function(context) {
				var name = context.evArg.__name;
				if (name === 'JQMController') {
					ok(false, 'JQMControllerからh5controllerイベントがトリガされたためエラー');
				} else if (name === 'TestController') {
					ok(true);
				} else if (name === 'DefineController') {
					ok(true);
					start();
					c.dispose();
				}
			}
		};

		var c = h5.core.controller('body', testController);

		createPage("test1", 'data/testforJQM1.js', true);

		var controllerDefObj = {
			__name: 'DefineController'
		};

		h5.ui.jqm.manager.define('test1', null, controllerDefObj);
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - init1", {
		setup: function() {
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	test('※要目視確認 init() initを実行するとJQMControllerがバインドされること', 1, function() {
		h5.ui.jqm.manager.init();
		ok(true, '「コントローラJQMControllerの初期化が正常に完了しました。」のログが、コンソールに出力されること。');
	});

	asyncTest('※要目視確認 init() すでにinit()済みならログが出力されて、何もされないこと。', 1, function() {
		setTimeout(function() {
			try {
				h5.ui.jqm.manager.init();
				ok(true, '「JQMマネージャは既に初期化されています。」とログが出力されること');
			} catch (e) {
				ok(false, 'テスト失敗。エラーが発生しました。');
			}
			start();
		}, 0);
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - init2", {
		setup: function() {
			createPage("testjs1", 'data/testforJQM1.js', true);
			createPage("testjs2", 'data/testforJQM2.js');
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
			window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
			window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('init()時に存在するページのdata-h5-scriptに指定されているjsがロードされること', 2, function() {
		setTimeout(
				function() {
					ok(window.com.htmlhifive.test.loadedTestForJQM1,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					ok(window.com.htmlhifive.test.loadedTestForJQM2,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					start();
				}, 0);
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - init2", {
		setup: function() {
			createPage("testjs3", 'data/testforJQM1.js', true);
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
			window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
			window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('pageinit(jqm1.4以上の場合はpagecreate)イベントがページから呼ばれると、そのページのscriptがロードされること', 3,
			function() {
				// initが終わって、__readyが呼ばれるのが非同期なので、テストを非同期にする
				setTimeout(function() {
					createPage("testjs4", 'data/testforJQM2.js');
					ok(window.com.htmlhifive.test.loadedTestForJQM1,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					ok(!window.com.htmlhifive.test.loadedTestForJQM2,
							'init()時になかったページについてはjsファイルがロードされないこと');
					$('#testjs4').trigger('pagecreate');
					$('#testjs4').trigger('pageinit');
					ok(window.com.htmlhifive.test.loadedTestForJQM2,
							'pageinit(またはpagecreate)イベントが発生するとjsファイルがロードされる。');
					start();
				}, 0);
			});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - dataPrefix1", {
		setup: function() {
			originalPrefix = h5.ui.jqm.dataPrefix;
			h5.ui.jqm.dataPrefix = 'hifive';
			createPage("test1").attr('data-hifive-script', 'data/testforJQM1.js');
			createPage("test2", '', true).attr('data-hifive-script', 'data/testforJQM2.js');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
			h5.ui.jqm.dataPrefix = originalPrefix;
			window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
			window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqm.dataPrefixに文字列を指定した場合、data-(指定した文字列)-script属性に指定したjsファイルがロードできること', 2,
			function() {
				setTimeout(function() {
					ok(window.com.htmlhifive.test.loadedTestForJQM1,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					ok(window.com.htmlhifive.test.loadedTestForJQM2,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					start();
				}, 0);
			});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - dataPrefix2", {
		setup: function() {
			originalPrefix = h5.ui.jqm.dataPrefix;
			h5.ui.jqm.dataPrefix = null;
			createPage("test1", 'data/testforJQM1.js');
			createPage("test2", 'data/testforJQM2.js', true);

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
			h5.ui.jqm.dataPrefix = originalPrefix;
			window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
			window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqm.dataPrefixがnullの場合は、data-h5-script属性に指定したjsファイルがロードできること', 2, function() {
		setTimeout(
				function() {
					ok(window.com.htmlhifive.test.loadedTestForJQM1,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					ok(window.com.htmlhifive.test.loadedTestForJQM2,
							'data-h5-scriptに指定したjsファイルがロードされていること');
					start();
				}, 0);
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - define1", {
		setup: function() {
			createPage("test3", null, true);
			createPage("test4");
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
			window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
			window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること', 4, function() {
		// initが終わって、__readyが呼ばれるのが非同期なので、テストを非同期にする
		setTimeout(function() {
			var controller = {
				__name: 'Test3Controller',

				__construct: function() {
					ok(true, '__constructが実行される');
				},
				__init: function() {
					ok(true, '__initが実行される');
				},
				__ready: function() {
					ok(true, '__readyが実行される');

					$('#test3 button#test').trigger('click');
					start();
				},

				'button#test click': function() {
					ok(true, 'button#test click が実行される');
				}
			};
			h5.ui.jqm.manager.define('test3', null, controller);
		}, 0);
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - define2", {
		setup: function() {
			createPage("test4", 'data/testforJQM4.js', true);
			createPage("test5", 'data/testforJQM5.js');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqmmanager define() data-h5-scriptに指定したjsからdefine()できること', 1, function() {
		// コントローラの__ready()で、テスト用イベント'controllerReadyDone'をトリガーしている。
		$('#test4').bind('controllerReadyDone', function() {
			ok(true, 'define()でactivePageにバインドしたコントローラの__readyが実行された');
			start();
		});
		$('#test5').bind('controllerReadyDone', function() {
			ok(false, 'テスト失敗。define()しても、activePageでない要素にはコントローラはバインドされない');
			start();
		});
	});

	//=============================
	// Definition
	//=============================

	module("[build#min;browser#ie:6]JQMManager - define3", {
		setup: function() {
			createPage("test6", null, true);

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドし、cssがロードされること', 1, function() {
		setTimeout(function() {
			var controller = {
				__name: 'Test6Controller',
				__ready: function() {
					gate({
						gateFunction: function() {
							return $('#test6 h1').css('font-size') === '111px';
						},
						failMsg: 'CSSファイルがダウンロードされませんでした'
					}).done(function() {
						strictEqual($('#test6 h1').css('font-size'), '111px', 'CSSが適応されている。');
						start();
					});
				}
			};
			h5.ui.jqm.manager.define('test6', 'css/test.css', controller);
		}, 0);
	});

	//=============================
	// Definition
	//=============================

	module('[build#min;browser#ie:6]JQMManager - define4', {
		setup: function() {
			createPage('test7', null, true);
			createPage('test8');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('ページ遷移したときにcssが切り替わること', 9, function() {
		var controller7 = {
			__name: 'Test7Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				gate({
					gateFunction: function() {
						return $('#test7 h1').css('font-size') === '111px';
					},
					failMsg: 'CSSファイルがダウンロードされませんでした'
				}).done(function() {
					strictEqual($('#test7 h1').css('font-size'), '111px', 'CSSが適応されている。');
					h5.ui.jqm.manager.define('test8', 'css/test2.css', controller8);
					jqmSimulator.changePage('#test8', true);
				});
			},
			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		var controller8 = {
			__name: 'Test7Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				gate({
					gateFunction: function() {
						return $('#test8 h1').css('margin-left') === '33px';
					},
					failMsg: 'CSSファイルがダウンロードされませんでした'
				}).done(function() {
					strictEqual($('#test8 h1').css('margin-left'), '33px', 'CSSが適応されている。');
					ok($('#test8 h1').css('font-size') !== '111px', '遷移元ページのCSSは適用されていない。');
					start();
				});
			},
			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('test7', 'css/test.css', controller7);
	});

	//=============================
	// Definition
	//=============================

	module('[build#min;browser#ie:6]JQMManager - define5', {
		setup: function() {
			createPage('test9', null, true);
			createPage('test10');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('ページ遷移したときに遷移先のコントローラがバインドされること', 4, function() {
		var controller9 = {
			__name: 'Test9Controller',
			__ready: function() {
				ok(true, 'Test9Controller.__readyが実行される');
				$('#test9 button').trigger('click');
			},
			'button#test click': function(context) {
				if (context.evArg) {
					ok(false, 'テスト失敗。ページ遷移後に遷移元のコントローラがバインドしたイベントが呼び出された');
					return;
				}
				ok(true, '#test9内のbutton#test click が実行される');
				jqmSimulator.changePage('#test10', true);
			}
		};
		var controller10 = {
			__name: 'Test10Controller',

			__ready: function() {
				ok(true, 'Test10Controller.__readyが実行される');
				$('#test9 button').trigger('click', {
					opt: true
				});
				$('#test10 button').trigger('click', {
					opt: true
				});
			},
			'button#test click': function() {
				ok(true, '#test10内のbutton#test click が実行される');
				start();
			}
		};
		h5.ui.jqm.manager.define('test9', null, controller9);
		h5.ui.jqm.manager.define('test10', null, controller10);
	});

	//=============================
	// Definition
	//=============================

	module('[build#min;browser#ie:6]JQMManager - define6', {
		setup: function() {
			createPage('test11', null, true);
			createPage('test12');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('ページ遷移先がコントローラの無いページの場合でも、遷移できる', 4, function() {
		var controller11 = {
			__name: 'Test11Controller',

			__ready: function() {
				ok(true, 'Test11Controller.__readyが実行される');
				$('#test11 button').trigger('click');
			},
			'button#test click': function(context) {
				ok(true, '#test11内のbutton#test click が実行される');
				createPage('test12');
				$('#test11').bind('pagehide', function() {
					ok(true, 'test11のpagehideが呼ばれた。');
				});
				$('#test12').bind('pageshow', function() {
					ok(true, 'test12のpageshowが呼ばれた。');
					start();
				});
				jqmSimulator.changePage('#test12', true);
			}
		};
		h5.ui.jqm.manager.define('test11', null, controller11);
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define6', {
		setup: function() {
			createPage('test12', null, true);
			createPage('test13');

			jqmSimulator.init();
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('１ページに２つコントローラをバインドする ※min版ではエラーになります', 9,
			function() {
				var controller12A = {
					__name: 'Test12AController',
					__ready: function() {
						ok(true, 'Test12AController.__readyが実行されること');
						equal($('head > link[href*="test.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						equal($('head > link[href*="test2.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						$('#test12 button').trigger('click');
					},
					'button#test click': function(context) {
						if (context.evArg) {
							ok(false, 'テスト失敗。ページ遷移後に遷移元のコントローラがバインドしたイベントが呼び出された');
							return;
						}
						ok(true, 'Test12AControllerの#test click が実行されること');
					}
				};
				var controller12B = {
					__name: 'Test12BController',
					__ready: function() {
						ok(true, 'Test12BController.__readyが実行されること');
						jqmSimulator.changePage('#test13', true);
					}
				};

				var controller13 = {
					__name: 'Test13Controller',

					__ready: function() {
						ok(true, 'Test13Controller.__readyが実行されること');
						equal($('head > link[href*="test.css"]').length, 0,
								'define()でCSSを何も指定していないので、test.cssは削除されていること');
						equal($('head > link[href*="test2.css"]').length, 0,
								'define()でCSSを何も指定していないので、test2.cssは削除されていること');
						$('#test13 button').trigger('click', {
							opt: true
						});
					},
					'button#test click': function() {
						ok(true, '#test13内のbutton#test click が実行されること');
						start();
					}
				};
				h5.ui.jqm.manager.define('test12', ['./css/test.css', './css/test2.css'],
						controller12A);
				h5.ui.jqm.manager.define('test12', null, controller12B);
				h5.ui.jqm.manager.define('test12', './css/test.css', controller12A); // バインドされないコントローラ
				h5.ui.jqm.manager.define('test13', null, controller13);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define7', {
		setup: function() {
			createPage('test14', null, true);
			createPage('test15');
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('AページとBページにそれぞれコントローラをバインドして、A->B->Aと遷移する ※min版ではエラーになります', 8,
			function() {
				var controller14A = {
					__name: 'Test14AController',
					__ready: function() {
						ok(true, 'Test14AController.__readyが実行されること');
						equal($('head > link[href*="test.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						equal($('head > link[href*="test2.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
					}
				};
				var controller14B = {
					__name: 'Test14BController',
					__ready: function() {
						ok(true, 'Test14BController.__readyが実行されること');
						jqmSimulator.changePage('#test15', true, false, false);
					},
					'button#test click': function() {
						ok(true, '#test14内のbutton#test click が実行されること');
						start();
					}
				};

				var controller15 = {
					__name: 'Test15Controller',

					__ready: function() {
						ok(true, 'Test15Controller.__readyが実行される');
						equal($('head > link[href*="test.css"]').length, 0,
								'define()でCSSを何も指定していないので、test.cssは削除されていること');
						equal($('head > link[href*="test2.css"]').length, 0,
								'define()でCSSを何も指定していないので、test2.cssは削除されていること');
						jqmSimulator.changePage('#test14', false, false, true);
						// test14ページでボタンを押下した操作を想定
						$('#test14 button').click();
					}
				};
				h5.ui.jqm.manager.define('test14', ['./css/test.css', './css/test2.css'],
						controller14A);
				h5.ui.jqm.manager.define('test14', null, controller14B);
				h5.ui.jqm.manager.define('test14', null, controller14A); // バインドされないコントローラ
				h5.ui.jqm.manager.define('test15', null, controller15);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define8', {
		setup: function() {
			createPage('test16', null, true);
			createPage('test17');
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('動的コントローラのハンドラが、ページ遷移に合わせて有効・無効の切り替えが正しく行われているか。※min版ではエラーになります', 2, function() {
		var controller16 = {
			__name: 'Test16Controller',
			__ready: function(context) {
				ok(true, 'Test16Controller.__readyが実行されること');
				jqmSimulator.changePage('#test17', true);
			},
			'{rootElement} click': function() {
				ok(false, 'イベントハンドラが無効になっていないためテスト失敗。');
			}
		};

		var controller17 = {
			__name: 'Test17Controller',
			__ready: function(context) {
				ok(true, 'Test17Controller.__readyが実行されること');
				$('#test').click();
				start();
			}
		};

		h5.ui.jqm.manager.define('test17', null, controller17);
		h5.core.controller('#test16', controller16);
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define9', {
		setup: function() {
			createPage('test18', null, true);
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('同じコントローラだがCSSのファイルのパスが異なるdefine()を2回実行する。※min版ではエラーになります', 4,
			function() {

				var controller18 = {
					__name: 'Test18Controller',
					__ready: function(context) {
						ok(true, 'Test18Controller.__readyが実行されること');
						equal($('head > link[href*="test.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						equal($('head > link[href*="test2.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						equal(context.args, undefined, '重複するコントローラをdefineしたときに指定したパラメータは無視されること。');
						start();
					}
				};

				h5.ui.jqm.manager.define('test18', './css/test.css', controller18);
				h5.ui.jqm.manager.define('test18', './css/test2.css', controller18, {
					num: 1
				});
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define10', {
		setup: function() {
			jqmSimulator.init();
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	test('不正なパラメータを指定してdefine()を実行する ※min版ではエラーになります', 5, function() {
		throws(function(enviroment) {
			h5.ui.jqm.manager.define(10, null, {
				__name: 'TestController'
			});
		}, function(actual) {
			return 12000 === actual.code;
		}, 'idにString型以外の値が指定されたためエラーが発生すること。');

		throws(function(enviroment) {
			h5.ui.jqm.manager.define('test', 10, {
				__name: 'TestController'
			});
		}, function(actual) {
			return 12000 === actual.code;
		}, 'CSSファイルのパスにString型またはArray型以外の値が指定されたためエラーが発生すること。');

		throws(function(enviroment) {
			h5.ui.jqm.manager.define('test', './css/test.css', {
				__name: 'TestController'
			}, 10);
		}, function(actual) {
			return 12000 === actual.code;
		}, 'パラメータにObject型以外の値が指定されたためエラーが発生すること。');

		throws(function(enviroment) {
			h5.ui.jqm.manager.define('test', null, [10]);
		}, function(actual) {
			return 12001 === actual.code;
		}, 'コントローラ定義オブジェクトにObject型以外の値が指定されたたためエラーが発生すること。');

		throws(function(enviroment) {
			h5.ui.jqm.manager.define('test', null, {});
		}, function(actual) {
			return 12000 === actual.code;
		}, 'コントローラ定義オブジェクトに__nameプロパティが無いためエラーが発生すること。');
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define11', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test19', null, true);
			createPage('test20');

		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('CSSファイルのパスのみ指定してdefine()を実行する。※min版ではエラーになります', 4, function() {
		h5.core.controller('body',
				{
					__name: 'BodyController',
					__ready: function() {
						h5.ui.jqm.manager.define('test19', './css/test.css');
						h5.ui.jqm.manager.define('test20', './css/test2.css');

						equal($('head > link[href*="test.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						equal($('head > link[href*="test2.css"]').length, 0,
								'define()で指定したCSSが読み込まれていること');
						jqmSimulator.changePage('#test20', true);

						equal($('head > link[href*="test.css"]').length, 0,
								'define()で指定したCSSが読み込まれていること');
						equal($('head > link[href*="test2.css"]').length, 1,
								'define()で指定したCSSが読み込まれていること');
						start();
					}
				});
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define12', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test21', null, true);
			createPage('test22');

		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('動的コントローラをバインド後disposeを実行し、別ページに遷移する', 1, function() {
		var c = h5.core.controller('#test21', {
			__name: 'Test21Controller',
			__ready: function() {
				try {
					this.dispose();
					jqmSimulator.changePage('#test22', true);
					ok(true, '動的に生成したコントローラをdipose後、ページ遷移を実行してもエラーが発生しないこと。');
				} catch (e) {
					ok(false, 'テスト失敗');
				}
				start();
			}
		});
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - define13', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test23', null, true);
			createPage('test24');

		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('動的コントローラをバインド後unbindを実行し、別ページに遷移する', 2, function() {
		var c = h5.core.controller('#test23',
				{
					__name: 'Test23Controller',
					__ready: function() {
						try {
							this.unbind();
							jqmSimulator.changePage('#test24', true, false, true);
							ok(true, '動的に生成したコントローラをunbind後、ページ遷移を実行してもエラーが発生しないこと。');
						} catch (e) {
							ok(false, 'テスト失敗');
						}

						equal(isDisposed(c), false,
								'unbindしたコントローラはjQMManagerの管理対象から除外されるのでdisposeされないこと');
						start();
					}
				});
	});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test25', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'初期表示後A->Bと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションなし)',
			8, function() {
				var order = 1;
				var pageA = this.pageA;
				var pageB = null;

				h5.ui.jqm.manager.define('test25', null, {
					__name: 'Test25Controller',
					__ready: function() {
						equal(order++, 1, '初期表示時、1番目にAの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 2, '初期表示時、2番目にAのh5jqmpageshowイベントが実行されること');
						equal(context.evArg.prevPage.length, 0, '前ページはないので何も要素を持っていないこと');

						order = 1;
						pageB = createPage('test26')[0];
						jqmSimulator.changePage('#test26', true, false, false);
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 1, 'A -> B遷移時、1番目にAのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageB, '遷移先のページが引数で返ってくること');
					}
				});

				h5.ui.jqm.manager.define('test26', null, {
					__name: 'Test26Controller',
					__ready: function() {
						equal(order++, 2, 'A -> B遷移時、2番目にBの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 3, 'A -> B遷移時、3番目にBのh5jqmpageshowイベントが実行されること');
						strictEqual(context.evArg.prevPage[0], pageA, '遷移元ページが引数で返ってくること');
						start();
					}
				});

				// 初期表示イベントをエミュレート
				jqmSimulator.changePage('#test25', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 2', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test27', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'A->B->Aと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションなし)',
			5, function() {
				var order = 1;
				var pageB = null;
				var pageA = this.pageA;

				h5.ui.jqm.manager.define('test27', null, {
					__name: 'Test27Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						if (context.evArg.prevPage.length === 0) {
							pageB = createPage('test28')[0];
							jqmSimulator.changePage('#test28', true, false, false);
						} else {
							equal(order++, 3, 'B->A遷移時、3番目にAのh5jqmpageshowイベントがトリガされること');
							strictEqual(context.evArg.prevPage[0], pageB, '遷移元ページが引数で返ってくること');
							start();
						}
					}
				});

				h5.ui.jqm.manager.define('test28', null, {
					__name: 'Test28Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						// B->Aに遷移
						jqmSimulator.changePage('#test27', false, false, true);
					},
					__dispose: function() {
						equal(order++, 2, 'B->A遷移時、2番目にBの__disposeが実行されること');
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 1, 'B->A遷移時、1番目にBのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageA, '遷移先のページが引数で返ってくること');
					}
				});

				jqmSimulator.changePage('#test27', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 3', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test29', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'A->B->Cと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションなし)',
			7, function() {
				var order = 1;
				var pageA = this.pageA;
				var pageB = null;
				var pageC = null;

				h5.ui.jqm.manager.define('test29', null, {
					__name: 'Test29Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						pageB = createPage('test30')[0];
						jqmSimulator.changePage('#test30', true, false, false);
					}
				});

				h5.ui.jqm.manager.define('test30', null, {
					__name: 'Test30Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						strictEqual(context.evArg.prevPage[0], pageA, '遷移元ページが引数で返ってくること');
						pageC = createPage('test31')[0];
						// B->Aに遷移
						jqmSimulator.changePage('#test31', true, false, true);
					},
					__dispose: function() {
						equal(order++, 2, 'B->C遷移時、2番目にBの__disposeが実行されること');
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 1, 'B->C遷移時、1番目にBのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageC, '遷移先のページが引数で返ってくること');
					}
				});

				h5.ui.jqm.manager.define('test31', null, {
					__name: 'Test31Controller',
					__ready: function() {
						equal(order++, 3, 'B->C遷移時、3番目にCの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 4, 'B->D遷移時、4番目にCのh5jqmpageshowイベントが実行されること');
						strictEqual(context.evArg.prevPage[0], pageB, '遷移元ページが引数で返ってくること');
						start();
					}
				});

				jqmSimulator.changePage('#test29', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 4', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test25', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'初期表示後A->Bと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションあり)',
			8, function() {
				var order = 1;
				var pageA = this.pageA;
				var pageB = null;

				h5.ui.jqm.manager.define('test25', null, {
					__name: 'Test25Controller',
					__ready: function() {
						equal(order++, 1, '初期表示時、1番目にAの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 2, '初期表示時、2番目にAのh5jqmpageshowイベントが実行されること');
						equal(context.evArg.prevPage.length, 0, '前ページはないので何も要素を持っていないこと');

						order = 1;
						pageB = createPage('test26')[0];
						jqmSimulator.changePage('#test26', true, true, false);
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 2, 'A -> B遷移時、1番目にAのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageB, '遷移先のページが引数で返ってくること');
					}
				});

				h5.ui.jqm.manager.define('test26', null, {
					__name: 'Test26Controller',
					__ready: function() {
						equal(order++, 1, 'A -> B遷移時、2番目にBの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 3, 'A -> B遷移時、3番目にBのh5jqmpageshowイベントが実行されること');
						strictEqual(context.evArg.prevPage[0], pageA, '遷移元ページが引数で返ってくること');
						start();
					}
				});

				// 初期表示イベントをエミュレート
				jqmSimulator.changePage('#test25', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 5', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test27', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'A->B->Aと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションあり)',
			5, function() {
				var order = 1;
				var pageB = null;
				var pageA = this.pageA;

				h5.ui.jqm.manager.define('test27', null, {
					__name: 'Test27Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						if (context.evArg.prevPage.length === 0) {
							pageB = createPage('test28')[0];
							jqmSimulator.changePage('#test28', true, true, false);
						} else {
							equal(order++, 3, 'B->A遷移時、3番目にAのh5jqmpageshowイベントがトリガされること');
							strictEqual(context.evArg.prevPage[0], pageB, '遷移元ページが引数で返ってくること');
							start();
						}
					}
				});

				h5.ui.jqm.manager.define('test28', null, {
					__name: 'Test28Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						// B->Aに遷移
						jqmSimulator.changePage('#test27', false, true, true);
					},
					__dispose: function() {
						equal(order++, 2, 'B->A遷移時、2番目にBの__disposeが実行されること');
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 1, 'B->A遷移時、1番目にBのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageA, '遷移先のページが引数で返ってくること');
					}
				});

				jqmSimulator.changePage('#test27', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 6', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			this.pageA = createPage('test29', null, true)[0];
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest(
			'A->B->Cと遷移するとき、pageshowのタイミングでh5jqmpageshowイベントが、pagehideのタイミングでh5jqmpageshowイベントが発生すること(トランジションあり)',
			7, function() {
				var order = 1;
				var pageA = this.pageA;
				var pageB = null;
				var pageC = null;

				h5.ui.jqm.manager.define('test29', null, {
					__name: 'Test29Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						pageB = createPage('test30')[0];
						jqmSimulator.changePage('#test30', true, true, false);
					}
				});

				h5.ui.jqm.manager.define('test30', null, {
					__name: 'Test30Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						strictEqual(context.evArg.prevPage[0], pageA, '遷移元ページが引数で返ってくること');
						pageC = createPage('test31')[0];
						// B->Cに遷移
						jqmSimulator.changePage('#test31', true, true, true);
					},
					__dispose: function() {
						equal(order++, 3, 'B->C遷移時、3番目にBの__disposeが実行されること');
					},
					'{rootElement} h5jqmpagehide': function(context) {
						equal(order++, 2, 'B->C遷移時、2番目にBのh5jqmpagehideイベントが実行されること');
						strictEqual(context.evArg.nextPage[0], pageC, '遷移先のページが引数で返ってくること');
					}
				});

				h5.ui.jqm.manager.define('test31', null, {
					__name: 'Test31Controller',
					__ready: function() {
						equal(order++, 1, 'B->C遷移時、1番目にCの__readyが実行されること');
					},
					'{rootElement} h5jqmpageshow': function(context) {
						equal(order++, 4, 'B->D遷移時、4番目にCのh5jqmpageshowイベントが実行されること');
						strictEqual(context.evArg.prevPage[0], pageB, '遷移元ページが引数で返ってくること');
						start();
					}
				});

				jqmSimulator.changePage('#test29', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 7', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test32', null, true);
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('Aのコントローラがreadyでない状態でA->B->Aと遷移したとき、Aでh5jqmpageshowが2回発火しないこと(トランジションなし)', 2,
			function() {
				var dfd = h5.async.deferred();
				h5.ui.jqm.manager.define('test32', null, {
					__name: 'Test32Controller',
					__ready: function() {
						createPage('test33');
						jqmSimulator.changePage('#test33', true, false, false);
						// A->B->Aの遷移が終わってからAのコントローラをreadyにする
						return dfd.promise();
					},
					'{rootElement} h5jqmpageshow': function(context) {
						ok(true, 'h5jqmpageshowが1回実行されること');
						start();
					}
				});

				h5.ui.jqm.manager.define('test33', null, {
					__name: 'Test33Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						ok(true, 'Bのh5jqmpageshowが実行されること');
						// B->Aに遷移
						jqmSimulator.changePage('#test32', false, false, true);
						dfd.resolve();
					}
				});
				jqmSimulator.changePage('#test32', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 8', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test34', null, true);
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('Aのコントローラがreadyでない状態でA->B->Aと遷移したとき、Aでh5jqmpageshowが2回発火しないこと(トランジションあり)', 2,
			function() {
				var dfd = h5.async.deferred();
				h5.ui.jqm.manager.define('test34', null, {
					__name: 'Test34Controller',
					__ready: function() {
						createPage('test35');
						jqmSimulator.changePage('#test35', true, true, false);
						// A->B->Aの遷移が終わってからAのコントローラをreadyにする
						return dfd.promise();
					},
					'{rootElement} h5jqmpageshow': function(context) {
						ok(true, 'h5jqmpageshowが1回実行されること');
						start();
					}
				});

				h5.ui.jqm.manager.define('test35', null, {
					__name: 'Test35Controller',
					'{rootElement} h5jqmpageshow': function(context) {
						ok(true, 'Bのh5jqmpageshowが実行されること');
						// B->Aに遷移
						jqmSimulator.changePage('#test34', false, true, true);
						// トランジションありだと非同期なので、AのコントローラをreadyにするタイミングがchangePageの後になるようにsetTimeoutする
						setTimeout(function() {
							dfd.resolve();
						}, 0);
					}
				});

				jqmSimulator.changePage('#test34', true, false, false);
			});

	//=============================
	// Definition
	//=============================
	module('[build#min;browser#ie:6]JQMManager - h5jqmpageshow/h5jqmpagehide 9', {
		setup: function() {
			jqmSimulator.init();
			h5.ui.jqm.manager.init();
			createPage('test36', null, true);
		},
		teardown: function() {
			resetJQMManager();
			jqmSimulator.dispose();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('A->Bと遷移したとき、BでAのh5jqmpageshowが実行されないこと', 1, function() {
		var dfd = h5.async.deferred();
		h5.ui.jqm.manager.define('test36', null, {
			__name: 'Test36Controller',
			__ready: function() {
				createPage('test37');
				jqmSimulator.changePage('#test37', true, true, false);
				return dfd.promise();
			},
			'{rootElement} h5jqmpageshow': function(context) {
				ok(false, 'h5jqmpageshowが実行されたためテスト失敗');
			}
		});

		h5.ui.jqm.manager.define('test37', null, {
			__name: 'Test37Controller',
			'{rootElement} h5jqmpageshow': function(context) {
				ok(true, 'Bのh5jqmpageshowが実行されること');
				start();
			}
		});

		$('#test36').one('h5jqmpageshow', function() {
			ok(false, 'まだreadyでないはずのコントローラのh5jqmpageshowが実行されたためテスト失敗');
		});

		jqmSimulator.changePage('#test36', true, false, false);
		dfd.resolve();
	});
});
