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

/* ------ h5.core.data ------ */
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
	 * <a href="#createSequence">createSequence()</a>で使用するための、型指定定数。
	 * <p>
	 * 文字列型を表します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @type {Integer}
	 */
	var SEQ_STRING = 1;

	/**
	 * <a href="#createSequence">createSequence()</a>で使用するための、型指定定数
	 * <p>
	 * 数値型を表します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @type {Integer}
	 */
	var SEQ_INT = 2;

	var ID_TYPE_STRING = 'string';
	var ID_TYPE_INT = 'number';

	// -------------------------------
	// エラーコード
	// -------------------------------
	/** マネージャ名が不正 */
	var ERR_CODE_INVALID_MANAGER_NAME = 15000;

	/** ディスプリプタが不正 */
	var ERR_CODE_INVALID_DESCRIPTOR = 15001;

	/** データアイテムの生成にはIDが必要なのに指定されていない */
	var ERR_CODE_NO_ID = 15002;

	/** DataItem.set()でidをセットすることはできない */
	var ERR_CODE_CANNOT_SET_ID = 15003;

	/** createModelに渡された配列内のディスクリプタ同士でtypeやbaseによる依存関係が循環参照している */
	var ERR_CODE_DESCRIPTOR_CIRCULAR_REF = 15004;

	/** DataModelに属していないDataItem、またはDataManagerに属していないDataModelのDataItemは変更できない */
	var ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM = 15005;

	/** DataManagerに属していないDataModelで、create/remove/変更できない */
	var ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL = 15006;

	/** createの引数がオブジェクトでも配列でもない */
	var ERR_CODE_INVALID_CREATE_ARGS = 15007;

	/** スキーマオブジェクトが指定されていない。 */
	var ERR_CODE_REQUIRE_SCHEMA = 15008;

	/** スキーマが不正 */
	var ERR_CODE_INVALID_SCHEMA = 15009;

	/** ObservableArrray#copyFromの引数が不正 */
	var ERR_CODE_INVALID_COPYFROM_ARGUMENT = 15010;

	/** スキーマ違反の値がセットされた */
	var ERR_CODE_INVALID_ITEM_VALUE = 15011;

	/** 依存項目にセットされた */
	var ERR_CODE_DEPEND_PROPERTY = 15012;

	/** ObservableItemでスキーマで定義されていない値にセットされた */
	var ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY = 15013;

	/** schemaに定義されていないプロパティを取得した */
	var ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY = 15014;

	/** addEventListenerに不正な引数が渡された */
	var ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER = 15015;

	/** depend.calcが制約を満たさない値を返している */
	var ERR_CODE_CALC_RETURNED_INVALID_VALUE = 15016;

	// ----------------------------------------------------------
	// ディスクリプタのエラーコード(detailに入れるメッセージID)
	// ----------------------------------------------------------
	/** ディスクリプタがオブジェクトでない */
	var DESC_ERR_DETAIL_NOT_OBJECT = 15900;

	/** nameが正しく設定されていない */
	var DESC_ERR_DETAIL_INVALID_NAME = 15901;

	/** baseの指定が不正 */
	var DESC_ERR_DETAIL_INVALID_BASE = 15902;

	/** baseに指定されたデータモデルが存在しない */
	var DESC_ERR_DETAIL_NO_EXIST_BASE = 15903;

	/** schemaもbaseも指定されていない */
	var DESC_ERR_DETAIL_NO_SCHEMA = 15904;

	/** schemaがオブジェクトでない */
	var DESC_ERR_DETAIL_SCHEMA_IS_NOT_OBJECT = 6;

	// ---------------------------------------------------
	// スキーマのエラーコード(detailに入れるメッセージID)
	// ---------------------------------------------------

	/** ID指定されたプロパティが重複している */
	var SCHEMA_ERR_DETAIL_DUPLICATED_ID = 15800;

	/** ID指定されたプロパティがない */
	var SCHEMA_ERR_DETAIL_NO_ID = 15801;

	/** プロパティ名が不正 */
	var SCHEMA_ERR_DETAIL_INVALID_PROPERTY_NAME = 15802;

	/** id指定されたプロパティにdependが指定されている */
	var SCHEMA_ERR_DETAIL_ID_DEPEND = 15803;

	/** depend.onに指定されたプロパティが存在しない */
	var SCHEMA_ERR_DETAIL_DEPEND_ON = 15804;

	/** depend.calcに関数が指定されていない */
	var SCHEMA_ERR_DETAIL_DEPEND_CALC = 15805;

	/** typeに文字列が指定されていない */
	var SCHEMA_ERR_DETAIL_INVALID_TYPE = 15806;

	/** type文字列が不正 */
	var SCHEMA_ERR_DETAIL_TYPE = 15807;

	/** typeに指定されたデータモデルが存在しない */
	var SCHEMA_ERR_DETAIL_TYPE_DATAMODEL = 15808;

	/** type:enumなのにenumValueが指定されていない */
	var SCHEMA_ERR_DETAIL_TYPE_ENUM_NO_ENUMVALUE = 15809;

	/** constraintにオブジェクトが指定されていない */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT = 15810;

	/** constraint.notNullの指定が不正 */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY = 15811;

	/** min-maxに数値が入力されなかった時のエラー */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MIN_MAX = 15812;

	/** typeがinteger,numberじゃないのにconstraint.min/max を指定されたときのエラー */
	var SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT = 15813;

	/** constraint.patternが正規表現じゃない */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_PATTERN = 15814;

	/** minLength/maxLengthに0以上の整数値以外の値が渡された */
	var SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_MINLENGTH_MAXLENGTH = 15815;

	/** constraintの指定に矛盾がある場合(mix > maxなど) */
	var SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT = 15816;

	/** typeがenumでないのにenumValueが指定されている */
	var SCHEMA_ERR_DETAIL_ENUMVALUE_TYPE = 15817;

	/** enumValueが配列でない、または空配列 */
	var SCHEMA_ERR_DETAIL_INVALID_ENUMVALUE = 15818;

	/** id項目にdefaultValueが設定されている */
	var SCHEMA_ERR_DETAIL_DEFAULTVALUE_ID = 15819;

	/** defaultValueに設定された値がtype,constraintに指定された条件を満たしていない */
	var SCHEMA_ERR_DETAIL_INVALIDATE_DEFAULTVALUE = 15820;

	/** ID項目のconstraintに不正な指定がある */
	var SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID = 15821;

	/** defaultValue指定されたプロパティにdependが指定されている */
	var SCHEMA_ERR_DETAIL_DEFAULTVALUE_DEPEND = 15822;

	/** dependの依存関係が循環している */
	var SCHEMA_ERR_DETAIL_DEPEND_CIRCULAR_REF = 15823;

	/** ID項目に'string','integer'以外のタイプが指定された */
	var SCHEMA_ERR_ID_TYPE = 15824;

	/**
	 * データモデルは存在しないことを表す文字列(n/a) エラーメッセージで使用。
	 */
	var NOT_AVAILABLE = 'n/a';

	/**
	 * イベント名
	 */
	var EVENT_ITEMS_CHANGE = 'itemsChange';

	/**
	 * データアイテム、データモデル変更時のイベントログをストックしておくためのタイプ
	 */
	var UPDATE_LOG_TYPE_CREATE = 1;
	var UPDATE_LOG_TYPE_CHANGE = 2;
	var UPDATE_LOG_TYPE_REMOVE = 3;

	// =============================
	// Development Only
	// =============================

	var fwLogger = h5.log.createLogger('h5.core.data');
	/* del begin */
	// 詳細エラーメッセージを作成する関数をカスタムフォーマッタに登録
	function formatDescriptorError(code, msgSrc, msgParam, detail) {
		var msg = h5.u.str.format.apply(null, [msgSrc].concat(msgParam)) + ' 詳細：';

		for ( var i = 0, len = detail.length; i < len; i++) {
			if (i !== 0) {
				msg += ', ';
			}

			msg += (i + 1) + ':';

			var reason = detail[i];
			if (reason.message) {
				msg += reason.message;
			} else {
				msg += 'code=' + reason.code;
			}
		}

		return msg;
	}
	addFwErrorCustomFormatter(ERR_CODE_INVALID_DESCRIPTOR, formatDescriptorError);
	addFwErrorCustomFormatter(ERR_CODE_INVALID_SCHEMA, formatDescriptorError);

	/**
	 * 各エラーコードに対応するメッセージ
	 */
	var errMsgMap = {};
	errMsgMap[ERR_CODE_REQUIRE_SCHEMA] = 'スキーマオブジェクトが指定されていません。';
	errMsgMap[ERR_CODE_INVALID_SCHEMA] = 'スキーマ定義オブジェクトが不正です。';
	errMsgMap[ERR_CODE_INVALID_ITEM_VALUE] = 'Itemのsetterに渡された値がスキーマで指定された型・制約に違反しています。データモデル={0} 違反したプロパティ={1}';
	errMsgMap[ERR_CODE_DEPEND_PROPERTY] = 'depend指定されているプロパティに値をセットすることはできません。データモデル={0} 違反したプロパティ={1}';
	errMsgMap[ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY] = 'スキーマに定義されていないプロパティに値をセットすることはできません。データモデル={0} 違反したプロパティ={1}';
	errMsgMap[ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY] = 'スキーマに定義されていないプロパティは取得できません。データモデル={0} 違反したプロパティ={1}';
	errMsgMap[ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER] = 'addEventListenerには、イベント名(文字列)、イベントリスナ(関数)を渡す必要があります。';
	errMsgMap[ERR_CODE_CALC_RETURNED_INVALID_VALUE] = 'calcで返却された値が、スキーマで指定された型・制約に違反しています。データモデル={0} プロパティ={1} 返却値={2}';
	errMsgMap[ERR_CODE_INVALID_COPYFROM_ARGUMENT] = 'copyFromの引数が不正です。配列を指定してください。引数位置={0}、値={1}';
	errMsgMap[ERR_CODE_INVALID_MANAGER_NAME] = 'マネージャ名が不正です。識別子として有効な文字列を指定してください。';
	errMsgMap[ERR_CODE_NO_ID] = 'データアイテムの生成にはID項目の値の設定が必須です。データモデル={0} IDプロパティ={1}';
	errMsgMap[ERR_CODE_INVALID_DESCRIPTOR] = 'データモデルディスクリプタにエラーがあります。';
	errMsgMap[ERR_CODE_CANNOT_SET_ID] = 'id指定されたプロパティを変更することはできません。データモデル={0} プロパティ={1}';
	errMsgMap[ERR_CODE_DESCRIPTOR_CIRCULAR_REF] = 'Datamaneger.createModelに渡された配列内のディスクリプタについて、baseやtypeによる依存関係が循環参照しています。';
	errMsgMap[ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM] = 'DataModelに属していないDataItem、またはDataManagerに属していないDataModelのDataItemの中身は変更できません。データアイテムID={0}, メソッド={1}';
	errMsgMap[ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL] = 'DataManagerに属していないDataModelの中身は変更できません。モデル名={0}, メソッド={1}';
	errMsgMap[ERR_CODE_INVALID_CREATE_ARGS] = 'DataModel.createに渡された引数が不正です。オブジェクトまたは、配列を指定してください。';

	// メッセージの登録
	addFwErrorCodeMap(errMsgMap);

	// detailに格納するメッセージ
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
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_NOT_OBJECT] = 'DataModelのディスクリプタにはオブジェクトを指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_INVALID_NAME] = 'データモデル名が不正です。使用できる文字は、半角英数字、_、$、のみで、先頭は数字以外である必要があります。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_INVALID_BASE] = 'baseの指定が不正です。指定する場合は、継承したいデータモデル名の先頭に"@"を付けた文字列を指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_NO_EXIST_BASE] = 'baseの指定が不正です。指定されたデータモデル{0}は存在しません。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_NO_SCHEMA] = 'schemaの指定が不正です。baseの指定がない場合はschemaの指定は必須です。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[DESC_ERR_DETAIL_SCHEMA_IS_NOT_OBJECT] = 'schemaの指定が不正です。schemaはオブジェクトで指定してください。';
	DESCRIPTOR_VALIDATION_ERROR_MSGS[SCHEMA_ERR_ID_TYPE] = '"{0}"プロパティの定義にエラーがあります。id指定されたプロパティには"string","integer"以外のtypeを指定することはできません。';

	// ログメッセージ
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
	// =============================
	// Variables
	// =============================
	/**
	 * DataItem, ObservableItem共通
	 */
	var itemProto = {
		/**
		 * 指定されたキーのプロパティの値を取得します。
		 * <p>
		 * 引数にプロパティ名を指定すると、アイテムが持つそのプロパティの値を返します。
		 * </p>
		 * <p>
		 * 引数の指定がない場合は、{id: '001', value: 'hoge'} のような、そのデータアイテムが持つ値を格納したオブジェクトを返します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataItem
		 * @param {String} [key] プロパティキー。指定のない場合は、アイテムの持つプロパティ名をキーに、そのプロパティの値を持つオブジェクトを返します。
		 * @returns Any 指定されたプロパティの値。引数なしの場合はプロパティキーと値を持つオブジェクト。
		 */
		get: function(key) {
			if (arguments.length === 0) {
				return $.extend({}, this._values);
			}

			// DataItemの場合はモデルから、ObsItemの場合はObsItemのインスタンスからschemaを取得
			var model = this._model;
			var schema = model ? model.schema : this.schema;
			if (!schema.hasOwnProperty(key)) {
				//スキーマに存在しないプロパティはgetできない（プログラムのミスがすぐわかるように例外を送出）
				throwFwError(ERR_CODE_CANNOT_GET_NOT_DEFINED_PROPERTY, [
						model ? model.name : NOT_AVAILABLE, key]);
			}

			return getValue(this, key);
		},

		/**
		 * 指定されたキーのプロパティに値をセットします。
		 * <p>
		 * 複数のプロパティに対して値を一度にセットしたい場合は、{ キー1: 値1, キー2: 値2, ... }という構造をもつオブジェクトを1つだけ渡してください。
		 * </p>
		 * <p>
		 * 1つのプロパティに対して値をセットする場合は、 item.set(key, value); のように2つの引数でキーと値を個別に渡すこともできます。
		 * </p>
		 * <p>
		 * このメソッドを呼ぶと、再計算が必要と判断された依存プロパティは自動的に再計算されます。
		 * 再計算によるパフォーマンス劣化を最小限にするには、1つのアイテムへのset()の呼び出しはできるだけ少なくする
		 * （引数をオブジェクト形式にして一度に複数のプロパティをセットし、呼び出し回数を最小限にする）ようにしてください。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataItem
		 * @param {Any} var_args 複数のキー・値のペアからなるオブジェクト、または1組の(キー, 値)を2つの引数で取ります。
		 */
		set: function(var_args) {
			//引数はオブジェクト1つ、または(key, value)で呼び出せる
			var valueObj = var_args;
			if (arguments.length === 2) {
				valueObj = {};
				valueObj[arguments[0]] = arguments[1];
			}

			// データモデルから作られたアイテムなら、アイテムがモデルに属しているか、モデルがマネージャに属しているかのチェック
			// アイテムがモデルに属していない又は、アイテムが属しているモデルがマネージャに属していないならエラー
			var model = this._model;
			if (model && (this._isRemoved || !model._manager)) {
				throwFwError(ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, [
						getValue(this, this._model._idKey), 'set'], this);
			}

			// バリデーション
			if (model) {
				// idの変更がされてるかどうかチェック
				if ((model._idKey in valueObj)
						&& (valueObj[model._idKey] !== getValue(this, model._idKey))) {
					//IDの変更は禁止
					throwFwError(ERR_CODE_CANNOT_SET_ID, [model.name, this._idKey]);
				}
				// スキーマの条件を満たすかどうかチェック

				// DataItemの場合はモデルから、ObsItemの場合はObsItemのインスタンスからschemaを取得
				validateValueObj(model.schema, model._schemaInfo._validateItemValue, valueObj,
						model);
			} else {
				// モデルが無い場合はthisはObserbableItem。(モデルが無いDataItemはチェック済みのため)
				// ObsItem.validateを呼んでスキーマの条件を満たすかどうかチェック
				var error = this.validate(valueObj);
				if (error) {
					throw error;
				}
			}

			var event = null;
			// updateセッション中かどうか。updateセッション中ならこのsetの中ではbeginUpdateもendUpdateしない
			// updateセッション中でなければ、begin-endで囲って、最後にイベントが発火するようにする
			// このbegin-endの間にObsArrayでイベントが上がっても(内部でcopyFromを使ったりなど)、itemにイベントは上がらない
			var isAlreadyInUpdate = model ? model._manager.isInUpdate() : false;
			if (model && !isAlreadyInUpdate) {
				model._manager.beginUpdate();
			}
			// isInSetフラグを立てて、set内の変更でObsAry.copyFromを呼んだ時にイベントが上がらないようにする
			this._isInSet = true;
			event = itemSetter(this, valueObj);
			this._isInSet = false;

			if (model) {
				// データアイテムの場合は、モデルにイベントを渡す
				if (event) {
					// 更新した値があればChangeLogを追記
					addUpdateChangeLog(model, event);
				}
				// endUpdateを呼んでイベントを発火
				if (!isAlreadyInUpdate) {
					model._manager.endUpdate();
				}
			} else if (event) {
				// ObservableItemなら即発火
				this.dispatchEvent(event);
			}
		},

		/**
		 * type:[]であるプロパティについて、最後にセットされた値がnullかどうかを返します。
		 * <p>
		 * type:[]としたプロパティは常にObservableArrayインスタンスがセットされており、set('array', null);
		 * と呼ぶと空配列を渡した場合と同じになります。
		 * </p>
		 * <p>
		 * そのため、「実際にはnullをセットしていた（item.set('array', null)）」場合と「空配列をセットしていた（item.set('array,'
		 * [])）」場合を区別したい場合にこのメソッドを使ってください。
		 * </p>
		 * <p>
		 * データアイテムを生成した直後は、スキーマにおいてdefaultValueを書いていないまたはnullをセットした場合はtrue、それ以外の場合はfalseを返します。
		 * </p>
		 * <p>
		 * なお、引数に配列指定していないプロパティを渡した場合は、現在の値がnullかどうかを返します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataItem
		 * @param {String} key プロパティ名
		 * @returns {Boolean} 現在指定したプロパティにセットされているのがnullかどうか
		 */
		regardAsNull: function(key) {
			if (this._isArrayProp(key)) {
				return this._nullProps[key] === true;
			}
			return getValue(this, key) === null;
		},

		/**
		 * 指定されたプロパティがtype:[]かどうかを返します。（type:anyでObservableArrayが入っている場合とtype:[]で最初から
		 * ObservableArrayが入っている場合を区別するため
		 *
		 * @private
		 * @memberOf DataItem
		 * @returns {Boolean} 指定されたプロパティがtype:[]なプロパティかどうか
		 */
		_isArrayProp: function(prop) {
			// DataItemの場合はモデルから、ObsItemの場合はObsItemのインスタンスからschemaを取得
			var schema = this._model ? this._model.schema : this.schema;
			// DataItemの場合はモデルから、ObsItemの場合はObsItemのインスタンスからschemaを取得
			if (schema[prop] && schema[prop].type && schema[prop].type.indexOf('[]') > -1) {
				//Bindingにおいて比較的頻繁に使われるので、高速化も検討する
				return true;
			}
			return false;
		}
	};
	// =============================
	// Functions
	// =============================
	//========================================================
	//
	// バリデーション関係コードここから
	//
	//========================================================
	/**
	 * ObservableItem, DataItem, DataModelから計算済みのschemaオブジェクトを取得する
	 *
	 * @private
	 * @param {ObservableItem|DataItem|DataModel}
	 */
	function getSchema(itemOrModel) {
		// ObsItem,DataModelはschemaプロパティを持つが、DataItemはschemaを持たないので、modelから取得して返す
		return itemOrModel.schema || itemOrModel._model.schema;
	}

	/**
	 * schemaオブジェクトのtype指定の文字列を、パースした結果を返す。 正しくパースできなかった場合は空オブジェクトを返す。
	 *
	 * @private
	 * @param {String} type
	 * @returns {Object} typeをパースした結果オブジェクト。
	 *          elmType:タイプから配列部分を除いた文字列。dataModel:データモデル名。dimension:配列の深さ(配列指定でない場合は0)
	 */
	function getTypeObjFromString(type) {
		// マッチ結果から、データモデル指定の場合と配列の場合をチェックする
		// "string[]"のとき、matched = ["string[]", "string", undefined, "[]", "[]"]
		// "@DataModel"のとき、matched = ["@DataModel", "@DataModel", "DataModel", "", undefined]
		var matched = type.match(/^(string|number|integer|boolean|any|enum|@(.+?))((\[\]){0,1})$/);
		return matched ? {
			elmType: matched[1],
			dataModel: matched[2],
			dimension: matched[3] ? 1 : 0
		} : {};
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
	 * データモデルのディスクリプタとして正しいオブジェクトかどうかチェックする。 正しくない場合はエラーを投げる。
	 *
	 * @private
	 * @param {Object} descriptor オブジェクト
	 * @param {Object} DataManagerオブジェクト
	 * @param {Boolean} stopOnErro エラーが発生した時に、即座にreturnするかどうか
	 * @returns {Boolean} descriptorのチェック結果。
	 */
	function validateDescriptor(descriptor, manager, stopOnError) {
		var errorReason = [];

		// try-catchで囲うことで、必ずERR_CODE_INVALID_DESCRIPTORエラーを投げられるようにしている。
		// (stopOnErrorがfalseで、予期しない箇所でエラーが出たとしてもERR_CODE_INVALID_DESCRIPTORエラーを投げる。)
		try {
			// descriptorがオブジェクトかどうか
			if (!$.isPlainObject(descriptor)) {
				// descriptorがオブジェクトじゃなかったら、これ以上チェックしようがないので、stopOnErrorの値に関わらずreturnする
				errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_NOT_OBJECT));
				throw null;
			}

			// nameのチェック
			if (!isValidNamespaceIdentifier(descriptor.name)) {
				// 識別子として不適切な文字列が指定されていたらエラー
				errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_INVALID_NAME));
				if (stopOnError) {
					throw null;
				}
			}

			// baseのチェック
			var base = descriptor.base;
			var baseSchema = null;
			if (base != null) {
				// nullまたはundefinedならチェックしない
				if (!isString(base) || base.indexOf('@') !== 0) {
					// @で始まる文字列（base.indexOf('@')が0）でないならエラー
					errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_INVALID_BASE));
					if (stopOnError) {
						throw null;
					}
				} else {
					var baseName = base.substring(1);
					var baseModel = manager.models[baseName];
					if (!baseModel) {
						// 指定されたモデルが存在しないならエラー
						errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_NO_EXIST_BASE,
								baseName));
						if (stopOnError) {
							throw null;
						}
					} else {
						baseSchema = manager.models[baseName].schema;
					}
				}
			}

			// schemaのチェック
			// baseSchemaがないのに、schemaが指定されていなかったらエラー
			var schema = descriptor.schema;
			if (!baseSchema && schema == null) {
				errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_NO_SCHEMA));
				if (stopOnError) {
					throw null;
				}
			}

			// schemaが指定されていて、オブジェクトでないならエラー
			if (!baseSchema && !$.isPlainObject(schema)) {
				errorReason.push(createItemDescErrorReason(DESC_ERR_DETAIL_SCHEMA_IS_NOT_OBJECT));
				// schemaがオブジェクトでなかったら、schemaのチェックのしようがないので、stopOnErrorの値に関わらずreturnする
				throw null;
			}

			return true;
		} catch (e) {
			throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, errorReason);
		}
	}

	/**
	 * schemaが正しいかどうか判定する。正しくない場合はエラーを投げる。
	 *
	 * @private
	 * @param {Object} schema schemaオブジェクト。データモデルのディスクリプタに指定されたスキーマなら継承関係は計算済み。
	 * @param {Boolean} [isDataModelSchema]
	 *            データモデルのスキーマかどうか。データモデルのスキーマならidチェックが必要で、type指定に@データモデル指定が可能。
	 * @param {Object} [manager] DataManagerオブジェクト。データモデルのスキーマチェック時には必須。
	 * @param {Boolean} [stopOnError] エラーが発生した時に、即座にreturnするかどうか。(trueなら即座にreturn)
	 * @returns {Boolean} チェック結果。
	 */
	function validateSchema(schema, isDataModelSchema, manager, stopOnError) {
		if (typeof schema !== 'object') {
			// schemaがオブジェクトじゃないならエラー
			throwFwError(ERR_CODE_REQUIRE_SCHEMA);
		}

		var errorReason = [];

		// try-catchで囲うことで、必ずERR_CODE_INVALID_SCHEMAエラーを投げられるようにしている。
		// (stopOnErrorがfalseで、予期しない箇所でエラーが出たとしてもERR_CODE_INVALID_SCHEMAエラーを投げる。)
		try {
			if (isDataModelSchema) {
				// id指定されている属性が一つだけであることをチェック
				var hasId = false;
				for ( var p in schema) {
					if (schema[p] && schema[p].id === true) {
						if (hasId) {
							errorReason
									.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DUPLICATED_ID));
							if (stopOnError) {
								throw null;
							}
						}
						hasId = true;
					}
				}
				if (!hasId) {
					errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_NO_ID));
					if (stopOnError) {
						throw null;
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
				// idの時は特別にチェック(idにはdependが指定できない、typeが指定できない等)する項目があるのでそのフラグ
				// ObservableItemの時は関係ない。
				var isId = isDataModelSchema && !!propObj.id;

				// プロパティ名が適切なものかどうかチェック
				if (!isValidNamespaceIdentifier(schemaProp)) {
					errorReason.push(createItemDescErrorReason(
							SCHEMA_ERR_DETAIL_INVALID_PROPERTY_NAME, schemaProp));
					if (stopOnError) {
						throw null;
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
							throw null;
						}
					}

					// defaultValueが指定されているならエラー
					if (propObj.hasOwnProperty('defaultValue')) {
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_DEFAULTVALUE_DEPEND, schemaProp));
						if (stopOnError) {
							throw null;
						}
					}

					// dependが指定されているなら、onが指定されていること
					if (depend.on == null) {
						errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_DEPEND_ON,
								schemaProp));
						if (stopOnError) {
							throw null;
						}
					} else {
						var onArray = wrapInArray(depend.on);
						for ( var i = 0, l = onArray.length; i < l; i++) {
							if (!schema.hasOwnProperty(onArray[i])) {
								errorReason.push(createItemDescErrorReason(
										SCHEMA_ERR_DETAIL_DEPEND_ON, schemaProp));
								if (stopOnError) {
									throw null;
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
							throw null;
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
							throw null;
						}
					} else {
						if (isId && type !== 'string' && type !== 'integer') {
							// id指定されているプロパティで、string,integer以外だった場合はエラー
							errorReason.push(createItemDescErrorReason(SCHEMA_ERR_ID_TYPE,
									schemaProp));
							if (stopOnError) {
								throw null;
							}
						}

						// "string", "number[]", "@DataModel"... などの文字列をパースしてオブジェクトを生成する
						// 正しくパースできなかった場合は空オブジェクトが返ってくる
						typeObj = getTypeObjFromString(type);

						if (!typeObj.elmType) {
							// パースできない文字列が指定されていたらエラー
							errorReason.push(createItemDescErrorReason(SCHEMA_ERR_DETAIL_TYPE,
									schemaProp, type));
							if (stopOnError) {
								throw null;
							}
						} else {
							// データモデルの場合
							if (typeObj.dataModel) {
								if (!isDataModelSchema) {
									// データモデルをタイプに指定できるのはデータモデルのスキーマだけなのでエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE, schemaProp, typeObj.dataModel));
									if (stopOnError) {
										throw null;
									}
								}
								if (!manager.models[typeObj.dataModel]) {
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_DATAMODEL, schemaProp,
											typeObj.dataModel));
									if (stopOnError) {
										throw null;
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
										throw null;
									}
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
							throw null;
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
										throw null;
									}
								} else if (isId && !val) {
									// id項目にnotNull:falseが指定されていたらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID, schemaProp,
											p, val));
									if (stopOnError) {
										throw null;
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
											throw null;
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
											throw null;
										}
									}
									break;
								default:
									// typeの指定とconstraintに不整合があったらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
											typeObj.elmType));
									if (stopOnError) {
										throw null;
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
											throw null;
										}
									} else if (isId && p === 'maxLength' && val === 0) {
										// id項目にmaxLength: 0 が指定されていたらエラー
										errorReason.push(createItemDescErrorReason(
												SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID,
												schemaProp, p, val));
										if (stopOnError) {
											throw null;
										}
									}
									break;
								default:
									// type:'string'以外の項目にmaxLength,minLengthが指定されていればエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
											typeObj.elmType));
									if (stopOnError) {
										throw null;
									}
								}
								break;
							case 'notEmpty':
								switch (typeObj.elmType) {
								case 'string':
									if (val !== true && val !== false) {
										// notEmptyにtrue,false以外の指定がされていたらエラー
										errorReason
												.push(createItemDescErrorReason(
														SCHEMA_ERR_DETAIL_INVALID_CONSTRAINT_NOTNULL_NOTEMPTY,
														schemaProp, p));
										if (stopOnError) {
											throw null;
										}
									} else if (isId && !val) {
										// id項目にnotEmpty: false が指定されていたらエラー
										errorReason.push(createItemDescErrorReason(
												SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT_ID,
												schemaProp, p, val));
										if (stopOnError) {
											throw null;
										}
									}
									break;
								default:
									// type:'string'以外の項目にnotEmptyが指定されていたらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
											typeObj.elmType));
									if (stopOnError) {
										throw null;
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
											throw null;
										}
									}
									break;
								default:
									// type:'string'以外の項目にpatterが指定されていたらエラー
									errorReason.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_TYPE_CONSTRAINT, schemaProp, p,
											typeObj.elmType));
									if (stopOnError) {
										throw null;
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
								throw null;
							}
						}
						if (constraintObj.min != null && constraintObj.max != null
								&& constraintObj.min > constraintObj.max) {
							// min > max
							errorReason
									.push(createItemDescErrorReason(
											SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT, schemaProp,
											'min', 'max'));
							if (stopOnError) {
								throw null;
							}
						}
						if (constraintObj.minLength != null && constraintObj.maxLength != null
								&& constraintObj.minLength > constraintObj.maxLength) {
							// minLength > maxLength
							errorReason.push(createItemDescErrorReason(
									SCHEMA_ERR_DETAIL_CONSTRAINT_CONFLICT, schemaProp, 'minLength',
									'maxLength'));
							if (stopOnError) {
								throw null;
							}
						}
					}
				}

				// enumValueのチェック
				var enumValue = propObj.enumValue;
				if (enumValue != null) {
					if (typeObj.elmType !== 'enum') {
						// type指定がenumでないならエラー
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_ENUMVALUE_TYPE, schemaProp));
						if (stopOnError) {
							throw null;
						}
					}
					if (!$.isArray(enumValue) || enumValue.length === 0
							|| $.inArray(null, enumValue) > -1
							|| $.inArray(undefined, enumValue) > -1) {
						// 配列でない、または空配列、null,undefinedを含む配列ならエラー
						errorReason.push(createItemDescErrorReason(
								SCHEMA_ERR_DETAIL_INVALID_ENUMVALUE, schemaProp));
						if (stopOnError) {
							throw null;
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
						throw null;
					}
				}
			}

			// depend.onの循環参照チェック
			// onに指定されているプロパティの定義が正しいかどうかのチェックが終わっているここでチェックする
			// （循環参照チェック以前の、プロパティがあるのか、dependがあるならonがあるか、などのチェックをしなくて済むようにするため）
			// （これ以前のチェックに引っかかっていたら、循環参照のチェックはしない）
			for ( var prop in dependencyMap) {
				if (checkDependCircularRef(prop, dependencyMap)) {
					errorReason.push(createItemDescErrorReason(
							SCHEMA_ERR_DETAIL_DEPEND_CIRCULAR_REF, prop));
					if (stopOnError) {
						throw null;
					}
				}
			}
		} catch (e) {
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, errorReason);
		}
		return true;
	}

	/**
	 * checkFuncsの条件をdefaultValueが満たすかどうかチェックする
	 *
	 * @private
	 * @param {Object} descriptor descriptor
	 * @param {Object} checkFuncs 各プロパティをキーに、チェックする関数を持つオブジェクト
	 * @param {Boolean} stopOnError defaultValueがチェック関数を満たさない時に、エラーを投げてチェックを中断するかどうか
	 * @returns {Boolean} チェック結果。
	 */
	function validateDefaultValue(schema, checkFuncs, stopOnError) {
		var errorReason = [];
		try {
			for ( var p in schema) {
				var propObj = schema[p];
				if (!propObj
						|| !propObj.hasOwnProperty('defaultValue')
						&& propObj.type
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
						throw null;
					}
				}
			}
			return true;
		} catch (e) {
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, errorReason);
		}
	}

	/**
	 * スキーマのプロパティオブジェクトから、そのプロパティに入る値かどうかをチェックする関数を作る。 # schema:{val:xxxx,val2:....}
	 * のxxxxの部分と、マネージャを引数にとる スキーマのチェックが通ってから呼ばれる前提なので、エラーチェックは行わない。
	 *
	 * @private
	 * @param {Object} propertyObject スキーマのプロパティオブジェクト
	 * @param {Boolean} isDataModel データモデルのチェック関数を作成するかどうか。trueならidチェックを行う。
	 * @param {Object} [manager] そのスキーマを持つモデルが属するマネージャのインスタンス。データモデルのチェックに必要(要らないなら省略可能)
	 * @returns {function} 指定されたスキーマのプロパティに、引数の値が入るかどうかをチェックする関数
	 */
	function createCheckValueBySchemaPropertyObj(propertyObject, isDataModel, manager) {
		// schema{prop:null} のように指定されている場合はpropObjはnullなので、空オブジェクト指定と同等に扱うようにする
		var propObj = propertyObject || {};
		var checkFuncArray = [];
		var elmType = null;
		var dimension = 0;
		var type = propObj.type;
		var constraint = propObj.constraint || {};

		// id:true の場合 type指定がない場合はtype:string,
		// notNull(type:stringならnotEmpty)をtrueにする(データモデルの場合のみ)
		if (isDataModel && propObj.id) {
			type = type || 'string';
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
		if (constraint) {
			checkFuncArray.push(createConstraintCheckFunction(constraint));
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
	 * @param {Object} schema スキーマオブジェクト
	 * @param {Booelan} isDataModel データモデルのチェック関数を作るかどうか。trueならidのチェックもする。
	 * @param {Object} manager データモデルマネージャ
	 */
	function createValueCheckFuncsBySchema(schema, isDataModel, manager) {
		var checkFuncs = {};
		for ( var p in schema) {
			checkFuncs[p] = createCheckValueBySchemaPropertyObj(schema[p], isDataModel, manager);
		}
		return checkFuncs;
	}

	/**
	 * constraintオブジェクトから、値がそのconstraintの条件を満たすかどうか判定する関数を作成する
	 *
	 * @private
	 * @param {Object} constraint constraintオブジェクト
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
	 * @param {Object} [opt] type判定に使用するためのオプション
	 * @param {Object} [opt.manager]
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
	 * @param {Object} checkObj
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

	//========================================================
	//
	// バリデーション関係コードここまで
	//
	//========================================================
	/**
	 * 初期化プロパティとObservableItemまたはDataItemのインスタンスを引数にとり、 ObservableItemとDataItemで共通するセットアップを行います
	 *
	 * @private
	 * @param {DataItem|ObservableItem} item
	 * @param {Object} schema スキーマ
	 * @param {Object} schemaInfo schemaInfo
	 * @param {Object} userInitialValue 初期値としてsetする値が格納されたオブジェクト
	 */
	function itemSetup(item, schema, schemaInfo, userInitialValue) {
		// アイテムが持つ値を格納するオブジェクト
		item._values = {};

		// nullPropsの設定
		/** type:[]なプロパティで、最後にset()された値がnullかどうかを格納する。キー：プロパティ名、値：true/false */
		item._nullProps = {};

		// 配列のプロパティを設定
		for ( var plainProp in schema) {
			if (schema[plainProp] && isTypeArray(schema[plainProp].type)) {
				//配列の場合は最初にObservableArrayのインスタンスを入れる
				var obsArray = createObservableArray();
				//DataItemまたはObsItemに属するObsArrayには、Item自身への参照を入れておく。
				//これによりイベントハンドラ内でこのItemを参照することができる
				/**
				 * ObservableArrayが所属しているDataItemまたはObservableItemのインスタンス
				 * <p>
				 * ObservableArrayがDataItemまたはObservableItemが持つインスタンスである場合、このプロパティにそのアイテムのインスタンスが格納されています。
				 * </p>
				 *
				 * @name relatedItem
				 * @memberOf ObservableArray
				 * @type {DataItem|ObservableItem}
				 */
				obsArray.relatedItem = item;
				// 値のセット
				setValue(item, plainProp, obsArray);
				item._nullProps[plainProp] = true;
			}
		}
	}

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
	 * validateDescriptor/Schema/DefaultValueが投げるエラー情報の配列に格納するエラーオブジェクトを作成する
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
		var ret = {
			code: code
		};
		/* del begin */
		args[0] = DESCRIPTOR_VALIDATION_ERROR_MSGS[code];
		ret.message = h5.u.str.format.apply(null, args);
		/* del end */
		// min版はメッセージがないので格納しない
		return ret;
	}

	/**
	 * データモデルのitemsChangeイベントオブジェクトを作成する
	 *
	 * @private
	 */
	function createDataModelItemsChangeEvent(created, recreated, removed, changed) {
		return {
			type: EVENT_ITEMS_CHANGE,
			created: created,
			recreated: recreated,
			removed: removed,
			changed: changed
		};
	}
	/**
	 * 依存プロパティの再計算を行います。再計算後の値はitemの各依存プロパティに代入されます。
	 *
	 * @private
	 * @param {DataItem} item データアイテム
	 * @param {Object} event プロパティ変更イベント
	 * @param {String|String[]} changedProps 今回変更されたプロパティ
	 * @param {Boolean} isCreate create時に呼ばれたものかどうか。createなら値の変更を見ずに無条件でcalcを実行する
	 * @returns {Object} { dependProp1: { oldValue, newValue }, ... } という構造のオブジェクト
	 */
	function calcDependencies(item, event, changedProps, isCreate) {
		// 今回の変更に依存する、未計算のプロパティ
		var targets = [];

		var schema = getSchema(item);
		var dependsMap = item._dependencyMap;

		/**
		 * この依存プロパティが計算可能（依存するすべてのプロパティの再計算が完了している）かどうかを返します。
		 * 依存しているプロパティが依存プロパティでない場合は常にtrue(計算済み)を返します
		 * 依存しているプロパティが依存プロパティが今回の変更されたプロパティに依存していないならtrue(計算済み)を返します
		 */
		function isReady(dependProp) {
			var deps = wrapInArray(schema[dependProp].depend.on);
			for ( var i = 0, len = deps.length; i < len; i++) {
				if ($.inArray(deps[i], item._realProperty) === -1
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
			targets = item._dependProps.slice();
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
					var newValue = schema[dp].depend.calc.call(item, event);

					// 型変換を行わない厳密チェックで、戻り値をチェックする
					var errReason = item._validateItemValue(dp, newValue, true);
					if (errReason.length !== 0) {
						// calcの返した値が型・制約違反ならエラー
						throwFwError(ERR_CODE_CALC_RETURNED_INVALID_VALUE, [
								item._model ? item._model.name : NOT_AVAILABLE, dp, newValue]);
					}
					ret[dp] = {
						oldValue: getValue(item, dp),
						newValue: newValue
					};
					// calcの結果をセット
					if (schema[dp] && isTypeArray(schema[dp].type)) {
						//配列の場合は値のコピーを行う。ただし、コピー元がnullの場合があり得る(type:[]はnullable)
						//その場合は空配列をコピー

						// item._nullPropsにnullかどうかを保持する
						if (newValue) {
							getValue(item, dp).copyFrom(newValue);
							// newValueがnullでないならregardAsNull()がtrueを返すようにする
							item._nullProps[dp] = false;
						} else {
							getValue(item, dp).copyFrom([]);
							// newValueがnullまたはundefinedならregardAsNull()がtrueを返すようにする
							item._nullProps[dp] = true;
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

	/**
	 * 渡されたオブジェクトがスキーマを満たすかどうかをチェックする 満たさない場合は例外を投げる。
	 * depend項目のセットはここではエラーにならない。現在の値と厳密等価な値のセットはOKなため、validate時のアイテムの値が分からない限り判定できないため。
	 * depend.calcの計算も行わない。calcの結果がセット時のアイテムの状態によって変わったり、副作用のある関数の可能性もあるため。
	 * そのため、depend項目のスキーマチェックも行われない。
	 *
	 * @private
	 */
	function validateValueObj(schema, validateItemValue, valueObj, model) {
		for ( var prop in valueObj) {
			if (!(prop in schema)) {
				// schemaに定義されていないプロパティ名が入っていたらエラー
				throwFwError(ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY, [
						model ? model.name : NOT_AVAILABLE, prop]);
			}
			var newValue = valueObj[prop];

			//type:[]で、代入指定無しの場合はvalidationを行わない
			if (schema[prop] && isTypeArray(schema[prop].type) && !valueObj.hasOwnProperty(prop)) {
				continue;
			}

			// modelがある場合はプロパティがidKeyかどうかを調べる
			var isId = model && model._idKey === prop;

			// 型・制約チェック
			// 配列が渡された場合、その配列の要素が制約を満たすかをチェックしている
			// idKeyの場合は、isStrictをtrueにしてvalidateItemValueを呼び出す。
			// (idの場合はtype:'string'でもnew Strng()で作ったラッパークラスのものは入らない)
			var validateResult = validateItemValue(prop, newValue, isId);
			if (validateResult.length > 0) {
				throwFwError(ERR_CODE_INVALID_ITEM_VALUE,
						[model ? model.name : NOT_AVAILABLE, prop], validateResult);
			}
		}
	}

	/**
	 * アイテムに値をセットする
	 */
	function itemSetter(item, valueObj, ignoreProps, isCreate) {
		var schema = getSchema(item);

		// valueObjから整合性チェックに通ったものを整形して格納する配列
		var readyProps = [];

		//先に、すべてのプロパティの整合性チェックを行う
		for ( var prop in valueObj) {
			if (ignoreProps && ($.inArray(prop, ignoreProps) !== -1)) {
				//このpropプロパティは無視する
				continue;
			}

			var oldValue = getValue(item, prop);
			var newValue = valueObj[prop];

			// depend指定されている項目はsetしない
			if (schema[prop] && schema[prop].depend) {
				// dependなプロパティの場合、現在の値とこれから代入しようとしている値が
				// 厳密等価でtrueになる場合に限り、代入を例外にせず無視する。
				// これは、item.get()の戻り値のオブジェクトをそのままset()しようとしたときに
				// dependのせいでエラーにならないようにするため。
				if (oldValue !== newValue) {
					throwFwError(ERR_CODE_DEPEND_PROPERTY, [
							item._model ? item._model.name : NOT_AVAILABLE, prop]);
				}

				// 厳密等価な場合は無視
				continue;
			}

			var type = schema[prop] && schema[prop].type;

			// 配列でかつnewValueがnullまたはundefinedなら、空配列が渡された時と同様に扱う。
			// エラーにせず、保持しているObsAryインスタンスを空にする。
			if (isTypeArray(type)) {
				if (newValue == null) {
					newValue = [];
					item._nullProps[prop] = true;
				} else {
					item._nullProps[prop] = false;
				}
			}

			// typeがstring,number,integer,boolean、またはその配列なら、値がラッパークラスの場合にunboxする
			if (type && type.match(/string|number|integer|boolean/)) {
				newValue = unbox(newValue);
			}

			//値がnull以外なら中身の型変換行う
			//typeがnumber,integerで、newValueが文字列(もしくは配列)なら型変換を行う
			//型のチェックは終わっているので、typeがnumber・integerならnewValueは数値・数値変換可能文字列・null またはそれらを要素に持つ配列のいずれかである
			if (newValue != null && type && type.match(/number|integer/)
					&& typeof newValue !== 'number') {
				if ($.isArray(newValue) || h5.core.data.isObservableArray(newValue)) {
					for ( var i = 0, l = newValue.length; i < l; i++) {
						// スパースな配列の場合、undefinedが入っている可能性があるので、!= で比較
						// parseFloatできる値(isNumberValueに渡してtrueになる値)ならparseFloatする
						if (newValue[i] != null && isNumberValue(newValue[i])) {
							newValue[i] = parseFloat(newValue[i]);
						}
					}
				} else if (newValue != null) {
					newValue = parseFloat(newValue);
				}
			}

			// 配列なら、配列の中身も変更されていないかチェックする(type:anyならチェックしない)
			// type:[]の場合、oldValueは必ずObsArrayまたはundefined。
			// newValue,oldValueともに配列(oldValueの場合はObsArray)かつ、長さが同じ場合にのみチェックする
			if (isTypeArray(type) && oldValue && oldValue.equals(newValue, oldValue)) {
				continue;
			}

			// 値の型変更を行った後に、値が変更されていないかチェックする。(NaN -> NaN も変更無し扱い)
			if (oldValue === newValue || isStrictNaN(oldValue) && isStrictNaN(newValue)) {
				//同じ値がセットされた場合は何もしない
				continue;
			}

			// ObservableArrayの場合、oldValueはスナップしたただの配列にする
			// ただし、typeが未指定またはanyにObservableArrayが入っていた場合はそのまま
			if (type && type.indexOf('[]') !== -1 && h5.core.data.isObservableArray(oldValue)) {
				//TODO sliceを何度もしないようにする
				oldValue = oldValue.toArray();
			}

			//ここでpushしたプロパティのみ、後段で値をセットする
			readyProps.push({
				p: prop,
				o: oldValue,
				n: newValue
			});
		}
		//更新する値のない場合は何も返さないで終了
		if (!readyProps.length) {
			return;
		}

		var changedProps = {};
		var changedPropNameArray = [];

		//値の変更が起こる全てのプロパティについて整合性チェックが通ったら、実際に値を代入する
		for ( var i = 0, len = readyProps.length; i < len; i++) {
			var readyProp = readyProps[i];

			//TODO 判定文改良
			if (schema[readyProp.p] && isTypeArray(schema[readyProp.p].type)) {
				//配列の場合は値のコピーを行う。ただし、コピー元がnullの場合があり得る（create()でdefaultValueがnull）ので
				//その場合はコピーしない
				if (readyProp.n) {
					getValue(item, readyProp.p).copyFrom(readyProp.n);
				}
			} else {
				//新しい値を代入
				setValue(item, readyProp.p, readyProp.n);
			}

			//newValueは現在Itemが保持している値（type:[]の場合は常に同じObsArrayインスタンス）
			changedProps[readyProp.p] = {
				oldValue: readyProp.o,
				newValue: item.get(readyProp.p)
			};

			changedPropNameArray.push(readyProp.p);
		}

		//最初にアイテムを生成した時だけ、depend.calcに渡すイベントのtypeはcreateにする
		var eventType = isCreate === true ? 'create' : 'change';

		//今回変更されたプロパティと依存プロパティを含めてイベント送出
		var event = {
			type: eventType,
			target: item,
			props: changedProps
		};

		// 依存プロパティを再計算し、変更があったらchangeイベントに含める
		$.extend(changedProps, calcDependencies(item, event, changedPropNameArray, isCreate));

		return event;
	}

	/**
	 * 当該モデルに対応するアップデートログ保持オブジェクトを取得する。 オブジェクトがない場合は生成する。
	 */
	function getModelUpdateLogObj(model) {
		var manager = model._manager;
		var modelName = model.name;

		if (!manager._updateLogs) {
			manager._updateLogs = {};
		}

		if (!manager._updateLogs[modelName]) {
			manager._updateLogs[modelName] = {};
		}

		return manager._updateLogs[modelName];
	}


	/**
	 * 当該モデルが属しているマネージャにUpdateLogを追加する
	 */
	function addUpdateLog(model, type, items) {
		if (!model._manager) {
			return;
		}

		var modelLogs = getModelUpdateLogObj(model);

		for ( var i = 0, len = items.length; i < len; i++) {
			var item = items[i];
			var itemId = item._values[model._idKey];

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
		if (!model._manager) {
			return;
		}

		var modelLogs = getModelUpdateLogObj(model);

		var itemId = ev.target._values[model._idKey];

		if (!modelLogs[itemId]) {
			modelLogs[itemId] = [];
		}
		modelLogs[itemId].push({
			type: UPDATE_LOG_TYPE_CHANGE,
			ev: ev
		});
	}

	/**
	 * ObsArrayのスナップショットをmanager._oldValueLogsに保存しておく アップデートセッション中に複数回変更しても、保存しておくoldValueは1つでいいので、
	 * すでに保存済みなら配列のsliceはしない。
	 */
	function addObsArrayOldValue(model, item, prop) {
		if (!model._manager) {
			return;
		}

		var modelLogs = getModelOldValueLogObj(model);

		var itemId = item._values[model._idKey];

		if (!modelLogs[itemId]) {
			modelLogs[itemId] = {};
		}

		if (!modelLogs[itemId][prop]) {
			modelLogs[itemId][prop] = getValue(item, prop).toArray();
			return;
		}

		// すでに存在していれば、oldValue保存済みなので、何もしない
		return;
	}

	/**
	 * 当該モデルに対応するアップデートログ保持オブジェクトを取得する。 オブジェクトがない場合は生成する。
	 */
	function getModelOldValueLogObj(model) {
		var manager = model._manager;
		var modelName = model.name;

		if (!manager._oldValueLogs) {
			manager._oldValueLogs = {};
		}

		if (!manager._oldValueLogs[modelName]) {
			manager._oldValueLogs[modelName] = {};
		}

		return manager._oldValueLogs[modelName];
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
	/**
	 * 第一引数に指定された名前のデータモデルマネージャを作成します。
	 * <p>
	 * 第2引数が渡された場合、その名前空間に<a href="DataModelManager.html">DataModelManager</a>インスタンスを公開します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @param {String} name マネージャ名
	 * @param {String} [namespace] 公開先名前空間
	 * @returns {DataModelManager} データモデルマネージャ
	 */
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

	/**
	 * モデルを作成する。descriptorは配列で指定可能。
	 * <p>
	 * thisはデータモデルマネージャから呼ばれた場合はそのデータモデルマネージャ。
	 * </p>
	 */
	function createModel(descriptor) {
		// descriptorがオブジェクトまたは配列じゃなかったらエラー
		if (!descriptor || typeof descriptor !== 'object') {
			throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null,
					[createItemDescErrorReason(DESC_ERR_DETAIL_NOT_OBJECT)]);
		}

		if (!$.isArray(descriptor)) {
			// 既に同名のモデルが登録済みならそれを返す。
			if (this.models[descriptor.name]) {
				fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, descriptor.name);
				return this.models[descriptor.name];
			}

			//createItemProtoは初めにDescriptorの検証を行う。
			//検証エラーがある場合は例外を送出する。
			//エラーがない場合はデータモデルを返す（登録済みの場合は、すでにマネージャが持っているインスタンスを返す）。
			return _createModel(descriptor, this);
		}

		// descriptorが配列なら、中身を展開して登録。
		// 依存関係順に登録する必要がある。
		// 登録したデータモデルを配列に格納して返す。
		var l = descriptor.length;
		if (!l) {
			//空配列ならエラー
			throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null,
					[createItemDescErrorReason(DESC_ERR_DETAIL_NOT_OBJECT)]);
		}

		var dependMap = {};
		var namesInDescriptors = [];
		// 依存関係のチェック
		// 要素がオブジェクトであり、name、schemaプロパティを持っていない場合はcatch節で、ディスクリプタのエラーを投げる
		for ( var i = 0; i < l; i++) {

			// 既に同名のモデルがあるかどうかチェックし、それらは新規登録しない
			var name = descriptor[i].name;
			if (this.models[name]) {
				fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, descriptor.name);
				retObj[i] = manager.models[descriptor.name];
				continue;
			}

			try {
				namesInDescriptors.push(name);
				var depends = [];
				if (descriptor[i].base) {
					depends.push(descriptor[i].base.substring(1));
				}
				for ( var p in descriptor[i].schema) {
					var propObj = descriptor[i].schema[p];
					if (!propObj) {
						continue;
					}
					var type = propObj.type;
					if (type && type.substring(0, 1) === '@') {
						type = (type.indexOf('[]') === -1) ? type.substring(1) : type.substring(1,
								type.length - 2);
						depends.push(type);
					}
				}
				dependMap[i] = {
					depends: depends
				};
			} catch (e) {
				//descriptorがオブジェクトでない、またはnameとschemaが設定されていない。またはname,baseが文字列でない、schemaがオブジェクトでない
				throwFwError(ERR_CODE_INVALID_DESCRIPTOR);
			}
		}
		// dependMapを元に、循環参照チェック
		var retObj = {
			size: 0
		};
		while (retObj.size < l) {
			// 見つからなかったモデルを覚えておく
			// 循環参照のエラーなのか、単に存在しないモデル名指定によるエラーなのかを区別するため
			var noExistModels = {};

			// このwhileループ内で1つでも登録されたか
			var registed = false;

			// descriptorでループさせて、依存関係が解決された居たらデータモデルを登録
			for ( var i = 0; i < l; i++) {
				if (!dependMap[i].registed) {
					var depends = dependMap[i].depends;
					for ( var j = 0, len = depends.length; j < len; j++) {
						if (!this.models[depends[j]]) {
							noExistModels[depends[j]] = true;
							break;
						}
					}
					if (j === len) {
						// 依存しているものはすべて登録済みなら登録
						retObj[i] = _createModel(descriptor[i], this);
						retObj.size++;
						registed = true;
						dependMap[i].registed = true;
					}
				}
			}
			if (!registed) {
				// whileループの中で一つも登録されなかった場合は、存在しないデータモデル名を依存指定、または循環参照
				// 存在しなかったデータモデル名が全てディスクリプタに渡されたモデル名のいずれかだったら、それは循環参照エラー
				var isCircular = true;
				for ( var modelName in noExistModels) {
					if ($.inArray(modelName, namesInDescriptors) === -1) {
						isCircular = false;
						break;
					}
				}
				if (isCircular) {
					// 循環参照エラー
					throwFwError(ERR_CODE_DESCRIPTOR_CIRCULAR_REF);
				}
				throwFwError(ERR_CODE_INVALID_DESCRIPTOR, null, [createItemDescErrorReason(
						DESC_ERR_DETAIL_NO_EXIST_BASE, modelName)]);
			}
		}
		var retAry = [];
		for ( var i = 0; i < l; i++) {
			retAry.push(retObj[i]);
		}
		return retAry;
	}

	/**
	 * モデルを作成する。
	 * <p>
	 * thisはデータモデルマネージャから呼ばれた場合はそのデータモデルマネージャ。
	 * </p>
	 */
	function _createModel(desc, manager) {
		validateDescriptor(desc, manager, true);
		var schema = extendSchema(desc, manager);
		validateSchema(schema, true, manager, true);
		var itemValueCheckFuncs = createValueCheckFuncsBySchema(schema, true, manager);
		validateDefaultValue(schema, itemValueCheckFuncs, true);

		return new DataModel(schema, desc, itemValueCheckFuncs, manager);
	}

	/**
	 * ObsItem,DataItemの生成に必要なスキーマ情報のキャッシュデータを作成します。
	 *
	 * @param {Object} schema validate済みでかつ継承先の項目も拡張済みのスキーマ
	 * @param {Object} itemValueCheckFuncs プロパティの値をチェックする関数を持つオブジェクト
	 * @param {DataModel} [model] データアイテムが属するモデル。ObservableItemの場合はundefined
	 * @returns {Object} ObsItem,DataItemの生成に必要なスキーマのキャッシュデータ
	 */
	function createSchemaInfoChache(schema, itemValueCheckFuncs, model) {
		// 実プロパティ・依存プロパティ・配列プロパティを列挙
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

		// 依存プロパティのマップ
		var dependencyMap = createDependencyMap(schema);

		function validateItemValue(p, value, isStrict) {
			return itemValueCheckFuncs[p](value, isStrict);
		}


		function createInitialValueObj(userInitialValue) {
			var actualInitialValue = {};
			for ( var plainProp in schema) {
				var propDesc = schema[plainProp];

				if (propDesc && propDesc.depend) {
					//依存プロパティにはデフォルト値はない（最後にrefresh()で計算される）
					continue;
				}

				var initValue = null;

				if (userInitialValue && plainProp in userInitialValue) {
					// 与えられた初期値を代入
					initValue = userInitialValue[plainProp];
				} else if (propDesc && propDesc.defaultValue !== undefined) {
					//DescriptorのdefaultValueがあれば代入
					initValue = propDesc.defaultValue;
				} else {
					//どちらでもない場合はnull
					initValue = null;
				}

				actualInitialValue[plainProp] = initValue;
			}
			return $.extend({}, actualInitialValue, userInitialValue);
		}

		var ret = {
			_realProps: realProps,
			_dependProps: dependProps,
			_aryProps: aryProps,
			_dependencyMap: dependencyMap,
			_createInitialValueObj: createInitialValueObj,
			/**
			 * 引数にプロパティ名と値を指定し、値がそのプロパティの制約条件を満たすかどうかをチェックします。
			 *
			 * @private
			 * @memberOf DataItem
			 * @param {String} prop プロパティ名
			 * @param {Any} value 値
			 * @returns {Boolean} 値がプロパティの制約条件を満たすならtrue
			 */
			_validateItemValue: validateItemValue
		};
		return ret;
	}

	/**
	 * データモデルにおけるスキーマの継承関係を展開してマージしたスキーマを返します。
	 * <p>
	 * 同じ名前のプロパティは「後勝ち」です。継承関係を構築できるのは同一のデータマネージャに属するデータモデル間のみです。
	 * </p>
	 *
	 * @param {Object} desc データモデルの場合はデスクリプタ。
	 * @param {Object} manager データモデルマネージャ。
	 * @returns {Object} 生成したスキーマオブジェクト。
	 */
	function extendSchema(desc, manager) {
		var base = desc.base;
		var baseSchema;

		if (base) {
			// base指定がある場合はそのモデルを取得
			var baseModel = manager.models[base.slice(1)];

			// base指定されたモデルのschemaを取得
			baseSchema = baseModel.schema;
		} else {
			//baseが指定されていない場合は"親"は存在しない＝プロパティを持たない
			baseSchema = {};
		}
		// baseSchemaとschemaをschema優先でマージした結果をschemaに格納する。baseSchemaは上書きしない。
		return $.extend({}, baseSchema, desc.schema);
	}

	/**
	 * DataItem、ObservableItemのが持つObservableArrayのプロパティに対して、リスナを登録します
	 *
	 * @private
	 * @param {DataItem||ObservableItem} item
	 * @param {String} propName プロパティ名
	 * @param {ObservableArray} リスナ登録をするObservableArray
	 * @param {DataModel} [model] モデル(DataItemの場合)
	 */
	function setObservableArrayListeners(item, propName, observableArray, model) {
		// 配列操作前と操作後で使う共通の変数
		// 配列操作が同期のため、必ずchangeBeforeListener→配列操作→changeListenerになるので、ここのクロージャ変数を両関数で共通して使用できる

		// アップデートセッション中かどうか
		var isAlreadyInUpdate = false;

		// 破壊的メソッドだが、追加しないメソッド。validateする必要がない。
		var noAddMethods = ['sort', 'reverse', 'pop', 'shift'];

		// changeBefore時に配列の変更前の値を覚えておく
		var oldValue = null;

		function changeBeforeListener(event) {
			// データモデルの場合、itemがmodelに属していない又は、itemが属しているmodelがmanagerに属していないならエラー
			if (model && (item._isRemoved || !model._manager)) {
				throwFwError(ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM, [item._values[model._idKey],
						event.method]);
			}

			var args = h5.u.obj.argsToArray(event.args);
			if ($.inArray(event.method, noAddMethods) === -1) {
				var isValidateRequired = true;

				// チェックするメソッドは unshift, push, splice, copyFrom, set
				// そのうち、メソッドの引数をそのままチェックすればいいのはunshift, push
				switch (event.method) {
				case 'splice':
					if (args.length <= 2) {
						// spliceに引数が2つなら要素追加はないので、validateチェックはしない
						isValidateRequired = false;
					}
					isValidateRequired = false;
					// spliceの場合追加要素は第3引数以降のため2回shiftする
					args.shift();
					args.shift();
					break;

				case 'copyFrom':
					// copyFromの場合は引数が配列であるため、外側の配列を外す
					args = args[0];
					break;

				case 'set':
					// setの場合は第1引数はindexなので、shift()したものをチェックする
					args.shift();

				}

				if (isValidateRequired) {
					var validateResult = item._validateItemValue(propName, args);
					if (validateResult.length > 0) {
						throwFwError(ERR_CODE_INVALID_ITEM_VALUE, propName, validateResult);
					}
				}
			}
			// データアイテムの場合はイベント管理
			if (model) {
				// oldValueが登録されていなければ登録
				addObsArrayOldValue(model, item, propName);

				// 配列操作前にbeginUpdateして、配列操作後にendUpdateする
				isAlreadyInUpdate = model._manager ? model._manager.isInUpdate() : false;
				if (!isAlreadyInUpdate) {
					model._manager.beginUpdate();
				}
			} else {
				//oldValueを保存
				oldValue = item._values[propName].toArray();
			}
		}

		function changeListener(event) {
			// Itemのset内で呼ばれた、または、method===null(endUpdate時にdispatchEventで呼ばれた場合)なら何もしない
			if (item._isInSet || event.method === null) {
				return;
			}

			// 配列の要素が全て同じかどうかのチェックはendUpdateのなかでやる

			// changeイベントオブジェクトの作成
			var ev = {
				type: 'change',
				target: item,
				props: {}
			};

			// newValueは現在の値、oldValueはmanager._oldValueLogsの中なので、ここでpropsを入れる必要ない
			ev.props[propName] = {};

			// データアイテムの場合はモデルにイベントを伝播
			if (model) {
				// アップデートログを追加
				addUpdateChangeLog(model, ev);

				if (!isAlreadyInUpdate) {
					// アップデートセッション中じゃなければすぐにendUpdate()
					// ただし、引数を指定してendUpdate()時にdispatchされてしまうのを防ぐ
					model._manager.endUpdate({
						_dispatchObservableArrayChange: false
					});
				} else {
					// アップデートセッション中であればendUpdate()が呼ばれたときに、endUpdate()がchangeを発火させるので、
					// ObservableArrayのchangeをここでストップする。
					event.stopImmediatePropagation();
				}
			} else {
				// ObservableItemの場合は、配列の値が変更されていたら即イベント発火する
				// 配列の値が変化していないなら何もしない
				if (observableArray.equals(oldValue)) {
					return;
				}

				// ObservableItemの場合は即発火
				ev.props[propName] = {
					oldValue: oldValue,
					newValue: getValue(item, propName)
				};
				item.dispatchEvent(ev);
			}
		}

		observableArray.addEventListener('changeBefore', changeBeforeListener);
		observableArray.addEventListener('change', changeListener);
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	//-------------------------------------------
	// EventDispatcher
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
	function EventDispatcher() {
	// 空コンストラクタ
	}

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

		var isImmediatePropagationStopped = false;
		event.stopImmediatePropagation = function() {
			isImmediatePropagationStopped = true;
		};

		// リスナーを実行。stopImmediatePropagationが呼ばれていたらそこでループを終了する。
		for ( var i = 0, count = l.length; i < count && !isImmediatePropagationStopped; i++) {
			l[i].call(event.target, event);
		}

		return isDefaultPrevented;
	};

	//--------------------------------------------
	// DataModelManager
	//--------------------------------------------

	/**
	 * データモデルマネージャ
	 * <p>
	 * データモデルを管理するデータモデルマネージャクラスです。このインスタンスは<a
	 * href="h5.core.data.html#createManager">h5.core.data.createManager()</a>で作成します。
	 * </p>
	 * <p>
	 * このクラスは<a href="EventDispatcher.html">EventDispatcherクラス</a>のメソッドを持ちます。イベント関連のメソッドについては<a
	 * href="EventDispatcher.html">EventDispatcherクラス</a>を参照してください。<br>
	 * データモデルマネージャは、データモデルマネージャが管理するデータモデルに変更があった場合に'itemsChange'イベントが発火します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @extends EventDispatcher
	 * @name DataModelManager
	 */
	function DataModelManager(managerName) {
		if (!isValidNamespaceIdentifier(managerName)) {
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}

		/**
		 * このデータモデルマネージャが管理するDataModelインスタンス。
		 * <p>
		 * <a href="#createModel">createmodel()</a>で作成したモデルは、データモデルマネージャの管理下に置かれ、modelsから参照できます。
		 * </p>
		 * <p>
		 * {モデル名: データモデルインスタンス, ...} の構造を持つオブジェクトです。
		 * </p>
		 *
		 * @since 1.1.0
		 * @name models
		 * @type {Object}
		 * @memberOf DataModelManager
		 */
		this.models = {};

		/**
		 * データモデルマネージャ名
		 * <p>
		 * <a href="h5.core.data.html#createManager">h5.core.data.createManager()</a>の第一引数に指定した値が格納されます。
		 * </p>
		 *
		 * @since 1.1.0
		 * @name name
		 * @type {String}
		 * @memberOf DataModelManager
		 */
		this.name = managerName;


		/**
		 * アップデートログ
		 * <p>
		 * マネージャの管理下にあるデータモデル、アイテムのイベントをストアしておくためのオブジェクトです。内部で使用します。
		 * </p>
		 *
		 * @private
		 * @since 1.1.0
		 * @name _updateLogs
		 * @type {Object}
		 * @memberOf DataModelManager
		 */
		this._updateLogs = null;
	}
	DataModelManager.prototype = new EventDispatcher();
	$.extend(DataModelManager.prototype, {
		/**
		 * データモデルを作成します。
		 * <p>
		 * 引数にはデータモデルディスクリプタを渡します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @param {Object} descriptor データモデルディスクリプタ
		 * @param {String} descriptor.name データモデル名。必須。
		 * @param {String} descriptor.base
		 *            マネージャに属する別のデータモデルのschemaを継承する場合に指定します。『'@'+継承先データモデル名』で指定してください。
		 * @param {Object} descriptor.schema スキーマを定義したオブジェクトを指定します。必須。
		 * @memberOf DataModelManager
		 */
		createModel: createModel,

		/**
		 * 指定されたデータモデルを削除します。
		 * <p>
		 * データアイテムを保持している場合、アイテムをこのデータモデルからすべて削除した後 データモデル自体をマネージャから削除します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @param {String|DataModel} nameOrModel データモデル名またはデータモデルインスタンス
		 * @memberOf DataModelManager
		 */
		dropModel: function(nameOrModel) {
			//TODO dropModelするときに依存していたらどうするか？
			//エラーにしてしまうか。
			var name = isString(nameOrModel) ? nameOrModel
					: (typeof nameOrModel === 'object' ? nameOrModel.name : null);

			if (!name || !this.models[name]) {
				return;
			}
			var model = this.models[name];
			model._manager = null;
			delete this.models[name];
			return model;
		},

		/**
		 * アップデートセッション中かどうかを返します。
		 * <p>
		 * beginUpdate()が呼ばれてからendUpdate()が呼ばれるまでの間はアップデートセッション中です。
		 * </p>
		 *
		 * @since 1.1.0
		 * @returns {Boolean} アップデートセッション中かどうか
		 * @memberOf DataModelManager
		 */
		isInUpdate: function() {
			return this._updateLogs !== null;
		},

		/**
		 * アップデートセッションを開始します。
		 * <p>
		 * beginUpdate()が呼ばれると、アップデートセッションを開始します。<a href="#endUpdate">endUpdate()</a>を呼ぶとアップデートセッションを解除します。
		 * </p>
		 * <p>
		 * 既にアップデートセッション中であれば何もしません。
		 * </p>
		 * <p>
		 * アップデートセッション中は、このDataModelManager、及びこのの管理下にあるDataModel、DataItemのイベントは発火しません。
		 * endUpdate()が呼ばれた時点で、イベントが発火します。
		 * </p>
		 * <p>
		 * アップデートセッション中の変更イベントはすべてマージされてendUpdate()時に発火します。
		 * </p>
		 *
		 * <pre>
		 * 例：
		 * // managerの管理下にあるDataItem
		 * item.set('value', 'a');
		 * item.addEventListener('change', function(e){
		 *     // oldValueとnewValueをalertで表示するイベントリスナ
		 *     alert('oldValue:' + e.prop.value.oldValue + ', newValue:' + e.prop.value.newValue);
		 * });
		 * // アップデートセッション
		 * manager.beginUpdate();
		 * item.set('value', 'b');
		 * item.set('value', 'c');
		 * manager.endUpdate();
		 * // &quot;oldValue: a, newValue: c&quot; とアラートが出る
		 * </pre>
		 *
		 * @since 1.1.0
		 * @returns {Boolean} アップデートセッション中かどうか
		 * @memberOf DataModelManager
		 */
		beginUpdate: function() {
			if (this.isInUpdate()) {
				return;
			}

			this._updateLogs = {};
		},

		/**
		 * アップデートセッションを終了します。
		 * <p>
		 * アップデートセッション中でなければ何もしません。イベントの発火など詳細は<a href="#beginUpdate">beginUpdate()</a>の説明を参照してください。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModelManager
		 */
		/**
		 * @private
		 * @param {Boolean} [_opt._dispatchObservableArrayChange=true]
		 *            マネージャ下に属しているObservableArrayのchangeイベントをdispatchするかどうか
		 */
		endUpdate: function(_opt) {
			if (!this.isInUpdate()) {
				return;
			}
			var dispatchObsAryChange = _opt ? _opt._dispatchObservableArrayChange !== false : true;

			var updateLogs = this._updateLogs;
			var oldValueLogs = this._oldValueLogs;
			//_updateLog, _oldValueLogsをまず削除する。イベントハンドラ内で、値を変更された時に_updateLogをきちんと残せるようにするため。
			this._updateLogs = null;
			this._oldValueLogs = null;

			function getFirstCRLog(itemLogs, lastPos) {
				for ( var i = 0; i < lastPos; i++) {
					var type = itemLogs[i].type;
					if ((type === UPDATE_LOG_TYPE_CREATE || type === UPDATE_LOG_TYPE_REMOVE)) {
						return itemLogs[i];
					}
				}
				return null;
			}


			/**
			 * 内部でDataItemごとのイベントを発火させます。 変更が1つでもあればモデルイベントオブジェクト(のひな形)を返しますが、変更がない場合はfalseを返します
			 */
			function createDataModelChanges(model, modelUpdateLogs) {
				var recreated = [];
				var created = [];
				var changed = [];
				var removed = [];

				for ( var itemId in modelUpdateLogs) {
					var itemLogs = modelUpdateLogs[itemId];
					var isChangeOnly = true;

					var changeEventStack = [];

					//新しい変更が後ろに入っているので、降順で履歴をチェックする
					for ( var i = itemLogs.length - 1; i >= 0; i--) {
						var log = itemLogs[i]; //あるitemについてのログ
						var logType = log.type; //当該ログの種類

						if (logType === UPDATE_LOG_TYPE_CHANGE) {
							changeEventStack.push(log.ev);
						} else {
							//あるアイテムについての今回の変更のうち、最初に存在するCREATEまたはREMOVEのログ
							//(従って、changeのみの場合存在しない場合もある)
							var firstCRLog = getFirstCRLog(itemLogs, i);

							if (logType === UPDATE_LOG_TYPE_CREATE) {
								//begin->remove->create->end のような操作が行われた場合、
								//begin-endの前後でアイテムのインスタンスが変わってしまう。
								//これをイベントで判別可能にするため、remove->createだった場合はcreatedではなくrecreatedに入れる。
								//なお、begin->remove->create->remove->create->endのような場合、
								//途中のcreate->removeは（begin-endの外から見ると）無視してよいので、
								//oldItemには「最初のremoveのときのインスタンス」、newItemには「最後のcreateのときのインスタンス」が入る。
								//また、begin->create->remove->create->endの場合は、begin-endの外から見ると"create"扱いにすればよい。

								//なお、createイベントはDataItemからは発火しない。(createはdependプロパティ内でのみ起こる)

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

								var removedItem;

								if (firstCRLog && firstCRLog.type === UPDATE_LOG_TYPE_REMOVE) {
									//begin->remove->create->remove->endの場合、begin-endの外から見ると
									//「最初のremoveで取り除かれた」という扱いにすればよい。
									removedItem = firstCRLog.item;
								} else if (!firstCRLog) {
									//createまたはremoveのログが最後のremoveより前にない
									//＝beginより前からアイテムが存在し、始めてremoveされた
									//＝通常のremoveとして扱う
									removedItem = log.item;
								} else {
									//begin->create-> ( remove->create-> ) remove -> end つまり
									//beginより前にアイテムがなく、セッション中に作られたが最終的には
									//またremoveされた場合、begin-endの外から見ると「何もなかった」と扱えばよい。
									removedItem = null;
								}

								if (removedItem) {
									removed.push(removedItem);

									var removeEvent = {
										type: 'remove',
										model: model
									};
									removedItem.dispatchEvent(removeEvent);
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
						//changeEventStackはより「古い」イベントが「後ろ」に入っている。
						for ( var i = changeEventStack.length - 1; i >= 0; i--) {
							for ( var p in changeEventStack[i].props) {
								if (!mergedProps[p]) {
									// oldValueのセット
									// type:[]ならmanager._oldValueLogsから持ってくる
									if (isObservableArray(model.get(itemId).get(p))) {
										var oldValue = oldValueLogs && oldValueLogs[model.name]
												&& oldValueLogs[model.name][itemId]
												&& oldValueLogs[model.name][itemId][p];
										if (!model.get(itemId).get(p).equals(oldValue)) {
											//プロパティがObservableArrayの場合、equalsの結果がfalseの場合のみ
											//mergedPropsにセットする。つまり、equalsがtrueの場合は「変更がなかった」ことになる。
											mergedProps[p] = {
												oldValue: oldValue
											};
										}
									} else {
										mergedProps[p] = {
											oldValue: changeEventStack[i].props[p].oldValue
										};
									}
								}
							}
						}
						// 今のアイテムがoldValueと違う値を持っていたらmergedPropsにnewValueをセット
						// 最終的に値が変わっているかどうかも同時にチェックする
						//oldValueは配列ならmanager._oldValueLogsにある
						var changedProps = false;
						for ( var p in mergedProps) {
							var oldValue = mergedProps[p].oldValue;
							var currentValue = model.get(itemId).get(p);
							if (oldValue === currentValue
									|| isBothStrictNaN(oldValue, currentValue)) {
								delete mergedProps[p];
							} else {
								var newValue = model.get(itemId).get(p);
								if (dispatchObsAryChange && isObservableArray(newValue)) {
									// ObservableArrayのイベントを上げる
									newValue.dispatchEvent({
										type: 'change',
										method: null,
										args: null,
										returnValue: null
									});
								}
								mergedProps[p].newValue = newValue;
								changedProps = true;
							}
						}
						if (changedProps) {
							var mergedChange = {
								type: 'change',
								target: changeEventStack[0].target,
								props: mergedProps
							};

							changed.push(mergedChange);

							mergedChange.target.dispatchEvent(mergedChange);
						}
					}
				}

				// 何も変更がなかった場合は、falseを返す
				if (created.length === 0 && recreated.length === 0 && removed.length === 0
						&& changed.length === 0) {
					return false;
				}
				return {
					created: created,
					recreated: recreated,
					removed: removed,
					changed: changed
				};
			}

			//endUpdateの処理フローここから

			var modelChanges = {};
			for ( var modelName in updateLogs) {
				if (!updateLogs.hasOwnProperty(modelName)) {
					continue;
				}
				var mc = createDataModelChanges(this.models[modelName], updateLogs[modelName]);
				if (mc) {
					modelChanges[modelName] = mc;
				}
			}

			//高速化のため、createDataModelChanges()の中で各DataItemからのイベントを発火させている

			//各DataModelからイベントを発火。
			//全てのモデルの変更が完了してから各モデルの変更イベントを出すため、同じループをもう一度行う
			var modelChanged = false;
			for ( var modelName in modelChanges) {
				modelChanged = true;
				var mc = modelChanges[modelName];
				this.models[modelName].dispatchEvent(createDataModelItemsChangeEvent(mc.created,
						mc.recreated, mc.removed, mc.changed));
			}

			var event = {
				type: EVENT_ITEMS_CHANGE,
				models: modelChanges
			};

			//最後に、マネージャから全ての変更イベントをあげる。変更がない場合は何もしない
			if (modelChanged) {
				this.dispatchEvent(event);
			}
		},

		_dataModelItemsChangeListener: function(event) {
			var manager = event.target.manager;

			var modelsChange = {};
			modelsChange[event.target.name] = event;

			var managerEvent = {
				type: EVENT_ITEMS_CHANGE,
				models: modelsChange
			};

			manager.dispatchEvent(managerEvent);
		}
	});

	/**
	 * 採番を行う<a href="Sequence.html">Sequence</a>インスタンスを作成します。
	 * <p>
	 * 自動でデータアイテムのナンバリングを行いたい場合などに使用します。
	 * </p>
	 * <p>
	 * 第一引数に開始番号(デフォルト1)、第二引数にステップ数(デフォルト1)、を指定します。
	 * </p>
	 * <p>
	 * 第三引数には戻り値の型を指定します。デフォルトはSEQ_INT（数値型）です。
	 * <ul>
	 * <li><a href="#SEQ_STRING">h5.core.data.SEQ_STRING</a>
	 * <li><a href="#SEQ_INT">h5.core.data.SEQ_INT</a>
	 * </ul>
	 * のいずれかを指定可能です。 SEQ_STRINGを指定した場合、<a href="Sequence.html#current">current()</a>や<a
	 * href="Sequence.html#next">next()</a> を呼ぶと、"1", "123"のような数字文字列が返ります。SEQ_INTの場合は数値が返ります。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @param {Number} [start=1] 開始番号
	 * @param {Number} [step=1] ステップ数
	 * @param {Integer} [returnType=2] 戻り値の型(デフォルト number)
	 */
	function createSequence(start, step, returnType) {
		// start,stepをdefault値で、returnTypeだけ指定したい場合、createSequence(null,null,returnType)で呼べるように、==nullで比較している
		var current = start != null ? start : 1;
		var theStep = step != null ? step : 1;

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
		if (returnType === SEQ_STRING) {
			methods = {
				current: currentString,
				next: nextString,
				returnType: SEQ_STRING
			};
		} else {
			methods = {
				current: currentInt,
				next: nextInt,
				returnType: SEQ_INT
			};
		}
		methods.setCurrent = function(value) {
			current = value;
		};

		/**
		 * 採番を行うためのクラス。
		 * <p>
		 * 自動でデータアイテムのナンバリングを行いたい場合などに使用します。このクラスは<a
		 * href="h5.core.data.html#createSequence">h5.core.data.createSequence()</a>で作成します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @class Sequence
		 */
		function Sequence() {
		// 空コンストラクタ
		}
		$.extend(Sequence.prototype, methods);

		return new Sequence();
	}

	//--------------------------------------------
	// DataModel
	//--------------------------------------------
	/**
	 * データモデル。 このクラスは直接newすることはできません。
	 * <p>
	 * <a href="DataModelManager.html#createModel">DataModelManager#createModel()</a>を呼ぶと、DataModelクラスを生成して返します。
	 * </p>
	 * <p>
	 * このクラスは<a href="EventDispatcher.html">EventDispatcherクラス</a>のメソッドを持ちます。イベント関連のメソッドについては<a
	 * href="EventDispatcher.html">EventDispatcherクラス</a>を参照してください。<br>
	 * データモデルは、データモデルが管理するデータアイテムに変更があった場合に'itemsChange'イベントが発火します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @extends EventDispatcher
	 * @name DataModel
	 */
	/**
	 * @private
	 * @param {Object} schema チェック済みかつextendSchema済みのschema
	 * @param {Object} descriptor チェック済み
	 * @param {Object} itemValueCheckFuncs 値のチェック関数
	 * @param {DataModelManager} manager
	 */
	function DataModel(schema, descriptor, itemValueCheckFuncs, manager) {

		/**
		 * データモデルが持つデータアイテムを持つオブジェクト。
		 * <p>
		 * データアイテムのidをキー、データアイテムインスタンスを値、として保持します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @type Object
		 * @name items
		 */
		this.items = {};

		/**
		 * データモデルが持つデータアイテムの数
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @type Integer
		 * @name size
		 */
		this.size = 0;

		/**
		 * データモデル名
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @type String
		 * @name name
		 */
		this.name = descriptor.name;

		/**
		 * このデータモデルが属しているデータマネージャインスタンス。<br>
		 *
		 * @private
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @type Object
		 * @name _manager
		 */
		this._manager = manager;

		//TODO sequence対応は後日
		//this.idSequence = 0;

		// idプロパティの設定
		// スキーマはチェック済みなのでid指定されているプロパティは必ず一つだけある。
		for ( var p in schema) {
			if (schema[p] && schema[p].id) {
				this._idKey = p;
			}
		}
		var schemaIdType = schema[this._idKey].type;
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
		 * 継承関係計算済みのスキーマ
		 *
		 * @name schema
		 * @since 1.1.0
		 * @type {Object}
		 * @memberOf DataModel
		 */
		this.schema = schema;

		/**
		 * このデータモデルに対応するデータアイテムのコンストラクタ関数
		 *
		 * @private
		 * @since 1.1.0
		 * @type function
		 * @memberOf DataModel
		 */
		this._itemConstructor = createDataItemConstructor(schema, itemValueCheckFuncs, this);

		// manager.modelsに自身を登録
		manager.models[this.name] = this;
	}

	//EventDispatcherの機能を持たせるため、prototypeをコピーし、そのうえでDataModel独自のプロパティを追加する
	$.extend(DataModel.prototype, EventDispatcher.prototype, {
		/**
		 * 指定されたIDと初期値がセットされたデータアイテムを生成します。
		 * <p>
		 * データアイテムはこのデータモデルに紐づけられた状態になっています。
		 * </p>
		 * <p>
		 * 指定されたIDのデータアイテムがすでにこのデータモデルに存在した場合は、 既に存在するデータアイテムを返します（新しいインスタンスは生成されません）。
		 * </p>
		 * <p>
		 * 従って、1つのデータモデルは、1IDにつき必ず1つのインスタンスだけを保持します。
		 * なお、ここでIDの他に初期値も渡された場合は、既存のインスタンスに初期値をセットしてから返します。
		 * このとき、当該インスタンスにイベントハンドラが設定されていれば、changeイベントが（通常の値更新と同様に）発生します。
		 * </p>
		 * <p>
		 * 引数にはディスクリプタオブジェクトまたはその配列を指定します。ディスクリプタオブジェクトについては<a
		 * href="/conts/web/view/tutorial-data-model/descriptor">チュートリアル(データモデル編)&gt;&gt;ディスクリプタの書き方</a>をご覧ください。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {Object|Object[]} objOrArray ディスクリプタオブジェクト、またはその配列
		 * @returns {DataItem|DataItem[]} データアイテム、またはその配列
		 */
		create: function(objOrArray) {
			// modelがmanagerを持たない(dropModelされた)ならエラー
			if (!this._manager) {
				throwFwError(ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL, [this.name, 'create']);
			}
			var error = this.validate(objOrArray, true);
			if (error) {
				throw error;
			}

			//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
			//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
			//入っていない場合は一時的にセッションを作成する。
			var isAlreadyInUpdate = this._manager ? this._manager.isInUpdate() : false;

			if (!isAlreadyInUpdate) {
				this._manager.beginUpdate();
			}
			var actualNewItems = [];
			var items = wrapInArray(objOrArray);
			var ret = [];
			var idKey = this._idKey;
			for ( var i = 0, len = items.length; i < len; i++) {
				var valueObj = items[i];
				var itemId = valueObj[idKey];

				var storedItem = this._findById(itemId);
				if (storedItem) {
					//返す値にstoredItemを追加
					ret.push(storedItem);

					// 既に存在するオブジェクトの場合は値を更新。ただし、valueObjのIDフィールドは無視（上書きなので問題はない）
					var event = itemSetter(storedItem, valueObj, [idKey]);
					if (!event) {
						//itemSetterが何も返さなかった = 更新する値が何もない
						continue;
					}

					addUpdateChangeLog(this, event);
				} else {
					var newItem = new this._itemConstructor(valueObj);

					this.items[itemId] = newItem;
					this.size++;

					actualNewItems.push(newItem);
					ret.push(newItem);
				}
			}

			if (actualNewItems.length > 0) {
				addUpdateLog(this, UPDATE_LOG_TYPE_CREATE, actualNewItems);
			}

			if (!isAlreadyInUpdate) {
				//既存のアイテムが変更されていればアイテムのイベントを上げる
				this._manager.endUpdate();
			}

			if ($.isArray(objOrArray)) {
				return ret;
			}
			return ret[0];
		},

		/**
		 * このモデルのスキーマに違反しないかどうかオブジェクトをチェックします。
		 * <p>
		 * 第一引数にはチェックしたいオブジェクト、またはチェックしたいオブジェクトの配列を渡してください。
		 * </p>
		 * <p>
		 * 例：
		 *
		 * <pre>
		 * dataModel.validate({
		 * 	prop1: 5,
		 * 	prop2: 'abc'
		 * });
		 * </pre>
		 *
		 * </p>
		 * <p>
		 * チェックが通らなかった場合は例外オブジェクト、チェックが通った場合はnullを返します
		 * </p>
		 * <p>
		 * 第二引数にtrueを指定した場合は、create()時相当のバリデーションを行います。create()時相当のバリデーションではid指定があるかどうかのチェックがあり、
		 * 引数に未指定のプロパティがあれば初期値の設定をしてからバリデーションを行います。デフォルトはfalseで、set()時相当のスキーマチェックのみを行います。
		 * </p>
		 * <p>
		 * id項目へのセット、depend項目へのセットのチェック及び、depend項目の計算結果のチェック(depend.calcの実行)は行いません。
		 * id項目、depend項目はセットできるかどうかは、セット時のデータアイテムの値に依存するため、validate時にはチェックしません。
		 * depend.calcはその時のデータアイテムに依存したり、副作用のある関数が指定されている場合を考慮し、validate時には実行しません。
		 * </p>
		 *
		 * @since 1.1.9
		 * @memberOf DataModel
		 * @param {Object|Object[]} arg チェックしたいオブジェクトまたはオブジェクトの配列
		 * @param {Boolean} [asCreate=false] create()時相当のバリデーションを行うかどうか
		 */
		validate: function(arg, asCreate) {
			try {
				var idKey = this._idKey;
				var items = wrapInArray(arg);
				// objctでもArrayでもなかったらエラー
				if (typeof arg !== 'object' && !$.isArray(arg)) {
					throwFwError(ERR_CODE_INVALID_CREATE_ARGS);
				}
				if (asCreate) {
					for ( var i = 0, len = items.length; i < len; i++) {
						var valueObj = items[i];
						var itemId = valueObj[idKey];
						//idが空文字、null、undefined、はid指定エラー
						if (itemId === '' || itemId == null) {
							throwFwError(ERR_CODE_NO_ID, [this.name, idKey]);
						}

						// validateする
						// 新規作成時のチェックなら初期値をセットしてからチェックを実行
						obj = this._schemaInfo._createInitialValueObj(valueObj);
						validateValueObj(this.schema, this._schemaInfo._validateItemValue, obj,
								this);
					}
				} else {
					for ( var i = 0, l = items.length; i < l; i++) {
						var valueObj = items[i];
						validateValueObj(this.schema, this._schemaInfo._validateItemValue,
								valueObj, this);
					}
				}
			} catch (e) {
				return e;
			}
			return null;
		},

		/**
		 * 指定されたIDのデータアイテムを返します。
		 * <p>
		 * 当該IDを持つアイテムをこのデータモデルが保持していない場合はnullを返します。 引数にIDの配列を渡した場合に一部のIDのデータアイテムが存在しなかった場合、
		 * 戻り値の配列の対応位置にnullが入ります。
		 * </p>
		 * <p>
		 * （例：get(['id1', 'id2', 'id3']) でid2のアイテムがない場合、戻り値は [item1, null, item3] のようになる ）
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {String|String[]} idOrArray ID、またはその配列
		 * @returns {DataItem|DataItem[]} データアイテム、またはその配列
		 */
		get: function(idOrArray) {
			if ($.isArray(idOrArray) || h5.core.data.isObservableArray(idOrArray)) {
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
		 * 指定されたIDのデータアイテムをこのデータモデルから削除します。
		 * <p>
		 * 当該IDを持つアイテムをこのデータモデルが保持していない場合はnullを返します。 引数にIDの配列を渡した場合に一部のIDのデータアイテムが存在しなかった場合、
		 * 戻り値の配列の対応位置にnullが入ります。 （例：remove(['id1', 'id2', 'id3']) でid2のアイテムがない場合、 戻り値は [item1,
		 * null, item3]のようになります。） 引数にID(文字列)またはデータアイテム以外を渡した場合はnullを返します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {String|DataItem|String[]|DataItem[]} objOrItemIdOrArray 削除するデータアイテム
		 * @returns {DataItem|DataItem[]} 削除したデータアイテム
		 */
		remove: function(objOrItemIdOrArray) {
			// modelがmanagerを持たない(dropModelされた)ならエラー
			if (!this._manager) {
				throwFwError(ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL, [this.name, 'remove']);
			}

			//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
			//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
			//入っていない場合は一時的にセッションを作成する。
			var isAlreadyInUpdate = this._manager ? this._manager.isInUpdate() : false;
			if (!isAlreadyInUpdate) {
				this._manager.beginUpdate();
			}

			var idKey = this._idKey;
			var ids = wrapInArray(objOrItemIdOrArray);

			var actualRemovedItems = [];
			var ret = [];

			for ( var i = 0, len = ids.length; i < len; i++) {
				if (!this.has(ids[i])) {
					//指定されたアイテムが存在しない場合はnull
					ret.push(null);
					continue;
				}

				var id = (isString(ids[i]) || isIntegerValue(ids[i], true)) ? ids[i]
						: ids[i]._values[idKey];

				var item = this.items[id];

				delete this.items[id];

				this.size--;

				ret.push(item);
				if (item._model) {
					// 削除されたフラグを立てる
					item._isRemoved = true;
				}
				actualRemovedItems.push(item);
			}

			if (actualRemovedItems.length > 0) {
				addUpdateLog(this, UPDATE_LOG_TYPE_REMOVE, actualRemovedItems);
			}

			if (!isAlreadyInUpdate) {
				this._manager.endUpdate();
			}

			if ($.isArray(objOrItemIdOrArray)) {
				return ret;
			}
			return ret[0];
		},

		/**
		 * 保持しているすべてのデータアイテムを削除します。
		 *
		 * @since 1.1.3
		 * @memberOf DataModel
		 * @returns {DataItem[]} 削除されたデータアイテム。順序は不定です。
		 */
		removeAll: function() {
			var items = this.toArray();
			if (items.length > 0) {
				this.remove(items);
			}
			return items;
		},

		/**
		 * 指定されたデータアイテムを保持しているかどうかを返します。
		 * <p>
		 * 文字列または整数値が渡された場合はIDとみなし、 オブジェクトが渡された場合はデータアイテムとみなします。
		 * オブジェクトが渡された場合、自分が保持しているデータアイテムインスタンスかどうかをチェックします。
		 * </p>
		 * <p>
		 * 従って、同じ構造を持つ別のインスタンスを引数に渡した場合はfalseが返ります。
		 * データアイテムインスタンスを引数に渡した場合に限り（そのインスタンスをこのデータモデルが保持していれば）trueが返ります。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {String|Object} idOrObj ID文字列またはデータアイテムオブジェクト
		 * @returns {Boolean} 指定されたIDのデータアイテムをこのデータモデルが保持しているかどうか
		 */
		has: function(idOrObj) {
			if (isString(idOrObj) || isIntegerValue(idOrObj, true)) {
				return !!this._findById(idOrObj);
			} else if (typeof idOrObj === 'object') {
				//型の厳密性はitemsとの厳密等価比較によってチェックできるので、if文ではtypeofで充分
				return idOrObj != null && $.isFunction(idOrObj.get)
						&& idOrObj === this.items[idOrObj.get(this._idKey)];
			} else {
				return false;
			}
		},

		/**
		 * このモデルが属しているマネージャを返します。
		 * <p>
		 * dropModelされたモデルの場合はnullを返します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @returns {DataManager} このモデルが属しているマネージャ
		 */
		getManager: function() {
			return this._manager;
		},

		/**
		 * 指定されたIDのデータアイテムを返します。 アイテムがない場合はnullを返します。
		 *
		 * @private
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {String} id データアイテムのID
		 * @returns {DataItem} データアイテム、存在しない場合はnull
		 */
		_findById: function(id) {
			var item = this.items[id];
			return item === undefined ? null : item;
		},

		/**
		 * 引数で指定されたchangeイベントに基づいて、itemsChangeイベントを即座に発火させます。
		 *
		 * @private
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @param {Object} event DataItemのchangeイベント
		 */
		_dispatchItemsChangeEvent: function(event) {
			var modelEvent = createDataModelItemsChangeEvent([], [], [], [event]);
			this.dispatchEvent(modelEvent);

			// managerがあれば(dropされたモデルでなければ)managerのイベントを発火
			if (this._manager) {
				modelEvent.target = this;
				this._manager._dataModelItemsChangeListener(modelEvent);
			}
		},

		/**
		 * データモデルが持つデータアイテムを配列に詰めて返します。 配列中のデータアイテムの順番は不定です。
		 *
		 * @since 1.1.0
		 * @memberOf DataModel
		 * @returns {Array} モデルが持つデータアイテムが格納された配列
		 */
		toArray: function() {
			var ret = [];
			var items = this.items;
			for ( var id in items) {
				if (items.hasOwnProperty(id)) {
					ret.push(items[id]);
				}
			}
			return ret;
		}
	});

	//------------------------------------------
	// DataItem
	//------------------------------------------

	/**
	 * propで指定されたプロパティのプロパティソース(データアイテムのコンストラクタ)を作成します。
	 *
	 * @private
	 * @param {Object} schemaInfo チェック済みスキーマ
	 * @param {Object} itemValuCheckFuncs 値チェック関数を持つオブジェクト。
	 * @param {DataModel} [model] データモデルオブジェクト
	 */
	function createDataItemConstructor(schema, itemValueCheckFuncs, model) {
		// スキーマ情報の作成。アイテムのプロトタイプとモデルに持たせる。
		var schemaInfo = createSchemaInfoChache(schema, itemValueCheckFuncs, model);
		model._schemaInfo = schemaInfo;

		/**
		 * データアイテムクラス
		 * <p>
		 * データアイテムは<a href="DataModel.html#create">DataModel#create()</a>で作成します。
		 * </p>
		 * <p>
		 * このクラスは<a href="EventDispatcher.html">EventDispatcherクラス</a>のメソッドを持ちます。イベント関連のメソッドについては<a
		 * href="EventDispatcher.html">EventDispatcherクラス</a>を参照してください。<br>
		 * データアイテムは、アイテムが持つ値に変更があった場合に'change'イベントが発火します。
		 * </p>
		 *
		 * @since 1.1.0
		 * @class
		 * @extends EventDispatcher
		 * @name DataItem
		 */
		/**
		 * @private
		 * @param {Object} userInitialValue ユーザー指定の初期値
		 */
		function DataItem(userInitialValue) {
			itemSetup(this, schema, schemaInfo, userInitialValue);

			// 初期値の設定
			var actualInitialValue = schemaInfo._createInitialValueObj(userInitialValue);
			validateValueObj(schema, schemaInfo._validateItemValue, actualInitialValue, model);
			itemSetter(this, actualInitialValue, null, true);

			// arrayPropsの設定
			var arrayProps = schemaInfo._aryProps;

			// ObservableArrayのイベントリスナの設定を行う
			for ( var i = 0, l = arrayProps.length; i < l; i++) {
				setObservableArrayListeners(this, arrayProps[i], this.get(arrayProps[i]), model);
			}
		}

		// EventDispatcherと、schemaInfoもprototypeに追加
		$.extend(DataItem.prototype, EventDispatcher.prototype, schemaInfo, itemProto);
		$.extend(DataItem.prototype, {

			/**
			 * データアイテムが属しているデータモデル
			 * <p>
			 * データモデルからデータアイテムが削除された場合、このプロパティはnullになる
			 * </p>
			 *
			 * @private
			 * @since 1.1.0
			 * @memberOf DataItem
			 */
			_model: model,

			/**
			 * データアイテムがモデルからremoveされたかどうか
			 *
			 * @private
			 * @memberOf DataItem
			 */
			_isRemoved: false,

			/**
			 * DataItemが属しているDataModelインスタンスを返します。
			 * <p>
			 * このメソッドは、DataModelから作成したDataItemのみが持ちます。createObservableItemで作成したアイテムにはこのメソッドはありません。
			 * DataModelに属していないDataItem(removeされたDataItem)から呼ばれた場合はnullを返します。
			 * </p>
			 *
			 * @since 1.1.0
			 * @memberOf DataItem
			 * @returns {DataModel} 自分が所属するデータモデル
			 */
			getModel: function() {
				return this._isRemoved ? null : this._model;
			}
		});
		return DataItem;
	}

	// ------------------------
	// ObservableItem
	// ------------------------
	/**
	 * オブザーバブルアイテムクラス
	 * <p>
	 * オブザーバブルアイテムは<a
	 * href="h5.core.data.html#createObservableItem">h5.core.data.html#createObservableItem</a>で作成します。
	 * </p>
	 * <p>
	 * このクラスは<a href="DataItem.html">DataItemクラス</a>のメソッドを持ちます。
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @extends EventDispatcher
	 * @name ObservableItem
	 */
	function ObservableItem(item) {
	// 空コンストラクタ
	}
	$.extend(ObservableItem.prototype, EventDispatcher.prototype, itemProto, {
		/**
		 * ObservableItemのスキーマに違反しないかどうか引数をチェックします。
		 * <p>
		 * チェックが通らなかった場合は例外オブジェクト、チェックが通った場合はnullを返します
		 * </p>
		 * <p>
		 * このメソッドはh5.core.data.createObservableItem()で作成したObservableItemのみが持ちます。DataModelから作成したDataItemにはこのメソッドはありません。
		 * DataModelから作成したDataItemの値チェックは、<a href="DataModel.html#validate">DataModel#validate</a>を使用してください。
		 * </p>
		 *
		 * @since 1.1.9
		 * @memberOf ObservableItem
		 * @param {Any} var_args 複数のキー・値のペアからなるオブジェクト、または1組の(キー, 値)を2つの引数で取ります。
		 */
		validate: function(var_args) {
			try {
				//引数はオブジェクト1つ、または(key, value)で呼び出せる
				var valueObj = var_args;
				if (arguments.length === 2) {
					valueObj = {};
					valueObj[arguments[0]] = arguments[1];
				}
				validateValueObj(this.schema, this._validateItemValue, valueObj);
			} catch (e) {
				return e;
			}
			return null;
		}
	});

	/**
	 * ObservableItemを作成します。
	 * <p>
	 * ObservableItemは、データモデルに属さない<a href="DataItem.html"/>DataItem</a>です。DataItemと同様にEventDispatcherクラスのメソッドを持ちます。
	 * </p>
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
		// 値チェックに必要な情報を取得してitemに持たせる
		validateSchema(schema, false, null, true);
		var itemValueCheckFuncs = createValueCheckFuncsBySchema(schema);
		validateDefaultValue(schema, itemValueCheckFuncs, true);

		var obsItem = new ObservableItem();

		// スキーマ情報の作成。アイテムに持たせる。
		var schemaInfo = createSchemaInfoChache(schema, itemValueCheckFuncs);

		// obsItemのセットアップ
		itemSetup(obsItem, schema, schemaInfo);

		// schemaを持たせる
		obsItem.schema = schema;
		// schemaInfoの中身を持たせる
		for ( var p in schemaInfo) {
			obsItem[p] = schemaInfo[p];
		}
		// 初期値の設定
		var actualInitialValue = schemaInfo._createInitialValueObj();
		validateValueObj(schema, schemaInfo._validateItemValue, actualInitialValue);
		itemSetter(obsItem, actualInitialValue, null, true);

		// ObservableArrayのアイテムについてリスナの設定
		for ( var i = 0, l = obsItem._aryProps.length; i < l; i++) {
			setObservableArrayListeners(obsItem, obsItem._aryProps[i], obsItem
					.get(obsItem._aryProps[i]));
		}

		return obsItem;
	}

	/**
	 * ObserevableItem(createObservableItemで作成したオブジェクト)かどうかを判定します。
	 * <p>
	 * DataModelから作成したDataItemの場合はfalseを返します。
	 * </p>
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @returns {Boolean} ObservableItemかどうか
	 */
	function isObservableItem(obj) {
		// _validateItemValueを持っているかつ、getModelメソッドがない場合はObservableItemと判定する。
		return !!(obj && obj.constructor && obj._validateItemValue && !$.isFunction(obj.getModel));
	}

	//--------------------------------------------
	// ObservableArray
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
	 * ObservableArrayは、自身の内容が変更されるメソッドが呼び出される時、実行前に'changeBefore'、実行後に'change'イベントを発生させます。
	 * </p>
	 *
	 * @since 1.1.0
	 * @class
	 * @extends EventDispatcher
	 * @name ObservableArray
	 */
	function ObservableArray() {
		/**
		 * 配列の長さを表します。このプロパティは読み取り専用で使用してください
		 *
		 * @since 1.1.0
		 * @name length
		 * @memberOf ObservableArray
		 * @type Number
		 */
		this.length = 0;

		this._src = [];
	}
	$.extend(ObservableArray.prototype, EventDispatcher.prototype);

	//ObservableArrayの関数はフックされるので、直接prototypeに置かない
	var obsFuncs = {
		/**
		 * この配列が、引数で指定された配列と同じ内容か比較します。<br>
		 * 要素にNaN定数が入っている場合、同一位置にともにNaNが入っているかどうかをisNaN()関数でチェックします。
		 * （obsArrayの内容が[NaN]のとき、obsArray.equals([NaN])）はtrueになります。
		 *
		 * @since 1.1.0
		 * @memberOf ObservableArray
		 * @param {ObservableArray|Array} ary ObservableArrayまたはArray型の配列
		 * @returns {Boolean} 判定結果
		 */
		equals: function(ary) {
			var len = this.length;

			// aryが配列でもObservableArrayでもないならfalse
			//サイズが異なる場合もfalse
			if (!($.isArray(ary) || isObservableArray(ary)) || ary.length !== len) {
				return false;
			}

			var target = isObservableArray(ary) ? ary._src : ary;

			// 中身の比較
			for ( var i = 0; i < len; i++) {
				var myVal = this[i];
				var targetVal = target[i];

				if (!(myVal === targetVal || isBothStrictNaN(myVal, targetVal))) {
					return false;
				}
			}
			return true;
		},

		/**
		 * 指定された配列の要素をこのObservableArrayにシャローコピーします。
		 * <p>
		 * 元々入っていた値は全て削除され、呼び出し後は引数で指定された配列と同じ要素を持ちます。
		 * </p>
		 * 引数がnullまたはundefinedの場合は、空配列が渡された場合と同じ挙動をします（自身の要素が全て削除されます）
		 *
		 * @since 1.1.0
		 * @memberOf ObservableArray
		 * @param {Array} src コピー元の配列
		 */
		copyFrom: function(src) {
			if (src == null) {
				//srcがnullの場合は空配列と同じ挙動にする
				src = [];
			}

			src = isObservableArray(src) ? src._src : src;

			if (!$.isArray(src)) {
				//引数が配列でない場合はエラー
				throwFwError(ERR_CODE_INVALID_COPYFROM_ARGUMENT, [0, src]);
			}

			var args = src.slice(0);
			args.unshift(0, this.length);
			Array.prototype.splice.apply(this, args);
		},

		/**
		 * 値を取得します
		 *
		 * @since 1.1.3
		 * @memberOf ObservableArray
		 * @param {Number} index 取得する要素のインデックス
		 * @returns 要素の値
		 */
		get: function(index) {
			return this[index];
		},

		/**
		 * 値をセットします
		 *
		 * @since 1.1.3
		 * @memberOf ObservableArray
		 * @param {Number} index 値をセットする要素のインデックス
		 */
		set: function(index, value) {
			this[index] = value;
		},

		/**
		 * 現在のObservableArrayインスタンスと同じ要素を持ったネイティブ配列インスタンスを返します
		 *
		 * @since 1.1.3
		 * @memberOf ObservableArray
		 * @returns ネイティブ配列インスタンス
		 */
		toArray: function() {
			return this.slice(0);
		},

		/**
		 * 動作は通常の配列のconcatと同じです。<br>
		 * 引数にObservableArrayが渡された場合にそれを通常の配列とみなして動作するようラップされています
		 *
		 * @since 1.1.3
		 * @memberOf ObservableArray
		 * @returns 要素を連結したObservableArrayインスタンス
		 */
		concat: function() {
			var args = h5.u.obj.argsToArray(arguments);
			for ( var i = 0, len = args.length; i < len; i++) {
				if (isObservableArray(args[i])) {
					args[i] = args[i].toArray();
				}
			}
			return this.concat.apply(this, args);
		}
	};

	//Array.prototypeのメンバーはfor-inで列挙されないためここで列挙。
	//プロパティアクセスのProxyingが可能になれば不要になるかもしれない。
	var arrayMethods = ['concat', 'join', 'pop', 'push', 'reverse', 'shift', 'slice', 'sort',
			'splice', 'unshift', 'indexOf', 'lastIndexOf', 'every', 'filter', 'forEach', 'map',
			'some', 'reduce', 'reduceRight'];
	for ( var obsFuncName in obsFuncs) {
		if (obsFuncs.hasOwnProperty(obsFuncName) && $.inArray(obsFuncName, arrayMethods) === -1) {
			arrayMethods.push(obsFuncName);
		}
	}

	// 戻り値として配列を返すので戻り値をラップする必要があるメソッド（従ってtoArrayは含めない）
	var creationMethods = ['concat', 'slice', 'splice', 'filter', 'map'];

	//戻り値として自分自身を返すメソッド
	var returnsSelfMethods = ['reverse', 'sort'];

	// 破壊的(副作用のある)メソッド
	var destructiveMethods = ['sort', 'reverse', 'pop', 'shift', 'unshift', 'push', 'splice',
			'copyFrom', 'set'];

	for ( var i = 0, len = arrayMethods.length; i < len; i++) {
		var arrayMethod = arrayMethods[i];
		ObservableArray.prototype[arrayMethod] = (function(method) {
			var func = obsFuncs[method] ? obsFuncs[method] : Array.prototype[method];

			function doProcess() {
				var ret = func.apply(this._src, arguments);

				if ($.inArray(method, returnsSelfMethods) !== -1) {
					//自分自身を返すメソッドの場合
					ret = this;
				} else if ($.inArray(method, creationMethods) !== -1) {
					//新しい配列を生成するメソッドの場合
					var wrapper = createObservableArray();
					wrapper.copyFrom(ret);
					ret = wrapper;
				}

				return ret;
			}

			if ($.inArray(method, destructiveMethods) === -1) {
				//非破壊メソッドの場合
				return doProcess;
			}

			//破壊メソッドの場合は、changeBefore/changeイベントを出す

			//TODO fallback実装の提供?(優先度低)
			return function() {
				var evBefore = {
					type: 'changeBefore',
					method: method,
					args: arguments
				};

				if (!this.dispatchEvent(evBefore)) {
					//preventDefault()が呼ばれなければ実際に処理を行う
					var ret = doProcess.apply(this, arguments);

					this.length = this._src.length;

					var evAfter = {
						type: 'change',
						method: method,
						args: arguments,
						returnValue: ret
					};
					this.dispatchEvent(evAfter);
					return ret;
				}
			};
		})(arrayMethod);
	}


	/**
	 * ObservableArrayを作成します
	 *
	 * @since 1.1.0
	 * @memberOf h5.core.data
	 * @returns {ObservableArray} ObservableArrayインスタンス
	 */
	function createObservableArray() {
		return new ObservableArray();
	}

	/**
	 * ObservableArrayかどうかを判定します
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
	// =============================
	// Expose to window
	// =============================
	/**
	 * @namespace
	 * @name data
	 * @memberOf h5.core
	 */
	h5.u.obj.expose('h5.core.data', {
		createManager: createManager,
		createObservableArray: createObservableArray,
		createObservableItem: createObservableItem,
		isObservableArray: isObservableArray,
		isObservableItem: isObservableItem,
		createSequence: createSequence,
		SEQ_STRING: SEQ_STRING,
		SEQ_INT: SEQ_INT
	});
})();
