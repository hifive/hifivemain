$(function() {
	var env = {};
	// テストフィルタ用オブジェクト
	if (window.FILTER_ENV) {
		env = window.FILTER_ENV;
	} else {
		// フィルタオブジェクトのない場合はリクエストパラメータから取得して生成
		// リクエストパラメータがあるならその値を使う
		var paramsArray = window.location.search.substring(1).split('&');

		var l = paramsArray.length;
		if (l === 0) {
			// FILTER_ENVもリクエストパラメータも無ければ全テストを実行するので、フィルタは掛けない。
			return;
		}
		// リクエストパラメータの値を使用する
		for ( var i = 0; i < l; i++) {
			var keyVal = paramsArray[i].split('=');
			env[keyVal[0]] = keyVal[1];
		}
	}

	function matchVersion(version, envVersionFull) {
		var envVersionFullAry =  envVersionFull.split('.');
		var envMajorVersion = envVersionFullAry[0];
		// 範囲指定
		if (version.indexOf('-') !== -1) {
			var tmp = version.split('-');
			var min = tmp[0];
			var max = tmp[1];
			if (min.indexOf('.') !== -1) {
				min = min.split('.');
				max = max.split('.');
				var minOK = false;
				var maxOK = false;
				// min-max指定時に、マイナーバージョンも含む場合は、有効桁数を揃えて書いてある前提で処理する(2.3.1-3.2のような書き方はダメ)
				for ( var i = 0, l = min.length; i < l; i++) {
					var curMin = parseInt(min[i]);
					var curMax = parseInt(max[i]);
					var curVersion = parseInt(envVersionFullAry[i]);

					if (!minOK && curMin < curVersion) {
						minOK = true;
					}
					if (!maxOK && curVersion < curMax) {
						maxOK = true;
					}
					if ((minOK || curMin <= curVersion) && (maxOK || curVersion <= curMax)) {
						continue;
					}
					return false;
				}
				return true;
			}
			return parseInt(min) <= envMajorVersion && envMajorVersion <= parseInt(max);
		}

		// 単一指定または複数指定
		var versions = version.split(',');
		for ( var i = 0, l = versions.length; i < l; i++) {
			if (versions[i].indexOf('.') !== -1) {
				if (envVersionFull.join('.').indexOf(versions[i]) === 0) {
					return true;
				}
			} else {
				if (envVersion == versions[i]) {
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
				if (env[key] !== val) {
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
		if (current.module == null) {
			// TODO 暫定的処理。モジュール名が空の場合にalertを出して気づくようにしている。
			alert('モジュール名が空です。' + 'テスト名：' + stats.name);
		}
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