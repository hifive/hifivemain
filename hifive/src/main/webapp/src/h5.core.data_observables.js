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

/* ------ h5.core.data_observables ------ */
(function() {
	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	// =============================
	// Production
	// =============================

	var METHOD_NAME_COPY_FROM = 'copyFrom';

	var EVENT_TYPE_OBSERVE_BEFORE = 'observeBefore';

	var EVENT_TYPE_OBSERVE = 'observe';

	/**
	 * createObservableItemに渡された引数がオブジェクトでない
	 */
	var ERR_CODE_REQUIRE_SCHEMA = 15100;

	/**
	 * createObservableItemに指定されたスキーマのエラー
	 */
	var ERR_CODE_INVALID_SCHEMA = 15101;

	/**
	 * スキーマ違反の値がセットされた
	 */
	var ERR_CODE_INVALID_ITEM_VALUE = 15102;

	/**
	 * 依存項目にセットされた
	 */
	var ERR_CODE_DEPEND_PROPERTY = 15103;

	/**
	 * ObservableItemでスキーマで定義されていない値にセットされた
	 */
	var ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY = 15104;

	/**
	 * schemaに定義されていないプロパティを取得した
	 */
	var ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY = 15105;

	/**
	 * addEventListenerに不正な引数が渡された
	 */
	var ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER = 15106;

	/**
	 * depend.calcが制約を満たさない値を返している
	 */
	var ERR_CODE_CALC_RETURNED_INVALID_VALUE = 15107;


	// ---------------------------
	// スキーマのエラーコード(detailに入れるメッセージID)
	// ---------------------------

	// このメッセージはDataModelで共通で使用するためh5scopeにexposeしています
	// h5internal.core.data.DESCRIPTOR_VALIDTATION_ERROR
	/**
	 * ID指定されたプロパティが重複している
	 */
	var SCHEMA_ERR_DETAIL_DUPLICATED_ID = 15800;

	/**
	 * ID指定されたプロパティがない
	 */
	var SCHEMA_ERR_DETAIL_NO_ID = 15801;

	/**
	 * プロパティ名が不正
	 */
	var SCHEMA_ERR_DETAIL_INVALID_PROPERTY_NAME = 15802;

	/**
	 * id指定されたプロパティにdependが指定されている
	 */
	var SCHEMA_ERR_DETAIL_ID_DEPEND = 15803;

	/**
	 * depend.onに指定されたプロパティが存在しない
	 */
	var SCHEMA_ERR_DETAIL_DEPEND_ON = 15804;

	/**
	 * depend.calcに関数が指定されていない
	 */
	var SCHEMA_ERR_DETAIL_DEPEND_CALC = 15805;

	/**
	 * typeに文字列が指定されていない
	 */
	var SCHEMA_ERR_DETAIL_INVALID_TYPE = 15806;

	/**
	 * type文字列が不正
	 */
	var SCHEMA_ERR_DETAIL_TYPE = 15807;

	/**
	 * typeに指定されたデータモデルが存在しない
	 */
	var SCHEMA_ERR_DETAIL_TYPE_DATAMODEL = 15808;

	/**
	 * type:enumなのにenumValueが指定されていない
	 */
	var SCHEMA_ERR_DETAIL_TYPE_ENUM_NO_ENUMVALUE = 15809;

	/**
	 * constraintにオブジェクトが指定されていない
	 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT = 15810;

	/**
	 * constraint.notNullの指定が不正
	 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY = 15811;

	/**
	 * min-maxに数値が入力されなかった時のエラー
	 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MIN_MAX = 15812;

	/**
	 * typeがinteger,numberじゃないのにconstraint.min/max を指定されたときのエラー
	 */
	var SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT = 15813;

	/**
	 * constraint.patternが正規表現じゃない
	 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_PATTERN = 15814;

	/**
	 * minLength/maxLengthに0以上の整数値以外の値が渡された
	 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH = 15815;

	/**
	 * constraintの指定に矛盾がある場合(mix > maxなど)
	 */
	var SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT = 15816;

	/**
	 * typeがenumでないのにenumValueが指定されている
	 */
	var SCHEMA_ERR_DETAIL_ENUMVALUE_TYPE = 15817;

	/**
	 * enumValueが配列でない、または空配列
	 */
	var SCHEMA_ERR_DETAIL_INVALID_ENUMVALUE = 15818;

	/**
	 * id項目にdefaultValueが設定されている
	 */
	var SCHEMA_ERR_DETAIL_DEFAULTVALUE_ID = 15819;

	/**
	 * defaultValueに設定された値がtype,constraintに指定された条件を満たしていない
	 */
	var SCHEMA_ERR_DETAIL_INVALIDATE_DEFAULTVALUE = 15820;

	/**
	 * ID項目のconstraintに不正な指定がある
	 */
	var SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID = 15821;

	/**
	 * defaultValue指定されたプロパティにdependが指定されている
	 */
	var SCHEMA_ERR_DETAIL_DEFAULTVALUE_DEPEND = 15822;

	/**
	 * dependの依存関係が循環している
	 */
	var SCHEMA_ERR_DETAIL_DEPEND_CIRCULAR_REF = 15823;

	// =============================
	// Development Only
	// =============================

	/* del begin */
	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_REQUIRE_SCHEMA] = 'createObservableItemの引数にはスキーマ定義オブジェクトを指定する必要があります。';
	errMsgMap[ERR_CODE_INVALID_SCHEMA] = 'createObservableItemの引数に指定されたスキーマ定義オブジェクトが不正です。';
	errMsgMap[ERR_CODE_INVALID_ITEM_VALUE] = 'Itemのsetterに渡された値がスキーマで指定された型・制約に違反しています。 違反したプロパティ={0}';
	errMsgMap[ERR_CODE_DEPEND_PROPERTY] = 'depend指定されているプロパティに値をセットすることはできません。 違反したプロパティ={0}';
	errMsgMap[ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY] = 'スキーマに定義されていないプロパティに値をセットすることはできません。違反したプロパティ={0}';
	errMsgMap[ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY] = 'スキーマに定義されていないプロパティは取得できません。違反したプロパティ={0}';
	errMsgMap[ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER] = 'addEventListenerには、イベント名(文字列)、イベントリスナ(関数)を渡す必要があります。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	/**
	 * スキーマのエラーメッセージ h5.core.dataでも使用するので、exposeする
	 */
	var DESCRIPTOR_VALIDATION_ERROR_MSGS = {};
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DUPLICATED_ID] = 'ID指定されているプロパティが複数あります。ID指定は1つのプロパティのみに指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_NO_ID] = 'ID指定されているプロパティがありません。ID指定は必須です。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_PROPERTY_NAME] = '{0}をプロパティ名に指定できません。半角英数字,_,$ で構成される文字列で、先頭は数字以外である必要があります。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_ID_DEPEND] = '"{0}"プロパティの定義にエラーがあります。id指定されたプロパティにdependを指定することはできません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DEPEND_ON] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.onに指定されたプロパティが存在しません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DEPEND_CALC] = '"{0}"プロパティプロパティの定義にエラーがあります。depend.calcには関数を指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_TYPE] = '"{0}"プロパティプロパティの定義にエラーがあります。typeは文字列で指定して下さい。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_TYPE] = 'プロパティの定義にエラーがあります。typeに指定された文字列が不正です "{1}"';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_TYPE_DATAMODEL] = '"{0}"プロパティの定義にエラーがあります。 typeに指定されたデータモデル"{1}"は存在しません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_TYPE_ENUM_NO_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 タイプにenumを指定する場合はenumValueも指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraintはオブジェクトで指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} の指定が不正です。trueまたはfalseで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MIN_MAX] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、数値で指定してください。typeにintegerを指定している場合は整数値で指定する必要があります';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1} は、type:{2}の項目に対して指定することはできません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_PATTERN] = '"{0}"プロパティ constraint.{1}は正規表現オブジェクトで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH] = '"{0}"プロパティの定義にエラーがあります。 constraint.{1}には正の整数を指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT] = '"{0}"プロパティの定義にエラーがあります。 constraintに矛盾する指定があります。{1},{2}';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_ENUMVALUE_TYPE] = '"{0}"プロパティの定義にエラーがあります。 enumValueはtypeに"enum"またはその配列が指定されている場合のみ指定可能です';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALID_ENUMVALUE] = '"{0}"プロパティの定義にエラーがあります。 enumValueはnull,undefinedを含まない長さ1以上の配列を指定してください';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DEFAULTVALUE_ID] = '"{0}"プロパティの定義にエラーがあります。id指定した項目にdefaultValueを設定することはできません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_INVALIDATE_DEFAULTVALUE] = '"{0}"プロパティのdefaultValueに設定された値"{1}"は、typeまたはconstraintに定義された条件を満たしていません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID] = '"{0}"プロパティの定義にエラーがあります。id指定された項目にconstraint.{1}:{2}を指定することはできません';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DEFAULTVALUE_DEPEND] = '"{0}"プロパティの定義にエラーがあります。dependが指定された項目にdefaultValueを指定することはできません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_DETAIL_DEPEND_CIRCULAR_REF] = '"{0}"プロパティの定義にエラーがあります。depend.onに指定されたプロパティの依存関係が循環しています';
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
	/**
	 * Itemとプロパティ名を引数にとり、_valuesに格納されている値を返す
	 *
	 * @private
	 * @param {DataItem|ObservableItem} item DataItemまたはObservableItem
	 * @param {String} prop プロパティ名
	 * @returns {Any} Item._values[prop]
	 */
	function getValue(item, prop) {
		return item._values[prop];
	}

	/**
	 * Itemとプロパティ名と値引数にとり、Item._valuesに値を格納する
	 *
	 * @private
	 * @param {DataItem|ObservableItem} item DataItemまたはObservableItem
	 * @param {String} prop プロパティ名
	 * @param {Any} value 値
	 */
	function setValue(item, prop, value) {
		item._values[prop] = value;
	}

	/**
	 * 渡されたタイプ指定文字が配列かどうかを返します
	 *
	 * @private
	 * @param {String} typeStr タイプ指定文字列
	 * @returns {Boolean} タイプ指定文字列が配列指定かどうか
	 */
	function isTypeArray(typeStr) {
		if (!typeStr) {
			return false;
		}
		return typeStr.indexOf('[]') !== -1;
	}

	/**
	 * validateDescriptor, validateDescriptor/Schema/DefaultValueが返すエラー情報の配列に格納するエラーオブジェクトを作成する
	 *
	 * @private
	 * @param {Integer} code エラーコード
	 * @param {Array} msgParam メッセージパラメータ
	 * @param {Boolean} stopOnError
	 * @returns {Object} エラーオブジェクト
	 */
	function createItemDescErrorReason(/* var args */) {
		var args = arguments;
		var code = args[0];
		// メッセージがない(min版)ならメッセージを格納しない
		if (!h5internal.core.data.DESCRIPTOR_VALIDATION_ERROR_MSGS) {
			return {
				code: code
			};
		}
		/* del begin */
		args[0] = DESCRIPTOR_VALIDATION_ERROR_MSGS[code];
		var msg = h5.u.str.format.apply(null, args);
		return {
			code: code,
			message: msg
		};
		/* del end */
	}

	/**
	 * 依存プロパティの再計算を行います。再計算後の値はitemの各依存プロパティに代入されます。
	 *
	 * @param {DataModel} model データモデル
	 * @param {DataItem} item データアイテム
	 * @param {Object} event プロパティ変更イベント
	 * @param {String|String[]} changedProps 今回変更されたプロパティ
	 * @param {Boolean} isCreate create時に呼ばれたものかどうか。createなら値の変更を見ずに無条件でcalcを実行する
	 * @returns {Object} { dependProp1: { oldValue, newValue }, ... } という構造のオブジェクト
	 */
	function calcDependencies(model, item, event, changedProps, isCreate) {
		// 今回の変更に依存する、未計算のプロパティ
		var targets = [];

		var dependsMap = model._dependencyMap;

		/**
		 * この依存プロパティが計算可能（依存するすべてのプロパティの再計算が完了している）かどうかを返します。
		 * 依存しているプロパティが依存プロパティでない場合は常にtrue(計算済み)を返します
		 * 依存しているプロパティが依存プロパティが今回の変更されたプロパティに依存していないならtrue(計算済み)を返します
		 */
		function isReady(dependProp) {
			var deps = wrapInArray(model.schema[dependProp].depend.on);
			for ( var i = 0, len = deps.length; i < len; i++) {
				if ($.inArray(deps[i], model._realProperty) === -1
						&& $.inArray(deps[i], targets) !== -1) {
					// 依存先が実プロパティでなく、未計算のプロパティであればfalseを返す
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

		if (isCreate) {
			// createならすべての実プロパティに依存するプロパティを列挙する
			// create時にundefinedがセットされた場合、変更なしなのでchangedPropsに入らないが、calcは計算させる
			targets = model._dependProps.slice();
		} else {
			//今回変更された実プロパティに依存するプロパティを列挙
			addDependencies(targets, wrapInArray(changedProps));
		}

		while (targets.length !== 0) {
			var restTargets = [];

			//各依存プロパティについて、計算可能（依存するすべてのプロパティが計算済み）なら計算する
			for ( var i = 0, len = targets.length; i < len; i++) {
				var dp = targets[i];

				if (isReady(dp)) {
					var newValue = model.schema[dp].depend.calc.call(item, event);

					// 型変換を行わない厳密チェックで、戻り値をチェックする
					var errReason = model._itemValueCheckFuncs[dp](newValue, true);
					if (errReason.length !== 0) {
						// calcの返した値が型・制約違反ならエラー
						throwFwError(ERR_CODE_CALC_RETURNED_INVALID_VALUE, [dp, newValue]);
					}
					ret[dp] = {
						oldValue: getValue(item, dp),
						newValue: newValue
					};
					// calcの結果をセット
					if (model.schema[dp] && isTypeArray(model.schema[dp].type)) {
						//配列の場合は値のコピーを行う。ただし、コピー元がnullの場合があり得る(type:[]はnullable)
						//その場合は空配列をコピー

						// DataItemの場合はimte._nullProps, ObsItemの場合はitem._internal._nullPropsにnullかどうかを保持する
						// TODO 実装をObsItemとDataItemで統一する
						var internal = item._internal || item;
						if (newValue) {
							getValue(item, dp).copyFrom(newValue);
							// newValueがnullでないならregardAsNull()がtrueを返すようにする
							internal._nullProps[dp] = false;
						} else {
							getValue(item, dp).copyFrom([]);
							// newValueがnullまたはundefinedならregardAsNull()がtrueを返すようにする
							internal._nullProps[dp] = true
						}
					} else {
						setValue(item, dp, newValue);
					}
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
	//========================================================
	//
	// バリデーション関係コードここから
	//
	//========================================================
	/**
	 * schemaオブジェクトのtype指定の文字列を、パースした結果を返す
	 *
	 * @private
	 * @param {String} type
	 * @returns {Object} typeをパースした結果オブジェクト。
	 *          elmType:タイプから配列部分を除いた文字列。dataModel:データモデル名。dimension:配列の深さ(配列指定でない場合は0)
	 */
	function getTypeObjFromString(type) {
		// マッチ結果から、データモデル指定の場合と配列の場合をチェックする
		// "string[][][]"のとき、matched = ["string[][][]", "string", undefined, "[][][]", "[]"]
		// "@DataModel"のとき、matched = ["@DataModel", "@DataModel", "DataModel", "", undefined]
		var matched = type.match(/^(string|number|integer|boolean|any|enum|@(.+?))((\[\]){0,1})$/);
		return matched && {
			elmType: matched[1],
			dataModel: matched[2],
			dimension: matched[3] ? 1 : 0
		};
	}

	/**
	 * dependの循環参照をチェックする関数 循環参照するならtrueを返す
	 *
	 * @private
	 * @param {String} prop map[prop]から辿って行って調べる。
	 * @param {Object} map 依存関係をマップしたオブジェクト。{prop1: ['prop2','prop3'], prop2: ['prop3']}
	 *            のような構造で依存関係を表したオブジェクト
	 * @returns {Boolean} 循環参照しているかどうか
	 */
	function checkDependCircularRef(prop, map) {
		return (function checkCircular(p, ancestors) {
			if (!map[p]) {
				return false;
			}
			for ( var i = 0, l = map[p].length; i < l; i++) {
				if ($.inArray(map[p][i], ancestors) > -1
						|| checkCircular(map[p][i], ancestors.concat([p]))) {
					return true;
				}
			}
			return false;
		})(prop, []);
	}

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
	 * ラッパークラスをunboxする 配列が渡されたら、配列の中身をunboxする
	 *
	 * @private
	 * @param v {Any}
	 * @returns unboxしたもの
	 */
	function unbox(v) {
		if ($.isArray(v)) {
			var ary = v.slice(0);
			for ( var i = 0, l = ary.length; i < l; i++) {
				// aryalueOfメソッドのあるオブジェクトならその値を入れる
				ary[i] = ary[i] && typeof ary[i] === 'object' ? ary[i] && ary[i].valueOf
						&& ary[i].valueOf() : ary[i];
			}
			return ary;
		}
		return v && typeof v === 'object' && v.valueOf ? v.valueOf() : v;
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

	/**
	 * type:'enum' 指定のプロパティに代入できるかのチェック
	 *
	 * @private
	 * @param {Any} val 判定する値
	 * @param {Array} enumValue 列挙されている値の配列
	 * @returns {Boolean} type:'enum'指定のプロパティに代入可能か
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
	 * schemaが正しいかどうか判定する。 h5.core.data及びh5.uで使用するため、ここに記述している。
	 *
	 * @private
	 * @param {Object} schema schemaオブジェクト
	 * @param {Object} manager DataManagerオブジェクト
	 * @param {Boolean} stopOnError エラーが発生した時に、即座にreturnするかどうか。(trueなら即座にreturn)
	 * @param {Boolean} isObsItemSchema
	 *            ObservableItemの作成に指定したスキーマかどうか。trueならidのチェックをせず、データモデル依存は指定不可。
	 * @returns {Array} エラー理由を格納した配列。エラーのない場合は空配列を返す。
	 */
	function validateSchema(schema, manager, stopOnError, isObsItemSchema) {
		//TODO stopOnErrorが常にtrueで呼ばれるような実装にするなら、try-catchで囲ってエラー時にエラー投げて、catch節でthrowFwErrorするような実装にする
		var errorReason = [];

		if (!isObsItemSchema) {
			// id指定されている属性が一つだけであることをチェック
			var hasId = false;
			for ( var p in schema) {
				if (schema[p] && schema[p].id === true) {
					if (hasId) {
						errorReason
								.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DUPLICATED_ID));
						if (stopOnError) {
							return errorReason;
						}
					}
					hasId = true;
				}
			}
			if (!hasId) {
				errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_NO_ID));
				if (stopOnError) {
					return errorReason;
				}
			}
		}

		// 循環参照チェックのため、depend指定されているプロパティが出てきたら覚えておく
		// key: プロパティ名, value: そのプロパティのdepend.onをwrapInArrayしたもの
		var dependencyMap = {};

		// schemaのチェック
		for ( var schemaProp in schema) {
			// null(またはundefined)がプロパティオブジェクトに指定されていたら、空オブジェクトと同等に扱い、エラーにしない。
			var propObj = schema[schemaProp] == null ? {} : schema[schemaProp];
			var isId = !!propObj.id;

			// プロパティ名が適切なものかどうかチェック
			if (!isValidNamespaceIdentifier(schemaProp)) {
				errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_INVALID_PROPERTY_NAME,
						schemaProp));
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
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_ID_DEPEND,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}

				// defaultValueが指定されているならエラー
				if (propObj.hasOwnProperty('defaultValue')) {
					errorReason.push(createItemDescErrorReason(
							SCHEMA_ERR_DETAIL_DEFAULTVALUE_DEPEND, schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}

				// dependが指定されているなら、onが指定されていること
				if (depend.on == null) {
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEPEND_ON,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				} else {
					var onArray = wrapInArray(depend.on);
					for ( var i = 0, l = onArray.length; i < l; i++) {
						if (!schema.hasOwnProperty(onArray[i])) {
							errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEPEND_ON,
									schemaProp));
							if (stopOnError) {
								return errorReason;
							}
							break;
						}
					}
				}

				// dependが指定されているなら、calcが指定されていること
				if (typeof depend.calc !== 'function') {
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEPEND_CALC,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}

				// 後の循環参照チェックのため、depend.onを覚えておく
				dependencyMap[schemaProp] = wrapInArray(depend.on);
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
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_INVALID_TYPE,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}

				if (isId && type !== 'string' && type !== 'integer') {
					// id指定されているプロパティで、string,integer以外だった場合はエラー
					errorReason.push('id指定されたプロパティにtypeを指定することはできません');
				}

				// "string", "number[]", "@DataModel"... などの文字列をパースしてオブジェクトを生成する
				typeObj = getTypeObjFromString(type);

				if (!typeObj || !typeObj.elmType) {
					// パースできない文字列が指定されていたらエラー
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_TYPE, schemaProp,
							type));
					if (stopOnError) {
						return errorReason;
					}
				} else {
					// データモデルの場合
					if (typeObj.dataModel) {
						if (isObsItemSchema) {
							// ObservableItemのスキーマにはデータモデルを指定できないのでエラー
							errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_TYPE,
									schemaProp, typeObj.dataModel));
							if (stopOnError) {
								return errorReason;
							}
						}
						if (!manager.models[typeObj.dataModel]) {
							errorReason
									.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_DATAMODEL, schemaProp,
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
							errorReason.push(createItemDescErrorReason(
									SCHEMA_ERR_DETAIL_TYPE_ENUM_NO_ENUMVALUE, schemaProp));
							if (stopOnError) {
								return errorReason;
							}
						}
					}
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
					errorReason.push(createItemDescErrorReason(
							SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT, schemaProp));
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
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
										schemaProp, p));
								if (stopOnError) {
									return errorReason;
								}
							} else if (isId && !val) {
								// id項目にnotNull:falseが指定されていたらエラー
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID, schemaProp, p,
										val));
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
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MIN_MAX,
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
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MIN_MAX,
											schemaProp, p));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							default:
								// typeの指定とconstraintに不整合があったらエラー
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
										typeObj.elmType));
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
											.push(createItemDescErrorReason(
													SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH,
													schemaProp, p));
									if (stopOnError) {
										return errorReason;
									}
								} else if (isId && p === 'maxLength' && val === 0) {
									// id項目にmaxLength: 0 が指定されていたらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID, schemaProp,
											p, val));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							default:
								// type:'string'以外の項目にmaxLength,minLengthが指定されていればエラー
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
										typeObj.elmType));
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
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
											schemaProp, p));
									if (stopOnError) {
										return errorReason;
									}
								} else if (isId && !val) {
									// id項目にnotEmpty: false が指定されていたらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID, schemaProp,
											p, val));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							default:
								// type:'string'以外の項目にnotEmptyが指定されていたらエラー
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
										typeObj.elmType));
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
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_PATTERN,
											schemaProp, p));
									if (stopOnError) {
										return errorReason;
									}
								}
								break;
							default:
								// type:'string'以外の項目にpatterが指定されていたらエラー
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
										typeObj.elmType));
								if (stopOnError) {
									return errorReason;
								}
							}
							break;
						}
					}

					// constraintの中身に矛盾がないかどうかチェック
					if (constraintObj.notEmpty && constraintObj.maxLength === 0) {
						// notNullなのにmanLengthが0
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT, schemaProp, 'notEmpty',
								'maxLength'));
						if (stopOnError) {
							return errorReason;
						}
					}
					if (constraintObj.min != null && constraintObj.max != null
							&& constraintObj.min > constraintObj.max) {
						// min > max
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT, schemaProp, 'min', 'max'));
						if (stopOnError) {
							return errorReason;
						}
					}
					if (constraintObj.minLength != null && constraintObj.maxLength != null
							&& constraintObj.minLength > constraintObj.maxLength) {
						// minLength > maxLength
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT, schemaProp, 'minLength',
								'maxLength'));
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
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_ENUMVALUE_TYPE,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}
				if (!$.isArray(enumValue) || enumValue.length === 0
						|| $.inArray(null, enumValue) > -1 || $.inArray(undefined, enumValue) > -1) {
					// 配列でない、または空配列、null,undefinedを含む配列ならエラー
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_INVALID_ENUMVALUE,
							schemaProp));
					if (stopOnError) {
						return errorReason;
					}
				}
			}

			// defaultValueのチェック
			// defaultValueがtypeやconstraintの条件を満たしているかのチェックはここでは行わない
			// id:trueの項目にdefaultValueが指定されていればここでエラーにする
			// depend指定されている項目にdefaultValueが指定されている場合はエラー(dependのチェック時にエラーにしている)
			if (isId && propObj.hasOwnProperty('defaultValue')) {
				// id項目にdefaultValueが設定されていたらエラー
				errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEFAULTVALUE_ID,
						schemaProp));
				if (stopOnError) {
					return errorReason;
				}
			}
		}

		// depend.onの循環参照チェック
		// onに指定されているプロパティの定義が正しいかどうかのチェックが終わっているここでチェックする
		// （循環参照チェック以前の、プロパティがあるのか、dependがあるならonがあるか、などのチェックをしなくて済むようにするため）
		// （これ以前のチェックに引っかかっていたら、循環参照のチェックはしない）
		for ( var prop in dependencyMap) {
			if (checkDependCircularRef(prop, dependencyMap)) {
				errorReason
						.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEPEND_CIRCULAR_REF, p));
				if (stopOnError) {
					return errorReason;
				}
			}
		}
		return errorReason;
	}

	/**
	 * checkFuncsの条件をdefaultValueが満たすかどうかチェックする
	 *
	 * @private
	 * @param {Object} descriptor descriptor
	 * @param {Object} checkFuncs 各プロパティをキーに、チェックする関数を持つオブジェクト
	 * @param {Boolean} stopOnError defaultValueがチェック関数を満たさない時に、エラーを投げてチェックを中断するかどうか
	 * @returns {Array} エラー情報を格納した配列。エラーのない場合は中身のない配列を返す
	 */
	function validateDefaultValue(schema, checkFuncs, stopOnError) {
		var errorReason = [];
		for ( var p in schema) {
			var propObj = schema[p];
			if (!propObj || !propObj.hasOwnProperty('defaultValue') && propObj.type
					&& (propObj.type === 'array' || getTypeObjFromString(propObj.type).dimension)) {
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
				errorReason.push(createItemDescErrorReason(
						SCHEMA_ERR_DETAIL_INVALIDATE_DEFAULTVALUE, p, defaultValue));
				if (stopOnError) {
					return errorReason;
				}
			}
		}
		return errorReason;
	}

	/**
	 * スキーマのプロパティオブジェクトから、そのプロパティに入る値かどうかをチェックする関数を作る。 # schema:{val:xxxx,val2:....}
	 * のxxxxの部分と、マネージャを引数にとる スキーマのチェックが通ってから呼ばれる前提なので、エラーチェックは行わない。
	 *
	 * @private
	 * @param {object} propertyObject スキーマのプロパティオブジェクト
	 * @param {object} [manager] そのスキーマを持つモデルが属するマネージャのインスタンス。データモデルのチェックに必要(要らないなら省略可能)
	 * @returns {function} 指定されたスキーマのプロパティに、引数の値が入るかどうかをチェックする関数
	 */
	function createCheckValueBySchemaPropertyObj(propertyObject, manager) {
		// schema{prop:null} のように指定されている場合はpropObjはnullなので、空オブジェクト指定と同等に扱うようにする
		var propObj = propertyObject || {};
		var checkFuncArray = [];
		var elmType = null;
		var dimension = 0;
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
			// 配列の次元(0か1のみ)。配列でないなら0
			dimension = typeObj.dimension;

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
			dimension: dimension
		});
	}

	/**
	 * descriptorからschemaの各プロパティの値をチェックする関数を作成して返す
	 *
	 * @private
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
	 * constraintオブジェクトから、値がそのconstraintの条件を満たすかどうか判定する関数を作成する
	 *
	 * @private
	 * @param {object} constraint constraintオブジェクト
	 * @returns {function} 値がconstraintを満たすかどうかチェックする関数。正しい場合は空配列、そうじゃない場合は引っかかった項目を返す
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
	 * @private
	 * @param {string} elmType type指定文字列
	 * @param {object} [opt] type判定に使用するためのオプション
	 * @param {object} [opt.manager]
	 *            DataManagerオブジェクト。"@DataModel"のようにデータモデルを指定された場合、managerからデータモデルを探す
	 * @param {array} [opt.enumValue] typeが"enum"の場合、enumValueに入っているかどうかで判定する
	 * @returns {function} 引数がそのtypeを満たすかどうか判定する関数。満たすなら空配列、満たさないならエラーオブジェクトの入った配列を返す。
	 */
	function createTypeCheckFunction(elmType, opt) {
		var errObjs = [{
			type: elmType
		}];
		switch (elmType) {
		case 'number':
			return function(v, isStrict) {
				if (isNumberValue(v, isStrict)) {
					return [];
				}
				return errObjs;
			};
		case 'integer':
			return function(v, isStrict) {
				if (isIntegerValue(v, isStrict)) {
					return [];
				}
				return errObjs;
			};
		case 'string':
			return function(v, isStrict) {
				if (isStringValue(v, isStrict)) {
					return [];
				}
				return errObjs;
			};
		case 'boolean':
			return function(v, isStrict) {
				if (isBooleanValue(v, isStrict)) {
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

	/**
	 * チェック関数と、配列の次元を持つオブジェクトを引数にとり、値のチェックを行う関数を作成して返す
	 *
	 * @private
	 * @param {object} checkObj
	 * @param {array} [checkObj.checkFuncs] チェックする関数の配列。配列の先頭の関数から順番にチェックする。指定のない場合は、return
	 *            true;するだけの関数を作成して返す
	 * @param {integer} [checkObj.dimension]
	 *            チェックする値の配列の次元。配列のdimension次元目が全てcheckFuncsを満たすことと、dimension-1次元目まではすべて配列であることを確認する関数を作成して返す。
	 *            0、または指定無しの場合は配列でないことを表す
	 * @returns {Function} 値をチェックする関数を返す。戻り値の関数はエラー理由を返す。length;0ならエラーでない。
	 */
	function createCheckValueByCheckObj(checkObj) {
		var funcs = checkObj.checkFuncs;
		if (!funcs || funcs.length === 0) {
			return function() {
				return [];
			};
		}
		var dim = checkObj.dimension || 0;
		/**
		 * 値のチェックを行う関数
		 *
		 * @param {Any} val 値
		 * @param {Boolean} isStrict 型変換可能ならOKにするかどうか
		 */
		return function checkValue(val, isStrict) {
			var errorReason = [];
			function _checkValue(v, d) {
				if (!d) {
					// チェック関数を順番に適用して、falseが返ってきたらチェック終了してfalseを返す
					for ( var i = 0, l = funcs.length; i < l; i++) {
						var result = funcs[i](v, isStrict);
						if (result.length) {
							errorReason = errorReason.concat(result);
							return false;
						}
					}
					return true;
				}
				// 配列指定なのにセットする値が配列でない場合はfalseを返す
				// ただしnullなら空配列同等の扱いをするので、チェックで弾かない
				if (v == null) {
					return true;
				}
				if (!$.isArray(v) && !h5.core.data.isObservableArray(v)) {
					errorReason.push({
						dimension: dim
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
	 * schemaからdepend項目の依存関係を表すマップを作成する
	 *
	 * @private
	 * @param schema
	 * @returns {Object}
	 */
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

	// =========================================================================
	//
	// Body
	//
	// =========================================================================
	function customSplice(/* var_args */) {
		var beforeLen = this.length;

		var ret = Array.prototype.splice.apply(this, arguments);

		//splice前より後の方が長さが短くなっていたら、余っている後ろの要素を削除する
		for ( var i = this.length; i < beforeLen; i++) {
			delete this[i];
		}

		return ret;
	}

	function customShift(/* var_args */) {
		var beforeLen = this.length;

		var ret = Array.prototype.shift.apply(this, arguments);

		if (beforeLen > 0) {
			//shift()で最後の要素がひとつ前に"シフト"するが、一部環境では元の位置の要素が削除されないので独自に削除
			delete this[beforeLen - 1];
		}

		return ret;
	}

	//Objectに対するsplice()の動作を確認
	var obsSplice;
	var spliceTestObj = {
		'0': 0,
		length: 1
	};
	Array.prototype.splice.call(spliceTestObj, 0, 1);
	if (spliceTestObj[0] !== undefined) {
		//Array.prototype.spliceをビルトインの配列以外に対して適用した時
		//最終的なlength以降の要素が削除されないので、特別に対応する。
		//ここに入るのは、検証したブラウザではIE8以下だけ。
		obsSplice = customSplice;
	} else {
		obsSplice = Array.prototype.splice;
	}
	spliceTestObj = null;

	//Objectに対するshift()の動作を確認
	var obsShift;
	var shiftTestObj = {
		'0': 0,
		length: 1
	};
	Array.prototype.shift.call(shiftTestObj);
	if (shiftTestObj[0] !== undefined) {
		//shiftもspliceと同様要素が残る環境がある（IE8のIE7モード）ので差し替える。
		obsShift = customShift;
	} else {
		obsShift = Array.prototype.shift;
	}
	shiftTestObj = null;


	//-------------------------------------------
	// イベントディスパッチャのコードここから
	//-------------------------------------------
	/**
	 * イベントディスパッチャ
	 * <p>
	 * イベントリスナを管理するクラスです。このクラスはnewできません。
	 * </p>
	 * <p>
	 * 以下のクラスがイベントディスパッチャのメソッドを持ちます。
	 * <ul>
	 * <li><a href="ObservableArray.html">ObservableArray</a>
	 * <li><a href="ObservableItem.html">ObservableItem</a>
	 * <li><a href="DataModelManager.html">DataModelManager</a>
	 * <li><a href="DataModel.html">DataModel</a>
	 * <li><a href="DataItem.html">DataItem</a>
	 * </ul>
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @name EventDispatcher
	 */
	function EventDispatcher() {}

	/**
	 * イベントリスナが登録されているかどうかを返します
	 * <p>
	 * 第一引数にイベント名、第二引数にイベントリスナを渡し、指定したイベントに指定したイベントリスナが登録済みかどうかを返します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf EventDispatcher
	 * @param {String} type イベント名
	 * @param {Function} listener イベントリスナ
	 * @returns {Boolean} 第一引数のイベント名に第二引数のイベントリスナが登録されているかどうか
	 */
	EventDispatcher.prototype.hasEventListener = function(type, listener) {
		if (!this.__listeners) {
			return false;
		}
		var l = this.__listeners[type];
		if (!l || !this.__listeners.hasOwnProperty(type)) {
			return false;
		}

		for ( var i = 0, count = l.length; i < count; i++) {
			if (l[i] === listener) {
				return true;
			}
		}
		return false;

	};

	/**
	 * イベントリスナを登録します。
	 * <p>
	 * 第一引数にイベント名、第二引数にイベントリスナを渡し、イベントリスナを登録します。指定したイベントが起こった時にイベントリスナが実行されます。
	 * </p>
	 * <p>
	 * 指定したイベントに、指定したイベントリスナが既に登録されていた場合は何もしません。
	 * </p>
	 * <p>
	 * 同一のイベントに対して複数回addEventListener()を呼び、複数のイベントリスナを登録した場合は、イベント発火時に登録した順番に実行されます。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf EventDispatcher
	 * @param {String} type イベント名
	 * @param {Function} listener イベントリスナ
	 */
	EventDispatcher.prototype.addEventListener = function(type, listener) {
		// 引数チェック
		if (arguments.length !== 2 || !isString(type) || !$.isFunction(listener)) {
			throwFwError(ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER);
		}
		if (this.hasEventListener(type, listener)) {
			return;
		}

		if (!this.__listeners) {
			this.__listeners = {};
		}

		if (!(this.__listeners.hasOwnProperty(type))) {
			this.__listeners[type] = [];
		}

		this.__listeners[type].push(listener);
	};

	/**
	 * イベントリスナを削除します。
	 * <p>
	 * 第一引数にイベント名、第二引数にイベントリスナを渡し、指定したイベントから指定したイベントリスナを削除します。
	 * </p>
	 * <p>
	 * 指定したイベント名に指定したイベントリスナが登録されていない場合は何もしません。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf EventDispatcher
	 * @param {String} type イベント名
	 * @param {Function} listener イベントリスナ
	 */
	EventDispatcher.prototype.removeEventListener = function(type, listener) {
		if (!this.hasEventListener(type, listener)) {
			return;
		}

		var l = this.__listeners[type];

		for ( var i = 0, count = l.length; i < count; i++) {
			if (l[i] === listener) {
				l.splice(i, 1);
				return;
			}
		}
	};

	/**
	 * イベントをディスパッチします
	 * <p>
	 * イベントオブジェクトを引数に取り、そのevent.typeに登録されているイベントリスナを実行します。
	 * イベントオブジェクトにpreventDefault()関数を追加してイベントリスナの引数に渡して呼び出します。
	 * </p>
	 * <p>
	 * 戻り値は『イベントリスナ内でpreventDefault()が呼ばれたかどうか』を返します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf EventDispatcher
	 * @param {Object} event イベントオブジェクト
	 * @returns {Boolean} イベントリスナ内でpreventDefault()が呼ばれたかどうか。
	 */
	EventDispatcher.prototype.dispatchEvent = function(event) {
		if (!this.__listeners) {
			return;
		}
		var l = this.__listeners[event.type];
		if (!l) {
			return;
		}

		if (!event.target) {
			event.target = this;
		}

		var isDefaultPrevented = false;

		event.preventDefault = function() {
			isDefaultPrevented = true;
		};

		for ( var i = 0, count = l.length; i < count; i++) {
			l[i].call(event.target, event);
		}

		return isDefaultPrevented;
	};
	//--------------------------------------------
	// イベントディスパッチャのコードここまで
	//--------------------------------------------

	/**
	 * ObservableArray(オブザーバブルアレイ)とは、通常の配列と同じAPIを持ち操作を外部から監視できる、配列とほぼ同じように利用可能なクラスです。
	 * DOM要素のようにaddEventListenerでリスナーをセットすることで、配列に対するメソッド呼び出しをフックすることができます。
	 * <p>
	 * <a href="h5.core.data.html#createObservableArray">h5.core.data.createObservableArray()</a>で作成します。
	 * </p>
	 * <p>
	 * 通常の配列と同様の操作に加え、要素の追加、削除、変更についての監視ができます。
	 * </p>
	 * <p>
	 * Arrayクラスの持つメソッド(concat, join, pop, push, reverse, shift, slice, sort, splice, unshift,
	 * indexOf, lastIndexOf, every, filter, forEach, map, some, reduce, reduceRight)が使えます。
	 * </p>
	 * <p>
	 * このクラスは<a href="EventDispatcher.html">EventDispatcherクラス</a>のメソッドを持ちます。イベント関連のメソッドについては<a
	 * href="EventDispatcher.html">EventDispatcherクラス</a>を参照してください。<br>
	 * ObservableArrayは、 配列操作メソッド呼び出し時に'observeBefore'、配列操作メソッド実行後に'observe'イベントが発火します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @extends EventDispatcher
	 * @name ObservableArray
	 */
	function ObservableArray() {
		this.length = 0;
	}

	$.extend(ObservableArray.prototype, EventDispatcher.prototype, {
		/**
		 * この配列が、引数で指定された配列と同じ内容か比較します。
		 *
		 * @since 1.1.0
		 * @memberOf ObservableArray
		 * @param {ObservableArray|Array} ary ObservableArrayまたはArray型の配列
		 * @returns {Boolean} 判定結果
		 */
		equals: function(ary) {
			// aryが配列でもObservableArrayでもないならfalse
			if (!($.isArray(ary) || isObservableArray(ary)) || ary.length !== this.length) {
				return false;
			}

			// 中身の比較
			for ( var i = 0, l = ary.length; i < l; i++) {
				if (ary[i] !== this[i]) {
					return false;
				}
			}
			if (i === l) {
				// 中身が全て同じならreturn true
				return true;
			}
			return false;
		},

		/**
		 * 指定された配列の要素をこのObservableArrayにシャローコピーします。
		 * <p>
		 * 元々入っていた値は全て削除されます。従って、コピー後は引数で指定された配列と同じ要素を持ちます。
		 * </p>
		 * 引数がnullまたはundefinedの場合は、空配列が渡された場合と同じ挙動をします（自身の要素が全て削除されます）。
		 *
		 * @since 1.1.0
		 * @memberOf ObservableArray
		 * @param {Array} src コピー元の配列
		 * @returns {Array} 削除前の要素を持った配列
		 */
		copyFrom: function(src) {
			var evBefore = {
				type: EVENT_TYPE_OBSERVE_BEFORE,
				method: METHOD_NAME_COPY_FROM,
				args: src,
				isDestructive: true
			};
			if (!this.dispatchEvent(evBefore)) {
				if (!src) {
					//srcがnullの場合は空配列と同じ挙動にする
					src = [];
				}

				var args = src.slice(0);
				args.unshift(0, this.length);
				obsSplice.apply(this, args);

				var evAfter = {
					type: EVENT_TYPE_OBSERVE,
					method: METHOD_NAME_COPY_FROM,
					args: arguments,
					returnValue: undefined,
					isDestructive: true
				};
				this.dispatchEvent(evAfter);
			}
		},

		get: function(index) {
			//TODO delegation
			return this[index];
		},

		set: function(index, value) {
			//TODO splice使わないようにする
			this.splice(index, 1, value);
		},

		toArray: function() {
			//TODO
			return Array.prototype.slice.call(this, 0);
		}
	});

	var arrayMethods = ['concat', 'join', 'pop', 'push', 'reverse', 'shift', 'slice', 'sort',
			'splice', 'unshift', 'indexOf', 'lastIndexOf', 'every', 'filter', 'forEach', 'map',
			'some', 'reduce', 'reduceRight'];
	// 破壊的(副作用のある)メソッド
	var destructiveMethods = ['sort', 'reverse', 'pop', 'shift', 'unshift', 'push', 'splice'];

	for ( var i = 0, len = arrayMethods.length; i < len; i++) {
		ObservableArray.prototype[arrayMethods[i]] = (function(method) {
			var arrayFunc = Array.prototype[method];
			if (method === 'splice') {
				arrayFunc = obsSplice;
			} else if (method === 'shift') {
				arrayFunc = obsShift;
			}

			//TODO fallback実装の提供
			return function() {
				var isDestructive = $.inArray(method, destructiveMethods) !== -1;
				var evBefore = {
					type: EVENT_TYPE_OBSERVE_BEFORE,
					method: method,
					args: arguments,
					isDestructive: isDestructive
				};

				if (!this.dispatchEvent(evBefore)) {
					//preventDefault()が呼ばれなければ実際に処理を行う
					var ret = arrayFunc.apply(this, arguments);
					var evAfter = {
						type: EVENT_TYPE_OBSERVE,
						method: method,
						args: arguments,
						returnValue: ret,
						isDestructive: isDestructive
					};
					this.dispatchEvent(evAfter);
					return ret;
				}
			};
		})(arrayMethods[i]);
	}


	/**
	 * ObservableArrayを作成します。
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @returns {ObservableArray} ObservableArrayインスタンス
	 */
	function createObservableArray() {
		return new ObservableArray();
	}

	/**
	 * ObservableArrayかどうかを判定します。
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @returns {Boolean} ObservableArrayかどうか
	 */
	function isObservableArray(obj) {
		if (obj && obj.constructor === ObservableArray) {
			return true;
		}
		return false;
	}

	/**
	 * ObservableItem(オブザーバブルアアイテム)とは、プロパティ操作の監視可能なオブジェクトです。
	 * <p>
	 * <a href="h5.core.data.html#createObservableItem">h5.core.data.createObservableItem()</a>で作成します。
	 * </p>
	 * <p>
	 * <a href="DataItem.html">データアイテム</a>と同様、get/setで値の読み書きを行います。
	 * </p>
	 * <p>
	 * このクラスは<a href="EventDispatcher.html">EventDispatcherクラス</a>のメソッドを持ちます。イベント関連のメソッドについては<a
	 * href="EventDispatcher.html">EventDispatcherクラス</a>を参照してください。<br>
	 * ObservableItemは、アイテムが持つ値に変更があった場合に'change'イベントが発火します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @extends EventDispatcher
	 * @class
	 * @name ObservableItem
	 */
	/**
	 * (コンストラクタは公開していないので、JSDocに@paramが載らないようにしています。)
	 *
	 * @since 1.1.0
	 * @private
	 * @param {Object} schema schemaオブジェクト。データモデルディスクリプタのスキーマと同様のスキーマオブジェクトを指定します。ただしidの指定は不要です。
	 * @param {Object} itemValueCheckFuncs データモデルのスキーマに適合するかどうかをチェックする関数。キーがプロパティ名で、値がチェック関数の配列
	 */
	function ObservableItem(schema, itemValueCheckFuncs) {
		// 実プロパティと依存プロパティ、配列プロパティを列挙
		var realProps = [];
		var dependProps = [];
		var aryProps = [];
		for ( var p in schema) {
			if (schema[p] && schema[p].depend) {
				dependProps.push(p);
			} else {
				realProps.push(p);
			}
			if (schema[p] && schema[p].type && schema[p].type.indexOf('[]') !== -1) {
				aryProps.push(p);
			}
		}

		/**
		 * 値チェックに必要な情報を持つオブジェクト
		 * <p>
		 * データアイテムではモデルに持たせていましたが、ObservableItemにモデルはないので、必要な情報を_internalプロパティに持ちます
		 * </p>
		 *
		 * @private
		 * @name _internal
		 * @since 1.1.0
		 * @memberOf ObservableItem
		 * @type Object
		 */
		this._internal = {

			/**
			 * スキーマオブジェクト
			 *
			 * @memberOf ObservableItem._internal
			 * @since 1.1.1
			 * @type Object
			 */
			schema: schema,

			/**
			 * プロパティの依存関係マップ
			 *
			 * @private
			 * @memberOf ObservableItem._internal
			 * @since 1.1.0
			 * @type Object
			 */
			_dependencyMap: createDependencyMap(schema),

			/**
			 * モデルが持つ依存プロパティ
			 *
			 * @private
			 * @since 1.1.0
			 * @type Array
			 */
			dependProps: dependProps,

			/**
			 * モデルが持つ実プロパティ(依存しないプロパティ)
			 *
			 * @private
			 * @since 1.1.0
			 * @type Array
			 * @memberOf DataModel
			 */
			realProps: realProps,

			/**
			 * ObservableArrayのプロパティ
			 *
			 * @private
			 * @since 1.1.0
			 * @type Array
			 */
			aryProps: aryProps,

			/**
			 * プロパティの型・制約チェック関数<br>
			 * プロパティ名をキー、値としてチェック関数を持つ
			 *
			 * @private
			 * @since 1.1.0
			 * @type Object
			 */
			_itemValueCheckFuncs: itemValueCheckFuncs,

			_nullProps: {}
		};

		/**
		 * 値を保持するオブジェクト
		 *
		 * @private
		 * @since 1.1.0
		 * @memberOf ObservableItem
		 * @type Object
		 */
		this._values = {};

		// 値に変更があったプロパティ(最初なので、全てのプロパティ)
		var changedProps = [];

		// イベントオブジェクト(最初なのでtype:'create', propsには全ての実プロパティ。
		var event = {
			props: {},
			target: this,
			type: 'create'
		};
		// this._valuesに値(defaultValue)のセット
		for ( var p in schema) {
			if ($.inArray(p, aryProps) !== -1) {
				this._values[p] = createObservableArray();
				this._internal._nullProps[p] = true;

				if (schema[p].hasOwnProperty('defaultValue')) {
					// null,undefなら空ObservableArrayにする
					if (schema[p].defaultValue != null) {
						this._values[p].copyFrom(schema[p].defaultValue);
						this._internal._nullProps[p] = false;
					}
				}

				if ($.inArray(p, realProps) !== -1) {
					// 実プロパティの場合はeventに格納
					changedProps.push(p);
					event.props[p] = {
						newValue: this._values[p],
						oldValue: undefined
					};
				}
				continue;
			}

			if ($.inArray(p, dependProps) !== -1) {
				// 依存プロパティでかつ配列でもないなら何もしない
				continue;
			}
			changedProps.push(p);

			if (schema[p] && schema[p].hasOwnProperty('defaultValue')) {
				var defVal = schema[p].defaultValue;
				this._values[p] = defVal;
				event.props[p] = {
					newValue: defVal,
					oldValue: undefined
				};

				continue;
			}

			// 実プロパティの初期値はnull, 依存プロパティの初期値はundefinedでevent.propsには入れない
			if ($.inArray(p, realProps) !== -1) {
				var defVal = null;
				this._values[p] = defVal;
				event.props[p] = {
					newValue: defVal,
					oldValue: undefined
				}
			} else {
				this._values[p] = undefined;
			}
		}

		// 依存項目の計算
		calcDependencies(this._internal, this, event, changedProps);

		//-----------------------------------------------------------------------
		// 配列プロパティについて、イベント管理用のリスナをaddEventListenerする
		//-----------------------------------------------------------------------

		// 破壊的メソッドだが、追加しないメソッド。validateする必要がない。
		var noAddMethods = ['sort', 'reverse', 'pop'];

		var item = this;

		for ( var i = 0, l = aryProps.length; i < l; i++) {
			var p = aryProps[i];
			var obsAry = this._values[p];
			(function(propName, observableArray) {
				var oldValue; // プロパティのoldValue
				function observeBeforeListener(event) {
					// 追加も削除もソートもしないメソッド(非破壊的メソッド)なら何もしない
					// set内で呼ばれたcopyFromなら何もしない
					// (checkもevent上げもsetでやっているため)
					if (!event.isDestructive || item._internal.isInSet) {
						return;
					}

					var args = h5.u.obj.argsToArray(event.args);

					var checkFlag = $.inArray(event.method, noAddMethods) === -1;

					if (event.method === 'splice') {
						if (args.length <= 2) {
							// spliceに引数が2つなら要素追加はないので、validateチェックはしない
							checkFlag = false;
						}
						checkFlag = false;
						args.shift();
						args.shift();
					}

					if (checkFlag) {
						var validateResult = itemValueCheckFuncs[propName](args);
						if (validateResult.length > 0) {
							throwFwError(ERR_CODE_INVALID_ITEM_VALUE, propName, validateResult);
						}
					}

					//oldValueを保存
					oldValue = item._values[propName].slice(0);
				}

				function observeListener(event) {
					// 追加も削除もソートもしないメソッド(非破壊的メソッド)なら何もしない
					// set内で呼ばれたcopyFromなら何もしない(item._internal.isInSetにフラグを立てている)
					if (!event.isDestructive || item._internal.isInSet) {
						return;
					}

					// 配列の値が変化していないなら何もしない
					if (observableArray.equals(oldValue)) {
						return;
					}

					// changeイベントオブジェクトの作成
					var ev = {
						type: 'change',
						target: item,
						props: {
							oldValue: oldValue,
							newValue: observableArray
						}
					};

					// setにオブジェクトで渡されて、更新される場合があるので、isUpdateSessionとかで判断する必要がある
					item.dispatchEvent(ev);
				}
				observableArray.addEventListener('observeBefore', observeBeforeListener);
				observableArray.addEventListener('observe', observeListener);
			})(p, obsAry);
		}
	}

	$.extend(ObservableItem.prototype, EventDispatcher.prototype, {
		/**
		 * 値をセットします。
		 * <p>
		 * <a href="DataItem.html#set">DataItem#set()</a>と同様に値をセットします。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf ObservableItem
		 * @param {Any} var_args 複数のキー・値のペアからなるオブジェクト、または1組の(キー, 値)を2つの引数で取ります。
		 */
		set: function(/* var_args */) {
			var setObj = {};
			if (arguments.length === 2) {
				setObj[arguments[0]] = arguments[1];
			} else {
				setObj = arguments[0];
			}

			// item._internal.isInSetフラグを立てて、set内の変更でObsAry.copyFromを呼んだ時にイベントが上がらないようにする
			this._internal.isInSet = true;
			var props = {};

			// 先に値のチェックを行う
			for ( var p in setObj) {
				if ($.inArray(p, this._internal.realProps) === -1) {
					if ($.inArray(p, this._internal.dependProps) !== -1) {
						// 依存プロパティにセットはできないのでエラー
						throwFwError(ERR_CODE_DEPEND_PROPERTY, p);
					}
					// スキーマに定義されていないプロパティにセットはできないのでエラー
					throwFwError(ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, p);
				}
				var val = setObj[p];
				// type:[]のプロパティにnull,undefが指定されたら、空配列と同様に扱う
				if ($.inArray(p, this._internal.aryProps) !== -1) {
					if (val == null) {
						val = [];
						this._internal._nullProps[p] = true;
					} else {
						this._internal._nullProps[p] = false;
					}
				}
				//値のチェック
				var validateResult = this._internal._itemValueCheckFuncs[p](val);
				if (validateResult.length) {
					throwFwError(ERR_CODE_INVALID_ITEM_VALUE, p, validateResult);
				}
			}

			// 値に変更があればセット
			var changedProps = [];
			for ( var p in setObj) {
				var v = setObj[p];
				var oldValue = this._values[p];

				// 値に変更があったかどうかチェック
				if ($.inArray(p, this._internal.aryProps) !== -1) {
					if (this._values[p].equals(v)) {
						// 変更なし
						continue;
					}
					oldValue = oldValue.slice(0);
					this._values[p].copyFrom(v);
				} else {
					if (v === this._values[p]) {
						// 変更なし
						continue;
					}
					this._values[p] = v;
				}

				props[p] = {
					oldValue: oldValue,
					newValue: this._values[p]
				};

				changedProps.push(p);
			}
			this._internal.isInSet = false;

			if (changedProps.length != 0) {
				// 変更があれば依存項目の計算とイベントの発火
				var event = {
					target: this,
					type: 'change',
					props: props
				};
				// 依存項目の計算
				calcDependencies(this._internal, this, event, changedProps);
				this.dispatchEvent(event);
			}
		},

		/**
		 * 値を取得します。
		 * <p>
		 * <a href="DataItem.html#get">DataItem#get()</a>と同様です。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf ObservableItem
		 * @param {String} [key] プロパティキー。指定のない場合は、アイテムの持つプロパティ名をキーに、そのプロパティの値を持つオブジェクトを返します。
		 * @returns {Any} 指定されたプロパティの値。引数なしの場合はプロパティキーと値を持つオブジェクト。
		 */
		get: function(key) {
			if (arguments.length === 0) {
				return $.extend({}, this._values);
			}

			if ($.inArray(key, this._internal.realProps) === -1
					&& $.inArray(key, this._internal.dependProps) === -1) {
				throwFwError(ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY, key);
			}

			return this._values[key];
		},

		/**
		 * type:[]であるプロパティについて、最後にセットされた値がnullかどうかを返します。<br>
		 * type:[]としたプロパティは常にObservableArrayインスタンスがセットされており、set('array', null);
		 * と呼ぶと空配列を渡した場合と同じになります。そのため、「実際にはnullをセットしていた（item.set('array',
		 * null)）」場合と「空配列をセットしていた（item.set('array,' [])）」場合を区別したい場合にこのメソッドを使ってください。<br>
		 * データアイテムを生成した直後は、スキーマにおいてdefaultValueを書いていないまたはnullをセットした場合はtrue、それ以外の場合はfalseを返します。<br>
		 * なお、引数に配列指定していないプロパティを渡した場合は、現在の値がnullかどうかを返します。
		 *
		 * @since 1.1.0
		 * @memberOf ObservableItem
		 * @returns {Boolean} 現在のこのプロパティにセットされているのがnullかどうか
		 */
		regardAsNull: function(key) {
			if (this._isArrayProp(key)) {
				return this._internal._nullProps[key] === true;
			}
			return this.get(key) === null;
		},

		/**
		 * 指定されたプロパティがtype:[]かどうかを返します。（type:anyでObservableArrayが入っている場合とtype:[]で最初から
		 * ObservableArrayが入っている場合を区別するため）
		 *
		 * @since 1.1.0
		 * @private
		 * @memberOf ObservableItem
		 * @returns {Boolean} 指定されたプロパティがtype:[]なプロパティかどうか
		 */
		_isArrayProp: function(prop) {
			if ($.inArray(prop, this._internal.aryProps) !== -1) {
				//Bindingにおいて比較的頻繁に使われるので、高速化も検討する
				return true;
			}
			return false;
		}
	});

	/**
	 * ObservableItemを作成します。
	 * <p>
	 * 引数にはスキーマオブジェクトを指定します。スキーマオブジェクトとは、ディスクリプタオブジェクトのschemaプロパティに指定するオブジェクトのことです。
	 * </p>
	 * <p>
	 * ディスクリプタオブジェクトについては<a
	 * href="/conts/web/view/tutorial-data-model/descriptor">チュートリアル(データモデル編)&gt;&gt;ディスクリプタの書き方</a>をご覧ください。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @param {Object} schema スキーマオブジェクト
	 * @returns {ObservableItem} ObservableItemインスタンス
	 */
	function createObservableItem(schema) {
		if (typeof schema !== 'object') {
			// schemaがオブジェクトじゃないならエラー
			throwFwError(ERR_CODE_REQUIRE_SCHEMA);
		}

		var errorReason = validateSchema(schema, null, true, true);
		if (errorReason.length > 0) {
			// schemaのエラー
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, errorReason);
		}

		var itemValueCheckFuncs = createCheckValueByDescriptor(schema);

		// defaultValueのチェック
		var defaultValueErrorReason = validateDefaultValue(schema, itemValueCheckFuncs, true);

		if (defaultValueErrorReason.length > 0) {
			// defaultValueのエラー
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, defaultValueErrorReason);
		}

		return new ObservableItem(schema, itemValueCheckFuncs);
	}

	/**
	 * ObserevableItemかどうかを判定します。
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @returns {Boolean} ObservableItemかどうか
	 */
	function isObservableItem(obj) {
		if (obj instanceof ObservableItem) {
			return true;
		}
		return false;
	}

	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name data
	 * @memberOf h5.core
	 */
	h5.u.obj.expose('h5.core.data', {
		createObservableArray: createObservableArray,
		createObservableItem: createObservableItem,
		isObservableArray: isObservableArray,
		isObservableItem: isObservableItem
	});

	// h5.core.dataでも共通で使用するエラーメッセージオブジェクトと、関数
	h5internal.core.data = {
		/* del begin */
		// dev版でのみエラーメッセージを使用する
		DESCRIPTOR_VALIDATION_ERROR_MSGS: DESCRIPTOR_VALIDATION_ERROR_MSGS,
		/* del end */
		validateSchema: validateSchema,
		validateDefaultValue: validateDefaultValue,
		createCheckValueByDescriptor: createCheckValueByDescriptor,
		createItemDescErrorReason: createItemDescErrorReason,
		createDependencyMap: createDependencyMap,
		isIntegerValue: isIntegerValue,
		isNumberValue: isNumberValue,
		isStringValue: isStringValue,
		unbox: unbox,
		EventDispatcher: EventDispatcher,
		calcDependencies: calcDependencies,
		getValue: getValue,
		setValue: setValue,
		isTypeArray: isTypeArray,
		ITEM_ERRORS: {
			ERR_CODE_INVALID_ITEM_VALUE: ERR_CODE_INVALID_ITEM_VALUE,
			ERR_CODE_DEPEND_PROPERTY: ERR_CODE_DEPEND_PROPERTY,
			ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY: ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY,
			ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY: ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY
		},
		ERR_CODE_INVALID_SCHEMA: ERR_CODE_INVALID_SCHEMA
	};
})();
