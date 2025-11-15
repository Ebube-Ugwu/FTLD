# FTLD Module 2 Assignment

## Add Necessary Fixes to the Voting Contract

### Fixes Added

  - Fixed the issue of voters voting infinitely by tracking each address
  passed in a map data structure (address => bool) and requiring that the
  voters value in the map is false before calling the voting function.

  - Fixed getCandidateWithHighestVote() by initializing the winnerId to the
  id of the first candidate rather than 0, to prevent giving the wrong result
  in a case where there is only one candidate.

  - Fixed checkIfVoterIsRegistered function by using the voter address passed
  to the function rather than msg.sender.

### NOTE:

  - getCandidateWithHighestVote uses iteration and is thus too expensive to be
  done on chain, and should rather be handled on the client.

  - DEAD CODE: The owner, votingDuration, and winner (in the struct) variables are all set but never used for any logic. The CandidateWon event is also never emitted. This is "dead code" that doesn't do anything.
