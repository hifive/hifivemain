(function() {
	var view = h5.core.view;
	var controller = {
		__name: 'query.QueryController',
		__init: function(context) {
			this.queryData = context.args.queryData;
			this.model = context.args.model;

			var $description = $('<p></p>');
			$description.text(this.queryData.description);
			$(this.rootElement).append($description);

			var $pre = $('<pre class="criteria"></pre>');
			$pre.text(QUnit.jsDump.parse(this.queryData.criteria));
			$(this.rootElement).append($pre);

			$(this.rootElement).append('<div class="result"></div>');

			this.model.createQuery().setCriteria(this.queryData.criteria).orderBy('id asc')
					.setLive().execute().onQueryComplete(this.ownWithOrg(function(query) {
						this.result = query.result;
					}));
		},
		'{this.model} itemsChange': function(context) {
			this.view.update('.result', 'query', {
				result: this.result
			});
		}
	};
	h5.core.expose(controller);
})();