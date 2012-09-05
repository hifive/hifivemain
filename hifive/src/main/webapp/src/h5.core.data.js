/*
 * Copyright (C) 2012 NS Solutions Corporation
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

/* ------ h5.core.data ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	//=============================
	// Production
	//=============================


	var SEQUENCE_RETURN_TYPE_STRING = 1;
	var SEQUENCE_RETURN_TYPE_INT = 2;

	var ID_TYPE_STRING = 'string';
	var ID_TYPE_INT = 'number';


	/** マネージャ名が不正 */
	var ERR_CODE_INVALID_MANAGER_NAME = 15000;

	/** DataItemのsetterに渡された値、またはcreateで渡された値がDescriptorで指定された型・制約に違反している */
	var ERR_CODE_INVALID_ITEM_VALUE = 15001;

	/** dependが設定されたプロパティのセッターを呼び出した */
	var ERR_CODE_DEPEND_PROPERTY = 15002;

	/** イベントのターゲットが指定されていない */
	var ERR_CODE_NO_EVENT_TARGET = 15003;

	/** ディスプリプタが不正 */
	var ERR_CODE_INVALID_DESCRIPTOR = 15004;

	/** createDataModelManagerのnamespaceが不正 */
	var ERR_CODE_INVALID_MANAGER_NAMESPACE = 15005;

	/** データモデル名が不正 */
	var ERR_CODE_INVALID_DATAMODEL_NAME = 15006;

	/** createItemでIDが必要なのに指定されていない */
	var ERR_CODE_NO_ID = 15007;

	/** マネージャの登録先に指定されたnamespaceにはすでにその名前のプロパティが存在する */
	var ERR_CODE_REGISTER_TARGET_ALREADY_EXIST = 15008;

	/** 内部エラー：更新ログタイプ不正（通常起こらないはず） */
	var ERR_CODE_INVALID_UPDATE_LOG_TYPE = 15009;

	/** IDは文字列でなければならない */
	var ERR_CODE_ID_MUST_BE_STRING = 15010;

	/** typeが配列に指定されているプロパティには別のインスタンスを代入できない（空にしたい場合はclear()メソッド、別の配列と同じ状態にしたい場合はcopyFrom()を使う） */
	var ERR_CODE_CANNOT_SET_OBSARRAY = 15011;

	/** DataItem.set()でidをセットすることはできない */
	var ERR_CODE_CANNOT_SET_ID = 15012;

	var ERROR_MESSAGES = [];
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAME] = 'マネージャ名が不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_ITEM_VALUE] = 'DataItemのsetterに渡された値がDescriptorで指定された型・制約に違反しています。 違反したプロパティ={0}';
	ERROR_MESSAGES[ERR_CODE_DEPEND_PROPERTY] = 'dependが設定されたプロパティのセッターを呼び出した';
	ERROR_MESSAGES[ERR_CODE_NO_EVENT_TARGET] = 'イベントのターゲットが指定されていない';
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAMESPACE] = 'createDataModelManagerのnamespaceが不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_DATAMODEL_NAME] = 'データモデル名が不正';
	ERROR_MESSAGES[ERR_CODE_NO_ID] = 'createItemでIDが必要なのに指定されていない';
	ERROR_MESSAGES[ERR_CODE_REGISTER_TARGET_ALREADY_EXIST] = 'マネージャの登録先に指定されたnamespaceにはすでにその名前のプロパティが存在する';
	ERROR_MESSAGES[ERR_CODE_INVALID_UPDATE_LOG_TYPE] = '内部エラー：更新ログタイプ不正';
	ERROR_MESSAGES[ERR_CODE_ID_MUST_BE_STRING] = 'IDは文字列でなければならない';
	ERROR_MESSAGES[ERR_CODE_INVALID_DESCRIPTOR] = 'データモデルディスクリプタにエラーがあります。';
	ERROR_MESSAGES[ERR_CODE_CANNOT_SET_OBSARRAY] = 'typeが配列に指定されているプロパティには別のインスタンスを代入できない（空にしたい場合はclear()メソッド、別の配列と同じ状態にしたい場合はcopyFrom()を使う）。 プロパティ名 = {0}';
	ERROR_MESSAGES[ERR_CODE_CANNOT_SET_ID] = 'DataItem.set()でidをセットすることはできない';

	//	ERROR_MESSAGES[] = '';
	addFwErrorCodeMap(ERROR_MESSAGES);


	// ---------------------------
	//ディスクリプタのエラーコード
	// ---------------------------
	/**
	 * ディスクリプタがオブジェクトでない
	 */
	var DESCRIPTOR_ERR_CODE_NOT_OBJECT = 1;

	/**
	 * nameが正しく設定されていない
	 */
	var DESCRIPTOR_ERR_CODE_INVALID_NAME = 2;


	/**
	 * baseの指定が不正
	 */
	var DESCRIPTOR_ERR_CODE_INVALID_BASE = 3;

	/**
	 * baseに指定されたデータモデルが存在しない
	 */
	var DESCRIPTOR_ERR_CODE_NO_EXIST_BASE = 4;

	/**
	 * schemaもbaseも指定されていない
	 */
	var DESCRIPTOR_ERR_CODE_NO_SCHEMA = 5;

	/**
	 * schemaがオブジェクトでない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_NOT_OBJECT = 6;

	/**
	 * ID指定されたプロパティがない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_DUPLICATED_ID = 7;

	/**
	 * ID指定されたプロパティがない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_NO_ID = 8;

	/**
	 * プロパティ名が不正
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME = 9;

	/**
	 * id指定されたプロパティにdeppendが指定されている
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_ID_AND_DEPPEND = 10;

	/**
	 * deppend.onに指定されたプロパティが存在しない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_ON = 11;

	/**
	 * deppend.calcに関数が指定されていない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_CALC = 12;

	/**
	 * typeに文字列が指定されていない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_TYPE = 13;

	/**
	 * type文字列が不正
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_TYPE = 14;

	/**
	 * typeに指定されたデータモデルが存在しない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_DATAMODEL = 15;

	/**
	 * type:enumなのにenumValueが指定されていない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE = 16;

	/**
	 * constraintにオブジェクトが指定されていない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT = 17;

	/**
	 * constraint.notNullの指定が不正
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY = 18;

	/**
	 * min-maxに数値が入力されなかった時のエラー
	 */
	DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX = 20;

	/**
	 * typeがinteger,numberじゃないのにconstraint.min/max を指定されたときのエラー
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT = 21;

	/**
	 * constraint.patternが正規表現じゃない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN = 22;

	/**
	 * minLength/maxLengthに0以上の整数値以外の値が渡された
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH = 23;

	/**
	 * constraintの指定に矛盾がある場合(mix > maxなど)
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT = 24;

	/**
	 * typeがenumでないのにenumValueが指定されている
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_ENUMVALUE_TYPE = 25;

	/**
	 * enumValueが配列でない、または空配列
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_ENUMVALUE = 26;

	/**
	 * id項目にdefaultValueが設定されている
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_DEFAULTVALUE_ID = 27;

	/**
	 * defaultValueに設定された値がtype,constraintに指定された条件を満たしていない
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE = 28;

	/**
	 * ID項目のconstraintに不正な指定がある
	 */
	var DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID = 29;

	/**
	 * ディスクリプタのエラーメッセージ
	 */
	var DESCRIPTOR_VALIDATION_ERROR_MSGS = [];
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_ERR_CODE_NOT_OBJECT] = 'DataModelのディスクリプタにはオブジェクトを指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_ERR_CODE_INVALID_NAME] = 'データモデル名が不正です。使用できる文字は、半角英数字、_、$、のみで、先頭は数字以外である必要があります。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_ERR_CODE_INVALID_BASE] = 'baseの指定が不正です。指定する場合は、継承したいデータモデル名の先頭に"@"を付けた文字列を指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_ERR_CODE_NO_EXIST_BASE] = 'baseの指定が不正です。指定されたデータモデル{0}は存在しません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_ERR_CODE_NO_SCHEMA] = 'schemaの指定が不正です。baseの指定がない場合はschemaの指定は必須です';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_NOT_OBJECT] = 'schemaの指定が不正です。schemaはオブジェクトで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_DUPLICATED_ID] = 'ID指定されているプロパティが複数あります。ID指定は1つのプロパティのみに指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_NO_ID] = 'ID指定されているプロパティがありません。ID指定は必須です。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME] = '{0}をプロパティ名に指定できません。半角英数字,_,$ で構成される文字列で、先頭は数字以外である必要があります。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_ID_AND_DEPPEND] = '"{0}"プロパティの定義にエラーがあります。id指定されたプロパティにdependを指定することはできません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_ON] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.onに指定されたプロパティが存在しません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_CALC] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.calcには関数を指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_TYPE] = '"{0}"プロパティプロパティの定義にエラーがあります。typeは文字列で指定して下さい。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_TYPE] = 'プロパティの定義にエラーがあります。typeに指定された文字列が不正です "{1}"';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_DATAMODEL] = '"{0}"プロパティの定義にエラーがあります。 typeに指定されたデータモデル"{1}"は存在しません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 タイプにenumを指定する場合はenumValueも指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraintはオブジェクトで指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} の指定が不正です。trueまたはfalseで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、数値で指定してください。typeにintegerを指定している場合は整数値で指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、type:{2}の項目に対して指定することはできません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN] = '"{0}"プロパティ constraint.{1}は正規表現オブジェクトで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1}には正の整数を指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT] = '"{0}"プロパティの定義にエラーがあります。 constraintに矛盾する指定があります。{1},{2}';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_ENUMVALUE_TYPE] = '"{0}"プロパティの定義にエラーがあります。 enumValueはtypeに"enum"またはその配列が指定されている場合のみ指定可能です';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 enumValueは長さ1以上の配列を指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_DEFAULTVALUE_ID] = '"{0}"プロパティの定義にエラーがあります。id指定した項目にdefaultValueを設定することはできません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE] = '"{0}"プロパティのdefaultValueに設定された値"{1}"は、typeまたはconstraintに定義された条件を満たしていません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID] = '"{0}"プロパティの定義にエラーがあります。id指定された項目にconstraint.{1}:{2}を指定することはできません。';

	var ITEM_PROP_BACKING_STORE_PREFIX = '__';

	var EVENT_ITEMS_CHANGE = 'itemsChange';


	var PROP_CONSTRAINT_REQUIRED = 'required';


	var UPDATE_LOG_TYPE_CREATE = 1;
	var UPDATE_LOG_TYPE_CHANGE = 2;
	var UPDATE_LOG_TYPE_REMOVE = 3;



	//=============================
	// Development Only
	//=============================

	var fwLogger = h5.log.createLogger('h5.core.data');

	/* del begin */

	var MSG_ERROR_DUP_REGISTER = '同じ名前のデータモデルを登録しようとしました。同名のデータモデルの2度目以降の登録は無視されます。マネージャ名は {0}, 登録しようとしたデータモデル名は {1} です。';

	/* del end */


	// =========================================================================
	//
	// Cache
	//
	// =========================================================================
	var argsToArray = h5.u.obj.argsToArray;


	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	//=============================
	// Variables
	//=============================
	//=============================
	// Functions
	//=============================
	function createDataModelItemsChangeEvent(created, recreated, removed, changed) {
		return {
			type: EVENT_ITEMS_CHANGE,
			created: created,
			recreated: recreated,
			removed: removed,
			changed: changed
		};
	}


	//========================================================
	//
	// バリデーション関係コードここから
	//
	//========================================================



	/**
	 * type指定の文字列を、パースした結果を返す
	 *
	 * @param {String} type
	 * @return elmType:タイプから配列部分を除いた文字列。dataModel:データモデル名。dimention:配列の深さ(配列指定でない場合は0)
	 */
	function getTypeObjFromString(type) {
		// マッチ結果から、データモデル指定の場合と配列の場合をチェックする
		// "string[][][]"のとき、matched = ["string[][][]", "string", undefined, "[][][]", "[]"]
		// "@DataModel"のとき、matched = ["@DataModel", "@DataModel", "DataModel", "", undefined]
		var matched = type.match(/^(string|number|integer|boolean|any|enum|@(.+?))((\[\])*)$/);
		return matched && {
			elmType: matched[1],
			dataModel: matched[2],
			dimention: matched[3] ? matched[3].length / 2 : 0
		};
	}

	/**
	 * 引数がNaNかどうか判定する。isNaNとは違い、例えば文字列はNaNではないのでfalseとする
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} 引数がNaNかどうか
	 */
	function isStrictNaN(val) {
		return typeof val === 'number' && isNaN(val);
	}

	/**
	 * type:'number' 指定のプロパティに代入できるかのチェック null,undefined,NaN,parseFloatしてNaNにならないもの
	 * に当てはまる引数についてtrueを返す
	 *
	 * @param {Any} val 判定する値
	 * @param {Integer} dementnion 判定する型の配列次元(配列でないなら0)
	 * @return {Boolean} type:'number'指定のプロパティに代入可能か
	 */
	function isNumberValue(val) {
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
				|| val instanceof Number
				|| !!((isString(val) || val instanceof String) && val
						.match(/^[+\-]{0,1}[0-9]*\.{0,1}[0-9]+$/));
	}

	/**
	 * type:'integer' 指定のプロパティに代入できるかのチェック null,undefined,parseFloatとparsFloatの結果が同じもの(NaNは除く)
	 * に当てはまる引数についてtrueを返す
	 *
	 * @param {Any} val 判定する値
	 * @param {integer} dementnion 判定する型の配列次元(配列でないなら0)
	 * @return {Boolean} type:'integer'指定のプロパティに代入可能か
	 */
	function isIntegerValue(val) {
		// parseIntとparseFloatの結果が同じかどうかで整数値かどうかの判定をする
		// typeofが'nubmer'または、new Number()で生成したオブジェクトで、parseFloatとparseIntの結果が同じならtrue
		// NaN, Infinity, -Infinityはfalseを返す(parseInt(Infinity)はNaNであるので、InfinityはIntじゃない扱いにする
		// 文字列の場合は、[±数字]で構成されている文字列ならOKにする
		// ※ parseIntよりも厳しいチェックにしている。"12px"、"12.3"、[12,3] はいずれもparseIntできるが、ここではNG。
		return val == null || (typeof val === 'number' || val instanceof Number)
				&& parseInt(val) === parseFloat(val)
				|| (typeof val === 'string' || val instanceof String)
				&& val.match(/^[+\-]{0,1}[0-9]+$/);
	}

	/**
	 * type:'string' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} type:'string'指定のプロパティに代入可能か
	 */
	function isStringValue(val) {
		return val == null || isString(val) || val instanceof String;
	}

	/**
	 * type:'boolean' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} type:'boolean'指定のプロパティに代入可能か
	 */
	function isBooleanValue(val) {
		return val == null || typeof val === 'boolean' || val instanceof Boolean;
	}

	/**
	 * type:'enum' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @param {Array} enumValue 列挙されている値の配列
	 * @return {Boolean} type:'enum'指定のプロパティに代入可能か
	 */
	function isEnumValue(v, enumValue) {
		if (isStrictNaN(v)) {
			// NaN の時は、NaN===NaNにならない(inArrayでも判定できない)ので、enumValueの中身を見て判定する
			for ( var i = 0, l = enumValue.length; i < l; i++) {
				if (isStrictNaN(enumValue[i])) {
					return true;
				}
			}
			return false;
		}
		return v === null || $.inArray(v, enumValue) > -1;
	}

	/**
	 * チェック関数と、配列の次元を持つオブジェクトを引数にとり、値のチェックを行う関数を作成して返す
	 *
	 * @param {object} checkObj
	 * @param {array} [checkObj.checkFuncs] チェックする関数の配列。配列の先頭の関数から順番にチェックする。指定のない場合は、return
	 *            true;するだけの関数を作成して返す
	 * @param {integer} [checkObj.dimention]
	 *            チェックする値の配列の次元。配列のdimention次元目が全てcheckFuncsを満たすことと、dimention-1次元目まではすべて配列であることを確認する関数を作成して返す。
	 *            0、または指定無しの場合は配列でないことを表す
	 * @return {Function} 値をチェックする関数を返す。戻り値の関数はエラー理由を返す。length;0ならエラーでない。
	 */
	function createCheckValueByCheckObj(checkObj) {
		var funcs = checkObj.checkFuncs;
		if (!funcs || funcs.length === 0) {
			return function() {
				return [];
			};
		}
		var dim = checkObj.dimention || 0;
		return function checkValue(val) {
			var errorReason = [];
			function _checkValue(v, d) {
				if (!d) {
					// チェック関数を順番に適用して、falseが返ってきたらチェック終了してfalseを返す
					for ( var i = 0, l = funcs.length; i < l; i++) {
						var result = funcs[i](v);
						if (result.length) {
							errorReason = errorReason.concat(result);
							return false;
						}
					}
					return true;
				}
				// 指定された配列次元と、渡された値の配列の次元があっていない場合はfalseを返す
				if (!$.isArray(v)) {
					errorReason.push({
						dimention: dim
					});
					return false;
				}
				for ( var i = 0, l = v.length; i < l; i++) {
					// 配列の各要素について、次元を一つ減らして再帰的にチェックする
					if (!_checkValue(v[i], d - 1)) {
						return false;
					}
				}
				// 全ての要素についてチェックが通ればtrue
				return true;
			}
			_checkValue(val, dim);
			return errorReason;
		};
	}

	/**
	 * スキーマのプロパティオブジェクトから、そのプロパティに入る値かどうかをチェックする関数を作る。 # schema:{val:xxxx,val2:....}
	 * のxxxxの部分と、マネージャを引数にとる スキーマのチェックが通ってから呼ばれる前提なので、エラーチェックは行わない。
	 *
	 * @param {object} propertyObject スキーマのプロパティオブジェクト
	 * @param {object} [manager] そのスキーマを持つモデルが属するマネージャのインスタンス。データモデルのチェックに必要(要らないなら省略可能)
	 * @return {function} 指定されたスキーマのプロパティに、引数の値が入るかどうかをチェックする関数
	 */
	function createCheckValueBySchemaPropertyObj(propertyObject, manager) {
		// schema{prop:null} のように指定されている場合はpropObjはnullなので、空オブジェクト指定と同等に扱うようにする
		var propObj = propertyObject || {};
		var checkFuncArray = [];
		var elmType = null;
		var dimention = 0;
		var type = propObj.type;
		var constraint = propObj.constraint;

		// id:true の場合 type指定がない場合はtype:string,
		// notNull(type:stringならnotEmpty)をtrueにする
		if (propObj.id) {
			type = type || 'string';
			constraint = constraint || {};
			constraint.notNull = true;
			if (type === 'string') {
				constraint.notEmpty = true;
			}
		}
		if (type) {
			// typeに指定された文字列をパースしてオブジェクトに変換
			var typeObj = getTypeObjFromString(type);


			elmType = typeObj.elmType;
			// 配列の次元。配列でないなら0
			dimention = typeObj.dimention;

			// type指定を元に値を(配列は考慮せずに)チェックする関数を作成してcheckFuncArrayに追加
			checkFuncArray.push(createTypeCheckFunction(elmType, {
				manager: manager,
				enumValue: propObj.enumValue
			}));
		}
		// constraintを値が満たすかどうかチェックする関数を作成してcheckFuncArrayに追加
		if (propObj.constraint) {
			checkFuncArray.push(createConstraintCheckFunction(propObj.constraint));
		}
		return createCheckValueByCheckObj({
			checkFuncs: checkFuncArray,
			dimention: dimention
		});
	}

	/**
	 * descriptorからschemaの各プロパティの値をチェックする関数を作成して返す
	 *
	 * @param {Object} descriptor descriptor
	 * @param {Object} manager データモデルマネージャ
	 */
	function createCheckValueByDescriptor(schema, manager) {
		var checkFuncs = {};
		for ( var p in schema) {
			checkFuncs[p] = createCheckValueBySchemaPropertyObj(schema[p], manager);
		}
		return checkFuncs;
	}

	/**
	 * validateDescriptor, validateDescriptor/Schema/DefaultValueが返すエラー情報の配列に格納するエラーオブジェクトを作成する
	 *
	 * @param {Integer} code エラーコード
	 * @param {Array} msgParam メッセージパラメータ
	 * @param {Boolean} stopOnError
	 */
	function createErrorReason(/* var args */) {
		var args = arguments;
		var code = args[0];
		args[0] = DESCRIPTOR_VALIDATION_ERROR_MSGS[code];
		var msg = h5.u.str.format.apply(null, args);
		return {
			code: code,
			message: msg
		};
	}

	/**
	 * データモデルのディスクリプタとして正しいオブジェクトかどうかチェックする。 schema以外をチェックしたあと、validateSchemaを呼び出して結果をマージして返す。
	 *
	 * @private
	 * @param {Object} descriptor オブジェクト
	 * @param {Object} DataManagerオブジェクト
	 * @param {Boolean} stopOnErro エラーが発生した時に、即座にreturnするかどうか
	 * @return {Array} schemaのチェック結果。validateSchemaの戻り値をそのまま返す
	 */
	function validateDescriptor(descriptor, manager, stopOnError) {
		var errorReason = [];
		// descriptorがオブジェクトかどうか
		if (!$.isPlainObject(descriptor)) {
			// descriptorがオブジェクトじゃなかったら、これ以上チェックしようがないので、stopOnErrorの値に関わらずreturnする
			errorReason.push(createErrorReason(DESCRIPTOR_ERR_CODE_NOT_OBJECT));
			return errorReason;
		}

		// nameのチェック
		if (!isValidNamespaceIdentifier(descriptor.name)) {
			// 識別子として不適切な文字列が指定されていたらエラー
			errorReason.push(DESCRIPTOR_ERR_CODE_INVALID_NAME);
			if (stopOnError) {
				return errorReason;
			}
		}

		// baseのチェック
		var base = descriptor.base;
		var baseSchema = null;
		if (base != null) {
			// nullまたはundefinedならチェックしない
			if (!isString(base) || base.indexOf('@') !== 0) {
				// @で始まる文字列（base.indexOf('@')が0）でないならエラー
				errorReason.push(createErrorReason(DESCRIPTOR_ERR_CODE_INVALID_BASE));
				if (stopOnError) {
					return errorReason;
				}
			} else {
				var baseName = base.substring(1);
				var baseModel = manager.models[baseName];
				if (!baseModel) {
					// 指定されたモデルが存在しないならエラー
					errorReason
							.push(createErrorReason(DESCRIPTOR_ERR_CODE_NO_EXIST_BASE, baseName));
					if (stopOnError) {
						return errorReason;
					}
				} else {
					baseSchema = manager.models[baseName].schema;
				}
			}
		}

		// schemaのチェック
		// baseSchemaがないのに、schemaが指定されていなかったらエラー
		// schemaが指定されていて、オブジェクトでないならエラー
		var schema = descriptor.schema;
		if (!baseSchema && schema == null) {
			errorReason.push(createErrorReason(DESCRIPTOR_ERR_CODE_NO_SCHEMA));
			if (stopOnError) {
				return errorReason;
			}
		}

		// base指定されていた場合は、後勝ちでextendする
		schema = $.extend(baseSchema, schema);

		// errorReasonにschemaのチェック結果を追加して返す
		return errorReason.concat(validateSchema(schema, manager, stopOnError));
	}

	/**
	 * schemaが正しいかどうか判定する
	 *
	 * @private
	 * @param {Object} schema schemaオブジェクト
	 * @param {Object} manager DataManagerオブジェクト
	 * @param {Boolean} stopOnErro エラーが発生した時に、即座にreturnするかどうか
	 * @return {Array} エラー理由を格納した配列。エラーのない場合は空配列を返す。
	 */
	function validateSchema(schema, manager, stopOnError) {
		var errorReason = [];

		// new DataModelのなかで validate → createCheckFunc → defaultValueの順でチェックする。ここではdefaultValueのチェックはしない。

		// schemaがオブジェクトかどうか
		if (!$.isPlainObject(schema)) {
			errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_NOT_OBJECT));
			// schemaがオブジェクトでなかったら、これ以上チェックしようがないので、stopOnErrorの値に関わらずreturnする
			return errorReason;
		}

		try {
			// id指定されている属性が一つだけであることをチェック
			var hasId = false;
			for ( var p in schema) {
				if (schema[p] && schema[p].id === true) {
					if (hasId) {
						errorReason
								.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_DUPLICATED_ID));
						if (stopOnError) {
							return errorReason;
						}
					}
					hasId = true;
				}
			}
			if (!hasId) {
				errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_NO_ID));
				if (stopOnError) {
					return errorReason;
				}
			}

			for ( var schemaProp in schema) {
				// null(またはundefined)がプロパティオブジェクトに指定されていたら、空オブジェクトと同等に扱い、エラーにしない。
				var propObj = schema[schemaProp] == null ? {} : schema[schemaProp];
				var isId = !!propObj.id;
				// 代入やdefaultValueの値をチェックする関数を格納する配列([typeCheck, constraintCheck]のように格納する)
				var checkFuncArray = [];

				// プロパティ名が適切なものかどうかチェック
				if (!isValidNamespaceIdentifier(schemaProp)) {
					errorReason.push(createErrorReason(
							DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_PROPERTY_NAME, schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}

				// -- dependのチェック --
				// defaultValueが指定されていたらエラー
				// onに指定されているプロパティがschema内に存在すること
				var depend = propObj.depend;
				if (depend != null) {
					// id指定されているならエラー
					if (isId) {
						errorReason.push(createErrorReason(
								DESCRIPTOR_SCHEMA_ERR_CODE_ID_AND_DEPPEND, schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}

					// dependが指定されているなら、on,calcが指定されていること
					if (depend.on == null) {
						errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_ON,
								schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					} else {
						var onArray = wrapInArray(depend.on);
						for ( var i = 0, l = onArray.length; i < l; i++) {
							if (!schema[onArray[i]]) {
								errorReason.push(createErrorReason(
										DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_ON, schemaProp));
								if (stopOnError) {
									return errorReason;
								}
								break;
							}
						}
					}
					if (typeof depend.calc !== 'function') {
						errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_DEPPEND_CALC,
								schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}
				}

				// -- typeのチェック --
				// typeに指定されている文字列は正しいか
				// defaultValueとの矛盾はないか
				// constraintにそのtypeで使えない指定がないか
				// enumの時は、enumValueが指定されているか
				var elmType = null;
				var type = propObj.type;
				if (isId && type == null) {
					// id項目で、typeが指定されていない場合は、type:stringにする
					type = 'string';
				}
				var typeObj = {};
				if (type != null) {
					if (!isString(type)) {
						errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_TYPE,
								schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}

					if (isId && type !== 'string' && type !== 'integer') {
						// id指定されているプロパティで、string,integer以外だった場合はエラー
						errorReason.push('id指定されたプロパティにtypeを指定することはできません');
					}

					// "string", "number[][]", "@DataModel"... などの文字列をパースしてオブジェクトを生成する
					typeObj = getTypeObjFromString(type);

					if (!typeObj || !typeObj.elmType) {
						// パースできない文字列が指定されていたらエラー
						errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_TYPE,
								schemaProp, type));
						if (stopOnError) {
							return errorReason;
						}
					} else {
						// データモデルの場合
						if (typeObj.dataModel) {
							if (!manager.models[typeObj.dataModel]) {
								errorReason.push(createErrorReason(
										DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_DATAMODEL, schemaProp,
										typeObj.dataModel));
								if (stopOnError) {
									return errorReason;
								}
							}
						}

						// enumの場合
						if (typeObj.elmType === 'enum') {
							// enumValueが無ければエラー
							if (propObj.enumValue == null) {
								errorReason.push(createErrorReason(
										DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_ENUM_NO_ENUMVALUE,
										schemaProp));
								if (stopOnError) {
									return errorReason;
								}
							}
						}

						// type指定を元に値を(配列は考慮せずに)チェックする関数を作成してcheckFuncArrayに追加
						checkFuncArray.push(createTypeCheckFunction(typeObj.elmType, {
							manager: manager,
							enumValue: propObj.enumValue
						}));
					}
				}

				// constraintのチェック
				// プロパティのチェック
				// 値のチェック
				// タイプと矛盾していないかのチェック
				var constraintObj = propObj.constraint;
				if (constraintObj != null) {
					if (!$.isPlainObject(constraintObj)) {
						// constraintがオブジェクトではない場合
						errorReason.push(createErrorReason(
								DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT, schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					} else {
						for ( var p in constraintObj) {
							// constraintのプロパティの値とtype指定との整合チェック
							var val = constraintObj[p];
							if (val == null) {
								continue;
							}
							switch (p) {
							case 'notNull':
								if (val !== true && val !== false) {
									// notNullにtrueまたはfalse以外が指定されていたらエラー
									errorReason
											.push(createErrorReason(
													DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
													schemaProp, p));
									if (stopOnError) {
										return errorReason;
									}
								} else if (isId && !val) {
									// id項目にnotNull:falseが指定されていたらエラー
									errorReason.push(createErrorReason(
											DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID,
											schemaProp, p, val));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							case 'min':
							case 'max':
								switch (typeObj.elmType) {
								case 'integer':
									if (isString(val) || !isIntegerValue(val) || isStrictNaN(val)) {
										// 整数値以外、NaNが指定されていたらエラー
										errorReason
												.push(createErrorReason(
														DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX,
														schemaProp, p));
										if (stopOnError) {
											return errorReason;
										}
									}
									break;
								case 'number':
									if (isString(val) || isString(val) || !isNumberValue(val)
											|| val === Infinity || val === -Infinity
											|| isStrictNaN(val)) {
										// 整数値以外、NaNが指定されていたらエラー
										errorReason
												.push(createErrorReason(
														DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MIN_MAX,
														schemaProp, p));
										if (stopOnError) {
											return errorReason;
										}
									}
									break;
								default:
									// typeの指定とconstraintに不整合があったらエラー
									errorReason.push(createErrorReason(
											DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT, schemaProp,
											p, typeObj.elmType));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							case 'minLength':
							case 'maxLength':
								switch (typeObj.elmType) {
								case 'string':
									if (isString(val) || !isIntegerValue(val) || isStrictNaN(val)
											|| val < 0) {
										// typeの指定とconstraintに不整合があったらエラー
										errorReason
												.push(createErrorReason(
														DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH,
														schemaProp, p));
										if (stopOnError) {
											return errorReason;
										}
									} else if (isId && p === 'maxLength' && val === 0) {
										// id項目にmaxLength: 0 が指定されていたらエラー
										errorReason.push(createErrorReason(
												DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID,
												schemaProp, p, val));
										if (stopOnError) {
											return errorReason;
										}
									}
									break;
								default:
									// type:'string'以外の項目にmaxLength,minLengthが指定されていればエラー
									errorReason.push(createErrorReason(
											DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT, schemaProp,
											p, typeObj.elmType));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							case 'notEmpty':
								switch (typeObj.elmType) {
								case 'string':
									if (val !== true && val !== false) {
										// notEmptyにtrue,false以外の指定がされていたらエラー
										errorReason
												.push(createErrorReason(
														DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
														schemaProp, p));
										if (stopOnError) {
											return errorReason;
										}
									} else if (isId && !val) {
										// id項目にnotEmpty: false が指定されていたらエラー
										errorReason.push(createErrorReason(
												DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT_ID,
												schemaProp, p, val));
										if (stopOnError) {
											return errorReason;
										}
									}
									break;
								default:
									// type:'string'以外の項目にnotEmptyが指定されていたらエラー
									errorReason.push(createErrorReason(
											DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT, schemaProp,
											p, typeObj.elmType));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							case 'pattern':
								switch (typeObj.elmType) {
								case 'string':
									if ($.type(val) !== 'regexp') {
										// patternにRegExpオブジェクト以外のものが指定されていたらエラー
										errorReason
												.push(createErrorReason(
														DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_CONSTRAINT_PATTERN,
														schemaProp, p));
										if (stopOnError) {
											return errorReason;
										}
									}
									break;
								default:
									// type:'string'以外の項目にpatterが指定されていたらエラー
									errorReason.push(createErrorReason(
											DESCRIPTOR_SCHEMA_ERR_CODE_TYPE_CONSTRAINT, schemaProp,
											p, typeObj.elmType));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							}
						}

						// constraintの中身に矛盾がないかどうかチェック
						if (constraintObj.notEmpty && constraintObj.minLength === 0) {
							// notNullなのにminLengthが0
							errorReason.push(createErrorReason(
									DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT, schemaProp,
									'notEmpty', 'minLength'));
							if (stopOnError) {
								return errorReason;
							}
						}
						if (constraintObj.notEmpty && constraintObj.maxLength === 0) {
							// notNullなのにmanLengthが0
							errorReason.push(createErrorReason(
									DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT, schemaProp,
									'notEmpty', 'maxLength'));
							if (stopOnError) {
								return errorReason;
							}
						}
						if (constraintObj.min != null && constraintObj.max != null
								&& constraintObj.min > constraintObj.max) {
							// notNullなのにmanLengthが0
							errorReason.push(createErrorReason(
									DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT, schemaProp,
									'min', 'max'));
							if (stopOnError) {
								return errorReason;
							}
						}
						if (constraintObj.minLength != null && constraintObj.maxLength != null
								&& constraintObj.minLength > constraintObj.maxLength) {
							// notNullなのにmanLengthが0
							errorReason.push(createErrorReason(
									DESCRIPTOR_SCHEMA_ERR_CODE_CONSTRAINT_CONFLICT, schemaProp,
									'minLength', 'maxLength'));
							if (stopOnError) {
								return errorReason;
							}
						}
					}
				}


				// enumValueのチェック
				var enumValue = propObj.enumValue;
				if (enumValue != null) {
					if (typeObj.elmType !== 'enum') {
						// type指定がenumでないならエラー
						errorReason.push(createErrorReason(
								DESCRIPTOR_SCHEMA_ERR_CODE_ENUMVALUE_TYPE, schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}
					if (!$.isArray(enumValue) || enumValue.length === 0
							|| $.inArray(null, enumValue) > -1
							|| $.inArray(undefined, enumValue) > -1) {
						// 配列でない、または空配列、null,undefinedを含む配列ならエラー
						errorReason.push(createErrorReason(
								DESCRIPTOR_SCHEMA_ERR_CODE_INVALID_ENUMVALUE, schemaProp));
						if (stopOnError) {
							return errorReason;
						}
					}
				}

				// defaultValueのチェック
				// defaultValueがtypeやconstraintの条件を満たしているかのチェックはここでは行わない
				// id:trueの項目にdefaultValueが指定されていればここでエラーにする
				if (isId && propObj.hasOwnProperty('defaultValue')) {
					// id項目にdefaultValueが設定されていたらエラー
					errorReason.push(createErrorReason(DESCRIPTOR_SCHEMA_ERR_CODE_DEFAULTVALUE_ID,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}
			}
		} catch (e) {
			//ignore errors
			fwLogger.debug('validateSchema: Exception occured. message = {0}', e.message);
		}

		return errorReason;
	}

	/**
	 * checkFuncsの条件をdefaultValueが満たすかどうかチェックする
	 *
	 * @param {Object} descriptor descriptor
	 * @param {Object} checkFuncs 各プロパティをキーに、チェックする関数を持つオブジェクト
	 * @param {Boolean} stopOnError defaultValueがチェック関数を満たさない時に、エラーを投げてチェックを中断するかどうか
	 * @return {Array} エラー情報を格納した配列。エラーのない場合は中身のない配列を返す
	 */
	function validateDefaultValue(schema, checkFuncs, stopOnError) {
		var errorReason = [];
		for ( var p in schema) {
			var propObj = schema[p];
			if (!propObj || !propObj.hasOwnProperty('defaultValue') && propObj.type
					&& (propObj.type === 'array' || getTypeObjFromString(propObj.type).dimention)) {
				// defaultValueが指定されていないかつ、type指定が配列指定であれば、
				// 初期値は空のOvservableArrayになる。
				// 空のOvservableArrayがチェックに引っかかることはないので、チェック関数でチェックしない。
				continue;
			}

			// defaultValueが指定されていない場合は、ここではチェックしない
			if (!propObj.hasOwnProperty('defaultValue')) {
				continue;
			}
			var defaultValue = propObj.defaultValue;
			if (checkFuncs[p](defaultValue).length) {
				errorReason.push(createErrorReason(
						DESCRIPTOR_SCHEMA_ERR_CODE_INVALIDATE_DEFAULTVALUE, p, defaultValue));
				if (stopOnError) {
					return errorReason;
				}
			}
		}
		return errorReason;
	}

	/**
	 * constraintオブジェクトから、値がそのconstraintの条件を満たすかどうか判定する関数を作成する
	 *
	 * @param {object} constraint constraintオブジェクト
	 * @return {function} 値がconstraintを満たすかどうかチェックする関数。正しい場合は空配列、そうじゃない場合は引っかかった項目を返す
	 */
	function createConstraintCheckFunction(constraint) {
		return function(v) {
			var errObjs = [];
			if (constraint.notNull && v == null) {
				errObjs.push({
					notNull: constraint.notNull
				});
			}
			if (constraint.notEmpty && !v) {
				errObjs.push({
					notEmpty: constraint.notEmpty
				});
			}
			if (v == null) {
				// notNull,notEmptyのチェック以外は、nullでないものについてチェックを行うので、nullならtrueを返す
				return errObjs;
			}
			if (constraint.min != null && v < constraint.min) {
				errObjs.push({
					min: constraint.min
				});
			}
			if (constraint.max != null && constraint.max < v) {
				errObjs.push({
					max: constraint.max
				});
			}
			if (constraint.minLength != null && v.length < constraint.minLength) {
				errObjs.push({
					minLength: constraint.minLength
				});
			}
			if (constraint.maxLength != null && constraint.maxLength < v.length) {
				errObjs.push({
					maxLength: constraint.maxLength
				});
			}
			if (constraint.pattern != null && !v.match(constraint.pattern)) {
				errObjs.push({
					pattern: constraint.pattern
				});
			}
			return errObjs;
		};
	}

	/**
	 * type指定された文字列(から"[]"を除いた文字列)、引数がそのtypeを満たすかどうか判定する関数を作成する
	 *
	 * @param {string} elmType type指定文字列
	 * @param {object} [opt] type判定に使用するためのオプション
	 * @param {object} [opt.manager]
	 *            DataManagerオブジェクト。"@DataModel"のようにデータモデルを指定された場合、managerからデータモデルを探す
	 * @param {array} [opt.enumValue] typeが"enum"の場合、enumValueに入っているかどうかで判定する
	 * @return {function} 引数がそのtypeを満たすかどうか判定する関数。満たすなら空配列、満たさないならエラーオブジェクトの入った配列を返す。
	 */
	function createTypeCheckFunction(elmType, opt) {
		var errObjs = [{
			type: elmType
		}];
		switch (elmType) {
		case 'number':
			return function(v) {
				if (isNumberValue(v)) {
					return [];
				}
				return errObjs;
			};
		case 'integer':
			return function(v) {
				if (isIntegerValue(v)) {
					return [];
				}
				return errObjs;
			};
		case 'string':
			return function(v) {
				if (isStringValue(v)) {
					return [];
				}
				return errObjs;
			};
		case 'boolean':
			return function(v) {
				if (isBooleanValue(v)) {
					return [];
				}
				return errObjs;
			};
		case 'enum':
			return function(v) {
				if (isEnumValue(v, opt.enumValue)) {
					return [];
				}
				return errObjs;
			};
		case 'any':
			// anyならタイプチェックは行わない
			return function() {
				return [];
			};
		}
		// タイプチェックは終わっているはずなので、どのケースにも引っかからない場合はデータモデルかつ、そのデータモデルはマネージャに存在する
		var matched = elmType.match(/^@(.+?)$/);
		var dataModelName = matched[1];
		var manager = opt.manager;
		return function(v) {
			var dataModel = manager.models[dataModelName];
			if (!dataModel) {
				// チェック時点でモデルがマネージャからドロップされている場合はfalse
				return errObjs;
			}
			if (typeof v !== 'object' && v != null) {
				// オブジェクト(またはnull,undefined)でないならfalse
				return errObjs;
			}
			// チェック時にそのモデルが持ってるアイテムかどうかで判定する
			// nullはOK
			if (v == null || dataModel.has(v)) {
				return [];
			}
			return errObjs;
		};
	}


	//========================================================
	//
	// バリデーション関係コードここまで
	//
	//========================================================



	function isTypeArray(typeStr) {
		if (!typeStr) {
			return false;
		}
		return typeStr.indexOf('[]') !== -1;
	}

	function getValue(item, prop) {
		return item[ITEM_PROP_BACKING_STORE_PREFIX + prop];
	}

	function setValue(item, prop, value) {
		item[ITEM_PROP_BACKING_STORE_PREFIX + prop] = value;
	}


	function itemSetter(model, item, valueObj, noValidationProps, ignoreProps) {
		var readyProps = [];

		//先に、すべてのプロパティの整合性チェックを行う
		for ( var prop in valueObj) {
			if (!(prop in model.schema) || (ignoreProps && ($.inArray(prop, ignoreProps) !== -1))) {
				//schemaに存在しない、または無視すべきプロパティは無視する
				continue;
			}

			var oldValue = getValue(item, prop);
			var newValue = valueObj[prop];

			if (oldValue === newValue) {
				//同じ値がセットされた場合は何もしない
				continue;
			}

			//ここでpushしたプロパティのみ、後段で値をセットする
			readyProps.push({
				p: prop,
				o: oldValue,
				n: newValue
			});

			if (noValidationProps && ($.inArray(prop, noValidationProps) !== -1)) {
				//このプロパティをバリデーションしなくてよいと明示されている場合はバリデーションを行わない
				//型が配列（type:[]）の場合に、フラグが立っていたら、値がnull/undefinedでもよいとする
				//(create()時にdefaultValueがなくてもエラーにならないようにする)のが用途
				continue;
			}

			//型・制約チェック
			//配列が渡された場合、その配列の要素が制約を満たすかをチェックしている
			var validateResult = model._validateItemValue(prop, newValue);
			if (validateResult.length > 0) {
				throwFwError(ERR_CODE_INVALID_ITEM_VALUE, prop, validateResult);
			}
		}

		var changedProps = {};
		var changedPropNameArray = [];

		//値の変更が起こる全てのプロパティについて整合性チェックが通ったら、実際に値を代入する
		for ( var i = 0, len = readyProps.length; i < len; i++) {
			var readyProp = readyProps[i];

			//TODO 判定文改良
			if (model.schema[readyProp.p] && isTypeArray(model.schema[readyProp.p].type)) {
				//配列の場合は値のコピーを行う。ただし、コピー元がnullの場合があり得る（create()でdefaultValueがnull）ので
				//その場合はコピーしない
				if (readyProp.n) {
					getValue(item, readyProp.p).copyFrom(readyProp.n);
				}
			} else {
				//新しい値を代入
				setValue(item, readyProp.p, readyProp.n);
			}

			changedProps[readyProp.p] = {
				oldValue: readyProp.o,
				newValue: readyProp.n
			};

			changedPropNameArray.push(readyProp.p);
		}

		//今回変更されたプロパティと依存プロパティを含めてイベント送出
		var event = {
			type: 'change',
			target: item,
			props: changedProps
		};

		//依存プロパティを再計算する
		var changedDependProps = calcDependencies(model, item, event, changedPropNameArray);

		//依存プロパティの変更をchangeイベントに含める
		$.extend(changedProps, changedDependProps);

		return event;
	}

	/**
	 * 依存プロパティの再計算を行います。再計算後の値はitemの各依存プロパティに代入されます。
	 *
	 * @param {DataModel} model データモデル
	 * @param {DataItem} item データアイテム
	 * @param {Object} event プロパティ変更イベント
	 * @param {String|String[]} changedProps 今回変更されたプロパティ
	 * @returns {Object} { dependProp1: { oldValue, newValue }, ... } という構造のオブジェクト
	 */
	function calcDependencies(model, item, event, changedProps) {
		var dependsMap = model._dependencyMap;

		//変更された実プロパティを初期計算済みプロパティとしてdependの計算をスタート
		var done = wrapInArray(changedProps).slice(0);

		/**
		 * この依存プロパティが計算可能（依存するすべてのプロパティの再計算が完了している）かどうかを返します。
		 */
		function isReady(dependProp) {
			var deps = wrapInArray(model.schema[dependProp].depend.on);
			for ( var i = 0, len = deps.length; i < len; i++) {
				if ($.inArray(deps[i], done) === -1) {
					return false;
				}
			}
			return true;
		}

		/**
		 * changedPropsで指定されたプロパティに依存するプロパティをtargetArrayに追加する
		 */
		function addDependencies(targetArray, srcProps) {
			for ( var i = 0, len = srcProps.length; i < len; i++) {
				var depends = dependsMap[srcProps[i]];

				if (!depends) {
					continue;
				}

				for ( var j = 0, jlen = depends.length; j < jlen; j++) {
					var dprop = depends[j];
					if ($.inArray(dprop, targetArray) === -1) {
						targetArray.push(dprop);
					}
				}
			}
		}

		var ret = {};

		var targets = [];

		//今回変更された実プロパティに依存するプロパティを列挙
		addDependencies(targets, wrapInArray(changedProps));

		while (targets.length !== 0) {
			var restTargets = [];

			//各依存プロパティについて、計算可能（依存するすべてのプロパティが計算済み）なら計算する
			for ( var i = 0, len = targets.length; i < len; i++) {
				var dp = targets[i];

				if (isReady(dp)) {
					var newValue = model.schema[dp].depend.calc.call(item, event);

					ret[dp] = {
						oldValue: getValue(item, dp),
						newValue: newValue
					};

					setValue(item, dp, newValue);
					done.push(dp);
				} else {
					restTargets.push(dp);
				}
			}

			//今回計算対象となったプロパティに（再帰的に）依存するプロパティをrestに追加
			//restTargetsは「今回計算できなかったプロパティ＋新たに依存関係が発見されたプロパティ」が含まれる
			addDependencies(restTargets, targets);

			targets = restTargets;
		}

		return ret;
	}

	function createDependencyMap(schema) {
		//{ 依存元: [依存先] }という構造のマップ。依存先プロパティは配列内で重複はしない。
		var dependencyMap = {};

		for ( var prop in schema) {
			if (schema.hasOwnProperty(prop)) {
				var dependency = schema[prop] ? schema[prop].depend : null;
				if (dependency) {
					var dependOn = wrapInArray(dependency.on);
					for ( var i = 0, len = dependOn.length; i < len; i++) {
						var dependSrcPropName = dependOn[i];

						if (!dependencyMap[dependSrcPropName]) {
							dependencyMap[dependSrcPropName] = [];
						}
						if ($.inArray(prop, dependencyMap[dependSrcPropName]) === -1) {
							dependencyMap[dependSrcPropName].push(prop);
						}
					}
				}
			}
		}

		return dependencyMap;
	}


	/**
	 * propで指定されたプロパティのプロパティソースを作成します。
	 *
	 * @private
	 */
	function createDataItemConstructor(model, descriptor) {
		//model.schemaは継承関係を展開した後のスキーマ
		var schema = model.schema;

		function setObservableArrayObserveBeforeListener(model, propName, observableArray) {
			function validateObservableArrayChange(event) {
				//TODO ES5対応
				//Array自体を直接変化される関数のリスト。ただし、sort, reserveは値を追加するものではないのでバリデーションは不要（なので何もしない）
				var breakingMethods = ['unshift', 'push', 'splice', 'copyFrom'];
				if ($.inArray(event.method, breakingMethods) === -1) {
					return;
				}

				var args = argsToArray(event.args);

				if (event.method === 'splice') {
					if (args.length <= 2) {
						return;
					}
					args.shift();
					args.shift();
				}

				var validateResult = model._validateItemValue(propName, args);
				if (validateResult.length > 0) {
					throwFwError(ERR_CODE_INVALID_ITEM_VALUE, plainProp, validateResult);
				}
			}

			observableArray.addEventListener('observeBefore', validateObservableArrayChange);
		}

		/**
		 * DataItemのコンストラクタ
		 *
		 * @class
		 * @constructor
		 * @param {Object} userInitialValue ユーザー指定の初期値
		 */
		function DataItem(userInitialValue) {
			//TODO プロパティ拡張がある場合のみ
			//isInUpdateがtrueの場合にセッターでセットされた値を一時的に格納するための領域
			//内部は { (変更されたprop): { oldValue, newValue } } の形式
			this.__dirty = {};

			var actualInitialValue = {};

			var noValidationProps = [];

			//デフォルト値を代入する
			for ( var plainProp in schema) {
				var propDesc = schema[plainProp];

				if (propDesc && propDesc.depend) {
					//依存プロパティにはデフォルト値はない（最後にrefresh()で計算される）
					continue;
				}

				if (propDesc && isTypeArray(propDesc.type)) {
					//配列の場合は最初にObservableArrayのインスタンスを入れる
					var obsArray = h5.u.obj.createObservableArray(); //TODO cache
					setObservableArrayObserveBeforeListener(model, plainProp, obsArray);
					setValue(this, plainProp, obsArray);
				}

				var initValue = null;

				if (plainProp in userInitialValue) {
					//create時に初期値が与えられていたらそれを代入
					initValue = userInitialValue[plainProp];
				} else if (propDesc && propDesc.defaultValue !== undefined) {
					//DescriptorのdefaultValueがあれば代入
					initValue = propDesc.defaultValue;

					//TODO else節と共通化
					if (propDesc && isTypeArray(propDesc.type)) {
						//type:[]の場合、、defaultValueは事前に制約チェック済みなので改めてvalidationしなくてよい
						noValidationProps.push(plainProp);
					}
				} else {
					//どちらでもない場合はnull
					//ただし、notNull制約などがついている場合はセッターで例外が発生する
					initValue = null;

					if (propDesc && isTypeArray(propDesc.type)) {
						//type:[]で、userInitValueもdefaultValueも与えられなかった場合はvalidationを行わない
						noValidationProps.push(plainProp);
					}
				}

				actualInitialValue[plainProp] = initValue;
			}

			itemSetter(model, this, actualInitialValue, noValidationProps);
		}
		$.extend(DataItem.prototype, EventDispatcher.prototype, {
			/**
			 * 指定されたキーのプロパティの値を取得します。
			 *
			 * @memberOf DataItem
			 * @param {String} key プロパティキー
			 * @returns {Any} 指定されたプロパティの値
			 */
			get: function(key) {
				return getValue(this, key);
			},

			/**
			 * 指定されたキーのプロパティに値をセットします。<br>
			 * 複数のプロパティに対して値を一度にセットしたい場合は、{ キー1: 値1, キー2: 値2, ... }という構造をもつオブジェクトを1つだけ渡してください。<br>
			 * 1つのプロパティに対して値をセットする場合は、 item.set(key, value); のように2つの引数でキーと値を個別に渡すこともできます。<br>
			 * このメソッドを呼ぶと、再計算が必要と判断された依存プロパティは自動的に再計算されます。<br>
			 * 再計算によるパフォーマンス劣化を最小限にするには、1つのアイテムへのset()の呼び出しはできるだけ少なくする<br>
			 * （引数をオブジェクト形式にして一度に複数のプロパティをセットし、呼び出し回数を最小限にする）ようにしてください。
			 *
			 * @memberOf DataItem
			 * @param {Any} var_args 複数のキー・値のペアからなるオブジェクト、または1組の(キー, 値)を2つの引数で取る
			 */
			set: function(var_args) {
				//引数はオブジェクト1つ、または(key, value)で呼び出せる
				var valueObj = var_args;
				if (arguments.length === 2) {
					valueObj = {};
					valueObj[arguments[0]] = arguments[1];
				}

				if (model.idKey in valueObj) {
					//IDの上書きは禁止
					throwFwError(ERR_CODE_CANNOT_SET_ID, null, this);
				}

				var event = itemSetter(model, this, valueObj, null);

				//TODO managerに属しているかの条件は修正？
				if (!model.manager || (model.manager && !model.manager.isInUpdate())) {
					//TODO もしこのDataItemがremoveされていたらmodelには属していない
					//アップデートセッション外の場合は即座にイベント送出
					this.dispatchEvent(event);
				}
			}
		});

		return DataItem;
	}


	/**
	 * 指定されたIDのデータアイテムを生成します。
	 *
	 * @param {DataModel} model データモデル
	 * @param {Object} data 初期値
	 * @param {Function} itemChangeListener modelに対応する、データアイテムチェンジイベントリスナー
	 * @returns {DataItem} データアイテムオブジェクト
	 */
	//	function createItem(model, data, itemChangeListener) {
	//		//キーが文字列かつ空でない、かどうかのチェックはDataModel.create()で行われている
	//
	//		var id = data[model.idKey];
	//
	//		var item = new model.itemConstructor(data);
	//
	//		model.items[id] = item;
	//		model.size++;
	//
	//		item.addEventListener('change', itemChangeListener);
	//
	//		return item;
	//	}
	/**
	 * スキーマの継承関係を展開し、フラットなスキーマを生成します。 同じ名前のプロパティは「後勝ち」です。
	 *
	 * @param {Object} schema スキーマオブジェクト(このオブジェクトに展開後のスキーマが格納される)
	 * @param {Object} manager データモデルマネージャ
	 * @param {Object} desc データモデルディスクリプタ
	 */
	function extendSchema(schema, manager, desc) {
		var base = desc.base;

		if (base) {
			if (!manager) {
				//baseが設定されている場合、このデータモデルがマネージャに属していなければ継承元を探せないのでエラー
				throwFwError(ERR_CODE_NO_MANAGER);
			}

			//TODO データモデルの登録の順序関係に注意
			var baseModelDesc = manager.models[base.slice(1)];

			//$.extend()は後勝ちなので、より上位のものから順にextend()するように再帰
			extendSchema(schema, manager, baseModelDesc);
		}

		$.extend(schema, desc.schema);
	}


	/**
	 * 当該モデルに対応するアップデートログ保持オブジェクトを取得する。 オブジェクトがない場合は生成する。
	 */
	function getModelUpdateLogObj(model) {
		var manager = model.manager;
		var modelName = model.name;

		if (!manager._updateLogs[modelName]) {
			manager._updateLogs[modelName] = {};
		}

		return manager._updateLogs[modelName];
	}


	/**
	 * 当該モデルが属しているマネージャにUpdateLogを追加する
	 */
	function addUpdateLog(model, type, items) {
		if (!model.manager) {
			return;
		}

		var modelLogs = getModelUpdateLogObj(model);

		for ( var i = 0, len = items.length; i < len; i++) {
			var item = items[i];
			var itemId = item[model.idKey];

			if (!modelLogs[itemId]) {
				modelLogs[itemId] = [];
			}
			modelLogs[itemId].push({
				type: type,
				item: item
			});
		}
	}

	/**
	 * 当該モデルが属しているマネージャにUpdateChangeLogを追加する
	 */
	function addUpdateChangeLog(model, ev) {
		if (model.manager !== manager) {
			return;
		}

		var modelLogs = getModelUpdateLogObj(model);

		var itemId = ev.target[model.idKey];

		if (!modelLogs[itemId]) {
			modelLogs[itemId] = [];
		}
		modelLogs[itemId].push({
			type: UPDATE_LOG_TYPE_CHANGE,
			ev: ev
		});
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================


	function createSequence(start, step, returnType) {
		var current = start !== undefined ? start : 1;
		var theStep = step !== undefined ? step : 1;

		function currentInt() {
			return current;
		}

		function nextInt() {
			var val = current;
			current += theStep;
			return val;
		}

		function currentString() {
			return current.toString();
		}

		function nextString() {
			var val = current;
			current += theStep;
			return val.toString();
		}

		var methods;
		if (returnType === SEQUENCE_RETURN_TYPE_STRING) {
			methods = {
				current: currentString,
				next: nextString,
				returnType: SEQUENCE_RETURN_TYPE_STRING
			};
		} else {
			methods = {
				current: currentInt,
				next: nextInt,
				returnType: SEQUENCE_RETURN_TYPE_INT
			};
		}
		methods.setCurrent = function(value) {
			current = value;
		};

		function Sequence() {}
		$.extend(Sequence.prototype, methods);

		return new Sequence();
	}




	/**
	 * @memberOf h5.core.data
	 * @class
	 * @name DataModel
	 */
	function DataModel(descriptor, manager, itemValueCheckFuncs) {
		/**
		 * @memberOf DataModel
		 */
		this.descriptor = null;

		/**
		 * @memberOf DataModel
		 */
		this.items = {};

		/**
		 * @memberOf DataModel
		 */
		this.size = 0;

		/**
		 * @memberOf DataModel
		 */
		this.name = descriptor.name;

		/**
		 * @memberOf DataModel
		 */
		this.manager = manager;

		//TODO sequence対応は後日
		//this.idSequence = 0;

		//継承元がある場合はそのプロパティディスクリプタを先にコピーする。
		//継承元と同名のプロパティを自分で定義している場合は
		//自分が持っている定義を優先するため。
		var schema = {};


		//継承を考慮してスキーマを作成
		extendSchema(schema, manager, descriptor);

		for ( var prop in schema) {
			if (schema[prop] && schema[prop].id === true) {
				//ディスクリプタは事前検証済みなので、IDフィールドは必ず存在する
				this.idKey = prop;
				break;
			}
		}

		//DataModelのschemaプロパティには、継承関係を展開した後のスキーマを格納する
		this.schema = schema;

		var schemaIdType = schema[this.idKey].type;
		if (schemaIdType) {
			if (schemaIdType === 'string') {
				this._idType = ID_TYPE_STRING;
			} else {
				this._idType = ID_TYPE_INT;
			}
		} else {
			this._idType = ID_TYPE_STRING;
		}

		/**
		 * プロパティの依存関係マップ
		 */
		this._dependencyMap = createDependencyMap(schema);

		/**
		 * プロパティの型・制約チェック関数
		 */
		this._itemValueCheckFuncs = itemValueCheckFuncs;

		/**
		 * このデータモデルに対応するデータアイテムのコンストラクタ関数
		 */
		this.itemConstructor = createDataItemConstructor(this, descriptor);

		//TODO this.fullname -> managerの名前までを含めた完全修飾名
	}

	//EventDispatcherの機能を持たせるため、prototypeをコピーし、そのうえでDataModel独自のプロパティを追加する
	$.extend(DataModel.prototype, EventDispatcher.prototype,
			{
				/**
				 * 指定されたIDと初期値がセットされたデータアイテムを生成します。<br>
				 * データアイテムはこのデータモデルに紐づけられた状態になっています。<br>
				 * <br>
				 * 指定されたIDのデータアイテムがすでにこのデータモデルに存在した場合は、<br>
				 * 既に存在するデータアイテムを返します（新しいインスタンスは生成されません）。<br>
				 * 従って、1つのデータモデルは、1IDにつき必ず1つのインスタンスだけを保持します。<br>
				 * なお、ここでIDの他に初期値も渡された場合は、既存のインスタンスに初期値をセットしてから返します。<br>
				 * このとき、当該インスタンスにイベントハンドラが設定されていれば、changeイベントが（通常の値更新と同様に）発生します。
				 *
				 * @memberOf DataModel
				 * @param {Object|Object[]} objOrArray 初期値オブジェクト、またはその配列
				 * @returns {DataItem|DataItem[]} データアイテム、またはその配列
				 */
				create: function(objOrArray) {
					var ret = [];

					var idKey = this.idKey;

					//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
					//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
					//入っていない場合は一時的にセッションを作成する。
					var isAlreadyInUpdate = this.manager ? this.manager.isInUpdate() : false;

					if (!isAlreadyInUpdate) {
						this.manager.beginUpdate();
					}

					var actualNewItems = [];

					var items = wrapInArray(objOrArray);
					for ( var i = 0, len = items.length; i < len; i++) {
						var valueObj = items[i];

						var itemId = valueObj[idKey];
						//TODO idがintegerの場合もある
						if (!isString(itemId) || itemId.length === 0) {
							throwFwError(ERR_CODE_NO_ID);
						}

						var storedItem = this._findById(itemId);
						if (storedItem) {
							// 既に存在するオブジェクトの場合は値を更新。ただし、valueObjのIDフィールドは無視（上書きなので問題はない）
							itemSetter(this, storedItem, valueObj, null, [idKey]);
							ret.push(storedItem);
						} else {
							var newItem = new this.itemConstructor(valueObj);

							this.items[itemId] = newItem;
							this.size++;

							newItem.addEventListener('change', this._itemChangeListener);

							actualNewItems.push(newItem);
							ret.push(newItem);
						}
					}

					if (actualNewItems.length > 0) {
						addUpdateLog(this, UPDATE_LOG_TYPE_CREATE, actualNewItems);
					}

					if (!isAlreadyInUpdate) {
						this.manager.endUpdate();
					}

					if ($.isArray(objOrArray)) {
						return ret;
					}
					return ret[0];
				},

				/**
				 * 指定されたIDのデータアイテムを返します。<br>
				 * 当該IDを持つアイテムをこのデータモデルが保持していない場合はnullを返します。<br>
				 * 引数にIDの配列を渡した場合に一部のIDのデータアイテムが存在しなかった場合、<br>
				 * 戻り値の配列の対応位置にnullが入ります。<br>
				 * （例：get(['id1', 'id2', 'id3']) でid2のアイテムがない場合、戻り値は [item1, null, item3] のようになる ）
				 *
				 * @memberOf DataModel
				 * @param {String|String[]} ID、またはその配列
				 * @returns {DataItem|DataItem[]} データアイテム、またはその配列
				 */
				get: function(idOrArray) {
					if ($.isArray(idOrArray)) {
						var ret = [];
						for ( var i = 0, len = idOrArray.length; i < len; i++) {
							ret.push(this._findById(idOrArray[i]));
						}
						return ret;
					}
					//引数の型チェックはfindById内で行われる
					return this._findById(idOrArray);
				},

				/**
				 * 指定されたIDのデータアイテムをこのデータモデルから削除します。<br>
				 * 当該IDを持つアイテムをこのデータモデルが保持していない場合はnullを返します。<br>
				 * 引数にIDの配列を渡した場合に一部のIDのデータアイテムが存在しなかった場合、<br>
				 * 戻り値の配列の対応位置にnullが入ります。<br>
				 * （例：remove(['id1', 'id2', 'id3']) でid2のアイテムがない場合、<br>
				 * 戻り値は [item1, null, item3]のようになります。）<br>
				 * 引数にID(文字列)またはデータアイテム以外を渡した場合はnullを返します。
				 *
				 * @memberOf DataModel
				 * @param {String|DataItem|String[]|DataItem[]} 削除するデータアイテム
				 * @returns {DataItem|DataItem[]} 削除したデータアイテム
				 */
				remove: function(objOrItemIdOrArray) {
					//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
					//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
					//入っていない場合は一時的にセッションを作成する。
					var isAlreadyInUpdate = this.manager ? this.manager.isInUpdate() : false;
					if (!isAlreadyInUpdate) {
						this.manager.beginUpdate();
					}

					var idKey = this.idKey;
					var ids = wrapInArray(objOrItemIdOrArray);

					var actualRemovedItems = [];
					var ret = [];

					for ( var i = 0, len = ids.length; i < len; i++) {
						if (!this.has(ids[i])) {
							//指定されたアイテムが存在しない場合はnull
							ret.push(null);
							continue;
						}

						var id = isString(ids[i]) ? ids[i] : ids[i][idKey];

						var item = this.items[id];

						item.removeEventListener('change', this._itemChangeListener);

						//dirtyリストに入っていたら取り除く
						if (this._dirtyItems) {
							var dirtyIdx = $.inArray(item, this._dirtyItems);
							if (dirtyIdx > -1) {
								this._dirtyItems.splice(dirtyIdx, 1);
							}
						}

						delete this.items[id];

						this.size--;

						ret.push(item);
						actualRemovedItems.push(item);
					}

					if (actualRemovedItems.length > 0) {
						addUpdateLog(this, UPDATE_LOG_TYPE_REMOVE, actualRemovedItems);
					}

					if (!isAlreadyInUpdate) {
						this.manager.endUpdate();
					}

					if ($.isArray(objOrItemIdOrArray)) {
						return ret;
					}
					return ret[0];
				},

				/**
				 * 指定されたデータアイテムを保持しているかどうかを返します。<br>
				 * 文字列が渡された場合はID(文字列)とみなし、 オブジェクトが渡された場合はデータアイテムとみなします。<br>
				 * オブジェクトが渡された場合、自分が保持しているデータアイテムインスタンスかどうかをチェックします。<br>
				 * 従って、同じ構造を持つ別のインスタンスを引数に渡した場合はfalseが返ります。<br>
				 * データアイテムインスタンスを引数に渡した場合に限り（そのインスタンスをこのデータモデルが保持していれば）trueが返ります。<br>
				 *
				 * @param {String|Object} idOrObj ID文字列またはデータアイテムオブジェクト
				 * @returns {Boolean} 指定されたIDのデータアイテムをこのデータモデルが保持しているかどうか
				 */
				has: function(idOrObj) {
					if (isString(idOrObj)) {
						return !!this._findById(idOrObj);
					} else if (typeof idOrObj === 'object') {
						//型の厳密性はitemsとの厳密等価比較によってチェックできるので、if文ではtypeofで充分
						return (idOrObj != null)
								&& (idOrObj === this.items[getValue(idOrObj, this.idKey)]);
					} else {
						return false;
					}
				},

				_validateItemValue: function(prop, value) {
					return this._itemValueCheckFuncs[prop](value);
				},

				_itemChangeListener: function(event) {
					//TODO inUpdateの場合Item自体がイベントを出さないのでこの制御は不要になる予定
					//			if (this.manager && this.manager.isInUpdate()) {
					//				addUpdateChangeLog(this, event);
					//				return;
					//			}

					this.dispatchEvent(createDataModelItemsChangeEvent([], [], [], [event]));
				},

				/**
				 * 指定されたIDのデータアイテムを返します。 アイテムがない場合はnullを返します。
				 *
				 * @private
				 * @param {String} id データアイテムのID
				 * @returns {DataItem} データアイテム、存在しない場合はnull
				 */
				_findById: function(id) {
					//TODO number対応
					//データアイテムは、取得系APIではIDを文字列型で渡さなければならない
					if (!isString(id)) {
						throwFwError(ERR_CODE_ID_MUST_BE_STRING);
					}
					var item = this.items[id];
					return item === undefined ? null : item;
				}
			});



	/**
	 * データモデルマネージャ
	 *
	 * @class
	 * @name DataModelManager
	 */
	function DataModelManager(managerName) {
		if (!isValidNamespaceIdentifier(managerName)) {
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}

		this.models = {};
		this.name = managerName;
		this._updateLogs = null;
	}
	DataModelManager.prototype = new EventDispatcher();
	$.extend(DataModelManager.prototype, {
		/**
		 * @param {Object} descriptor データモデルディスクリプタ
		 * @memberOf DataModelManager
		 */
		createModel: function(descriptor) {
			//TODO 配列対応

			//registerDataModelは初めにDescriptorの検証を行う。
			//検証エラーがある場合は例外を送出する。
			//エラーがない場合はデータモデルを返す（登録済みの場合は、すでにマネージャが持っているインスタンスを返す）。
			return registerDataModel(descriptor, this);
		},

		/**
		 * 指定されたデータモデルを削除します。 データアイテムを保持している場合、アイテムをこのデータモデルからすべて削除した後 データモデル自体をマネージャから削除します。
		 *
		 * @param {String} name データモデル名
		 * @memberOf DataModelManager
		 */
		dropModel: function(name) {
			//TODO dropModelするときに依存していたらどうするか？
			//エラーにしてしまうか。
			var model = this.models[name];
			if (!model) {
				return;
			}
			model.manager = null;
			delete this.models[name];
			return model;
		},

		/**
		 * @returns {Boolean} アップデートセッション中かどうか
		 */
		isInUpdate: function() {
			return this._updateLogs !== null;
		},

		beginUpdate: function() {
			if (this.isInUpdate()) {
				return;
			}

			this._updateLogs = {};
		},

		endUpdate: function() {
			if (!this.isInUpdate()) {
				return;
			}

			function getFirstCRLog(itemLogs, lastPos) {
				for ( var i = 0; i < lastPos; i++) {
					var type = itemLogs[i].type;
					if ((type === UPDATE_LOG_TYPE_CREATE || type === UPDATE_LOG_TYPE_REMOVE)) {
						return itemLogs[i];
					}
				}
				return null;
			}

			//TODO 不要？
			function hasCreateLog(itemLogs, lastPos) {

			}

			function createDataModelChanges(model, modelUpdateLogs) {
				var recreated = [];
				var created = [];
				var changed = [];
				var removed = [];

				//TODO create, remove, recreatedの場合でもdependの計算は必要

				for ( var itemId in modelUpdateLogs) {
					var itemLogs = modelUpdateLogs[itemId];
					var isChangeOnly = true;

					var changeEventStack = [];

					//新しい変更が後ろに入っているので、降順で履歴をチェックする
					for ( var i = itemLogs.length - 1; i >= 0; i--) {
						var log = itemLogs[i];
						var logType = log.type;

						if (logType === UPDATE_LOG_TYPE_CHANGE) {
							changeEventStack.push(log.ev);
						} else {
							var firstCRLog = getFirstCRLog(itemLogs, i);

							if (logType === UPDATE_LOG_TYPE_CREATE) {
								//begin->remove->create->end のような操作が行われた場合、
								//begin-endの前後でアイテムのインスタンスが変わってしまう。
								//これをイベントで判別可能にするため、remove->createだった場合はcreatedではなくrecreatedに入れる。
								//なお、begin->remove->create->remove->create->endのような場合、
								//途中のcreate->removeは（begin-endの外から見ると）無視してよいので、
								//oldItemには「最初のremoveのときのインスタンス」、newItemには「最後のcreateのときのインスタンス」が入る。
								//また、begin->create->remove->create->endの場合は、begin-endの外から見ると"create"扱いにすればよい。

								if (firstCRLog && firstCRLog.type === UPDATE_LOG_TYPE_REMOVE) {
									recreated.push({
										id: itemId,
										oldItem: firstCRLog.item,
										newItem: log.item
									});
								} else {
									created.push(log.item);
								}
							} else {
								//ここに来たら必ずUPDATE_LOG_TYPE_REMOVE

								//begin->create-> ( remove->create-> ) remove -> end つまり
								//beginより前にアイテムがなく、セッション中に作られたが最終的には
								//またremoveされた場合、begin-endの外から見ると「何もなかった」と扱えばよい。

								if (firstCRLog && firstCRLog.type === UPDATE_LOG_TYPE_REMOVE) {
									//begin->remove->create->remove->endの場合、begin-endの外から見ると
									//「最初のremoveで取り除かれた」という扱いにすればよい。
									removed.push(firstCRLog.item);
								} else if (!firstCRLog) {
									//createまたはremoveのログが最後のremoveより前にない
									//＝beginより前からアイテムが存在し、始めてremoveされた
									//＝通常のremoveとして扱う
									removed.push(log.item);
								}
							}

							isChangeOnly = false;

							//CREATEまたはREMOVEを見つけたら、そこで走査を終了
							break;
						}
					}

					//新規追加or削除の場合はcreated, removedに当該オブジェクトが入ればよい。
					//あるアイテムのcreate,removeどちらのログもなかったということは
					//そのオブジェクトはbeginの時点から存在しendのタイミングまで残っていた、ということになる。
					//従って、あとはchangeのイベントオブジェクトをマージすればよい。
					if (isChangeOnly && changeEventStack.length > 0) {
						var mergedProps = {};
						for ( var i = 0, len = changeEventStack.length; i < len; i++) {
							$.extend(mergedProps, changeEventStack[i].props);
						}

						var changedProps = [];
						for ( var prop in mergedProps) {
							changedProps.push(prop);
						}

						var mergedChange = {
							type: 'change',
							target: changeEventStack[0].target,
							props: mergedProps
						};

						var changedDependProps = calcDependencies(model, model.items[itemId],
								mergedChange, changedProps);

						$.extend(mergedChange.props, changedDependProps);

						changed.push(mergedChange);
					}
				}

				return {
					created: created,
					recreated: recreated,
					removed: removed,
					changed: changed
				};
			}

			//endUpdateの処理フローここから

			//dirtyなアイテムをリフレッシュする
			for ( var modelName in this.models) {
				if (this.models[modelName]._dirtyItems) {
					var dirtyItems = this.models[modelName]._dirtyItems;
					for ( var i = 0, len = dirtyItems.length; i < len; i++) {
						var refreshEv = dirtyItems[i].refresh();
						addUpdateChangeLog(this, refreshEv);
					}
					this.models[modelName]._dirtyItems = null;
				}
			}

			var modelChanges = {};

			var updateLogs = this._updateLogs;
			for ( var modelName in updateLogs) {
				if (!updateLogs.hasOwnProperty(modelName)) {
					continue;
				}

				modelChanges[modelName] = createDataModelChanges(this.models[modelName],
						updateLogs[modelName]);
			}

			//全てのモデルの変更が完了してから各モデルの変更イベントを出すため、
			//同じループをもう一度行う
			for ( var modelName in updateLogs) {
				var mc = modelChanges[modelName];
				this.models[modelName].dispatchEvent(createDataModelItemsChangeEvent(mc.created,
						mc.recreated, mc.removed, mc.changed));
			}

			this._updateLogs = null;

			var event = {
				type: EVENT_ITEMS_CHANGE,
				models: modelChanges
			};

			//最後に、マネージャから全ての変更イベントをあげる
			this.dispatchEvent(event);
		}
	});



	/**
	 * データモデルを作成します。最初にdescriptorの検証を行い、エラーがある場合は例外を送出します。
	 *
	 * @param {Object} descriptor データモデルディスクリプタ（事前検証済み）
	 * @param {DataModelManager} manager データモデルマネージャ
	 * @returns {DataModel} 登録されたデータモデル
	 */
	function registerDataModel(descriptor, manager) {
		//ディスクリプタの検証を最初に行い、以降はValidなディスクリプタが渡されていることを前提とする
		//ここでは1つでもエラーがあればすぐにエラーを出す
		var errorReason = validateDescriptor(descriptor, manager, true);
		if (errorReason.length > 0) {
			throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, errorReason);
		}

		var extendedSchema = {};
		extendSchema(extendedSchema, manager, descriptor);

		var itemValueCheckFuncs = createCheckValueByDescriptor(extendedSchema, manager);

		var defaultValueErrorReason = validateDefaultValue(extendedSchema, itemValueCheckFuncs);
		if (defaultValueErrorReason.length > 0) {
			throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, defaultValueErrorReason);
		}

		//ここに到達したら、ディスクリプタにはエラーがなかったということ

		var modelName = descriptor.name;

		if (manager.models[modelName]) {
			//既に登録済みのモデルの場合は今持っているインスタンスを返す
			fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, modelName);
			return manager.models[modelName];
		}

		//新しくモデルを作ってマネージャに登録
		var model = new DataModel(descriptor, manager, itemValueCheckFuncs);

		manager.models[modelName] = model;

		return model;
	}




	function createManager(managerName, namespace) {
		if (!isValidNamespaceIdentifier(managerName)) {
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}

		//データモデルマネージャインスタンスを生成
		var manager = new DataModelManager(managerName);

		//第2引数が省略される場合もあるので、厳密等価でなく通常の等価比較を行う
		if (namespace != null) {
			//指定された名前空間に、managerNameでマネージャを公開する
			// 空文字指定ならグローバルに公開する
			if (namespace === '') {
				namespace = 'window';
			}
			var o = {};
			o[managerName] = manager;
			h5.u.obj.expose(namespace, o);
		}

		return manager;
	}




	/* -------- validateForm関係ここから -------- */

	/**
	 * form要素と、managerを引数にとって、validateのチェックを行う関数。 form要素のdata-model="xxx"にmanagerが持つデータモデル名を指定する。
	 * 各input要素にname="xxx"でプロパティ名を指定する
	 */
	function validateForm(form) {
		//TODO エラーチェック

		var $form = $(form);
		var matched = $form.attr('data-h5-model').match('^@(.*)$');
		var modelPath = matched[1];
		var split = modelPath.split('.');
		var modelName = split.splice(split.length - 1, 1);
		var managerName = split.splice(split.length - 1, 1);
		var manager = (split.length ? h5.u.obj.ns(split.join('.')) : window)[managerName];

		var model = manager.models[modelName];
		if (!model) {
			//TODO data-modelに指定されたデータモデル名がないエラー
			throwFwError();
			return;
		}

		var errorReason = [];
		$form.find('input').each(
				function() {
					var $input = $(this);
					var prop = $input.attr('name');
					// nameが指定されているinputについてチェック
					if (!prop) {
						return;
					}
					if (model.itemPropDesc[prop]) {
						var v = $input.val();
						if (!model._itemValueCheckFuncs[prop](v)) {
							errorReason.push(h5.u.str.format(
									'データモデル"{0}のプロパティ"{1}"に、"{2}"をセットすることはできません', modelName, prop,
									v));
						}
					}
				});

		return {
			model: model,
			properties: [{
				prop: '',
				value: '',
				reasons: errorReason
			}]
		};
	}

	/**
	 * input要素とモデルから、値のチェック。 modelの指定がない場合は、親のformタグのdata-model指定から求める
	 */
	function validateInput(input, model) {
		//TODO エラーチェック


		var resultObj = {
			reasons: []
		};
		var $input = $(input);
		// とりあえずinput属性の親のform要素を、データモデルのvalidateチェック対象としている
		if (!model) {
			var $form = $(input.form);
			if (!$form.length) {
				// formがない場合は終了
				return resultObj;
			}

			var formModelName = $form.attr('data-h5-model');
			if (!formModelName) {
				return resultObj;
			}

			var matched = $form.attr('data-h5-model').match('^@(.*)$');
			if (!matched) {
				return resultObj;
			}

			var modelPath = matched[1];
			var split = modelPath.split('.');
			var modelName = split.splice(split.length - 1, 1);
			var managerName = split.splice(split.length - 1, 1);
			var manager = (split.length ? h5.u.obj.ns(split.join('.')) : window)[managerName];
			model = manager.models[modelName];
		}

		var v = $input.val();
		var prop = $input.attr('name');
		// nameが指定されていない、またはデータ定義にないプロパティ名が指定されていればチェックしない
		if (!prop || !model.itemPropDesc[prop]) {
			return resultObj;
		}
		var errorReasons = model._itemValueCheckFuncs[prop](v);
		if (errorReasons === true) {
			// function(){return true}でチェックしている項目用
			//TODO チェック関数の戻り値を全て統一する必要がある
			errorReasons = [];
		}
		return {
			prop: prop,
			value: v,
			reasons: errorReasons
		};
	}

	/* -------- validateForm関係ここまで -------- */


	//TODO Localの場合は、テンポラリなManagerを渡す実装にする予定
	//	function createLocalDataModel(descriptor) {
	//		return createDataModel(descriptor);
	//	}
	//=============================
	// Expose to window
	//=============================
	/**
	 * DataModelの名前空間
	 *
	 * @name data
	 * @memberOf h5.core
	 * @namespace
	 */
	h5.u.obj.expose('h5.core.data', {
		/**
		 * 指定された名前のデータモデルマネージャを作成します。 第2引数が渡された場合、その名前空間にマネージャインスタンスを公開します。
		 *
		 * @memberOf h5.core.data
		 * @name h5.core.data.createManager
		 * @param {String} name マネージャ名
		 * @param {String} [namespace] 公開先名前空間
		 * @returns データモデルマネージャ
		 */
		createManager: createManager,

		createSequence: createSequence,

		//TODO validateForm,validateInputは、動作確認のためにとりあえず公開しているだけ
		validateForm: validateForm,
		validateInput: validateInput,

		SEQUENCE_RETURN_TYPE_STRING: SEQUENCE_RETURN_TYPE_STRING,

		SEQUENCE_RETURN_TYPE_INT: SEQUENCE_RETURN_TYPE_INT

	//		createLocalDataModel: createLocalDataModel,
	});
})();
