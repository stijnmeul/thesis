Practical Identity-based encryption for Online Social Networks
======

This is my github working directory containing all my thesis work on identity-based encryption for Online Social Networks. My thesis builds on Scramble ( https://www.cosic.esat.kuleuven.be/scramble/ ) a tool developed at COSIC, KU Leuven to broadcast encrypted status updates on Online Social Networks (OSNs).

Scramble originally relies on OpenPGP for key management such that any user with a keypair uploaded to the OpenPGP infrastructure can start receiving encrypted messages. However, since an average user is not familiar with asymmetric cryptography and all the additional steps required for uploading and generating keys to the OpenPGP infrastructure, the existing Scramble architecture is often considered complex by average social network users.

Instead of relying on OpenPGP, my thesis designs a new system relying on identity-based encryption for key management. To show the feasibility of our solution, Scramble is further extended to apply our architecture to Facebook. Facebook URLs are being used as a public key. Private keys are initialsed based on Distributed Key Generation (DKG) in order to keep them secure as long as a threshold number of Public Key Generators (PKGs) are not colluding. For more information please check out the "thesistext" folder containing my full thesis text or the "pets" folder containing an article that was submitted to HotPETS 2014.

This thesis was promoted by prof. dr. ir. Vincent Rijmen and prof. dr. ir. Bart Preneel and supervised by Filipe Beato. Thesis results were evaluated by assessors prof. dr. ir. Claudia Diaz and prof. dr. ir. Frank Piessens. The thesis was graded with 18/20 (90%) and received the Vasco Data Security thesis prize ( http://eng.kuleuven.be/evenementen/masterproefprijzen2013-2014/criteriamasterproefprijzen2014 ).

Directory structure
=====
anotherScramble          Firefox files required for the Scramble Firefox extension.

code                     C and C++ files required for the identity-based encryption mechanism

 code/client             C and C++ files for clientside encryption and decryption
 
 code/cppmiracl          Old C and C++ MIRACL files that can not be used for multithreading
 
 code/dkg                C and C++ files to support the DKG mechanism
 
 code/htdocs-thesis      PHP files and C++ binaries for the server side of the DKG mechanism
 
 code/miraclthread       C and C++ MIRACL files used to support the identity-based encryption mechanism
 
 code/setupPkg           C and C++ files to build, install and copy the correct serverside binaries to the PHP server path
 
 code/socketDemo         A simple socket demo

guidelines               files describing the goals of this thesis and how the text should look like

intermediatepresentation Keynote of my intermediate thesis presentation in December 2013

pets                     short article that was submitted to HotPETS 2014 (although not accepted)

planning                 Ghant chart with deadlines

scramble                 old Firefox files for an outdated Scramble extension

securitymodel            files describing how the attacker model looks like. See thesistext for updated version.


