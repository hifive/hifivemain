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
		setup: function() {
			this.isFirst = false;
			stop();
			var that = this;
			h5.res.require('h5resdata.controller.SampleController').resolve().done(
					function(result) {
						// 最初にロードした時の結果(=SampleController)を覚えておく
						that.sampleController = result;
						start();
					});
		},
		teardown: function() {
			deleteProperty(window, 'h5resdata');
			// scriptタグの除去
			$('script[src*="h5resdata\"]').remove();
		},
		sampleController: null
	});

	//=============================
	// Body
	//=============================
	test('名前空間の解決', 4, function() {
		strictEqual(h5resdata.controller.SampleController.__name,
				'h5resdata.controller.SampleController', '指定した名前空間のコントローラが取得できること');
		strictEqual(h5resdata.controller.SampleController, this.sampleController,
				'doneハンドラの引数にコントローラが渡されること');

		h5.res.require('h5resdata.controller.SampleController', {
			type: 'namespace'
		}).resolve().done(
				function(result) {
					strictEqual(h5resdata.controller.SampleController, result,
							'type:namespaceを指定した時、doneハンドラの引数にコントローラが渡されること');
				});

		h5resdata.controller.SampleController = 'hoge';

		h5.res.require('h5resdata.controller.SampleController').resolve().done(
				function() {
					strictEqual(h5resdata.controller.SampleController, 'hoge',
							'指定した名前空間に既に値が存在するとき、doneハンドラの引数に元々入っている値が渡されること');
				});
	});
});