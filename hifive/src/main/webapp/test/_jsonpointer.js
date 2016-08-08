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

	//=============================
	// Variables
	//=============================

	//=============================
	// Functions
	//=============================
	// testutils
	var clearController = h5devtestutils.controller.clearController;

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module("getJSONPointerValue", {
		setup: function() {
			this.targetObj = window.JSON.stringify({
				"hoge": "this is '/hoge'",
				"": "this is '/'",
				"foo/bar": "this is '/foo~1bar'",
				"foo~bar": "this is '/foo~0bar'",
				"fuga": ["this is /fuga/0", "this is /fuga/1"],
				"foo": {
					"bar": "this is '/foo/bar'",
					"fuga": {
						"hoge": "this is /foo/fuga/hoge"
					}
				},
				"a": true,
				"b": null,
				"c": undefined
			});
		},
		teardown: function() {
			clearController();
		}
	});

	//=============================
	// Body
	//=============================
	test('JSON Pointerの値が正しく取得できること', function() {
		var testPointer = ['hoge', '/hoge', '/hoge/fuga', '/', '/foo~1bar', '/foo~0bar', '/fuga/0',
				'/fuga/1', 'fuga/3', '/foo/bar', '/foo/hoge', '/foo/fuga/hoge', '/a', "/b", "/c"];
		var resultPointer = [undefined, "this is '/hoge'", undefined, "this is '/'",
				"this is '/foo~1bar'", "this is '/foo~0bar'", "this is /fuga/0", "this is /fuga/1",
				undefined, "this is '/foo/bar'", undefined, "this is /foo/fuga/hoge", true, null,
				undefined];


		for (var i = 0, len = testPointer.length; i < len; i++) {
			var result = getJSONPointerValue(this.targetObj, testPointer[i]);
			strictEqual(result, resultPointer[i], 'JSON Pointerの値が正しく取得できること');
		}
	});
});