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


	/** マネージャ名が不正 */
	var ERR_CODE_INVALID_MANAGER_NAME = 15000;

	/** DataItemのsetterに渡された値の型がDescriptorで指定されたものと異なる */
	var ERR_CODE_INVALID_TYPE = 15001;

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


	var ERROR_MESSAGES = [];
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAME] = 'マネージャ名が不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_TYPE] = 'DataItemのsetterに渡された値の型がDescriptorで指定されたものと異なる';
	ERROR_MESSAGES[ERR_CODE_DEPEND_PROPERTY] = 'dependが設定されたプロパティのセッターを呼び出した';
	ERROR_MESSAGES[ERR_CODE_NO_EVENT_TARGET] = 'イベントのターゲットが指定されていない';
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAMESPACE] = 'createDataModelManagerのnamespaceが不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_DATAMODEL_NAME] = 'データモデル名が不正';
	ERROR_MESSAGES[ERR_CODE_NO_ID] = 'createItemでIDが必要なのに指定されていない';
	ERROR_MESSAGES[ERR_CODE_REGISTER_TARGET_ALREADY_EXIST] = 'マネージャの登録先に指定されたnamespaceにはすでにその名前のプロパティが存在する';
	ERROR_MESSAGES[ERR_CODE_INVALID_UPDATE_LOG_TYPE] = '内部エラー：更新ログタイプ不正';
	ERROR_MESSAGES[ERR_CODE_ID_MUST_BE_STRING] = 'IDは文字列でなければならない';
	ERROR_MESSAGES[ERR_CODE_INVALID_DESCRIPTOR] = 'データモデルディスクリプタにエラーがあります。';
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


	//JSDTが使われていないと誤検出するが、使っているので削除してはいけない
	var DEFAULT_TYPE_VALUE = {
		'number': 0,
		'integer': 0,
		'boolean': false
	};


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


	//------------------------------
	// Descriptorバリデーション関係
	//------------------------------

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
		var matched = type
				.match(/^(string|number|integer|boolean|array|any|enum|@(.+?))((\[\])*)$/);
		return matched && {
			elmType: matched[1],
			dataModel: matched[2],
			dimention: matched[3] ? matched[3].length / 2 : 0
		};
	}

	/**
	 * 引数がNaNかどうか判定する isNaNとは違い、例えば文字列はNaNじゃないのでfalse
	 *
	 * @param {Any} v 判定する値
	 * @return {Boolena} 引数がNaNかどうか
	 */
	function isStrictNaN(v) {
		return typeof v === 'number' && isNaN(v);
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
		// 文字列の場合は、[±(数字)(.数字)]で構成されている文字列ならOKにする
		// ※ parseFloatよりも厳しいチェックにしている。
		// "1.2", "+1.2", "1", ".2", "-.2" はOK。
		// "12.3px"、"12.3.4"、"123.", [12.3, 4] はいずれもparseFloatできるが、ここではNG。
		return val == null || isStrictNaN(val) || isString(val)
				&& val.match(/^[+\-]{0,1}[0-9]*\.{0,1}[0-9]+$/);
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
		// NaN, Infinity, -Infinityはfalseを返す(parseInt(Infinity)はNaNであるので、InfinityはIntじゃない扱いにする
		// 文字列の場合は、[±数字]で構成されている文字列ならOKにする
		// ※ parseIntよりも厳しいチェックにしている。"12px"、"12.3"、[12,3] はいずれもparseIntできるが、ここではNG。
		return val == null || typeof val === 'number' && parseInt(val) === parseFloat(val)
				|| typeof val === 'string' && val.match(/^[+\-]{0,1}[0-9]+$/);
	}

	/**
	 * type:'string' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} type:'string'指定のプロパティに代入可能か
	 */
	function isStringValue(val) {
		return val == null || isString(val);
	}

	/**
	 * type:'boolean' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} type:'boolean'指定のプロパティに代入可能か
	 */
	function isBooleanValue(val) {
		return val == null || val === true || val === false;
	}

	/**
	 * type:'array' 指定のプロパティに代入できるかのチェック
	 *
	 * @param {Any} val 判定する値
	 * @return {Boolean} type:'array'指定のプロパティに代入可能か
	 */
	function isArrayValue(val) {
		return val == null || $.isArray(val);
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
			for ( var i = 0, l = opt.enumValue.length; i < l; i++) {
				if (isStrictNaN(opt.enumValue[i])) {
					return true;
				}
			}
			return false;
		}
		return $.inArray(v, enumValue) > 0;
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
	 */
	function createCheckValueByCheckObj(checkObj) {
		var funcs = checkObj.checkFuncs;
		if (!funcs || funcs.length === 0) {
			return function() {
				return true;
			};
		}
		var dim = checkObj.dimention || 0;
		return function checkValue(val) {
			function _checkValue(v, d) {
				if (!d) {
					// チェック関数を順番に適応して、falseが返ってきたらチェック終了してfalseを返す
					for ( var i = 0, l = funcs.length; i < l; i++) {
						if (!funcs[i](v)) {
							return false;
						}
					}
					// 全てのチェック関数についてtrueが返ってきた場合はtrueを返す
					return true;
				}
				// 指定された配列次元と、渡された値の配列の次元があっていない場合はfalseを返す
				if (!$.isArray(v)) {
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
			return _checkValue(val, dim);
		};
	}

	/**
	 * スキーマのプロパティオブジェクトから、そのプロパティに入る値かどうかをチェックする関数を作る。 # schema:{val:xxxx,val2:....}
	 * のxxxxの部分と、マネージャを引数にとる スキーマのチェックが通ってから呼ばれる前提なので、エラーチェックは行わない。
	 *
	 * @param {object} propObj スキーマのプロパティオブジェクト
	 * @param {object} [manager] そのスキーマを持つモデルが属するマネージャのインスタンス。データモデルのチェックに必要(要らないなら省略可能)
	 * @return {function} 指定されたスキーマのプロパティに、引数の値が入るかどうかをチェックする関数
	 */
	function createCheckValueBySchemaPropertyObj(propObj, manager) {
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
	function createCheckValueByDescriptor(descriptor, manager) {
		var checkFuncs = {};
		for ( var p in descriptor.schema) {
			checkFuncs[p] = createCheckValueBySchemaPropertyObj(descriptor.schema[p], manager);
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
			// schemaがオブジェクトじゃなかったら、これ以上チェックしようがないので、stopOnErrorの値に関わらずreturnする
			return errorReason;
		}

		try {
			// id指定されている属性が一つだけであることをチェック
			var hasId = false;
			for ( var p in schema) {
				if (schema[p].id === true) {
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
				var propObj = schema[schemaProp];
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
									if (!isIntegerValue(val) || isStrictNaN(val)) {
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
									if (!isNumberValue(val) || val === Infinity
											|| val === -Infinity || isStrictNaN(val)) {
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
									if (!isIntegerValue(val) || isStrictNaN(val) || val < 0) {
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
								switch (elmType) {
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
					if (!$.isArray(enumValue) || enumValue.length === 0) {
						// 配列でない、または空配列ならエラー
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
		} finally {
			// 例外を握りつぶしたいので、finallyでreturnしている
			return errorReason;
		}
	}

	/**
	 * checkFuncsの条件をdefaultValueが満たすかどうかチェックする
	 *
	 * @param {Object} descriptor descriptor
	 * @param {Object} checkFuncs 各プロパティをキーに、チェックする関数を持つオブジェクト
	 * @param {Boolean} stopOnError defaultValueがチェック関数を満たさない時に、エラーを投げてチェックを中断するかどうか
	 * @return {Array} エラー情報を格納した配列。エラーのない場合は中身のない配列を返す
	 */
	function validateDefaultValue(descriptor, checkFuncs, stopOnError) {
		var errorReason = [];
		for ( var p in descriptor.schema) {
			var propObj = descriptor.schema[p];
			if (!propObj.hasOwnProperty('defaultValue') && propObj.type
					&& (propObj.type === 'array' || getTypeObjFromString(propObj.type).dimention)) {
				// defaultValueが指定されていないかつ、type指定が配列指定であれば、
				// 初期値は空のOvservableArrayになる。
				// 空のOvservableArrayがチェックに引っかかることはないので、チェック関数でチェックしない。
				continue;
			}

			// defaultValueが指定されていない場合の初期値は、typeが配列じゃなければnull
			var defaultValue = propObj.hasOwnProperty('defaultValue') ? propObj.defaultValue : null;
			if (!checkFuncs[p](defaultValue)) {
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
	 * @return {function}
	 */
	function createConstraintCheckFunction(constraint) {
		return function(v) {
			if (constraint.notNull && v == null) {
				return false;
			}
			if (constraint.notEmpty && !v) {
				return false;
			}
			if (v == null) {
				// notNull,notEmptyのチェック以外は、nullでないものについてチェックを行うので、nullならtrueを返す
				return true;
			}
			if (constraint.min != null && v < constraint.min) {
				return false;
			}
			if (constraint.max != null && constraint.max < v) {
				return false;
			}
			if (constraint.minLength != null && v.length < constraint.minLength) {
				return false;
			}
			if (constraint.maxLength != null && constraint.maxLength < v.length) {
				return false;
			}
			if (constraint.pattern != null && !v.match(constraint.pattern)) {
				return false;
			}
			return true;
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
	 * @return {function} 引数がそのtypeを満たすかどうか判定する関数。
	 */
	function createTypeCheckFunction(elmType, opt) {
		switch (elmType) {
		case 'number':
			return isNumberValue;
		case 'integer':
			return isIntegerValue;
		case 'string':
			return isStringValue;
		case 'boolean':
			return isBooleanValue;
		case 'array':
			return isArrayValue;
		case 'enum':
			return isEnumValue;
		case 'any':
			// anyならタイプチェックは行わない
			return function() {
				return true;
			};
		}
		// タイプチェックは終わっているはずなので、どのケースにも引っかからない場合はデータモデルかつ、そのデータモデルはマネージャに存在する
		var matched = elmType.match(/@(.+?)/);
		var dataModelName = matched[1];
		var manager = opt.manager;
		return function(v) {
			var dataModel = manager.models[dataModelName];
			if (!dataModel) {
				// チェック時点でモデルがマネージャからドロップされている場合はfalse
				return false;
			}
			if (v != null || typeof v !== 'object') {
				// オブジェクトでないならfalse
				return false;
			}
			// チェック時にそのモデルが持ってるアイテムかどうかで判定する
			// nullはOK
			return v == null || dataModel.has(v);
		};
	}

	function getValue(item, prop) {
		return item[ITEM_PROP_BACKING_STORE_PREFIX + prop];
	}

	function setValue(item, prop, value) {
		item[ITEM_PROP_BACKING_STORE_PREFIX + prop] = value;
	}

	/**
	 * propで指定されたプロパティのプロパティソースを作成します。
	 *
	 * @private
	 */
	function createDataItemConstructor(model, descriptor) {
		//model.schemaは継承関係を展開した後のスキーマ
		var schema = model.schema;

		function recalculateDependProperties(item, dependProp) {
			return schema[dependProp].depend.calc.call(item);
		}

		//TODO 仮想プロパティに依存する仮想プロパティ、などのネストを考慮する

		//{ 依存元: [依存先] }という構造のマップ。依存先プロパティは配列内で重複はしない。
		var dependencyMap = {};

		for ( var prop in schema) {
			var dependency = schema[prop] ? schema[prop].depend : null;
			if (dependency) {
				var dependOn = wrapInArray(dependency.on);
				for ( var i = 0, len = dependOn.length; i < len; i++) {
					var dependSrcPropName = dependOn[i];

					fwLogger.trace('{0} depends on {1}', prop, dependSrcPropName);

					if (!dependencyMap[dependSrcPropName]) {
						dependencyMap[dependSrcPropName] = [];
					}
					if ($.inArray(prop, dependencyMap[dependSrcPropName]) === -1) {
						dependencyMap[dependSrcPropName].push(prop);
					}
				}
			}
		}

		function createSrc(name, propDesc) {
			//			var propType = propDesc.type;

			//nullが可能な型かどうか
			//TODO combination-typeの場合は「許容されるすべての型がnot nullable」で判定する必要がある
			//			var isNullable = false;
			//			if (propType.charAt(0) === '@' || $.inArray(propType, NULLABLE_PROP_TYPES)) {
			//				isNullable = true;
			//			}
			//
			//			var isRequired = propDesc.constraint
			//					&& ($.inArray(PROP_CONSTRAINT_REQUIRED, propDesc.constraint) !== -1);
			//
			//			var enumValues = propDesc.enumValues;

			function createSetter() {
				if (propDesc.depend) {
					//依存プロパティの場合は、setterは動作しない（無理に呼ぶとエラー）
					return function() {
						throwFwError(ERR_CODE_DEPEND_PROPERTY);
					};
				}

				return function(value) {
					//					if (isNullable && !isRequired && (value === null)) {
					//プロパティの値が必須でない場合、nullが代入されようとしたら
					//						setValue(this, name, value);
					//						return;
					//					}

					//					if (propType === PROP_TYPE_ENUM) {
					//						//enumの場合は列挙値でチェック
					//						if ($.inArray(value, enumValues) === -1) {
					//							throwFwError(ERR_CODE_INVALID_TYPE);
					//						}
					//					} else {
					//						//それ以外の場合は各関数でチェック
					//						if (!isValidType(value)) {
					//							throwFwError(ERR_CODE_INVALID_TYPE);
					//						}
					//					}

					var oldValue = getValue(this, name);

					if (oldValue === value) {
						//同じ値がセットされた場合は何もしない
						return;
					}

					setValue(this, name, value);

					//TODO もしmanager.isInUpdateだったら、もしくはコンストラクタ内でフラグが立っていたらrecalcを遅延させる、ようにする。
					//コンストラクタ時なら、クロージャ内に変更オブジェクトを突っ込む。
					//manager.isInUpdateなら、manager.__changeLogに入れる

					var changedProps = {};
					changedProps[name] = {
						oldValue: oldValue,
						newValue: value
					};

					var depends = dependencyMap[name];
					if (depends) {
						//このプロパティに依存しているプロパティがある場合は
						//再計算を行う
						for ( var i = 0, len = depends.length; i < len; i++) {
							var dependProp = depends[i];
							var dependOldValue = getValue(this, dependProp);
							var dependNewValue = recalculateDependProperties(this, dependProp);
							setValue(this, dependProp, dependNewValue);
							changedProps[dependProp] = {
								oldValue: dependOldValue,
								newValue: dependNewValue
							};
						}
					}

					//今回変更されたプロパティと依存プロパティを含めてイベント送出
					var event = {
						type: 'change',
						props: changedProps
					};
					this.dispatchEvent(event);
				};
			}

			return {
				get: function() {
					return getValue(this, name);
				},
				set: createSetter()
			};
		}

		//DataItemのコンストラクタ
		function DataItem() {
			//デフォルト値を代入する
			for ( var plainProp in schema) {
				var propDesc = schema[plainProp];
				if (!propDesc) {
					//propDescがない場合はtype:anyとみなす
					this[plainProp] = null;
					continue;
				}

				if (propDesc.depend) {
					continue;
				}

				var defaultValue = propDesc.defaultValue;
				if (defaultValue !== undefined) {
					this[plainProp] = defaultValue;
				} else {
					if (propDesc.type && DEFAULT_TYPE_VALUE[propDesc.type] !== undefined) {
						this[plainProp] = DEFAULT_TYPE_VALUE[propDesc.type];
					} else {
						this[plainProp] = null;
					}
				}
			}

			//TODO dependな項目の計算を、最後に行うようにできないか
		}
		DataItem.prototype = new EventDispatcher();
		$.extend(DataItem.prototype, {
			dirty: function() {
			//TODO dirtyフラグを立てる
			},
			refresh: function() {
			//TODO refreshされたら、整合性チェックとchangeLog追加を行う
			}
		});

		//TODO DataItemの項目としてrefresh等同名のプロパティが出てきたらどうするか。
		//今のうちに_とかでよけておくか、
		//それともschema側を自動的によけるようにするか、
		//またはぶつからないだろうと考えてよけないか
		//(今は良いかもしれないが、将来的には少し怖い)


		//TODO 外部に移動
		var defaultPropDesc = {
			type: 'any',
			enhance: true
		};

		var propertiesDesc = {};

		//データアイテムのプロトタイプを作成
		//schemaは継承関係展開後のスキーマになっている
		for ( var prop in schema) {
			var propDesc = schema[prop];
			if (!propDesc) {
				propDesc = defaultPropDesc;
			}

			//fwLogger.debug('{0}のプロパティ{1}を作成', model.name, prop);

			if (propDesc.enhance !== undefined && propDesc.enhance === false) {
				continue; //非enhanceなプロパティは、Item生成時にプロパティだけ生成して終わり
			}

			var src = createSrc(prop, propDesc);
			src.enumerable = true;
			src.configurable = false;

			propertiesDesc[prop] = src;
		}

		//TODO settingsか、Managerのフラグで制御する
		Object.defineProperties(DataItem.prototype, propertiesDesc);


		return {
			itemConstructor: DataItem,
			propDesc: propertiesDesc
		};
	}


	/**
	 * 指定されたIDのデータアイテムを生成します。
	 *
	 * @param {DataModel} model データモデル
	 * @param {Object} 初期値
	 * @param {Function} itemChangeListener modelに対応する、データアイテムチェンジイベントリスナー
	 * @returns {DataItem} データアイテムオブジェクト
	 */
	function createItem(model, data, itemChangeListener) {
		//キーが文字列かつ空でない、かどうかのチェックはDataModel.create()で行われている

		var idKey = model.idKey;
		var id = data[idKey];

		//TODO id自動生成の場合は生成する


		var item = new model.itemConstructor();

		//インスタンスごとにaccessor生成、Chromeだとやや遅いので注意（IEの3倍以上）
		//TODO オプションが設定されたらdefinePropする
		//Object.defineProperties(data, model.itemPropDesc);

		item[idKey] = id;

		model.items[id] = item;
		model.size++;

		//初期値として渡されたデータを詰める
		for ( var prop in data) {
			if ((prop == idKey) || !(prop in model.schema)) {
				continue;
			}
			item[prop] = data[prop];
		}

		item.addEventListener('change', itemChangeListener);

		return item;
	}



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

	function createManager(managerName, namespace) {

		/* ----------------- DataModelManagerコード ここから ----------------- */

		/**
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

				function hasCreateLog(itemLogs, lastPos) {

				}

				function createDataModelChanges(modelUpdateLogs) {
					var recreated = {};
					var created = [];
					var changed = [];
					var removed = [];

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
										recreated[itemId] = {
											oldItem: firstCRLog.item,
											newItem: log.item
										};
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

							//TODO dependの再計算もここで行う

							var mergedChange = {
								type: 'change',
								target: changeEventStack[0].target,
								props: mergedProps
							};

							changed.push(mergedChange);
						}
					}



					//				var alreadyCalculated = [];
					//
					//				//再計算したプロパティをchangedPropsに追加していくので、ループは__internals.changeで回す必要がある
					//				for ( var srcProp in this.__internals.change) {
					//					var depends = dependencyMap[srcProp];
					//					if (depends) {
					//						for ( var i = 0, len = depends.length; i < len; i++) {
					//							var dependProp = depends[i];
					//							//同じ依存プロパティの再計算は一度だけ行う
					//							if ($.inArray(dependProp, alreadyCalculated) === -1) {
					//								var dependOldValue = getValue(this, dependProp);
					//								var dependNewValue = recalculateDependProperties(this, dependProp);
					//								setValue(this, dependProp, dependNewValue);
					//								//TODO 同じ処理が何か所かで出てくるのでまとめる
					//								changedProps[dependProp] = {
					//									oldValue: dependOldValue,
					//									newValue: dependNewValue
					//								};
					//								alreadyCalculated.push(dependProp);
					//							}
					//						}
					//					}
					//				}



					return {
						created: created,
						recreated: recreated,
						removed: removed,
						changed: changed
					};
				}

				var modelChanges = {};

				var updateLogs = this._updateLogs;
				for ( var modelName in updateLogs) {
					if (!updateLogs.hasOwnProperty(modelName)) {
						continue;
					}

					modelChanges[modelName] = createDataModelChanges(updateLogs[modelName]);
				}

				//全てのモデルの変更が完了してから各モデルの変更イベントを出すため、
				//同じループをもう一度行う
				for ( var modelName in updateLogs) {
					var mc = modelChanges[modelName];
					this.models[modelName].dispatchEvent(createDataModelItemsChangeEvent(
							mc.created, mc.recreated, mc.removed, mc.changed));
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

		/* ----------------- DataModelManagerコード ここまで ----------------- */



		/* ----------------- DataModelコード ここから ----------------- */

		/**
		 * データモデルを作成します。descriptorは事前に検証済みであることを仮定しています。
		 *
		 * @param {Object} descriptor データモデルディスクリプタ（事前検証済み）
		 * @param {}
		 */
		function registerDataModel(descriptor, manager) {

			/* --- DataModelローカル ここから --- */

			/* --- DataModelローカル ここまで --- */

			/**
			 * @memberOf h5.core.data
			 * @class
			 * @name DataModel
			 */
			function DataModel(descriptor, manager) {
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

				//TODO
				this.idSequence = 0;

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

				var itemSrc = createDataItemConstructor(this, descriptor);

				this.itemConstructor = itemSrc.itemConstructor;
				this.itemPropDesc = itemSrc.propDesc;

				//TODO nameにスペース・ピリオドが入っている場合はthrowFwError()
				//TODO this.fullname -> managerの名前までを含めた完全修飾名
			}

			DataModel.prototype = new EventDispatcher();
			$.extend(DataModel.prototype, {
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
					var isAlreadyInUpdate = manager ? manager.isInUpdate() : false;

					if (!isAlreadyInUpdate) {
						this.manager.beginUpdate();
					}

					var actualNewItems = [];

					var items = wrapInArray(objOrArray);
					for ( var i = 0, len = items.length; i < len; i++) {
						var valueObj = items[i];

						var itemId = valueObj[idKey];
						if (!isString(itemId) || itemId.length === 0) {
							throwFwError(ERR_CODE_NO_ID);
						}

						var existingItem = this._findById(itemId);
						if (existingItem) {
							// 既に存在するオブジェクトの場合は値を更新
							for ( var prop in valueObj) {
								if (prop == idKey) {
									continue;
								}
								existingItem[prop] = valueObj[prop];
							}
							ret.push(existingItem);
						} else {
							var newItem = createItem(this, valueObj, itemChangeListener);

							actualNewItems.push(newItem);
							ret.push(newItem);

							this.items[newItem[idKey]] = newItem;
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
					var isAlreadyInUpdate = manager ? manager.isInUpdate() : false;
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

						item.removeEventListener('change', itemChangeListener);

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
						return (idOrObj != null) && (idOrObj === this.items[idOrObj[this.idKey]]);
					} else {
						return false;
					}
				},

				/**
				 * 指定されたIDのデータアイテムを返します。 アイテムがない場合はnullを返します。
				 *
				 * @private
				 * @param {String} id データアイテムのID
				 * @returns {DataItem} データアイテム、存在しない場合はnull
				 */
				_findById: function(id) {
					//データアイテムは、取得系APIではIDを文字列型で渡さなければならない
					if (!isString(id)) {
						throwFwError(ERR_CODE_ID_MUST_BE_STRING);
					}
					var item = this.items[id];
					return item === undefined ? null : item;
				}
			});


			/* 生成コードここから */

			//ディスクリプタの検証を最初に行い、以降はValidなディスクリプタが渡されていることを前提とする
			var errorReason = validateDescriptor(descriptor, manager);
			if (errorReason.length > 0) {
				throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, errorReason);
			}

			var checkFuncs = createCheckValueByDescriptor(descriptor, manager);

			var DefaultValueErrorReason = validateDefaultValue(descriptor, checkFuncs);
			if (DefaultValueErrorReason.length > 0) {
				throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, DefaultValueErrorReason);
			}

			//ここに到達したら、ディスクリプタにはエラーがなかったということ

			var modelName = descriptor.name;

			if (manager.models[modelName]) {
				//既に登録済みのモデルの場合は今持っているインスタンスを返す
				fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, modelName);
				return manager.models[modelName];
			}

			//新しくモデルを作ってマネージャに登録
			var targetModel = new DataModel(descriptor, manager);

			manager.models[modelName] = targetModel;


			function itemChangeListener(event) {
				if (manager && manager.isInUpdate()) {
					addUpdateChangeLog(targetModel, event);
					return;
				}

				targetModel.dispatchEvent(createDataModelItemsChangeEvent([], [], [], [event]));
			}

			return targetModel;
		} /* End of registerDataModel() */


		/* ----------------- DataModelコード ここまで ----------------- */


		/* --- DataModelManagerローカル ここから --- */

		if (!isValidNamespaceIdentifier(managerName)) {
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}

		//データモデルマネージャインスタンスを生成
		var manager = new DataModelManager(managerName);

		//第2引数が省略される場合もあるので、厳密等価でなく通常の等価比較を行う
		if (namespace != null) {
			//指定された名前空間に、managerNameでマネージャを公開する
			var o = {};
			o[managerName] = manager;
			h5.u.obj.expose(namespace, o);
		}


		function getModelUpdateLogObj(modelName) {
			if (!manager._updateLogs[modelName]) {
				manager._updateLogs[modelName] = {};
			}

			return manager._updateLogs[modelName];
		}

		function addUpdateLog(model, type, items) {
			if (model.manager !== manager) {
				return;
			}

			var modelLogs = getModelUpdateLogObj(model.name);

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

		function addUpdateChangeLog(model, ev) {
			if (model.manager !== manager) {
				return;
			}

			var modelLogs = getModelUpdateLogObj(model.name);

			var itemId = ev.target[model.idKey];

			if (!modelLogs[itemId]) {
				modelLogs[itemId] = [];
			}
			modelLogs[itemId].push({
				type: UPDATE_LOG_TYPE_CHANGE,
				ev: ev
			});
		}

		/* --- DataModelManagerローカル ここまで --- */

		return manager;

	} /* End of createManager() */




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

		SEQUENCE_RETURN_TYPE_STRING: SEQUENCE_RETURN_TYPE_STRING,

		SEQUENCE_RETURN_TYPE_INT: SEQUENCE_RETURN_TYPE_INT

	//		createLocalDataModel: createLocalDataModel,
	});
})();
