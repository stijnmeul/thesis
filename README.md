Identity-based encryption for Online Social Networks
======

This is my github working directory containing all my thesis work on identity-based encryption for Online Social Networks. My thesis builds on Scramble ( https://www.cosic.esat.kuleuven.be/scramble/ ) a tool developed at COSIC, KU Leuven to broadcast encrypted status updates on Online Social Networks (OSNs).

Scramble originally relies on OpenPGP for key management such that any user with a keypair uploaded to the OpenPGP infrastructure can start receiving encrypted messages. However, since an average user is not familiar with asymmetric cryptography and all the additional steps required for uploading and generating keys to the OpenPGP infrastructure, the existing Scramble architecture is often considered complex by average social network users.

Instead of relying on OpenPGP, my thesis designs a new system relying on identity-based encryption for key management. To show the feasibility of our solution, Scramble is further extended to apply our architecture to Facebook. Facebook URLs are being used as a public key. Private keys are initialsed based on Distributed Key Generation (DKG) in order to keep them secure as long as a threshold number of Public Key Generators (PKGs) are not colluding. For more information please check out the "thesistext" folder containing my full thesis text or the "pets" folder containing an article that was submitted to HotPETS 2014.

Directory structure
=====
