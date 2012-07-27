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

		//TODO 仮想プロパティに依存する仮想プロパティ、などのネストを考慮する

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
			refresh: function() {

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

			fwLogger.debug('{0}のプロパティ{1}を作成', model.name, prop);

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

		//インスタンスごとにaccessor生成、Chromeだと遅い
		//		Object.defineProperties(obj, model.itemPropDesc);

		//		//TODO definePropertiesで作るようにする
		//		//getter/setterを作成
		//		defineProperty(DataItem.prototype, prop, {
		//			enumerable: true,
		//			configurable: false, //プロパティの削除や変更は許可しない
		//			get: src.getter,
		//			set: src.setter
		//		});


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

		//		if (!model.__updateLog[model.idKey]) {
		//			model.__updateLog[model.idKey] = [];
		//		}
		//
		//		model.__updateLog[model.idKey].push({
		//			type: UPDATE_LOG_TYPE_CREATE,
		//			item: o
		//		});

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


	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	function validateSchema(manager, schema) {
		var errorReason = [];

		var hasId = false;

		for ( var p in schema) {
			if (schema[p] && (schema[p].id === true)) {
				if (hasId) {
					errorReason.push('idが複数存在');
				}
				hasId = true;
			}
		}

		if (!hasId) {
			errorReason.push('idがない');
		}

		return errorReason;
	}

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

		function extendSchema(schema, desc) {
			var base = desc.base;

			if (base) {
				if (!manager) {
					//baseが設定されている場合、このデータモデルがマネージャに属していなければ継承元を探せないのでエラー
					throwFwError(ERR_CODE_NO_MANAGER);
				}

				//TODO データモデルの登録の順序関係に注意
				var baseModelDesc = manager.models[base.slice(1)];

				//$.extend()は後勝ちなので、より上位のものから順にextend()するように再帰
				extendSchema(schema, baseModelDesc);
			}

			$.extend(schema, desc.schema);
		}

		//継承を考慮してスキーマを作成
		extendSchema(schema, descriptor);

		for (prop in schema) {
			if (schema[prop] && schema[prop].id === true) {
				/**
				 * @memberOf DataModel
				 */
				this.idKey = prop;
				break;
			}
		}
		if (!this.idKey) {
			throwFwError(30005);
		}



		var errorReason = validateSchema(manager, schema);
		if (errorReason.length > 0) {
			//スキーマにエラーがある
			throwFwError(ERR_CODE_INVALID_SCHEMA, null, errorReason);
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
		 * @memberOf DataModel
		 */
		create: function(objOrArray) {
			var ret = [];

			var idKey = this.idKey;

			//removeで同時に複数のアイテムが指定された場合、イベントは一度だけ送出する。
			//そのため、事前にアップデートセッションに入っている場合はそのセッションを引き継ぎ、
			//入っていない場合は一時的にセッションを作成する。
			//			var isAlreadyInUpdate = this.manager.isInUpdate();
			//			this.manager.beginUpdate();

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

			//			if (!isAlreadyInUpdate) {
			//				this.manager.endUpdate();
			//			}

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
