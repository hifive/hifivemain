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

/* ------ h5.validation ------ */
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
	 * ルールオブジェクトで判定順序を指定する場合に使用するプロパティ名
	 */
	var PROPERTY_NAME_ORDER = '_order';

	/**
	 * デフォルトで定義済みのルール名
	 */
	var DEFAULT_RULE_NAME_REQUIRE = 'require';
	var DEFAULT_RULE_NAME_CUSTOM_FUNC = 'customFunc';
	var DEFAULT_RULE_NAME_NUL = 'nul';
	var DEFAULT_RULE_NAME_NOT_NULL = 'notNull';
	var DEFAULT_RULE_NAME_ASSERT_FALSE = 'assertFalse';
	var DEFAULT_RULE_NAME_ASSERT_TRUE = 'assertTrue';
	var DEFAULT_RULE_NAME_MAX = 'max';
	var DEFAULT_RULE_NAME_MIN = 'min';
	var DEFAULT_RULE_NAME_FUTURE = 'future';
	var DEFAULT_RULE_NAME_PAST = 'past';
	var DEFAULT_RULE_NAME_DIGITS = 'digits';
	var DEFAULT_RULE_NAME_PATTERN = 'pattern';
	var DEFAULT_RULE_NAME_SIZE = 'size';

	/**
	 * ValidationResultのイベント名
	 */
	var EVENT_VALIDATE = 'validate';
	var EVENT_VALIDATE_COMPLETE = 'validateComplete';
	var EVENT_VALIDATE_ABORT = 'abort';

	// =============================
	// Development Only
	// =============================
	/* del begin */
	var fwLogger = h5.log.createLogger('h5.core');

	// ログメッセージ
	var FW_LOG_NOT_DEFINED_RULE_NAME = '指定されたルール{0}は未定義です';
	/* del end */

	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var isPromise = h5.async.isPromise;

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	// =============================
	// Variables
	// =============================
	var validateRuleManager = new ValidateRuleManager();
	// =============================
	// Functions
	// =============================
	// =============================
	// FIXME h5.core.dataからコピペ
	// =============================
	/**
	 * 引数がNaNかどうか判定する。isNaNとは違い、例えば文字列はNaNではないのでfalseとする
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @returns {boolean} 引数がNaNかどうか
	 */
	function isStrictNaN(val) {
		return typeof val === 'number' && isNaN(val);
	}

	/**
	 * 引数を2つ取り、両方ともisStrictNaNかどうか判定する
	 *
	 * @private
	 * @param {Any} val1 判定する値
	 * @param {Any} val2 判定する値
	 * @returns {boolean} 引数が2つともNaNかどうか
	 */
	function isBothStrictNaN(val1, val2) {
		return isStrictNaN(val1) && isStrictNaN(val2);
	}

	/**
	 * type:'number' 指定のプロパティに代入できるかのチェック null,undefined,NaN,parseFloatしてNaNにならないもの
	 * に当てはまる引数についてtrueを返す
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
	 * @returns {boolean} type:'number'指定のプロパティに代入可能か
	 */
	function isNumberValue(val, isStrict) {
		// nullまたはundefinedはtrue
		// NaNを直接入れた場合はtrue
		// new Number() で生成したオブジェクトはtrue
		// 文字列の場合は、[±(数字)(.数字)]で構成されている文字列ならOKにする
		// ※ parseFloatよりも厳しいチェックにしている。
		// "1.2", "+1.2", "1", ".2", "-.2" はOK。
		// "12.3px"、"12.3.4"、"123.", [12.3, 4] はいずれもparseFloatできるが、ここではNG。
		return val == null
				|| isStrictNaN(val)
				|| typeof val === 'number'
				|| (!isStrict && (val instanceof Number || !!((isString(val) || val instanceof String) && !!val
						.match(/^[+\-]{0,1}[0-9]*\.{0,1}[0-9]+$/))));
	}

	/**
	 * type:'integer' 指定のプロパティに代入できるかのチェック null,undefined,parseFloatとparsFloatの結果が同じもの(NaNは除く)
	 * に当てはまる引数についてtrueを返す
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
	 * @returns {boolean} type:'integer'指定のプロパティに代入可能か
	 */
	function isIntegerValue(val, isStrict) {
		// parseIntとparseFloatの結果が同じかどうかで整数値かどうかの判定をする
		// typeofが'nubmer'または、new Number()で生成したオブジェクトで、parseFloatとparseIntの結果が同じならtrue
		// NaN, Infinity, -Infinityはfalseを返す(parseInt(Infinity)はNaNであるので、InfinityはIntじゃない扱いにする
		// 文字列の場合は、[±数字]で構成されている文字列ならOKにする
		// ※ parseIntよりも厳しいチェックにしている。"12px"、"12.3"、[12,3] はいずれもparseIntできるが、ここではNG。
		return val == null
				|| (typeof val === 'number' && parseInt(val) === val)
				|| (!isStrict && (val instanceof Number && parseInt(val) === parseFloat(val) || (typeof val === 'string' || val instanceof String)
						&& !!val.match(/^[+\-]{0,1}[0-9]+$/)));
	}

	/**
	 * type:'string' 指定のプロパティに代入できるかのチェック
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
	 * @returns {boolean} type:'string'指定のプロパティに代入可能か
	 */
	function isStringValue(val, isStrict) {
		return !!(val == null || isString(val) || (!isStrict && val instanceof String));
	}

	/**
	 * type:'boolean' 指定のプロパティに代入できるかのチェック
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @param {Boolean} isStrict 厳密に判定するかどうか。isStrict === trueなら型変換可能でも型が違えばfalseを返す
	 * @returns {boolean} type:'boolean'指定のプロパティに代入可能か
	 */
	function isBooleanValue(val, isStrict) {
		return val == null || typeof val === 'boolean' || (!isStrict && val instanceof Boolean);
	}

	/**
	 * Validatorクラス
	 * <p>
	 * 追加されたルールに基づいてオブジェクトのバリデートを行うためのクラスです。
	 * </p>
	 * <p>
	 * {@link h5.validation.createValidator}がこのクラスのインスタンスを返します
	 * </p>
	 *
	 * @class
	 * @name Validator
	 */
	function Validator() {
		this._rule = {};
	}
	$.extend(Validator.prototype, {
		/**
		 * パラメータのバリデートを行う
		 * <p>
		 * 第1引数にはバリデート対象となるオブジェクト、第2引数には第1引数のオブジェクトのうち、バリデートを行うキー名(複数の場合は配列)を指定します。
		 * </p>
		 * <p>
		 * 第2引数を省略した場合は第1引数のオブジェクトが持つすべてのキーがバリデート対象になります。
		 * </p>
		 * <p>
		 * バリデートは{@link Validator.addRule}によって登録されたルールで行われます。
		 * </p>
		 *
		 * @memberOf Validator
		 * @param {Object} obj バリデート対象となるオブジェクト
		 * @param {string|string[]} [names] 第1引数オブジェクトのうち、バリデートを行うキー名またはその配列(指定無しの場合は全てのキーが対象)
		 * @returns {ValidationResult} バリデート結果
		 */
		validate: function(obj, names) {
			var validProperties = [];
			var invalidProperties = [];
			var allProperties = [];
			var validatingProperties = [];
			var failureReason = null;
			var targetNames = names && (isArray(names) ? names : [names]);
			var isAsync = false;
			// プロパティ名、プロミスのマップ。1プロパティにつき非同期チェックが複数あればプロミスは複数
			var propertyWaitingPromsies = {};
			for ( var prop in this._rule) {
				if (names && $.inArray(prop, targetNames) === -1) {
					continue;
				}
				var rule = this._rule[prop];
				var orgValue = obj[prop];
				var isInvalidProp = false;
				var isAsyncProp = false;
				// TODO order対応
				//				var order = rule[PROPERTY_NAME_ORDER];

				for ( var ruleName in rule) {
					var args = rule[ruleName];
					if ((!obj.hasOwnProperty(prop) || args == null)
							&& !(ruleName === DEFAULT_RULE_NAME_REQUIRE && args)) {
						// そもそもvalidate対象のオブジェクトにチェック対象のプロパティがない場合、チェックしない
						// また、argsがundefinedならそのルールはチェックしない
						// ただし、require指定がある場合はチェックする
						continue;
					}
					// 値の型変換
					var value = this._convertBeforeValidate ? this._convertBeforeValidate(orgValue,
							ruleName) : orgValue;
					if (isArray(args)) {
						args = [value].concat(args);
					} else {
						args = [value, args];
					}
					var validateFunc = validateRuleManager.getValidateFunction(ruleName);
					if (!validateFunc) {
						fwLogger.warn(FW_LOG_NOT_DEFINED_RULE_NAME, ruleName);
						break;
					}

					var ret = validateFunc.apply(this, args);

					// validate関数呼び出し時の引数を格納しておく
					var param = {};
					var argNames = validateRuleManager.getValidateArgNames(ruleName);
					if (argNames) {
						for (var i = 0, l = argNames.length; i < l; i++) {
							param[argNames[i]] = args[i + 1];
						}
					}

					// 非同期の場合
					if (isPromise(ret) && !isRejected(ret) && !isResolved(ret)) {
						// pendingのプロミスが返ってきた場合
						// 結果が返ってきたらvalidateイベントをあげるようにしておく
						isAsyncProp = true;
						propertyWaitingPromsies[prop] = propertyWaitingPromsies[prop] || [];
						// プロミス自体にルール名と値と引数を覚えさせておく
						propertyWaitingPromsies[prop].push(ret.promise({
							ruleName: ruleName,
							value: value,
							param: param
						}));
					}

					// 同期の場合
					if (!ret || isPromise(ret) && isResolved(ret)) {
						// validate関数がfalseを返したまたは、promiseを返したけどすでにreject済みの場合はvalidate失敗
						// failureReasonの作成
						failureReason = failureReason || {};
						failureReason[prop] = this._createFailureReason(ruleName, value, param);
						isInvalidProp = true;
						// あるルールでinvalidなら他のルールはもう検証しない
						break;
					}
				}
				if (isAsyncProp) {
					isAsync = true;
					validatingProperties.push(prop);
				} else {
					(isInvalidProp ? invalidProperties : validProperties).push(prop);
				}
				allProperties.push(prop);
			}
			var isValid = !invalidProperties.length;
			var validationResult = new ValidationResult({
				validProperties: validProperties,
				invalidProperties: invalidProperties,
				validatingProperties: validatingProperties,
				allProperties: allProperties,
				failureReason: failureReason,
				isAsync: isAsync,
				// isValidは現時点でvalidかどうか(非同期でvalidateしているものは関係ない)
				isValid: isValid,
				// 非同期でvalidateしているものがあって決まっていない時はisAllValidはnull
				isAllValid: isAsync ? null : isValid
			});

			if (isAsync) {
				var that = this;
				// 非同期の場合、結果が返って気次第イベントをあげる
				for ( var prop in propertyWaitingPromsies) {
					var promises = propertyWaitingPromsies[prop];
					var doneHandler = (function(_prop) {
						return function() {
							// 既にinvalidになっていたらもう何もしない
							if ($.inArray(_prop, validationResult.invalidProperties) !== -1) {
								return;
							}
							validationResult.dispatchEvent({
								type: EVENT_VALIDATE,
								property: _prop,
								value: obj[_prop], // validate対象のオブジェクトに指定された値
								isValid: true
							});
						};
					})(prop);
					var failHandler = (function(_prop, _promises, _param) {
						return function() {
							// 一つでも失敗したらfailCallbackが実行される
							// 既にinvalidになっていたらもう何もしない
							if ($.inArray(_prop, validationResult.invalidProperties) !== -1) {
								return;
							}
							// どのルールのプロミスがrejectされたか
							var ruleName, value;
							for (var i = 0, l = _promises.length; i < l; i++) {
								var p = _promises[i];
								if (isRejected(p)) {
									ruleName = p.ruleName;
									value = p.value, // ruleNameでのバリデート用に変換された値
									param = p.param;
									break;
								}
							}
							validationResult.dispatchEvent({
								type: EVENT_VALIDATE,
								property: _prop,
								isValid: false,
								failureReason: that._createFailureReason(ruleName, value, param,
										arguments),
							});
						};
					})(prop, promises);
					// failハンドラでどのプロミスの失敗かを判定したいのでwaitForPromisesではなくwhenを使用している
					$.when.apply($, promises).done(doneHandler).fail(failHandler);
				}
			}
			return validationResult;
		},

		/**
		 * バリデートルールを追加する
		 * <p>
		 * {@link Validator.validate}でバリデートを行う際のバリデートルールを追加します。
		 * </p>
		 * <p>
		 * バリデートルールは以下のようなオブジェクトで指定します。
		 *
		 * <pre class="sh_javascript"><code>
		 * validator.addRule({
		 * 	// 対象となるプロパティ名(userid)をキーにする
		 * 		userid: {
		 * 			// ルール名: 該当ルールのパラメータ。パラメータを取らないルールの場合はtrueを指定。複数のパラメータを取るルールの場合は配列指定。
		 * 			require: true,
		 * 			pattern: /&circ;[a-z|0-9]*$/,
		 * 			size: [4, 10]
		 * 		}
		 * 	});
		 * </code></pre>
		 *
		 * 上記の場合、useridは指定が必須(require指定)かつ/&circ;[a-z|0-9]*$/の正規表現を満たし(pattern指定)、4文字以上10字以下(size指定)のルールを追加しています。
		 * </p>
		 * <p>
		 * 以下のようなルールが標準で定義されています。また{@link h5.validation.defineRule}で独自ルールを定義することもできます。
		 * </p>
		 * <table><thead>
		 * <tr>
		 * <th>ルール名</th>
		 * <th>パラメータ</th>
		 * <th>定義</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td>require</td>
		 * <td>なし</td>
		 * <td>値がnull,undefined,空文字のいずれでもないこと</td>
		 * </tr>
		 * <tr>
		 * <td>customFunc</td>
		 * <td>func</td>
		 * <td>funcには第1引数に値を取る関数を指定する。funcがtrueを返すこと。</td>
		 * </tr>
		 * <tr>
		 * <td>nul</td>
		 * <td>なし</td>
		 * <td>値がnullまたはundefinedであること</td>
		 * </tr>
		 * <tr>
		 * <td>notNull</td>
		 * <td>なし</td>
		 * <td>値がnullまたはundefinedでないこと</td>
		 * </tr>
		 * <tr>
		 * <td>assertFalse</td>
		 * <td>なし</td>
		 * <td>値がfalseであること</td>
		 * </tr>
		 * <tr>
		 * <td>assertTrue</td>
		 * <td>なし</td>
		 * <td>値がtrueであること</td>
		 * </tr>
		 * <tr>
		 * <td>max</td>
		 * <td>[max, inclusive]</td>
		 * <td>inclusiveは省略可能。値がmax未満の数値であること。またinclusiveにtrueを指定した場合は境界値にmaxも含める(値がmax以下であること)。</td>
		 * </tr>
		 * <tr>
		 * <td>min</td>
		 * <td>[mix, inclusive]</td>
		 * <td>inclusiveは省略可能。値がminより大きい数値であること。またinclusiveにtrueを指定した場合は境界値にminも含める(値がmin以上であること)。</td>
		 * </tr>
		 * <tr>
		 * <td>future</td>
		 * <td>なし</td>
		 * <td>値がDate型で現在時刻より未来であること。</td>
		 * </tr>
		 * <tr>
		 * <td>past</td>
		 * <td>なし</td>
		 * <td>値がDate型で現在時刻より過去であること。</td>
		 * </tr>
		 * <tr>
		 * <td>digits</td>
		 * <td>[integer, fruction]</td>
		 * <td>数値の桁数判定。整数部分がinteger桁数以下でありかつ小数部分がfruction桁数以下であること</td>
		 * </tr>
		 * <tr>
		 * <td>pattern</td>
		 * <td>[regexp]</td>
		 * <td>regexpには正規表現を指定。値がregexpを満たす文字列であること</td>
		 * </tr>
		 * <tr>
		 * <td>size</td>
		 * <td>[min, max]</td>
		 * <td>値のサイズがmin以上max以下であること。ただし、値がプレーンオブジェクトの場合はプロパティの数、配列または文字列の場合はその長さをその値のサイズとする。</td>
		 * </tr>
		 * </tbody></table>
		 *
		 * @memberOf Validator
		 * @param {Object}
		 */
		addRule: function(ruleObject) {
			for ( var prop in ruleObject) {
				var propRule = ruleObject[prop];
				// 既に適用ルールが定義されているプロパティについては上書き
				this._rule[prop] = propRule;
			}
		},

		/**
		 * ルールの削除
		 * <p>
		 * {@link Validator.addRule}で追加したプロパティルールを削除します。
		 * </p>
		 * <p>
		 * ルールの削除はプロパティ単位で行います。第1引数に対象となるプロパティ名を指定(複数指定可)します。
		 * </p>
		 *
		 * @memberOf Validator
		 * @param {string|string[]} keys プロパティ名またはその配列
		 */
		removeRule: function(keys) {
			if (!isArray(keys)) {
				delete this._rule[keys];
			}
			for (var i = 0, l = keys.length; i < l; i++) {
				delete this._rule[keys[i]];
			}
		},

		/**
		 * このValidatorでバリデートするときのルールの適用順序を指定します
		 *
		 * @memberOf Validator
		 * @param ruleOrder
		 */
		setOrder: function(ruleOrder) {
		// TODO 未実装
		},

		/**
		 * ValidationResultに格納するfailureReasonオブジェクトを作成する
		 *
		 * @private
		 * @memberOf Validator
		 * @param ruleName
		 * @param value
		 * @param param
		 * @param rejectReason 非同期バリデートの場合、failハンドラに渡された引数リスト
		 */
		_createFailureReason: function(ruleName, value, param, failHandlerArgs) {
			var ret = {
				rule: ruleName,
				value: value,
				param: param
			};
			if (failHandlerArgs) {
				ret.rejectReason = h5.u.obj.argsToArray(failHandlerArgs);
			}
			return ret;
		}
	});

	/**
	 * FormValidatorクラス
	 * <p>
	 * フォーム要素を集約したオブジェクトのバリデートを行うためのクラスです。
	 * </p>
	 * <p>
	 * {@link h5.validation.createValidator}の引数に'form'を指定するとこのクラスのインスタンスが生成されます。
	 * </p>
	 * <p>
	 * このクラスは{@link Validator}クラスを継承しています。
	 * </p>
	 * <p>
	 * {@link Validator}クラスとの違いは、フォーム部品に入力された文字列を、バリデートルールごとに適切な型に変換してからバリデートを行う点(例えばmaxルールなら数値に変換など)と、
	 * グループ単位のバリデートに対応しています。
	 * </p>
	 * <p>
	 * グループ単位のバリデートについては{@link FormValidator.validate}を参照してください。
	 * </p>
	 *
	 * @class
	 * @name FormValidator
	 * @extends Validator
	 */
	function FormValidator() {
		this._rule = {};
	}
	$.extend(FormValidator.prototype, Validator.prototype, {
		/**
		 * フォームオブジェクトのvalidateを行う
		 * <p>
		 * バリデートの基本的な動作については{@link Validator.validate}を参照してください。
		 * </p>
		 * <p>
		 * FormValidatorはバリデートルールごとにバリデート対象の値を適切な型に変換してからバリデートを行います。
		 * 例えば、値が"1"という文字列であってもmaxルールで判定する場合は1という数値に対してバリデートを行います。
		 * </p>
		 * <p>
		 * また、 グループとそのグループ内のプロパティについてのvalidateに対応しています。
		 * </p>
		 * <p>
		 * グループとは、第1引数のオブジェクトの中に、オブジェクトを値として持つプロパティがある場合、それをグループと言います。
		 * そのグループ単位でのバリデートも行い、さらにグループ内のプロパティについてのバリデートを行います。
		 * </p>
		 * <p>
		 * グループはネストすることはできません。
		 * </p>
		 * <p>
		 * 以下はbirthdayをグループとして扱いvalidateを行う場合の例です。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * var formValidator = h5.u.validation.createValidator('form');
		 * formValidator.addRule({
		 * 	birthday: {
		 * 		customFunc: function(val) {
		 * 			// 日付として正しいか判定する
		 * 			!isNaN(new Date(val.year, val.month - 1, val.date).getTime());
		 * 		}
		 * 	},
		 * 	year: {
		 * 		require: true
		 * 	},
		 * 	month: {
		 * 		require: true
		 * 	},
		 * 	day: {
		 * 		require: true
		 * 	}
		 * });
		 * formValidator.validate({
		 * 	birthday: {
		 * 		year: 1999,
		 * 		month: 1,
		 * 		date: 1
		 * 	}
		 * });
		 * </code></pre>
		 *
		 * <p>
		 * グループはそのグループ(birthday)のルールによるvalidateが行われる。
		 * </p>
		 * <p>
		 * また、year,month,dayもそれぞれのルールに基づいてvalidateが行われる。
		 * </p>
		 *
		 * @memberOf FormValidator
		 * @param {Object} obj バリデート対象となるオブジェクト
		 * @param {string|string[]} [names] 第1引数オブジェクトのうち、バリデートを行うキー名またはその配列(指定無しの場合は全てのキーが対象)
		 * @returns {ValidationResult} バリデート結果
		 */
		validate: function(obj, names) {
			// グループ対応。値がオブジェクトのものはグループとして扱う
			var validateTarget = {};
			var inGroupNames = [];
			for ( var p in obj) {
				if ($.isPlainObject(obj[p])) {
					// オブジェクトの場合はその中身も展開してvalidateされるようにする
					// なお、グループの入れ子は考慮していない
					for ( var prop in obj[p]) {
						validateTarget[prop] = obj[p][prop];
						inGroupNames.push(prop);
					}
				}
				validateTarget[p] = obj[p];
			}
			var validateNames = null;
			if (names) {
				validateNames = ($.isArray(names) ? names.slice(0) : [names]).concat(inGroupNames);
			}
			return Validator.prototype.validate.call(this, validateTarget, validateNames);
		},

		/**
		 * Formから取得した値のvalidateのために、値をルールに適した型へ変換を行う
		 *
		 * @private
		 * @memberOf FormValidator
		 * @param {Any} value
		 * @param {string} ruleName ルール名
		 */
		_convertBeforeValidate: function(value, ruleName) {
			switch (ruleName) {
			case DEFAULT_RULE_NAME_DIGITS:
			case DEFAULT_RULE_NAME_MAX:
			case DEFAULT_RULE_NAME_MIN:
				return parseFloat(value);
			case DEFAULT_RULE_NAME_FUTURE:
			case DEFAULT_RULE_NAME_PAST:
				return new Date(value);
			}
			return value;
		}
	});

	/**
	 * ValidationResultにデフォルトで登録するvalidateイベントリスナ
	 *
	 * @private
	 */
	function validateEventListener(ev) {
		// thisはvalidationResult
		// このハンドラがユーザが追加するハンドラより先に動作する前提(EventDispatcherがそういう実装)
		// 非同期validateの結果をValidationResultに反映させる
		var prop = ev.property;
		if (ev.isValid) {
			this.validProperties.push(prop);
			this.validCount++;
		} else {
			this.isValid = false;
			this.invalidProperties.push(prop);
			this.invalidCount++;
			this.failureReason = this.failureReason || {};
			this.failureReason[prop] = this.failureReason[prop] || ev.failureReason;
		}
		this.validatingProperties.splice(this.validatingProperties.indexOf(prop), 1);

		if (this.validCount + this.invalidCount === this.allProperties.length) {
			this.isAllValid = this.isValid;
			this.dispatchEvent({
				type: EVENT_VALIDATE_COMPLETE
			});
		}
	}

	/**
	 * validation結果クラス
	 * <p>
	 * バリデート結果を保持するクラスです。{@link Validator.validate}、{@link FormValidator.validate}がこのクラスのインスタンスを返します。
	 * </p>
	 * <p>
	 * このクラスは{@link EventDispatcher}のメソッドを持ち、イベントリスナを登録することができます。
	 * </p>
	 * <p>
	 * このクラスは非同期バリデートの完了を通知するために以下のイベントをあげます。
	 * </p>
	 * <dl>
	 * <dt>validate</dt>
	 * <dd>
	 * <p>
	 * 非同期バリデートを行っているプロパティについて、どれか1つのバリデートが完了した。
	 * </p>
	 * <p>
	 * 以下のようなイベントオブジェクトを通知します。
	 * </p>
	 *
	 * <pre class="sh_javascript"><code>
	 * {
	 * 	type: 'validate'
	 * 	property: // バリデートが完了したプロパティ名
	 * 	value: // バリデート対象の値
	 * 	isValid: // バリデート結果(true/false)
	 * 	failureReason:
	 * 	// 失敗時のみ。該当プロパティについてのバリデート失敗理由({@link ValidationResult.failureReason}[property]}と同じ。)
	 * }
	 * </code></pre>
	 *
	 * </dd>
	 * <dt>validateComplete</dt>
	 * <dd>非同期バリデートを行っているすべてのプロパティのバリデートが完了した。
	 * <p>
	 * 以下のようなイベントオブジェクトを通知します。
	 * </p>
	 *
	 * <pre class="sh_javascript"><code>
	 * {
	 * 	type: 'validateComplete'
	 * }
	 * </code></pre>
	 *
	 * </dd>
	 * <dt>abort</dt>
	 * <dd>非同期バリデートが中断された。
	 * <p>
	 * 以下のようなイベントオブジェクトを通知します。
	 * </p>
	 *
	 * <pre class="sh_javascript"><code>
	 * {
	 * 	type: 'abort'
	 * }
	 * </code></pre>
	 *
	 * </dd>
	 * </dl>
	 *
	 * @class
	 * @name ValidationResult
	 * @mixes EventDispatcher
	 */
	/**
	 * @private
	 * @param result
	 */
	function ValidationResult(result) {
		/**
		 * バリデーション結果
		 * <p>
		 * 現在完了しているバリデート全てについてバリデートが通ったかどうかをtrueまたはfalseで保持します。
		 * </p>
		 *
		 * @memberOf ValidationResult
		 * @name isValid
		 * @type {boolean}
		 */
		this.isValid = result.isValid;

		/**
		 * バリデートの通ったプロパティ名の配列
		 *
		 * @memberOf ValidationResult
		 * @name validProperties
		 * @type {string[]}
		 */
		this.validProperties = result.validProperties;

		/**
		 * バリデートの通らなかったプロパティ名の配列
		 *
		 * @memberOf ValidationResult
		 * @name invalidProperties
		 * @type {string[]}
		 */
		this.invalidProperties = result.invalidProperties;

		/**
		 * バリデートの終わっていないプロパティ名の配列
		 * <p>
		 * 非同期バリデートが完了していないプロパティ名がここに格納されます。 非同期バリデートが完了した時点で街頭プロパティはここから取り除かれ、{@link ValidationResult.validProperties}または{@link ValidationResult.invalidPropertes}に格納されます。
		 * </p>
		 *
		 * @memberOf ValidationResult
		 * @name validatingProperties
		 * @type {string[]}
		 */
		this.validatingProperties = result.validatingProperties;

		/**
		 * バリデート失敗理由
		 * <p>
		 * バリデート失敗の理由がここに格納されます。failureReasonは以下のようなオブジェクトです。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 *   &quot;プロパティ名&quot;: {
		 *     rule: 'max'                // バリデートを行ったルール
		 *     value: 101,                // バリデート対象の値
		 *     param: {inclusive: 100,},  // バリデート関数に渡されたパラメータ
		 *     rejectReason: // 非同期バリデートのみ。非同期バリデート関数が返したプロミスのfailハンドラに渡された引数リスト。
		 *   },
		 *   &quot;プロパティ名&quot;: {...},
		 *   &quot;プロパティ名&quot;: {...}
		 * }
		 * </code></pre>
		 *
		 * @memberOf ValidationResult
		 * @name failureReason
		 * @type {object}
		 */
		this.failureReason = result.failureReason;

		/**
		 * バリデート成功したプロパティ数
		 *
		 * @memberOf ValidationResult
		 * @name validCount
		 * @type {integer}
		 */
		this.validCount = result.validProperties.length;

		/**
		 * バリデート失敗したプロパティ数
		 *
		 * @memberOf ValidationResult
		 * @name invalidCount
		 * @type {integer}
		 */
		this.invalidCount = result.invalidProperties.length;

		/**
		 * 非同期バリデートがあるかどうか
		 *
		 * @memberOf ValidationResult
		 * @name isAsync
		 * @type {boolean}
		 */
		this.isAsync = result.isAsync;

		/**
		 * 非同期バリデートも含めすべてのプロパティがバリデート成功したかどうか
		 * <p>
		 * 非同期バリデートがあり、まだ結果が出ていない場合はnullです。
		 * </p>
		 *
		 * @memberOf ValidationResult
		 * @name isAllValid
		 * @type {boolean|null}
		 */
		this.isAllValid = result.isAllValid;

		/**
		 * バリデート対象のプロパティ名リスト
		 *
		 * @memberOf ValidationResult
		 * @name allProperties
		 * @type {string[]}
		 */
		this.allProperties = result.allProperties;

		this.addEventListener(EVENT_VALIDATE, validateEventListener);

		// abort()が呼ばれていたらdispatchEventを動作させない
		this.dispatchEvent = function() {
			if (this._aborted) {
				return;
			}
			ValidationResult.prototype.dispatchEvent.apply(this, arguments);
		};
	}
	// イベントディスパッチャ
	h5.mixin.eventDispatcher.mix(ValidationResult.prototype);
	/**
	 * 非同期バリデートを中止する
	 * <p>
	 * ValidationResultが非同期バリデート結果を待機している場合、このメソッドを呼ぶとバリデートを中止し、以降validate及びvalidateCompleteイベントをあげなくなります。
	 * </p>
	 *
	 * @memberOf ValidationResult
	 * @name abort
	 */
	ValidationResult.prototype.abort = function() {
		this.removeEventListener(EVENT_VALIDATE, validateEventListener);
		this.dispatchEvent({
			type: EVENT_VALIDATE_ABORT
		});
		this._aborted = true;
	};

	/**
	 * priority順に並べるための比較関数
	 *
	 * @private
	 * @param obj1
	 * @param obj2
	 * @returns {integer}
	 */
	function comparePriority(obj1, obj2) {
		var p1, p2;
		p1 = obj1.priority || Infinity;
		p2 = obj2.priority || Infinity;
		return p1 === p2 ? 0 : p1 - p2;
	}

	/**
	 * ルールオブジェクトの管理クラス
	 *
	 * @class
	 * @private
	 */
	function ValidateRuleManager() {
		// ルールを優先度順に並べたもの
		this.rules = [];
		// ルール名→ルールオブジェクトのマップ
		this.rulesMap = {};
	}
	$.extend(ValidateRuleManager.prototype, {
		addValidateRule: function(ruleName, func, argNames, priority) {
			var isExistAlready = this.rulesMap[ruleName];
			if (isExistAlready) {
				for (var i = 0, l = this.rules.length; i < l; i++) {
					if (this.rules[i].ruleName === ruleName) {
						this.rules.splice(i, 1);
						break;
					}
				}
			}
			var ruleObj = {
				ruleName: ruleName,
				func: func,
				priority: priority,
				argNames: argNames
			};
			this.rules.push(ruleObj);
			this.rulesMap[ruleName] = ruleObj;
		},
		getValidateFunction: function(ruleName) {
			return this.rulesMap[ruleName] && this.rulesMap[ruleName].func;
		},
		getValidateArgNames: function(ruleName) {
			return this.rulesMap[ruleName] && this.rulesMap[ruleName].argNames;
		}
	});
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * @namespace
	 * @memberOf h5.validation
	 * @name func
	 */
	var func = {
		/**
		 * 値を第2引数の関数で判定した結果を返す
		 *
		 * @memberOf h5.validaiton.func
		 */
		customFunc: function(value, func) {
			return func(value);
		},

		/**
		 * 値がfalseかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が真偽値でない場合はfalseを返します
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		assertFalse: function(value) {
			return value == null || isBooleanValue(value) && value == false;
		},

		/**
		 * 値がtrueかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が真偽値型でない場合はfalseを返します
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		assertTrue: function(value) {
			return value == null || isBooleanValue(value) && value == true;
		},

		/**
		 * 値が最大値より小さいかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 第2引数には最大値を指定して、その数値より小さいかどうか判定します。
		 * </p>
		 * <p>
		 * 第3引数にtrueを指定すると、値が最大値と等しい場合もtrueを返します(デフォルトはfalse)。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が数値型でない場合はfalseを返します
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @param {number} max 最大値
		 * @param {boolean} [inclusive=false] 境界値にmaxValueを含めるかどうか
		 * @returns {boolean}
		 */
		max: function max(value, max, inclusive) {
			return value == null || (isNumberValue(value, true) || value instanceof Number)
					&& (inclusive ? (value <= max) : (value < max));
		},

		/**
		 * 値が最小値より大きいかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 第2引数には最小値を指定して、その数値より大きいかどうか判定します。
		 * </p>
		 * <p>
		 * 第3引数にtrueを指定すると、値が最小値と等しい場合もtrueを返します(デフォルトはfalse)。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が数値型でない場合はfalseを返します
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @param {number} min 最小値
		 * @param {boolean} [inclusive=false] 境界値にmaxValueを含めるかどうか
		 * @returns {boolean}
		 */
		min: function(value, min, inclusive) {
			return value == null || (isNumberValue(value, true) || value instanceof Number)
					&& (inclusive ? (min <= value) : (min < value));
		},

		/**
		 * 値がnullかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * それ以外の場合はfalseを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		nul: function(value) {
			return value == null;
		},

		/**
		 * 値がnullでないかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はfalseを返します。
		 * </p>
		 * <p>
		 * それ以外の場合はtrueを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		notNull: function(value) {
			return value != null;
		},

		/**
		 * 値が現在時刻より未来かどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値がDate型でない場合はfalseを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		future: function(value) {
			return value == null || value instanceof Date && new Date().getTime() < value.getTime();
		},

		/**
		 * 値が現在時刻より過去かどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値がDate型でない場合はfalseを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		past: function(value) {
			return value == null || value instanceof Date && value.getTime() < new Date().getTime();
		},

		/**
		 * 値の桁数の判定を行い、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 第2引数には整数部分の桁数の上限を設定します。
		 * </p>
		 * <p>
		 * 第3引数には小数部分の桁数の上限を設定します。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が数値型でない場合はfalseを返します。
		 * </p>
		 * <p>
		 * 整数部分、小数部分いずれの桁数も境界値を含めます。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @param {integer} integer 整数桁数の上限値
		 * @param {integer} fruction 小数桁数の上限値
		 * @returns {boolean}
		 */
		digits: function(value, integer, fruction) {
			if (value == null) {
				return true;
			}
			var typeValid = (isNumberValue(value, true) || value instanceof Number)
					&& !isNaN(value) && value != Infinity && value != -Infinity;
			if (!typeValid) {
				return false;
			}

			// 正の数で考える
			var abs = value < 0 ? -value : value;

			if (integer != null) {
				// 整数部分判定
				if (abs >= Math.pow(10, integer)) {
					return false;
				}
			}

			if (fruction != null) {
				// 小数部分判定
				// 小数部分を出すのに絶対値を使って演算して求めると誤差が出る(例：1.1-1の結果が0.10000000000000009)
				// そのため、文字列にして判定する
				var str = '' + abs;
				if (str.indexOf('+') !== -1) {
					// 1.1e+50のような数の場合、小数部分はなし
					return true;
				}
				var pointMinus = str.indexOf('-');
				if (pointMinus !== -1) {
					// 1.1e-50のような数の場合、-の後の数値とfructionを比較
					return str.slice(pointMinus + 1) <= fruction;
				}
				var pointIndex = str.indexOf('.');
				if (pointIndex === -1) {
					// 小数点が無い場合はvalid
					return true;
				}
				// 小数部分の桁数がfruction以下の長さかどうか返す
				return str.slice(pointIndex + 1).length <= fruction;
			}
			// integerもfructionもどちらもnullならvalid
			return true;
		},

		/**
		 * 値が正規表現を満たすかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 第2引数に正規表現オブジェクトを指定し、その正規表現を満たすかどうかの判定を行います。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * 値が文字列型でない場合はfalseを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @param {RegExp} regexp 正規表現オブジェクト
		 * @returns {boolean}
		 */
		pattern: function(value, regexp) {
			return value == null || isStringValue(value) && regexp.test(value);
		},

		/**
		 * 値のサイズが範囲内であるかどうかを判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * サイズの判定対象となる値は配列、文字列、プレーンオブジェクトの何れかです。
		 * 配列の場合は配列の長さ、文字列の場合は文字数、プレーンオブジェクトの場合はプロパティをサイズとして扱い、判定の対象となります。
		 * </p>
		 * <p>
		 * その他の型の値の場合はfalseを返します。
		 * </p>
		 * <p>
		 * 第2引数でサイズの下限値、第3引数でサイズの上限値を指定し、その範囲内のサイズであるかどうかを判定します。上限値、下限値ともに境界を含めます。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 *
		 * @memberOf h5.validation.func
		 * @param {Any} value 判定する値
		 * @param {integer} min 下限値
		 * @param {integer} max 上限値
		 * @returns {boolean}
		 */
		size: function(value, min, max) {
			min = min || 0;
			max = max || Infinity;
			if ($.isPlainObject(value)) {
				// プレーンオブジェクトの場合プロパティの数をカウント
				var valueSize = 0;
				for ( var p in value) {
					valueSize++;
				}
				return min <= valueSize && valueSize <= max;
			}
			return value == null || (isStringValue(value) || isArray(value)) && min <= value.length
					&& value.length <= max;
		}
	};

	function createValidator(type) {
		if (type === 'form') {
			return new FormValidator();
		}
		return new Validator();
	}

	/**
	 * ルール定義の追加
	 * <p>
	 * {@link Validator.addRule}で追加するルールはここで追加されたルール定義が使用されます。
	 * </p>
	 * <p>
	 * 第1引数にはルール名を指定します。
	 * </p>
	 * <p>
	 * 第2引数にはバリデート関数を指定します。 バリデート結果が正しい場合はtrueとなる値を返す関数を指定してください。 バリデート関数は第1引数にはバリデート対象の値、第2引数以降には{@link Validate.addRule}で指定するルールオブジェクトに記述されたパラメータが渡されます。
	 * </p>
	 * <p>
	 * 第3引数にはバリデート関数に渡すパラメータのパラメータ名リストを指定します。パラメータ名は{@link ValidationResult.failureReason}で使用されます。
	 * </p>
	 * <p>
	 * 第4引数は優先度指定です。複数ルールをバリデートする場合に、どのルールから順にバリデートを行うかを優先度で指定します。
	 * </p>
	 *
	 * @memberOf h5.validation
	 * @param {string} ruleName ルール名
	 * @param {Function} func バリデート関数
	 * @param {string[]} [argNames] パラメータ名リスト
	 * @param {number} [priority] 優先度
	 */
	function defineRule(ruleName, func, argNames, priority) {
		// TODO 優先度は未実装
		validateRuleManager.addValidateRule(ruleName, func, argNames, priority);
	}

	// デフォルトルールの追加
	defineRule(DEFAULT_RULE_NAME_REQUIRE, function(value) {
		// nullでないかつ、空文字でもないこと
		return value != null && value !== '';
	});
	defineRule(DEFAULT_RULE_NAME_CUSTOM_FUNC, func.customFunc, ['func']);
	defineRule(DEFAULT_RULE_NAME_NUL, func.nul);
	defineRule(DEFAULT_RULE_NAME_NOT_NULL, func.notNull);
	defineRule(DEFAULT_RULE_NAME_ASSERT_FALSE, func.assertFalse);
	defineRule(DEFAULT_RULE_NAME_ASSERT_TRUE, func.assertTrue);
	defineRule(DEFAULT_RULE_NAME_MAX, func.max, ['max', 'inclusive']);
	defineRule(DEFAULT_RULE_NAME_MIN, func.min, ['min', 'inclusive']);
	defineRule(DEFAULT_RULE_NAME_FUTURE, func.future);
	defineRule(DEFAULT_RULE_NAME_PAST, func.past);
	defineRule(DEFAULT_RULE_NAME_DIGITS, func.digits, ['integer', 'fruction']);
	defineRule(DEFAULT_RULE_NAME_PATTERN, func.pattern, ['regexp']);
	defineRule(DEFAULT_RULE_NAME_SIZE, func.size, ['min', 'max']);

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name validation
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.validation', {
		func: func,
		defineRule: defineRule,
		createValidator: createValidator
	});
})();