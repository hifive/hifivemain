(function() {
	var view = h5.core.view;
	var LOOP = 1;

	var simpleFilter = {
		state: '1'
	};

	var complicatedFilter = {
		state: '1',
		'birthDate <': new Date(),
		'name !=': 'hoge',
		email: /.*@.*/,
		'email !=': 'a@a',
		'email !in': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
		'birthDate !=': new Date('1900/1/1'),
		'state !=': 'hoge',
		criteria: {
			__op: 'or',
			'sex': '男',
			'name !=': 'fuga'
		},
		criteria2: {
			func: function(valueObj) {
				return !!valueObj.name;
			},
			'sex in': ['男', '女'],
			'name !=': 'piyo',
			'birthDate >': new Date('1900/1/1'),
			'birthDate >=': new Date('1900/1/1'),
			'email !=': 'foo@bar',
			'birthDate !=': new Date(),
			'state >': 0,
			'state between': [0, 1]
		}
	};

	var controller = {
		__name: 'sample.PageController',
		__init: function(context) {
			var model = context.args.model;
			this.view
					.register(
							'executer',
							'<div class="executer" data-index="[%= index %]"><p>[%= description %]</p><pre>[%= criteria %]</pre><button class="execute">'
									+ LOOP + '回実行</button><p class="message"></p></div>');

			var index = 1;
			this.executers = [
					{
						index: index++,
						description: '等価フィルタのみ(ソートなし、全てのアイテムがヒットするフィルタ)',
						criteria: simpleFilter,
						func: function() {
							var start = new Date().getTime();
							for (var i = 0, l = LOOP; i < l; i++) {
								var query = model.createQuery().setCriteria(this.criteria)
										.execute();
							}
							return {
								time: new Date().getTime() - start,
								length: query.result.length
							};
						}
					},
					{
						index: index++,
						description: 'nameでソート(フィルタなし)',
						criteria: {},
						func: function() {
							var start = new Date().getTime();
							for (var i = 0, l = LOOP; i < l; i++) {
								var query = model.createQuery().setCriteria(this.criteria).orderBy(
										'name').execute();
							}
							return {
								time: new Date().getTime() - start,
								length: query.result.length
							};
						}
					},
					{
						index: index++,
						description: '等価フィルタとソート',
						criteria: simpleFilter,
						func: function() {
							var start = new Date().getTime();
							for (var i = 0, l = LOOP; i < l; i++) {
								var query = model.createQuery().setCriteria(this.criteria).orderBy(
										'name').execute();
							}
							return {
								time: new Date().getTime() - start,
								length: query.result.length
							};
						}
					},
					{
						index: index++,
						description: '複雑なフィルタ',
						criteria: complicatedFilter,
						func: function() {
							var start = new Date().getTime();
							for (var i = 0, l = LOOP; i < l; i++) {
								var query = model.createQuery().setCriteria(this.criteria)
										.execute();
							}
							return {
								time: new Date().getTime() - start,
								length: query.result.length
							};
						}
					},
					{
						index: index++,
						description: '複雑なフィルタ＋nameでソート',
						criteria: complicatedFilter,
						func: function() {
							var start = new Date().getTime();
							for (var i = 0, l = LOOP; i < l; i++) {
								var query = model.createQuery().setCriteria(this.criteria).orderBy(
										'name').execute();
							}
							return {
								time: new Date().getTime() - start,
								length: query.result.length
							};
						}
					}];

			for (var i = 0, l = this.executers.length; i < l; i++) {
				var executer = this.executers[i];
				this.view.append(this.rootElement, 'executer', {
					index: executer.index,
					description: executer.description,
					criteria: QUnit.jsDump.parse(executer.criteria)
				});
			}
		},
		'.execute click': function(context, $el) {
			var index = parseInt($el.parent().data('index'));
			var $message = $el.parent().find('.message');
			$message.text('実行中...');
			var result = this.executers[index - 1].func();
			$message.text('件数:' + result.length + ' 実行時間:' + result.time + 'ms');
		}
	};
	h5.core.expose(controller);
})();