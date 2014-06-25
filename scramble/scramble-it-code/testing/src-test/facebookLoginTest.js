facebookLoginTest = TestCase("facebookTest");

facebookLoginTest.prototype.testFbLogin = function() {
	var fb = new facebookLogin;
	assertNotSame(fb.getAuthToken(), null);
};
