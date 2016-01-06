/*
 * Copyright (C) 2012-2016 NS Solutions Corporation
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

(function() {
	if (!window.H5_TEST_ENV || !window.H5_TEST_ENV.filter) {
		// H5_TEST_ENV.filterがない場合は全テストを実行するので、フィルタは掛けない。
		return;
	}

	/**
	 * フィルタ情報オブジェクト。定義されているフィルタを元にフィルタを掛ける
	 */
	var env = window.H5_TEST_ENV.filter;

	/**
	 * フィルタ実行オブジェクト 追加のフィルタがある場合はここに追加する checkに指定された関数がtrueを返したらテストをスキップ
	 */
	var filters = {
		build: {
			filter: buildFilter
		},
		jquery: {
			filter: jqueryFilter
		},
		browser: {
			filter: browserFilter
		}
	};

	/**
	 * モジュール名でのフィルタチェック結果を覚えておく key: module名, 値：マッチしたかどうか(スキップするかどうか)
	 */
	var moduleCondition = {};
	//------------------------------------------------------------------------------------
	// チェック関数で使用する共通関数・変数
	//------------------------------------------------------------------------------------
	/**
	 * バージョンの範囲指定記述をパースする<br>
	 * min,maxを持つオブジェクトを返す。min,maxはバージョン表記を配列化したものを返す<br>
	 * ex. '2.3-3.4' -> {min:['2','3'], max:['3','4']}
	 */
	function parseRange(rangeDesc) {
		rangeDesc = $.trim(rangeDesc);

		// allは0-のショートカット
		if (rangeDesc === 'all') {
			rangeDesc = '0-';
		}

		// 範囲指定
		if (rangeDesc.indexOf('-') !== -1) {
			var tmp = rangeDesc.split('-');
			var min = tmp[0];
			var max = tmp[1];
			var parsedMin = min ? min.split('.') : null;
			var parsedMax = max ? max.split('.') : null;
			if (!parsedMin && !parsedMax) {
				return null;
			}
			return {
				min: parsedMin,
				max: parsedMax
			};
		}
		return {
			min: rangeDesc.split('.'),
			max: rangeDesc.split('.')
		};
	}

	/**
	 * 指定された値が範囲に含まれているかどうか
	 */
	function isIncluded(value, rangeCondition) {
		var valueAry = value.split('.');
		var min = rangeCondition.min;
		var max = rangeCondition.max;
		var minNoCheck = !min;
		var maxNoCheck = !max;

		// 各桁について範囲内に入っているかどうか比較
		// minとmaxの有効桁数は揃えてある、または片方が指定無しを想定している
		// 11-12.3 のような指定はできない
		var l = minNoCheck ? max.length : min.length;
		for (var i = 0; i < l; i++) {
			var curMin = minNoCheck ? 0 : parseInt(min[i]);
			var curMax = maxNoCheck ? 0 : parseInt(max[i]);
			var curVersion = parseInt(valueAry[i] || 0);

			var minOK = minNoCheck || curMin <= curVersion;
			var maxOK = maxNoCheck || curVersion <= curMax;
			if (minOK && maxOK) {
				if (curMin < curVersion) {
					minNoCheck = true;
				}
				if (curVersion < curMax) {
					maxNoCheck = true;
				}
				if (maxNoCheck && minNoCheck) {
					return true;
				}
				continue;
			}
			return false;
		}
		return true;

	}


	/**
	 * バージョンがマッチするかどうか判定する。
	 */
	function matchVersion(versionDescs, envVersionFull) {
		if (!envVersionFull && envVersionFull != 0) {
			// 0でなくてfalse(未定義の場合や空文字)ならfalseを返す(テストをスキップさせない)
			return false;
		}
		versionDescs = $.trim(versionDescs);
		// カンマ指定で複数指定されたいずれかにマッチしたらtrueを返す
		var versionsDescsAry = versionDescs.split(',');
		for (var i = 0, l = versionsDescsAry.length; i < l; i++) {
			// パースして、範囲内に入っているかどうか判定
			var version = versionsDescsAry[i];
			var versionRange = parseRange(version);
			if (isIncluded(envVersionFull, versionRange)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * docmodeがマッチするかどうか判定する
	 */
	function matchDocmode(docmodeDescs, envDocmode) {
		docmodeDescs = $.trim(docmodeDescs);
		if (!envDocmode || !docmodeDescs) {
			return false;
		}
		var isEdge = envDocmode.toLowerCase() === 'edge';
		// カンマ指定で複数指定されたいずれかにマッチしたらtrueを返す
		var docmodesDescsAry = docmodeDescs.split(',');
		for (var i = 0, l = docmodesDescsAry.length; i < l; i++) {
			var docmode = docmodesDescsAry[i];
			// edge指定ならパースせずに判定
			if (isEdge && docmode.toLowerCase() === 'edge') {
				return true;
			}
			// all指定ならtrue。パースせずにここで判定する。(Edgeの場合もtrueを返すため)
			if (docmode.toLowerCase() === 'all') {
				return true;
			}
			// パースして、範囲内に入っているかどうか判定
			var docmodeRange = parseRange(docmode);
			if (isIncluded(envDocmode, docmodeRange)) {
				return true;
			}
		}
		return false;
	}

	//------------------------------------------------------------------------------------
	// チェック関数
	//------------------------------------------------------------------------------------
	/**
	 * build#xxx 指定されたxxxが現環境(env.build)にマッチするかどうかを返す。
	 */
	function buildFilter(buildFilters, stats) {
		if (!buildFilters) {
			return false;
		}
		for (var i = 0, l = buildFilters.length; i < l; i++) {
			if (env.build === buildFilters[i]) {
				return true;
			}
		}
		return false;
	}

	/**
	 * jquery#xxx 指定されたxxxが現環境(env.jqeury)にマッチするかどうかを返す。
	 */
	function jqueryFilter(jqueryFilters, stats) {
		if (!jqueryFilters) {
			return false;
		}
		for (var i = 0, l = jqueryFilters.length; i < l; i++) {
			var desc = jqueryFilters[i];

			if (matchVersion(desc, env.jquery)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * browser#xxx 指定されたxxxが現環境(env.browser, env.browserversion)にマッチするかどうかを返す。
	 */
	function browserFilter(browserFilters, stats) {
		if (!browserFilters) {
			return false;
		}
		// "|"で結合する。余分についた両端の"|"は削除。"|"を区切り記号にして分割し、配列にする。
		var descs = browserFilters.join('|').replace(/^\||$\|/g, '').split('|');
		for (var i = 0, l = descs.length; i < l; i++) {
			var desc = descs[i].split(':');
			if ($.trim(desc[0]) !== env.browserprefix) {
				continue;
			}
			// ブラウザ名がマッチ

			if (desc[1] == null) {
				// バージョン指定がないならreturn true;
				return true;
			}
			if (!matchVersion(desc[1], env.browserversion)) {
				continue;
			}

			// ブラウザ、バージョンがマッチ

			if (!desc[2]) { //オプションがない場合はreturn true
				return true;
			}
			var options = desc[2].split('&');
			// optionによるフィルタ(IEのdocmodeなど)
			for (var j = 0, len = options.length; j < len; j++) {
				var tmp = options[j].split('=');
				var key = $.trim(tmp[0]);
				var val = $.trim(tmp[1]);
				if (key === 'docmode') {
					// docmodeなら数値で比較
					if (!matchDocmode(val, env.docmode)) {
						break;
					}
				} else if (new String(env[key]).toLowerCase() !== val.toLowerCase()) {
					// それ以外のオプションは文字列で比較
					break;
				}
			}
			// opitionが全てマッチしたらtrueを返す
			if (j === len) {
				return true;
			}
		}
		return false;
	}

	//------------------------------------------------------------------------------------
	// body
	//------------------------------------------------------------------------------------
	/**
	 * テスト名からフィルタタグ部分をパースしてオブジェクトにして返す。 フィルタタグの指定がない場合はnullを返す
	 */
	function parseConditions(name) {
		var testConditionDesc = name ? name.match(/^\[.*?\]/) : null;
		if (testConditionDesc === null) {
			return null;
		}
		testConditionDesc = testConditionDesc && testConditionDesc[0];

		var filterConditions = {};

		// ";"を区切り記号にして分割し、配列にする。余分についた両端の";"は削除。
		var filters = testConditionDesc.replace(/\[|\]|^;|$;|;;/g, '').split(';');
		for (var i = 0, l = filters.length; i < l; i++) {
			var filter = $.trim(filters[i]);
			if (filter === '') {
				continue;
			}

			// タグと条件文を分離
			var tmp = filter.match(/^(.*?)#(.*)/);
			var tag = $.trim(tmp[1]);
			var conditionStr = $.trim(tmp[2]);

			// 各タグについて条件をまとめる
			if (!filterConditions[tag]) {
				filterConditions[tag] = [];
			}
			filterConditions[tag].push(conditionStr);
		}
		return filterConditions;
	}

	/**
	 * フィルタにマッチするかどうかチェックを行い、マッチしたらtrueを返す。
	 */
	function check(filtersObj, state) {
		for ( var p in filtersObj) {
			if (filters[p].filter(filtersObj[p], state)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * テストをスキップする
	 */
	function skipTest(current, stats) {
		current.testEnvironment.setup = function() {
		// テストをスキップするときは、setup,teardownを実行しないので空のfunctionを代入
		};
		current.testEnvironment.teardown = function() {
		// 空のfunctionを代入
		};
		current.callback = function() {
			expect(0);
			if (current.async) {
				start();
			}
		};
		current.name = '<span class="module-name">' + stats.module
				+ '</span>: <span class="test-name">[テストをスキップしました] ' + stats.name + '</span>';
	}

	/**
	 * moduleStartにpushする、関数。 スキップするかどうかを判定し、moduleConditionに判定結果を覚えておく
	 */
	function checkModuleFilterTag(stats) {
		// パースしたオブジェクトの生成
		var descriptedFilterObj = parseConditions(stats.name);

		// 条件が、現在の環境でマッチするなら覚えておく
		if (check(descriptedFilterObj, stats)) {
			moduleCondition[stats.name] = true;
		}
	}

	/**
	 * testStartにpushする、テストフィルタを実行するための関数
	 */
	function checkTestFilterTag(stats) {
		var current = QUnit.config.current;

		// 既にモジュールのフィルタでテストがスキップ指定されていたらスキップ
		if (moduleCondition[stats.module]) {
			skipTest(current, stats);
			return;
		}

		// パースしたオブジェクトの生成
		var descriptedFilterObj = parseConditions(stats.name);

		// 条件が、現在の環境でマッチするならテストをスルー
		if (check(descriptedFilterObj, stats)) {
			skipTest(current, stats);
		}
	}

	/**
	 * モジュール実行時にモジュール名からフィルタタグを判定する
	 */
	QUnit.config.moduleStart.push(checkModuleFilterTag);

	/**
	 * テスト実行時にフィルタタグの判定をする
	 */
	QUnit.config.testStart.push(checkTestFilterTag);

	if (H5_TEST_ENV.testFilterTestFlag) {
		// テストフィルタのテストのために、フラグが立っていたらテストで使用する関数をexposeする
		window.h5testFilterTest = window.h5testFilterTest || {};
		$.extend(window.h5testFilterTest, {
			parseConditions: parseConditions,
			matchVersion: matchVersion,
			matchDocmode: matchDocmode,
			checkTestFilterTag: checkTestFilterTag,
			checkModuleFilterTag: checkModuleFilterTag
		});
	}
})();