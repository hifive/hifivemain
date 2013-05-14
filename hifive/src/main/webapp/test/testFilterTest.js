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
	function checkTestSkips(filterDescs, result, each, moduleName, message) {
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
			ok(isSkipped(current) === result, filterDesc + (result ? ' スキップされること' : ' スキップされないこと'));
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
	module('フィルタタグの記述', {
		originalCurrent: null
	});

	//=============================
	// Body
	//=============================
	test('フィルタタグを記述していない場合はテストはスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, '', false, this.createDesc);
	});

	test('フィルタタグが正しくパースされること', function() {
		this.originalCurrent = QUnit.config.current;
		var condition = h5testFilterTest.parseConditions('[browser#ie:8]');
		var exp = {
			browser: ['ie:8']
		};
		deepEqual(condition, exp, '正しくパースされていること');

		condition = h5testFilterTest
				.parseConditions('[build#min;browser#ff:14,15|ch:-25|ie:0-;jquery#1.7-1.8,1.9.1]');
		exp = {
			browser: ['ff:14,15|ch:-25|ie:0-'],
			build: ['min'],
			jquery: ['1.7-1.8,1.9.1']
		};
		deepEqual(condition, exp, '正しくパースされていること');
	});

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
	test('ブラウザ名(ie)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie'
		});
		checkTestSkips.call(this, 'ie', true, this.createDesc);
	});
	test('ブラウザ名(ie)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie'
		});
		checkTestSkips.call(this, 'ff', false, this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8'
		});
		checkTestSkips.call(this, ['ie:8', 'ie:8-', 'ie:-8', 'ie'], true, this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8'
		});
		checkTestSkips.call(this, ['ie:7', 'ff:8'], false, this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)、docmode(7)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: '7'
		});
		checkTestSkips.call(this, ['ie:8:docmode=7', 'ie:8:docmode=7-', 'ie:8:docmode=-7', 'ie:8',
				'ie'], true, this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)、docmode(7)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: '7'
		});
		checkTestSkips.call(this, ['ie:8:docmode=8', 'ie:9:docmode=7'], false, this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)、docmode(Edge)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: 'Edge'
		});
		checkTestSkips.call(this, ['ie:8:docmode=Edge', 'ie:8:docmode=-7,Edge'], true,
				this.createDesc);
	});

	test('ブラウザ名(ie)、バージョン(8)、docmode(Edge)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		$.extend(H5_TEST_ENV.filter, {
			browserprefix: 'ie',
			browserversion: '8',
			docmode: 'Edge'
		});
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
	test('jQueryのバージョン(1.8.2)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['1.8.2', '-1.8.2', '1.8.2-'], true, this.createDesc);
	});

	test('jQueryのバージョン(1.8.2)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
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
	test('buildモード(min)にフィルタタグがマッチする場合、テストがスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['min'], true, this.createDesc);
	});

	test('buildモード(min)にフィルタタグがマッチしない場合、テストがスキップされないこと', function() {
		this.originalCurrent = QUnit.config.current;
		checkTestSkips.call(this, ['dev'], false, this.createDesc);
	});

	//=============================
	// Definition
	//=============================
	module('バージョン、docmodeの範囲指定・複数指定', {
		originalCurrent: null,
		createDesc: function(desc) {
			return '[browser#and-and:' + desc + ']';
		}
	});

	//=============================
	// Body
	//=============================
	test('バージョンの値が範囲指定記述にマッチするとき、matchVersion()がtrueを返すこと (メジャーバージョンのみの場合)',
			function() {
				var descs = ['2', '2-', '-2', '1-', '-3', '2-3', '1-2', '1-3', 'all'];
				for ( var i = 0, l = descs.length; i < l; i++) {
					strictEqual(h5testFilterTest.matchVersion(descs[i], '2'), true, descs[i]
							+ 'は"2"にマッチする');
				}
			});

	test('バージョンの値が範囲指定記述にマッチしないとき、matchVersion()がfalseを返すこと (メジャーバージョンのみの場合)', function() {
		var descs = ['22', '3-', '-1', '0-1'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchVersion(descs[i], '2'), false, descs[i]
					+ 'は"2"にマッチしない');
		}
	});

	test('バージョンの値が範囲指定記述にマッチするとき、matchVersion()がtrueを返すこと (マイナーバージョン以降を含む場合)', function() {
		var descs = ['2.3.4', '2.3', '2', '2.3.4.0', '2.3.4-', '-2.3.4', '-2.3', '-2', '2.3-',
				'2-', '-2.10', 'all'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchVersion(descs[i], '2.3.4'), true, descs[i]
					+ 'は"2.3.4"にマッチする');
		}
	});

	test('バージョンの値が範囲指定記述にマッチしないとき、matchVersion()がfalseを返すこと (マイナーバージョン以降を含む場合)', function() {
		var descs = ['2.3.44', '-2.3.3', '2.3.5-', '2.3.4.5', '2.10-'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchVersion(descs[i], '2.3.4'), false, descs[i]
					+ 'は"2.3.4"にマッチしない');
		}
	});

	test('docmodeの値が範囲指定記述にマッチするとき、matchDocmode()がtrueを返すこと', function() {
		var descs = ['8', '8-', '-8', '7-', '-9', '8-9', '7-8', 'all'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], '8'), true, descs[i]);
		}
	});

	test('docmodeの値が範囲指定記述にマッチしないとき、matchDocmode()がfalseを返すこと', function() {
		var descs = ['7', 'Edge', '9-', '-7', '0-1'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], '8'), false, descs[i]);
		}
	});

	test('docmodeの値が範囲指定記述にマッチするとき、matchDocmode()がtrueを返すこと (docmode=Edgeの場合)', function() {
		var descs = ['Edge', 'edge', 'EDGE', 'all'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], 'Edge'), true, descs[i]
					+ 'は"Edge"にマッチする');
		}
	});

	test('docmodeの値が範囲指定記述にマッチしないとき、matchDocmode()がfalseを返すこと (docmode=Edgeの場合)', function() {
		var descs = ['7', '0-'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], 'Edge'), false, descs[i]
					+ 'は"Edge"にマッチしない');
		}
	});

	test('カンマ区切りでバージョン指定を複数記述した場合、いずれかに一致したらmatchVersion()がtrueを返すこと', function() {
		var descs = ['2,4', '3-,2'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchVersion(descs[i], '2'), true, descs[i]
					+ 'は"2"にマッチする');
		}
	});

	test('カンマ区切りでバージョン指定を複数記述した場合、いずれにも一致しなかったらmatchVersion()がfalseを返すこと', function() {
		var descs = ['1,3,4'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchVersion(descs[i], '2'), false, descs[i]
					+ 'は"2"にマッチしない');
		}
	});

	test('カンマ区切りでdocmode指定を複数記述した場合、いずれかに一致したらmatchDocmode()がtrueを返すこと', function() {
		var descs = ['7,Edge', '7,all'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], 'Edge'), true, descs[i]
					+ 'は"Edge"にマッチする');
		}
	});

	test('カンマ区切りでdocmode指定を複数記述した場合、いずれにも一致しなかったらmatchDocmode()がfalseを返すこと', function() {
		var descs = ['0-,-10'];
		for ( var i = 0, l = descs.length; i < l; i++) {
			strictEqual(h5testFilterTest.matchDocmode(descs[i], 'Edge'), false, descs[i]
					+ 'は"Edge"にマッチしない');
		}
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
	test('モジュール名のフィルタタグが条件を満たす場合はテスト名に関わらずスキップされること', function() {
		this.originalCurrent = QUnit.config.current;
		var moduleName = '[build#min]';
		var stats = {
			name: moduleName
		};
		checkModuleFilterTag(stats);
		checkTestSkips.call(this, '', true, null, moduleName);
	});

	test('モジュール名のフィルタタグが条件を満たさない場合はテスト名でスキップするかどうか判定されること', function() {
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