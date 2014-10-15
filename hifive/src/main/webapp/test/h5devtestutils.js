/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
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
	// ----------- env ----------
	/**
	 * 読み込んでいるhifiveがdev版かどうか
	 *
	 * @memberOf
	 */
	var isDevMode = !!h5.dev;

	// ----------- log ----------
	/**
	 * outputEachLevelで出力するログメッセージ
	 */
	var LOG_MESSAGE_ERROR = 'ERRORレベルのログ';
	var LOG_MESSAGE_WARN = 'WARNレベルのログ';
	var LOG_MESSAGE_DEBUG = 'DEBUGレベルのログ';
	var LOG_MESSAGE_INFO = 'INFOレベルのログ';
	var LOG_MESSAGE_TRACE = 'TRACEレベルのログ';

	/**
	 * ログの設定を元に戻す
	 */
	var restoreDefault = (function() {
		var orgSettings = $.extend({}, h5.settings.log);
		return function() {
			h5.settings.log = orgSettings;
			h5.log.configure();
		};
	})();

	/**
	 * 各レベルでログメッセージを出力する
	 */
	function outputEachLevel(logger) {
		var logger = logger || h5.log.createLogger('LogTest');
		logger.error(LOG_MESSAGE_ERROR);
		logger.warn(LOG_MESSAGE_WARN);
		logger.info(LOG_MESSAGE_INFO);
		logger.debug(LOG_MESSAGE_DEBUG);
		logger.trace(LOG_MESSAGE_TRACE);
	}

	/**
	 * @name testutils.async
	 * @namespace
	 */
	h5.u.obj.expose('h5devtestutils', {
		env: {
			isDevMode: isDevMode
		},
		log: {
			LOG_MESSAGE_ERROR: LOG_MESSAGE_ERROR,
			LOG_MESSAGE_WARN: LOG_MESSAGE_WARN,
			LOG_MESSAGE_DEBUG: LOG_MESSAGE_DEBUG,
			LOG_MESSAGE_INFO: LOG_MESSAGE_INFO,
			LOG_MESSAGE_TRACE: LOG_MESSAGE_TRACE,
			restoreDefault: restoreDefault,
			outputEachLevel: outputEachLevel
		}
	});
})();