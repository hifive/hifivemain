(function() {
	var logic = {
		__name: 'app.logic.GrandLogic',
		my2Logic: h5.res.require('app.logic.Grand2Logic'),
		__construct: function() {
			$('body').append('<p>' + this.__name + 'の初期化を開始します</p>');
		},
		__ready: function() {
			$('body').append('<p>' + this.__name + 'の__readyが実行されました</p>');
		}
	};

	h5.core.expose(logic);
})();