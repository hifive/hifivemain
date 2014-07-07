(function() {
	var logic = {
		__name: 'app.logic.MyLogic',
		__construct: function() {
			$('body').append('<p>' + this.__name + 'の初期化を開始します</p>')
		}
	};

	h5.core.expose(logic);
})();