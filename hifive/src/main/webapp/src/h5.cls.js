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

	var ERR_CONSTRUCTOR_CHAIN = '親クラスのコンストラクタ呼び出しが途中で行われていません。継承関係のあるすべてのクラスのコンストラクタの先頭で Foo._super.call(this) のような親コンストラクタの呼び出しが行われていることを確認してください。';
	var ERR_CANNOT_DEFINE_ROOT_CLASS_PROPERTY = '親クラスで定義されているプロパティは再定義できません。';

	var PROPERTY_BACKING_STORE_PREFIX = '_p_';

	function setupProperty(instance, propertyDesc, parentClass) {
		var parentCls = parentClass.getParentClass();
		if (parentCls) {
			setupProperty(instance, parentCls.getDescriptor().property, parentCls);
		}
		initProperty(instance, propertyDesc);
	}

	function initProperty(instance, propertyDescriptor) {
		if (!propertyDescriptor) {
			return;
		}

		for ( var propName in propertyDescriptor) {
			var desc = propertyDescriptor[propName];
			var defaultValue = null;
			if (desc && desc.defaultValue !== undefined) {
				defaultValue = desc.defaultValue;
			}

			//TODO バリデータセット(type, constraint)
			if (desc && (desc.isAccessor === true)) {
				Object.defineProperty(instance, PROPERTY_BACKING_STORE_PREFIX + propName, {
					writable: true,
					configurable: false,
					enumerable: false,
					value: defaultValue
				});
			} else {
				instance[propName] = defaultValue;
			}
		}
	}

	function defineClass(parentClass, classDescriptor) {
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

		var newClass = new HifiveClassDescriptor(classDescriptor, ctor, parentClass);

		ctor.prototype.__name = classDescriptor.name;
		ctor.prototype._class = newClass;

		for ( var m in classDescriptor.method) {
			if (m === 'constructor') {
				continue;
			}
			ctor.prototype[m] = classDescriptor.method[m];
		}

		var propDesc = classDescriptor.property;
		if (propDesc) {
			if ('_class' in propDesc) {
				//TODO ルートクラスで必ず定義されるプロパティを再定義しようとしていないかチェック(汎化)
				throw new Error(ERR_CANNOT_DEFINE_ROOT_CLASS_PROPERTY + 'プロパティ名=' + '_class');
			}

			for ( var propName in propDesc) {
				var pd = propDesc[propName];
				if (pd && pd.isAccessor === true) {
					if (pd.isReadOnly === true) {
						(function(p) {
							Object.defineProperty(ctor.prototype, propName, {
								configurable: false,
								enumerable: true,
								get: function() {
									return this[PROPERTY_BACKING_STORE_PREFIX + p];
								},
								set: function(value) {
									throw new Error('このプロパティは読み取り専用です。property=' + p + ', value='
											+ value);
								}
							});
						})(propName);
					} else {
						(function(p) {
							Object.defineProperty(ctor.prototype, propName, {
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
		}

		return newClass;
	}


	function HifiveClassDescriptor(classDescriptor, ctor, parentClass) {
		this._descriptor = classDescriptor;
		this._ctor = ctor;
		this._parentClass = parentClass;
		this._isCtorChained = false;
	}
	$.extend(HifiveClassDescriptor.prototype, {
		extend: function(classDescriptor) {
			var clsDesc = classDescriptor;
			if (typeof classDescriptor === 'function') {
				clsDesc = classDescriptor();
			}

			var subClass = defineClass(this, clsDesc);
			return subClass;
		},

		create: function() {
			var argsArray = Array.prototype.slice.call(arguments, 0);
			var instance = Object.create(this._ctor.prototype);

			setupProperty(instance, this._descriptor.property, this._parentClass);

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

	var RootClass = defineClass(null, rootClassDesc);

	h5.u.obj.expose('h5.cls', {
		RootClass: RootClass
	});


})();
