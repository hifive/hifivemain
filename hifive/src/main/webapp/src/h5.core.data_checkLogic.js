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

	//TODO エラーコード定数等Minify版（製品利用版）でも必要なものはここに書く

	/** マネージャ名が不正 */
	var ERR_CODE_INVALID_MANAGER_NAME = 30000;

	/** DataItemのsetterに渡された値の型がDescriptorで指定されたものと異なる */
	var ERR_CODE_INVALID_TYPE = 30001;

	/** dependが設定されたプロパティのセッターを呼び出した */
	var ERR_CODE_DEPEND_PROPERTY = 30002;

	/** イベントのターゲットが指定されていない */
	var ERR_CODE_NO_EVENT_TARGET = 30003;

	var ERR_CODE_INVALID_SCHEMA = 30004;

	var ERR_CODE_INVALID_MANAGER_NAMESPACE = 30005;

	var ERR_CODE_INVALID_DATAMODEL_NAME = 30006;

	var ITEM_PROP_BACKING_STORE_PREFIX = '__';

	var PROP_CONSTRAINT_REQUIRED = 'required';


	var UPDATE_LOG_TYPE_CREATE = 1;
	var UPDATE_LOG_TYPE_CHANGE = 2;
	var UPDATE_LOG_TYPE_REMOVE = 3;



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
	var prefix = "h5";

	//TODO グローバルキャッシュに持っていくべき
	function getH5DataKey(key) {
		return 'data-' + prefix + '-' + key;
	}


	// =========================================================================
	//
	// Privates
	//
	// =========================================================================
	//=============================
	// Variables
	//=============================
	var globalBindSerialNumber = 0;


	//TODO 要素の属性の値が長くなった場合にどれくらいパフォーマンス（速度・メモリ）に影響出る？？要調査
	//問題なければfullnameをView側のキーにしてしまうことも考える


	//TODO グローバルなBindingManagerを用意して、「私はどのDataBindingで制御されているビュー（に含まれている要素）？」を
	//問合せできるようにすべきか


	//=============================
	// Functions
	//=============================



	/***********************************************************************************************
	 * @private
	 * @class
	 * @name EventDispatcher
	 **********************************************************************************************/
	function EventDispatcher() {}

	/**
	 * @memberOf EventDispatcher
	 * @param type
	 * @param listener
	 * @returns {Boolean}
	 */
	EventDispatcher.prototype.hasEventListener = function(type, listener) {
		if (!this.__listeners) {
			return false;
		}
		var l = this.__listeners[type];
		if (!l) {
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
	 * @memberOf EventDispatcher
	 * @param type
	 * @param listener
	 */
	EventDispatcher.prototype.addEventListener = function(type, listener) {
		if (this.hasEventListener(type, listener)) {
			return;
		}

		if (!this.__listeners) {
			this.__listeners = {};
		}

		if (!(type in this.__listeners)) {
			this.__listeners[type] = [];
		}

		this.__listeners[type].push(listener);
	};

	/**
	 * @memberOf EventDispatcher
	 * @param type
	 * @param lisntener
	 */
	EventDispatcher.prototype.removeEventListener = function(type, lisntener) {
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
	 * @memberOf EventDispatcher
	 * @param event
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

		for ( var i = 0, count = l.length; i < count; i++) {
			l[i].call(event.target, event);
		}
	};



	function createSerialNumber() {
		return globalBindSerialNumber++;
	}

	/**
	 * プロパティを作成する。 ES5のObject.definePropertyが使用できない場合は 非標準の__defineGetter__, __defineSetter__を使用する。
	 * どちらも使用できない場合は例外を発生させる。 参考：
	 * http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
	 */
	function defineProperty(obj, prop, desc) {
		var ieVer = h5.env.ua.browserVersion;
		var isIE = h5.env.ua.isIE;
		var isES5Compliant = Object.defineProperty && (!isIE || (isIE && (ieVer >= 9))); // TODO
		// Safari5.0も対応していないのではじく必要あり

		if (isES5Compliant) {
			Object.defineProperty(obj, prop, desc);
		} else if (Object.prototype.__defineGetter__) {
			if ('get' in desc) {
				obj.__defineGetter__(prop, desc.get);
			}
			if ('set' in desc) {
				obj.__defineSetter__(prop, desc.set);
			}
			if ('value' in desc) {
				obj[prop] = desc.value;
			}
		} else {
			throw new Error('defineProperty: プロパティを作成できません');
		}
	}

	function isValidTypeString(value) {
		if (isString(value)) {
			return true;
		}
		return false;
	}

	function isValidTypeNumber(value) {
		if ($.type(value) === 'number') {
			return true;
		}
		if (!isString(value)) {
			return false;
		}
		//TODO 先頭文字が数値として有効だったらtrue、それ以外はfalseにする
		return true;
	}

	var typeCheckFunc = {
		'string': isValidTypeString,
		'number': isValidTypeNumber
	};


	//TODO DataItemにsetData等同名のプロパティが出てきたらどうするか。
	//今のうちに_とかでよけておくか、
	//それともschema側を自動的によけるようにするか、
	//またはぶつからないだろうと考えてよけないか
	//(今は良いかもしれないが、将来的には少し怖い)
	function DataItemBase() {}
	DataItemBase.prototype = new EventDispatcher();
	$.extend(DataItemBase.prototype, {
		setData: function(data) {
			//TODO このままだと即時にイベントが上がるので、
			//セットした値をまとめて1つのイベントで通知するようにする
			for ( var prop in data) {
				this[prop] = data[prop];
			}
		},
	});

	var PROP_TYPE_ENUM = 'enum';
	var PROP_TYPE_STRING = 'string';
	var PROP_TYPE_OBJECT = 'object';
	var PROP_TYPE_ANY = 'any';
	var NULLABLE_PROP_TYPES = [PROP_TYPE_ENUM, PROP_TYPE_STRING, PROP_TYPE_OBJECT, PROP_TYPE_ANY];


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


		//{ 依存元: [依存先] }という構造のマップ。依存先プロパティは配列内で重複はしない。
		var dependencyMap = {};

		for ( var prop in schema) {
			var dependency = schema[prop] ? schema[prop].depend : null;
			if (dependency) {
				var dependOn = wrapInArray(dependency.on);
				for ( var i = 0, len = dependOn.length; i < len; i++) {
					var dependSrcPropName = dependOn[i];

					fwLogger.debug('{0} depends on {1}', prop, dependSrcPropName);

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
				/**
				 * スキーマのプロパティタイプをパースします。
				 */
				function parseType(type) {
					var ret = [];

					var splittedType = type.split(',');
					for ( var i = 0, len = splittedType.length; i < len; i++) {
						var typeDef = {
							isArray: false,
							dim: 0,
							checkInner: []
						};

						var t = $.trim(splittedType[i]);
						var arrayIndicatorPos = t.indexOf('[');

						if (arrayIndicatorPos !== -1) {
							typeDef.isArray = true;
							if (t.charAt(0) === '(') {
								//配列内に複数の型が混在できる場合
							} else {
								//'string[]'のように、配列内の型は1つである場合
								var innerType = $.trim(t.slice(1, arrayIndicatorPos));
								if (innerType.charAt(0) === '@') {
									typeDef.checkInner.push();
								} else if (typeCheckFunc[innerType]) {
									typeDef.checkInner.push(typeCheckFunc[innerType]);
								}
							}
						}

						ret.push(typeDef);
					}


					return ret;
				} /* End of parseType() */

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


			//descには、プロパティ名、エンハンスするかどうか、セットすべきセッター、ゲッター
			var src = {
				enhance: propDesc.enhance === false ? false : true, //enhanceのデフォルト値はtrue
			};

			if (src.enhance) {
				src.getter = function() {
					return getValue(this, name);
				};

				src.setter = createSetter();
			}

			return src;
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
		}
		DataItem.prototype = new DataItemBase();

		//TODO 外部に移動
		var defaultPropDesc = {
			type: 'any',
			enhance: true
		};

		//データアイテムのプロトタイプを作成
		//schemaは継承関係展開後のスキーマになっている
		for ( var prop in schema) {
			var propDesc = schema[prop];
			if (!propDesc) {
				propDesc = defaultPropDesc;
			}

			var src = createSrc(prop, propDesc);

			fwLogger.debug('{0}のプロパティ{1}を作成', model.name, prop);

			if (!src.enhance) {
				continue; //非enhanceなプロパティは、Item生成時にプロパティだけ生成して終わり
			}

			//TODO definePropertiesで作るようにする
			//getter/setterを作成
			defineProperty(DataItem.prototype, prop, {
				enumerable: true,
				configurable: false, //プロパティの削除や変更は許可しない
				get: src.getter,
				set: src.setter
			});
		}

		return DataItem;
	}




	/**
	 * @returns {Object}
	 */
	function createObjectById(model, id) {
		if (id === undefined || id === null) {
			throw new Error('DataModel.createObjectById: idが指定されていません');
		}
		if (id in model.items) {
			throw new Error('DataModel.createObjectById: id = ' + id + ' のオブジェクトは既に存在します');
		}

		var obj = new model.itemConstructor();

		obj[model.idKey] = id;

		model.items[id] = obj;
		model.size++;

		return obj;
	}

	/**
	 * @returns {Object}
	 */
	function createItem(model, obj) {
		var id = obj[model.idKey];
		if (id === null || id === undefined) {
			throw new Error('DataModel.createItem: idが指定されていません');
		}

		var o = createObjectById(model, id); //TODO inline化
		for (prop in obj) {
			if (prop == model.idKey) {
				continue;
			}
			o[prop] = obj[prop];
		}

		o.addEventListener('change', function(event) {
			model.itemChangeListener(event);
		});

		if (!model.__updateLog[model.idKey]) {
			model.__updateLog[model.idKey] = [];
		}

		model.__updateLog[model.idKey].push({
			type: UPDATE_LOG_TYPE_CREATE,
			item: o
		});

		return o;
	}


	//TODO JSDoc
	//descriptorのnameにはスペース・ピリオドを含めることはできません。
	/**
	 *
	 */
	function createDataModel(descriptor, manager) {
		return createFromDescriptor(descriptor, manager);
	}

	/**
	 * @private
	 * @param {String|Object} value データアイテムオブジェクトまたはID文字列
	 * @param {String} idKey IDとみなすプロパティ名
	 */
	function getItemId(value, idKey) {
		return isString(value) ? value : value[idKey];
	}

	/**
	 * type:'number' 指定のプロパティに代入できるかのチェック null,undefinedは入るので、trueを返す。
	 *
	 * @param {Any} val 判定する値
	 * @param {integer} dementnion 判定する型の配列次元(配列でないなら0)
	 * @return {Boolean} numberとして正しい値かどうか。
	 */
	function isNumber(val) {
		if (val == null) {
			return true;
		}
		if (typeof val === 'number') {
			return true;
		}
		return false;
	}
	// TODO ↑と同様に各型について書いていく

	/**
	 * データモデルのディスクリプタとして正しいオブジェクトかどうかチェックする。 schema以外をチェックして、正しくないなら例外を投げる。
	 * 正しい場合はvalidateSchemaの戻り値を返す
	 *
	 * @private
	 * @param {Object} descriptor オブジェクト
	 * @param {Object} DataManagerオブジェクト
	 * @return {Object} schemaのチェック結果。validateSchemaの戻り値をそのまま返す
	 */
	function validateDescriptor(descriptor, manager) {
		// descriptorがオブジェクトかどうか
		// TODO 呼び出し元でチェックするから要らない？

		// nameのチェック
		// TODO 識別子として有効でない文字列ならエラーにするでいいか？
		if (!isValidNamespaceIdentifier(descriptor.name)) {
			throw new Error('データモデル名が不正です。使用できる文字は、半角英数字、_、$、のみで、先頭は数字以外である必要があります。');
		}

		// baseのチェック
		var base = descriptor.base;
		var baseSchema;
		if (base != null) {
			// nullまたはundefinedならチェックしない
			if ((!isString(base) || !base.indexOf('@'))) {
				// @で始まる文字列でないならエラー
				throw new Error('baseの指定が不正です。指定する場合は、継承したいデータモデル名の先頭に"@"を付けた文字列を指定してください。');
			}
			var baseName = base.substring(1);
			var baseModel = manager.models[baseName];
			if (baseModel) {
				throw new Error('baseに指定されたデータモデルは存在しません。' + baseName);
			}
			baseSchema = manager.models[baseName].schema;
		}

		// schemaのチェック
		if (!$.isPlainObject(descriptor.schema)) {
			throw new Error('ディスクリプタにschemaが正しく設定されていません。schemaをオブジェクトで指定してください。');
		}
		// base指定されていた場合は、後勝ちでextendする。
		schema = $.extend(baseSchema, descriptor.schema);

		return validateSchema(schema, manager);
	}


	/**
	 * schemaが正しいかどうか判定する
	 *
	 * @private
	 * @param {Object} schema schemaオブジェクト
	 * @param {Object} manager DataManagerオブジェクト
	 * @return {Object} schemaのチェック結果。以下のようなオブジェクトを返す。
	 *
	 * <pre>
	 * {
	 * 		errorReason: Array, // エラー情報(エラーがない場合は空配列)
	 * 		meta:{
	 * 			type: {	// type情報をパースした結果
	 * 				isDataModel: boolean,		// データモデル指定かどうか
	 * 				dataModelName: string,	 	// データモデル指定の時、データモデルの名前
	 * 				elmType: string,			// type指定文字から配列部分を除いた文字列
	 * 				enumValue: array			// enumValue(elmTypeが&quot;enum&quot;の場合のみ)
	 * 				dimension: dimention,		// 配列の階層 (配列指定でないときは0)
	 * 				check:function				// 値がelmTypeを満たすかどうかチェックする関数
	 * 			},
	 * 			constraint: {
	 * 				// 指定したプロパティとその値
	 * 				check: function  	// 値がconstraintに指定された条件を満たすかどうかチェックする関数
	 * 			},
	 * 			checkValue: function	// typeとconstraintを元に、valueがあっているかどうかをチェックする関数。typeに配列が指定されている場合は中身も見る
	 * 			}
	 * 		}
	 * }
	 * </pre>
	 */
	function validateSchema(schema, manager) {
		// TODO エラーメッセージを定数化する
		var errorReason = [];


		// id指定されている属性が一つだけであることをチェック
		var hasId = false;
		for ( var p in schema) {
			if (schema[p].id === true) {
				if (hasId) {
					errorReason.push('idが複数存在');
				}
				hasId = true;
			}
		}
		if (!hasId) {
			errorReason.push('idがない');
		}

		for ( var schemaProp in schema) {
			var propObj = schema[schemaProp];
			var isId = propObj.id;

			// プロパティ名が適切なものかどうかチェック
			if (!isValidNamespaceIdentifier(schemaProp)) {
				errorReason.push('"' + schemaProp
						+ '"をプロパティ名に指定できません。半角英数字,_,$ で構成される文字列で、先頭は数字以外である必要があります');
			}

			// -- dependのチェック --
			// defaultValueが指定されていたらエラー
			// onに指定されているプロパティがschema内に存在すること
			var depend = propObj.depend;
			if (depend != null) {
				// id指定されているならエラー
				if (isId) {
					errorReason.push('id指定されたプロパティにdependを指定することはできません');
				}

				// dependが指定されているなら、on,calcが指定されていること
				if (depend.on == null) {
					errorReason.push('depend.onには文字列、または文字列の配列ででプロパティ名を指定する必要があります');
				} else {
					var onArray = wrapInArray(depend.on);
					for ( var i = 0, l = onArray.length; i < l; i++) {
						if (!schema[onArray[i]]) {
							errorReason.push('depend.onに指定されたプロパティがデータモデルにありません。');
							break;
						}
					}
				}
				if (typeof depend.calc !== 'function') {
					errorReason.push('depend.calcには関数を指定する必要があります');
				}
			}

			// -- typeのチェック --
			// typeに指定されている文字列は正しいか
			// defaultValueとの矛盾はないか
			// constraintにそのtypeで使えない指定がないか
			// enumの時は、enumValueが指定されているか
			var typeCheck = function() {
				// type指定がない場合でもcheckメソッドを持たせる
				return true;
			};
			var typeObj = {};
			if (propObj.type != null) {
				// id指定されているならエラー
				if (isId) {
					errorReason.push('id指定されたプロパティにtypeを指定することはできません');
				}
				var type = propObj.type;
				if (!isString(type)) {
					errorReason.push('typeは文字列で指定する必要があります');
				}
				// "string", "number[][]", "@DataModel"... などを正規表現でチェック
				var matched = type
						.match(/^(string|number|integer|boolean|object|array|any|enum|@(.+?))(\[\])*$/);
				if (!matched) {
					errorReason.push('typeに指定された文字が不正です。');
				} else {
					// マッチ結果から、データモデル指定の場合と配列の場合をチェックする
					// "string[][][]"のとき、matched = ["string[][][]", "string", undefined, "[][][]", "[]"]
					// "@DataModel"のとき、matched = ["@DataModel", "@DataModel", "DataModel", "", undefined]

					// データモデルの場合
					if (matched[2]) {
						if (!managerl.models[matched[2]]) {
							errorReason.push('タイプに指定されたデータモデルはありません');
						}
					}

					// enumの場合
					if (matched[1] === 'enum') {
						// enumValueが無ければエラー
						if (propObj.enumValue == null) {
							errorReason.push('タイプにenumを指定する場合はenumValueも指定する必要があります');
						}
					}

					// 配列の次元。配列でないなら0
					var dimention = matched[3] ? matched[3].length / 2 : 0;

					// type指定を元に値をチェックする関数を作成する
					typeCheck = createTypeCheckFunction(matched[1], {
						manager: manager,
						enumValue: propObj.enumValue
					});

					// constraintのチェックで使用するタイプ情報
					typeObj = {
						isDataModel: !!matched[2],
						dataModelName: matched[2],
						elmType: matched[1],
						demension: dimention
					};
				}
			}

			// constraintのチェック
			// プロパティのチェック
			// 値のチェック
			// タイプと矛盾していないかのチェック
			var constraintObj = propObj.constraint;
			var constraintCkeck = function() {
				return true;
			};
			if (constraintObj != null) {
				if (!$.isPlainObject(constraintObj)) {
					errorReason.push('constraintはオブジェクトで指定してください');
				} else {
					for ( var p in constraintObj) {
						// constraintのプロパティの値とtype指定との整合チェック
						var val = constraintObj[p];
						switch (p) {
						case 'notNull':
							if (val != null) {
								if (val !== true || val !== false) {
									errorReason.push('constraint.notNullは、trueまたはfalseで指定してください');
								}
							}
							break;
						case 'min':
						case 'max':
							if (val != null) {
								switch (typeObj.elmType) {
								case 'integer':
									if (!isInteger(val) || isNaN(val)) {
										errorReason
												.push('constraint.minとmax は、数値で指定してください。typeにintegerを指定している場合は整数値で指定する必要があります');
									}
									break;
								case 'number':
									if (!isNumber(val) || val === Infinity || val === -Infinity
											|| isNaN(val)) {
										errorReason.push('constraint.minとmax は、数値で指定してください');
									}
									break;
								default:
									errorReason
											.push('constraintにminとmaxを指定できるのはtypeに"number"または"integer"またはその配列を指定した時のみです');
								}
							}
							break;
						case 'minLength':
						case 'maxLength':
							if (val != null) {
								switch (typeObj.elmType) {
								case 'string':
									if (!isInteger(val) || isNaN(val) || val <= 0) {
										errorReason
												.push('constraint.minLengthとmaxLength は、0以上の整数値で指定してください');
									}
									break;
								default:
									errorReason
											.push('constraintにminLengthとmaxLengthを指定できるのはtypeに"string"またはその配列を指定した時のみです');
								}
							}
							break;
						case 'notEmpty':
							if (val != null) {
								switch (typeObj.elmType) {
								case 'string':
									if (!isBoolean(val)) {
										errorReason
												.push('constraint.notEmpty は、trueまたはfalseで指定してください');
									}
									break;
								default:
									errorReason
											.push('constraintにnotEmptyを指定できるのはtypeに"string"またはその配列を指定した時のみです');
								}
							}
							break;
						case 'pattern':
							if (val != null) {
								switch (typeObj.elmType) {
								case 'string':
									if ($.type(val) !== 'regexp') {
										errorReason.push('constraint.notEmpty は、正規表現で指定してください');
									}
									break;
								default:
									errorReason
											.push('constraintにpatternを指定できるのはtypeに"string"またはその配列を指定した時のみです');
								}
							}
							break;
						}
					}

					// constraintの中身に矛盾がないかどうかチェック
					if (constraintObj.notEmpty && constraintObj.minLength === 0) {
						errorReason
								.push('constraintのチェックでエラーが発生しました。notEmptyを指定している場合は\minLengthに0を指定することはできません');
					}
					if (constraintObj.notEmpty && constraintObj.minLength === 0) {
						errorReason
								.push('constraintのチェックでエラーが発生しました。notEmptyを指定している場合は\minLengthに0を指定することはできません');
					}
					if (constraintObj.min != null && constraintObj.max != null
							&& constraintObj.min > constraintObj.max) {
						errorReason.push('constraintのチェックでエラーが発生しました。min > max となるような数字は設定できません');
					}
					if (constraintObj.minLength != null && constraintObj.maxLength != null
							&& constraintObj.minLength > constraintObj.maxLength) {
						errorReason
								.push('constraintのチェックでエラーが発生しました。minLength > maxLength となるような数字は設定できません');
					}
				}
				// constraintを値が満たすかどうかチェックする関数
				constraintCkeck = createConstraintCheckFunction(constraintObj);
			}


			// enumValueのチェック
			var enumValue = propObj.enumValue;
			if (enumValue != null) {
				// typeObj.elmTypeがenumか
				if (typeObj.elmType !== 'elem') {
					errorReason.push('enumValueはtypeに"enum"またはその配列が指定されている場合のみ指定可能です');
				}
				// 空でない配列かどうか
				if (!$.isArray(enumValue) || enumValue.length === 0) {
					errorReason.push('enumValueは空でない配列を指定してください。');
				}
				if (propObj.constraint != null) {
					// constraintのチェック
					errorReason.push('enumValue');
				}

			}

			// TODO この関数を外出しする。(この関数を作る関数を外だしする)
			function checkValue(v) {
				if (typeObj.elmType === 'array') {
					return $.isArray(v);
				}
				function _checkValue(v, d) {
					if (!d) {
						return typeCheck(v) && constraintCheck(v);
					}
					if (!$.isArray(v)) {
						return false;
					}
					for ( var i = 0, l = v.length; i < l; i++) {
						if (!_checkValue(v[i], d - 1)) {
							return false;
						}
					}
					return true;
				}
				return _checkValue(v, typeObj.dimentnion);
			}
			// defaultValueのチェック
			// typeObj, constraintObjと矛盾していないかのチェック
			// enumの場合はenumの中にあるかどうかのチェック
			// enumの中にNaNがあるときはisNaNを使ってチェック
			// defaultValueはnullの時は、nullが指定されたものとする。
			// undefinedの時は、指定無しと解釈する
			var defaultValue = propObj.defaultValue;
			if (propObj.hasOwnProperty('defaultValue')) {
				// dafaultValueはnullやundefinedであっても、指定されていれば(hasOwnPropertyがtrueなら)その値をチェックする
				checkValue(defaultValue) || error.Reason.push('defaultValueのエラー');
			}
		}

		// TODO チェック関数をそとだしするので、ここはエラーメッセージを返せばOK..？
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
			if (v == null) {
				// nullでないものについてチェックを行うので、nullならtrueを返す
				return true;
			}
			if (constraint.notEmpty && !v) {
				return false;
			}
			if (constraint.min != null && v < constraint.min) {
				return false;
			}
			if (constraint.max != null && constraint.max < v) {
				return false;
			}
			if (constraint.minLength != null && v < constraint.minLength) {
				return false;
			}
			if (constraint.maxLength != null && constraint.maxLength < v) {
				return false;
			}
			if (constraint.pattern != null && !v.match(constraint.pattern)) {
				return false;
			}
			return true;
		}
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
			return function(v) {
				return v != null || isNumber(v);
			};
		case 'integer':
			return function(v) {
				return v != null || isInteger(v);
			};
		case 'string':
			return function(v) {
				return v != null || isString(v);
			};
		case 'boolean':
			return function(v) {
				return v != null || isBoolean(v);
			};
		case 'array':
			return function(v) {
				return v != null || isArray(v);
			};
		case 'enum':
			return function(v) {
				if (isNaN(v)) {
					// NaN の時は、NaN===NaNにならない(inArrayでも判定できない)ので、enumValueの中身を見て判定する
					for ( var i = 0, l = opt.enumValue.length; i < l; i++) {
						if (isNaN(opt.enumValue[i])) {
							return true;
						}
					}
					return false;
				}
				return !!$.inArray(v, opt.enumValue);
			};
		}
		// タイプチェックは終わっているはずなので、どのケースにも引っかからない場合はデータモデルかつ、そのデータモデルはマネージャに存在する
		var matched = type.match(/@(.+?)/);
		var dataModelName = matched[1];
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
			return v == null || v === dataModel.has(v);
		}
	}

	/**
	 * 値とデータプロパティの型を表す文字列を引数にとり、 値がその型であるかどうかを判定します。
	 *
	 * @param {Any} value 値
	 * @param {String} typeStr 型文字列。'string','number','array', 'integer[]' など
	 */
	function valueTypeCheck(value, typeStr) {
	// TODO
	}

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

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

		// TODO schemaではなくdescriptorにエラーがある場合はエラーが投げられる。
		// が、ここで一度エラーを受け取ってから投げたほうがいい？
		var checkResult = validateDescriptor(descriptor, manager);
		if (checkResult.errorReason.length > 0) {
			//スキーマにエラーがある
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, checkResult.errorReason);
		}

		this.itemConstructor = createDataItemConstructor(this, descriptor);

		// idKeyの登録
		for ( var p in descriptor.schema) {
			if (descriptor.schema[p].id === true) {
				break;
			}
		}
		/**
		 * @memberOf DataModel idとなるキー
		 */
		this.idKey = p;

		//TODO this.fullname -> managerの名前までを含めた完全修飾名
	}

	DataModel.prototype = new EventDispatcher();
	$.extend(DataModel.prototype, {
		/**
		 * @memberOf DataModel
		 */
		create: function(objOrArray) {
			var ret = [];

			var idKey = this.idKey;

			//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
			//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
			//入っていない場合は一時的にセッションを作成する。
			var isAlreadyInUpdate = this.isInUpdate();
			this.beginUpdate();

			var items = wrapInArray(objOrArray);
			for ( var i = 0, len = items.length; i < len; i++) {
				var existingItem = this.findById(items[i][idKey]);
				if (existingItem) {
					// 既に存在するオブジェクトの場合は値を更新
					//TODO 値更新
					//				for (prop in obj) {
					//					if (prop == idKey) {
					//						continue;
					//					}
					//					o[prop] = obj[prop];
					//				}
					ret.push(existingItem);
				} else {
					var newItem = createItem(this, items[i]);
					ret.push(newItem);
					this.items[newItem[idKey]] = newItem;
				}
			}

			if (!isAlreadyInUpdate) {
				this.endUpdate();
			}

			if ($.isArray(objOrArray)) {
				return ret;
			}
			return ret[0];
		},

		/**
		 * @memberOf DataModel
		 * @returns {Object}
		 */
		get: function(idOrArray) {
			if (isString(idOrArray)) {
				return this.findById(idOrArray);
			}

			var ret = [];
			for ( var i = 0, len = idOrArray.length; i < len; i++) {
				ret.push(this.findById(idOrArray[i]));
			}
			return ret;
		},

		/**
		 * TODO JSDocの書き方(DataModel[]はOK？)
		 *
		 * @memberOf DataModel
		 * @returns {DataModel[]}
		 */
		remove: function(objOrItemIdOrArray) {
			/*
			 * 指定されたidのデータアイテムを削除します。
			 */
			function removeItemById(model, id) {
				if (!(id in model.items)) {
					return null;
				}

				var item = model.items[id];

				item.removeEventListener('change', this.itemChangeListener);

				delete model.items[id];

				model.size--;

				if (!model.__updateLog[model.idKey]) {
					model.__updateLog[model.idKey] = [];
				}

				model.__updateLog[model.idKey].push({
					type: UPDATE_LOG_TYPE_REMOVE,
					item: item
				});

				return item;
			}

			var idKey = this.idKey;
			var ids = wrapInArray(objOrItemIdOrArray);

			//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
			//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
			//入っていない場合は一時的にセッションを作成する。
			var isAlreadyInUpdate = this.isInUpdate();
			this.beginUpdate();

			var ret = [];
			for ( var i = 0, len = ids.length; i < len; i++) {
				var id = getItemId(ids[i], idKey);
				ret.push(removeItemById(this, id));
			}

			if (!isAlreadyInUpdate) {
				this.endUpdate();
			}

			if ($.isArray(objOrItemIdOrArray)) {
				return ret;
			}
			return ret[0];
		},

		/**
		 * @returns {DataItem[]} データアイテム配列
		 */
		getAllItems: function() {
			var ret = [];
			var items = this.items;
			for ( var prop in items) {
				if (items.hasOwnProperty(prop)) {
					ret.push(items[prop]);
				}
			}
			return ret;
		},

		/**
		 */
		itemChangeListener: function(event) {
			if (this.isInUpdate()) {
				this.__updateLog[event.target[this.idKey]].push({
					type: UPDATE_LOG_TYPE_CHANGE,
					ev: event
				});
				return;
			}

			var ev = {
				type: 'itemsChange',

				added: null,
				removed: null,
				changed: [event]
			};
			this.dispatchEvent(ev);
		},

		/**
		 */
		findById: function(id) {
			return this.items[id];
		},

		has: function(obj) {
			return !!this.findById(getItemId(obj, this.idKey));
		},

		/**
		 * @returns {Boolean} アップデートセッション中かどうか
		 */
		isInUpdate: function() {
			return !!this.__updateLog; //TODO 配列だとこれではダメ？
		},

		beginUpdate: function() {
			if (this.isInUpdate()) {
				return;
			}

			//logは{ (item-key): [{ type: '1(=create)/2(=delete)/3(=change)', item: (item), changed: {(change event)} }, ...] という構造を持つ
			this.__updateLog = {};
		},

		endUpdate: function() {
			if (!this.isInUpdate()) {
				return;
			}

			//TODO endUpdateのタイミングで更新伝搬処理を行う
			return;

			var event = {
				type: 'itemsChange',
				added: [],
				changed: [],
				removed: []
			};

			var log = this.__updateLog;

			//__updateLog は { (item-key): [ { type: '1(=create)/2(=delete)/3(=change)', item: (item), changed: {(change event)} }, ...] という構造を持つ

			for ( var itemId in log) {
				var itemLog = log[itemId];
				var createdOrRemoved = false;

				//新しい変更が後ろに入っているので、降順で履歴をチェックする
				for ( var i = itemLog.length - 1; i >= 0; i--) {
					var l = itemLog[i];
					if (l.type === UPDATE_LOG_TYPE_CREATE) {
						event.added.push(l.item);
						createdOrRemoved = true;
						break;
					} else if (l.type === UPDATE_LOG_TYPE_REMOVE) {
						event.removed.push(l.item);
						createdOrRemoved = true;
						break;
					}
				}

				//新規追加または削除
			}


			$.extend(changedProps, this.__internals.change);

			var alreadyCalculated = [];

			//再計算したプロパティをchangedPropsに追加していくので、ループは__internals.changeで回す必要がある
			for ( var srcProp in this.__internals.change) {
				var depends = dependencyMap[srcProp];
				if (depends) {
					for ( var i = 0, len = depends.length; i < len; i++) {
						var dependProp = depends[i];
						//同じ依存プロパティの再計算は一度だけ行う
						if ($.inArray(dependProp, alreadyCalculated) === -1) {
							var dependOldValue = getValue(this, dependProp);
							var dependNewValue = recalculateDependProperties(this, dependProp);
							setValue(this, dependProp, dependNewValue);
							//TODO 同じ処理が何か所かで出てくるのでまとめる
							changedProps[dependProp] = {
								oldValue: dependOldValue,
								newValue: dependNewValue
							};
							alreadyCalculated.push(dependProp);
						}
					}
				}
			}

			var event = {
				props: changedProps
			};

			delete this.__updateLog;

			this.dispatchEvent(event);
		}

	});


	/**
	 * @memberOf DataModel
	 * @returns {DataModel}
	 */
	function createFromDescriptor(descriptor, manager) {
		//TODO Descriptorチェックはここで行う？
		if (!$.isPlainObject(descriptor)) {
			throw new Error('descriptorにはオブジェクトを指定してください。');
		}

		var om = new DataModel(descriptor, manager);
		return om;
	}

	function getItemFullname(dataModel, item) {
		return dataModel.fullname + '.' + item[dataModel.idKey];
	}


	/**
	 * @class
	 * @name DataModelManager
	 */
	function DataModelManager(name) {
		if (!isValidNamespaceIdentifier(name)) {
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}

		this.models = {};
		this.name = name;
	}
	$.extend(DataModelManager.prototype, {
		/**
		 * @param {Object} descriptor データモデルディスクリプタ
		 * @memberOf DataModelManager
		 */
		createModel: function(descriptor) {
			var modelName = descriptor.name;
			if (!isValidNamespaceIdentifier(modelName)) {
				throwFwError(ERR_CODE_INVALID_DATAMODEL_NAME); //TODO 正しい例外を出す
			}

			if (this.models[modelName]) {
				fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, modelName);
			} else {
				this.models[modelName] = createDataModel(descriptor, this);
			}

			return this.models[modelName];
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
		}
	});


	function createManager(name, namespace) {
		var manager = new DataModelManager(name);

		//第2引数が省略される場合もあるので、厳密等価でなく通常の等価比較を行う
		if (namespace != null) {
			if (!isValidNamespaceIdentifier(namespace)) {
				throwFwError(ERR_CODE_INVALID_MANAGER_NAMESPACE);
			}

			//namespaceがnullまたはundefinedでない場合は、その名前空間に、指定した名前でマネージャを公開する
			var o = {};
			o[name] = manager;
			h5.u.obj.expose(namespace, o);
		}

		return manager;
	}

	function createLocalDataModel(descriptor) {
		return createDataModel(descriptor);
	}

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

		createLocalDataModel: createLocalDataModel,
	});
})();
