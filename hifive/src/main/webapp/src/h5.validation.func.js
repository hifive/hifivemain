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
	/** ルール定義(優先度順) */
	var ruleDefinitions = [];

	/** ルール定義名と関数のマップ */
	var ruleDefinitionsMap = {};

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
		validate: function(obj) {
			var validProperties = [];
			var invalidProperties = [];
			for ( var prop in this._rule) {
				var rule = this._rule[prop];
				var value = obj[prop];
				var invalid = false;
				// TODO order対応
				//				var order = rule[PROPERTY_NAME_ORDER];
				for ( var ruleName in rule) {
					var args = rule[ruleName];
					if (args === undefined || ruleName === PROPERTY_NAME_ORDER) {
						continue;
					}
					if (isArray(args)) {
						args.unshift(value);
					} else {
						args = [value, args];
					}
					var validateFunc = ruleDefinitionsMap[ruleName];
					if (!validateFunc.apply(this, args)) {
						invalid = true;
						break;
					}
				}
				(invalid ? invalidProperties : validProperties).push(prop);
			}
			return new ValidationResult({
				isValid: !invalidProperties.length,
				validProperties: validProperties,
				invalidProperties: invalidProperties
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
			// 整数部分判定
			if (abs >= Math.pow(10, integer)) {
				return false;
			}
			// 小数部分判定
			// 小数部分を出すのに演算すると誤差が出る(例：1.1-1の結果が0.10000000000000009)
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

	function createValidator() {
		return new Validator();
	}

	/**
	 * ルール定義の追加
	 *
	 * @memberOf h5.validation
	 * @param {string} key
	 * @param {Function} func
	 * @param {intenger} [priority] 優先度
	 */
	function defineRule(key, func, priority) {
		if (ruleDefinitions[key]) {
			// TODO 既にある場合
		}
		ruleDefinitions.push({
			key: key,
			func: func,
			priority: priority
		});
		ruleDefinitionsMap[key] = func;
		ruleDefinitions.sort(comparePriority);
	}

	// デフォルトルールの追加
	defineRule('require', function(value) {
		// nullでないかつ、空文字でもないこと
		return value != null && value !== '';
	});
	defineRule('nul', func.nul);
	defineRule('notNull', func.notNull);
	defineRule('assertFalse', func.assertFalse);
	defineRule('assertTrue', func.assertTrue);
	defineRule('max', func.max);
	defineRule('min', func.min);
	defineRule('future', func.future);
	defineRule('past', func.past);
	defineRule('digits', func.digits);
	defineRule('pattern', func.pattern);
	defineRule('size', func.size);

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