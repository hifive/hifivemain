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
					$('#top_main_pageForJQMTest').remove();
				}
			});

	asyncTest('h5.ui.jqmmanager define()', 6, function() {
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
				setTimeout(function() {
					same($('#top_main_pageForJQMTest h1').css('font-size'),'111px', 'CSSが適応されている');
				}, 0);
				start();
			},

			'button#test click': function() {
				ok(true, 'button#test click が実行される');
			}
		};
		var testController = h5.ui.jqm.manager.define('top_main_pageForJQMTest', 'css/test.css',
				controller);
		console.log(testController);
	});
});