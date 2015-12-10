$(function() {
	h5.core.expose({
		__name: 'sample.NavigateHandler',
		__ready: function() {
			this.view.append(this.rootElement, 'nav', {
				method: 'navigate'
			});
		},
		'.navigate click': function(ctx, $el) {
			var target = $el.data('target');
			var title = $('input[name="title-test"]').val() || null;
			this.scene.navigate({
				to: target,
				title: title
			});
		}
	});
	h5.core.expose({
		__name: 'sample.SampleSceneController',
		_navigatorController: sample.NavigateHandler,
		sceneTitle: 'サンプルシーン',
		__init: function() {
			$(this.rootElement).append('<p>' + this.__name + '</p>');
		}
	});
	h5.core.expose({
		__name: 'sample.PageController',
		__ready: function() {
			this.view.append(this.rootElement, 'nav', {
				method: 'changeScene'
			});
			var $container = $('#hoge');
			var isMain = location.href.indexOf('?isMain=true') !== -1;
			this.container = h5.scene.createSceneContainer($container, isMain);
			this._orgLocation = location.href;
		},
		'.changeScene click': function(ctx, $el) {
			var target = $el.data('target');
			var title = $('input[name="title-test"]').val() || null;
			var promise = this.container.changeScene({
				to: target,
				title: title
			});
			promise.done(function() {
				console.log('done');
			});
		},
		'.reload click':function(){
			location.href = this._orgLocation;
		}
	});
	h5.core.controller('body', sample.PageController);
});