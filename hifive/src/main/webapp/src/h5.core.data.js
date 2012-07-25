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

	//=============================
	// Development Only
	//=============================

	var fwLogger = h5.log.createLogger('h5.core.data');

	/* del begin */


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
		if (!this.__eventListeners) {
			return false;
		}
		var l = this.__eventListeners[type];
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

		if (!this.__eventListeners) {
			this.__eventListeners = {};
		}

		if (!(type in this.__eventListeners)) {
			this.__eventListeners[type] = [];
		}

		this.__eventListeners[type].push(listener);
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

		var l = this.__eventListeners[type];

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
		if (!this.__eventListeners) {
			return;
		}
		var l = this.__eventListeners[event.type];
		if (!l) {
			return;
		}

		//TODO 削除予定
		if (!event.target) {
			event.target = this._eventTarget ? this._eventTarget : this;
		}

		for ( var i = 0, count = l.length; i < count; i++) {
			l[i].call(event.target, event);
		}
	};






	/**
	 * @returns {Object}
	 */
	function createObjectById(id) {
		if (id === undefined || id === null) {
			throw new Error('DataModel.createObjectById: idが指定されていません');
		}
		if (id in this.items) {
			throw new Error('DataModel.createObjectById: id = ' + id + ' のオブジェクトは既に存在します');
		}

		var obj = new this.proxy();
		obj[this.idKey] = id;

		this.items[id] = obj;
		this.size++;

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

		var o = createObjectById(id);
		for (prop in obj) {
			if (prop == model.idKey) {
				continue;
			}
			o[prop] = obj[prop];
		}

		var that = model;
		o.addEventListener('change', function(event) {
			that.objectChangeListener(event);
		});

		var ev = {
			type: 'itemAdd',
			item: o
		};
		model.dispatchEvent(ev);

		return o;
	}


	//TODO JSDoc
	//descriptorのnameにはスペース・ピリオドを含めることはできません。
	/**
	 *
	 */
	function createDataModel(descriptor, manager) {
		return DataModel.createFromDescriptor(descriptor, manager);
	}

	function getItemId(value, idKey) {
		return isString(value) ? value : value[idKey];
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	var MSG_ERROR_DUP_REGISTER = '同じ名前のデータモデルを登録しようとしました。同名のデータモデルの2度目以降の登録は無視されます。マネージャ名は {0}, 登録しようとしたデータモデル名は {1} です。';




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
		this.idKey = null;

		/**
		 * @memberOf DataModel
		 */
		this.size = 0;

		this.idSequence = 0;

		function DataItem() {}
		DataItem.prototype = EventDispatcher.prototype;
		DataItem.prototype.dataModel = this;

		//TODO triggerChangeはクロージャで持たせる
		defineProperty(DataItem.prototype, '_proxy_triggerChange', {
			value: function(obj, prop, oldValue, newValue) {
				var event = {
					type: 'change',
					target: obj,
					property: prop,
					oldValue: oldValue,
					newValue: newValue
				};
				this.dispatchEvent(event);
			}
		});

		this.proxy = DataItem;


		//TODO nameにスペース・ピリオドが入っている場合はthrowFwError()

		this.name = descriptor.name;
		this.manager = manager;

		//TODO this.fullname -> managerの名前までを含めた完全修飾名

		var defineProxyProperty = function(obj, propName) {
			var p = '_' + propName;

			defineProperty(obj, propName, {
				enumerable: true,
				configurable: true,
				get: function() {
					return this[p];
				},
				set: function(value) {
					if (this[p] === value) {
						// 値の変更がない場合はchangeイベントは発火しない
						return;
					}

					var oldValue = this[p];

					if (this[p] === undefined) {
						defineProperty(this, p, {
							value: value,
							writable: true,
						});
					}

					this[p] = value;

					this._proxy_triggerChange(this, propName, oldValue, value);
				}
			});
		};

		var hasId = false;

		for ( var p in descriptor.prop) {
			defineProxyProperty(this.proxy.prototype, p);
			if (descriptor.prop[p] && (descriptor.prop[p].isId === true)) {
				if (hasId) {
					throw new Error('isIdを持つプロパティが複数存在します。 prop = ' + p);
				}

				this.idKey = p;
				hasId = true;
			}
		}

		if (!hasId) {
			throw new Error('id指定されたプロパティが存在しません。isId = trueであるプロパティが1つ必要です');
		}
	}

	DataModel.prototype = new EventDispatcher();
	$.extend(DataModel.prototype, {
		create: function(objOrArray) {
			var ret = [];

			var items = wrapInArray(objOrArray);
			for ( var i = 0, len = items.length; i < len; i++) {
				// 既に存在するオブジェクトの場合は値を更新
				//TODO 値更新
				//				for (prop in obj) {
				//					if (prop == idKey) {
				//						continue;
				//					}
				//					o[prop] = obj[prop];
				//				}


				ret.push(createItem(this, items[i]));
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
				if (id === undefined || id === null) {
					throw new Error('DataModel.removeObjectById: idが指定されていません');
				}
				if (!(id in model.items)) {
					return;
				}

				var obj = model.items[id];

				delete model.items[id];

				model.size--;

				//TODO イベントを出す位置は変える
				var ev = {
					type: 'itemRemove',
					item: obj
				};
				model.dispatchEvent(ev);

				return obj;
			}

			var idKey = this.idKey;
			var ids = wrapInArray(objOrItemId);

			var ret = [];
			for ( var i = 0, len = ids.length; i < len; i++) {
				var id = getItemId(objOrItemId[i], idKey);
				ret.push(removeItemById(this, id));
			}

			if ($.isArray(objOrItemIdOrArray)) {
				return ret;
			}
			return ret[0];
		},

		getAllItems: function() {
			var ret = [];
			var items = this.items;
			for ( var prop in items) {
				ret.push(items[prop]);
			}
			return ret;
		},

		/**
		 */
		objectChangeListener: function(event) {
			var ev = {
				type: 'itemChange',
				item: event.target,
				property: event.property,
				oldValue: event.oldValue,
				newValue: event.newValue
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
	DataModel.createFromDescriptor = function(descriptor, manager) {
		if (!$.isPlainObject(descriptor)) {
			throw new Error('descriptorにはオブジェクトを指定してください。');
		}

		var om = new DataModel(descriptor, manager);
		return om;
	};

	function getItemFullname(dataModel, item) {
		return dataModel.fullname + '.' + item[dataModel.idKey];
	}


	/**
	 * @class
	 * @name DataModelManager
	 */
	function DataModelManager(name) {
		//TODO 「アプリ名」「グループ名」など、このマネージャが管理するデータモデル群の名前を引数にとるようにする
		//名前なしの場合はエラーにする
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
			if (!modelName) {
				//nameがnullまたは空文字の場合
				throwFwError(30001); //TODO 正しい例外を出す
			}

			if (this.models[modelName]) {
				//TODO メッセージの外部化、マネージャ名を追加
				fwLogger.info(MSG_ERROR_DUP_REGISTER, 'MANAGER_NAME_STUB', modelName);
			} else {
				this.models[modelName] = createDataModel(descriptor, this);
			}

			return this.models[modelName];
		},

		dropModel: function(name) {
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
		if (!name) {
			//マネージャ名は1文字以上含まれていなければならない
			//TODO 識別子的なチェックも入れる
			throwFwError(ERR_CODE_INVALID_MANAGER_NAME);
		}
		var manager = new DataModelManager(name);

		if (namespace != null) {
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
