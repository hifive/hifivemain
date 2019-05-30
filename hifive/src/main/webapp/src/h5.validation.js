/*
 * Copyright (C) 2015-2016 NS Solutions Corporation
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
	 * デフォルトで定義済みのルール名
	 */
	var DEFAULT_RULE_NAME_REQUIRED = 'required';
	var DEFAULT_RULE_NAME_CUSTOM_FUNC = 'customFunc';
	var DEFAULT_RULE_NAME_ASSERT_NULL = 'assertNull';
	var DEFAULT_RULE_NAME_ASSERT_NOT_NULL = 'assertNotNull';
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
	var EVENT_ASYNC_PROPERTY_COMPLETE = 'asyncPropertyComplete';
	var EVENT_VALIDATE_COMPLETE = 'validateComplete';
	var EVENT_VALIDATE_ABORT = 'abort';

	// =============================
	// Development Only
	// =============================
	/* del begin */
	var fwLogger = h5.log.createLogger('h5.validation');

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
	// Dependent Classes
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
	var validateRuleManager = new ValidateRuleManager();
	// =============================
	// Functions
	// =============================

	function pushIfNotExist(value, array) {
		if ($.inArray(value, array) === -1) {
			array.push(value);
		}
	}

	function uniqMerge(array1, array2) {
		var ret = [];

		var tmp = array1.concat(array2);

		for (var i = 0, len = tmp.length; i < len; i++) {
			var value = tmp[i];
			if ($.inArray(value, ret) === -1) {
				ret.push(value);
			}
		}

		return ret;
	}

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
		// TODO h5.core.data.jsと重複して定義しているので内部モジュールとして分離する

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
	 * ValidationResultにデフォルトで登録するvalidateイベントリスナ。複数の非同期Promiseがある場合、when()によってすべてのpromiseが成功するか、
	 * いずれか1つのpromiseが失敗したタイミングで発火する。
	 *
	 * @private
	 * @param ev イベントオブジェクト
	 */
	function validateEventListener(ev) {
		// thisはvalidationResult
		// このハンドラがユーザが追加するハンドラより先に動作する前提(EventDispatcherがそういう実装)
		// 非同期validateの結果をValidationResultに反映させる
		var name = ev.name;

		if (ev.isValid) {
			//validの場合、このnameのプロパティに対するすべての非同期処理が成功したタイミングで1回だけ呼ばれる
			this.validProperties.push(name);
			this.validCount++;
		} else {
			//1つでもバリデーションに失敗したら、そのタイミングでisValidはfalseとなる
			this.isValid = false;

			//同じプロパティに対して、既に同期ルールでエラーがあり
			//invalidPropertiesに含まれている場合があるので、配列に含まれていない場合のみ追加する
			if (this.invalidProperties.indexOf(name) === -1) {
				this.invalidProperties.push(name);
				this.invalidCount++;
			}

			this.invalidReason = this.invalidReason || {};

			if (!this.invalidReason[name]) {
				this.invalidReason[name] = {
					name: name,
					value: ev.value,
					violation: []
				};
			}
			this.invalidReason[name].violation.push(ev.violation);
			this.violationCount++;
		}

		//あるプロパティに対する非同期バリデーションの状態をvalidating状態からinvalid状態になる
		//（validatingPropertiesから削除する）
		var validatingPropIdx = this.validatingProperties.indexOf(name);
		if (validatingPropIdx !== -1) {
			this.validatingProperties.splice(validatingPropIdx, 1);
		}

		if (!this.isValid || !this.validatingProperties.length) {
			this.isAllValid = this.isValid;
		}
	}

	function RuleSet() {
		this._rule = {};
	}
	$.extend(RuleSet.prototype, {
		get: function(ruleName) {
			return this._rule[ruleName];
		},

		getAll: function() {
			var ret = [];
			for ( var key in this._rule) {
				ret.push(this._rule[key]);
			}
			return ret;
		},

		_setSkipped: function(ruleName, value) {
			var rule = this._rule[ruleName];
			if (rule) {
				rule.isSkipped = value;
			}
		},

		_setRule: function(ruleName, ruleValue, message) {
			this._rule[ruleName] = {
				name: ruleName,
				arg: ruleValue,
				message: message,
				isSkipped: false
			};
		}
	});

	/**
	 * validation結果クラス
	 * <p>
	 * バリデート結果を保持するクラスです。{@link h5.validation.FormValidationLogic.validate}がこのクラスのインスタンスを返します。
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
	 * 非同期バリデートを行っているプロパティについて、どれか1つのバリデート結果が出た。
	 * </p>
	 * <p>
	 * 以下のようなイベントオブジェクトを通知します。
	 * </p>
	 *
	 * <pre class="sh_javascript"><code>
	 * {
	 * 	type: 'validate'
	 * 	name: // バリデートが完了したプロパティ名
	 * 	value: // バリデート対象の値
	 * 	isValid: // バリデート結果(true/false)
	 * 	violation:
	 * 	// 失敗時のみ。該当プロパティについてのバリデート失敗理由({@link ValidationResult}に格納されるinvalidReason[name].violationに格納されるルールごとの違反理由オブジェクト)
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
		 * バリデーション結果です。参照した時点で、同期・非同期を問わず、結果が確定している全てのバリデーションルールについてエラーがない場合にtrueになります。
		 * 結果が確定していない非同期バリデータがある場合でも、このプロパティは参照時点で判定済みのものについてのバリデーションエラーの有無を表します。<br>
		 * 非同期バリデータの結果を含め、すべてのバリデーションルールを適用した結果（エラーの有無）を判定したい場合はisAllValidプロパティを参照してください。
		 *
		 * @memberOf ValidationResult
		 * @name isValid
		 * @type {boolean}
		 */
		this.isValid = result.isValid;

		/**
		 * 全てのバリデーションルールに対してエラーがなかったプロパティ名の配列です。
		 * あるプロパティに非同期バリデータが適用されていた場合、すべての非同期バリデータの結果がエラーなしで確定したタイミングでこの配列に格納されます。
		 *
		 * @memberOf ValidationResult
		 * @name validProperties
		 * @type {string[]}
		 */
		this.validProperties = result.validProperties;

		/**
		 * 1つ以上のバリデーションルールに対してエラーがあったプロパティ名の配列です。
		 * あるプロパティに非同期バリデータが適用されていた場合、1つでもエラーが発生したタイミングで（他の非同期バリデータの結果を待たずに）この配列に格納されます。
		 *
		 * @memberOf ValidationResult
		 * @name invalidProperties
		 * @type {string[]}
		 */
		this.invalidProperties = result.invalidProperties;

		/**
		 * 1つ以上の非同期バリデータの結果を待っていて、かつ、他の全てのバリデータ（同期・非同期を問わない）でエラーが発生していないプロパティ名の配列です。
		 * 従って、もし、ある非同期バリデータの結果が返ってきていない状態でも、他の同期バリデータ（例：必須チェック）に違反した場合は
		 * そのプロパティはこの配列ではなくinvalidPropertiesに直ちに格納されます。<br>
		 * 全ての結果待ちの非同期バリデートがエラーなしで完了した場合、そのプロパティはこの配列から取り除かれ、validPropertiesに移動します。
		 * 複数の非同期バリデータの結果を待っていて、ある非同期バリデータの結果が「エラーあり」だった場合、そのプロパティは
		 * 他の非同期バリデータの結果を待たずにinvalidPropertiesに移動します。
		 *
		 * @memberOf ValidationResult
		 * @name validatingProperties
		 * @type {string[]}
		 */
		this.validatingProperties = result.validatingProperties;

		/**
		 * バリデート失敗理由
		 * <p>
		 * バリデート失敗の理由がここに格納されます。invalidReasonは以下のようなオブジェクトです。
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * {
		 *   &quot;プロパティ名&quot;: {
		 *     name: 'name',              // プロパティ名
		 *     value: 101,                // バリデート対象の値
		 *     violation: [{              // 違反理由オブジェクトの配列
		 *       ruleName: 'max',  // バリデートを行ったルール
		 *       ruleValue: {max:100, inclusive: true},  // バリデート関数に渡されたパラメータ
		 *       reason: // 非同期バリデートのみ。非同期バリデート関数が返したプロミスのfailハンドラに渡された引数リスト。同期の場合は常にnull
		 *     }]
		 *   },
		 *   &quot;プロパティ名&quot;: {...},
		 *   &quot;プロパティ名&quot;: {...}
		 * }
		 * </code></pre>
		 *
		 * @memberOf ValidationResult
		 * @name invalidReason
		 * @type {object}
		 */
		this.invalidReason = result.invalidReason;

		/**
		 * バリデーションに成功した（適用されたすべてのバリデーションルールでエラーがなかった）「プロパティ数」です。<br>
		 * validProperties.lengthと同じ値になります。
		 *
		 * @memberOf ValidationResult
		 * @name validCount
		 * @type {integer}
		 */
		this.validCount = result.validProperties.length;

		/**
		 * 1つ以上のバリデーションルールでエラーがあった「プロパティ数」です。<br>
		 * invalidProperties.lengthと同じ値になります。
		 *
		 * @memberOf ValidationResult
		 * @name invalidCount
		 * @type {integer}
		 */
		this.invalidCount = result.invalidProperties.length;

		/**
		 * 違反したルールの総数です。「プロパティの数」ではなく「(違反した)ルールの数」です。
		 *
		 * @memberOf ValidationResult
		 * @name violationCount
		 * @type {integer}
		 */
		this.violationCount = result.violationCount;

		/**
		 * 参照した時点で「非同期バリデータの結果待ちが残っているかどうか」を表します。残っている場合はtrueです。もし、全てのプロパティについてエラーの有無が確定していた場合でも、
		 * 結果が確定していない非同期バリデータが残っていればtrueになります。
		 * また、全ての非同期バリデータの結果が確定するかabort()メソッドが呼ばれると、このフラグはfalseになります。
		 *
		 * @memberOf ValidationResult
		 * @name isAsync
		 * @type {boolean}
		 */
		this.isAsync = result.isAsync;

		/**
		 * 非同期バリデートを含め、すべてのプロパティに対するすべてのバリデーションルールを適用した結果エラーがなかった場合にtrueになります。
		 * バリデーション結果が確定していないプロパティが1つ以上残っている場合はnullになります。
		 *
		 * @memberOf ValidationResult
		 * @name isAllValid
		 * @type {boolean|null}
		 */
		this.isAllValid = result.isAllValid;

		/**
		 * 今回のバリデーションでチェック対象になった（1つ以上のバリデーションルールが実際に適用された）全てのプロパティ名の配列です。
		 * 例えば、preValidationHookなどでバリデーションがキャンセルされ、バリデーションルールが1つも適用されなかったプロパティは含まれません。
		 *
		 * @memberOf ValidationResult
		 * @name properties
		 * @type {string[]}
		 */
		this.properties = result.properties;

		this._validPropertyToRulesMap = result.validPropertyToRulesMap;

		this._nameToRuleSetMap = result.nameToRuleSetMap;

		this._disabledProperties = result.disabledProperties;

		//同期バリデーションでエラーがあったかどうかにかかわらず、
		//結果待ちの非同期バリデーションが1つ以上存在する場合にそのプロパティ名を保持する配列。
		//validatingPropertiesは同期バリデーションでエラーがあったプロパティは含まないが、
		//こちらは非同期待ちがあれば常にそのプロパティを含む。
		this.asyncWaitingProperties = result.asyncWaitingProperties;

		/**
		 * 非同期バリデーションが中断されたかどうかを表します。abort()が呼ばれるとtrueになります。
		 */
		this.isAborted = false;

		this.addEventListener(EVENT_VALIDATE, validateEventListener);
	}
	// イベントディスパッチャ
	h5.mixin.eventDispatcher.mix(ValidationResult.prototype);
	$
			.extend(
					ValidationResult.prototype,
					{
						/**
						 * 非同期バリデートを中止する
						 * <p>
						 * ValidationResultが非同期バリデート結果を待機している場合、このメソッドを呼ぶとバリデートを中止し、以降validate及びvalidateCompleteイベントをあげなくなります。
						 * </p>
						 *
						 * @memberOf ValidationResult
						 * @name abort
						 * @function
						 */
						abort: function() {
							if (this.isAborted) {
								return;
							}
							this.isAborted = true;

							this.isAsync = false;
							this.asyncWaitingProperties = [];
							this.removeEventListener(EVENT_VALIDATE, validateEventListener);
							this.dispatchEvent({
								type: EVENT_VALIDATE_ABORT
							});
						},

						/**
						 * @private
						 */
						_merge: function(result) {
							var newInvalidProperties = [];
							var newValidProperties = [];

							var newProperties = [];

							//result.propertiesには、今回のバリデーションでdisableになっていたプロパティは含まれていない

							//前回バリデーション対象だったプロパティについて、
							for (var i = 0, len = this.properties.length; i < len; i++) {
								var prop = this.properties[i];

								if ($.inArray(prop, result._disabledProperties) !== -1) {
									//今回のバリデーションでdisabledだった場合は、そのプロパティのバリデーション結果および関連情報は削除する
									delete this.invalidReason[prop];
									delete this._validPropertyToRulesMap[prop];
									delete this._nameToRuleSetMap[prop];
									continue;
								}

								newProperties.push(prop);

								if (!this._has(prop, result.properties)) {
									//今回バリデーション対象にならなかったプロパティの結果はそのまま引き継ぐ

									//適用したルールセットはそのまま（なので何もしない）

									if (this._has(prop, this.validProperties)) {
										newValidProperties.push(prop);
									}

									if (this._has(prop, this.invalidProperties)) {
										newInvalidProperties.push(prop);
										//invalidReasonは保持してあるMapをそのまま保持しているのでコピー不要
									}
								} else {
									//今回もバリデーション対象だった場合

									//適用したルールセットを更新
									this._nameToRuleSetMap[prop] = result._nameToRuleSetMap[prop];

									if (this._has(prop, this.validProperties)) {
										//前回違反なしで

										if (this._has(prop, result.invalidProperties)) {
											//今回違反ありになったプロパティは、invalid側に含めて
											pushIfNotExist(prop, newInvalidProperties);
											//reasonもコピーする
											this.invalidReason[prop] = result.invalidReason[prop];
										} else if (this._has(prop, result.validProperties)) {
											//今回も違反なしのプロパティはvalid側に含める
											pushIfNotExist(prop, newValidProperties);
										}
									} else if (this._has(prop, this.invalidProperties)) {
										//前回違反ありの場合

										var isAsyncWaitingProp = this._has(prop,
												result.validatingProperties);

										if (this._has(prop, result.validProperties)
												|| isAsyncWaitingProp) {
											//前回は違反ありだったが、今回違反なしになったプロパティについて、ルールごとに
											//（同期ルールでエラーがない＆結果待ちの非同期ルールがある場合validatingに入っている。
											//そのため、今回のバリデーションで（前回エラーだった）同期ルールが実行され違反なしになった場合が考えられるので
											//propがvalidatingPropertiesに含まれている場合にもこの分岐に入れる。）

											var validRuleNames = result._validPropertyToRulesMap[prop];
											var violations = this.invalidReason[prop].violation;
											if (validRuleNames) {
												//前回バイオレーションに含まれていたルールが今回Validだった場合はviolationの配列から取り除く
												for (var vi = violations.length - 1; vi >= 0; vi--) {
													var violation = violations[vi];
													if ($.inArray(violation.ruleName,
															validRuleNames) !== -1) {
														violations.splice(vi, 1);
													}
												}
											}

											if (violations.length === 0) {
												//同期エラーがなくなれば、この時点では一旦invalidReasonから削除する
												//この後非同期バリデータでエラーが起きた場合再びinvalidReasonが追加される可能性はある
												delete this.invalidReason[prop];

												if (!isAsyncWaitingProp) {
													//すべての違反が解消され、かつ新規の非同期待ちのバリデータがなければ、Reasonから取り除き、Validなプロパティに含める
													pushIfNotExist(prop, newValidProperties);
												}
											} else {
												//まだ他のルールの違反が残っている場合はInvalidなプロパティに含める
												pushIfNotExist(prop, newInvalidProperties);
											}

											//最新のValidなルールのマップをコピー
											this._validPropertyToRulesMap[prop] = result._validPropertyToRulesMap[prop];
										} else if (this._has(prop, result.invalidProperties)) {
											//前回も今回も違反ありのプロパティについて、

											var validRuleNames = result._validPropertyToRulesMap[prop];
											var violations = this.invalidReason[prop].violation;
											if (validRuleNames) {
												//前回バイオレーションに含まれていたルールが今回Validだった場合はviolationの配列から取り除く
												for (var vi = violations.length - 1; vi >= 0; vi--) {
													var violation = violations[vi];
													if ($.inArray(violation.ruleName,
															validRuleNames) !== -1) {
														violations.splice(vi, 1);
													}
												}
											}

											//今回のバリデーションの違反について、
											for (var vidx = 0, vlen = result.invalidReason[prop].violation.length; vidx < vlen; vidx++) {
												var newViolation = result.invalidReason[prop].violation[vidx];

												var hasAlready = false;

												//前回のバリデーションで同じルールの違反がある場合、reasonを上書きする
												for (var oldvidx = 0, oldvlen = violations.length; oldvidx < oldvlen; oldvidx++) {
													var oldViolation = violations[oldvidx];
													if (newViolation.ruleName === oldViolation.ruleName) {
														hasAlready = true;
														violations[oldvidx] = newViolation;
														break;
													}
												}

												//前回のバリデーションにはないルール違反の場合は、violationに追加する
												if (!hasAlready) {
													violations.push(newViolation);
												}
											}

											//いずれにしても、Invalidなプロパティなので、invalid側に含める
											pushIfNotExist(prop, newInvalidProperties);
										}
									}
								}
							}

							//今回のバリデーションでバリデーション対象、かつ前回は対象外だったプロパティについて、
							for (var i = 0, len = result.properties.length; i < len; i++) {
								var prop = result.properties[i];

								//適用したルールセットをコピー
								this._nameToRuleSetMap[prop] = result._nameToRuleSetMap[prop];

								if (!this._has(prop, this.properties)) {
									//今回新たに対象になったプロパティのvalid,invalidはコピーする
									if (this._has(prop, result.validProperties)) {
										pushIfNotExist(prop, newValidProperties);
									} else if (this._has(prop, result.invalidProperties)) {
										pushIfNotExist(prop, newInvalidProperties);
										//Reasonもコピーする
										this.invalidReason[prop] = result.invalidReason[prop];
									}
								}
							}

							//最終的にチェックしたプロパティリストは単純にユニークマージすればよい
							//newPropertiesは、今回disabledだったプロパティを除いた、前回バリデーション実行時に対象になったプロパティが含まれている
							this.properties = uniqMerge(newProperties, result.properties);

							//バリデート中のプロパティリストは単純にユニークマージすればよい
							this.validatingProperties = uniqMerge(this.validatingProperties,
									result.validatingProperties);

							this.asyncWaitingProperties = uniqMerge(this.asyncWaitingProperties,
									result.asyncWaitingProperties);

							//Asyncかどうかは、マージ後のresultに非同期結果待ちプロパティがあるかどうかで判定
							this.isAsync = (this.asyncWaitingProperties.length !== 0);

							this.validProperties = newValidProperties;
							this.validCount = newValidProperties.length;

							this.invalidProperties = newInvalidProperties;
							this.invalidCount = newInvalidProperties.length;

							//Violationの数を新たにカウント
							var newViolationCount = 0;
							for ( var violatedPropName in this.invalidReason) {
								var reason = this.invalidReason[violatedPropName];
								newViolationCount += reason.violation.length;
							}
							this.violationCount = newViolationCount;

							//マージ後、invalidなプロパティがなければvalidである
							this.isValid = this.invalidCount === 0;

							this.isAllValid = null;
							if (!this.isValid) {
								//同期ルールでエラーがある場合false
								this.isAllValid = false;
							} else if (!this.isAsync) {
								//同期ルールでエラーがなく、非同期待ちがない場合はこの時点でtrue
								this.isAllValid = true;
							}
							//同期ルールでエラーがなく、非同期待ちがある場合はisAllValidは現時点でnull
						},

						/**
						 * @private
						 */
						_has: function(value, array) {
							return $.inArray(value, array) !== -1;
						}
					});

	/**
	 * priority順に並べるための比較関数
	 * <p>
	 * priorityの数値の降順で返えす。(priorityに一大きい数値の指定されているものが先)
	 *
	 * @private
	 * @param obj1
	 * @param obj2
	 * @returns {integer}
	 */
	function comparePriority(obj1, obj2) {
		var p1, p2;
		p1 = obj1.priority == null ? -Infinity : obj1.priority;
		p2 = obj2.priority == null ? -Infinity : obj2.priority;
		return p1 === p2 ? 0 : p2 - p1;
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
		addValidateRule: function(ruleName, func, argNames, priority, enableWhenEmpty, validateOn,
				resolveOn) {
			var isExistAlready = this.rulesMap[ruleName];
			if (isExistAlready) {
				fwLogger.warn('定義済みのルールが上書きされました。異なるルール名で定義することを推奨します。ルール名=' + ruleName);

				for (var i = 0, l = this.rules.length; i < l; i++) {
					if (this.rules[i].ruleName === ruleName) {
						this.rules.splice(i, 1);
						break;
					}
				}
			}

			var actualArgNames = null;
			if (argNames != null) {
				actualArgNames = Array.isArray(argNames) ? argNames : [argNames];
			}

			var ruleObj = {
				ruleName: ruleName,
				func: func,
				priority: priority,
				argNames: actualArgNames,
				enableWhenEmpty: enableWhenEmpty,
				validateOn: validateOn,
				resolveOn: resolveOn
			};
			this.rules.push(ruleObj);
			this.rulesMap[ruleName] = ruleObj;
		},

		getValidator: function(validatorName) {
			return this.rulesMap[validatorName];
		},

		getValidateFunction: function(ruleName) {
			return this.rulesMap[ruleName] && this.rulesMap[ruleName].func;
		},
		getValidateArgNames: function(ruleName) {
			return this.rulesMap[ruleName] && this.rulesMap[ruleName].argNames;
		},
		sortRuleByPriority: function(ruleNames) {
			var rulesMap = this.rulesMap;
			ruleNames.sort(function(a, b) {
				return comparePriority(rulesMap[a], rulesMap[b]);
			});
		}
	});

	/**
	 * preValidationHookに渡されるコンテキストオブジェクト
	 *
	 * @param {String} name プロパティ名
	 * @param {any} value 値
	 * @param {ValidationRule} rule ルールオブジェクト(name, argを持つ)
	 * @param {String} timing タイミング
	 */
	function ValidationContext(name, value, rule, timing) {
		this._isSkipped = false;
		this.name = name;
		this.value = value;
		this.rule = rule;
		this.timing = timing;
	}
	$.extend(ValidationContext.prototype, {
		/**
		 * このプロパティのバリデーションをスキップします。
		 */
		skip: function() {
			this._isSkipped = true;
		}
	});

	/**
	 * バリデーションタイミングのEnum
	 */
	var ValidationTiming = {
		VALIDATE: 'validate',
		CHANGE: 'change',
		BLUR: 'blur',
		FOCUS: 'focus',
		KEY_UP: 'keyup',
		ASYNC_RESULT: 'asyncResult'
	};

	/**
	 * ルール定義の追加
	 * <p>
	 * {@link h5.validation.FormValidationLogic.addRule}で追加するルールはここで追加されたルール定義が使用されます。
	 * </p>
	 * <p>
	 * 第1引数にはルール名を指定します。
	 * </p>
	 * <p>
	 * 第2引数にはバリデート関数を指定します。 バリデート結果が正しい場合はtrueとなる値を返す関数を指定してください。 バリデート関数は第1引数にはバリデート対象の値、第2引数以降には{@link Validate.addRule}で指定するルールオブジェクトに記述されたパラメータが渡されます。
	 * </p>
	 * <p>
	 * 第3引数にはバリデート関数に渡すパラメータのパラメータ名リストを指定します。パラメータ名は{@link ValidationResult.invalidReason}で使用されます。
	 * </p>
	 * <p>
	 * 第4引数は優先度指定です。複数ルールをバリデートする場合に、どのルールから順にバリデートを行うかを優先度で指定します。
	 * 優先度は、数値が大きいものほど優先されます。同じ優先度の場合適用順序は不定です。 デフォルトで用意されているルールの優先度は、requiredが51、その他は50で定義しています。
	 * </p>
	 *
	 * @private
	 * @param {string} ruleName ルール名
	 * @param {Function} func バリデート関数
	 * @param {string[]} [argNames] パラメータ名リスト
	 * @param {number} [priority=0] 優先度
	 * @param {boolean} [enableWhenEmpty] 値が空の場合にこのバリデータを動作させるかどうか。デフォルト値：false。
	 */
	function defineRule(ruleName, func, argNames, priority, enableWhenEmpty, validateOn, resolveOn) {
		// TODO 優先度は未実装
		validateRuleManager.addValidateRule(ruleName, func, argNames, priority, enableWhenEmpty,
				validateOn, resolveOn);
	}

	var UNIX_TIME_REGEXP = /^[0-9]+$/;

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
	 * ルールに基づいたバリデーション関数を持つオブジェクト
	 *
	 * @private
	 */
	var rule = {
		/**
		 * 値がnullでないかつ空文字でないことを判定する
		 * <p>
		 * 値がnullまたは空文字の場合はfalseを返します。
		 * </p>
		 *
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		required: function(value) {
			// nullでないかつ、空文字でもないこと
			return value != null && value !== '';
		},

		/**
		 * 値を第2引数の関数で判定した結果を返す
		 *
		 * @param {Any} value 判定する値
		 * @param {Function} func 任意のバリデート関数。第1引数に判定する値が渡されます
		 * @returns {Any}
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
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		assertNull: function(value) {
			return value == null;
		},

		/**
		 * 値がnullでないかどうか判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 値がnullの場合はfalseを返します。undefinedの場合はtrueを返します。
		 * </p>
		 * <p>
		 * それ以外の場合はtrueを返します。
		 * </p>
		 *
		 * @param {Any} value 判定する値
		 * @returns {boolean}
		 */
		assertNotNull: function(value) {
			return value === undefined ? true : value != null;
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
		 * @param {Any} value 判定する値
		 * @param {Date|Number|String} reference 基準時刻。NumberまたはStringの場合、UNIX時刻が渡されたものとみなす
		 * @returns {boolean}
		 */
		future: function(value, reference) {
			if (value == null) {
				//nullの場合はtrueとする
				return true;
			}

			var refTime = null;

			if (reference instanceof Date) {
				//Dateインスタンスの場合はそのまま使用
				refTime = reference.getTime();
			} else if (typeof reference === 'number') {
				//UNIX TIMEを数値で渡された場合
				refTime = reference;
			} else if (typeof reference === 'string' && UNIX_TIME_REGEXP.test(reference)) {
				//UNX TIMEを文字列で渡された場合
				refTime = parseInt(reference);
			} else {
				//それ以外の場合は現在時刻を用いる
				refTime = new Date().getTime();
			}

			//valueは、DateインスタンスならgetTime()し、そうでなければUnixTime値(Number型)が入っているとみなす
			var targetTime = 0;
			if (value instanceof Date) {
				targetTime = value.getTime();
			} else if (typeof value === 'number') {
				targetTime = value;
			} else if (typeof value === 'string' && UNIX_TIME_REGEXP.test(value)) {
				targetTime = parseInt(value);
			} else {
				return false;
			}

			//targetTimeが基準時刻より後ならtrue
			return refTime < targetTime;
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
		 * @param {Any} value 判定する値
		 * @param {Date|Number|String} reference 基準時刻。NumberまたはStringの場合、UNIX時刻が渡されたものとみなす
		 * @returns {boolean}
		 */
		past: function(value, reference) {
			if (value == null) {
				//nullの場合はtrueとする
				return true;
			}

			var refTime = null;

			if (reference instanceof Date) {
				//Dateインスタンスの場合はそのまま使用
				refTime = reference.getTime();
			} else if (typeof reference === 'number') {
				//UNIX TIMEを数値で渡された場合
				refTime = reference;
			} else if (typeof reference === 'string' && UNIX_TIME_REGEXP.test(reference)) {
				//UNX TIMEを文字列で渡された場合
				refTime = parseInt(reference);
			} else {
				//それ以外の場合は現在時刻を用いる
				refTime = new Date().getTime();
			}

			//valueは、DateインスタンスならgetTime()し、そうでなければUnixTime値(Number型)が入っているとみなす
			var targetTime = 0;

			if (value instanceof Date) {
				targetTime = value.getTime();
			} else if (typeof value === 'number') {
				targetTime = value;
			} else if (typeof value === 'string' && UNIX_TIME_REGEXP.test(value)) {
				targetTime = parseInt(value);
			} else {
				//日付またはUNIX TIMEとして解釈できない値が渡された場合はfalseとする
				return false;
			}

			//targetTimeが基準時刻より前ならtrue
			return targetTime < refTime;
		},

		/**
		 * 値を数値表現文字列として扱い、桁数の判定を行い、判定結果をtrueまたはfalseで返します
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
		 * 値が文字列型でない場合はfalseを返します。
		 * </p>
		 * <p>
		 * 整数部分、小数部分いずれの桁数も境界値を含めます。
		 * </p>
		 *
		 * @param {Any} value 判定する値
		 * @param {integer} integer 整数桁数の上限値
		 * @param {integer} fraction 小数桁数の上限値
		 * @returns {boolean}
		 */
		digits: function(value, integer, fraction) {
			if (value == null) {
				return true;
			}
			var typeValid = isStringValue(value);
			if (!typeValid) {
				return false;
			}

			// 数値表現かどうか判定
			// 先頭が+,-,数値の何れかで始まっていること。数値.数値または数値のみであること
			if (!/^([+|-])?\d*(\.\d+)?$/.test(value)) {
				return false;
			}

			// 整数部分判定
			// 数値に変換して正の数で考える
			var num = parseInt(value);
			num = num < 0 ? -num : num;
			if (integer != null) {
				// 整数部分判定
				if (num >= Math.pow(10, integer)) {
					return false;
				}
			}

			if (fraction != null) {
				// 小数部分判定
				var pointIndex = value.indexOf('.');
				if (pointIndex === -1) {
					// 小数点が無い場合はvalid
					return true;
				}
				// 小数部分の桁数がfraction以下の長さかどうか返す
				return value.slice(pointIndex + 1).length <= fraction;
			}
			// integerもfractionもどちらもnullならvalid
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
		 * @param {Any} value 判定する値
		 * @param {RegExp} regexp 正規表現オブジェクト
		 * @returns {boolean}
		 */
		pattern: function(value, regexp) {
			return value == null || isStringValue(value) && regexp.test(value);
		},

		/**
		 * 配列の長さ、または文字列の長さ、オブジェクトのプロパティ数が指定された範囲内であるかどうかを判定し、判定結果をtrueまたはfalseで返します
		 * <p>
		 * 判定対象となる値は配列、文字列、プレーンオブジェクトの何れかです。
		 * 配列の場合は配列の長さ、文字列の場合は文字数、プレーンオブジェクトの場合はhasOwnPropertyがtrueであるプロパティの数を判定の対象とします。
		 * </p>
		 * <p>
		 * その他の型の値の場合はfalseを返します。
		 * </p>
		 * <p>
		 * 第2引数でサイズの下限値、第3引数でサイズの上限値を指定し、その範囲内のサイズであるかどうかを判定します。上限値、下限値ともに境界を含めます。上限値、下限値はどちらかのみの指定が可能です。
		 * </p>
		 * <p>
		 * 値がnullまたはundefinedの場合はtrueを返します。
		 * </p>
		 *
		 * @param {Any} value 判定する値
		 * @param {integer} min 下限値 (nullを指定した場合は下限値による判定は行いません)
		 * @param {integer} max 上限値 (nullを指定した場合は上限値による判定は行いません)
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

	/**
	 * FormValidationロジック
	 * <p>
	 * フォーム要素を集約したオブジェクトのバリデートを行うためのロジックです。
	 * </p>
	 *
	 * @class
	 * @name h5.validation.FormValidationLogic
	 */
	var FormValidationLogic = {
		/**
		 * @private
		 */
		__name: 'h5.validation.FormValidationLogic',

		/**
		 * @private
		 */
		_rule: {},

		/**
		 * @private
		 */
		_disableProperties: [],

		/**
		 * バリデータ名 -> Empty時に有効かどうかのboolean値、のマップ
		 *
		 * @private
		 */
		_isForceEnabledWhenEmptyMap: {},

		/**
		 * @private
		 */
		_isEnabledAllWhenEmpty: false,

		/**
		 * フォームの値を集約したオブジェクトのvalidateを行う
		 * <p>
		 * FormValidationロジックはバリデートルールごとにバリデート対象の値を適切な型に変換してからバリデートを行います。
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
		 * var formValidator = h5.core.logic(h5.validation.FormValidationLogic);
		 * formValidator.addRule({
		 * 	birthday: {
		 * 		customFunc: function(val) {
		 * 			// 日付として正しいか判定する
		 * 			!isNaN(new Date(val.year, val.month - 1, val.date).getTime());
		 * 		}
		 * 	},
		 * 	year: {
		 * 		required: true
		 * 	},
		 * 	month: {
		 * 		required: true
		 * 	},
		 * 	day: {
		 * 		required: true
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
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {Object} obj バリデート対象となるオブジェクト
		 * @param {string|string[]} [names] 第1引数オブジェクトのうち、バリデートを行うキー名またはその配列(指定無しの場合は全てのキーが対象)
		 * @param {string} timing バリデーションタイミング。blur, validateなど。省略時は"validate"とみなす。
		 * @param {Obj} outputUpdateTiming
		 *            出力タイミング。バリデータの動作タイミングが明示的に設定されていない場合、このタイミングに含まれたタイミングのときのみバリデータを動作させる。
		 * @returns {ValidationResult} バリデート結果
		 */
		validate: function(obj, names, timing, lastResult, outputUpdateTiming) {
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

			if (timing == null) {
				timing = 'validate';
			}

			return this._validate(validateTarget, validateNames, timing, lastResult,
					outputUpdateTiming);
		},

		_preValidationHook: null,

		/**
		 * バリデーション実行前フック関数をセットします。 このフック関数は、validateメソッドが呼ばれたとき、各項目のバリデーション実行前に項目1つごとに呼ばれます。
		 * この関数に渡されるコンテキストオブジェクトでvalidationContext.skip();を呼び出すと、その項目のバリデーションを行わず処理を続けます。
		 * 関数のシグネチャ：function(validationContext):void。引数にnullを指定して呼び出すと、フックを解除します。
		 * validationContextオブジェクトは、skip(), rule(nameとargプロパティを持つオブジェクト), name, value, timingを持ちます。
		 *
		 * @param preValidationHookFunction フック関数
		 */
		setPreValidationHook: function(preValidationHookFunction) {
			this._preValidationHook = preValidationHookFunction;
		},

		/**
		 * バリデートルールを追加する
		 * <p>
		 * {@link h5.validation.FormValidationLogic.validate}でバリデートを行う際のバリデートルールを追加します。
		 * </p>
		 * <p>
		 * バリデートルールは以下のようなオブジェクトで指定します。
		 *
		 * <pre class="sh_javascript"><code>
		 * var formValidator = h5.core.logic(h5.validation.FormValidationLogic);
		 * formValidator.addRule({
		 * 	// 対象となるプロパティ名(userid)をキーにする
		 * 	userid: {
		 * 		// ルール名: 該当ルールのパラメータ。パラメータを取らないルールの場合はtrueを指定。複数のパラメータを取るルールの場合は配列指定。
		 * 		required: true,
		 * 		pattern: /&circ;[a-z|0-9]*$/,
		 * 		size: [4, 10]
		 * 	}
		 * });
		 * </code></pre>
		 *
		 * 上記の場合、useridは指定が必須(required指定)かつ/&circ;[a-z|0-9]*$/の正規表現を満たし(pattern指定)、4文字以上10字以下(size指定)のルールを追加しています。
		 * </p>
		 * <p>
		 * 以下のようなルールが定義されています。
		 * </p>
		 * <table><thead>
		 * <tr>
		 * <th>ルール名</th>
		 * <th>パラメータ</th>
		 * <th>定義</th>
		 * </tr>
		 * </thead><tbody>
		 * <tr>
		 * <td>required</td>
		 * <td>なし</td>
		 * <td>値がnull,undefined,空文字のいずれでもないこと</td>
		 * </tr>
		 * <tr>
		 * <td>customFunc</td>
		 * <td>func</td>
		 * <td>funcには第1引数に値を取る関数を指定する。funcがtrueを返すこと。</td>
		 * </tr>
		 * <tr>
		 * <td>assertNull</td>
		 * <td>なし</td>
		 * <td>値がnullまたはundefinedであること</td>
		 * </tr>
		 * <tr>
		 * <td>assertNotNull</td>
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
		 * <td>[string, fraction]</td>
		 * <td>数値の桁数判定。整数部分がinteger桁数以下でありかつ小数部分がfraction桁数以下の数値を表す文字列であること</td>
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
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {Object} ルールオブジェクト
		 */
		addRule: function(ruleObject) {
			for ( var prop in ruleObject) {
				var rule = ruleObject[prop];

				var rulesObj = this._rule[prop];

				if (rulesObj == null) {
					rulesObj = {};
					this._rule[prop] = rulesObj;
				}

				// すでにルールが定義されている場合、同じバリデータについては定義を上書き。別のバリデータの場合は追記(マージ)する
				for ( var validatorName in rule) {
					rulesObj[validatorName] = rule[validatorName];
				}
			}
		},

		/**
		 * ルールの削除
		 * <p>
		 * {@link h5.validation.FormValidationLogic.addRule}で追加したプロパティルールを削除します。
		 * </p>
		 * <p>
		 * ルールの削除はプロパティ単位で行います。第1引数に対象となるプロパティ名を指定(複数指定可)します。
		 * </p>
		 *
		 * @memberOf h5.validation.FormValidationLogic
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
		 * ルールの無効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを無効化します
		 * </p>
		 *
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {string|string[]} name プロパティ名またはその配列
		 */
		disableRule: function(name) {
			var names = wrapInArray(name);
			for (var i = 0, l = names.length; i < l; i++) {
				var index = $.inArray(names[i], this._disableProperties);
				if (index === -1) {
					this._disableProperties.push(names[i]);
				}
			}
		},

		/**
		 * ルールの有効化
		 * <p>
		 * 第1引数に指定されたプロパティについてのバリデートを有効化します
		 * </p>
		 *
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {string|string[]} name プロパティ名またはその配列
		 */
		enableRule: function(name) {
			var names = wrapInArray(name);
			for (var i = 0, l = names.length; i < l; i++) {
				var index = $.inArray(names[i], this._disableProperties);
				if (index !== -1) {
					this._disableProperties.splice(index, 1);
				}
			}
		},

		setRuleForceEnabledWhenEmpty: function(ruleName, isEnabled) {
			this._isForceEnabledWhenEmptyMap[ruleName] = isEnabled;
		},

		setAllRulesEnabledWhenEmpty: function(isEnabled) {
			this._isEnabledAllWhenEmpty = isEnabled;
		},

		/**
		 * パラメータのバリデートを行う
		 * <p>
		 * 第1引数にはバリデート対象となるオブジェクト、第2引数には第1引数のオブジェクトのうち、バリデートを行うキー名(複数の場合は配列)を指定します。
		 * </p>
		 * <p>
		 * 第2引数を省略した場合は第1引数のオブジェクトが持つすべてのキーがバリデート対象になります。
		 * </p>
		 * <p>
		 * バリデートは{@link h5.validation.FormValidationLogic.addRule}によって登録されたルールで行われます。
		 * </p>
		 *
		 * @private
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {Object} obj バリデート対象となるオブジェクト
		 * @param {string|string[]} [names] 第1引数オブジェクトのうち、バリデートを行うキー名またはその配列(指定無しの場合は全てのキーが対象)
		 * @param {string} timing バリデーションタイミング。
		 * @param {Object} outputUpdateTiming 出力更新タイミング
		 * @returns {ValidationResult} バリデート結果
		 */
		_validate: function(obj, names, timing, lastResult, outputUpdateTiming) {
			var validProperties = [];
			var invalidProperties = [];
			var properties = [];
			var validatingProperties = [];
			var invalidReason = {};
			var targetNames = names && (isArray(names) ? names : [names]);
			var isAsyncResultWaitingAtLeastOnce = false;
			var asyncWaitingProperties = [];

			// プロパティ名、プロミスのマップ。1プロパティにつき非同期チェックが複数あればプロミスは複数
			var propertyWaitingPromises = {};
			var violationCount = 0;
			//バリデーション結果OKだったルールの、プロパティ名 -> rule名配列のマップ
			var validPropertyToRulesMap = {};

			//name -> それに対して適用されるRuleのSet、のMap
			var nameToRuleSetMap = {};

			//現在disabledなプロパティの配列
			var disabledProperties = this._disableProperties.slice(0);

			for ( var prop in this._rule) {
				if (names && $.inArray(prop, targetNames) === -1
						|| $.inArray(prop, this._disableProperties) !== -1) {
					// バリデートを行うプロパティ名指定がある場合は、そこにないプロパティの場合はバリデート対象にしない
					// また、disableRule()でバリデートしないよう設定されているプロパティについてもバリデート対象にしない
					continue;
				}
				var rule = this._rule[prop];
				var orgValue = obj[prop];
				var isInvalidProp = false;
				var isAsyncProp = false;

				var ruleSet = new RuleSet();
				nameToRuleSetMap[prop] = ruleSet;

				// ルールを優先度順にソート
				var sortedRuleNames = [];
				for ( var ruleName in rule) {
					sortedRuleNames.push(ruleName);
				}
				validateRuleManager.sortRuleByPriority(sortedRuleNames);

				//フック関数がセットされている場合、ルールが一つも実行されない可能性があり、
				//その場合はValidationResultに含めないようにする必要がある。
				//そのため、一度以上実行されたかどうかのフラグを用意する。
				var isValidatedAtLeastOnce = false;

				// ルールについてチェックする。あるルールでバリデートエラーが起きても、他のルールもチェックする。
				for (var i = 0, l = sortedRuleNames.length; i < l; i++) {
					var ruleName = sortedRuleNames[i];
					var args = rule[ruleName];
					if ((!obj.hasOwnProperty(prop) || args == null)
							&& !(ruleName === DEFAULT_RULE_NAME_REQUIRED && args)) {
						// そもそもvalidate対象のオブジェクトにチェック対象のプロパティがない場合、チェックしない
						// また、argsがundefinedならそのルールはチェックしない
						// ただし、required指定がある場合はチェックする
						continue;
					}

					// validate関数呼び出し時の引数をオブジェクト形式に変換
					var ruleValue = {};
					var argNames = validateRuleManager.getValidateArgNames(ruleName);
					if (argNames && args != null) {
						var ruleArgs = Array.isArray(args) ? args : [args];

						for (var j = 0, len = argNames.length; j < len; j++) {
							ruleValue[argNames[j]] = ruleArgs[j];
						}
					}

					ruleSet._setRule(ruleName, ruleValue);

					var validator = validateRuleManager.getValidator(ruleName);

					if (!this._shouldValidateWhen(prop, validator, timing, lastResult,
							outputUpdateTiming)) {
						ruleSet._setSkipped(ruleName, true);
						continue;
					}

					//preValidationフック
					if (this._preValidationHook) {
						var ruleArg = {};

						//フック関数内でもし書き換えられてもバリデーション処理に影響を与えないようシャローコピーする
						for ( var ruleArgName in ruleValue) {
							ruleArg[ruleArgName] = ruleValue[ruleArgName];
						}

						var ruleObj = {
							name: ruleName,
							arg: ruleArg
						};
						var validationContext = new ValidationContext(prop, orgValue, ruleObj,
								timing);

						//フック関数を呼び出す
						this._preValidationHook(validationContext);

						if (validationContext._isSkipped) {
							//フック関数でskip()が呼び出されいたら、この項目のバリデーションはスキップ
							ruleSet._setSkipped(ruleName, true);
							continue;
						}
					}

					/* 以降実際のバリデーション処理を行う */

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

					var ret = null;
					if (orgValue === '' && !this._shouldValidateWhenEmpty(validator)) {
						if (lastResult && lastResult.invalidReason[prop]) {
							//値が空文字で、空文字の場合チェックしないバリデータの場合、
							//前回の結果でこのルールがInvalidだったときは強制的にvalid扱いにする
							var hasLastError = false;
							var lastViolations = lastResult.invalidReason[prop].violation;
							for (var lvidx = 0, lvlen = lastViolations.length; lvidx < lvlen; lvidx++) {
								var lastViolation = lastViolations[lvidx];
								if (lastViolation.ruleName === ruleName) {
									ret = true;
									hasLastError = true;
									break;
								}
							}

							if (!hasLastError) {
								continue;
							}
						} else {
							//前回の結果がない場合、空の場合チェックしないバリデータの結果は含めない
							continue;
						}
					} else {
						ret = validateFunc.apply(this, args);
					}

					isValidatedAtLeastOnce = true;

					// 非同期の場合
					if (isPromise(ret) && !isRejected(ret) && !isResolved(ret)) {
						// pendingのプロミスが返ってきた場合
						// 結果が返ってきたらvalidateイベントをあげるようにしておく
						isAsyncProp = true;
						isAsyncResultWaitingAtLeastOnce = true;
						propertyWaitingPromises[prop] = propertyWaitingPromises[prop] || [];
						// プロミス自体にルール名と値と引数を覚えさせておく
						propertyWaitingPromises[prop].push(ret.promise({
							ruleName: ruleName,
							value: orgValue,
							ruleValue: ruleValue
						}));
					}

					// 同期でエラーが返ってきた(falseまたはreject済みプロミスが返ってきた場合)
					if (!ret || isPromise(ret) && isRejected(ret)) {
						// validate関数がfalseを返したまたは、promiseを返したけどすでにreject済みの場合はvalidate失敗
						// invalidReasonの作成
						if (!invalidReason[prop]) {
							invalidReason[prop] = {
								name: prop,
								value: orgValue,
								violation: []
							};
						}
						invalidReason[prop].violation.push(this._createViolation(ruleName,
								ruleValue));
						isInvalidProp = true;
						violationCount++;
					} else {
						//あるプロパティについて、Validだったルールを保持しておく
						var validRuleNames = validPropertyToRulesMap[prop];
						if (!validRuleNames) {
							validRuleNames = [];
							validPropertyToRulesMap[prop] = validRuleNames;
						}
						pushIfNotExist(ruleName, validRuleNames);
					}
				} // End of foreach(ルール)

				//実際に一つ以上のルールが適用された場合のみプロパティに追加
				if (isValidatedAtLeastOnce) {
					//バリデーションを行ったプロパティ名を追加
					properties.push(prop);

					if (isInvalidProp) {
						//同期的にバリデーションエラーが1つ以上見つかった場合
						invalidProperties.push(prop);
					} else {
						if (isAsyncProp) {
							//同期バリデーションエラーはなかったが、非同期バリデーションで未判定のものが残っている場合＝非同期バリデーション結果待ち状態
							validatingProperties.push(prop);
						} else {
							//同期バリデーションエラーがなく、かつ、非同期バリデーションで未判定のものもない場合＝バリデーション済み状態
							validProperties.push(prop);
						}
					}

					//同期的にエラーが見つかったかどうかにかかわらず、
					//このプロパティに対して結果が確定していない非同期バリデーションがセットされていたらasyncWaitingPropertiesに含める。
					//この配列は、FormControllerで
					//「あるプロパティに対する非同期バリデーションについて、どのValidationResultインスタンスに対応するものが有効か」を
					//チェックするために使用されている。
					if (isAsyncProp) {
						asyncWaitingProperties.push(prop);
					}
				}
			} // End of foreach(バリデータが1つ以上セットされているプロパティ)

			var isValid = !invalidProperties.length;
			var validationResult = new ValidationResult({
				validProperties: validProperties,
				invalidProperties: invalidProperties,
				validatingProperties: validatingProperties,
				properties: properties,
				invalidReason: invalidReason,
				isAsync: isAsyncResultWaitingAtLeastOnce,
				// isValidは現時点でvalidかどうか(非同期でvalidateしているものは関係ない)
				isValid: isValid,
				// 非同期でvalidateしているものがあって現時点でisValid=falseでない(=全部OKかどうか決まっていない)時はisAllValidはnull
				isAllValid: isValid ? (isAsyncResultWaitingAtLeastOnce ? null : true) : false,
				violationCount: violationCount,
				validPropertyToRulesMap: validPropertyToRulesMap,
				nameToRuleSetMap: nameToRuleSetMap,
				disabledProperties: disabledProperties,
				asyncWaitingProperties: asyncWaitingProperties
			});

			if (isAsyncResultWaitingAtLeastOnce) {
				this._registerAsyncHandlers(obj, validationResult, propertyWaitingPromises);
			}
			return validationResult;
		},

		/**
		 * @private
		 */
		_registerAsyncHandlers: function(data, validationResult, propertyWaitingPromises) {
			var that = this;

			for ( var prop in propertyWaitingPromises) {
				var promises = propertyWaitingPromises[prop];

				var doneHandler = (function(_prop, _promises) {
					return function() {
						if (validationResult.isAborted) {
							//非同期バリデーションがabortされていた場合はもはや何もしない
							//なおasyncWaitingPropertiesはabort()を呼び出した時点で空になっている
							return;
						}

						validationResult.dispatchEvent({
							type: EVENT_VALIDATE,
							name: _prop,
							isValid: true,
							// validate対象のオブジェクトに指定された値
							value: data[_prop],
							violation: null
						});

						var isPropertyCompleted = that._eliminateAsyncWaitingProperty(_prop,
								_promises, validationResult);
						if (isPropertyCompleted) {
							validationResult.dispatchEvent({
								type: EVENT_ASYNC_PROPERTY_COMPLETE,
								name: _prop,
								isValid: true
							});
						}

						that._checkAsyncValidateComplete(validationResult);
					};
				})(prop, promises);
				// あるプロパティについてのすべての非同期バリデートが成功（エラーなし）したらvalidであることを通知
				h5.async.when(promises).done(doneHandler);

				for (var pi = 0, plen = promises.length; pi < plen; pi++) {
					var promise = promises[pi];

					var failHandler = (function(_prop, _promise, _promises) {
						return function() {
							if (validationResult.isAborted) {
								return;
							}

							// 一つでも失敗したらfailCallbackが実行される
							//同期ルールによりすでにinvalid状態になっている可能性があるが、
							//非同期ルールについても表示するためイベントは発生させる

							var ruleName, ruleValue, value;
							ruleName = _promise.ruleName;
							ruleValue = _promise.ruleValue;
							value = _promise.value;

							validationResult.dispatchEvent({
								type: EVENT_VALIDATE,
								name: _prop,
								isValid: false,
								value: value,
								violation: that._createViolation(ruleName, ruleValue, arguments),
							});

							var isPropertyCompleted = that._eliminateAsyncWaitingProperty(_prop,
									_promises, validationResult);

							if (isPropertyCompleted) {
								validationResult.dispatchEvent({
									type: EVENT_ASYNC_PROPERTY_COMPLETE,
									name: _prop,
									isValid: false
								});
							}

							that._checkAsyncValidateComplete(validationResult);
						};
					})(prop, promise, promises);
					//fail()の場合はバリデータごとに個別に結果を通知する。
					promise.fail(failHandler);
				}
			}
		},

		/**
		 * 全ての非同期バリデーションが完了したかをチェックし、完了したらvalidateCompelteイベントを発火します。
		 *
		 * @private
		 */
		_checkAsyncValidateComplete: function(validationResult) {
			if (validationResult.asyncWaitingProperties.length === 0) {
				//全ての非同期バリデータが完了したら、その時点のisValidがisAllValidの結果になる
				validationResult.isAllValid = validationResult.isValid;

				//全ての非同期バリデータが完了したらisAsyncをfalseにする
				validationResult.isAsync = false;

				validationResult.dispatchEvent({
					type: EVENT_VALIDATE_COMPLETE
				});
			}
		},

		/**
		 * あるプロパティに対するすべての非同期バリデーションが完了しているかをチェックし、
		 * 完了したらValidationResult.asyncWaitingPropertiesから当該プロパティを取り除きます。未完了のバリデータがある場合は何もせず終了します。
		 *
		 * @private
		 * @returns あるプロパティの全ての非同期バリデーションが完了したかどうか（プロパティを削除したかどうか）
		 */
		_eliminateAsyncWaitingProperty: function(propertyName, promises, validationResult) {
			for (var i = 0, len = promises.length; i < len; i++) {
				var promise = promises[i];
				if (promise.state() === 'pending') {
					return false;
				}
			}

			//ここに到達したら、あるpropertyの全てのpromiseがresolveまたはrejectに確定したということなので
			//asyncWaitingPropertiesから当該プロパティを削除する
			var asyncWaitingProps = validationResult.asyncWaitingProperties;
			var idx = asyncWaitingProps.indexOf(propertyName);
			if (idx !== -1) {
				asyncWaitingProps.splice(idx, 1);
				return true;
			}
			return false;
		},

		/**
		 * ValidationResultに格納するinvalidReasonオブジェクトを作成する
		 *
		 * @private
		 * @memberOf h5.validation.FormValidationLogic
		 * @param ruleName
		 * @param ruleValue
		 * @param failHandlerArgs 非同期バリデートの場合、failハンドラに渡された引数リスト
		 */
		_createViolation: function(ruleName, ruleValue, failHandlerArgs) {
			var ret = {
				ruleName: ruleName,
				ruleValue: ruleValue,
				reason: null
			};
			if (failHandlerArgs) {
				ret.reason = h5.u.obj.argsToArray(failHandlerArgs);
			}
			return ret;
		},

		/**
		 * Formから取得した値のvalidateのために、値をルールに適した型へ変換を行う
		 *
		 * @private
		 * @memberOf h5.validation.FormValidationLogic
		 * @param {Any} value
		 * @param {string} ruleName ルール名
		 */
		_convertBeforeValidate: function(value, ruleName) {
			if (value == null) {
				// nullまたはundefinedの場合は型変換しない
				return value;
			}
			switch (ruleName) {
			case DEFAULT_RULE_NAME_MAX:
			case DEFAULT_RULE_NAME_MIN:
				return isNumberValue(value) ? parseFloat(value) : NaN;
			case DEFAULT_RULE_NAME_FUTURE:
			case DEFAULT_RULE_NAME_PAST:
				if (value instanceof Date) {
					return value;
				} else if (typeof value === 'number') {
					return new Date(value);
				}
			}
			return value;
		},

		/**
		 * @private
		 * @param rule
		 * @returns {Boolean}
		 */
		_shouldValidateWhenEmpty: function(rule) {
			if (this._isForceEnabledWhenEmptyMap[rule.ruleName] != null) {
				//個別ルールの指定があれば優先する
				return this._isForceEnabledWhenEmptyMap[rule.ruleName];
			}

			if (this._isEnabledAllWhenEmpty) {
				//個別ルールの指定がなく、全ルールでの有効化がOnになっている場合はOn
				return true;
			}

			//最後に、ルールで定義されたデフォルト挙動に基づいて動作する
			return rule.enableWhenEmpty === true;
		},

		/**
		 * @private
		 * @param {String} prop プロパティ名
		 * @param {ValidationRule} rule
		 * @param timing
		 * @returns {Boolean}
		 */
		_shouldValidateWhen: function(prop, rule, timing, lastResult, outputUpdateTiming) {
			if (rule.validateOn == null
					&& (timing === 'validate' || outputUpdateTiming.hasOwnProperty(timing))) {
				//validateOnが未定義の場合、validateタイミング（フォームのsubmit()）の場合、または
				//出力更新タイミングに含まれていた場合のみバリデーションを行う
				return true;
			}

			//validateOnが定義されている場合は、validateOnのタイミングに従う
			//※フォームのsubmit()時もこの指定に従うので、validateOnに'validate'が含まれていなければ実行されないので注意

			var idx = $.inArray(timing, rule.validateOn);
			var shouldValidate = idx !== -1;

			//もしvalidateOnのタイミングに含まれていないタイミングでも、
			//前回のバリデーションでこのルールに違反しており、かつ
			//このルールのresolveOnで指定されていたタイミングの場合はバリデーションを行う
			if (!shouldValidate && lastResult && lastResult.invalidReason[prop] && rule.resolveOn) {
				var violations = lastResult.invalidReason[prop].violation;
				for (var i = 0, len = violations.length; i < len; i++) {
					var v = violations[i];
					if (v.ruleName === rule.ruleName && $.inArray(timing, rule.resolveOn) !== -1) {
						shouldValidate = true;
						break;
					}
				}
			}

			return shouldValidate;
		},

		_setRuleResolveTiming: function(ruleName, timings) {
			var resolveOn = Array.isArray(timings) ? timings : [timings];
			validateRuleManager.getValidator(ruleName).resolveOn = resolveOn;
		},

		_setRuleValidateTiming: function(ruleName, timings) {
			var validateOn = Array.isArray(timings) ? timings : [timings];
			validateRuleManager.getValidator(ruleName).validateOn = validateOn;
		}
	};

	// デフォルトルールの追加
	defineRule(DEFAULT_RULE_NAME_REQUIRED, rule.required, null, 60, true, null, null);
	defineRule(DEFAULT_RULE_NAME_CUSTOM_FUNC, rule.customFunc, ['func'], 50, true, null, null);
	defineRule(DEFAULT_RULE_NAME_ASSERT_NULL, rule.assertNull, null, 50, true, null, null);
	defineRule(DEFAULT_RULE_NAME_ASSERT_NOT_NULL, rule.assertNotNull, null, 50, true, null, null);
	defineRule(DEFAULT_RULE_NAME_ASSERT_FALSE, rule.assertFalse, null, 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_ASSERT_TRUE, rule.assertTrue, null, 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_MAX, rule.max, ['max', 'inclusive'], 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_MIN, rule.min, ['min', 'inclusive'], 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_FUTURE, rule.future, ['referenceTime'], 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_PAST, rule.past, ['referenceTime'], 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_DIGITS, rule.digits, ['integer', 'fraction'], 50, false, null,
			null);
	defineRule(DEFAULT_RULE_NAME_PATTERN, rule.pattern, ['regexp'], 50, false, null, null);
	defineRule(DEFAULT_RULE_NAME_SIZE, rule.size, ['min', 'max'], 50, false, null, null);

	// =============================
	// Expose to window
	// =============================

	if (!h5internal.validation) {
		h5internal.validation = {};
	}
	h5internal.validation.ValidationResult = ValidationResult;


	/**
	 * @namespace
	 * @name validation
	 * @memberOf h5
	 */
	h5.u.obj.expose('h5.validation', {
		defineRule: defineRule,
		ValidationTiming: ValidationTiming
	});
	h5.core.expose(FormValidationLogic);
})();