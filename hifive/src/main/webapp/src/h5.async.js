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
	 * h5.async.loopの第一引数に配列以外のものが渡されたときに発生するエラー
	 */
	var ERR_CODE_NOT_ARRAY = 5000;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.async');

	/* del begin */
	var FW_LOG_H5_WHEN_INVALID_PARAMETER = 'h5.async.when: 引数にpromiseオブジェクトでないものが含まれています。';

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_NOT_ARRAY] = 'h5.async.each() の第1引数は配列のみを扱います。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);
	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	/**
	 * argsToArrayのショートカット
	 *
	 * @private
	 */
	var argsToArray = h5.u.obj.argsToArray;
	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	/**
	 * h5.async.deferredがcommonFailHandlerの管理のために上書くjQuery.Deferredのメソッド (failコールバックを登録する可能性のある関数)
	 *
	 * @private
	 * @type {Array}
	 */
	var CFH_HOOK_METHODS = ['fail', 'always', 'pipe', 'then'];

	// =============================
	// Functions
	// =============================
	/**
	 * progres,notify,notifyWithが無ければそれらを追加する
	 *
	 * @private
	 * @param {Deferred} dfd
	 */
	function addProgressFeatureForCompatibility(dfd) {
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

		// progress,notify,notifyWithを追加
		dfd.progress = function(progressCallback) {
			// 既にnorify/notifyWithが呼ばれていた場合、jQuery1.7以降の仕様と同じにするためにコールバックの登録と同時に実行する必要がある
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

		function notify(/* var_args */) {
			notified = true;
			if (arguments.length !== -1) {
				lastNotifyContext = this;
				lastNotifyParam = argsToArray(arguments);
			}
			if (isRejected(dfd) || isResolved(dfd)) {
				// resolve済みまたはreject済みならprogressコールバックは実行しない
				return dfd;
			}
			var callbacks = dfd.__h5__progressCallbacks;
			var filters = dfd.__h5__progressFilters;
			var args = argsToArray(arguments);
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
			return dfd;
		}
		dfd.notify = notify;
		dfd.notifyWith = function(context, args) {
			return notify.apply(context, args);
		};
	}

	/**
	 * 引数に関数が含まれているか
	 *
	 * @private
	 * @param {Any} arg コールバック登録関数に渡された引数
	 */
	function hasValidCallback(arg) {
		if (!arg) {
			return false;
		}
		arg = wrapInArray(arg);
		for ( var i = 0, l = arg.length; i < l; i++) {
			if ($.isFunction(arg[i])) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 引数に指定されたpromiseまたはdeferredオブジェクトに対してコールバック登録関数をフックし、commonFailHandlerの機能を追加する。
	 * 既にフック済みのもの(prev)があればprevが持っているものに差し替える
	 *
	 * @private
	 * @param {Deferred|Promise} promise
	 * @param {Deferred} rootDfd
	 *            既にフック済みのDeferredオブジェクト。第一引数がPromiseで、元のdeferredでフック済みならそっちのメソッドに差し替える
	 */
	function toCFHAware(promise, rootDfd) {
		// progressを持っているか
		var hasNativeProgress = !!promise.progress;

		// 引数がDeferredオブジェクト(!=プロミスオブジェクト)の場合、
		// progress/notify/notifyWithがないなら追加。
		// jQuery1.6.x でもprogress/notify/notifyWithを使えるようにする。
		if (!hasNativeProgress && !isPromise(promise)) {
			addProgressFeatureForCompatibility(promise);
		}
		// rootDfdにprogressがあればそれに書き換え
		if (rootDfd && rootDfd.progress) {
			// promiseがPromiseオブジェクトで、promise.progressがない場合、Promise生成元のdfdからprogressを追加
			promise.progress = rootDfd.progress;
		}

		// failコールバックが1つ以上登録されたかどうかのフラグ
		var existFailHandler = false;
		//commonFailHandlerが発火済みかどうかのフラグ
		var isCommonFailHandlerFired = false;

		// 以下書き換える必要のある関数を書き換える

		// commonFailHandlerのフラグ管理のために関数を上書きするための関数
		function override(method) {
			if (rootDfd && rootDfd[method]) {
				promise[method] = rootDfd[method];
				return;
			}
			var originalFunc = promise[method];
			promise[method] = (function(_method) {
				return function(/* var_args */) {
					if (!existFailHandler) {
						// failコールバックが渡されたかどうかチェック
						var arg = argsToArray(arguments);
						if (method === 'then' || method === 'pipe') {
							// thenまたはpipeならargの第2引数を見る
							arg = arg[1];
						}
						if (hasValidCallback(arg)) {
							existFailHandler = true;
						}
					}
					return originalFunc.apply(this, arguments);
				};
			})(method);
		}

		// failコールバックを登録する可能性のある関数を上書き
		for ( var i = 0, l = CFH_HOOK_METHODS.length; i < l; i++) {
			var prop = CFH_HOOK_METHODS[i];
			if (promise[prop]) {
				override(prop);
			}
		}

		// pipeは戻り値が呼び出したpromise(またはdeferred)と違うので、
		// そのdeferred/promiseが持つメソッドの上書きをして返す関数にする。
		// jQuery1.6以下にない第3引数でのprogressコールバックの登録にも対応する。
		if (promise.pipe) {
			var pipe = promise.pipe;
			promise.pipe = function() {
				var ret = toCFHAware(pipe.apply(this, arguments));

				// もともとprogressを持っている(=pipeが第三引数でのprogressFilter登録に対応している)
				// または、第3引数がない(=progressFilterの登録がない)ならそのままretを返す
				// ならそのままretを返す
				// pipeで指定するprogressFilterは、単数で一つのみ登録できるので、それがそのまま関数かどうか判定すればいい。
				if (hasNativeProgress || !$.isFunction(arguments[2])) {
					return ret;
				}
				var progressFilter = arguments[2];

				// pipe用のdfd作成
				var pipeDfd = deferred();
				ret.progress = function(func) {
					pipeDfd.progress(func);
				};

				promise.progress(function() {
					var ret = progressFilter.apply(this, arguments);
					if (!(ret && $.isFunction(ret.promise))) {
						// promise関数を持っていない(deferred or promise じゃない)なら次のprogressFilterを呼ぶ
						pipeDfd.notify.call(this, ret);
					} else {
						// promiseを返した場合(promise or deferred)
						ret.progress(function() {
							pipeDfd.notify.apply(this, arguments);
						});
					}
				});
				return ret;
			};
		}

		// thenは戻り値が呼び出したpromise(またはdeferred)と違う(jQuery1.8以降)なら、
		// そのdeferred/promiseが持つメソッドの上書きをして返す関数にする
		// jQuery1.6対応で、第3引数にprogressFilterが指定されていればそれを登録する
		if (promise.then) {
			var then = promise.then;
			promise.then = function(/* var_args */) {
				var args = arguments;
				var ret = then.apply(this, args);
				if (ret !== promise) {

					// 別のpromiseを生成して返ってくる(=jQuery1.8以降)なら、promiseの関数を上書いてから返す
					return toCFHAware(ret);
				}

				// thenが同じpromiseを返した場合(jQuery1.7以前)ならそのままretを返す

				// progressFilterが引数で指定されてかつprogressメソッドがjQueryにない(1.6以前)場合
				// promise.progressに登録する
				if (!hasNativeProgress && hasValidCallback(args[2])) {
					promise.progress.call(promise, args[2]);
				}
				// progressメソッドがもともとjQueryにある(jQuery1.7以降)なら、originalThenで登録されている。
				// progressFilterの指定がないなら何もする必要がない。
				return ret;
			};
		}

		// reject/rejectWith
		function createReject(rejectFunc) {
			return function(/* var_args */) {
				var commonFailHandler = h5.settings.commonFailHandler;
				// failコールバックが1つもない、かつcommonFailHandlerがある場合は、commonFailHandlerを登録する
				if (!existFailHandler && commonFailHandler && !isCommonFailHandlerFired) {
					promise.fail.call(this, commonFailHandler);
					isCommonFailHandlerFired = true;
				}
				return rejectFunc.apply(this, arguments);
			};
		}

		// reject
		if (promise.reject) {
			if (rootDfd && rootDfd.reject) {
				promise.reject = rootDfd.reject;
			} else {
				promise.reject = createReject(promise.reject);
			}
		}

		// rejectWith
		if (promise.rejectWith) {
			if (rootDfd && rootDfd.rejectWith) {
				promise.rejectWith = rootDfd.rejectWith;
			} else {
				promise.rejectWith = createReject(promise.rejectWith);
			}
		}

		// promise
		if (promise.promise) {
			if (rootDfd && rootDfd.promise) {
				promise.promise = rootDfd.promise;
			} else {
				var originalPromise = promise.promise;
				promise.promise = function(/* var_args */) {
					// toCFHAwareで上書く必要のある関数を上書いてから返す
					return toCFHAware(originalPromise.apply(this, arguments), promise);
				};
			}
		}
		return promise;
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * 登録された共通のエラー処理(<a href="h5.settings.html#commonFailHandler">h5.settings.commonFailHandler</a>)を実行できるDeferredオブジェクトを返します。<br>
	 * Deferredに notify() / notifyWith() / progress() メソッドがない場合は、追加したオブジェクトを返します。
	 *
	 * @returns {Deferred} Deferredオブジェクト
	 * @name deferred
	 * @function
	 * @memberOf h5.async
	 */
	var deferred = function() {
		var rawDfd = $.Deferred();
		return toCFHAware(rawDfd);

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
	 * 指定された回数ごとにループを抜けブラウザに制御を戻すユーティリティメソッドです。<br>
	 * また、callbackで渡された関数が{Promise}を返した場合、その{Promise}が終了するまで次のループの実行を待機します。
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

	/**
	 * 引数に指定した１つ以上のPromiseオブジェクトに基づいて、コールバックメソッドを実行します。
	 * <p>
	 * 引数に指定されたPromiseオブジェクトの挙動によって、以下のような処理を実行します。<br>
	 * <ul>
	 * <li>引数に指定されたPromiseオブジェクトのうち、１つでもreject()が実行されると、failコールバックを実行します。</li>
	 * <li>引数に指定されたすべてのPromiseオブジェクトの全てでresolve()が実行されると、doneコールバックを実行します。</li>
	 * <li>引数に指定されたPromiseオブジェクトでnotify()が実行されると、progressコールバックを実行します。</li>
	 * </ul>
	 * 本メソッドはjQuery.when()と同様の機能を持っており、同じように使うことができます。<br>
	 * ただし、以下のような違いがあります。
	 * <h4>jQuery.when()と相違点</h4>
	 * <ul>
	 * <li>failコールバックが未指定の場合、共通のエラー処理(<a
	 * href="./h5.settings.html#commonFailHandler">commonFailHandler</a>)を実行します。</li>
	 * <li>jQuery1.6.xを使用している場合、jQuery.when()では使用できないnotify/progressの機能を使用することができます。ただし、この機能を使用するには<a
	 * href="h5.async.html#deferred">h5.async.deferred()</a>によって生成されたDeferredのPromiseオブジェクトを引数に指定する必要があります。<br>
	 * </li>
	 * <li>引数の指定方法について、jQuery.when()は可変長のみなのに対し、本メソッドは可変長またはPromiseオブジェクトを持つ配列で指定することができます。</li>
	 * </ul>
	 * <h4>引数の指定方法</h4>
	 * 配列または可変長で、複数のPromiseオブジェクトを渡すことができます。<br>
	 * 例)
	 * <ul>
	 * <li>h5.async.when(p1, p2, p3); </li>
	 * <li>h5.async.when([p1, p2, p3]); </li>
	 * </ul>
	 * Promiseオブジェクト以外を渡した時は無視されます。<br>
	 * また、可変長と配列の組み合わせで指定することはできません。<br>
	 * <ul>
	 * <li>h5.async.when(p1, [p2, p3], p4);</li>
	 * </ul>
	 * のようなコードを書いた時、2番目の引数は「配列」であり「Promise」ではないので無視され、p1とp4のみ待ちます。<br>
	 * <br>
	 * また、配列が入れ子になっていても、再帰的に評価はしません。<br>
	 * <ul>
	 * <li>h5.async.when([pi, [p2, p3], p4])</li>
	 * </ul>
	 * と書いても、先の例と同様p1とp4のみ待ちます。
	 *
	 * @param {Promise} var_args Promiseオブジェクﾄ(可変長または配列で複数のPromiseを指定する)
	 * @returns {Promise} Promiseオブジェクト
	 * @name when
	 * @function
	 * @memberOf h5.async
	 */
	var when = function(/* var_args */) {
		var getDeferred = h5.async.deferred;

		var args = argsToArray(arguments);

		if (args.length === 1 && $.isArray(args[0])) {
			args = args[0];
		}

		/* del begin */
		// 引数にpromise・deferredオブジェクト以外があった場合はログを出力します。
		for ( var i = 0, l = args.length; i < l; i++) {
			// DeferredもPromiseも、promiseメソッドを持つので、
			// promiseメソッドがあるかどうかでDeferred/Promiseの両方を判定しています。
			if (args[i] != null && !args[i].promise && !$.isFunction(args[i].promise)) {
				fwLogger.info(FW_LOG_H5_WHEN_INVALID_PARAMETER);
				break;
			}
		}
		/* del end */

		var dfd = $.Deferred();

		if (!dfd.notify && !dfd.notifyWith && !dfd.progress) {
			// progress/notify/notifyWithがない(jQueryのバージョンが1.6.x)場合、
			// progress/notifyが使用できるように、機能拡張したwhenをここで実装する
			// ( $.when()を使いながら機能追加ができないため、$.when自体の機能をここで実装している。)
			var len = args.length;
			var count = len;
			var pValues = [];
			var firstParam = args[0];

			dfd = len <= 1 && firstParam && $.isFunction(firstParam.promise) ? firstParam
					: getDeferred();

			if (len > 1) {
				// 複数のパラメータを配列でまとめて指定できるため、コールバックの実行をresolveWith/rejectWith/notifyWithで行っている
				function resolveFunc(index) {
					return function(value) {
						args[index] = arguments.length > 1 ? argsToArray(arguments) : value;
						if (!(--count)) {
							dfd.resolveWith(dfd, args);
						}
					};
				}
				function progressFunc(index) {
					return function(value) {
						pValues[index] = arguments.length > 1 ? argsToArray(arguments) : value;
						dfd.notifyWith(dfd.promise(), pValues);
					};
				}
				for ( var i = 0; i < len; i++) {
					if (args[i] && $.isFunction(args[i].promise)) {
						args[i].promise().then(resolveFunc(i), dfd.reject, progressFunc(i));
					} else {
						--count;
					}
				}
				if (!count) {
					dfd.resolveWith(dfd, args);
				}
			} else if (dfd !== firstParam) {
				dfd.resolveWith(dfd, len ? [firstParam] : []);
			}
		} else {
			// jQuery1.7以上なら戻り値をh5.async.deferredにして、$.whenをラップする
			dfd = getDeferred();

			$.when.apply($, args).done(function(/* var_args */) {
				dfd.resolveWith(dfd, argsToArray(arguments));
			}).fail(function(/* var_args */) {
				dfd.rejectWith(dfd, argsToArray(arguments));
			}).progress(function(/* ver_args */) {
				dfd.notifyWith(dfd, argsToArray(arguments));
			});
		}

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
		when: when,
		isPromise: isPromise,
		loop: loop
	});

})();
