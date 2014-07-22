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
	// testutils
	var deleteProperty = testutils.u.deleteProperty;

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('名前空間の依存解決', {
		teardown: function() {
			deleteProperty(window, 'h5resdata');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('名前空間からjsファイルを取得', 2, function() {
		h5.res.require('h5resdata.controller.SampleController').resolve().done(
				function(result) {
					strictEqual(h5resdata.controller.SampleController.__name,
							'h5resdata.controller.SampleController', '指定した名前空間のコントローラが取得できること');
					strictEqual(h5resdata.controller.SampleController, result,
							'doneハンドラの引数にコントローラが渡されること');
					start();
				});
	});

	asyncTest('type:namespaceを指定', 2, function() {
		h5.res.require('h5resdata.controller.SampleController', {
			type: 'namespace'
		}).resolve().done(
				function(result) {
					strictEqual(h5resdata.controller.SampleController.__name,
							'h5resdata.controller.SampleController', '指定した名前空間のコントローラが取得できること');
					strictEqual(h5resdata.controller.SampleController, result,
							'doneハンドラの引数にコントローラが渡されること');
					start();
				});
	});
});