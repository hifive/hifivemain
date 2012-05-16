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
	var $elm1 = $eml2 = elm1 = elm2 = null;
	var isInView = h5.ui.isInView;
	module(
			"isInView",
			{
				setup: function() {
					$('#qunit-fixture')
					.append(
					'<div id="isInViewTest1" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; width:20px; height:20px"></div>')
					.append(
					'<div id="isInViewTest2" style="position:absolute; top:50px; left:50px; margin:5px; padding:5px; width:20px; height:20px"></div>');
					$elm1 = $('#isInViewTest1');
					$elm2 = $('#isInViewTest2');
					elm1 = $elm1[0];
					elm2 = $elm2[0];

				},
				teardown: function() {
					$('#isInViewTest1').remove();
					$('#isInViewTest2').remove();
				}
			});

	test('h5.ui.isInView - 親子関係でない要素については、isInView()の結果がundefinedであること。', 5, function() {
		same(isInView(elm1, elm2), undefined, 'isInView(elm1, elm2)');
		same(isInView(elm1, elm1), undefined, 'isInView(elm1, elm1)');
		var body = $('body')[0];
		same(isInView(body,elm1), undefined, 'isInView(body, elm1)');
		ok(isInView(elm1, $('#qunit-fixture')) !== undefined, 'isInView(elm1, $(\'#qunit-fixture\')) 親子関係なのでtrueまたはfalseであること。');
		same(isInView($('#qunit-fixture'), elm1), undefined, 'isInView($(\'#qunit-fixture\'), elm1) 親子関係が逆なのでundefined');
	});
});
