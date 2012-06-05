/*
 * Copyright (C) 2012 NS Solutions Corporation, All Rights Reserved.
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

// jQueryMobileの読み込み
h5.u.loadScript("../res/js/lib/jqplugins/jqm/1.1.0/jquery.mobile-1.1.0.js");

$(function() {

	// JQMが生成するbody内をラップするdiv要素を外す
	$('body>div').children().unwrap();

	function resetJQM() {
		h5.ui.jqm.manager.__initFlag && h5.ui.jqm.manager.__initFlag(false);
		$('body>div.testForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('body>div.testForJQM').remove();
		h5.core.controllerManager.controllers[0]
				&& h5.core.controllerManager.controllers[0].dispose();
		$.mobile.activePage = undefined;
		$('body>h1:last').css('display', 'none');
	}

	function pageremove(selector) {
		$('.divForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('.divForJQM').remove();
	}

	$.mobile.activePage = $('body');

	// idからページを作る。jsが指定されていればdata-h5-script、activFlag=trueなら作成したページをactivePageにする。
	function createPage(id, _js, activeFlag) {
		js = _js ? ' data-h5-script="' + _js + '?' + new Date().getTime() + '"' : '';
		var page = $('<div id="' + id + '" class="testForJQM" data-role="page"' + js + '></div>');
		var header = $('<div id="top_header" class="ui-bar-f ui-header appLogoHeader"><h1>header</h1></div>');
		var content = $('<div id="top_content" >content<button id="test"></button></div>');
		var footer = $('<div id="top_footer" data-role="footer" style="width:100%">footer</div>');
		page.append(header).append(content).append(footer);
		$('body').append(page);
		if (activeFlag) {
			$.mobile.activePage = page;
			page.addClass('ui-page ui-body-c ui-page-active');
		}
		return page;
	}

	// h5.ui.jqm.manager.__initFlagが存在するかどうかをチェックする。存在しない場合はテストを終了させる。
	// 引数にtrueを指定した場合はstart()を呼ばない。
	function checkDev(sync) {
		if (!h5.ui.jqm.manager.__initFlag) {
			expect(1);
			ok(false, 'このテストは開発版(h5.dev.js)で実行してください。');
			if (!sync) {
				start();
			}
			return;
		}
	}

	// 擬似的にページ遷移を行う
	function changePage(to, initialize) {
		from = $.mobile.activePage;
		to = $(to);
		if (initialize) {
			to.trigger('pageinit');
		}
		$.mobile.activePage = to;
		from && from.trigger('pagebeforehide');
		to.trigger('pagebeforeshow');
		from && from.trigger('pagehide');
		to.trigger('pageshow');
	}

	var originalPrefix = '';

	module("dataPrefix1", {
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
			delete window.loadedTestForJQM1;
			delete window.loadedTestForJQM2;
		}
	});
	asyncTest('h5.ui.jqm.dataPrefixがnullの時にデフォルトのprefixが"h5"であること。', 5, function() {
		checkDev();
		// initが終わって、__readyが呼ばれるのが非同期なので、テストを非同期にする
		setTimeout(function() {
			ok(window.loadedTestForJQM1, 'data-h5-scriptに指定したjsファイルがロードされていること');
			ok(window.loadedTestForJQM2, 'data-h5-scriptに指定したjsファイルがロードされていること');
			var controller = {
				__name: 'Test1Controller',

				__construct: function() {
					ok(true, '__constructが実行される');
				},
				__init: function() {
					ok(true, '__initが実行される');
				},
				__ready: function() {
					ok(true, '__readyが実行される');

					$('#test4 button#test').trigger('click');
					start();
				},

				'button#test click': function() {
					ok(true, 'button#test click が実行される');
				}
			};
			h5.ui.jqm.manager.define('test2', null, controller);
		}, 0);
	});

	module("init", {
		setup: function() {
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
		}
	});
	asyncTest('h5.ui.jqmmanager init() すでにinit()済みならログが出力(※要目視)されて、何もされないこと。', 1, function() {
		checkDev();
		ok(true, '「JQMマネージャは既に初期化されています。」とログが出力されること');
		setTimeout(function() {
			try {
				h5.ui.jqm.manager.init();
			} catch (e) {
				ok(false, 'テスト失敗。エラーが発生しました。');
			}
			start();
		}, 0);
	});

	module("init2", {
		setup: function() {},
		teardown: function() {
			resetJQM();
		}
	});
	asyncTest('h5.ui.jqm.manager.__initFlag() でinit()済みかどうかを取得/設定できること', 2, function() {
		checkDev();
		same(h5.ui.jqm.manager.__initFlag(), false, 'init()前なので、falseを取得できること。');
		h5.ui.jqm.manager.init();
		same(h5.ui.jqm.manager.__initFlag(), true, 'init()済みなので、trueを取得できること。');
		setTimeout(function() {
			// init()内部の処理が終わるまで次のテストが実行されないよう、非同期にして待機。
			start();
		}, 0);
	});
	test('h5.ui.jqm.manager.__initFlag()にtrue,false以外を指定するとログが表示されること(※要目視確認)', 3, function() {
		checkDev();
		h5.ui.jqm.manager.__initFlag(0);
		ok(true, '『h5.ui.jqm.manager.__initFlag() 引数にはtrueかfalseを指定してください。』とログがコンソールに表示されていること。');
		h5.ui.jqm.manager.__initFlag(new Boolean(true));
		ok(true, '『h5.ui.jqm.manager.__initFlag() 引数にはtrueかfalseを指定してください。』とログがコンソールに表示されていること。');
		h5.ui.jqm.manager.__initFlag(new Boolean(false));
		ok(true, '『h5.ui.jqm.manager.__initFlag() 引数にはtrueかfalseを指定してください。』とログがコンソールに表示されていること。');
	});

	module("define1", {
		setup: function() {
			createPage("test3", 'data/testforJQM1.js', true);
			createPage("test4", 'data/testforJQM2.js');
			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
			delete window.loadedTestForJQM1;
			delete window.loadedTestForJQM2;
		}
	});
	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること。jsがロードされること。', 6, function() {
		checkDev();

		// initが終わって、__readyが呼ばれるのが非同期なので、テストを非同期にする
		setTimeout(function() {
			ok(window.loadedTestForJQM1, 'data-h5-scriptに指定したjsファイルがロードされていること');
			ok(window.loadedTestForJQM2, 'data-h5-scriptに指定したjsファイルがロードされていること');
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

	module("define2", {
		setup: function() {
			createPage("test4", 'data/testforJQM4.js', true);
			createPage("test5", 'data/testforJQM5.js');

			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
			delete window.testforJQM3Clicked;
			delete window.testforJQM4Clicked;
		}
	});
	asyncTest('h5.ui.jqmmanager define() loadScriptで読み込んだjsからdefine()できること。', 2, function() {
		checkDev();
		setTimeout(function() {
			$('#qunit-fixture').trigger('click');
			ok(window.testforJQM4Clicked, 'define()でactivePageにコントローラがバインドされた');
			ok(!window.testforJQM5Clicked, 'define()しても、activePageでない要素にはコントローラはバインドされない');
			start();
		}, 100);
	});

	module("define3", {
		setup: function() {
			createPage("test6", null, true);

			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
		}
	});
	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドし、cssがロードされること。', 1, function() {
		checkDev();
		setTimeout(function() {
			var controller = {
				__name: 'Test6Controller',
				__ready: function() {
					var count = 50;
					function checkCSS() {
						if (--count === 0 || $('#test6 h1').css('font-size') === '111px') {
							same($('#test6 h1').css('font-size'), '111px',
									'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
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

	module('define4', {
		setup: function() {
			createPage('test7', null, true);
			createPage('test8');

			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
		}
	});

	asyncTest('ページ遷移したときにcssが切り替わること。', 9, function() {
		checkDev();
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
						same($('#test7 h1').css('font-size'), '111px',
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
					if (--count === 0 || $('#test8 h1').css('font-weight') === 'bold') {
						same($('#test8 h1').css('font-weight'), 'bold',
								'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
						ok($('#test8 h1').css('font-size') !== '111px', '遷移元ページのCSSは適用されていない。');
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

	module('define5', {
		setup: function() {
			createPage('test9', null, true);
			createPage('test10');

			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
		}
	});

	asyncTest('ページ遷移したときに遷移先のコントローラがバインドされること。', 4, function() {
		checkDev();
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

	module('define6', {
		setup: function() {
			createPage('test11', null, true);
			createPage('test12');

			h5.ui.jqm.manager.init();
		},
		teardown: function() {
			resetJQM();
		}
	});

	asyncTest('ページ遷移先がコントローラの無いページの場合でも、遷移できる。', 4, function() {
		checkDev();
		var controller11 = {
			__name: 'Test11Controller',

			__ready: function() {
				ok(true, 'Test11Controller.__readyが実行される');
				$('#test11 button').trigger('click');
			},
			'button#test click': function(context) {
				ok(true, '#test11内のbutton#test click が実行される');
				createPage('test12');
				$('#test11').bind('pagehide', function(){
					ok(true, 'test11のpagehideが呼ばれた。');
				});
				$('#test12').bind('pageshow', function(){
					ok(true, 'test12のpageshowが呼ばれた。');
					start();
				});
				changePage('#test12', true);
			}
		};
		h5.ui.jqm.manager.define('test11', null, controller11);
	});
});