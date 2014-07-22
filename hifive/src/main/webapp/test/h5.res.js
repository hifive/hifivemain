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
	module('デフォルトリゾルバを使った依存解決', {
		teardown: function() {
			deleteProperty(window, 'h5resdata');
		}
	});

	//=============================
	// Body
	//=============================
	asyncTest('namespaceで名前空間からjsファイルを取得', function() {
		h5.res.require('h5resdata.controller.SampleController').resolve().done(function() {
			ok(h5resdata.controller.SampleController, '指定した名前空間のコントローラが取得できること');
			start();
		});
	});
});