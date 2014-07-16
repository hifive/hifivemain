(function() {
	var seq = h5.core.data.createSequence(null, null, h5.core.data.SEQ_STRING);
	var manager = h5.core.data.createManager('DataManager');
	var model = manager.createModel({
		name: 'SampleModel',
		schema: { // 名前,ふりがな,アドレス,性別,年齢,誕生日,都道府県, state(必ず1)
			id: {
				id: true
			},
			name: {
				type: 'string'
			},
			kana: {
				type: 'string'
			},
			email: {
				type: 'string'
			},
			sex: {
				type: 'string'
			},
			birthDate: {
				type: 'any'
			},
			address: {
				type: 'string'
			},
			state: {
				defaultValue: '1'
			}
		}
	});

	// jsonから読み込んだデータをmodelに追加
	$.ajax('data.json').done(
			function(data) {
				for (var i = 0, l = data.length; i < l; i++) {
					var itemDef = data[i];
					itemDef.id = seq.next();
					itemDef.birthDate = new Date(data[i].birthDate);
					model.create(itemDef);
				}
				$('.message').append('<p>' + model.size + '件のデータを登録しました</p>');
				$('.message').append(
						'<p>データサンプル(1件目)<p><pre>' + QUnit.jsDump.parse(model.get('1').get())
								+ '</pre>');

				$(function() {
					// コントローラのバインド
					h5.core.controller('body', sample.PageController, {
						model: model
					});
				});
			});
})();