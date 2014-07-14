(function() {
	var view = h5.core.view;
	var controller = {
		__name: 'query.QueryController',
		__init: function(context) {
			this.query = context.args.query;
			this.model = context.args.model;

			var $description = $('<p></p>');
			$description.text(this.query.description);
			$(this.rootElement).append($description);

			var $pre = $('<pre class="criteria"></pre>');
			$pre.text(QUnit.jsDump.parse(this.query.criteria));
			$(this.rootElement).append($pre);

			$(this.rootElement).append('<div class="result"></div>');

			this.result = this.model.query(this.query.criteria);
			//			$(this.rootElement).append();
		},
		'{this.model} itemsChange': function(context) {
			this.view.update('.result', 'query', {
				result: this.result
			});
		}
	};
	h5.core.expose(controller);
})();