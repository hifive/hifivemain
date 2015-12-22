(function() {
	var controller = {
		__name: 'app.controller.PageController',
		childController: h5.res.require('app.controller.ChildController'),
		myLogic: h5.res.require('app.logic.MyLogic'),
		__construct: function() {
			$('body').append('<p>' + this.__name + 'の初期化処理を開始します(__construct実行)</p>');
		},
		__ready: function() {
			$(this.rootElement).append('<p>' + this.__name + 'のバインドが完了しました(__ready実行)</p>');
		},
		__init: function() {
			$('body').append('<p>' + this.__name + 'の__initが実行されました</p>');
		},
		__dispose:function(){
			$('body').append('<p>' + this.__name + 'をdisposeしました</p>');
		}
	};
	h5.core.expose(controller);
})();