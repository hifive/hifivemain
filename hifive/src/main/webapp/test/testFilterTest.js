/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
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

	// checkTestFilterTag関数の取り出し
	// checkTestFilterTagがtestStartの何番目に入っているか。環境が変わったらここを変更する。
	var testStartIndex = 0;
	var checkTestFilterTag = QUnit.config.testStart[testStartIndex];

	// testFilter関数の削除
	QUnit.config.testStart.splice(testStartIndex, 1);


	// checkModuleFilterTag関数の取り出し
	// checkTestFilterTagがmoduleStartの何番目に入っているか。環境が変わったらここを変更する。
	var moduleStartIndex = 0;
	var checkModuleFilterTag = QUnit.config.moduleStart[moduleStartIndex];
	// testFilter関数の削除
	QUnit.config.moduleStart.splice(moduleStartIndex, 1);


	// もともと設定してあるfilterのパラメータを削除(H5_TEST_ENV.filterが指す参照先は変えないようにする)
	if (H5_TEST_ENV && H5_TEST_ENV.filter) {
		for ( var p in H5_TEST_ENV.filter) {
			delete (H5_TEST_ENV.filter[p]);
		}
	}

	//=============================
	// Functions
	//=============================
	/**
	 * currentからテストがスキップされたものかどうか判定
	 */
	function isSkipped(current) {
		return !!(current.name && current.name.indexOf('[テストをスキップしました]') != -1);
	}

	/**
	 * 指定されたテスト名でテストがスキップされるかどうかチェックする
	 */
	function checkTestSkips(filterDescs, result, each, moduleName) {
		var stats = {
			module: moduleName || ''
		};
		for ( var i = 0, l = filterDescs.length; i < l; i++) {
			var filterDesc = each ? each(filterDescs[i]) : filterDescs[i];
			stats.name = filterDesc;
			var current = QUnit.config.current = {
				testEnvironment: {}
			};
			checkTestFilterTag(stats);
			QUnit.config.current = this.originalCurrent;
			ok(isSkipped(current) === result, filterDesc);
		}
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	// TODO moduleに書いたテストフィルタが優先されることを確認するテスト

	// TODO ブラウザ(docmodeあり、なし、Edge)、jQueryのバージョン、build のテスト

	//=============================
	// Definition
	//=============================
	module('browser#ie8:docmode=Edge', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				browserprefix: 'ie',
				browserversion: '8',
				docmode: 'Edge'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('スキップされるもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['ie:8', 'ie', 'ie:7-', 'ie:8-', 'ie:-8', 'ie:-8.1', 'ie:-9', 'ie:8-9',
				'ie:7-9', 'ie:6,8', 'ie:8|ff:10', 'ie:all', 'ie:8:docmode=Edge'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[browser#' + name + ']';
		});
	});

	test('スキップされないもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['ie:7', 'ie:88', 'ie:9-', 'ie:-7', 'ie:8.1-', 'ie-wp:all', 'ie:7,9',
				'ff:8'];
		checkTestSkips.call(this, filterDescs, false, function(name) {
			return '[browser#' + name + ']';
		});
	});

	//=============================
	// Definition
	//=============================
	module('browser#ie8:docmode=7', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				browserprefix: 'ie',
				browserversion: '8',
				docmode: '7'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('スキップされるもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['ie:8:docmode=7', 'ie:7-9:docmode=7', 'ie:8:docmode=7-',
				'ie:8:docmode=-9'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[browser#' + name + ']';
		});
	});

	test('スキップされないもの',
			function() {
				this.originalCurrent = QUnit.config.current;
				var filterDescs = ['ie:8:docmode=6', 'ie:9:docmode=7', 'ie:8:docmode=8-',
						'ie:8:docmode=-6'];
				checkTestSkips.call(this, filterDescs, false, function(name) {
					return '[browser#' + name + ']';
				});
			});

	//=============================
	// Definition
	//=============================
	module('browser#and-and:2.3', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				browserprefix: 'and-and',
				browserversion: '2.3'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('スキップされるもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['2.3', '2', '-2', '-3', '-2.4', '-2.3', '-2.10', '-2.3.0', '2.3-',
				'2.1-', '2-', '1-', '2.1.10-', '2.1.1-2.3.3'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[browser#and-and:' + name + ']';
		});
	});

	test('スキップされないもの',
			function() {
				this.originalCurrent = QUnit.config.current;
				var filterDescs = ['2.2', '2.3.4', '-2.2', '-2.2.3', '2.4-', '2.3.1-', '3-',
						'2.3.1-2.3.3'];
				checkTestSkips.call(this, filterDescs, false, function(name) {
					return '[browser#and-and:' + name + ']';
				});
			});

	//=============================
	// Definition
	//=============================
	module('jquery#1.8.0', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				jquery: '1.8.0'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('スキップされるもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['1.8.0', '1.8', '1', '-1.8.0', '1.8.0-', '1.8-', '-2', '-1.8.1', '-1.8',
				'2,1.8'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[jquery#' + name + ']';
		});
	});

	test('スキップされないもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['1.8.1-', '-1.7.9', '-1.7.9,1.8.1-'];
		checkTestSkips.call(this, filterDescs, false, function(name) {
			return '[jquery#' + name + ']';
		});
	});

	//=============================
	// Definition
	//=============================
	module('build#min', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				build: 'min'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('スキップされるもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['min'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[build#' + name + ']';
		});
	});

	test('スキップされないもの', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['dev'];
		checkTestSkips.call(this, filterDescs, false, function(name) {
			return '[build#' + name + ']';
		});
	});

	//=============================
	// Definition
	//=============================
	module('複数条件 build#min;browser#ie:8', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				build: 'min',
				browserprefix: 'ie',
				browserversion: '8'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('いずれかにマッチしたらスキップ', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['build#min;browser#ie:9', 'build#dev;browser#ie:8'];
		checkTestSkips.call(this, filterDescs, true, function(name) {
			return '[' + name + ']';
		});
	});

	test('いずれにもマッチしないならスキップしない', function() {
		this.originalCurrent = QUnit.config.current;
		var filterDescs = ['build#dev;browser#ie:9'];
		checkTestSkips.call(this, filterDescs, false, function(name) {
			return '[' + name + ']';
		});
	});

	//=============================
	// Definition
	//=============================
	module('module名のフィルタタグ', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				build: 'min',
				browserprefix: 'ie'
			});
		},
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('モジュール名のフィルタタグが条件を満たす場合', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#min]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		var filterDescs = ['スキップされる'];
		checkTestSkips.call(this, filterDescs, true, null, moduleName);
	});

	test('モジュール名のフィルタタグが条件を満たさない場合', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#dev]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		var filterDescs = ['スキップされない'];
		checkTestSkips.call(this, filterDescs, false, null, moduleName);
	});

	test('モジュール名のフィルタタグが条件を満たさない場合でもテスト名のフィルタタグが条件を満たす場合', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#dev]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		var filterDescs = ['[browser#ie] スキップされる'];
		checkTestSkips.call(this, filterDescs, true, null, moduleName);
	});
});