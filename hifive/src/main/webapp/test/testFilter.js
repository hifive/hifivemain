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
	var env;
	// テストフィルタ用オブジェクト
	if (window.H5_TEST_ENV && window.H5_TEST_ENV.filter) {
		env = window.H5_TEST_ENV.filter;
	} else {
		// H5_TEST_ENV.filterもリクエストパラメータも無ければ全テストを実行するので、フィルタは掛けない。
		return;
	}
	function matchVersion(version, envVersionFull) {
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
		var versions = version.split(',');
		for ( var i = 0, l = versions.length; i < l; i++) {
			if (versions[i].indexOf('.') !== -1) {
				if (envVersionFull.indexOf(versions[i]) === 0) {
					return true;
				}
			} else {
				if (version == versions[i]) {
					return true;
				}
			}
		}

		return false;
	}

	function throughFilter(filtersArray) {
		var filtersObj = {};

		// []を外して、";"で結合する。余分についた両端の";"は削除。";"を区切り記号にして分割し、配列にする。
		var filters = filtersArray.join(';').replace(/\[|\]|^;|$;|;;/g, '').split(';');
		for ( var i = 0, l = filters.length; i < l; i++) {
			var filter = $.trim(filters[i]);

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
		return checkBuildFilter(filtersObj['build']) || checkjQueryFilter(filtersObj['jquery'])
				|| checkBrowserFilter(filtersObj['browser']);
	}

	// build#xxx 指定されたxxxが現環境(env.build)にマッチするかどうかを返す。
	function checkBuildFilter(buildFilters) {
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

	function checkjQueryFilter(jqueryFilters) {
		if (!jqueryFilters) {
			return false;
		}
		for ( var i = 0, l = jqueryFilters.length; i < l; i++) {
			var filter = jqueryFilters[i];

			if (matchVersion($.trim(filter), env.jquery)) {
				return true;
			}
		}
		return false;
	}

	function checkBrowserFilter(browserFilters) {
		if (!browserFilters) {
			return false;
		}
		// "|"で結合する。余分についた両端の"|"は削除。"|"を区切り記号にして分割し、配列にする。
		var filters = browserFilters.join('|').replace(/^\||$\|/g, '').split('|');
		for ( var i = 0, l = filters.length; i < l; i++) {
			var filter = filters[i].split(':');
			if ($.trim(filter[0]) !== env.browserprefix) {
				continue;
			}
			if (!matchVersion($.trim(filter[1]), env.browserversion)) {
				continue;
			}

			// ブラウザ、バージョンがマッチ

			if (!filter[2]) { //オプションがない場合はreturn true
				return true;
			}
			var options = filter[2].split(',');
			// optionによるフィルタ(IEのdocmodeなど)
			for ( var j = 0, len = options.length; j < len; j++) {
				var tmp = options[j].split('=');
				var key = $.trim(tmp[0]);
				var val = $.trim(tmp[1]);
				if (new String(env[key]).toLowerCase() !== val.toLowerCase()) {
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

	QUnit.config.testStart.push(function(stats) {
		var current = QUnit.config.current;

		var testConditionDesc = stats.name.match(/^\[.*?\]/);
		testConditionDesc = testConditionDesc && testConditionDesc[0];
		var moduleConditionDesc = current.module ? current.module.match(/^\[.*?\]/) : '';
		moduleConditionDesc = moduleConditionDesc && moduleConditionDesc[0];

		// 条件が書かれていないなら何もしない
		if (!testConditionDesc && !moduleConditionDesc) {
			return;
		}

		// 条件が、現在の環境でマッチするならテストをスルー
		if (throughFilter([testConditionDesc, moduleConditionDesc])) {
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
	});



});