(function() {
	//AはBに依存
	h5.res.require('app.constructor.B').resolve().done(function(B) {
		var ary = ['register後の同期処理が実行されて', 'いない'];
		function A() {
			this.b = new B();
			this.a = 'a';
			this.ary = ary;
		}
		h5.res.register('app.constructor.A', A);
		ary[1] = ('いる');
	});
	console.log('loaded A');
})();