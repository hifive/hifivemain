$(function() {
		var $result = $("#form"), n = 2500;
		var input = "";
		for (var i = 0; i < n; i++) {
			input += "<input name='name_" + i + "' />";
		}
		$result.append(input);

		this.formController = h5.core.controller('.form', h5.ui.FormController);

		//各inputにルールを追加
   		for (var i = 0; i < n; i++) {
			var name = "name_" + i;

			var ruleObj = {};
			var validateObj = {
				required: true
			};
			ruleObj[name] = validateObj;
			this.formController.addRule(ruleObj);
		}

		console.time('timer1');
		for (var i = 0; i < n; i++) {
			this.formController.validate("name_" + i);
		}
		console.timeEnd('timer1'); // 計測時間出力
	});