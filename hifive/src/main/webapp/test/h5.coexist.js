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

	var originalH5 = h5;
	var h5jsPath = '../archives/current/h5.js';
	var oldh5jsPath = './h5version0.0.1/h5.js';

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

	module("h5.coexist", {
		teardown: function() {
			window.h5 = originalH5;
		}
	});

	//=============================
	// Body
	//=============================

	test('h5.coexist()', function() {
		var savedH5 = h5.coexist();
		strictEqual(h5, undefined, 'h5を二重に読み込んでいない状態でh5.coexist()をするとh5がundefinedになる');
		// strictEqualでやると循環参照のあるオブジェクトを指定した場合、出力できなくてエラーになるため、===で比較
		ok(savedH5 === originalH5, 'h5.coexist()の戻り値が元のh5と同じインスタンス。');
	});

	test('バージョンが同じものを2重読み込みする。', function() {
		h5.u.loadScript(h5jsPath, {
			force: true,
			async: false
		});

		var savedH5 = h5.coexist();
		strictEqual(h5, undefined, 'バージョンが同じものをh5.coexist()をするとh5がundefinedになる');
		ok(savedH5 === originalH5, 'h5.coexist()の戻り値が元のh5と同じ。');

	});

	test('window.h5にhifiveと無関係なオブジェクトがすでに存在するときに、h5.jsを読み込む。', function() {
		h5 = {};
		originalH5.u.loadScript(h5jsPath, {
			force: true,
			async: false
		});
		var savedH5 = h5.coexist();
		deepEqual(h5, {}, 'coexistすると、window.h5はもともと入っていたオブジェクトになる');
		strictEqual(savedH5.env.version, originalH5.env.version, 'h5.coexist()の戻り値が元のh5と同じ。');
	});

	module('バージョンが違うh5を2重読み込み', {
		setup: function() {
			// vesion0.0.1のjsファイルをインクルードする
			h5.u.loadScript(oldh5jsPath, {
				force: true,
				async: false
			});
			// コントローラを全部アンバインド
			for ( var l = h5.core.controllerManager.controllers.length; l-- > 0;) {
				var controller = h5.core.controllerManager.controllers[l];
				controller.unbind();
			}
		},
		teardown: function() {
			h5 = originalH5;
		}
	});

	test('h5.coexist()で読み込む前のh5が取得できること。', 3, function() {
		strictEqual(h5.env.version, '0.0.1', 'h5がバージョン0.0.1のものに上書きされていること。');

		var loadedH5 = h5;
		var retH5 = h5.coexist();
		ok(h5 === originalH5, 'h5.coexist()を実行するとwindow.h5が上書き前のh5になること。');
		ok(retH5 === loadedH5, 'h5.coexist()の戻り値がversion0.0.1のH5であること。');
	});

	asyncTest('上書きしたh5と上書きされる前のh5(originalH5)で管理するコントローラが異なること。', 5, function() {
		var name = 'testForCoexistController';
		var testController = {
			__name: name
		};
		function inControllers(controller, controllers) {
			for ( var l = controllers.length; l-- > 0;) {
				if (controllers[l] === controller) {
					return true;
				}
			}
			return false;
		}
		var controller = h5.core.controller('body', testController);
		controller.readyPromise
				.done(function() {
					ok(inControllers(controller, h5.core.controllerManager.controllers),
							'h5にコントローラをバインド。');
					ok(!inControllers(controller, originalH5.core.controllerManager.controllers),
							'originalH5にはまだコントローラはバインドされていない。');

					var originalController = originalH5.core.controller('body', testController);
					originalController.readyPromise.done(function() {
						ok(inControllers(originalController,
								originalH5.core.controllerManager.controllers),
								'originalH5にコントローラをバインド。');
						controller.unbind();

						ok(!inControllers(controller, h5.core.controllerManager.controllers),
								'h5のコントローラをアンバインド。');
						ok(inControllers(originalController,
								originalH5.core.controllerManager.controllers),
								'originalH5からはアンバインドされていない。');
						start();
					});
				});
	});
});