(function() {
	var seq = h5.core.data.createSequence(null, null, h5.core.data.SEQ_STRING);
	var manager = h5.core.data.createManager('DataManager');
	var model = manager.createModel({
		name: 'SampleModel',
		schema: {
			id: {
				id: true
			},
			itemname: {
				type: 'string'
			},
			price: {
				type: 'number'
			}
		}
	});
	var queries = [{
		description: '1000円以上かつ10000円未満',
		criteria: {
			'price >=': 1000,
			'price <': 10000
		}
	}, {
		description: '1000円以下または10000円以上',
		criteria: {
			__op: 'or',
			'price <=': 1000,
			'price >=': 10000
		}
	}, {
		description: '商品名が"レゴ"を含む、または、"トミカ"を含むかつ300円以下"',
		criteria: {
			__op: 'or',
			itemname: /レゴ/,
			additional: {
				itemname: /トミカ/,
				'price <=': 300
			}
		}
	}, {
		description: '商品名に"レゴ"を含む、または、"トミカ"を含むかつ300円以下',
		criteria: {
			__op: 'or',
			itemname: /レゴ/,
			additional: {
				itemname: /トミカ/,
				'price <=': 300
			}
		}
	}, {
		description: '商品名が"石川遼 エキサイトゴルフ"、"レゴ 基本セット 青いバケツ"のいずれか(in使用)',
		criteria: {
			'itemname in': ["石川遼 エキサイトゴルフ", "レゴ 基本セット 青いバケツ"]
		}
	}, {
		description: '商品名が10文字以下(ユーザ関数使用)',
		criteria: {
			func: function(valueObj) {
				return valueObj.itemname.length <= 10;
			}
		}
	}];


	var view = h5.core.view;

	function itemChangeListener() {
		view.update('.items', 'items', {
			items: model.items
		});
	}

	// データモデルのitemsChangeが起きたら一覧更新
	model.addEventListener('itemsChange', itemChangeListener);

	$(function() {
		for (var i = 0, l = queries.length; i < l; i++) {
			var $target = $('<div class="query-result"></div>');
			$('.result').append($target);
			$('.result').append('<hr>');
			h5.core.controller($target, query.QueryController, {
				model: model,
				query: queries[i]
			});
		}
		$.ajax('data.json').done(function(data) {
			for (var i = 0, l = data.length; i < l; i++) {
				data[i].id = seq.next();
				model.create(data[i]);
			}
		});


		h5.core.controller('body', {
			__name: 'querySampleController',
			'.create button click': function(context) {
				context.event.preventDefault();
				var $form = this.$find('.create');
				var name = $form.find('[name=itemname]').val();
				var price = $form.find('[name=price]').val();

				model.create({
					id: seq.next(),
					itemname: name,
					price: parseFloat(price)
				});
			},
			'.remove button click': function(context) {
				context.event.preventDefault();
				var $form = this.$find('.remove');
				var id = $form.find('[name=id]').val();
				model.remove(id);
			},
			'.update button click': function(context) {
				context.event.preventDefault();
				var $form = this.$find('.update');
				var id = $form.find('[name=id]').val();
				var name = $form.find('[name=itemname]').val();
				var price = $form.find('[name=price]').val();

				var item = model.get(id);
				if (item) {
					item.set({
						itemname: name,
						price: parseFloat(price)
					});
				}
			}
		});
	});
})();