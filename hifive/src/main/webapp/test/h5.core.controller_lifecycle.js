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

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('ライフサイクルの実行順序', {
		setup: function() {
			$('#qunit-fixture').append('<div id="controllerTest" style="display: none;"></div>');
		},
		teardown: function() {
			disposeQUnitFixtureController();
			$('#controllerTest').remove();
		}
	});

	//=============================
	// Body
	//=============================

	asyncTest('ライフサイクルイベントの実行順序', function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		var a = {
			__name: 'A',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'B',
				__construct: construct,
				__init: init,
				__postInit: postInit,
				__ready: ready,
				cController: {
					__name: 'C',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			deepEqual(result, ['A__construct', 'B__construct', 'C__construct', 'A__init',
					'B__init', 'C__init', 'C__postInit', 'B__postInit', 'A__postInit', 'C__ready',
					'B__ready', 'A__ready'], '実行順序が正しいこと');
			start();
		});
	});

	asyncTest('ライフサイクルイベントの実行順序(非同期)', function() {
		var result = [];
		function construct() {
			result.push(this.__name + '__construct');
		}
		function init() {
			result.push(this.__name + '__init');
		}
		function postInit() {
			result.push(this.__name + '__postInit');
		}
		function ready() {
			result.push(this.__name + '__ready');
		}
		function asyncConstruct() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__construct');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncInit() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__init');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncPostInit() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__postInit');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		function asyncReady() {
			var dfd = h5.async.deferred();
			setTimeout(this.own(function() {
				result.push(this.__name + '__ready');
				dfd.resolve();
			}), 0);
			return dfd.promise();
		}
		var a = {
			__name: 'A',
			__construct: construct,
			__init: init,
			__postInit: postInit,
			__ready: ready,
			bController: {
				__name: 'B',
				__construct: asyncConstruct,
				__init: asyncInit,
				__postInit: asyncPostInit,
				__ready: asyncReady,
				cController: {
					__name: 'C',
					__construct: construct,
					__init: init,
					__postInit: postInit,
					__ready: ready
				}
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			deepEqual(result, ['A__construct', 'C__construct', 'B__construct', 'A__init',
					'B__init', 'C__init', 'C__postInit', 'B__postInit', 'A__postInit', 'C__ready',
					'B__ready', 'A__ready'], 'Bコントローラの各ライフサイクルが非同期の場合の実行順序が正しいこと');
			start();
		});
	});

	asyncTest('子コントローラのルートエレメントを親のテンプレートから追加したエレメントにする', function() {
		var a = {
			__name: 'A',
			__templates: 'template/test2.ejs',
			bController: {
				__name: 'B',
				__init: function() {
					ok($(this.rootElement).attr('name'), 'table');
				}
			},
			__meta: {
				bController: {}
			},
			__init: function() {
				this.view.append(this.rootElement, 'template2');
				this.__meta.bController.rootElement = '[name="table"]';
			}
		};
		h5.core.controller('#controllerTest', a).readyPromise.done(function() {
			start();
		});
	});

});
