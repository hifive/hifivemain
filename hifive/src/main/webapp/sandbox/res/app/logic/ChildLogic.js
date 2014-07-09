(function() {
	var logic = {
		__name: 'app.logic.ChildLogic',
		__construct: function() {
			$('body').append('<p>' + this.__name + 'の初期化を開始します</p>');
		},
		__ready: function() {
			var d = $.Deferred();
			setTimeout(this.own(function() {
				$('body').append('<p>' + this.__name + 'の__readyが実行されました</p>');
				d.resolve();
			}), 500);
			return d.promise();
		}
	};
	h5.core.expose(logic);
})();