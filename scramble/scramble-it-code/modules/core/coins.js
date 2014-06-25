/**
 * @fileOverview Contains the data for the bridge between the application and the crypto
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

//set constants
const Cc = Components.classes;
const Ci = Components.interfaces;
const EXPORTED_SYMBOLS = ["openpgp", "vars", "textNodesXpath", "valueNodesXpath"];

var openpgp = {
	obj: null
};

// general variables...
var vars = {
	bundle: null,
	_VERSION: "1.2",

	//paths and app related namings...
	_PATH: "chrome://scramble/locale/keychain.xml",
	_EXTID: "scramble@primelife.eu",
	_EXTDIR: "scrambleData",
	_EXTDATAFILE: "keychain.xml", 
	_EXTPUBRINGFILE: "pubring.bpg",
	_EXTSECRINGFILE: "secring.bpg", 
	
	//preferences values
	_KEYChainPath: "keychain_path",
	_PubRingPath: "pubring_path",
	_SecRingPath: "secring_path",
	_SettingsDir: "settings_dir",
	_TinyLink: "tinylinks",
	_defaultkey: "default_gpg_key",
	
	//results
	_FAIL: "FAIL",
	_WIN: "Windows",
	_UNIX: "Unix",
	_MAC: "MacOS",
	_ENC: "[NOT AUTHORIZED ENCRYPTED CONTENT]",
	
	//crypto headers
	_PGPstart: "BEGIN PGP MESSAGE",
	_PGPend: "END PGP MESSAGE",
    // _PLstart: "PrimeLife ENCRYPTION", //PrimeLife Encryption - @Iulia: it should be changed?
    // _PLend: "PrimeLife ENCRYPTION", 
    // _PLURLstart: "PrimeLife URL", //PrimeLife URL - @Iulia: it should be changed?
    // _PLURLend: "PrimeLife URL",
	_PLstart: "BEGIN Scramble! ENCRYPTION", 
	_PLend: "END Scramble! ENCRYPTION", 
	_PLURLstart: "BEGIN Scramble! URL", 
	_PLURLend: "END Scramble! URL",    
	_PGPKey_start: "-----BEGIN PGP PUBLIC KEY BLOCK-----", 
	
};


// ---- For page rendering purposes ----
/** @constant */
var textNodesXpath = "/html/head/title/text()"
                   + "|/html/body//div/text()"
                   + "|/html/body//span/text()"
                   + "|/html/body//h1/text()"
                   + "|/html/body//h2/text()"
                   + "|/html/body//h3/text()"
                   + "|/html/body//h4/text()"
                   + "|/html/body//h5/text()"
                   + "|/html/body//h6/text()"
                   + "|/html/body//address/text()"
                   + "|/html/body//bdo/text()"
                   + "|/html/body//em/text()"
                   + "|/html/body//strong/text()"
                   + "|/html/body//dfn/text()"
                   + "|/html/body//code/text()"
                   + "|/html/body//samp/text()"
                   + "|/html/body//kbd/text()"
                   + "|/html/body//var/text()"
                   + "|/html/body//cite/text()"
                   + "|/html/body//abbr/text()"
                   + "|/html/body//acronym/text()"
                   + "|/html/body//q/text()"
                   + "|/html/body//sub/text()"
                   + "|/html/body//sup/text()"
                   + "|/html/body//p/text()"
                   + "|/html/body//pre/text()"
                   + "|/html/body//ins/text()"
                   + "|/html/body//del/text()"
                   + "|/html/body//li/text()"
                   + "|/html/body//dt/text()"
                   + "|/html/body//dd/text()"
                   + "|/html/body//caption/text()"
                   + "|/html/body//th/text()"
                   + "|/html/body//td/text()"
                   + "|/html/body//a/text()"
                   + "|/html/body//object/text()"
                   + "|/html/body//tt/text()"
                   + "|/html/body//i/text()"
                   + "|/html/body//b/text()"
                   + "|/html/body//big/text()"
                   + "|/html/body//small/text()"
                   + "|/html/body//noframes/text()"
                   + "|/html/body//iframe/text()"
                   + "|/html/body//button/text()"
                   + "|/html/body//option/text()"
                   + "|/html/body//textarea/text()"
                   + "|/html/body//label/text()"
                   + "|/html/body//fieldset/text()"
                   + "|/html/body//legend/text()"
                   + "|/html/body//font/text()";

/** @constant */
var valueNodesXpath = "/html/body//input[@type='text']"
  					+ "|/html/body//textarea"
  					+ "|/html/body//@abbr"
  					+ "|/html/body//@abbr"
  					+ "|/html/body//@alt"
  					+ "|/html/body//@label"
  					+ "|/html/body//@standby"
  					+ "|/html/body//@summary"
  					+ "|/html/body//@title"
  					+ "|/html/body//input[@type!='hidden']/@value"
  					+ "|/html/body//option/@value"
  					+ "|/html/body//button/@value";