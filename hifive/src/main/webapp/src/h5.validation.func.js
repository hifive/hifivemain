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
	 * validatorクラス
	 *
	 * @class
	 */
	function Validator() {
		this._rule = {};
	}
	$.extend(Validator.prototype, {
		/**
		 * @param {Object} obj
		 * @param {string|string[]} names
		 */
		validate: function(obj, names) {
			var validProperties = [];
			var invalidProperties = [];
			var failureReason = null;
			var targetNames = names && (isArray(names) ? names : [names]);
			for ( var prop in this._rule) {
				if (names && $.inArray(prop, targetNames) === -1) {
					continue;
				}
				var rule = this._rule[prop];
				var orgValue = obj[prop];
				var invalid = false;
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
					/* del begin */
					if (!validateFunc) {
						fwLogger.warn(FW_LOG_NOT_DEFINED_RULE_NAME, ruleName);
					}
					/* del end */

					if (validateFunc && !validateFunc.apply(this, args)) {
						// failureReasonの作成
						// 引数の値を格納する
						var param = {};
						var argNames = validateRuleManager.getValidateArgNames(ruleName);
						if (argNames) {
							for (var i = 0, l = argNames.length; i < l; i++) {
								param[argNames[i]] = args[i + 1];
							}
						}
						failureReason = failureReason || {};
						failureReason[prop] = {
							rule: ruleName,
							value: value,
							param: param
						};
						invalid = true;
						break;
					}
				}
				(invalid ? invalidProperties : validProperties).push(prop);
			}
			return new ValidationResult({
				isValid: !invalidProperties.length,
				validProperties: validProperties,
				invalidProperties: invalidProperties,
				failureReason: failureReason
			});
		},
		addRule: function(ruleObject) {
			for ( var prop in ruleObject) {
				var propRule = ruleObject[prop];
				// 既に適用ルールが定義されているプロパティについては上書き
				this._rule[prop] = propRule;
			}
		},
		removeRule: function(keys) {
			if (!isArray(keys)) {
				delete this._rule[keys];
			}
			for (var i = 0, l = keys.length; i < l; i++) {
				delete this._rule[keys[i]];
			}
		},
		setOrder: function(ruleOrder) {}
	});

	/**
	 * FormValidatorクラス
	 *
	 * @class
	 */
	function FormValidator() {
		this._rule = {};
	}
	$.extend(FormValidator.prototype, Validator.prototype, {

		/**
		 * フォームオブジェクトのvalidateを行う
		 * <p>
		 * FormValidatorはグループとそのグループ内のプロパティについてのvalidateに対応する。
		 * </p>
		 * <p>
		 * 以下はbirthdayをループとして扱いvalidateを行う場合、
		 * </p>
		 *
		 * <pre class="sh_javascript"><code>
		 * var formValidator = h5.u.validation.createValidator('form');
		 * formValidator.addRule({
		 *   birthday: {
		 *     customFunc: function(val){...}
		 *   },
		 *   year: { require:true },
		 *   month: { require:true },
		 *   day: { require:true }
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
		 * @param {Object} obj
		 * @param {string|string[]} names
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
	 * validation結果クラス
	 *
	 * @class
	 * @name ValidationResult
	 */
	/**
	 * @private
	 * @param result
	 */
	function ValidationResult(result) {
		this.isValid = result.isValid;
		this.validProperties = result.validProperties;
		this.invalidProperties = result.invalidProperties;
		this.failureReason = result.failureReason;
		this.validCount = result.validProperties.length;
		this.invalidCount = result.invalidProperties.length;
	}

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
		addValidateRule: function(key, func, priority, argNames) {
			var isExistAlready = this.rulesMap[key];
			if (isExistAlready) {
				for (var i = 0, l = this.rules.length; i < l; i++) {
					if (this.rules[i].key === key) {
						this.rules.splice(i, 1);
						break;
					}
				}
			}
			var ruleObj = {
				key: key,
				func: func,
				priority: priority,
				argNames: argNames
			};
			this.rules.push(ruleObj);
			this.rulesMap[key] = ruleObj;
		},
		getValidateFunction: function(key) {
			return this.rulesMap[key] && this.rulesMap[key].func;
		},
		getValidateArgNames: function(key) {
			return this.rulesMap[key] && this.rulesMap[key].argNames;
		},
		validate: function(obj, names) {
			// FormValidatorの場合、値がオブジェクトならそれはInputGroupとして扱う
			var groups = [];
			var validateTarget = {};
			for ( var p in obj) {
				if ($.isPlaneObject(obj[p])) {
					// グループは中身を展開したものをvalidateする
					groups.push(p);
					$.extend(validateTarget, validateTarget[p]);
				} else {
					validateTarget[p] = obj[p];
				}
			}
			// TODO グループの結果をどう返すか
			return Validator.prototype.validate.call(this, validateTarget, names);
		}
	});
	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	/**
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
	 *
	 * @memberOf h5.validation
	 * @param {string} key
	 * @param {Function} func
	 * @param {string[]} [argNames] パラメータ名
	 * @param {intenger} [priority] 優先度
	 */
	function defineRule(key, func, argNames, priority) {
		validateRuleManager.addValidateRule(key, func, priority, argNames);
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
	/**
	 * @namespace
	 * @name func
	 * @memberOf h5.validation
	 */
	h5.u.obj.expose('h5.validation', {
		func: func,
		defineRule: defineRule,
		createValidator: createValidator
	});
})();