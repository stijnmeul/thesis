The current IBE implementation for Scramble is only tested for MAC.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%     FIREFOX EXTENSION INSTALLATION     %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

1.  Create a separate Firefox profile for the development of Scramble. Give it the name "profile_name"

2.  Install the Scramble files from the "scramble/test" folder

3.  After installing, start Firefox with the newly created profile by typing in the terminal:
      /Applications/Firefox.app/Contents/MacOS/firefox-bin -no-remote -P profile_name

4.  In the address bar, type the following and press enter:
      about:config

5.  Search for the variables by looking for "scramble"

6.  Change the value of the following variables:
      extensions.scramble.pubring_path     your_facebook_numerical_identifier
      extensions.scramble.secring_path     /Users/user_name/Library/Application Support/Firefox/Profiles/random_chars.profile_name/scrambleData/

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%       CLIENT SOCKET INSTALLATION       %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

7.  Open scramble/scramble-it-code/ibe/ (Normally the files in scramble/scramble-it-code/ibe should be the same file as in code/client)

8.  Compile the clientsocket.cpp file
      g++-4.7 clientsocket.cpp mapToDate.cpp ../../../code/miraclthread/source/bls_pair.cpp ../../../code/miraclthread/source/zzn24.cpp ../../../code/miraclthread/source/zzn8.cpp ../../../code/miraclthread/source/zzn4.cpp ../../../code/miraclthread/source/zzn2.cpp ../../../code/miraclthread/source/ecn4.cpp ../../../code/miraclthread/source/big.cpp ../../../code/miraclthread/source/zzn.cpp ../../../code/miraclthread/source/ecn.cpp ../../../code/miraclthread/source/mrgcm.c encryptedMessage.cpp authenticatedData.cpp plaintextMessage.cpp client_funcs.cpp broadcastMessage.cpp ../../../code/miraclthread/source/mraes.c ../../../code/miraclthread/source/miracl.a -D_REENTRANT -I ../../../code/miraclthread/include/ -L ../../../code/miraclthread/source/ -l pthread -lcurl -o clientsocket

NOTE: Do not execute the clientsocket binary as long as the DKG algorithm is not running. Doing so will give segmentation faults.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%       DKG ALGORITHM INSTALLATION       %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

9.  Open code/dkg/

10. Execute the bash script initialising the PKG servers
      bash startDkgs.sh

NOTE: Execution of startDkgs.sh assumes a Xampp distribution already being installed with the htdocs folder in /Applications/XAMPP/htdocs/

NOTE: The startDkgs.sh script initialises all PKGs with the password "yes". Change the bashscript and manually insert the desired password if a more secure initialisation is required.

11. Open scramble/scramble-it-code/ibe

12. Start the clientsocket.cpp binary file
      ./clientsocket

If everything worked out correctly, the Firefox scramble extension should be able now to encrypt and decrypt messages on Facebook by relying on identity-based encryption.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%           OTHER USEFUL FILES           %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

code/client/dkg_sender_oop.cpp    demonstrates how the identity-based encryption and decryption works when the DKG algorithm is already online listening for requests on the socket port
code/dkg/setupDkg.cpp             demonstrates how the DKG algorithm is currently programmed (without socket communication)