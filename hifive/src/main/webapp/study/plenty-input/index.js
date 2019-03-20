$(function() {
	var num;
	$("#btn1").click(function() {
		 num = $("#num").val();
		var input = "";
		for (var i = 0; i < num; i++) {
			input += "<input name='name_" + i + "' />";
		}
		$("#form").append(input);
	});


	$("#btn2").click(function() {
		this.formController = h5.core.controller('.form', h5.ui.FormController);
		var ruleNum = $("#rule").val();

		//各inputにルールを追加
		for (var i = 0; i < ruleNum; i++) {
			var name = "name_" + i;

			var ruleObj = {};
			var validateObj = {
				required: true
			};
			ruleObj[name] = validateObj;
			this.formController.addRule(ruleObj);
		}

		const startTime = performance.now(); // 開始時間
		for (var i = 0; i < num; i++) {
			this.formController.validate("name_" + i);
		}
		const endTime = performance.now(); // 終了時間
		var time = endTime - startTime;
		$("#output").text(time);
	});
});