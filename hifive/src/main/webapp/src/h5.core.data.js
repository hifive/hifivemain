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

	/** スキーマが不正 */
	var ERR_CODE_INVALID_SCHEMA = 30004;

	/** createDataModelManagerのnamespaceが不正 */
	var ERR_CODE_INVALID_MANAGER_NAMESPACE = 30005;

	/** データモデル名が不正 */
	var ERR_CODE_INVALID_DATAMODEL_NAME = 30006;

	/** createItemでIDが必要なのに指定されていない */
	var ERR_CODE_NO_ID = 30007;

	/** マネージャの登録先に指定されたnamespaceにはすでにその名前のプロパティが存在する */
	var ERR_CODE_REGISTER_TARGET_ALREADY_EXIST = 30008;

	/** 内部エラー：更新ログタイプ不正（通常起こらないはず） */
	var ERR_CODE_INVALID_UPDATE_LOG_TYPE = 30009;

	/** IDは文字列でなければならない */
	var ERR_CODE_ID_MUST_BE_STRING = 30010;

	var ERROR_MESSAGES = [];
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAME] = 'マネージャ名が不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_TYPE] = 'DataItemのsetterに渡された値の型がDescriptorで指定されたものと異なる';
	ERROR_MESSAGES[ERR_CODE_DEPEND_PROPERTY] = 'dependが設定されたプロパティのセッターを呼び出した';
	ERROR_MESSAGES[ERR_CODE_NO_EVENT_TARGET] = 'イベントのターゲットが指定されていない';
	ERROR_MESSAGES[ERR_CODE_INVALID_SCHEMA] = 'スキーマが不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_MANAGER_NAMESPACE] = 'createDataModelManagerのnamespaceが不正';
	ERROR_MESSAGES[ERR_CODE_INVALID_DATAMODEL_NAME] = 'データモデル名が不正';
	ERROR_MESSAGES[ERR_CODE_NO_ID] = 'createItemでIDが必要なのに指定されていない';
	ERROR_MESSAGES[ERR_CODE_REGISTER_TARGET_ALREADY_EXIST] = 'マネージャの登録先に指定されたnamespaceにはすでにその名前のプロパティが存在する';
	ERROR_MESSAGES[ERR_CODE_INVALID_UPDATE_LOG_TYPE] = '内部エラー：更新ログタイプ不正';
	ERROR_MESSAGES[ERR_CODE_ID_MUST_BE_STRING] = 'IDは文字列でなければならない';
	//	ERROR_MESSAGES[] = '';
	addFwErrorCodeMap(ERROR_MESSAGES);


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
	 * @param listener
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


	function createDataModelItemsChangeEvent(created, recreated, removed, changed) {
		return {
			type: EVENT_ITEMS_CHANGE,
			created: created,
			recreated: recreated,
			removed: removed,
			changed: changed
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
		for (var prop in data) {
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
				var modelName = descriptor.name;
				if (!isValidNamespaceIdentifier(modelName)) {
					throwFwError(ERR_CODE_INVALID_DATAMODEL_NAME); //TODO 正しい例外を出す
				}

				if (this.models[modelName]) {
					fwLogger.info(MSG_ERROR_DUP_REGISTER, this.name, modelName);
				} else {
					this.models[modelName] = createDataModel(descriptor, this); //TODO validateSchema
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

		function createDataModel(descriptor, manager) {
			if (!$.isPlainObject(descriptor)) {
				throw new Error('descriptorにはオブジェクトを指定してください。');
			}

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
						this.idKey = prop;
						break;
					}
				}
				if (!this.idKey) {
					throwFwError(30005); //TODO throw proper error
				}


				//TODO
				//				var errorReason = validateSchema(manager, schema);
				//				if (errorReason.length > 0) {
				//					//スキーマにエラーがある
				//					throwFwError(ERR_CODE_INVALID_SCHEMA, null, errorReason);
				//				}

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
							for (var prop in valueObj) {
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

			var targetModel = new DataModel(descriptor, manager);


			function itemChangeListener(event) {
				if (manager && manager.isInUpdate()) {
					addUpdateChangeLog(targetModel, event);
					return;
				}

				targetModel.dispatchEvent(createDataModelItemsChangeEvent([], [], [], [event]));
			}

			return targetModel;
		} /* End of createDataModel() */


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
		createManager: createManager

	//		createLocalDataModel: createLocalDataModel,
	});
})();
