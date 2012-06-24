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

	//TODO Minify時にプリプロセッサで削除されるべきものはこの中に書く
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

	var bindingMap = {};


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
	function EventDispatcher(target) {
		//TODO eventListenerはクロージャで管理する（thisを汚さない）ようにする
		if (target) {
			this._eventTarget = target;
			var that = this;

			target.hasEventListener = function(type, listener) {
				that.hasEventListener(type, listener);
			};
			target.addEventListener = function(type, listener) {
				that.addEventListener(type, listener);
			};
			target.removeEventListener = function(type, listener) {
				that.removeEventListener(type, listener);
			};
			target.dispatchEvent = function(event) {
				that.dispatchEvent(event);
			};
		}
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





	/***********************************************************************************************
	 * @class
	 **********************************************************************************************/
	function DataModel() {
		this.objectDescriptor = null;
		this.objects = {};
		this.objectArray = [];

		this.idKey = null;
		this.size = 0;

		function ObjectProxy() {}
		ObjectProxy.prototype = new EventDispatcher();

		defineProperty(ObjectProxy.prototype, '_proxy_triggerChange', {
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

		this.proxy = ObjectProxy;
	}

	/**
	 * @returns {DataModel}
	 */
	DataModel.createFromDescriptor = function(objectDescriptor) {
		if (!$.isPlainObject(objectDescriptor)) {
			throw new Error('objectDescriptorにはオブジェクトを指定してください。');
		}

		var om = new DataModel();
		om._init(objectDescriptor);
		return om;
	};

	DataModel.prototype = new EventDispatcher();

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

	/**
	 */
	DataModel.prototype._init = function(objectDescriptor) {
		this.objectDescriptor = objectDescriptor;

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

		for ( var p in objectDescriptor) {
			defineProxyProperty(this.proxy.prototype, p);
			if (objectDescriptor[p] && (objectDescriptor[p].isId === true)) {
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
	};

	/**
	 * @returns {Object}
	 */
	DataModel.prototype._createObjectById = function(id) {
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
	};

	/**
	 * @returns {Object}
	 */
	DataModel.prototype.createItem = function(obj) {
		var id = obj[this.idKey];
		if (id === null || id === undefined) {
			throw new Error('DataModel.createObject: idが指定されていません');
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
	};

	/**
	 * @returns {Object}
	 */
	DataModel.prototype.setItem = function(obj) {
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
	};

	/**
	 */
	DataModel.prototype.removeObject = function(obj) {
		this.removeObjectById(obj[this.idKey]);
	};

	DataModel.prototype.removeObjectById = function(id) {
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
	};

	DataModel.prototype.getAllObjects = function() {
		var ret = [];
		var objects = this.objects;
		for ( var prop in objects) {
			ret.push(objects[prop]);
		}
		return ret;
	};

	/**
	 * @returns {Number} オブジェクトの個数
	 */
	DataModel.prototype.getSize = function() {
		return this.size;
	};

	/**
	 */
	DataModel.prototype.objectChangeListener = function(event) {
		var ev = {
			type: 'itemChange',
			item: event.target,
			property: event.property,
			oldValue: event.oldValue,
			newValue: event.newValue
		};
		this.dispatchEvent(ev);
	};

	/**
	 */
	DataModel.prototype.findById = function(id) {
		return this.objects[id];
	};

	DataModel.prototype.has = function(obj) {
		return !!this.findById(obj[this.idKey]);
	};


	//TODO Descriptorを使わず、動的に生成するパターン


	/***********************************************************************************************
	 * @class
	 **********************************************************************************************/
	function DataModelManager() {
		//TODO 「アプリ名」「グループ名」など、このマネージャが管理するデータモデル群の名前を引数にとるようにする
		//名前なしの場合はエラーにする
		this.dataModels = {};
	}

	/**
	 * @memberOf DataModelManager
	 */
	DataModelManager.prototype.register = function(name, descriptor) {
		//TODO nameもdescriptorの中に入れられるようにする？
		this.dataModels[name] = createDataModel(descriptor);
		return this.dataModels[name]; //TODO 高速化
	};

	DataModelManager.prototype.getDataModel = function(name) {
		//TODO undefチェック必要か
		return this.dataModels[name];
	};

	// =========================================================================
	//
	// Body
	//
	// =========================================================================

	//TODO モジュール本体のコードはここに書く

	function createDataModel(descriptor) {
		return DataModel.createFromDescriptor(descriptor);
	}

	function applyBinding(view, rootElement, templateKey, models, parentModel) {

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

		var $html = $('<div>').append($(templateKey)); //RAW, 文字列でHTMLが来ているのでcloneは不要.


		//		if (!(bindObjectName || $html.attr('data-bind-property'))) {

		//bindObjectName = bindObjectName ? bindObjectName : $html.attr('data-bind-property');

		//var models = param[bindObjectName];
		if (!models) {
			return;
		}
		//models = wrapInArray(models);

		var modelArray = models; //models.getAllObjects();

		//コレクションの数だけループ
		for ( var i = 0, len = modelArray.length; i < len; i++) {
			var model = modelArray[i];
			//要素数分使うのでクローンする
			var $clone = $html.clone();
			var uuid = createSerialNumber();

			bindingMap[uuid] = {
				m: model,
				parent: parentModel
			};

			$clone.children().attr("data-h5-bind-guid", uuid);

			//			$clone.attr(getH5DataKey('bind-key'), uuid);

			//TODO $().find()は自分自身を探せないので仕方なく。後で変更。
			//var $cloneWrapper = $('<div></div>');
			//$clone.wrapAll($cloneWrapper);
			var $dataBind = $clone.find('*[' + getH5DataKey('bind') + ']');


			//TODO Model-1 : View-many の場合
			//モデル中の各要素について
			for ( var p in model) {
				//				fwLogger.debug('prop = {0}', p);

				var $dom = $dataBind.filter(function() {
					//					return $(this).attr('data-bind') === bindObjectName + '.' + p;

					//fwLogger.debug('attr = {0}, p = {1}', $(this).attr(getH5DataKey('bind')), p);

					//TODO この判定で大丈夫か？ []がある場合。もう少しきちんと判定しておくべきか
					return $(this).attr(getH5DataKey('bind')).lastIndexOf(p, 0) == 0;

					//					return $(this).attr(getH5DataKey('bind')) === p;
					//TODO 子オブジェクトのバインドもできるように
				});

				//見つかった要素をバインド
				$dom
						.each(function() {
							var $this = $(this);

							if ($this.is('[data-h5-bind-template="inner"]')) {
								//TODO tempコード
								var clonedInner = $this.html();

								$this.empty(); //innerなのでempty()にする。これは本当はBinding生成時に行う必要がある。
								//TODO 事前にいくつか要素が入っていた場合を考えると、emptyではなく data-h5-bind-template="this" のような属性を付けて行うべきかも。

								var childBindProp = $this.attr(getH5DataKey('bind')); //TODO hoisting
								applyBinding.call(that, view, this, clonedInner,
										model[childBindProp], model);
							} else if ($this.is('[data-h5-bind-template]')) {
								//var templateKey = $this.attr('data-h5-bind-template');
								//TODO templateをindexOfするコードは…なんで必要なんだっけ？？

								var childBindProp = $this.attr(getH5DataKey('bind'));
								//fwLogger.debug('child templateId = {0}',$this.attr(getH5DataKey('bind-template')));

								//ネストしてテンプレートを適用
								applyBinding.call(that, view, this, view.get($this
										.attr(getH5DataKey('bind-template'))),
										model[childBindProp], model);
							} else {
								//that.applyValue($this, model, p);
								if (that.formatter) {
									var cv = that.formatter(model, model, p, model[p]);

									if ($.isPlainObject(cv)) {
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
									applyToView($this, model[p], false);
									//$this.html(model[p]);
								}
							}
						});
			}

			//TODO transitionはバインドの「ルート」の場合のみでよいだろう。
			//子要素ごとにかけると重すぎる。
			if (that.inTransition) {
				that.inTransition($target.get(0), $clone); //TODO children()以外の方法
			} else {
				$target.append($clone.children());
			}
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
		onItemsAdd: function(dataBinding, addedItems, bindingFunc) {
			fwLogger.debug('SimpleRenderer onItemsAdd');

			bindingFunc(addedItems[0]);

			fwLogger.debug('onItemsAdd end');
		},

		onItemsChange: function(dataBinding, changedItems, applyFunc) {
			//TODO 変更されたItem, 対応するView, old/newValueを返す
		},

		onItemsRemove: function(dataBinding, removedItems) {

		}
	});

	//simpleRendererはシングルトンでよい
	var simpleRendererInstance = new SimpleRenderer();


	/**
	 * @name DataBinding
	 * @class
	 */
	function DataBinding(controller, dataModel, root, itemTemplate) {
		this.dataModel = dataModel;
		this.templateKey = itemTemplate;

		this.root = root; //TODO $find()的なことをする対応

		this.controller = controller;

		//TODO KeyだけでなくDOM要素も受け取れるようにする
		this.templateCache = $(controller.view.get(itemTemplate)).clone();

		this.autoBind = true;

		var that = this;

		this.setRenderer(simpleRendererInstance);

		function bindingFunc(dataItem) {
			applyBinding.call(that, controller.view, that.root, that.templateCache, [dataItem],
					null);
		}

		this.dataModel.addEventListener('itemAdd', function(event) {
			fwLogger.debug('dataItem added');
			that.renderer.onItemsAdd(that, [event.item], bindingFunc);
		});

		this.dataModel.addEventListener('itemChange', function(event) {
			fwLogger.debug('dataItem change');
//TODO oldValue, newValue
			that.renderer.onItemsChange(that, [event.item]);
		});

		this.dataModel.addEventListener('itemRemove', function(event) {
			fwLogger.debug('dataItem remove');

		});
	}
	$.extend(DataBinding.prototype, {
		/**
		 * @memberOf DataBinding
		 */
		refresh: function() {
			fwLogger.debug('DataBinding.refresh()');
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
			//TODO rendererが変更されたらデータバインドはすべてやり直す
		},

		/**
		 * 指定されたデータアイテムにバインドされたエレメントを返します。<br>
		 * 対応するビュー(エレメント)が見つからない場合はnullを返します。
		 *
		 * @param {DataItem} dataItem データアイテム
		 */
		getView: function(dataItem) {

		},

		/**
		 * 指定された要素の親要素を順にたどり、最も近い要素にバインドされているデータアイテムを返します。<br>
		 * バインドされたデータアイテムが見つからない場合はnullを返します。
		 *
		 * @param {Element} element DOM要素
		 */
		getDataItem: function(element) {
			//TODO バインドしているルートそのものを指定した時に正しく返るか

			var $item = $(element).closest('[data-h5-bind-guid]'); //TODO namespace対応
			if ($item.length === 0) {
				return null;
			}

			var uuid = $item.data('h5BindGuid'); // TODO namespace対応
			var root = bindingMap[uuid];
			while (root.parent !== null) {
				root = root.parent;
			}

			return root.m;
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



	//TODO Rendererに何をどこまで任せる？
	//・表示するかどうか -> 画面をスクロールした時に判断、とかも必要。
	//　　・イベントハンドラをレンダラが設定できる必要あり
	//・Rendererの能動性が強すぎるかも…


	//DataBindingでは、editable属性があって、editOnで、どのタイミングでエディット状態にするか指定する。
	//editOnは…JS?HTML?
	//typeはinput, textarea, contenteditableあたりか


	function createManager() {
		//TODO 引数を取るように
		return new DataModelManager();
	}

	//=============================
	// Expose to window
	//=============================

	h5.u.obj.expose('h5.core.data', {
		manager: new DataModelManager(),
		createManager: createManager,
		//TODO managerは自分でgetManager()するのがいいか？managerをここでシングルトンにするとポートレット系のときに支障があるかも
		createLocalDataModel: createDataModel,
		createDataBinding: function(controller, dataModel, root, itemTemplate) {
			return new DataBinding(controller, dataModel, root, itemTemplate);
		}
	});
})();
