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
	var checkModuleFilterTag = QUnit.config.testStart[moduleStartIndex];
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
	 * 指定された記述でテストがスキップされるかどうかチェックする
	 */
	function checkTestSkips(filterDescs, result, each) {
		var stats = {
			module: ''
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
	module('ie8', {
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
		try {
			this.originalCurrent = QUnit.config.current;
			var filterDescs = ['ie:8', 'ie:7-', 'ie:8-', 'ie:-8', 'ie:-8.1', 'ie:-9', 'ie:8-9',
					'ie:7-9', 'ie:6,8', 'ie:8|ff:10', 'ie:all', 'ie:8:docmode=Edge'];
			checkTestSkips.call(this, filterDescs, true, function(name) {
				return '[browser#' + name + ']';
			});
		} finally {
			QUnit.config.current = this.originalCurrent;
		}
	});

	test('スキップされないもの',
			function() {
				try {
					this.originalCurrent = QUnit.config.current;
					var filterDescs = ['ie:7', 'ie:88', 'ie:9-', 'ie:-7', 'ie:8.1-', 'ie-wp:all',
							'ie:7,9'];
					checkTestSkips.call(this, filterDescs, false, function(name) {
						return '[browser#' + name + ']';
					});
				} finally {
					QUnit.config.current = this.originalCurrent;
				}
			});

	//=============================
	// Definition
	//=============================
	module('ie8:docmode=7', {
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
		try {
			this.originalCurrent = QUnit.config.current;
			var filterDescs = ['ie:8:docmode=7', 'ie:7-9:docmode=7', 'ie:8:docmode=7-',
					'ie:8:docmode=-9'];
			checkTestSkips.call(this, filterDescs, true, function(name) {
				return '[browser#' + name + ']';
			});
		} finally {
			QUnit.config.current = this.originalCurrent;
		}
	});

	test('スキップされないもの', function() {
		try {
			this.originalCurrent = QUnit.config.current;
			var filterDescs = ['ie:8:docmode=6', 'ie:9:docmode=7', 'ie:8:docmode=8-',
					'ie:8:docmode=-6'];
			checkTestSkips.call(this, filterDescs, false, function(name) {
				return '[browser#' + name + ']';
			});
		} finally {
			QUnit.config.current = this.originalCurrent;
		}
	});
});