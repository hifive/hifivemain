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

	/**
	 * h5.async.deferredがcommonFailHandlerの管理のために上書くjQuery.Deferredのメソッド (failコールバックを登録する可能性のある関数)
	 *
	 * @private
	 * @type {Array}
	 */
	var CFH_HOOK_METHODS = ['fail', 'always', 'pipe', 'then'];

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
		var progressCallbacks = [];

		// progress,notify,notifyWithを追加
		dfd.progress = function(progressCallback) {
			// 既にnorify/notifyWithが呼ばれていた場合、jQuery1.7以降の仕様と同じにするためにコールバックの登録と同時に実行する必要がある
			if (notified) {
				var params = lastNotifyParam;
				if (params !== lastNotifyParam) {
					params = wrapInArray(params);
				}
				progressCallback.apply(lastNotifyContext, params);
			}
			progressCallbacks.push(progressCallback);
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
			var args = argsToArray(arguments);
			// progressコールバックが登録されていたら全て実行する
			if (progressCallbacks.length > 0) {
				for ( var i = 0, callbackLen = progressCallbacks.length; i < callbackLen; i++) {
					var params = args;
					if (params !== arguments) {
						params = wrapInArray(params);
					}
					progressCallbacks[i].apply(this, params);
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
		} else if (rootDfd) {
			// rootDfdが指定されていればrootDfd.progressでpromise.progressを上書き
			promise.progress = rootDfd.progress;
		}

		// failコールバックが1つ以上登録されたかどうかのフラグ
		var existFailHandler = false;
		//commonFailHandlerが発火済みかどうかのフラグ
		var isCommonFailHandlerFired = false;

		// ---------------------------------------------
		// 以下書き換える(フックする)必要のある関数を書き換える
		// ---------------------------------------------

		// jQueryが持っているもともとのコールバック登録メソッドを保持するオブジェクト
		var originalMethods = {};
		// フックしたメソッドを保持するオブジェクト
		var hookMethods = {};

		/**
		 * 指定されたメソッドを、フックされたコールバック登録関数を元に戻してから呼ぶ
		 *
		 * @private
		 * @memberOf Deferred
		 * @param {String} method メソッド名
		 * @param {Array|Any} メソッドに渡す引数。Arrayで複数渡せる。引数1つならそのまま渡せる。
		 */
		promise._h5UnwrappedCall = function(method, args) {
			args = wrapInArray(args);
			// originalに戻す
			$.extend(promise, originalMethods);
			// originalに戻した状態でmethodを実行
			var ret = promise[method].apply(this, args);
			// フックされたものに戻す
			$.extend(promise, hookMethods);

			return ret;
		};


		// commonFailHandlerのフラグ管理のために関数を上書きするための関数
		function override(method) {
			if (rootDfd) {
				if (!rootDfd[method]) {
					return;
				}
				promise[method] = rootDfd[method];
				return;
			}
			var originalFunc = promise[method];
			originalMethods[method] = originalFunc;
			promise[method] = (function(_method) {
				return function() {
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
					// オリジナルのコールバック登録メソッドを呼ぶ
					return promise._h5UnwrappedCall.call(this, method, argsToArray(arguments));
				};
			})(method);
			hookMethods[method] = promise[method];
		}

		// failコールバックを登録する可能性のある関数を上書き
		for ( var i = 0, l = CFH_HOOK_METHODS.length; i < l; i++) {
			var prop = CFH_HOOK_METHODS[i];
			if (promise[prop]) {
				// cfhの管理をするための関数でオーバーライド
				override(prop);
			}
		}

		// pipeは戻り値が呼び出したpromise(またはdeferred)と違うので、
		// そのdeferred/promiseが持つメソッドの上書きをして返す関数にする。
		// jQuery1.6以下にない第3引数でのprogressコールバックの登録にも対応する。
		// rootDfdがあればrootDfd.pipeを持たせてあるので何もしない。
		if (promise.pipe && !rootDfd) {
			var pipe = promise.pipe;
			promise.pipe = function() {
				var ret = toCFHAware(pipe.apply(this, arguments));

				// もともとprogressを持っている(=pipeが第三引数でのprogressFilter登録に対応している)
				// または、第3引数がない(=progressFilterの登録がない)ならそのままretを返す
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
			hookMethods.pipe = promise.pipe;
		}

		// thenは戻り値が呼び出したpromise(またはdeferred)と違う(jQuery1.8以降)なら、
		// そのdeferred/promiseが持つメソッドの上書きをして返す関数にする
		// jQuery1.6対応で、第3引数にprogressFilterが指定されていればそれを登録する
		// rootDfdがあればrootDfd.thenを持たせてあるので何もしない
		if (promise.then && !rootDfd) {
			var then = promise.then;
			promise.then = function(/* var_args */) {
				var args = arguments;
				var ret = then.apply(this, args);
				if (ret !== this) {
					// jQuery1.7以前は、thenを呼んだ時のthisが返ってくる(deferredから呼んだ場合はdeferredオブジェクトが返る)。
					// jQuery1.8以降は、thenが別のdeferredに基づくpromiseを生成して返ってくる。
					// 1.8以降であれば、promiseの関数を上書いてから返す
					return toCFHAware(ret);
				}

				// 第3引数にprogressFilterが指定されていて、かつprogressメソッドがjQueryにない(1.6以前)場合
				// promise.progressに登録する
				if (!hasNativeProgress && hasValidCallback(args[2])) {
					promise.progress.call(promise, args[2]);
				}

				// thenがthisを返した場合(jQuery1.7以前)ならそのままthis(=ret)を返す
				return ret;
			};
			hookMethods.then = promise.then;
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
	 * href="./h5.settings.html#commonFailHandler">commonFailHandler</a>)を実行します。(※
	 * whenに渡したpromiseについてのcommonFailHandlerは動作しなくなります。)</li>
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
		var args = argsToArray(arguments);

		if (args.length === 1 && $.isArray(args[0])) {
			args = args[0];
		}

		/* del begin */
		// 引数にpromise・deferredオブジェクト以外があった場合はログを出力します。
		for ( var i = 0, l = args.length; i < l; i++) {
			// DeferredもPromiseも、promiseメソッドを持つので、
			// promiseメソッドがあるかどうかでDeferred/Promiseの両方を判定しています。
			if (!args[i] || !(args[i].promise && $.isFunction(args[i].promise))) {
				fwLogger.info(FW_LOG_H5_WHEN_INVALID_PARAMETER);
				break;
			}
		}
		/* del end */

		// $.when相当の機能を実装する。
		// 引数が一つでそれがプロミスだった場合はそのpromiseをそのまま返し、新しいdeferredを作らない
		// そのプロミスがCFHAwareでなければCFHAware化して返す
		var len = args.length;
		var dfd;
		// 引数が1つで、それがdeferred/promiseオブジェクトならそのpromiseを返します。
		// awareでないdeferred/promiseなら、aware化して返します。
		if (len == 1 && args[0] && $.isFunction(args[0].promise)) {
			dfd = args[0].promise();
			if (!dfd._h5UnwrappedCall) {
				dfd = toCFHAware(dfd);
			}
			return dfd;
		}

		// whenのdfd
		dfd = h5.async.deferred();

		// $.whenを呼び出して、dfdと紐づける
		var ret = $.when.apply($, args).done(function(/* var_args */) {
			dfd.resolveWith(this, argsToArray(arguments));
		}).fail(function(/* var_args */) {
			dfd.rejectWith(this, argsToArray(arguments));
		});

		// progressがある(jQuery1.7以降)ならそのままprogressも登録
		if (ret.progress) {
			ret.progress(function(/* ver_args */) {
				dfd.notifyWith(dfd, argsToArray(arguments));
			});
		} else {
			// progressがない(=jQuery1.6.x)なら、progress機能を追加

			// progressの引数になる配列。
			// pValuesにはあらかじめundefinedを入れておく($.whenと同じ。progressフィルタ内のarguments.lengthは常にargs.lengthと同じ)
			var pValues = [];
			for ( var i = 0; i < l; i++) {
				pValues[i] = undefined;
			}
			function progressFunc(index) {
				// args中の該当するindexに値を格納した配列をprogressコールバックに渡す
				return function(value) {
					pValues[index] = arguments.length > 1 ? argsToArray(arguments) : value;
					// TODO notify/notifyWithの時のthisは？
					dfd.notifyWith(dfd.promise(), pValues);
				};
			}
			for ( var i = 0; i < len; i++) {
				var p = args[i];
				if (p && $.isFunction(p.promise)) {
					// progressはjQuery1.6で作られたdeferred/promiseだとないので、あるかどうかチェックして呼び出す
					p.progress && p.progress(progressFunc(i));
				}
			}
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
