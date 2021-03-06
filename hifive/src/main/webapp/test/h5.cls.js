/*
 * Copyright (C) 2012-2017 NS Solutions Corporation
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

$(function() {
	'use strict';

	// =========================================================================
	//
	// Constants
	//
	// =========================================================================

	var JS_PRESERVED_NAMES = ['length', 'name', 'displayName', 'arguments', 'prototype', 'caller'];
	var H5_PRESERVED_NAMES = ['extend', 'getClass'];

	// =========================================================================
	//
	// Privates
	//
	// =========================================================================

	//=============================
	// Variables
	//=============================

	var g = {};

	//=============================
	// Functions
	//=============================

	// =========================================================================
	//
	// Test Module
	//
	// =========================================================================

	//=============================
	// Definition
	//=============================

	module("ClassDescriptorの必須項目");

	//=============================
	// Body
	//=============================

	test('ClassDescriptorの最小構成', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok(!!obj, 'nameとconstructor、親コンストラクタ呼び出しでクラス定義、クラス生成にエラーが発生しない。');
	});

	test('name', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {};
			});
		}, 'Descriptorにnameが無いとエラー。');
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: ''
				};
			});
		}, 'Descriptorのnameが空文字だとエラー。');
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: null
				};
			});
		}, 'Descriptorのnameがnullだとエラー。');
	});

	test('constructor', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {}
				};
			});
		}, function(err) {
			return err.code === 18002;
		}, 'クラス定義にmethod.constructorが無い場合、エラーオブジェクトのコードが18002であること');

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass'
				};
			});
		}, function(err) {
			return err.code === 18002;
		}, 'クラス定義にmethodが無い場合、エラーオブジェクトのコードが18002であること');

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: null
					}
				};
			}, /.*constructor.*/, 'method->constructorがnullだとエラー。');
		});

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: 'not good'
					}
				};
			}, TypeError, 'method->constructorが関数以外だとエラー。');
		});

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: null
					}
				};
			}, /.*constructor.*/, 'method->constructorがnullだとエラー。');
		});
	});

	test('親コンストラクタ', function() {
		throws(function() {
			var cls = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: function TestClass() {
						// Do nothing
						}
					}
				};
			});
			ok(true, '親コンストラクタ呼び出しを書かなくても定義自体にエラーは発生しない。');

			cls.create();
		}, '親コンストラクタを呼び出さないとエラー。');
	});

	//=============================
	// Definition
	//=============================

	module("FieldDescriptor");

	//=============================
	// Body
	//=============================

	test('FieldDescriptorがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: null,
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok(!!obj, 'FieldDescriptorをnullで定義してもエラーにはならない。');
	});

	test('FieldDescriptorが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok(!!obj, 'FieldDescriptorを空オブジェクトで定義してもエラーにはならない。');
	});

	test('fieldがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok('_field1' in obj, 'nullで定義するとフィールドが定義されていること。');
		equal(obj._field1, null, 'nullで定義されたフィールドのデフォルト値はnullであること。');
	});

	test('fieldが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: {}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok('_field1' in obj, 'nullで定義するとフィールドが定義されていること。');
		equal(obj._field1, null, 'nullで定義されたフィールドのデフォルト値はnullであること。');
	});

	test('fieldのデフォルト値', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: {
						defaultValue: 'default value'
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		equal(obj._field1, 'default value', 'defaultValueで定義した値が設定されていること。');
	});

	test('fieldの読み書き', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		equal(obj._field1, null, 'fieldの初期値がnullであること。');

		obj._field1 = 'update value';
		equal(obj._field1, 'update value', 'fieldの値が更新できること。');
	});

	test('fieldのインスタンス毎の分離', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		var obj1 = cls.create();
		var obj2 = cls.create();

		equal(obj1._field1, null, 'obj1._field1のデフォルト値がnullであること。');
		equal(obj2._field1, null, 'obj2._field1のデフォルト値がnullであること。');

		obj1._field1 = 'obj1';
		obj2._field1 = 'obj2';

		equal(obj1._field1, 'obj1', 'fieldの値が別々に更新できること。');
		equal(obj2._field1, 'obj2', 'fieldの値が別々に更新できること。');
	});

	//=============================
	// Definition
	//=============================

	module("AccessorDescriptor");

	//=============================
	// Body
	//=============================

	test('AccessorDescriptorがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: null,
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok(!!obj, 'AccessorDescriptorをnullで定義してもエラーにはならない。');
	});

	test('AccessorDescriptorが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok(!!obj, 'AccessorDescriptorを空オブジェクトで定義してもエラーにはならない。');
	});

	test('accessorがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok('prop1' in obj, 'nullで定義するとプロパティが定義されていること。');
		equal(obj.prop1, null, 'nullで定義されたプロパティのデフォルト値はnullであること。');

		obj.prop1 = 'update value';
		equal(obj.prop1, 'update value', 'nullで定義されたプロパティの読み書きができること。');
	});

	test('accessorが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: {}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		ok('prop1' in obj, '空オブジェクトで定義するとプロパティが定義されていること。');
		equal(obj.prop1, null, '空オブジェクトで定義されたプロパティのデフォルト値はnullであること。');

		throws(function() {
			obj.prop1 = 'update value';
		}, TypeError, '空オブジェクトで定義されたプロパティは値が設定できないこと。');
	});

	test('getter', function() {
		var value = 'value';

		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: {
						get: function() {
							return value;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		equal(obj.prop1, 'value', 'プロパティから値が取得できること。');

		value = 1;
		equal(obj.prop1, 1, 'プロパティから値が取得できること。');

		throws(function() {
			obj.prop1 = 'update value';
		}, TypeError, 'setterを定義していないプロパティは値が設定できないこと。');
	});

	test('setter', function() {
		var value = 'value';

		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: {
						set: function(val) {
							value = val;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		equal(value, 'value', 'valueの値（更新前）');

		obj.prop1 = 1;
		equal(value, 1, 'プロパティから値が更新できること。');

		ok(obj.prop1 === undefined, 'getterを定義していないプロパティは値が取得できないこと。');
	});

	test('getter/setter', function() {
		var value = 'value';

		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: {
						get: function() {
							return value;
						},
						set: function(val) {
							value = val;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();

		obj.prop1 = 1;
		equal(value, 1, 'プロパティから値が更新できること。');
		equal(obj.prop1, 1, 'プロパティから値が取得できること。');
	});

	test('AutoPropertyのインスタンス毎の分離', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		var obj1 = cls.create();
		var obj2 = cls.create();

		equal(obj1.field1, null, 'obj1.field1のデフォルト値がnullであること。');
		equal(obj2.field1, null, 'obj2.field1のデフォルト値がnullであること。');

		obj1.prop1 = 'obj1';
		obj2.prop1 = 'obj2';

		equal(obj1.prop1, 'obj1', 'インスタンス毎に値が設定できること。');
		equal(obj2.prop1, 'obj2', 'インスタンス毎に値が設定できること。');
	});

	//=============================
	// Definition
	//=============================

	module("MethodDescriptor (Constructor)");

	//=============================
	// Body
	//=============================

	test('コンストラクタコール', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				accessor: {
					prop1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
						ok(true, 'コンストラクタが呼ばれていること。');
					}
				}
			};
		});

		cls.create();
		expect(1);
	});

	test('コンストラクタ内の初期化', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				accessor: {
					prop1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
						ok(true, 'コンストラクタが呼ばれていること。');
						this._field1 = 'field';
						this.prop1 = 'prop';
					}
				}
			};
		});

		var obj = cls.create();
		equal(obj._field1, 'field', 'コンストラクタ内でフィールドが初期化できること。');
		equal(obj.prop1, 'prop', 'コンストラクタ内でプロパティが初期化できること。');
		expect(3);
	});

	test('コンストラクタ引数', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					prop1: null,
					prop2: null
				},
				method: {
					constructor: function TestClass(arg1, arg2) {
						_super.constructor.call(this);
						this.prop1 = arg1;
						this.prop2 = arg2;
					}
				}
			};
		});

		var obj1 = cls.create();
		ok(obj1.prop1 === undefined, '引数を指定しないとundefinedでエラーが発生しないこと。');
		ok(obj1.prop2 === undefined, '引数を指定しないとundefinedでエラーが発生しないこと。');

		var obj2 = cls.create('prop1');
		equal(obj2.prop1, 'prop1', '引数が取得できること。');
		ok(obj2.prop2 === undefined, '引数が不足していてもundefinedでエラーが発生しないこと。');

		var obj3 = cls.create('prop1', 'prop2');
		equal(obj3.prop1, 'prop1', '引数が取得できること。');
		equal(obj3.prop2, 'prop2', '引数が取得できること。');

		var obj4 = cls.create('prop1', 'prop2');
		equal(obj4.prop1, 'prop1', '引数が取得できること、エラーが発生しないこと。');
		equal(obj4.prop2, 'prop2', '引数が取得できること、エラーが発生しないこと。');
	});

	//=============================
	// Definition
	//=============================

	module('MethodDescriptor');

	//=============================
	// Body
	//=============================

	test('メソッドの定義', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					},
					method1: function() {
						ok(true, 'メソッドが呼び出されていること。');
					}
				}
			};
		});

		var obj = cls.create();
		obj.method1();
		expect(1);
	});

	test('メソッドからのフィールド、プロパティアクセス', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					_field1: null
				},
				accessor: {
					prop1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					},
					method1: function() {
						ok(true, 'メソッドが呼び出されていること。');
						this._field1 = 'field1';
						this.prop1 = 'prop1';
					}
				}
			};
		});

		var obj = cls.create();
		obj.method1();
		equal(obj._field1, 'field1', 'メソッド内からフィールドへアクセスできること。');
		equal(obj.prop1, 'prop1', 'メソッド内からプロパティへアクセスできること。');
	});

	test('function以外を定義', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						},
						method1: null
					}
				};
			});
		}, 'メソッドにnullを定義するとエラーが発生すること。');
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						},
						method1: 'not good'
					}
				};
			});
		}, 'メソッドに関数以外を定義するとエラーが発生すること。');
	});

	test('Objectのメソッドをオーバーライド', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					},
					toString: function() {
						return 'TestClass!!';
					}
				}
			};
		});
		var obj = cls.create();
		equal(obj.toString(), 'TestClass!!', 'エラーとならないこと。');
	});

	//=============================
	// Definition
	//=============================

	module('メンバーの重複');

	//=============================
	// Body
	//=============================

	test('fieldとaccessorの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					field: {
						dup: null
					},
					accessor: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldとaccessorの重複はエラーになること。');
	});

	test('fieldとmethodの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					field: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						},
						dup: function() {
						// Do nothing
						}
					}
				};
			});
		}, Error, 'fieldとmethodの重複はエラーになること。');

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					field: {
						constructor: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldにconstructorを定義するとエラーになること。');
	});

	test('accessorとmethodの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					accessor: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						},
						dup: function() {
						// Do nothing
						}
					}
				};
			});
		}, Error, 'accessorとmethodの重複はエラーになること。');

		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					accessor: {
						constructor: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'accessorにconstructorを定義するとエラーになること。');
	});

	//=============================
	// Definition
	//=============================

	module('メンバーと親クラスのメンバーの重複', {
		setup: function() {
			g.ParentClass = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'ParentClass',
					field: {
						f1: null
					},
					accessor: {
						p1: null
					},
					method: {
						constructor: function ParentClass() {
							_super.constructor.call(this);
						},
						m1: function() {
						// Do nothing
						}
					}
				};
			});
		},
		teardown: function() {
			delete g.ParentClass;
		}
	});

	//=============================
	// Body
	//=============================

	test('fieldが重複', function() {
		(function() {
			var cls = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					field: {
						f1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
			cls.create();
			ok(true, 'fieldと親fieldの重複はエラーにならないこと。');
		})();

		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					field: {
						p1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldと親accessorの重複はエラーになること。');

		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					field: {
						m1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldと親methodの重複はエラーになること。');
	});

	test('accessorが重複', function() {
		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					accessor: {
						f1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'accessorと親fieldの重複はエラーになること。');

		(function() {
			var cls = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					accessor: {
						p1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
			cls.create();
			ok(true, 'accessorと親accessorの重複はエラーにならないこと。');
		})();

		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					accessor: {
						m1: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'accessorと親methodの重複はエラーになること。');
	});

	test('methodが重複', function() {
		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						},
						f1: function() {
						// Do nothing
						}
					}
				};
			});
		}, Error, 'methodと親fieldの重複はエラーになること。');

		throws(function() {
			g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						},
						p1: function() {
						// Do nothing
						}
					}
				};
			});
		}, Error, 'methodと親methodの重複はエラーになること。');

		(function() {
			var cls = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						},
						m1: function() {
						// Do nothing
						}
					}
				};
			});
			cls.create();
			ok(true, 'methodと親methodの重複はエラーにならないこと。');
		})();
	});

	//=============================
	// Definition
	//=============================

	module('メンバーとstaticメソッドの重複');

	//=============================
	// Body
	//=============================

	test('fieldとstaticメソッドの重複', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				field: {
					create: null,
					getParentClass: null,
					isClassOf: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		cls.create();
		ok(true, 'エラーにならないこと。');
	});

	test('accessorとstaticメソッドの重複', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				accessor: {
					create: null,
					getParentClass: null,
					isClassOf: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		cls.create();
		ok(true, 'エラーにならないこと。');
	});

	test('methodとstaticメソッドの重複', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					},
					create: function() {
					// Do nothing
					},
					getParentClass: function() {
					// Do nothing
					},
					isClassOf: function() {
					// Do nothing
					}
				}
			};
		});
		cls.create();
		ok(true, 'エラーにならないこと。');
	});

	//=============================
	// Definition
	//=============================

	module('クラスの継承', {
		setup: function() {
			g.ParentClass = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'ParentClass',
					field: {
						_field1: null
					},
					accessor: {
						prop1: null,
						accessor1: {
							get: function() {
								return this._field1;
							},
							set: function(val) {
								this._field1 = val;
							}
						},
						accessor2: {
							get: function() {
								return this._field1;
							}
						},
						accessor3: {
							set: function(val) {
								this._field1 = val;
							}
						}
					},
					method: {
						constructor: function ParentClass(field, prop) {
							_super.constructor.call(this);
							ok(true, '親コンストラクタの呼び出し。');
							this._field1 = field || 'field1';
							this.prop1 = prop || 'prop1';
						},
						method1: function() {
							return this._field1 + ' ' + this.prop1;
						}
					}
				};
			});
		},
		teardown: function() {
			delete g.ParentClass;
		}
	});

	//=============================
	// Body
	//=============================

	test('_superオブジェクト', function() {
		g.ParentClass.extend(function(_super) {
			ok(Object.isFrozen(_super), '変更できないオブジェクトであること。');
			equal(typeof _super.constructor, 'function', 'コンストラクタが定義されていること。');
			equal(typeof _super.method1, 'function', '親クラスのメソッドが定義されていること。');
			ok(!('_field1' in _super), '親クラスのフィールドは定義されていないこと。');
			equal(typeof _super.prop1, 'object', '親クラスのAutoPropertyが定義されていること。');
			ok(Object.isFrozen(_super.prop1), 'プロパティは変更できないオブジェクトとであること。');
			equal(typeof _super.prop1.get, 'function', 'プロパティのgetterが定義されていること。');
			equal(typeof _super.prop1.set, 'function', 'プロパティのsetterが定義されていること。');
			equal(typeof _super.accessor1.get, 'function', 'プロパティのgetterが定義されていること。');
			equal(typeof _super.accessor1.set, 'function', 'プロパティのsetterが定義されていること。');
			equal(typeof _super.accessor2.get, 'function', 'プロパティのgetterが定義されていること。');
			ok(!('set' in _super.accessor2), 'プロパティのsetterが定義されていないこと。');
			ok(!('get' in _super.accessor3), 'プロパティのgetterが定義されていないこと。');
			equal(typeof _super.accessor3.set, 'function', 'プロパティのsetterが定義されていること。');

			return {
				name: 'ChildClass',
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					}
				}
			};
		});
		expect(14);
	});

	test('親コンストラクタの呼び出し', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					}
				}
			};
		});
		var obj1 = cls.create('c1', 'c2');
		equal(obj1._field1, 'c1', '親コンストラクタでフィールドに値が設定されること。');
		equal(obj1.prop1, 'c2', '親コンストラクタでプロパティに値が設定されること。');
		expect(3);
	});

	test('親コンストラクタを呼び出さない', function() {
		throws(function() {
			var cls = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					method: {
						constructor: function ChildClass(field, prop) {
						// Do nothing
						}
					}
				};
			});
			cls.create('c1', 'c2');
		}, '親コンストラクタを呼び出さないとエラーが発生すること。');
	});

	test('フィールドの追加', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				field: {
					_field2: null
				},
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					}
				}
			};
		});
		var p = g.ParentClass.create();
		ok(!('_field2' in p), 'フィールドの追加は親クラスに影響しないこと。');

		var c = cls.create();
		ok('_field2' in c, '子クラスでフィールドが追加できること。');
		c._field2 = 'field2';
		equal(c._field2, 'field2', '子クラスで追加したフィールドの読み書きができること。');
	});

	test('プロパティの追加', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				accessor: {
					prop2: null
				},
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					}
				}
			};
		});

		var p = g.ParentClass.create();

		equal(typeof p.prop2, 'undefined', '子クラスにprop2というアクセサを追加しても、親クラスのインスタンスには存在しないこと');

		var c = cls.create();
		c.prop2 = 'prop2';
		equal(c.prop2, 'prop2', '子クラスで追加したprop2アクセサで正しく読み書きができること。');
	});

	test('メソッドの追加', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					},
					method2: function() {
						return 'method2';
					}
				}
			};
		});

		var p = g.ParentClass.create();
		throws(function() {
			p.method2();
		}, TypeError, 'メソッドの追加は親クラスに影響しないこと。');

		var c = cls.create();
		equal(c.method2(), 'method2', '子クラスで追加したメソッドの呼び出しができること。');
	});

	test('プロパティのオーバーライド', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				accessor: {
					prop1: {
						get: function() {
							return _super.accessor1.get.call(this) + '@';
						},
						set: function(val) {
							_super.accessor1.set.call(this, val + '#');
						}
					},
					accessor1: {
						get: function() {
							return _super.accessor1.get.call(this) + '!';
						},
						set: function(val) {
							_super.accessor1.set.call(this, val + '?');
						}
					},
					accessor2: {
						set: function(val) {
							this._field1 = val + '$';
						}
					}
				},
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					}
				}
			};
		});

		var p = g.ParentClass.create('1', '2');
		equal(p.prop1, '2', 'プロパティのオーバーライドは親クラスに影響を与えないこと。');

		var c = cls.create('1', '2');
		equal(c.prop1, '2#@', '_super経由で親クラスのAutoPropertyが呼び出せること。');

		c.accessor1 = '3';
		equal(c.accessor1, '3?!', '_super経由で親クラスのプロパティが呼び出せること。');

		c.accessor2 = '4';
		equal(c._field1, '4$', 'セッターの追加が出来ていること。');
		strictEqual(c.accessor2, undefined, 'オーバーライド時は両方記述しないアクセサは消えること。');
	});

	test('メソッドのオーバーライド', function() {
		var cls = g.ParentClass.extend(function(_super) {
			return {
				name: 'ChildClass',
				method: {
					constructor: function ChildClass(field, prop) {
						_super.constructor.call(this, field, prop);
					},
					method1: function() {
						return _super.method1.call(this) + '!!';
					}
				}
			};
		});

		var p = g.ParentClass.create('1', '2');
		equal(p.method1(), '1 2', 'メソッドのオーバーライドは親クラスに影響を与えないこと。');


		var c = cls.create('1', '2');
		equal(c.method1(), '1 2!!', '_super経由で親クラスのメソッドが呼び出せること。');
		c.prop1 = '3';
		equal(c.method1(), '1 3!!', '_super経由で親クラスのメソッドが呼び出せること。');
	});

	//=============================
	// Definition
	//=============================

	module('継承の継承', {
		setup: function() {
			g.ParentClass = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'ParentClass',
					accessor: {
						prop1: null,
						prop2: null
					},
					method: {
						constructor: function ParentClass() {
							_super.constructor.call(this);
						},
						method1: function() {
							return this.prop1 + ' ' + this.prop2;
						},
						method2: function() {
							return 'method2';
						}
					}
				};
			});
			g.ChildClass = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					accessor: {
						prop1: {
							get: function() {
								return _super.prop1.get.call(this) + '!';
							},
							set: function(val) {
								_super.prop1.set.call(this, val + '?');
							}
						},
						prop3: null
					},
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						},
						method1: function() {
							return _super.method1.call(this) + ' ' + this.prop3;
						},
						method3: function() {
							return 'method3';
						}
					}
				};
			});
		},
		teardown: function() {
			delete g.ParentClass;
			delete g.ChildClass;
		}
	});

	//=============================
	// Body
	//=============================

	test('_superオブジェクト', function() {
		g.ChildClass.extend(function(_super) {
			ok(Object.isFrozen(_super), '変更できないオブジェクトであること。');
			equal(typeof _super.constructor, 'function', 'コンストラクタが定義されていること。');
			equal(typeof _super.method1, 'function', '親クラスでオーバーライドされたメソッドが定義されていること。');
			equal(typeof _super.method2, 'function', '親クラスでオーバーライドされていないメソッドが定義されていること。');
			equal(typeof _super.method3, 'function', '親クラスのメソッドが定義されていること。');
			equal(typeof _super.prop1, 'object', '親クラスでオーバーライドされたプロパティが定義されていること。');
			equal(typeof _super.prop2, 'object', '親クラスでオーバーライドされていないプロパティが定義されていること。');
			equal(typeof _super.prop3, 'object', '親クラスのプロパティが定義されていること。');

			return {
				name: 'GrandChildClass',
				accessor: {
					prop1: {
						get: function() {
							return _super.prop1.get.call(this) + '#';
						},
						set: function(val) {
							_super.prop1.set.call(this, val + '$');
						}
					}
				},
				method: {
					constructor: function GrandChildClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		expect(8);
	});

	test('孫クラスからの呼び出し', function() {
		var cls = g.ChildClass.extend(function(_super) {
			return {
				name: 'GrandChildClass',
				accessor: {
					prop1: {
						get: function() {
							return _super.prop1.get.call(this) + '#';
						},
						set: function(val) {
							_super.prop1.set.call(this, val + '$');
						}
					}
				},
				method: {
					constructor: function GrandChildClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();
		obj.prop1 = 'a';
		equal(obj.prop1, 'a$?!#', '親クラス、子クラスのプロパティオーバーライドが呼ばれること。');
		obj.prop2 = 'b';
		equal(obj.prop2, 'b', '親クラスのプロパティを呼び出せること。');
		obj.prop3 = 'c';
		equal(obj.prop3, 'c', '子クラスのプロパティを呼び出せること。');

		equal(obj.method1(), 'a$?!# b c', '親クラス、子クラスのメソッドオーバーライドが呼ばれること。');
		equal(obj.method2(), 'method2', '親クラスのメソッドを呼び出せること。');
		equal(obj.method3(), 'method3', '子クラスのメソッドを呼び出せること。');
	});

	//=============================
	// Definition
	//=============================

	module('抽象クラス', {
		setup: function() {
			g.TestClass = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					isAbstract: true,
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		},
		teardown: function() {
			delete g.TestClass;
		}
	});

	//=============================
	// Body
	//=============================

	test('Abstractを指定', function() {
		throws(function() {
			g.TestClass.create();
		}, 'Abstractが指定されたクラスはインスタンス化できないこと。');
	});

	test('抽象クラスの継承', function() {
		var cls = g.TestClass.extend(function(_super) {
			return {
				name: 'ExtendClass',
				method: {
					constructor: function ExtendClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		cls.create();
		ok(true, '抽象クラスを継承したクラスをインスタンス化してもエラーが発生しないこと。');
	});

	//=============================
	// Definition
	//=============================

	module('動的拡張');

	//=============================
	// Body
	//=============================

	test('プロパティの動的追加', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		var value = 'testValue';

		var instance = cls.create();
		instance.dynamicProp = value;

		equal(instance.dynamicProp, value, '動的に追加されたプロパティの値を読み取れること');
		equal(instance.hasOwnProperty('dynamicProp'), true,
				'動的に追加されたプロパティはインスタンスのhasOwnPropertyがtrueになること');
	});


	test('(ver.1.3.3での仕様変更)isDynamic=falseを指定しても機能せず、インスタンスに対して動的にプロパティを追加できること', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'NonDynamicClass',
				isDynamic: false,
				method: {
					constructor: function NonDynamicClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var obj = cls.create();

		var PROP_VALUE = 'dynamic';

		obj.dynamicField = PROP_VALUE;

		equal(obj.dynamicField, PROP_VALUE,
				'isDynamic=falseを指定したクラスのインスタンスに動的に追加したプロパティを正しく読み書きできている');
	});

	//=============================
	// Definition
	//=============================

	module('staticメソッド', {
		setup: function() {
			g.ParentClass = h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'ParentClass',
					method: {
						constructor: function ParentClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
			g.ChildClass = g.ParentClass.extend(function(_super) {
				return {
					name: 'ChildClass',
					method: {
						constructor: function ChildClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		},
		teardown: function() {
			delete g.ParentClass;
			delete g.ChildClass;
		}
	});

	//=============================
	// Body
	//=============================

	test('getParentClass', function() {
		equal(g.ChildClass.getParentClass(), g.ParentClass, '親クラスの取得が出来ること。');
		equal(g.ParentClass.getParentClass(), h5.cls.RootClass, '親クラスの取得が出来ること。');
		strictEqual(h5.cls.RootClass.getParentClass(), null, 'RootClassからは親クラスが取得できないこと。');
	});

	test('isClassOf', function() {
		var parent = g.ParentClass.create();
		var child = g.ChildClass.create();
		ok(h5.cls.RootClass.isClassOf(parent), 'parentはRootClassのインスタンスとみなせること。');
		ok(h5.cls.RootClass.isClassOf(child), 'childはRootClassのインスタンスとみなせること。');
		ok(g.ParentClass.isClassOf(parent), 'parentはParentClassのインスタンスであること。');
		ok(g.ParentClass.isClassOf(child), 'childはParentClassのインスタンスとみなせること。');
		ok(!g.ChildClass.isClassOf(parent), 'parentはChildClassのインスタンスとみなせないこと。');
		ok(g.ChildClass.isClassOf(child), 'childはChildClassのインスタンスであること。');

		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'OtherClass',
				method: {
					constructor: function OtherClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		var other = cls.create();
		ok(h5.cls.RootClass.isClassOf(other), 'otherはRootClassのインスタンスとみなせること。');
		ok(cls.isClassOf(other), 'otherはOtherClassのインスタンスであること。');
		ok(!g.ParentClass.isClassOf(other), 'otherはParentClassのインスタンスとみなせないこと。');
	});


	//=============================
	// Definition
	//=============================

	module('statics');

	//=============================
	// Body
	//=============================

	test('staticsオブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});
		ok('statics' in cls, 'staticメンバーを定義していなくてもstaticsオブジェクトが存在すること。');
		ok(Object.isSealed(cls.statics), 'staticsはシールされていること。');
		throws(function() {
			cls.statics = {};
		}, TypeError, 'staticsは上書きできないこと。');
	});


	//=============================
	// Definition
	//=============================

	module('StaticFieldDescriptor');

	//=============================
	// Body
	//=============================

	test('JS予約名を使用', function() {
		JS_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticField: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticField[name] = null;
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('h5予約名を使用', function() {
		H5_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticField: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticField[name] = null;
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('fieldがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticField: {
					sf1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sf1' in cls._ctor, '静的フィールドが定義されていること。');
		ok('sf1' in cls.statics, '静的フィールドが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		strictEqual(cls._ctor.sf1, null, 'デフォルト値はnullであること。');
		strictEqual(cls.statics.sf1, null, 'デフォルト値はnullであること。');

		cls._ctor.sf1 = 1;
		strictEqual(cls._ctor.sf1, 1, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 1, '静的フィールドの読み書きができること。');
		cls.statics.sf1 = 2;
		strictEqual(cls._ctor.sf1, 2, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 2, '静的フィールドの読み書きができること。');

		var obj = cls.create();
		strictEqual(obj.sf1, undefined, 'インスタンスからはアクセスできないこと。');
	});

	test('fieldが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticField: {
					sf1: {}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sf1' in cls._ctor, '静的フィールドが定義されていること。');
		ok('sf1' in cls.statics, '静的フィールドが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		strictEqual(cls._ctor.sf1, null, 'デフォルト値はnullであること。');
		strictEqual(cls.statics.sf1, null, 'デフォルト値はnullであること。');

		cls._ctor.sf1 = 1;
		strictEqual(cls._ctor.sf1, 1, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 1, '静的フィールドの読み書きができること。');
		cls.statics.sf1 = 2;
		strictEqual(cls._ctor.sf1, 2, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 2, '静的フィールドの読み書きができること。');

		var obj = cls.create();
		strictEqual(obj.sf1, undefined, 'インスタンスからはアクセスできないこと。');
	});

	test('fieldのデフォルト値', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticField: {
					sf1: {
						defaultValue: 1
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sf1' in cls._ctor, '静的フィールドが定義されていること。');
		ok('sf1' in cls.statics, '静的フィールドが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		strictEqual(cls._ctor.sf1, 1, 'デフォルト値が設定されていること。');
		strictEqual(cls.statics.sf1, 1, 'デフォルト値が設定されていること。');

		cls._ctor.sf1 = 2;
		strictEqual(cls._ctor.sf1, 2, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 2, '静的フィールドの読み書きができること。');
		cls.statics.sf1 = 3;
		strictEqual(cls._ctor.sf1, 3, '静的フィールドの読み書きができること。');
		strictEqual(cls.statics.sf1, 3, '静的フィールドの読み書きができること。');

		var obj = cls.create();
		strictEqual(obj.sf1, undefined, 'インスタンスからはアクセスできないこと。');
	});

	test('ReadOnlyのみ', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticField: {
					sf1: {
						isReadOnly: true
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sf1' in cls._ctor, '静的フィールドが定義されていること。');
		ok('sf1' in cls.statics, '静的フィールドが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		strictEqual(cls._ctor.sf1, null, 'nullで定義されていること。');
		strictEqual(cls.statics.sf1, null, 'nullで定義されていること。');
		throws(function() {
			cls._ctor.sf1 = '';
		}, TypeError, '書込みできないこと。');
		throws(function() {
			cls.statics.sf1 = '';
		}, TypeError, '書込みできないこと。');
	});

	test('ReadOnlyとdefaultValue', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticField: {
					sf1: {
						defaultValue: 1,
						isReadOnly: true
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sf1' in cls._ctor, '静的フィールドが定義されていること。');
		ok('sf1' in cls.statics, '静的フィールドが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sf1') !== -1, '静的フィールドが列挙可能なこと。');
		strictEqual(cls._ctor.sf1, 1, 'デフォルト値が設定されていること。');
		strictEqual(cls.statics.sf1, 1, 'デフォルト値が設定されていること。');
		throws(function() {
			cls._ctor.sf1 = '';
		}, TypeError, '書込みできないこと。');
		throws(function() {
			cls.statics.sf1 = '';
		}, TypeError, '書込みできないこと。');
	});


	//=============================
	// Definition
	//=============================

	module('StaticAccessorDescriptor');

	//=============================
	// Body
	//=============================

	test('JS予約名を使用', function() {
		JS_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticAccessor: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticAccessor[name] = null;
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('h5予約名を使用', function() {
		H5_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticAccessor: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticAccessor[name] = null;
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('accessorがnull', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticAccessor: {
					sp1: null
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sp1' in cls._ctor, '静的プロパティが定義されていること。');
		ok('sp1' in cls.statics, '静的プロパティが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		strictEqual(cls._ctor.sp1, null, 'デフォルト値はnullであること。');
		strictEqual(cls.statics.sp1, null, 'デフォルト値はnullであること。');

		cls._ctor.sp1 = 1;
		strictEqual(cls._ctor.sp1, 1, '静的プロパティの読み書きができること。');
		strictEqual(cls.statics.sp1, 1, '静的プロパティの読み書きができること。');
		cls.statics.sp1 = 2;
		strictEqual(cls._ctor.sp1, 2, '静的プロパティの読み書きができること。');
		strictEqual(cls.statics.sp1, 2, '静的プロパティの読み書きができること。');

		var obj = cls.create();
		strictEqual(obj.sp1, undefined, 'インスタンスからはアクセスできないこと。');
	});

	test('accessorが空オブジェクト', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticAccessor: {
					sp1: {}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sp1' in cls._ctor, '静的プロパティが定義されていること。');
		ok('sp1' in cls.statics, '静的プロパティが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		strictEqual(cls._ctor.sp1, undefined, '値が読み取れないこと。');
		strictEqual(cls.statics.sp1, undefined, '値が読み取れないこと。');

		throws(function() {
			cls._ctor.sp1 = 1;
		}, TypeError, '静的プロパティに値が設定できないこと。');
		throws(function() {
			cls.statics.sp1 = 1;
		}, TypeError, '静的プロパティに値が設定できないこと。');
	});

	test('getter', function() {
		var backing = 1;
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticAccessor: {
					sp1: {
						get: function() {
							return backing;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sp1' in cls._ctor, '静的プロパティが定義されていること。');
		ok('sp1' in cls.statics, '静的プロパティが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		strictEqual(cls._ctor.sp1, 1, '値が取得できること。');
		strictEqual(cls.statics.sp1, 1, '値が取得できること。');

		backing = 2;
		strictEqual(cls._ctor.sp1, 2, '値が取得できること。');
		strictEqual(cls.statics.sp1, 2, '値が取得できること。');

		throws(function() {
			cls._ctor.sp1 = 1;
		}, TypeError, '静的プロパティに値が設定できないこと。');
		throws(function() {
			cls.statics.sp1 = 1;
		}, TypeError, '静的プロパティに値が設定できないこと。');
	});

	test('setter', function() {
		var backing = 1;
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticAccessor: {
					sp1: {
						set: function(val) {
							backing = val;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sp1' in cls._ctor, '静的プロパティが定義されていること。');
		ok('sp1' in cls.statics, '静的プロパティが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		strictEqual(cls._ctor.sp1, undefined, '値が取得できないこと。');
		strictEqual(cls.statics.sp1, undefined, '値が取得できないこと。');

		cls._ctor.sp1 = 2;
		strictEqual(backing, 2, '値が設定できること。');
		cls.statics.sp1 = 3;
		strictEqual(backing, 3, '値が設定できること。');
	});

	test('getter/setter', function() {
		var backing = 1;
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticAccessor: {
					sp1: {
						get: function() {
							return backing;
						},
						set: function(val) {
							backing = val;
						}
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		ok('sp1' in cls._ctor, '静的プロパティが定義されていること。');
		ok('sp1' in cls.statics, '静的プロパティが定義されていること。');
		ok(Object.keys(cls._ctor).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		ok(Object.keys(cls.statics).indexOf('sp1') !== -1, '静的プロパティが列挙可能なこと。');
		strictEqual(cls._ctor.sp1, 1, '値が取得できること。');
		strictEqual(cls.statics.sp1, 1, '値が取得できること。');

		cls._ctor.sp1 = 2;
		strictEqual(cls._ctor.sp1, 2, '値の読み書きができること。');
		strictEqual(cls.statics.sp1, 2, '値の読み書きができること。');
		strictEqual(backing, 2, '値の読み書きができること。');
		cls.statics.sp1 = 3;
		strictEqual(cls._ctor.sp1, 3, '値の読み書きができること。');
		strictEqual(cls.statics.sp1, 3, '値の読み書きができること。');
	});


	//=============================
	// Definition
	//=============================

	module('StaticMethodDescriptor');

	//=============================
	// Body
	//=============================

	test('JS予約名を使用', function() {
		JS_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticMethod: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticMethod[name] = function() {
					// Do nothing
					};
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('h5予約名を使用', function() {
		H5_PRESERVED_NAMES.forEach(function(name) {
			throws(function() {
				h5.cls.RootClass.extend(function(_super) {
					var description = {
						name: 'TestClass',
						staticMethod: {},
						method: {
							constructor: function TestClass() {
								_super.constructor.call(this);
							}
						}
					};
					description.staticMethod[name] = function() {
					// Do nothing
					};
					return description;
				});
			}, Error, name + 'を定義するとエラーになること。');
		});
	});

	test('メソッドの定義', function() {
		var cls = h5.cls.RootClass.extend(function(_super) {
			return {
				name: 'TestClass',
				staticMethod: {
					sm1: function() {
						return 1;
					}
				},
				method: {
					constructor: function TestClass() {
						_super.constructor.call(this);
					}
				}
			};
		});

		strictEqual(cls._ctor.sm1(), 1, '静的メソッドが呼び出せること。');
		strictEqual(cls.statics.sm1(), 1, '静的メソッドが呼び出せること。');
		throws(function() {
			var obj = cls.create();
			obj.sm1();
		}, TypeError, 'インスタンスからは呼び出せないこと。');
	});


	//=============================
	// Definition
	//=============================

	module('staticメンバーの重複');

	//=============================
	// Body
	//=============================

	test('fieldとaccessorの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					staticField: {
						dup: null
					},
					staticAccessor: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldとaccessorの重複はエラーとなること。');
	});

	test('fieldとmethodの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					staticField: {
						dup: null
					},
					staticMethod: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'fieldとmethodの重複はエラーとなること。');
	});

	test('accessorとmethodの重複', function() {
		throws(function() {
			h5.cls.RootClass.extend(function(_super) {
				return {
					name: 'TestClass',
					staticAccessor: {
						dup: null
					},
					staticMethod: {
						dup: null
					},
					method: {
						constructor: function TestClass() {
							_super.constructor.call(this);
						}
					}
				};
			});
		}, Error, 'accessorとmethodの重複はエラーとなること。');
	});

	//=============================
	// Definition
	//=============================

	module('クラスマネージャでgetClass()');

	//=============================
	// Body
	//=============================

	test('h5.cls.manager.getClass()の引数にクラス名を指定するとそのクラスのオブジェクトを取得できる', function() {
		var cls = h5.cls.RootClass.extend(function(super_) {
			return {
				name: 'TestGetClass',
				method: {
					constructor: function TestClass() {
						super_.constructor.call(this);
					}
				}
			};
		});
		strictEqual(h5.cls.manager.getClass('TestGetClass'), cls,
				'h5.cls.manager.getClass()で引数に指定したクラス名のクラスオブジェクトを取得できること。');
	});

	test('h5.cls.manager.getClass()の引数に存在しないクラスを指定', function() {
		throws(function() {
			h5.cls.manager.getClass('h5.NotDefinedClass');
		}, Error, 'h5.cls.manager.getClass()でクラスが取得できない場合例外が発生すること。');
	});

	test('h5.cls.manager.getClass()の引数にnullを指定', function() {
		throws(function() {
			h5.cls.manager.getClass(null);
		}, Error, 'h5.cls.manager.getClass()の引数にnullを指定した場合例外が発生すること。');
	});

	test('h5.cls.manager.getClass()の引数を未指定', function() {
		throws(function() {
			h5.cls.manager.getClass();
		}, Error, 'h5.cls.manager.getClass()の引数に何も指定しなかった場合例外が発生すること。');
	});

	//=============================
	// Definition
	//=============================

	module('クラスマネージャでgetRootClass()');

	//=============================
	// Body
	//=============================

	test('h5.cls.manager.getRootClass()でルートクラスを取得できる', function() {
		equal(h5.cls.manager.getRootClass(), h5.cls.RootClass,
				'h5.cls.manager.getRootClass()でルートクラスを取得できること。');
	});

	test('クラスのgetManager()でh5.cls.managerを取得できる', function() {
		var cls = h5.cls.RootClass.extend(function(super_) {
			return {
				name: 'TestGetRootClass',
				method: {
					constructor: function TestClass() {
						super_.constructor.call(this);
					}
				}
			};
		});
		strictEqual(cls.getManager(), h5.cls.manager, 'getManager()でh5.cls.managerを取得できること。');
		strictEqual(cls.getManager().getRootClass(), h5.cls.RootClass,
				'getRootClass()で定義したクラスのルートクラスを取得できること。');
	});

	//=============================
	// Definition
	//=============================

	module('クラスマネージャでgetNamespaceObject()');

	//=============================
	// Body
	//=============================

	test(
			'h5.cls.manager.getNamespaceObject()の引数に空文字を指定すると、デフォルト名前空間オブジェクトを取得できること。また、そのデフォルト名前空間に定義したクラスを取得できること。',
			function() {
				var cls = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'TestGetNamespaceClass',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});

				var nsObj = h5.cls.manager.getNamespaceObject('');
				strictEqual(typeof nsObj, 'object',
						'h5.cls.manager.getNamespaceObject()の引数に空文字を指定すると、デフォルト名前空間のオブジェクトを取得できること。');
				strictEqual(nsObj.TestGetNamespaceClass, cls,
						'デフォルト名前空間のオブジェクトから、定義しておいたクラスを取得できること。');
			});

	test(
			'h5.cls.manager.getNamespaceObject()の引数に名前空間を指定すると、その名前空間に属するクラスをそのクラス名をキーとして保持するオブジェクトを取得できる',
			function() {
				var cls2 = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'ns.TestGetNamespaceClass2',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});
				var nsObj = h5.cls.manager.getNamespaceObject('ns');
				strictEqual(nsObj.TestGetNamespaceClass2, cls2,
						'h5.cls.manager.getNamespaceObject()で引数に名前空間を指定すると、その名前空間に属するクラスをそのクラス名をキーとして保持するオブジェクトを取得できること。');
			});

	test(
			'h5.cls.manager.getNamespaceObject()の引数に名前空間を指定すると、その名前空間に属するクラスのみをそのクラス名をキーとして保持するオブジェクトを取得できる',
			function() {
				var cls3 = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'ns1.ns2.TestGetNamespaceClass3',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});
				var nsObj = h5.cls.manager.getNamespaceObject('ns1.ns2');
				strictEqual(Object.keys(nsObj).length, 1, '名前空間オブジェクトはキーを一つだけ保持すること。');
				strictEqual(nsObj.TestGetNamespaceClass3, cls3,
						'名前空間オブジェクトに含まれるのは引数に指定した名前空間にあるクラスの定義のみであること。');

				var cls4 = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'ns1.ns2.TestGetNamespaceClass4',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});
				var nsObj2 = h5.cls.manager.getNamespaceObject('ns1.ns2');
				strictEqual(Object.keys(nsObj2).length, 2, '名前空間オブジェクトはキーを二つ保持すること。');
				strictEqual(nsObj.TestGetNamespaceClass3, cls3,
						'名前空間オブジェクトに含まれるのは引数に指定した名前空間にあるクラスの定義のみであるため、TestGetNamespaceClass2の定義が取得できること。');
				strictEqual(nsObj2.TestGetNamespaceClass4, cls4,
						'名前空間オブジェクトに含まれるのは引数に指定した名前空間にあるクラスの定義のみであるため、TestGetNamespaceClass3の定義が取得できること。');
			});

	test('同じ名前空間にクラス定義を後から追加した場合でも、その名前空間に属するクラスをそのクラス名をキーとして保持するオブジェクトを全て取得できる', function() {
		var cls5 = h5.cls.RootClass.extend(function(super_) {
			return {
				name: 'ns3.ns4.TestGetNamespaceClass5',
				method: {
					constructor: function TestClass() {
						super_.constructor.call(this);
					}
				}
			};
		});
		var cls6 = h5.cls.RootClass.extend(function(super_) {
			return {
				name: 'ns3.ns4.TestGetNamespaceClass6',
				method: {
					constructor: function TestClass() {
						super_.constructor.call(this);
					}
				}
			};
		});
		var nsObj2 = h5.cls.manager.getNamespaceObject('ns3.ns4');
		strictEqual(nsObj2.TestGetNamespaceClass5, cls5,
				'同じ名前空間にクラス定義を後から追加した場合でも、getNamespaceObject()で予め定義しておいたクラスのオブジェクトを取得できること。');
		strictEqual(nsObj2.TestGetNamespaceClass6, cls6,
				'同じ名前空間にクラス定義を後から追加した場合でも、getNamespaceObject()で後から追加で定義したクラスのオブジェクトを取得できること。');

	});

	test('h5.cls.manager.getNamespaceObject()の引数に名前空間を指定して取得できるオブジェクトは、その名前空間の階層にのみに属するクラス定義を保持する',
			function() {
				var cls7 = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'ns5.TestGetNamespaceClass7',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});
				var cls8 = h5.cls.RootClass.extend(function(super_) {
					return {
						name: 'ns5.ns6.TestGetNamespaceClass8',
						method: {
							constructor: function TestClass() {
								super_.constructor.call(this);
							}
						}
					};
				});
				var nsObj = h5.cls.manager.getNamespaceObject('ns5');
				strictEqual('ns6' in nsObj, false, '名前空間オブジェクトは階層的ではないため、ns1.ns2の参照は未定義であること。');

			});

	test('h5.cls.manager.getNamespaceObject()の引数に存在しない名前空間を指定', function() {
		ok(h5.cls.manager.getNamespaceObject("notDefined").TestGetNamespaceClass6 === undefined,
				'h5.cls.manager.getNamespaceObject()の引数に存在しない名前空間を指定した場合の戻り値が空オブジェクトであること');
	});
});
