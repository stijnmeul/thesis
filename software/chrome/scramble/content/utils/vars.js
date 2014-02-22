/**
 * @fileOverview Contains a misc of global variables/objects used by the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ---- Dialog chrome locations ----
/** @constant */
const DIALOGS = 'chrome://scramble/content/hci/';
/** @constant */
const BUNDLE = 'scramble_strings';

// ---- For IO Purposes ----
/** @constant */
const AM = 'ALL_MEMBERS';
/** @constant */
const AG = 'ALL_GROUPS';
/** @constant */
const ALL = 'All';
/** @constant */
const MEMBER = "member";
/** @constant */
const GROUP = "group";
/** @constant */
const MEMBERS = "members";
/** @constant */
const DESC = "description";
/** @constant */
const GROUPS = "groups";
/** @constant */
const GROUPFILE = "Scramble XML Group File";
/** @constant */
const NAME = "name";
/** @constant */
const ID = "id";
/** @constant */
const FINGER = "fingerprint";
/** @constant */
const EXPIR = "exp";
/** @constant */
const PATH = "chrome://scramble/locale/keyRing.xml"; // PATH2 = chrome://scramble/locale/keyRing.xml ;
/** @constant */
const PATH2 = "chrome://scramble/locale/keyRing.xml"; //for testing reasons... in practice PATH2 = PATH to save
/** @constant */
const EXTID = "scramble@primelife.eu";
/** @constant */
const EXTPrefs = "extensions.scramble.";
/** @constant */
const EXTDIR = "scrambleData"; 
/** @constant */
const EXTDATAFILE = "keychain.xml"; 
/** @constant */
const EXTPUBRINGFILE = "pubring.bpg"; 
/** @constant */
const EXTSECRINGFILE = "secring.bpg"; 


// ---- For enforcement purposes ----
/** @constant */
const FAIL = 'FAIL';
/** @constant */
const SUCC = "SUCCESS";
/** @constant */
const CNL = "CANCEL";
/** @constant */
const CRYPT = 'CRYPT';
/** @constant */
const DECRYPT = 'DECRYPT';
/** @constant */
const KEY_MGR = 'KEY_MANAGER';
/** @constant */
const SETT = 'SETTINGS';
/** @constant */
const CLEAN_KEY = 'KEY_ERASE';
/** @constant */
const EDITOR = "TXT_EDITOR";
/** @constant */
const ABT = 'ABOUT';
/** @constant */
const EMPTY_MSG = ' (Empty Group) ';
/** @constant */
const ServerURL = 'http://serenitybox.net/filipe/';
/** @constant */
const KEYServerGET = 'http://pgp.mit.edu:11371';
/** @constant */
const KEYServerPost = 'http://pgp.mit.edu:11371/pks/add';

// ---- Key and PGP purposes ----
/** @constant */
const PGPstart = "-----BEGIN PGP MESSAGE-----";
/** @constant */
const PGPend = "-----END PGP MESSAGE-----";
/** @constant */
const PLstart = "-----BEGIN PrimeLife ENCRYPTION-----"; //PrimeLife Encryption
/** @constant */
const PLend = "-----END PrimeLife ENCRYPTION-----"; 
/** @constant */
const PLURLstart = "-----BEGIN PrimeLife URL-----"; //PrimeLife URL
/** @constant */
const PLURLend = "-----END PrimeLife URL-----";
/** @constant */
const ENC = "[NON AUTHORIZED ENCRYPTED CONTENT]";
/** @constant */
const PrimeLifeInfo = "#### Encrypted using Scramble! v1.0 ####\n";

/** @constant */
const PGPKey_start = "-----BEGIN PGP PUBLIC KEY BLOCK-----";
/** @constant */
const PGPKey_end = "-----END PGP PUBLIC KEY BLOCK-----";
/** @constant */
const KeyPref = "gpg_key";
/** @constant */
const GnuPath = "gpg_path";
/** @constant */
const defaultkey = "default_gpg_key";
/** @constant */
const KEYChainPath = "keychain_path";
/** @constant */
const PubRingPath = "pubring_path";
/** @constant */
const SecRingPath = "secring_path";

/** @constant */
const TinyLink = "tinylinks";
/** @constant */
const OS = "Unknown";
/** @constant */
const WIN = "Windows";
/** @constant */
const UNIX = "Unix";
/** @constant */
const MAC = "MacOS";
/** @constant */
const UnixJCEScript = "java/openpgp/jce_lib/java_jceUnix.sh"
/** @constant */
const WinJCEScript = "java/openpgp/jce_lib/java_jceWin32.bat"

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