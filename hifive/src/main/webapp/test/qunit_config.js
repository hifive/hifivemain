// hidepass
(function() {
	var qunitconfig = H5_TEST_ENV && H5_TEST_ENV.qunit;
	if (!qunitconfig) {
		return;
	}
	QUnit.config.hidepassed = qunitconfig.hidepassed === "true" || qunitconfig.hidepassed === true;
	if (qunitconfig.hidetestresult === "true" || qunitconfig.hidetestresult === true) {
		QUnit.config.begin.push(function() {
			setTimeout(function() {
				$('#qunit-testresult').css('display', 'none');
			}, 0);
		});

		QUnit.config.done.push(function() {
			$('#qunit-testresult').css('display', 'block');
		});
	}
})();
