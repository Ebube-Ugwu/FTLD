import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VotingContract", function () {
  const DURATION: number = 200;

  // Setup function to deploy the contract before each test
  async function setupFixture() {
    const [owner, voter1, voter2, nonVoter] = await ethers.getSigners();
    const votingContract = await ethers.deployContract("VotingContract");
    return { votingContract, owner, voter1, voter2, nonVoter };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { votingContract, owner } = await loadFixture(setupFixture);
      expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("Should have voting active and correct duration", async function () {
      const { votingContract } = await loadFixture(setupFixture);
      expect(await votingContract.votingActive()).to.equal(true);
      expect(await votingContract.votingDuration()).to.equal(DURATION);
    });
  });

  // Candidate Registration Tests
  describe("Candidate Registration", async function () {
    const { votingContract } = await loadFixture(setupFixture);
    it("Should register a candidate successfully", async function () {
      const tx = await votingContract.registerCandidate("Alice");
      await tx.wait();

      const candidate1 = await votingContract.candidates(1);
      expect(candidate1.id).to.equal(1);
      expect(candidate1.name).to.equal("Alice");
      expect(candidate1.score).to.equal(0);

      const arrayCandidate = await votingContract.candidateArray(0);
      expect(arrayCandidate.name).to.equal("Alice");

      // check for emitted event
      await expect(tx)
        .to.emit(votingContract, "CandidateRegistered")
        .withArgs("Alice", 1);
    });
  });

  // Voter Registration Tests
  describe("Voter Registration", async function () {
    const { votingContract, voter1, nonVoter } = await loadFixture(
      setupFixture
    );
    it("Should allow a user to register as a voter", async function () {
      await votingContract.connect(voter1).registerAVoter();
      // Check if registeredVoters mapping is updated
      expect(await votingContract.registeredVoters(voter1.address)).to.be.true;

      // Check the contract function
      expect(await votingContract.checkIfVoterIsRegistered(voter1.address)).to
        .be.true;
    });

    it("Should return false for an unregistered voter", async function () {
      expect(await votingContract.checkIfVoterIsRegistered(nonVoter.address)).to
        .be.false;
    });
  });

  // Voting Tests
  describe("Voting", async function () {
    const { votingContract, voter1, voter2, nonVoter } = await loadFixture(
      setupFixture
    );
    async function votingSetup() {
      // Register Candidates
      await votingContract.registerCandidate("Candidate A"); // ID 1
      await votingContract.registerCandidate("Candidate B"); // ID 2

      // Register Voters
      await votingContract.connect(voter1).registerAVoter();
      await votingContract.connect(voter2).registerAVoter();
    }

    it("Should allow a registered voter to vote and update state", async function () {
      const candidateId = 1;
      const tx = await votingContract
        .connect(voter1)
        .voteForACandidate(candidateId);
      await tx.wait();
      const candidate = await votingContract.candidates(candidateId);
      expect(candidate.score).to.equal(1);

      // Check total votes
      expect(await votingContract.totalVotes()).to.equal(1);

      // Check hasVoted status
      expect(await votingContract.hasVoted(voter1.address)).to.be.true;

      // Check emitted event
      await expect(tx)
        .to.emit(votingContract, "userVoted")
        .withArgs(voter1.address, candidateId, "Candidate A");
    });

    it("Should revert if voter is not registered", async function () {
      // nonVoter is not registered
      await expect(
        votingContract.connect(nonVoter).voteForACandidate(1)
      ).to.be.revertedWith("Voter is not registered");
    });

    it("Should revert if voter tries to vote more than once", async function () {
      // First vote is successful
      await votingContract.connect(voter1).voteForACandidate(1);

      // Second vote should fail
      await expect(
        votingContract.connect(voter1).voteForACandidate(2)
      ).to.be.revertedWith("Voter has already voted");
    });
  });

  // Manual Voting Control Tests
  describe("Voting Control", async function () {
    const { votingContract, owner, voter1, voter2, nonVoter } =
      await loadFixture(setupFixture);
    it("Should allow the owner to open voting", async function () {
      expect(await votingContract.votingActive()).to.be.true;
      await votingContract.connect(owner).closeVoting();
      expect(await votingContract.votingActive()).to.be.false;
    });

    it("Should allow the owner to close voting", async function () {
      await votingContract.connect(owner).closeVoting();
      expect(await votingContract.votingActive()).to.be.false;
      await votingContract.connect(owner).openVoting();
      expect(await votingContract.votingActive()).to.be.true;
    });

    it("Should revert if non-owner tries to close voting", async function () {
      await expect(
        votingContract.connect(voter1).closeVoting()
      ).to.be.revertedWith("Only owner can close voting");
    });

    it("Should revert if non-owner tries to open voting", async function () {
      await expect(
        votingContract.connect(voter1).openVoting()
      ).to.be.revertedWith("Only owner can open voting");
    });

    it("Should revert vote if voting is not active", async function () {
      // Register Candidate and Voter
      await votingContract.registerCandidate("Charlie");
      await votingContract.connect(voter1).registerAVoter();

      // Owner closes voting
      await votingContract.connect(owner).closeVoting();

      // Vote should fail
      await expect(
        votingContract.connect(voter1).voteForACandidate(1)
      ).to.be.revertedWith("Voting is not active");
    });
  });

  // Duration Checks
  describe("Duration Checks", async function () {
    const { votingContract, voter1, voter2, nonVoter } = await loadFixture(
      setupFixture
    );
    it("Should revert vote if voting duration is exceeded", async function () {
      // Register Candidate and Voter
      await votingContract.registerCandidate("Daniel");
      await votingContract.connect(voter1).registerAVoter();

      // Increase time past the voting duration (DURATION is 200 seconds)
      await time.increase(DURATION + 1); // Move time forward 201 seconds

      // Vote should fail
      await expect(
        votingContract.connect(voter1).voteForACandidate(1)
      ).to.be.revertedWith("voting duration exceeded");
    });
  });
});
