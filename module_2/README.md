# FTLD Module 2 Assignment

## Add Necessary Fixes to the Voting Contract

### Features Added

  - Added two functions to allow the ownder open and close voting.

  - Added feature to return total number of votes by adding a new
   state variable **totalVotes** which gets incremented after each 
   successful vote, this however increases gas costs. A better 
   implementation would be to iterate through the candidate array
   and add up the scores of each candidate, **OFF CHAIN!!** (by the
   client/frontend).

### Fixes Added

  - Fixed the issue of voters voting infinitely by tracking each address
  passed in a map data structure (address => bool) and requiring that the
  voters value in the map is false before calling the voting function and 
  then setting it to true when they successfully vote.

  - Fixed getCandidateWithHighestVote() by initializing the winnerId to the
  id of the first candidate rather than 0, to prevent giving the wrong result
  in a case where there is only one candidate.

  - Fixed checkIfVoterIsRegistered function by using the voter address passed
  to the function rather than msg.sender.

### NOTE:

  - getCandidateWithHighestVote uses iteration and is thus too expensive to be
  done on chain, and should rather be handled on the client.

  - DEAD CODE: The owner, votingDuration, and winner (in the struct) variables are all set but never used for any logic. The CandidateWon event is also never emitted. This is "dead code" that doesn't do anything.
