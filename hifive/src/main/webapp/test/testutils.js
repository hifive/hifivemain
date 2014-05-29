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
	// h5.u.ns、exposeからコピー。エラーチェックは省略。
	function ns(namespace) {
		var nsArray = namespace.split('.');
		var len = nsArray.length;

		var parentObj = window;
		for (var i = 0; i < len; i++) {
			var name = nsArray[i];
			if (parentObj[name] === undefined) {
				parentObj[name] = {};
			}
			parentObj = parentObj[name];
		}

		// ループが終了しているので、parentObjは一番末尾のオブジェクトを指している
		return parentObj;
	}
	function expose(namespace, obj) {
		var nsObj = ns(namespace);
		for ( var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				nsObj[prop] = obj[prop];
			}
		}
	}

	// --------- settings ---------
	/**
	 * @name testutils.settings
	 * @namespace
	 */
	expose('testutils.settings', {
		/**
		 * testutils.async.gateのデフォルト最大待機時間(ms)
		 *
		 * @memberOf testutils.settings
		 */
		GATE_MAX_WAIT: 5000,
		/**
		 * testutils.async.gateのデフォルトインターバル(ms)
		 *
		 * @memberOf testutils.settings
		 */
		GATE_CHECK_INTERVAL: 100
	});


	// ----------- async -----------

	/**
	 * 条件を満たしているかどうかを非同期で繰り返しチェックするための関数です
	 * <p>
	 * この関数はプロミスを返し、条件を満たした場合はresolve()、満たさなかった場合はreject()します。
	 * </p>
	 * 引数に渡されたゲート関数をinterval毎にチェックして、trueが返ったタイミングでresolve()します。
	 * </p>
	 * <p>
	 * maxWait時間までにゲート関数がtrueを返さなければreject()します。
	 * </p>
	 * <p>
	 * ゲート関数は条件を満たせばtrueを返すように設計してください。
	 * </p>
	 *
	 * @memberOf testutils.async
	 * @param {Object} param 引数オブジェクト
	 * @param {Function} param.gateFunction ゲート関数
	 * @param {int} [param.maxWait] 最大待機時間(ms) デフォルトはtestutils.settings.GATE_MAX_WAIT
	 * @param {int} [param.interval] ゲート関数を呼び出す時間間隔(ms) デフォルトはtestutils.settings.GATE_CHECK_INTERVAL
	 * @param {String} [param.failMsg]
	 *            failMsgにメッセージが指定されている場合、最大待機時間待ってもゲート関数がtrueを返さなかった時に、テストを失敗扱いにしてスキップします。
	 *            failMsgが失敗時のアサーションのメッセージになります。
	 * @returns {Promise}
	 */
	function gate(param) {
		var gateFunction = param.gateFunction;
		var maxWait = param.maxWait != null ? param.maxWait : testutils.settings.GATE_MAX_WAIT;
		var interval = param.interval != null ? param.interval
				: testutils.settings.GATE_CHECK_INTERVAL;
		var failMsg = param.failMsg;

		var dfd = $.Deferred();

		// 一番最初にゲート関数を実行してチェックする
		if (gateFunction()) {
			return dfd.resolve().promise();
		}

		var intervalTimer = setInterval(function() {
			if (!gateFunction()) {
				// 失敗時は何もせず次のインターバルを待つ
				return;
			}
			// 成功時
			// タイマーを止めてresolve()
			clearInterval(intervalTimer);
			clearTimeout(limitTimer);
			dfd.resolve();
			return;
		}, interval);

		var limitTimer = setTimeout(function() {
			// タイムアウトしたらタイマーを止めてreject
			clearInterval(intervalTimer);
			dfd.reject();
		}, maxWait);

		// failMsgが指定されていたらメッセージを表示してテストを終了させるfailハンドラを追加する
		if (failMsg) {
			dfd.fail(function() {
				ok(false, failMsg);
				start();
			});
		}
		return dfd.promise();
	}

	/**
	 * #qunit-fixtur内にバインドされているコントローラをdisposeして、コントローラキャッシュ、ロジックキャッシュをクリアする
	 */
	function clearController() {
		var controllers = h5.core.controllerManager.getControllers('#qunit-fixture', {
			deep: true
		});
		for (var i = controllers.length - 1; i >= 0; i--) {
			controllers[i].dispose();
		}
		h5.core.cacheManager.clearAll();
	}

	/**
	 * @name testutils.async
	 * @namespace
	 */
	expose('testutils', {
		async: {
			gate: gate
		},
		clearController: clearController
	});
})();