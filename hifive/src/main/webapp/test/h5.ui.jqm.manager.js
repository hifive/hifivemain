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

$(function() {
	var $fixture = $('#qunit-fixture');

	// body直下のjqmが勝手に付加するdivの属性を変更する。
	$('body>:jqmData(role="page")').removeAttr('data-role');

	function pageremove(selector) {
		$('.divForJQM').each(function() {
			$(this).trigger('pageremove');
		});
		$('.divForJQM').remove();
	}
	$('.ui-loader').toggle();
	$.mobile.activePage = $('body');

	function createPage(_id, _js) {
		id = _id || 'top_main_pageForJQMTest';
		js = _js || 'data/testforJQM.js?' + new Date().getTime();
		var page = $('<div id="' + id
				+ '" class="divForJQM" data-role="page" data-h5-script="'+ js + '"></div>');
		var header = $('<div id="top_header" class="ui-bar-f ui-header appLogoHeader"><h1>header</h1></div>');
		var content = $('<div id="top_content" >content<button id="test"></button></div>');
		var footer = $('<div id="top_footer" data-role="footer" style="width:100%">footer</div>');
		page.append(header).append(content).append(footer);
		$.mobile.activePage = page;
		$fixture.append(page);
		return page;
	}

	h5.ui.jqm.manager.init();

	module("js");
	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること。jsがロードされること。', 5, function() {
		createPage();
		$('#top_main_pageForJQMTest').trigger('pageinit');
		var controller = {
			__name: 'TopController',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				ok(window.loadedTestForJQM, 'jsファイルがロードされていること');
				$('#top_main_pageForJQMTest button#test').trigger('click');
				pageremove();
				start();
			},

			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', null, controller);
	});

	asyncTest('h5.ui.jqmmanager define() loadScriptで読み込んだjsからdefine()できること。', 2, function() {
		createPage('test3', 'data/testforJQM3.js');
		createPage('test4', 'data/testforJQM4.js');
		$(':jqmData(role="page"), :jqmData(role="dialog")').trigger('pageinit');
		setTimeout(function(){
			$('#qunit-fixture').trigger('click');
			ok(window.testforJQM3Clicked, 'define()でコントローラがバインドされた');
			ok(window.testforJQM4Clicked, 'define()でコントローラがバインドされた');
			delete window.testforJQM3Clicked;
			delete window.testforJQM4Clicked;
			start();
		},300);
	});

	asyncTest(
			'h5.ui.jqmmanager define() コントローラがdefineでバインドできること。h5.ui.jqm.dataPrefixがnullの時にデフォルトのprefixが"h5"であること。',
			5, function() {
				h5.ui.jqm.dataPrefix = null;
				var id = 'top_main_pageForJQMTest3'
				var $page = createPage(id);
				$page.trigger('pageinit');
				var controller = {
					__name: 'TopController',

					__construct: function() {
						ok(true, '__constructが実行される');
					},
					__init: function() {
						ok(true, '__initが実行される');
					},
					__ready: function() {
						ok(true, '__readyが実行される');

						ok(window.loadedTestForJQM, 'jsファイルがロードされていること');
						$('#' + id + ' button#test').trigger('click');
						pageremove('#' + id);
						h5.ui.jqm.dataPrefix = 'h5';
						start();
					},

					'button#test click': function() {
						ok(true, 'button#test click が実行される');
					}
				};
				h5.ui.jqm.manager.define(id, null, controller);
			});

	module("init");
	test('h5.ui.jqmmanager init() すでにinit()済みならログが出力(※要目視)されて、何もされないこと。', 1, function() {
		ok(true, '「JQMマネージャは既に初期化されています。」とログが出力されること');
		try {
			h5.ui.jqm.manager.init();
		} catch (e) {
		}
	});

	module("define", {
		setup: function() {
			createPage();
		},
		teardown: function() {
			pageremove();
			delete window.loadedTestForJQM;
			$('link').filter(function() {
				if ($(this).attr('href') === 'css/test.css') {
					$(this).remove();
				}
				return;
			});
		}
	});

	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること。cssがロードされること。', 6, function() {
		var controller = {
			__name: 'Top1Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				ok(window.loadedTestForJQM, 'jsファイルがロードされていること');
				$('#top_main_pageForJQMTest button#test').trigger('click');

				var count = 5;
				function checkCSS() {
					if (--count === 0
							|| $('#top_main_pageForJQMTest h1').css('font-size') === '111px') {
						same($('#top_main_pageForJQMTest h1').css('font-size'), '111px',
								'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');
						start();
					} else {
						setTimeout(function() {
							checkCSS();
						}, 1000);
					}
				}
				checkCSS();
			},
			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', 'css/test.css', controller);
	});

	asyncTest('h5.ui.jqmmanager define() pagehideでcssがアンロードされること。', 6, function() {
		var controller = {
			__name: 'Top1Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				$('#top_main_pageForJQMTest button#test').trigger('click');
				var count = 5;
				var that = this;
				function checkCSS() {
					if (--count === 0
							|| $('#top_main_pageForJQMTest h1').css('font-size') === '111px') {
						same($('#top_main_pageForJQMTest h1').css('font-size'), '111px',
								'CSSが適応されている。(※CSSファイルが5秒経ってもダウンロードされない場合、失敗します)');

						// ページ遷移
						$.mobile.activePage = $('<div id="a">');
						$(that.rootElement).trigger('pagehide');
						ok($('#top_main_pageForJQMTest h1').css('font-size') !== '111px',
								'CSSが元に戻っている。');
						start();
					} else {
						setTimeout(function() {
							checkCSS();
						}, 1000);
					}
				}
				checkCSS();
			},

			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', 'css/test.css', controller);
	});


	asyncTest('h5.ui.jqmmanager define() cssをロードしていないときはpagehideを呼んでも何もされないこと。', 4, function() {
		var originalLinkLength = $('link').length;
		var controller = {
			__name: 'Top1Controller',

			__construct: function() {
				ok(true, '__constructが実行される');
			},
			__init: function() {
				ok(true, '__initが実行される');
			},
			__ready: function() {
				ok(true, '__readyが実行される');

				// ページ遷移
				$.mobile.activePage = $('<div id="a">');
				$(this.rootElement).trigger('pagehide');

				same($('link').length, originalLinkLength, 'linkタグは増えたり減ったりしていない。');
				start();
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', null, controller);
	});

	module("changePage", {
		setup: function() {
			createPage();
		},
		teardown: function() {
			pageremove();
			delete window.loadedTestForJQM;
			$('link').filter(function() {
				if ($(this).attr('href') === 'css/test.css') {
					$(this).remove();
				}
				return;
			});
		}
	});

	asyncTest('h5.ui.jqmmanager 画面遷移(changePage)。', 6, function() {
		var stab = function(role) {
			if (role === 'page') {
				this._trigger = this.trigger;
				return this;
			}
		};
		var $page2;
		var $page1 = createPage('topPage1');
		$page1.data = stab;
		var controller2 = {
			__name: 'Sub1Controller',

			__construct: function() {
				ok(true, '2番目のページの__constructが実行される');
			},
			__init: function() {
				ok(true, '2番目のページの__initが実行される');
			},
			__ready: function() {
				ok(true, '2番目のページの__readyが実行される');
				$.mobile.changePage($page1);
				start();
			}
		};
		var controller1 = {
			__name: 'Top1Controller',

			__construct: function() {
				ok(true, '1番目のページの__constructが実行される');
			},
			__init: function() {
				ok(true, '1番目のページの__initが実行される');
			},
			__ready: function() {
				ok(true, '1番目のページの__readyが実行される');
				$page2 = createPage('subPage1');
				$page2.data = stab;
				h5.ui.jqm.manager.define($page2[0].id, 'css/test.css', controller2);
			}
		};
		h5.ui.jqm.manager.define($page1[0].id, 'css/test.css', controller1);
	});
});