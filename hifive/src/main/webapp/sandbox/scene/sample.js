$(function() {
	h5.core.expose({
		__name: 'controllerSceneController',
		__init: function() {
			$(this.rootElement).append('<p>' + this.__name + '</p>');
		}
	});
	h5.core.controller('body', {
		__name: 'sample',
		__ready: function() {
			this.container = h5.scene.createSceneContainer('#hoge', isMain);
		},
		'.change click': function(ctx, $el) {
			var target = $el.data('target');
			var promise;
			if (target) {
				promise = this.container.changeScene(target);
			} else {
				promise = this.container.toDefaultScene();
			}
			promise.done(function() {
				console.log('done');
			});
		}
	});
});