initDlgTest = TestCase("initDlgTest");

initDlgTest.prototype.testConnectToFb = function() {

	var initdlg = new initDlg;
	assertSame(initdlg.connectToFacebook(), true);
};
