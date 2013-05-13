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

	// testFilter関数の取り出し
	// testFilterがtestStartの何番目に入っているか。環境が変わったらここを変更する。
	var testFilterFunctionIndex = 0;
	var doFilter = QUnit.config.testStart[testFilterFunctionIndex];

	// testFilter関数の削除
	QUnit.config.testStart.splice(testFilterFunctionIndex, 1);

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
	function checkSkips(filterDescs, result, each) {
		var stats = {
			module: ''
		};
		for ( var i = 0, l = filterDescs.length; i < l; i++) {
			var filterDesc = each ? each(filterDescs[i]) : filterDescs[i];
			stats.name = filterDesc;
			var current = QUnit.config.current = {
				testEnvironment: {}
			};
			doFilter(stats);
			QUnit.config.current = this.originalCurrent;
			ok(isSkipped(current) === result, filterDesc);
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
	module('ie6', {
		setup: function() {
			$.extend(H5_TEST_ENV.filter, {
				browserprefix: 'ie',
				browserversion: '6',
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
			var filterDescs = ['ie:6', 'ie:6-', 'ie:-6', 'ie:-7', 'ie:6-7', 'ie:6,7', 'ie:7,6',
					'ie:all'];
			checkSkips.call(this, filterDescs, true, function(name) {
				return '[browser#' + name + ']';
			});
		} finally {
			QUnit.config.current = this.originalCurrent;
		}
	});

	test('スキップされないもの', function() {
		try {
			this.originalCurrent = QUnit.config.current;
			var filterDescs = ['ie:7', 'ie:7-', 'ie:-5', 'ie-wp:all', 'ie:5,7'];
			checkSkips.call(this, filterDescs, false, function(name) {
				return '[browser#' + name + ']';
			});
		} finally {
			QUnit.config.current = this.originalCurrent;
		}
	});
});