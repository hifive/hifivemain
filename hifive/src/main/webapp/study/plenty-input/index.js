$(function() {
	var inputController = {
		__name: 'inputController',

		// バリデーションコントローラの設定
		_formController: h5.ui.FormController,
		__meta: {
			_formController: {
				rootElement: 'form'
			}
		},

		'#btn1 click': function(context, $el) {
			var inputNum = $("#num").val();
			var input = "";
			for (var i = 0; i < inputNum; i++) {
				input += "<input class='plenty-input' name='name_" + i + "' />";
			}
			$("#form").append(input);
		},

		'#btn2 click': function(context, $el) {
			var ruleNum = $("#rule").val();

			//各inputにルールを追加
			for (var i = 0; i < ruleNum; i++) {
				var name = "name_" + i;

				var ruleObj = {};
				var validateObj = {
					required: true
				};
				ruleObj[name] = validateObj;
				this._formController.addRule(ruleObj);
			}

			var validateNum = $("#num").val();
			var startTime = performance.now(); // 開始時間
			for (var i = 0; i < validateNum; i++) {
				this._formController.validate("name_" + i);
			}
			var endTime = performance.now(); // 終了時間
			var pastTime = endTime - startTime;
			$("#output").text(pastTime);
		},
	};
	h5.core.controller(document.body, inputController);
});