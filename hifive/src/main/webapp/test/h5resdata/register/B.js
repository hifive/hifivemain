(function() {
	// BはAに依存
	h5.res.depend('h5resdata.register.A').resolve().done(function(A) {
		function B() {
			this.a = new A();
			this.b = 'b';
		}
		h5.res.register('h5resdata.register.B', B);
	});
})();