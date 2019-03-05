/*
 * Copyright (C) 2016-2017 NS Solutions Corporation
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
 */
/* ------ h5.cls ------ */
(function() {
	'use strict';

	//TODO _p_ (デフォルトPrefix)を持つプロパティの再定義をブロック
	//TODO propertyDescで、accessorの場合にbackingStoreのプロパティ名を指定できるようにする
	//（その場合、backingStore自体のプロパティも定義する必要有）
	//TODO propertyChangeイベントをあげるように
	//TODO propertyChangeイベントをクラスからあげられるように

	var ERR_CODE_NO_CLASS_DESC = 18000;
	var ERR_CODE_NO_CLASS_NAME = 18001;
	var ERR_CODE_NO_CLASS_CONSTRUCTOR = 18002;
	var ERR_CODE_CTOR_NOT_CHAINED = 18003;
	var ERR_CODE_METHOD_MUST_BE_FUNCTION = 18004;
	var ERR_CODE_CLASS_IS_ABSTRACT = 18005;
	var ERR_CODE_CANNOT_DEFINE_ROOT_CLASS_PROPS = 18006;
	var ERR_CODE_INVALID_NAMESPACE = 18007;
	var ERR_CODE_RESERVED_STATIC_PROP_NAME = 18008;
	var ERR_CODE_DUPLICATE_PROP = 18009;
	var ERR_CODE_DUPLICATE_STATIC_PROP = 18010;
	var ERR_CODE_STATIC_METHOD_MUST_BE_FUNCTION = 18011;
	var ERR_CODE_CLASS_NOT_FOUND = 18012;

	//fwLoggerのメソッド呼び出しはビルド時（minify時）に呼び出しコードごと削除される
	var fwLogger = h5.log.createLogger('h5.cls');

	/* del begin */

	var FW_LOG_ISDYNAMIC_IS_OBSOLETE = '{0}: クラス定義のisDynamic指定はver.1.3.3で廃止されました。ver.1.3.3以降、全てのクラスについて、インスタンス生成時にフレームワークによるObject.seal()は行われず、動的なプロパティ追加が可能です。';

	var errMsgMap = {};
	errMsgMap[ERR_CODE_NO_CLASS_DESC] = 'クラス定義がありません。';
	errMsgMap[ERR_CODE_NO_CLASS_NAME] = 'クラス定義にnameがありません。クラス名は必須です。';
	errMsgMap[ERR_CODE_NO_CLASS_CONSTRUCTOR] = '{0}: クラスのメソッド定義にconstructorがありません。constructorは必須です。';
	errMsgMap[ERR_CODE_CTOR_NOT_CHAINED] = '{0}: 親クラスのコンストラクタ呼び出しが途中で行われていません。継承関係のあるすべてのクラスのコンストラクタの先頭で親コンストラクタの呼び出しが行われていることを確認してください。';
	errMsgMap[ERR_CODE_METHOD_MUST_BE_FUNCTION] = '{0}: クラス定義のmethodには関数以外は記述できません。違反しているプロパティ={1}';
	errMsgMap[ERR_CODE_CLASS_IS_ABSTRACT] = '{0}: このクラスは抽象クラス(isAbstract=true)です。インスタンスを生成することはできません。';
	errMsgMap[ERR_CODE_CANNOT_DEFINE_ROOT_CLASS_PROPS] = '{0}: 親クラスで定義されているプロパティは再定義できません。定義しようとしたプロパティ={1}';
	errMsgMap[ERR_CODE_INVALID_NAMESPACE] = 'namespaceが指定されていません。';
	errMsgMap[ERR_CODE_RESERVED_STATIC_PROP_NAME] = '静的プロパティに予約済みの名前は使用できません。名前={0}';
	errMsgMap[ERR_CODE_DUPLICATE_PROP] = '{0}: クラス定義内でプロパティ名が重複しています。名前={1}';
	errMsgMap[ERR_CODE_DUPLICATE_STATIC_PROP] = '{0}: クラス定義内で静的プロパティ名が重複しています。名前={1}';
	errMsgMap[ERR_CODE_STATIC_METHOD_MUST_BE_FUNCTION] = '{0}: クラス定義の静的methodには関数以外は指定できません。メソッド名={1}';
	errMsgMap[ERR_CODE_CLASS_NOT_FOUND] = '指定された名前のクラスが見つかりませんでした。名前＝{0}';
	addFwErrorCodeMap(errMsgMap);
	/* del end */

	var PROPERTY_BACKING_STORE_PREFIX = '_p_';

	/**
	 * JavaScriptのFunction上の予約語
	 */
	var JS_RESERVED_NAMES = ['length', 'name', 'displayName', 'arguments', 'prototype', 'caller'];

	/**
	 * h5.clsのクラスオブジェクトの予約語
	 */
	var H5_RESERVED_NAMES = ['extend', 'getClass'];

	/**
	 * JSとh5.clsの予約語をマージした配列。この配列で定義されている名前は静的プロパティ名に使えない
	 */
	var RESERVED_STATIC_NAMES = JS_RESERVED_NAMES.concat(H5_RESERVED_NAMES);

	/**
	 * 静的メンバーの名前が使用可能かどうかをチェックします。NG名だった場合は例外を投げます。
	 *
	 * @param {String} name メンバー名
	 * @throws Error
	 */
	function validateStaticMemberName(name) {
		RESERVED_STATIC_NAMES.forEach(function(n) {
			if (name === n) {
				throwFwError(ERR_CODE_RESERVED_STATIC_PROP_NAME, name);
			}
		});
	}

	function defineClass(classManager, parentClass, classDescriptor) {
		if (!classDescriptor) {
			throwFwError(ERR_CODE_NO_CLASS_DESC);
		}
		if (!classDescriptor.name) {
			throwFwError(ERR_CODE_NO_CLASS_NAME);
		}
		if (!classDescriptor.method || !classDescriptor.method.constructor) {
			throwFwError(ERR_CODE_NO_CLASS_CONSTRUCTOR, classDescriptor.name);
		}

		if (typeof classDescriptor.isDynamic !== 'undefined') {
			fwLogger.warn(FW_LOG_ISDYNAMIC_IS_OBSOLETE, classDescriptor.name);
		}

		var ctor = classDescriptor.method.constructor;

		//親クラスが指定されていれば、プロトタイプを継承する
		if (parentClass) {
			//Class._ctorは必ず存在する(constructorが必須だから)
			ctor.prototype = Object.create(parentClass._ctor.prototype);
			ctor.prototype.constructor = ctor;
			//ctor._super = parentClass._ctor;
		} else {
			//親クラスがない場合、何もしないコンストラクタをセット
			//ctor._super = function() {
			//do nothing
			//};
		}

		var superObject = {
			constructor: function() {
				//Chrome(V8)では、Array.prototype.slice.call(arguments)でargumentsを配列化して
				//func.apply()の引数に使うと、プロファイラで"Not Optimized: Bad value context ..."という警告が出る。
				//このようにループでコピーして呼ぶと、警告は出なくなる。
				//ただし、この処理全体を別の関数にして呼び出すと再び警告が出てしまうので、
				//このループは都度書く必要がある。
				//また、ES2015では Array.from() が追加されたが、現時点（Chrome56）ではslice()よりも遅かった。
				//またNot Optimizedの警告も出るので、採用しない。
				var argsLen = arguments.length;
				var argsArray = new Array(argsLen);
				for (var i = 0; i < argsLen; i++) {
					argsArray[i] = arguments[i];
				}

				return ctor.apply(this, argsArray);
			}
		};

		// superObjectには、メソッドとアクセサを直接ぶら下げる（コピーする）。
		// このsuperObjectは、extend(function(_super){}) のように引数で渡され、
		// _super.constructor.call(this); _super.myMethod.call(this); のように
		// call()（またはapply()）の形でのみ使用されることを意図したものである。
		// アクセサについては、superObjectを対象にdefinePropertyすればよい。
		// これによって、 extend()時に MyClass._super.prototype.myMethod.call();
		// が _super.myMethod.call(this, xxx); にできる。

		var newClass = new HifiveClass(classManager, classDescriptor, ctor, parentClass,
				superObject);

		ctor.prototype.__name = classDescriptor.name;
		ctor.prototype._class = newClass;

		// 親から辿ってデスクリプタの配列とフィールド一覧を作成する。
		var classes = [{
			descriptor: classDescriptor,
			ctor: ctor
		}];
		var members = {};
		if (parentClass) {
			var p = parentClass;
			do {
				classes.unshift({
					descriptor: p._descriptor,
					ctor: p._ctor
				});

				for ( var m in (p._descriptor.field || {})) {
					members[m] = 'field';
				}
				for ( var m in (p._descriptor.accessor || {})) {
					members[m] = 'accessor';
				}
				for ( var m in (p._descriptor.method || {})) {
					if (m !== 'constructor') {
						members[m] = 'method';
					}
				}
			} while (p = p._parentClass);
		}

		var fieldDesc = classDescriptor.field;
		var accessorDesc = classDescriptor.accessor;
		var methodDesc = classDescriptor.method;
		for ( var m in methodDesc) {
			if (m === 'constructor') {
				continue;
			}
			var method = methodDesc[m];
			if (typeof method !== 'function') {
				throwFwError(ERR_CODE_METHOD_MUST_BE_FUNCTION, [classDescriptor.name, m]);
			}
			// 重複チェック
			if ((typeof members[m] === 'string' && members[m] !== 'method')
					|| (fieldDesc && m in fieldDesc) || (accessorDesc && m in accessorDesc)) {
				throwFwError(ERR_CODE_DUPLICATE_PROP, [classDescriptor.name, m]);
			}
			ctor.prototype[m] = method;
		}

		if (fieldDesc) {
			for ( var f in fieldDesc) {
				if ((typeof members[f] === 'string' && members[f] !== 'field')
						|| (accessorDesc && f in accessorDesc) || (f in methodDesc)) {
					throwFwError(ERR_CODE_DUPLICATE_PROP, [classDescriptor.name, f]);
				}

				//インスタンスでフィールドを初期化せずに値を読みだした場合は
				//プロトタイプチェーンをたどって「null」が返るようにする
				//（プロトタイプオブジェクトでその名前のフィールドを(値=nullで)定義しておく）
				var fd = fieldDesc[f];
				var defaultValue = null;
				if (fd && fd.defaultValue !== undefined) {
					defaultValue = fd.defaultValue;
				}

				ctor.prototype[f] = defaultValue;
			}
		}

		if (accessorDesc) {
			if ('_class' in accessorDesc) {
				throwFwError(ERR_CODE_CANNOT_DEFINE_ROOT_CLASS_PROPS, [classDescriptor.name,
						'_class']);
			}

			for ( var propName in accessorDesc) {
				if ((typeof members[propName] === 'string' && members[propName] !== 'accessor')
						|| (fieldDesc && propName in fieldDesc) || (propName in methodDesc)) {
					throwFwError(ERR_CODE_DUPLICATE_PROP, [classDescriptor.name, propName]);
				}

				var ad = accessorDesc[propName];
				if (ad) {
					//アクセサとしてgetter, setter関数が書いてある場合
					Object.defineProperty(ctor.prototype, propName, {
						configurable: false,
						enumerable: true,
						get: ad.get,
						set: ad.set
					});
				} else {
					//アクセサの定義だけがある（getter, setterの関数は書かれていない）場合は
					//バッキングフィールド自動定義
					(function(pName) {
						Object.defineProperty(ctor.prototype, pName, {
							configurable: false,
							enumerable: true,
							get: function() {
								return this[PROPERTY_BACKING_STORE_PREFIX + pName];
							},
							set: function(value) {
								this[PROPERTY_BACKING_STORE_PREFIX + pName] = value;
							}
						});

						var defaultValue = null;
						if (ad && ad.defaultValue !== undefined) {
							defaultValue = ad.defaultValue;
						}

						//バッキングストアは暗黙的に作られるものなので
						//enumerable=falseで生成する
						Object.defineProperty(ctor.prototype,
								PROPERTY_BACKING_STORE_PREFIX + pName, {
									writable: true,
									configurable: false,
									enumerable: false,
									value: defaultValue
								});
					})(propName);
				}
			}
		}

		// SuperObjectにメソッドとアクセサをコピー
		classes
				.forEach(function(cls) {
					// メソッド
					if (cls.descriptor.method) {
						var methodDesc = cls.descriptor.method;
						for ( var m in methodDesc) {
							if (m !== 'constructor') {
								superObject[m] = methodDesc[m];
							}
						}
					}

					// アクセサ
					if (cls.descriptor.accessor) {
						var accessorDesc = cls.descriptor.accessor;
						for ( var propName in accessorDesc) {
							(function(pName) {
								var wrapper = {};
								var descriptor = Object.getOwnPropertyDescriptor(
										cls.ctor.prototype, pName);
								if (descriptor.get) {
									wrapper.get = descriptor.get;
								}
								if (descriptor.set) {
									wrapper.set = descriptor.set;
								}
								Object.freeze(wrapper);
								superObject[pName] = wrapper;
							})(propName);
						}
					}
				});
		Object.freeze(superObject);

		// static
		defineStaticMembers(newClass, classDescriptor);

		//全てが完了したら、このクラスのマネージャにクラスを登録する(getClass()でこのクラスオブジェクトを取得できるようになる)
		classManager._classMap[classDescriptor.name] = newClass;

		return newClass;
	}

	/**
	 * 静的メンバーを定義します。
	 *
	 * @private
	 * @param cls HifiveClassクラスオブジェクト
	 * @param descriptor クラスディスクリプタ
	 */
	function defineStaticMembers(cls, descriptor) {
		var fieldDescriptor = descriptor.staticField || {};
		var accessorDescriptor = descriptor.staticAccessor || {};
		var methodDescriptor = descriptor.staticMethod || {};
		var names = Object.keys(fieldDescriptor).concat(Object.keys(accessorDescriptor)).concat(
				Object.keys(methodDescriptor));

		// 名前チェック
		names.forEach(function(name) {
			validateStaticMemberName(name);
		});

		// 重複チェック
		var length = names.length;
		for (var i = 0; i < length - 1; i++) {
			for (var j = i + 1; j < length; j++) {
				if (names[i] === names[j]) {
					throwFwError(ERR_CODE_DUPLICATE_STATIC_PROP, [descriptor.name, names[i]]);
				}
			}
		}

		// 定義
		defineStaticFields(cls, fieldDescriptor);
		defineStaticAccessors(cls, accessorDescriptor);
		defineStaticMethods(cls, methodDescriptor);

		Object.seal(cls.statics);
	}

	/**
	 * 静的フィールドを定義します。
	 *
	 * @private
	 * @param cls HifveClassクラスオブジェクト
	 * @param fieldDescriptor フィールドディスクリプタ
	 */
	function defineStaticFields(cls, fieldDescriptor) {
		Object.keys(fieldDescriptor).forEach(function(name) {
			var field = fieldDescriptor[name];
			var defaultValue = field && 'defaultValue' in field ? field.defaultValue : null;
			var readOnly = field && field.isReadOnly === true;
			Object.defineProperty(cls._ctor, name, {
				enumerable: true,
				configurable: false,
				value: defaultValue,
				writable: !readOnly
			});

			var compatDescriptor = {
				enumerable: true,
				configurable: false,
				get: function() {
					return cls._ctor[name];
				}
			};
			if (!readOnly) {
				compatDescriptor.set = function(val) {
					cls._ctor[name] = val;
				};
			}
			Object.defineProperty(cls.statics, name, compatDescriptor);
		});
	}

	/**
	 * 静的アクセサを定義します。
	 *
	 * @private
	 * @param cls HifiveClassクラスオブジェクト
	 * @param accessorDescriptor アクセサディスクリプタ
	 */
	function defineStaticAccessors(cls, accessorDescriptor) {
		Object.keys(accessorDescriptor).forEach(function(name) {
			var accessor = accessorDescriptor[name];
			var descriptor = {
				enumerable: true,
				configurable: false
			};
			if (!accessor) {
				var backing = null;
				descriptor.get = function() {
					return backing;
				};
				descriptor.set = function(val) {
					backing = val;
				};
			} else {
				descriptor.get = accessor.get;
				descriptor.set = accessor.set;
			}

			Object.defineProperty(cls._ctor, name, descriptor);
			Object.defineProperty(cls.statics, name, descriptor);
		});
	}

	/**
	 * 静的メソッドを定義します。
	 *
	 * @private
	 * @param cls HifiveClassクラスオブジェクト
	 * @param methodDescriptor メソッドディスクリプタ
	 */
	function defineStaticMethods(cls, methodDescriptor) {
		Object.keys(methodDescriptor).forEach(function(name) {
			var method = methodDescriptor[name];
			if (typeof method !== 'function') {
				throwFwError(ERR_CODE_STATIC_METHOD_MUST_BE_FUNCTION, [cls.getFullName(), name]);
			}

			var descriptor = {
				enumerable: false,
				configurable: false,
				value: method,
				writable: false
			};
			Object.defineProperty(cls._ctor, name, descriptor);
			Object.defineProperty(cls.statics, name, descriptor);
		});
	}


	function HifiveClass(classManager, classDescriptor, ctor, parentClass, superObject) {
		this._descriptor = classDescriptor;
		this._ctor = ctor;
		this._parentClass = parentClass;
		this._isCtorChained = false;
		this._manager = classManager;
		this._superObject = superObject;

		Object.defineProperty(this, 'statics', {
			value: {},
			writable: false
		});
	}
	$.extend(HifiveClass.prototype, {
		extend: function(classDescriptor) {
			var clsDesc = classDescriptor;
			if (typeof classDescriptor === 'function') {
				clsDesc = classDescriptor(this._superObject);
			}

			var subClass = defineClass(this._manager, this, clsDesc);
			return subClass;
		},

		create: function() {
			if (this._descriptor.isAbstract === true) {
				throwFwError(ERR_CODE_CLASS_IS_ABSTRACT, this._descriptor.name);
			}

			var instance = Object.create(this._ctor.prototype);

			//ver.1.3.2まで、クラス定義にisDynamic: false（デフォルト：false）を指定すると、
			//インスタンス生成時にクラス定義で書かれているフィールドを
			//インスタンスにown-propertyとして作成し、各インスタンスに対してObject.seal()していた。
			//しかし、この処理に時間がかかるため、数が増えるとインスタンスの生成だけで
			//ある程度の時間がかかるようになってしまっていた。（特にIE11とFirefoxで速度が劣化する）
			//そのため、ver.1.3.3にて仕様変更し、isDynamicの設定は削除し、かつ、
			//インスタンス生成時にはフィールドの初期化は行わないようにした。
			//ただしこのため、isDynamic=trueの場合、一度も書き込みしていないフィールドは
			// instance.hasOwnProperty('fieldName')がfalseになる、という副作用がある。
			// (for-inループの場合は、prototypeオブジェクトにフィールドを定義してあるので列挙される
			// (自動生成されたアクセサ用バッキングストアを除く))

			//argumentsを配列化する処理はこのforループでこの場所で行うこと。
			//詳細はsuperObjectのconstructor参照。
			var argsLen = arguments.length;
			var argsArray = new Array(argsLen);
			for (var i = 0; i < argsLen; i++) {
				argsArray[i] = arguments[i];
			}

			//コンストラクタ実行
			this._ctor.apply(instance, argsArray);

			if (this._isCtorChained === false) {
				//クラスのコンストラクタ実行後、RootClassのコンストラクタまで実行されていない
				//= _super.constructor.call();が途中で途切れている場合はエラーにする
				throwFwError(ERR_CODE_CTOR_NOT_CHAINED, this._descriptor.name);
			}

			return instance;
		},

		getDescriptor: function() {
			return this._descriptor;
		},

		getParentClass: function() {
			return this._parentClass;
		},

		getFullName: function() {
			return this._descriptor.name;
		},

		isClassOf: function(obj) {
			var ret = obj instanceof this._ctor;
			return ret;
		},

		getManager: function() {
			return this._manager;
		}
	});

	/**
	 * ルートクラス定義。
	 *
	 * @private
	 */
	var ROOT_CLASS_DESC = {
		name: 'h5.cls.RootClass',

		method: {
			constructor: function HifiveRootObject() {
				//ルートクラスなので、"super.constructor.call()"は不要
				this._class._isCtorChained = true;
			},
			getClass: function() {
				return this._class;
			}
		}
	};

	function HifiveClassManager() {
		this._rootClass = null;
		// クラス名(FQCN) -> クラスオブジェクト　のマップ
		this._classMap = {};

		this._rootClass = defineClass(this, null, ROOT_CLASS_DESC);
	}
	$.extend(HifiveClassManager.prototype, {
		/**
		 * このマネージャで管理されているルートクラスを取得します。
		 *
		 * @memberOf h5.cls.HifiveClassManager
		 */
		getRootClass: function() {
			return this._rootClass;
		},

		/**
		 * 指定された名前のクラスオブジェクトを取得します。戻り値のクラスのインスタンスを生成する場合は ret.create() のようにします。
		 * 指定された名前のクラスが存在しない場合は例外が発生します。
		 *
		 * @param fqcn 完全修飾クラス名
		 * @returns {HifiveClass} クラスオブジェクト
		 */
		getClass: function(fqcn) {
			var cls = this._classMap[fqcn];
			if (!cls) {
				// #599 クラスがなかった場合は例外を発生させる
				throwFwError(ERR_CODE_CLASS_NOT_FOUND, fqcn);
			}
			return cls;
		},

		/**
		 * 指定された名前空間に属するクラスをそのクラス名をキーとして保持するオブジェクトを返します。
		 *
		 * @param {String} namespace 名前空間
		 * @returns 名前空間オブジェクト
		 */
		getNamespaceObject: function(namespace) {
			if (!namespace) {
				throwFwError(ERR_CODE_INVALID_NAMESPACE);
			}

			var ns = namespace + '.';

			var ret = {};

			var classMap = this._classMap;
			var namespaceLen = ns.length;

			for ( var fqcn in classMap) {
				if (fqcn.lastIndexOf(ns, 0) === 0 && fqcn.indexOf('.', namespaceLen) === -1) {
					var simpleName = fqcn.substr(namespaceLen);
					ret[simpleName] = classMap[fqcn];
				}
			}

			return ret;
		}
	});


	var defaultClassManager = new HifiveClassManager();
	var RootClass = defaultClassManager.getRootClass();

	h5.u.obj.expose('h5.cls', {
		manager: defaultClassManager,
		RootClass: RootClass
	});


})();
