
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
			for ( var i = 0, l = controllers.length; i < l; i++) {
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

	test('update データバインドできること', function() {
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

	test('EJSテンプレートの評価後にデータバインドが実行されること',
			function() {
				view.append($fixture, 'ejsBind', {
					value: 'ejs',
					ejs: 'databind'
				});
				strictEqual($('#dataBindTest span').text(), 'databind',
						'EJSテンプレートが評価されてから、データバインドされていること');
				strictEqual($('#dataBindTest p').attr('id'), 'databind',
						'EJSテンプレートが評価されてから、データバインドされていること');
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