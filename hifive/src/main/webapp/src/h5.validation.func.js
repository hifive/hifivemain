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
	// =============================
	// FIXME h5.core.dataからコピペ
	// =============================
	/**
	 * 引数がNaNかどうか判定する。isNaNとは違い、例えば文字列はNaNではないのでfalseとする
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @returns {Boolean} 引数がNaNかどうか
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
	 * @returns {Boolean} 引数が2つともNaNかどうか
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
	 * @returns {Boolean} type:'number'指定のプロパティに代入可能か
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
	 * @returns {Boolean} type:'integer'指定のプロパティに代入可能か
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
	 * @returns {Boolean} type:'string'指定のプロパティに代入可能か
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
	 * @returns {Boolean} type:'boolean'指定のプロパティに代入可能か
	 */
	function isBooleanValue(val, isStrict) {
		return val == null || typeof val === 'boolean' || (!isStrict && val instanceof Boolean);
	}

	function assertFalse(value) {
		return value == null || isBooleanValue(value) && value == false;
	}

	function assertTrue(value) {
		return value == null || isBooleanValue(value) && value == true;
	}

	function max(value, maxValue, inclusive) {
		return value == null || (isNumberValue(value, true) || value instanceof Number)
				&& (inclusive ? (value <= maxValue) : (value < maxValue));
	}

	function min(value, minValue, inclusive) {
		return value == null || (isNumberValue(value, true) || value instanceof Number)
				&& (inclusive ? (minValue <= value) : (minValue < value));
	}

	function nul(value) {
		return value == null;
	}

	function notNull(value) {
		return value != null;
	}

	function future(value) {
		return value == null || value instanceof Date && new Date().getTime() < value.getTime();
	}

	function past(value) {
		return value == null || value instanceof Date && value.getTime() < new Date().getTime();
	}

	function digits(value, integer, fruction) {
		if (value == null) {
			return true;
		}
		var typeValid = (isNumberValue(value, true) || value instanceof Number) && !isNaN(value)
				&& value != Infinity && value != -Infinity;
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
			// 1.1e+50のような数をparseIntすると1になってしまう。その場合は小数部分はなし
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

	function pattern(value, regexp) {
		return value == null || isStringValue(value) && regexp.test(value);
	}

	function size(value, min, max) {
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

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
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
	h5.u.obj.expose('h5.validation.func', {
		assertFalse: assertFalse,
		assertTrue: assertTrue,
		max: max,
		min: min,
		digits: digits,
		nul: nul,
		notNull: notNull,
		future: future,
		past: past,
		pattern: pattern,
		size: size
	});
})();