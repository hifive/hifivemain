/*
 * Copyright (C) 2012 NS Solutions Corporation
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

(function() {
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

	// JQMがロードされると、readyイベントの約50ms後に$.mobile.silentScroll()が実行されてtop:1pxの位置に移動してしまうため、top:0pxの位置に戻す
	$(document).bind('silentscroll', function() {
		window.scrollTo(0, 0);
	});

	// jQueryMobileの読み込み
	h5.u.loadScript("../res/js/lib/jqplugins/jqm/1.1.0/jquery.mobile-1.1.0.js", {
		async: false
	});

	//=============================
	// Variables
	//=============================

	// TODO テスト対象モジュールのコード定義をここで受けて、各ケースでは ERR.ERR_CODE_XXX と簡便に書けるようにする
	var ERR = ERRCODE.h5.core.data;

	/**
	 * min版かどうか。min版の場合、jqm.manager__resetを実行できないのでテスト不可。
	 */
	var isMin = !h5.ui.jqm.manager.__reset;

	// window.com.htmlhifiveがない場合は作成して、window.com.htmlhifive.testに空オブジェクトを入れる
	((window.com = window.com || {}).htmlhifive = window.com.htmlhifive || {}).test = {};

	var originalPrefix = '';

	//=============================
	// Functions
	//=============================

	/**
	 * JQMControllerのアンバインド
	 */
	function resetJQM() {
		$('body>div.testForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('body>div.testForJQM').remove();
		if (!isMin) {
			h5.ui.jqm.manager.__reset();
		}
		$.mobile.activePage = undefined;
		// JQMが生成するbody内をラップするdiv要素を外す
		$('body>div').children().unwrap();
		// JQMが生成するloadingのh1要素を削除
		$('h1:not(#qunit-header)').remove();

	}

	/**
	 * テスト用に作成したDOMの削除
	 */
	function pageremove(selector) {
		$('.divForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('.divForJQM').remove();
	}

	/**
	 * idからページを作る。jsが指定されていればdata-h5-script、activFlag=trueなら作成したページをactivePageにする。
	 */
	function createPage(id, _js, activeFlag) {
		js = _js ? ' data-h5-script="' + _js + '?' + new Date().getTime() + '"' : '';
		var $page = $('<div id="' + id + '" class="testForJQM" data-role="page"' + js + '></div>');
		var $header = $('<div id="top_header" class="ui-bar-f ui-header appLogoHeader"><h1>header</h1></div>');
		var $content = $('<div id="top_content" >content<button id="test"></button></div>');
		var $footer = $('<div id="top_footer" data-role="footer" style="width:100%">footer</div>');
		$page.append($header).append($content).append($footer);
		$('body').append($page);
		if (activeFlag) {
			$.mobile.activePage = $page;
			$page.addClass('ui-page ui-body-c ui-page-active');
		}
		return $page;
	}

	/**
	 * 開発版かどうかをチェックする。開発版でない場合はテストを終了させる。
	 */
	function checkDev() {
		if (isMin) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			return false;
		}
		return true;
	}


	/**
	 * 擬似的にページ遷移を行う
	 *
	 * @param {selector} to 遷移先のページ
	 * @param {boolean} [initialize] pageinitをトリガーするかどうか。(JQMによって遷移先のページがページ化されるときにpageinitがトリガーされる)
	 */
	function changePage(to, initialize) {
		var $from = $.mobile.activePage;
		$to = $(to);
		if (initialize) {
			$to.trigger('pageinit');
		}
		$.mobile.activePage = $to;
		$from && $from.trigger('pagebeforehide');
		$to.trigger('pagebeforeshow');
		$from && $from.trigger('pagehide');
		$to.trigger('pageshow');
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	$(function() {
		//=============================
		// Definition
		//=============================

		module('JQMManager - define', {
			setup: function() {
				createPage("test1", 'data/testforJQM1.js', true);
				createPage("test2", 'data/testforJQM2.js');
			},
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('init()を実行せず、define()を実行する ※min版ではエラーになります', 1, function() {
			if (!checkDev()) {
				start();
				return;
			}

			var controllerDefObj = {
				__name: 'DefineTestController',
				__ready: function() {
					ok(true, 'h5.ui.jqm.controller.define()でコントローラがバインドされ、__ready()が実行すること。');
					start();
				}
			};

			h5.ui.jqm.manager.define('test1', null, controllerDefObj);
		});

		asyncTest('init()を実行せずにdefine()を実行して、遷移を行う ※min版ではエラーになります', 9,
				function() {
					if (!checkDev()) {
						start();
						return;
					}

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

							var count = 50;
							function checkCSS() {
								if (--count === 0 || $('#test1 h1').css('font-size') === '111px') {
									deepEqual($('#test1 h1').css('font-size'), '111px',
											'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
									changePage('#test2', true);
								} else {
									setTimeout(function() {
										checkCSS();
									}, 100);
								}
							}
							checkCSS();
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

							var count = 50;
							function checkCSS() {
								if (--count === 0 || $('#test2 h1').css('margin-left') === '33px') {
									deepEqual($('#test2 h1').css('margin-left'), '33px',
											'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
									ok($('#test2 h1').css('font-size') !== '111px',
											'遷移元ページのCSSは適用されていない。');
									start();
								} else {
									setTimeout(function() {
										checkCSS();
									}, 100);
								}
							}
							checkCSS();
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

		module('JQMManager - managed test', {
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('h5.ui.jqm.manager.init() JQMControllerはコントローラマネージャの管理対象に含まれていないこと。', 1,
				function() {
					if (!checkDev()) {
						start();
						return;
					}

					h5.ui.jqm.manager.init();

					setTimeout(function() {
						equal(h5.core.controllerManager.controllers.length, 0);
						start();
					}, 0);
				});

		asyncTest('h5.ui.jqm.manager.define() JQMControllerはコントローラマネージャの管理対象に含まれていないこと。', 2,
				function() {
					if (!checkDev()) {
						start();
						return;
					}

					createPage("test1", 'data/testforJQM1.js', true);

					var controllerDefObj = {
						__name: 'DefineTestController'
					};

					h5.ui.jqm.manager.define('test1', null, controllerDefObj);

					setTimeout(function() {
						equal(h5.core.controllerManager.controllers.length, 1);
						equal(h5.core.controllerManager.controllers[0].__name,
								'DefineTestController',
								'define()でバインドしたコントローラはコントローラマネージャの管理対象に含まれていること。');
						start();
					}, 0);
				});



		asyncTest('h5.ui.jqm.manager.init() h5controllerboundイベントがトリガされないこと。', 1, function() {
			if (!checkDev()) {
				start();
				return;
			}

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
			if (!checkDev()) {
				start();
				return;
			}

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

		module("JQMManager - init1", {
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		test('※要目視確認 init() initを実行するとJQMControllerがバインドされること。  ※min版ではエラーになります', 1, function() {
			if (!checkDev()) {
				start();
				return;
			}
			h5.ui.jqm.manager.init();
			ok(true, '「コントローラJQMControllerの初期化が正常に完了しました。」のログが、コンソールに出力されること。');
		});

		asyncTest('※要目視確認 init() すでにinit()済みならログが出力されて、何もされないこと。  ※min版ではエラーになります', 1, function() {
			if (!checkDev()) {
				start();
				return;
			}
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

		module("JQMManager - init2", {
			setup: function() {
				createPage("testjs1", 'data/testforJQM1.js', true);
				createPage("testjs2", 'data/testforJQM2.js');
				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
				window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
				window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('init()時に存在するページのdata-h5-scriptに指定されているjsがロードされること  ※min版ではエラーになります', 2,
				function() {
					if (!checkDev()) {
						start();
						return;
					}
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

		module("JQMManager - init2", {
			setup: function() {
				createPage("testjs3", 'data/testforJQM1.js', true);
				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
				window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
				window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('pageinitイベントがページから呼ばれると、そのページのscriptがロードされること  ※min版ではエラーになります', 3, function() {
			if (!checkDev()) {
				start();
				return;
			}
			// initが終わって、__readyが呼ばれるのが非同期なので、テストを非同期にする
			setTimeout(
					function() {
						createPage("testjs4", 'data/testforJQM2.js');
						ok(window.com.htmlhifive.test.loadedTestForJQM1,
								'data-h5-scriptに指定したjsファイルがロードされていること');
						ok(!window.com.htmlhifive.test.loadedTestForJQM2,
								'init()時になかったページについてはjsファイルがロードされないこと');
						$('#testjs4').trigger('pageinit');
						ok(window.com.htmlhifive.test.loadedTestForJQM2,
								'pageinitイベントが発生するとjsファイルがロードされる。');
						start();
					}, 0);
		});

		//=============================
		// Definition
		//=============================

		module("JQMManager - dataPrefix1", {
			setup: function() {
				originalPrefix = h5.ui.jqm.dataPrefix;
				h5.ui.jqm.dataPrefix = 'hifive';
				createPage("test1").attr('data-hifive-script', 'data/testforJQM1.js');
				createPage("test2", '', true).attr('data-hifive-script', 'data/testforJQM2.js');

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
				h5.ui.jqm.dataPrefix = originalPrefix;
				window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
				window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest(
				'h5.ui.jqm.dataPrefixに文字列を指定した場合、data-(指定した文字列)-script属性に指定したjsファイルがロードできること  ※min版ではエラーになります',
				2, function() {
					if (!checkDev()) {
						start();
						return;
					}
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

		module("JQMManager - dataPrefix2", {
			setup: function() {
				originalPrefix = h5.ui.jqm.dataPrefix;
				h5.ui.jqm.dataPrefix = null;
				createPage("test1", 'data/testforJQM1.js');
				createPage("test2", 'data/testforJQM2.js', true);

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
				h5.ui.jqm.dataPrefix = originalPrefix;
				window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
				window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest(
				'h5.ui.jqm.dataPrefixがnullの場合は、data-h5-script属性に指定したjsファイルがロードできること  ※min版ではエラーになります',
				2, function() {
					if (!checkDev()) {
						start();
						return;
					}
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

		module("JQMManager - define1", {
			setup: function() {
				createPage("test3", null, true);
				createPage("test4");
				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
				window.com.htmlhifive.test.loadedTestForJQM1 = undefined;
				window.com.htmlhifive.test.loadedTestForJQM2 = undefined;
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること  ※min版ではエラーになります', 4,
				function() {
					if (!checkDev()) {
						start();
						return;
					}
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

		module("JQMManager - define2", {
			setup: function() {
				createPage("test4", 'data/testforJQM4.js', true);
				createPage("test5", 'data/testforJQM5.js');

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest(
				'h5.ui.jqmmanager define() data-h5-scriptに指定したjsからdefine()できること  ※min版ではエラーになります',
				1, function() {
					if (!checkDev()) {
						start();
						return;
					}

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

		module("JQMManager - define3", {
			setup: function() {
				createPage("test6", null, true);

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドし、cssがロードされること  ※min版ではエラーになります', 1,
				function() {
					if (!checkDev()) {
						start();
						return;
					}
					setTimeout(function() {
						var controller = {
							__name: 'Test6Controller',
							__ready: function() {
								var count = 50;
								function checkCSS() {
									if (--count === 0
											|| $('#test6 h1').css('font-size') === '111px') {
										deepEqual($('#test6 h1').css('font-size'), '111px',
												'CSSが適応されている。(※CSSファイルが5秒経っても取得できない場合、失敗します)');
										start();
									} else {
										setTimeout(function() {
											checkCSS();
										}, 100);
									}
								}
								checkCSS();
							}
						};
						h5.ui.jqm.manager.define('test6', 'css/test.css', controller);
					}, 0);
				});

		//=============================
		// Definition
		//=============================

		module('JQMManager - define4', {
			setup: function() {
				createPage('test7', null, true);
				createPage('test8');

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('ページ遷移したときにcssが切り替わること  ※min版ではエラーになります', 9,
				function() {
					if (!checkDev()) {
						start();
						return;
					}
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

							var count = 50;
							function checkCSS() {
								if (--count === 0 || $('#test7 h1').css('font-size') === '111px') {
									deepEqual($('#test7 h1').css('font-size'), '111px',
											'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
									changePage('#test8', true);
								} else {
									setTimeout(function() {
										checkCSS();
									}, 100);
								}
							}
							checkCSS();
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

							var count = 50;
							function checkCSS() {
								if (--count === 0 || $('#test8 h1').css('margin-left') === '33px') {
									deepEqual($('#test8 h1').css('margin-left'), '33px',
											'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
									ok($('#test8 h1').css('font-size') !== '111px',
											'遷移元ページのCSSは適用されていない。');
									start();
								} else {
									setTimeout(function() {
										checkCSS();
									}, 100);
								}
							}
							checkCSS();
						},
						'button#test click': function() {
							ok(true, 'button#test click が実行される');
						}
					};
					h5.ui.jqm.manager.define('test7', 'css/test.css', controller7);
					h5.ui.jqm.manager.define('test8', 'css/test2.css', controller8);
				});

		//=============================
		// Definition
		//=============================

		module('JQMManager - define5', {
			setup: function() {
				createPage('test9', null, true);
				createPage('test10');

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
			//resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('ページ遷移したときに遷移先のコントローラがバインドされること  ※min版ではエラーになります', 4, function() {
			if (!checkDev()) {
				start();
				return;
			}
			var controller9 = {
				__name: 'Test9Controller',

				__construct: function() {

				},

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
					changePage('#test10', true);
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

		module('JQMManager - define6', {
			setup: function() {
				createPage('test11', null, true);
				createPage('test12');

				h5.ui.jqm.manager.init();
			},
			teardown: function() {
				resetJQM();
			}
		});

		//=============================
		// Body
		//=============================

		asyncTest('ページ遷移先がコントローラの無いページの場合でも、遷移できる  ※min版ではエラーになります', 4, function() {
			if (!checkDev()) {
				start();
				return;
			}
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
					changePage('#test12', true);
				}
			};
			h5.ui.jqm.manager.define('test11', null, controller11);
		});
	});
})();