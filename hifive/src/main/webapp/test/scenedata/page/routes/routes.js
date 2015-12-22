(function() {
	'use strict';

	function UrlHelper(url) {
		if (url == null) {
			return;
		}
		var match = url
				.match(/^(?:(\w+:)?\/\/(([^\/:]+)(?::(\d+))?))?((\/?.*?)([^\/]*?))(\?.*?)?(#.*)?$/);
		this.href = match[0] || '';
		this.protocol = match[1] || '';
		this.host = match[2] || '';
		this.hostname = match[3] || '';
		this.port = match[4] || '';
		this.pathname = match[5] || '';
		this.dir = match[6] || '';
		this.file = match[7] || '';
		this.search = match[8] || '';
		this.hash = match[9] || '';
	}

	// Routesテスト用HTMLは同一フォルダの前提
	h5.settings.scene.baseUrl = new UrlHelper(location.href).dir;

	h5.settings.scene.routes = [{
		test: 'string.html?h5testenv.buildType=' + H5_TEST_ENV.buildType,
		navigationInfo: 'string_r.html'
	}, {
		test: /^regexp\.html(?:\?|#|$)/,
		navigationInfo: {
			to: 'regexp_r.html'
		}
	}, {
		test: function(url, navigationInfo) {
			return /^function_url\.html(?:\?|#|$)/.test(url);
		},
		navigationInfo: function(url, navigationInfo) {
			return 'function_url_r.html';
		}
	}, {
		test: function(url, navigationInfo) {
			return navigationInfo.to === 'function_info.html';
		},
		navigationInfo: function(url, navigationInfo) {
			navigationInfo.to = 'function_info_r.html';
			return navigationInfo;
		}
	}, {
		test: /^no_info\.html(?:\?|#|$)/,
		navigationInfo: null
	}, {
		test: /^straight1\.html(?:\?|#|$)/,
		navigationInfo: 'straight2.html'
	}, {
		test: /^straight2\.html(?:\?|#|$)/,
		navigationInfo: 'straight3.html'
	}];
})();
