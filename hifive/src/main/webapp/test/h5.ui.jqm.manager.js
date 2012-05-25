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
	function pageremove() {
		$('#top_main_pageForJQMTest').trigger('pageremove');
		$('#top_main_pageForJQMTest').remove();
	}

	module(
			"jqmManager",
			{
				setup: function() {
					var page = $('<div id="top_main_pageForJQMTest" data-role="page" data-h5-script="data/testforJQM.js"></div>');
					var header = $('<div id="top_header" class="ui-bar-f ui-header appLogoHeader"><h1>header</h1></div>');
					var content = $('<div id="top_content" >content<button id="test"></button></div>');
					var footer = $('<div id="top_footer" data-role="footer" style="width:100%">footer</div>');
					page.append(header).append(content).append(footer);
					$fixture.append(page);
					$.mobile.activePage = page;
				},
				teardown: function() {
					delete window.loadedTestForJQM;
					$('link').filter(function() {
						if ($(this).attr('href') === 'css/test.css') {
							$(this).remove();
						}
						return;
					});
				}
			});

	asyncTest('h5.ui.jqmmanager define() コントローラがdefineでバインドできること。', 6, function() {
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
				same($('#top_main_pageForJQMTest h1').css('font-size'), '111px', 'CSSが適応されている');
				pageremove();
				start();
			},

			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', 'css/test.css', controller);
	});

	asyncTest('h5.ui.jqmmanager define() data属性につけるprefixの値を変えられること。', 5, function() {
		h5.ui.jqm.dataPrefix = 'hifive';
		var src = $('#top_main_pageForJQMTest').attr('data-h5-script');
		$('#top_main_pageForJQMTest').removeAttr('data-h5-script');
		$('#top_main_pageForJQMTest').attr('data-hifive-script', src);
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

				ok(window.loadedTestForJQM, 'jsファイルがロードされていること_');
				$('#top_main_pageForJQMTest button#test').trigger('click');
				h5.ui.jqm.dataPrefix = 'h5';
				pageremove();
				start();
			},

			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		h5.ui.jqm.manager.define('top_main_pageForJQMTest', 'css/test.css', controller);
	});

//	test('h5.ui.jqmmanager init() すでにinit()済みならログが出力(※要目視)されて、何もされないこと。', 1, function() {
//		try {
//			h5.ui.jqm.manager.init();
//			h5.ui.jqm.manager.init();
//			ok(true, '「JQMマネージャは既に初期化されています。」とログが出力されること。他のテストでinit()/define()済みであれば2回出力されます。');
//		} catch (e) {
//			ok(false, 'エラーが発生しました。');
//		}
//	});
});