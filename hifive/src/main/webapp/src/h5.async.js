/*
 * Copyright (C) 2011-2012 NS Solutions Corporation.
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

/* ------ h5.async ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	/**
	 * テンプレート文字列のコンパイル時に発生するエラー
	 */
	var ERR_CODE_NOT_ARRAY = 5000;

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NOT_ARRAY] = 'h5.async.each() の第1引数は配列のみを扱います。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	// =============================
	// Development Only
	// =============================

	/* del begin */

	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	// =============================
	// Functions
	// =============================
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 登録された共通のエラー処理を実行できるDeferredオブジェクトを返します。<br>
	 * Deferredに notify() / notifyWith() / progress() メソッドがない場合は、追加したオブジェクトを返します。
	 *
	 * @returns {Deferred} Deferredオブジェクト
	 * @name deferred
	 * @function
	 * @memberOf h5.async
	 */
	var deferred = function() {
		var dfd = $.Deferred();
		// jQuery1.6.xにはDeferred.notify/notifyWith/progressがない
		if (!dfd.notify && !dfd.notifyWith && !dfd.progress) {
			// 既にnorify/notifyWithが呼ばれたかどうかのフラグ
			var notified = false;
			// 最後に指定された実行コンテキスト
			var lastNotifyContext = null;
			// 最後に指定されたパラメータ
			var lastNotifyParam = null;
			// progressCallbacksを格納するための配列
			dfd.__h5__progressCallbacks = [];
			// progressCallbacksに対応したprogressFilterの配列を格納するための配列
			dfd.__h5__progressFilters = [];

			var progress = function(progressCallback) {
				// 既にnorify/notifyWithが呼ばれていた場合、jQuery1.7.xの仕様と同じにするためにコールバックの登録と同時に実行する必要がある
				var filters = this.__h5__progressPipeFilters;
				if (notified) {
					var params = lastNotifyParam;
					// pipe()でprogressFilterが登録されいたら値をフィルタに通す
					if (filters && filters.length > 0) {
						for ( var i = 0, fLen = filters.length; i < fLen; i++) {
							params = filters[i].apply(this, wrapInArray(params));
						}
					}
					if (params !== lastNotifyParam) {
						params = wrapInArray(params);
					}
					progressCallback.apply(lastNotifyContext, params);
				}
				dfd.__h5__progressCallbacks.push(progressCallback);
				dfd.__h5__progressFilters.push(filters);
				return this;
			};
			dfd.progress = progress;
			var originalPromise = dfd.promise;
			dfd.promise = function(obj) {
				var promise = originalPromise.call(this, obj);
				// プロミスにprogress()を追加
				promise.progress = progress;
				return promise;
			};

			dfd.notify = function(/* var_args */) {
				notified = true;
				if (arguments.length !== -1) {
					lastNotifyContext = this;
					lastNotifyParam = h5.u.obj.argsToArray(arguments);
				}
				var callbacks = dfd.__h5__progressCallbacks;
				var filters = dfd.__h5__progressFilters;
				var args = h5.u.obj.argsToArray(arguments);
				// progressコールバックが登録されていたら全て実行する
				if (callbacks.length > 0) {
					for ( var i = 0, callbackLen = callbacks.length; i < callbackLen; i++) {
						var params = args;
						// pipe()でprogressFilterが登録されいたら値をフィルタに通す
						if (filters[i] && filters[i].length > 0) {
							for ( var j = 0, fLen = filters[i].length; j < fLen; j++) {
								params = filters[i][j].apply(this, wrapInArray(params));
							}
						}
						if (params !== arguments) {
							params = wrapInArray(params);
						}
						callbacks[i].apply(this, params);
					}
				}
				return this;
			};

			dfd.notifyWith = function(context, args) {
				notified = true;
				lastNotifyContext = context;
				lastNotifyParam = args;
				var callbacks = this.__h5__progressCallbacks;
				var filters = this.__h5__progressFilters;
				// progressコールバックが登録されていたら全て実行する
				if (callbacks.length > 0) {
					for ( var i = 0, callbackLen = callbacks.length; i < callbackLen; i++) {
						var params = args;
						// pipe()でprogressFilterが登録されいたら値をフィルタに通す
						if (filters[i] && filters[i].length > 0) {
							for ( var j = 0, fLen = filters[i].length; j < fLen; j++) {
								params = filters[i][j].apply(this, wrapInArray(params));
							}
						}
						if (params !== args) {
							params = wrapInArray(params);
						}
						callbacks[i].apply(context, params);
					}
				}
				return this;
			};

			var originalPipe = dfd.pipe;
			dfd.pipe = function(doneFilter, failFilter, progressFilter) {
				// pipe()の戻り値であるfilteredは元のDeferredオブジェクトとはインスタンスが異なる
				var filtered = originalPipe.call(this, doneFilter, failFilter);
				if (progressFilter) {
					if (!this.__h5__progressPipeFilters) {
						filtered.__h5__progressPipeFilters = [progressFilter];
					} else {
						filtered.__h5__progressPipeFilters = this.__h5__progressPipeFilters
								.concat([progressFilter]);
					}
				}
				filtered.pipe = dfd.pipe;
				filtered.progress = dfd.progress;
				return filtered;
			};
		}
		// failコールバックが1つ以上登録されたかどうかのフラグ
		var existFailHandler = false;

		var originalFail = dfd.fail;
		var fail = function(/* var_args */) {
			if (arguments.length > 0) {
				existFailHandler = true;
			}
			return originalFail.apply(this, arguments);
		};
		dfd.fail = fail;

		var originalAlways = dfd.always;
		var always = function(/* var_args */) {
			if (arguments.length > 0) {
				existFailHandler = true;
			}
			return originalAlways.apply(this, arguments);
		};
		dfd.always = always;

		var then = function(doneCallbacks, failCallbacks, progressCallbacks) {
			if (doneCallbacks) {
				this.done.apply(this, wrapInArray(doneCallbacks));
			}
			if (failCallbacks) {
				this.fail.apply(this, wrapInArray(failCallbacks));
			}
			if (progressCallbacks) {
				this.progress.apply(this, wrapInArray(progressCallbacks));
			}
			return this;
		};
		dfd.then = then;

		var originalReject = dfd.reject;
		var reject = function(/* var_args */) {
			var commonFailHandler = h5.settings.commonFailHandler;
			// failコールバックが1つもない、かつcommonFailHandlerがある場合は、commonFailHandlerを登録する
			if (!existFailHandler && commonFailHandler) {
				originalFail.call(this, commonFailHandler);
			}
			return originalReject.apply(this, arguments);
		};
		dfd.reject = reject;
		var originalRejectWith = dfd.rejectWith;
		var rejectWith = function(/* var_args */) {
			var commonFailHandler = h5.settings.commonFailHandler;
			// failコールバックが1つもない、かつcommonFailHandlerがある場合は、commonFailHandlerを登録する
			if (!existFailHandler && commonFailHandler) {
				this.fail(commonFailHandler);
			}
			return originalRejectWith.apply(this, arguments);
		};
		dfd.rejectWith = rejectWith;
		var p = dfd.promise;
		dfd.promise = function(obj) {
			var promise = p.call(this, obj);
			promise.always = always;
			promise.then = then;
			promise.fail = fail;
			return promise;
		};
		return dfd;
	};

	/**
	 * オブジェクトがPromiseオブジェクトであるかどうかを返します。<br />
	 * オブジェクトがDeferredオブジェクトの場合、falseが返ります。
	 *
	 * @param {Object} object オブジェクト
	 * @returns {Boolean} オブジェクトがPromiseオブジェクトであるかどうか
	 * @name isPromise
	 * @function
	 * @memberOf h5.async
	 */
	var isPromise = function(object) {
		return !!object && object.done && object.fail && !object.resolve && !object.reject;
	};

	/**
	 * 指定された回数ごとにループを抜けブラウザに制御を戻すユーティリティメソッドです。
	 *
	 * @param {Any[]} array 配列
	 * @param {Function} callback コールバック関数。<br />
	 *            コールバックには引数として現在のインデックス、現在の値、ループコントローラが渡されます。<br />
	 *            callback(index, value, loopControl) <br />
	 *            loopControlは以下の3つのメソッドを持っています。<br />
	 *            <ul>
	 *            <li>pause - 処理の途中でポーズをかけます。</li>
	 *            <li>resume - ポーズを解除し処理を再開します。</li>
	 *            <li>stop - 処理を中断します。1度stopで中断すると再開することはできません。</li>
	 *            </ul>
	 * @param {Number} [suspendOnTimes=20] 何回ごとにループを抜けるか。デフォルトは20回です。
	 * @returns {Promise} Promiseオブジェクト
	 * @name loop
	 * @function
	 * @memberOf h5.async
	 */
	var loop = function(array, callback, suspendOnTimes) {
		if (!$.isArray(array)) {
			throwFwError(ERR_CODE_NOT_ARRAY);
		}
		var dfd = deferred();
		// 何回ごとにループを抜けるか。デフォルトは20回
		var st = $.type(suspendOnTimes) === 'number' ? suspendOnTimes : 20;
		var userReject = false;
		var index = 0;
		var len = array.length;
		var execute,loopControl = null;
		var each = function() {
			if (index === len) {
				dfd.resolve(array);
				return;
			} else if (userReject) {
				dfd.reject(array);
				return;
			}
			var ret = callback.call(array, index, array[index], loopControl);
			index++;
			if (isPromise(ret)) {
				ret.done(function() {
					execute();
				}).fail(function() {
					userReject = true;
					execute();
				});
			} else {
				execute();
			}
		};
		var async = function() {
			setTimeout(function() {
				var i = index - 1;
				if (index > 0) {
					dfd.notify({
						data: array,
						index: i,
						value: array[i]
					});
				}
				each();
			}, 0);
		};
		var pause = false;
		execute = function() {
			if (pause) {
				return;
			}
			index % st === 0 ? async() : each();
		};
		var stopFlag = false;
		loopControl = {
			resume: function() {
				if (!stopFlag && pause) {
					pause = false;
					execute();
				}
			},
			pause: function() {
				pause = true;
			},
			stop: function() {
				stopFlag = true;
				dfd.resolve(array);
			}
		};
		async();
		return dfd.promise();
	};

	// =============================
	// Expose to window
	// =============================

	/**
	 * @namespace
	 * @name async
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.async', {
		deferred: deferred,
		isPromise: isPromise,
		loop: loop
	});

})();