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

(function() {

	/**
	 * フィルタ情報オブジェクト。定義されているフィルタを元にフィルタを掛ける
	 */
	var env;
	if (window.H5_TEST_ENV && window.H5_TEST_ENV.filter) {
		env = window.H5_TEST_ENV.filter;
	} else {
		// H5_TEST_ENV.filterもリクエストパラメータも無ければ全テストを実行するので、フィルタは掛けない。
		return;
	}

	/**
	 * フィルタ実行オブジェクト 追加のフィルタがある場合はここに追加する
	 */
	var filters = {
		build: {
			check: checkBuildFilter
		},
		jquery: {
			check: checkjQueryFilter
		},
		browser: {
			check: checkBrowserFilter
		}
	};

	//------------------------------------------------------------------------------------
	// チェック関数で使用する共通関数・変数
	//------------------------------------------------------------------------------------
	/**
	 * バージョンがマッチするかどうか判定する。
	 */
	function matchVersion(version, envVersionFull) {
		// ','区切りで複数指定されている場合はorでチェック
		var versions = version.split(',');
		for ( var i = 0, l = versions.length; i < l; i++) {
			if (_matchVersion(versions[i], envVersionFull)) {
				return true;
			}
		}
		return false;
	}

	function _matchVersion(version, envVersionFull) {
		version = $.trim(version);
		var envVersionFullAry = envVersionFull.split('.');
		var envMajorVersion = envVersionFullAry[0];
		// 範囲指定
		if (version === 'all') {
			version = '0-';
		}
		if (version.indexOf('-') !== -1) {
			var tmp = version.split('-');
			var min = tmp[0];
			var max = tmp[1];
			var maxNoCheck = max === '';
			var minNoCheck = min === '';
			if (maxNoCheck && minNoCheck) {
				return true;
			}
			if (min.indexOf('.') !== -1) {
				min = min.split('.');
				max = max.split('.');
				// min-max指定時に、マイナーバージョンも含む場合は、有効桁数を揃えて書いてある前提で処理する(2.3.1-3.2のような書き方はダメ)
				for ( var i = 0, l = min.length; i < l; i++) {
					var curMin = parseInt(min[i]);
					var curMax = parseInt(max[i]);
					var curVersion = parseInt(envVersionFullAry[i]);

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
			return (minNoCheck || parseInt(min) <= envMajorVersion)
					&& (maxNoCheck || envMajorVersion <= parseInt(max));
		}

		// 単一指定または複数指定
		if (envVersionFull.indexOf(version) === 0) {
			return true;
		}

		return false;
	}

	//------------------------------------------------------------------------------------
	// チェック関数
	//------------------------------------------------------------------------------------
	/**
	 * build#xxx 指定されたxxxが現環境(env.build)にマッチするかどうかを返す。
	 */
	function checkBuildFilter(buildFilters, stats) {
		if (!buildFilters) {
			return false;
		}
		for ( var i = 0, l = buildFilters.length; i < l; i++) {
			if (env.build === buildFilters[i]) {
				return true;
			}
		}
		return false;
	}

	/**
	 * jquery#xxx 指定されたxxxが現環境(env.jqeury)にマッチするかどうかを返す。
	 */
	function checkjQueryFilter(jqueryFilters, stats) {
		if (!jqueryFilters) {
			return false;
		}
		for ( var i = 0, l = jqueryFilters.length; i < l; i++) {
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
	function checkBrowserFilter(browserFilters, stats) {
		if (!browserFilters) {
			return false;
		}
		// "|"で結合する。余分についた両端の"|"は削除。"|"を区切り記号にして分割し、配列にする。
		var descs = browserFilters.join('|').replace(/^\||$\|/g, '').split('|');
		for ( var i = 0, l = descs.length; i < l; i++) {
			var desc = descs[i].split(':');
			if ($.trim(desc[0]) !== env.browserprefix) {
				continue;
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
			for ( var j = 0, len = options.length; j < len; j++) {
				var tmp = options[j].split('=');
				var key = $.trim(tmp[0]);
				var val = $.trim(tmp[1]);
				if (key === 'docmode') {
					// docmodeなら数値で比較
					if (!matchVersion(val, env.docmode)) {
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
	 * filterの記述からオブジェクトを生成して返す
	 */
	function createFilterObj(filtersArray) {
		var filtersObj = {};

		// []を外して、";"で結合する。余分についた両端の";"は削除。";"を区切り記号にして分割し、配列にする。
		var filters = filtersArray.join(';').replace(/\[|\]|^;|$;|;;/g, '').split(';');
		for ( var i = 0, l = filters.length; i < l; i++) {
			var filter = $.trim(filters[i]);
			if (filter === '') {
				continue;
			}

			// 判定種別が省略されていたらbrowser
			if (filter.indexOf('#') === -1) {
				filter = 'browser#' + filter;
			}

			// タグと条件文を分離
			var tmp = filter.match(/^(.*?)#(.*)/);
			var tag = $.trim(tmp[1]);
			var conditionStr = $.trim(tmp[2]);

			// 各タグについて条件をまとめる
			if (!filtersObj[tag]) {
				filtersObj[tag] = [];
			}
			filtersObj[tag].push(conditionStr);
		}
		return filtersObj;
	}

	/**
	 * フィルタにマッチするかどうかチェックを行い、マッチしたらtrueを返す。
	 */
	function check(filtersObj, state) {
		for ( var p in filtersObj) {
			if (filters[p].check(filtersObj[p], state)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * testStartにpushする、テストフィルタを実行するための関数
	 */
	function doFilter(stats) {
		var current = QUnit.config.current;

		var testConditionDesc = stats.name.match(/^\[.*?\]/);
		testConditionDesc = testConditionDesc && testConditionDesc[0];
		var moduleConditionDesc = stats.module ? stats.module.match(/^\[.*?\]/) : '';
		moduleConditionDesc = moduleConditionDesc && moduleConditionDesc[0];

		// 条件が書かれていないなら何もしない
		if (!testConditionDesc && !moduleConditionDesc) {
			return;
		}

		// パースしたオブジェクトの生成
		var descriptedFilterObj = createFilterObj([testConditionDesc, moduleConditionDesc]);

		// 条件が、現在の環境でマッチするならテストをスルー
		if (check(descriptedFilterObj, stats)) {
			current.testEnvironment.setup = function() {};
			current.testEnvironment.teardown = function() {};
			current.callback = function() {
				expect(0);
				if (current.async) {
					start();
				}
			};
			current.name = '<span class="module-name">' + stats.module
					+ '</span>: <span class="test-name">[テストをスキップしました] ' + stats.name + '</span>';
		}
	}

	/**
	 * フィルタをtestStartに追加
	 */
	QUnit.config.testStart.push(doFilter);
})();