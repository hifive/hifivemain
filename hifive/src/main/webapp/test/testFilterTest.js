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
		filterDescs = $.isArray(filterDescs) ? filterDescs : [filterDescs];
		for ( var i = 0, l = filterDescs.length; i < l; i++) {
			var filterDesc = each ? each(filterDescs[i]) : filterDescs[i];
			stats.name = filterDesc;
			var current = QUnit.config.current = {
				testEnvironment: {}
			};
			checkTestFilterTag(stats);
			QUnit.config.current = this.originalCurrent;
			ok(isSkipped(current) === result, filterDesc + (result ? ' スキップすること' : ' スキップしないこと'));
		}
	}

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================
	module('ブラウザに対するフィルタ', {
		originalCurrent: null,
		createDesc: function(desc) {
			return '[browser#' + desc + ']';
		}
	});

	//=============================
	// Body
	//=============================
	test('ブラウザ名 (ie)', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie'
		});
		checkTestSkips.call(this, 'ie', true, this.createDesc);
		checkTestSkips.call(this, 'ff', false, this.createDesc);
	});

	test('ブラウザ名、バージョン (ie, 8)', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8'
		});
		checkTestSkips.call(this, ['ie:8', 'ie:8-', 'ie:-8', 'ie'], true, this.createDesc);
		checkTestSkips.call(this, ['ie:7', 'ff:8'], false, this.createDesc);
	});

	test('ブラウザ名、バージョン、docmode (ie, 8, 7)', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: '7'
		});
		checkTestSkips.call(this, ['ie:8:docmode=7', 'ie:8:docmode=7-', 'ie:8:docmode=-7', 'ie:8',
				'ie'], true, this.createDesc);

		checkTestSkips.call(this, ['ie:8:docmode=8', 'ie:9:docmode=7'], false, this.createDesc);
	});

	test('ブラウザ名、バージョン、docmode (ie, 8, Edge)', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: 'Edge'
		});
		checkTestSkips.call(this, ['ie:8:docmode=Edge'], true, this.createDesc);

		checkTestSkips.call(this, ['ie:8:docmode=8', 'ie:8:docmode=8-', 'ie:8:docmode=-6'], false,
				this.createDesc);
	});

	//=============================
	// Definition
	//=============================
	module('jQueryのバージョンに対するフィルタ', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				jquery: '1.8.2'
			});
		},
		originalCurrent: null,
		createDesc: function(desc) {
			return '[jquery#' + desc + ']';
		}
	});

	//=============================
	// Body
	//=============================
	test('jQuery (1.8.2)', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['1.8.2', '-1.8.2', '1.8.2-'], true, this.createDesc);
		checkTestSkips.call(this, ['1.8.1'], false, this.createDesc);
	});

	//=============================
	// Definition
	//=============================
	module('buildモードに対するフィルタ', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				build: 'min'
			});
		},
		originalCurrent: null,
		createDesc: function(desc) {
			return '[build#' + desc + ']';
		}
	});

	//=============================
	// Body
	//=============================
	test('buildモード (min)', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['min'], true, this.createDesc);
		checkTestSkips.call(this, ['dev'], false, this.createDesc);
	});

	//=============================
	// Definition
	//=============================
	module('バージョンの範囲指定', {
		originalCurrent: null,
		createDesc: function(desc) {
			return '[browser#and-and:' + desc + ']';
		}
	});

	//=============================
	// Body
	//=============================
	test('メジャーバージョンのみの場合', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'and-and',
			browserversion: '2'
		});
		checkTestSkips.call(this, ['2', '2-', '-2', '1-', '-3', '2-3', '1-2', '1-3', 'all'], true,
				this.createDesc);
		checkTestSkips.call(this, ['22', '3-', '-1', '0-1'], false, this.createDesc);
	});

	test('マイナーバージョン以降を含む場合', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'and-and',
			browserversion: '2.3.4'
		});
		checkTestSkips.call(this, ['2.3.4', '2.3', '2', '2.3.4.0', '2.3.4-', '-2.3.4', '-2.3',
				'-2', '2.3-', '2-', '-2.10', 'all'], true, this.createDesc);
		checkTestSkips.call(this, ['2.3.44', '-2.3.3', '2.3.5-', '2.3.4.5', '2.10-'], false,
				this.createDesc);
	});

	test('カンマ区切りで複数指定した場合はいずれかに一致したらスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'and-and',
			browserversion: '2'
		});
		checkTestSkips.call(this, ['2,4', '3-,2'], true, this.createDesc);
		checkTestSkips.call(this, ['1,3,4'], false, this.createDesc);
	});

	//=============================
	// Definition
	//=============================
	module('カンマ区切りで複数条件を記述', {
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
	test('いずれかにマッチしたらスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['[build#min;browser#ie:9]', '[build#dev;browser#ie:8]'], true);
		checkTestSkips.call(this, ['[build#dev;browser#ie:9]'], false);
	});

	//=============================
	// Definition
	//=============================
	module('モジュール名のフィルタタグ', {
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
	test('モジュール名のフィルタタグが条件を満たす場合はテスト名に関わらずスキップ', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#min]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		checkTestSkips.call(this, '', true, null, moduleName);
	});

	test('モジュール名のフィルタタグが条件を満たさない場合はテスト名で判定される', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#dev]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		checkTestSkips.call(this, '', false, null, moduleName);
		checkTestSkips.call(this, '[browser#ie]', true, null, moduleName);
	});
});