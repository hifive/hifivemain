(function() {
	//BはCに依存
	h5.res.require('app.constructor.C').resolve().done(function(C) {
		function B() {
			this.c = new C();
			this.b = 'b';
		}

		h5.res.register('app.constructor.B', B);
	});
	console.log('loaded B');
})();