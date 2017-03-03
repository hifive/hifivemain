/*
 * Copyright (C) 2016 NS Solutions Corporation
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
	//TODO setupPropertyで、DescをObjectとして作成してdefineProperty()をまとめて一度だけ呼ぶようにする

	var ERR_CONSTRUCTOR_CHAIN = '親クラスのコンストラクタ呼び出しが途中で行われていません。継承関係のあるすべてのクラスのコンストラクタの先頭で Foo._super.call(this) のような親コンストラクタの呼び出しが行われていることを確認してください。';
	var ERR_CANNOT_DEFINE_ROOT_CLASS_PROPERTY = '親クラスで定義されているプロパティは再定義できません。';
	var ERR_CLASS_IS_ABSTRACT = 'このクラスは抽象クラスです。インスタンスを生成することはできません。';
	var ERR_METHOD_MUST_BE_FUNCTION = 'クラスディスクリプタのmethodには、関数以外は指定できません。';
	var ERR_ROOT_CLASS_IS_ALREADY_DEFINED = 'このマネージャのルートクラスは既に定義済みです。ルートクラスを取得したい場合はgetRootClass()を、ルートクラスを継承した子クラスを定義したい場合はクラスのextend()メソッドを呼び出してください。';
	var ERR_DUPLICATE_MEMBER = 'メンバーの名前 "{0}" が重複しています。';
	var ERR_STATIC_PRESERVED_MEMBER = '静的メンバーの名前 "{0}" は使用できません。';
	var ERR_STATIC_DUPLICATE_MEMBER = '静的メンバーの名前 "{0}" が重複しています。';
	var ERR_STATIC_METHOD_MUST_BE_FUNCTION = 'クラスディスクリプタのmethodには、関数以外は指定できません。';

	var PROPERTY_BACKING_STORE_PREFIX = '_p_';

	/**
	 * JavaScriptのFunction上の予約語
	 */
	var JS_PRESERVED_NAMES = ['length', 'name', 'displayName', 'arguments', 'prototype', 'caller'];
	/**
	 * h5clsのクラスオブジェクトの予約語
	 */
	var H5_PRESERVED_NAMES = ['extend', 'getClass'];
	var STATIC_PRESERVED_NAMES = JS_PRESERVED_NAMES.concat(H5_PRESERVED_NAMES);


	function setupProperty(instance, klass) {
		var parentClass = klass.getParentClass();
		if (parentClass) {
			setupProperty(instance, parentClass);
		}
		initProperty(instance, klass.getDescriptor());
	}

	function initProperty(instance, classDescriptor) {
		//通常のフィールドを定義
		var fieldDesc = classDescriptor.field;
		if (fieldDesc) {
			for ( var fieldName in fieldDesc) {
				var fd = fieldDesc[fieldName];
				var defaultValue = null;
				if (fd && fd.defaultValue !== undefined) {
					defaultValue = fd.defaultValue;
				}
				instance[fieldName] = defaultValue;
			}
		}

		//アクセサプロパティ(getter/setter)のバッキングストアを定義
		//ただし、get, setを独自に定義している場合は作成しない
		//(ユーザーはバッキングストアとして使用するフィールドをfieldで定義しておく必要がある)
		var accessorDesc = classDescriptor.accessor;
		if (accessorDesc) {
			for ( var accessorName in accessorDesc) {
				var ad = accessorDesc[accessorName];
				var defaultValue = null;
				if (ad && ad.defaultValue !== undefined) {
					defaultValue = ad.defaultValue;
				}

				if (ad == null) {
					//TODO バリデータセット(type, constraint)
					Object.defineProperty(instance, PROPERTY_BACKING_STORE_PREFIX + accessorName, {
						writable: true,
						configurable: false,
						enumerable: false,
						value: defaultValue
					});
				}
			}
		}
	}

	/**
	 * 静的メンバーの名前が使用可能かどうかをチェックします。NG名だった場合は例外を投げます。
	 *
	 * @param {String} name メンバー名
	 * @throws Error
	 */
	function validateStaticMemberName(name) {
		STATIC_PRESERVED_NAMES.forEach(function(n) {
			if (name === n) {
				throw new Error(h5.u.str.format(ERR_STATIC_PRESERVED_MEMBER, name));
			}
		});
	}

	function defineClass(classManager, parentClass, classDescriptor) {
		if (!classDescriptor || !classDescriptor.name) {
			//TODO throwFwError()にする
			throw new Error('classDescritporがない、またはnameがありません。');
		}
		if (!classDescriptor.method || !classDescriptor.method.constructor) {
			throw new Error('classDescritporのメソッド定義にconstructor定義がありません。');
		}

		var ctor = classDescriptor.method.constructor;

		//親クラスが指定されていれば、プロトタイプを継承する
		if (parentClass) {
			//Class._ctorは必ず存在する(constructorが必須だから)
			ctor.prototype = Object.create(parentClass._ctor.prototype);
			ctor.prototype.constructor = ctor;
			ctor._super = parentClass._ctor;
		} else {
			//親クラスがない場合、何もしないコンストラクタをセット
			ctor._super = function() {
			//do nothing
			};
		}

		var superObject = {
			constructor: function() {
				var argsArray = Array.prototype.slice.call(arguments, 0);
				return ctor.apply(this, argsArray);
			}
		};

		// superObject、メソッドとアクセサを直接ぶら下げる（コピーする）。
		// このsuperObjectは、extend(function(_super){}) のように引数で渡され、
		// _super.constructor.call(this); _super.myMethod.call(this); のように
		// call()（またはapply()）の形でのみ使用されることを意図したものである。
		// 従い、下記ループ中では　superObject.myMethod = myMethodFunc; のように
		// 単純にコピーしていけばよい。
		// アクセサについては、superObjectを対象にdefinePropertyすればよい。
		// これによって、 extend()時に MyClass._super.prototype.myMethod.call();
		// が _super.myMethod.call(this, xxx); にできる。
		// なお、直近の広報互換性のため、下記のnewClass._superの代入は残しておくこと。

		var newClass = new HifiveClass(classManager, classDescriptor, ctor, parentClass,
				superObject);

		//クラスディスクリプタ記述時、constructor: function() MyClass {} のように
		//名前付き関数で書くことが推奨であり、この場合
		// var MyClass = Class.extend({ constructor: function MyClass(){ MyClass._super.call(this) } });
		//のコンストラクタ内のMyClassが指すのはコンストラクタ関数自身である。
		//しかし、コンストラクタを匿名関数にした場合、
		//（var MyClass = Class.extend({ constructor: function(){ MyClass._super.call(this) } });
		//のように書かれた場合をイメージ）
		//その時にコンストラクタ内で参照されるのは変数のMyClassになる。
		//そのような場合にも正しくスーパークラスのコンストラクタを呼び出せるよう
		//Classインスタンスの_super変数にも親クラスのコンストラクタをセットしておく。
		newClass._super = ctor._super;

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
			}
			while (p = p._parentClass);
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
				throw new Error(ERR_METHOD_MUST_BE_FUNCTION + 'メソッド=' + classDescriptor.name + '.'
						+ m); //TODO throwFwError()
			}
			// 重複チェック
			if ((typeof members[m] === 'string' && members[m] !== 'method') ||
				(fieldDesc && m in fieldDesc) ||
				(accessorDesc && m in accessorDesc)) {
				throw new Error(h5.u.str.format(ERR_DUPLICATE_MEMBER, m));
			}
			ctor.prototype[m] = method;
		}

		if (fieldDesc) {
			for ( var f in fieldDesc) {
				if ((typeof members[f] === 'string' && members[f] !== 'field') ||
					(accessorDesc && f in accessorDesc) ||
					(f in methodDesc)) {
					throw new Error(h5.u.str.format(ERR_DUPLICATE_MEMBER, f));
				}
			}
		}

		if (accessorDesc) {
			if ('_class' in accessorDesc) {
				//TODO ルートクラスで必ず定義されるプロパティを再定義しようとしていないかチェック(汎化)
				throw new Error(ERR_CANNOT_DEFINE_ROOT_CLASS_PROPERTY + 'プロパティ名=' + '_class');
			}

			for ( var propName in accessorDesc) {
				if ((typeof members[propName] === 'string' && members[propName] !== 'accessor') ||
					(fieldDesc && propName in fieldDesc) ||
					(propName in methodDesc)) {
					throw new Error(h5.u.str.format(ERR_DUPLICATE_MEMBER, propName));
				}

				var ad = accessorDesc[propName];
				if (ad) {
					//アクセサとしてgetter, setter関数が書いてある場合
					//TODO この即時関数を関数化
					(function(p) {
						Object.defineProperty(ctor.prototype, p, {
							configurable: false,
							enumerable: true,
							get: ad.get,
							set: ad.set
						});
					})(propName);
				} else {
					//アクセサだけ定義がある場合
					//TODO propertyChangeイベントをあげるアクセサをデフォルトでセットする
					(function(p) {
						Object.defineProperty(ctor.prototype, p, {
							configurable: false,
							enumerable: true,
							get: function() {
								return this[PROPERTY_BACKING_STORE_PREFIX + p];
							},
							set: function(value) {
								this[PROPERTY_BACKING_STORE_PREFIX + p] = value;
							}
						});
					})(propName);
				}
			}
		}

		// SuperObjectにメソッドとアクセサをコピー
		classes.forEach(function(cls) {
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
					(function(propName) {
						var wrapper = {};
						var descriptor = Object.getOwnPropertyDescriptor(cls.ctor.prototype, propName);
						if (descriptor.get) {
							wrapper.get = descriptor.get;
						}
						if (descriptor.set) {
							wrapper.set = descriptor.set;
						}
						Object.freeze(wrapper);
						superObject[propName] = wrapper;
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
					throw new Error(h5.u.str.format(ERR_STATIC_DUPLICATE_MEMBER, names[i]));
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
				}
			}
			Object.defineProperty(cls.statics, name, compatDescriptor);
		});
	}

	/**
	 * 静的アクセサを定義します。
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
	 */
	function defineStaticMethods(cls, methodDescriptor) {
		Object.keys(methodDescriptor).forEach(
				function(name) {
					var method = methodDescriptor[name];
					if (typeof method !== 'function') {
						throw new Error(ERR_STATIC_METHOD_MUST_BE_FUNCTION + 'メソッド=' + cls.getFullName()
								+ '.' + name);
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
				//TODO throwFwError
				throw new Error(ERR_CLASS_IS_ABSTRACT);
			}

			var argsArray = Array.prototype.slice.call(arguments, 0);
			var instance = Object.create(this._ctor.prototype);

			//プロパティの初期化（追加）
			setupProperty(instance, this);

			//明示的に拡張可能(dynamic)と指定されない限り、プロパティの追加・削除・設定変更を禁止
			//TODO いずれかの親クラスでisDynamicが明示的にfalseに指定されたら、再度trueにはできないようにすべきか？
			if (this._descriptor.isDynamic !== true) {
				Object.seal(instance);
			}

			//コンストラクタ実行
			this._ctor.apply(instance, argsArray);

			if (this._isCtorChained === false) {
				//RootClassのコンストラクタまで実行されていなければエラーにする
				throw new Error(ERR_CONSTRUCTOR_CHAIN);
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

	function HifiveClassManager() {
		this._rootClass = null;
		// クラス名(FQCN) -> クラスオブジェクト　のマップ
		this._classMap = {};
	}
	$.extend(HifiveClassManager.prototype, {
		/**
		 * @memberOf h5.cls.HifiveClassManager
		 */
		defineRootClass: function(classDescriptor) {
			if (this._rootClass) {
				throw new Error(ERR_ROOT_CLASS_IS_ALREADY_DEFINED);
			}

			this._rootClass = defineClass(this, null, classDescriptor);
			return this._rootClass;
		},
		getRootClass: function() {
			return this._rootClass;
		},
		getClass: function(name) {
			var cls = this._classMap[name];
			//undefinedではなくnullを返す(設計ポリシー)
			cls = cls === undefined ? null : cls;
			return cls;
		},

		/**
		 * 指定された名前空間に属するクラスをそのクラス名をキーとして保持するオブジェクトを返します。
		 *
		 * @param namespace
		 */
		getNamespaceObject: function(namespace) {
		// TODO namespace objectを返す
		}
	});

	var rootClassDesc = {
		name: 'h5.cls.RootClass',
		method: {
			constructor: function HifiveRootObject() {
				HifiveRootObject._super.call(this);
				this._class._isCtorChained = true;
			},
			getClass: function() {
				return this._class;
			}
		}
	};

	var defaultClassManager = new HifiveClassManager();
	defaultClassManager.defineRootClass(rootClassDesc);

	var RootClass = defaultClassManager.getRootClass();

	h5.u.obj.expose('h5.cls', {
		manager: defaultClassManager,
		RootClass: RootClass
	});


})();
