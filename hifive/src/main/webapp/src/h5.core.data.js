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

	var bindingMap = {};


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
	 * @class
	 * @name h5.helper.EventDispatcher
	 **********************************************************************************************/
	function EventDispatcher() {
	//TODO 今回使用する範囲では下記のコードは不要なので削除予定
	//		if (target) {
	//			this._eventTarget = target;
	//			var that = this;
	//
	//			target.hasEventListener = function(type, listener) {
	//				that.hasEventListener(type, listener);
	//			};
	//			target.addEventListener = function(type, listener) {
	//				that.addEventListener(type, listener);
	//			};
	//			target.removeEventListener = function(type, listener) {
	//				that.removeEventListener(type, listener);
	//			};
	//			target.dispatchEvent = function(event) {
	//				that.dispatchEvent(event);
	//			};
	//		}
	}

	/**
	 * @memberOf h5.helper.EventDispatcher
	 * @param type
	 * @param listener
	 * @returns {Boolean}
	 */
	EventDispatcher.prototype.hasEventListener = function(type, listener) {
		if (!this._eventListeners) {
			return false;
		}
		var l = this._eventListeners[type];
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
	 * @memberOf h5.helper.EventDispatcher
	 * @param type
	 * @param listener
	 */
	EventDispatcher.prototype.addEventListener = function(type, listener) {
		if (this.hasEventListener(type, listener)) {
			return;
		}

		if (!this._eventListeners) {
			this._eventListeners = {};
		}

		if (!(type in this._eventListeners)) {
			this._eventListeners[type] = [];
		}

		this._eventListeners[type].push(listener);
	};

	/**
	 * @memberOf h5.helper.EventDispatcher
	 * @param type
	 * @param lisntener
	 */
	EventDispatcher.prototype.removeEventListener = function(type, lisntener) {
		if (!this.hasEventListener(type, listener)) {
			return;
		}

		var l = this._eventListeners[type];

		for ( var i = 0, count = l.length; i < count; i++) {
			if (l[i] === listener) {
				l.splice(i, 1);
				return;
			}
		}

	};

	/**
	 * @memberOf h5.helper.EventDispatcher
	 * @param event
	 */
	EventDispatcher.prototype.dispatchEvent = function(event) {
		if (!this._eventListeners) {
			return;
		}
		var l = this._eventListeners[event.type];
		if (!l) {
			return;
		}

		if (!event.target) {
			event.target = this._eventTarget ? this._eventTarget : this;
		}

		for ( var i = 0, count = l.length; i < count; i++) {
			l[i].call(event.target, event);
		}
	};





	/**
	 * @class
	 * @name DataModel
	 */
	function DataModel() {
		this.descriptor = null;
		this.objects = {};
		this.objectArray = [];

		this.idKey = null;
		this.size = 0;

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
	}

	DataModel.prototype = EventDispatcher.prototype;
	$.extend(DataModel.prototype, {
		/**
		 * @memberOf DataModel
		 */
		_init: function(descriptor, manager) {
			this.descriptor = descriptor;

			//TODO nameにスペース・ピリオドが入っている場合はthrowFwError()

			this.name = descriptor.name;
			this.manager = null;
			if (manager) {
				this.manager = manager;
			}

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
		},

		/**
		 * @returns {Object}
		 */
		_createObjectById: function(id) {
			if (id === undefined || id === null) {
				throw new Error('DataModel.createObjectById: idが指定されていません');
			}
			if (id in this.objects) {
				throw new Error('DataModel.createObjectById: id = ' + id + ' のオブジェクトは既に存在します');
			}

			var obj = new this.proxy();
			obj[this.idKey] = id;

			this.objects[id] = obj;
			this.size++;

			return obj;
		},

		/**
		 * @returns {Object}
		 */
		createItem: function(obj) {
			var id = obj[this.idKey];
			if (id === null || id === undefined) {
				throw new Error('DataModel.createItem: idが指定されていません');
			}

			var o = this._createObjectById(id);
			for (prop in obj) {
				if (prop == this.idKey) {
					continue;
				}
				o[prop] = obj[prop];
			}

			var that = this;
			o.addEventListener('change', function(event) {
				that.objectChangeListener(event);
			});

			var ev = {
				type: 'itemAdd',
				item: o
			};
			this.dispatchEvent(ev);

			return o;
		},

		/**
		 * @memberOf DataModel
		 * @returns {Object}
		 */
		setItem: function(obj) {
			//TODO 配列で受け取って一度に登録できるようにする

			var idKey = this.idKey;

			var o = this.findById(obj[idKey]);
			if (!o) {
				// 新規オブジェクトの場合は作成
				return this.createItem(obj);
			}

			// 既に存在するオブジェクトの場合は値を更新
			for (prop in obj) {
				if (prop == idKey) {
					continue;
				}
				o[prop] = obj[prop];
			}
		},

		/**
		 */
		removeItem: function(obj) {
			this.removeItemById(obj[this.idKey]);
		},

		removeItemById: function(id) {
			if (id === undefined || id === null) {
				throw new Error('DataModel.removeObjectById: idが指定されていません');
			}
			if (!(id in this.objects)) {
				return;
			}

			var obj = this.objects[id];

			delete this.objects[id];

			this.size--;

			var ev = {
				type: 'itemRemove',
				item: obj
			};
			this.dispatchEvent(ev);
		},

		getAllItems: function() {
			var ret = [];
			var objects = this.objects;
			for ( var prop in objects) {
				ret.push(objects[prop]);
			}
			return ret;
		},

		/**
		 * @returns {Number} オブジェクトの個数
		 */
		getSize: function() {
			return this.size;
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
			return this.objects[id];
		},

		has: function(obj) {
			return !!this.findById(obj[this.idKey]);
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

		var om = new DataModel();
		om._init(descriptor, manager);
		return om;
	};

	//	DataModel.prototype.push = function(obj){
	//		//TODO 本当はpushは可変長引数に対応するのでその対応が必要
	//		this.size++;
	//		this.objectArray.push(obj);
	//	};
	//
	//	DataModel.prototype.pop = function() {
	//		//TODO
	//		this.size--;
	//		this.objectArray.pop();
	//	};


	function getItemFullname(dataModel, item) {
		return dataModel.fullname + '.' + item[dataModel.idKey];
	}


	//TODO Descriptorを使わず、動的に生成するパターンもあった方がよいだろう


	function addBindMapEntry(dataBinding, uuid, itemView, dataModel, dataItem, parentItem) {
		//View -> Item は一意に特定可能.
		//Viewは常にシングルトンな存在なのでグローバルなマップで管理すればよい
		bindingMap[uuid] = {
			item: dataItem,
			parent: parentItem
		};

		var itemFullname = getItemFullname(dataModel, dataItem);


		//TODO 1つのDataItemを「一つのタグ(ツリー)」だけで表すとは限らない。
		//そこで、Rendererが配列でDOMを返した場合を考慮しておく。
		//Viewは「アイテムビュー」というセット(実体はただの配列)で扱うことにする。
		//1つのデータアイテムが「1つのアイテムビュー」と対応することにする。
		//DataItem:ItemView = 1:many は考慮しない。


		//TODO itemToViewは 1:many の可能性がある
		var entry = dataBinding.itemToViewMap[itemFullname];
		if (entry) {
			entry.view.push(itemView);
		} else {
			dataBinding.itemToViewMap[itemFullname] = {
				item: dataItem,
				view: itemView
			};
		}
	}

	function removeBindMapEntry(dataBinding, uuid, view, dataModel, dataItem) {
		delete bindingMap[uuid];
		delete dataBinding.itemToViewMap[getItemFullname(dataModel, dataItem)]; //TODO viewが複数の場合に対応
	}


	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	var MSG_ERROR_DUP_REGISTER = '同じ名前のデータモデルを登録しようとしました。同名のデータモデルの2度目以降の登録は無視されます。マネージャ名は {0}, 登録しようとしたデータモデル名は {1} です。';

	/**
	 * @class
	 * @name DataModelManager
	 */
	function DataModelManager(name) {
		//TODO 「アプリ名」「グループ名」など、このマネージャが管理するデータモデル群の名前を引数にとるようにする
		//名前なしの場合はエラーにする
		this.m = {};
		this.name = name;
	}
	$.extend(DataModelManager.prototype, {
		/**
		 * @param {Object} descriptor データモデルディスクリプタ
		 * @memberOf DataModelManager
		 */
		register: function(descriptor) {
			var modelName = descriptor.name;
			if (!modelName) {
				//nameがnullまたは空文字の場合
				throwFwError(30001); //TODO 正しい例外を出す
			}

			if (this.m[modelName]) {
				//TODO メッセージの外部化、マネージャ名を追加
				fwLogger.info(MSG_ERROR_DUP_REGISTER, 'MANAGER_NAME_STUB', modelName);
			} else {
				this.m[modelName] = createDataModel(descriptor, this);
			}

			return this.m[modelName];
		},

		/**
		 * @param {String} name データモデル名
		 * @memberOf DataModelManager
		 */
		getDataModel: function(name) {
			return this.m[name];
		}
	});


	//TODO JSDoc
	//descriptorのnameにはスペース・ピリオドを含めることはできません。
	/**
	 *
	 */
	function createDataModel(descriptor, manager) {
		return DataModel.createFromDescriptor(descriptor, manager);
	}

	function applyBinding(view, rootElement, template, dataItem, parentItem) {
		if (!dataItem) {
			return;
		}

		//thisはDataBindingインスタンス
		var that = this;

		function applyToView($elem, content, isHtml) {
			function getTargetAttr($elem) {
				var bindTarget = $elem.data('h5Bind'); //TODO キープレフィクス対応

				var attrBracketFrom = bindTarget.indexOf('{');
				if (attrBracketFrom > -1) { //TODO 判定ロジックはもっときちんとする
					var attrBracketTo = bindTarget.indexOf('}');
					if (attrBracketTo == -1) { //TODO === だとダメ？
						throw new Error();// throwFwError();
					}
					return bindTarget.substring(attrBracketFrom + 1, attrBracketTo);
				} else {
					return null; //属性ではない
				}
			}

			var targetAttr = getTargetAttr($elem);

			if (!targetAttr) {
				//子要素としてバインド
				if (isHtml) {
					$elem.html(content);
				} else {
					$elem.text(content);
				}
			} else {
				//属性に対するバインド
				$elem.attr(targetAttr, content); //TODO ここはエスケープ考えなくてよいか？？
			}

		} // End of applyToView

		//var target = getTarget(element, this.__controller.rootElement, true); //TODO getTarget
		var $target = $(rootElement); //elementはターゲットとなる親要素

		var $html = $('<div>').append($(template)); //RAW, 文字列でHTMLが来ているのでcloneは不要.



		//要素数分使うのでクローンする
		var $clone = $html.clone(); //TODO ループしなくなったので不要？？
		var uuid = createSerialNumber();

		//TODO createLocalDataModelのときはmanagerがnullなので
		//DataModelのfullnameは単純にモデル名になってしまう
		// -> DataModelに適当な一意名を付けておく

		//TODO bindingMapはここで作るのではなくループの中で作らないとダメ
		//プロパティが配列の場合があるから.

		addBindMapEntry(this, uuid, $clone.children(), this.dataModel, dataItem, parentItem);

		$clone.children().attr("data-h5-bind-guid", uuid);

		//			$clone.attr(getH5DataKey('bind-key'), uuid);

		//TODO $().find()は自分自身を探せないので仕方なく。後で変更。
		//var $cloneWrapper = $('<div></div>');
		//$clone.wrapAll($cloneWrapper);
		var $dataBind = $clone.find('*[' + getH5DataKey('bind') + ']'); //TODO andSelf


		//TODO dataItemは最初は必ず単品だが、再帰した時に中のプロパティが配列の場合があるので
		//配列で扱わざるを得ない。

		//TODO Model-1 : View-many の場合
		//モデル中の各要素について
		for ( var p in dataItem) {
			//pがdataItemに属していない可能性を考慮(ネストしたモデルの中に同名プロパティがあるかもしれない)

			var $dom = $dataBind.filter(function() {
				//					return $(this).attr('data-bind') === bindObjectName + '.' + p;

				//fwLogger.debug('attr = {0}, p = {1}', $(this).attr(getH5DataKey('bind')), p);

				//TODO この判定で大丈夫か？ []がある場合。もう少しきちんと判定しておくべきか
				return $(this).attr(getH5DataKey('bind')).lastIndexOf(p, 0) == 0;

				//					return $(this).attr(getH5DataKey('bind')) === p;
				//TODO 子オブジェクトのバインドもできるように
			});

			//見つかった要素をバインド
			$dom.each(function() {
				var $this = $(this);

				//				if($this.closest('[data-h5-bind-template]').length > 0) {
				//					//この要素は別のテンプレートに含まれているので処理しない
				//					return;
				//				}

				if ($this.is('[data-h5-bind-template="inner"]')) {
					//TODO tempコード
					var clonedInner = $this.html();

					$this.empty(); //innerなのでempty()にする。これは本当はBinding生成時に行う必要がある。
					//TODO 事前にいくつか要素が入っていた場合を考えると、emptyではなく data-h5-bind-template="this" のような属性を付けて行うべきかも。

					var childBindProp = $this.attr(getH5DataKey('bind')); //TODO hoisting
					applyBinding.call(that, view, this, clonedInner, dataItem[childBindProp],
							dataItem);
				} else if ($this.is('[data-h5-bind-template]')) {
					//var template = $this.attr('data-h5-bind-template');
					//TODO templateをindexOfするコードは…なんで必要なんだっけ？？

					var childBindProp = $this.attr(getH5DataKey('bind'));
					//fwLogger.debug('child templateId = {0}',$this.attr(getH5DataKey('bind-template')));

					//ネストしてテンプレートを適用
					applyBinding.call(that, view, this, view.get($this
							.attr(getH5DataKey('bind-template'))), dataItem[childBindProp],
							dataItem);
				} else {
					if (that.formatter) {
						var cv = that.formatter(dataItem, dataItem, p, dataItem[p]);

						if (cv === undefined) {
							var defaultFormatter = null;
							//TODO getByPathなどでやった方がよいかも
							if (dataItem.__dataModel && dataItem.__dataModel.descriptor
									&& dataItem.__dataModel.descriptor.prop[p]) {
								defaultFormatter = dataItem.__dataModel.descriptor.prop[p].format;
							}

							var val;
							if (defaultFormatter) {
								val = defaultFormatter(dataItem[p]);
							} else {
								val = dataItem[p];
							}
							applyToView($this, val, false);
						} else if ($.isPlainObject(cv)) {
							//TODO cv.valueがない場合のチェック

							if (cv.isHtml) {
								applyToView($this, cv.value, true);
							} else {
								applyToView($this, cv.value, false);
							}
						} else {
							applyToView($this, cv, false);
							//$this.text(cv); //TODO オブジェクトが子要素の場合を考える。パス表記を渡すようにする？？
						}
					} else {
						//TODO コピーしているので後できれいに
						var defaultFormatter = null;
						//TODO getByPathなどでやった方がよいかも
						if (dataItem.__dataModel && dataItem.__dataModel.descriptor
								&& dataItem.__dataModel.descriptor.prop[p]) {
							defaultFormatter = dataItem.__dataModel.descriptor.prop[p].format;
						}

						//TODO defaultFormatterでもHTMLを返せるようにする

						var val;
						if (defaultFormatter) {
							val = defaultFormatter(dataItem[p]);
						} else {
							val = dataItem[p];
						}


						applyToView($this, val, false);
						//$this.html(dataItem[p]);
					}
				}
			});

			//TODO inTransitionをいれるのはこのタイミングなく
			//Renderer側に寄せるのがよいかも（Rendererに制御の機会を与える）
			if (!parentItem && that.inTransition) {
				//Transitionをかけるのは、ルート要素に対してのみ。
				that.inTransition($target.get(0), $clone); //TODO children()以外の方法
			} else {
				$target.append($clone.children());
			}
		}
	}


	//TODO rename
	function changeView(dataBinding, dataItem, property, newValue) {
		var map = dataBinding.itemToViewMap[getItemFullname(dataItem.__dataModel, dataItem)];
		//		map.item,view

		//TODO namespace対応

		for ( var i = 0, len = map.view.length; i < len; i++) {
			$(map.view[i]).andSelf().find('[data-h5-bind="' + property + '"]').each(function() {
				var $this = $(this);

				var guid = $this.closest('[data-h5-bind-guid]').attr('data-h5-bind-guid');

				if (!guid) {
					return;
				}

				//ネストした他のDataItemのプロパティの可能性があるので、同じDataItemを見ているかどうかをチェック
				if (bindingMap[guid].item === dataItem) {
					$this.text(newValue); //TODO applyToViewを使わないとだめ
				}
			});
		}

	}

	//TODO これはいらないかも？？
	//オブジェクトに変更があった場合に画面エフェクトを付ける。
	//ただし、どういうエフェクトを付けるべきかはまちまちなので
	//使いどころが難しいかもしれない。
	//	DataBinding.prototype.setChangeEffect = function(func) {
	//		this.changeEffect = func;
	//	};

	//TODO addEventListenerの方式にする？？
	//	DataBinding.prototype.setChangeCallback = function(func) {
	//
	//	};


	/**
	 * @name SimpleRenderer
	 * @class
	 */
	function SimpleRenderer() {}
	$.extend(SimpleRenderer.prototype, {
		/**
		 * @memberOf SimpleRenderer
		 * @param dataItems
		 * @param bindRoot
		 * @param applyBindingFunc
		 */
		onItemAdd: function(dataBinding, item, bindingFunc) {
			fwLogger.debug('SimpleRenderer onItemAdd');

			bindingFunc(item);

			fwLogger.debug('onItemAdd end');
		},

		onItemChange: function(dataBinding, item, view, newValue, oldValue, applyChange) {
			//TODO 変更されたItem, 対応するView, old/newValueを返す
			applyChange();
		},

		onItemRemove: function(dataBinding, item, removeFunc) {
			fwLogger.debug('begin onItemRemove');

			removeFunc(item);

			fwLogger.debug('end onItemRemove');
		}
	});

	//simpleRendererはシングルトンでよい
	var simpleRendererInstance = new SimpleRenderer();


	/**
	 * @param {Controller} controller コントローラインスタンス
	 * @param {DataModel} dataModel データモデル
	 * @param {Element|jQuery} root DataItemに対応するビューを保持するルート要素
	 * @param {String|Element|jQuery} itemTemplate 1つのDataItemに対応するビューテンプレート。
	 *            文字列の場合はビューとなるHTML文字列をセットしてください。 従って、EJSを併用する場合は this.view.get(templateKey)
	 *            の戻り値をセットしてください。
	 * @name DataBinding
	 * @class
	 */
	function DataBinding(controller, dataModel, root, itemTemplate) {
		//TODO 同じルート要素に複数のDataBindingを使っても
		//独立して動く（主にremove時に自分の分だけを消す）ようにする

		//TODO itemTemplateが省略された場合、
		//rootの子要素のうちをh5DataItemTemplateクラスがついたものとして自動的に使うようにする。


		this.dataModel = dataModel;

		this.root = root; //TODO $find()的なことをする対応

		this.controller = controller;

		this.itemToViewMap = {};

		//TODO KeyだけでなくDOM要素も受け取れるようにする
		//stringでも「テンプレートキー」だったり「HTML文字列そのもの」だったりする
		//テンプレートキーを受け取るのはやめる？(this.view.get()せよ、ということにする)
		//HTML文字列、もしくはElement,jQueryにするのがよいか・・・
		this.templateCache = $(itemTemplate).clone();

		//TODO itemTemplateがDOM要素の場合、removeして見えないようにしておく

		var that = this;

		this.setRenderer(simpleRendererInstance);

		function bindingFunc(dataItem) {
			applyBinding.call(that, controller.view, that.root, that.templateCache, dataItem, null);
		}

		function removeFunc(dataItem) {
			var view = that.getView(dataItem);
			if (view) {
				var uuid = $(view).attr("data-h5-bind-guid");

				removeBindMapEntry(that, uuid, view, dataModel, dataItem);

				$(view).remove();
			}
		}

		this.dataModel.addEventListener('itemAdd', function(event) {
			fwLogger.debug('dataItem added');
			that.renderer.onItemAdd(that, event.item, bindingFunc);
		});

		this.dataModel.addEventListener('itemChange', function(event) {
			//			var view = that.getView(event.item);

			function applyChangeFunc() {
				fwLogger.debug('begin applyChange');
				changeView(that, event.item, event.property, event.newValue);
				fwLogger.debug('end applyChange');
			}

			fwLogger.debug('dataItem change');
			//TODO oldValue, newValue
			that.renderer.onItemChange(that, event.item, that.getView(event.item), event.newValue,
					event.oldValue, applyChangeFunc);
		});

		this.dataModel.addEventListener('itemRemove', function(event) {
			fwLogger.debug('dataItem remove');
			that.renderer.onItemRemove(that, event.item, removeFunc);
		});
	}
	$.extend(DataBinding.prototype, {
		/**
		 * @memberOf DataBinding
		 */
		refresh: function() {
			fwLogger.debug('DataBinding.refresh()');
			//TODO setRendererでやっていることと同じ…でよい？？
		},

		/**
		 * @memberOf DataBinding
		 */
		getRenderer: function() {
			return this.renderer;
		},

		setRenderer: function(renderer) {
			if (this.renderer === renderer) {
				return;
			}

			this.renderer = renderer;

			//			$(this.root).empty();

			//TODO コピーしているので何とかしたい
			function bindingFunc(dataItem) {
				applyBinding.call(this, this.controller.view, this.root, this.templateCache,
						dataItem, null);
			}

			//Rendererが変更された場合は、一度ビューをクリアして全データアイテムのバインドをやり直す
			var items = this.dataModel.getAllItems();
			for ( var i = 0, len = items.length; i < len; i++) { //TODO 一度にたくさん回すとUIが固まるのでasync.loop使う
				renderer.onItemAdd(this, items[i], bindingFunc);
			}
		},

		/**
		 * 指定されたデータアイテムにバインドされたエレメントを返します。<br>
		 * 対応するビュー(エレメント)が見つからない場合はnullを返します。
		 *
		 * @param {DataItem} dataItem データアイテム
		 */
		getView: function(dataItem) {
			var entry = this.itemToViewMap[getItemFullname(this.dataModel, dataItem)];
			if (entry) {
				return entry.view;
			}
			return null;
		},

		/**
		 * 指定された要素の親要素を順にたどり、最も近い要素にバインドされているデータアイテムを返します。<br>
		 * バインドされたデータアイテムが見つからない場合はnullを返します。
		 * DataItemが親子関係を持っている場合、「ルート」のインスタンス（親を持たないDataItem）を返します。
		 *
		 * @param {Element} element DOM要素
		 */
		getDataItem: function(element) {
			//TODO バインドしているルートそのものを指定した時に正しく返るか

			//TODO this.rootに対して複数のデータバインドが行われている場合
			//this.rootからfind()しても誤ったものを選択する可能性あり。
			//「このバインドを管理しているのが自分かどうか」を判断する方法が必要か。
			//bindingMapに持たせてしまうのも手。
			var $item = $(this.root).andSelf().find(element).closest('[data-h5-bind-guid]'); //TODO namespace対応
			if ($item.length === 0) {
				return null;
			}

			var uuid = $item.data('h5BindGuid'); // TODO namespace対応
			var binding = bindingMap[uuid];
			while (binding.parent !== null) {
				binding = binding.parent;
			}

			return binding.item;
		},

		setItemTemplate: function(itemTemplate) {

		},

		/**
		 * formatFunctionの仕様： formatterFunction(rootObject, object, key, value) { return
		 * value-for-key-or-object; } $.isPlainObject以外の値が返ってきた場合⇒ $.text()で文字列として流し込む Objectの場合⇒
		 * isHtmlがtrueなら$.html()、それ以外なら$.text()で valueにセットされている値を流し込む
		 */
		setFormatter: function(formatFunction) {
			this.formatter = formatFunction;
		},

		setConverter: function(convertFunction) {
			this.converter = convertFunction;
		},


		/**
		 * in/out transition関数の仕様： function transition(target:DOM, elemForAppend:DOM,
		 * operation:String, callbackWhenCompleted(elem)):elem
		 * operationはstart/stop/goToEnd/goToStart callbackは基となるDataBindingへのコールバック
		 *
		 * @param func
		 */
		setOutTransition: function(func) {
			this.outTransition = func;
			//outTransitionはDeferredで実装されなければならない。
			//完了したら elemを resolve(elen);で返す必要がある。
			//返さないと、インスタンスの管理ができない。
		},

		//TODO inTransition中にそのインスタンスを外したくなったらどうする？？
		// 1. タイマー回すのをFW側で行うようにする
		// 2. inTransitionFuncに引数を渡して「直ちに停止」できるようにする
		//TODO 既に要素が存在していて後からバインドを行った場合
		//inTransitionは動かす？？ -> 多分、動かす、でよい
		setInTransition: function(func) {
			this.inTransition = func;
		}
	});


	//TODO createSkeleton(view) みたいなUtil関数を用意して
	//実ビューから中身を抜いたスケルトンを生成できるようにする？
	// -> デザイナが作ったひな形をほぼそのまま作れる…


	//TODO Rendererに何をどこまで任せる？
	//・表示するかどうか -> 画面をスクロールした時に判断、とかも必要。
	//　　・イベントハンドラをレンダラが設定できる必要あり
	//・Rendererの能動性が強すぎるかも…


	//DataBindingでは、editable属性があって、editOnで、どのタイミングでエディット状態にするか指定する。
	//editOnは…JS?HTML?
	//typeはinput, textarea, contenteditableあたりか


	function createManager(name, namespace) {
		if (!name) {
			throwFwError(30000); //TODO 正しく例外を出す
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

		//TODO DataBindingはViewに移動予定
		createDataBinding: function(controller, dataModel, root, itemTemplate) {
			return new DataBinding(controller, dataModel, root, itemTemplate);
		}
	});
})();
