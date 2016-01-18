/*
 * Copyright (C) 2012-2016 NS Solutions Corporation
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

//=============================
// Definition
//=============================
var bindItem = h5.u.obj.createObservableItem({
	test: null
});

module('append/prepend/update', {
	setup: function() {
		$fixture.append('<div id="inFixture">');

		bindItem.set({
			test: 'a'
		});
	},
	teardown: function() {
		var controllers = h5.core.controllerManager.controllers;
		for (var i = 0, l = controllers.length; i < l; i++) {
			controllers[i] && controllers[i].dispose && controllers[i].dispose();
		}
	}
});

//=============================
// Body
//=============================
test('append データバインドできること', function() {
	view.append($fixture, 'simple', {
		test: 'a'
	});

	strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
			'appendで、指定した要素内に後ろからテンプレートが追加されていること');
	strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
});

test('append 値の変更が反映されること', function() {
	view.append($fixture, 'simple', bindItem);
	strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	//値の変更
	bindItem.set('test', 'b');

	strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
});

asyncTest('コントローラ内 this.view.append データバインドできること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.append(this.rootElement, 'simple', {
				test: 'a'
			});

			strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
					'appendで、指定した要素内に後ろからテンプレートが追加されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

asyncTest('コントローラ内 this.view.append 値の変更が反映されること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.append(this.rootElement, 'simple', {
				test: 'a'
			});

			strictEqual($('#inFixture').next('div').attr('id'), 'dataBindTest',
					'prependで、指定した要素内に後ろからテンプレートが追加されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

test('prepend データバインドできること', function() {
	view.prepend($fixture, 'simple', {
		test: 'a'
	});

	strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
			'prependで、指定した要素内に前からテンプレートが追加されていること');
	strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
});

test('prepend 値の変更が反映されること', function() {
	view.prepend($fixture, 'simple', bindItem);
	strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	//値の変更
	bindItem.set('test', 'b');

	strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
});

asyncTest('コントローラ内 this.view.prepend データバインドできること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.prepend(this.rootElement, 'simple', {
				test: 'a'
			});

			strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
					'prependで、指定した要素内に前からテンプレートが追加されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

asyncTest('コントローラ内 this.view.prepend 値の変更が反映されること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.prepend(this.rootElement, 'simple', {
				test: 'a'
			});

			strictEqual($('#inFixture').prev('div').attr('id'), 'dataBindTest',
					'prependで、指定した要素内に前からテンプレートが追加されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

test('update データバインドできること',
		function() {
			view.update($fixture, 'simple', {
				test: 'a'
			});

			ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
					'updateで、指定した要素内が更新されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
		});

test('update 値の変更が反映されること', function() {
	view.update($fixture, 'simple', bindItem);
	strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');
	//値の変更
	bindItem.set('test', 'b');

	strictEqual($('#dataBindTest span').text(), 'b', '値の変更が反映されること');
});

asyncTest('コントローラ内 this.view.update データバインドできること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.update(this.rootElement, 'simple', {
				test: 'a'
			});

			ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
					'updateで、指定した要素内が更新されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

asyncTest('コントローラ内 this.view.update 値の変更が反映されること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {
			this.view.update(this.rootElement, 'simple', {
				test: 'a'
			});

			ok($('#inFixture').length === 0 && $('#dataBindTest').length === 1,
					'updateで、指定した要素内が更新されていること');
			strictEqual($('#dataBindTest span').text(), 'a', 'データバインドされていること');

			start();
		}
	});
});

test('EJSテンプレートの評価後にデータバインドが実行されること', function() {
	view.append($fixture, 'ejsBind', {
		value: 'ejs',
		ejs: 'databind'
	});
	strictEqual($('#dataBindTest span').text(), 'databind', 'EJSテンプレートが評価されてから、データバインドされていること');
	strictEqual($('#dataBindTest p').attr('id'), 'databind', 'EJSテンプレートが評価されてから、データバインドされていること');
});

asyncTest('コントローラ内 EJSテンプレートの評価後にデータバインドが実行されること', function() {
	h5.core.controller($fixture, {
		__name: 'TestController',
		__templates: 'template/data-bind.ejs',
		__ready: function() {

			this.view.append($fixture, 'ejsBind', {
				value: 'ejs',
				ejs: 'databind'
			});
			strictEqual($('#dataBindTest span').text(), 'databind',
					'EJSテンプレートが評価されてから、データバインドされていること');
			strictEqual($('#dataBindTest p').attr('id'), 'databind',
					'EJSテンプレートが評価されてから、データバインドされていること');
			start();
		}
	});
});