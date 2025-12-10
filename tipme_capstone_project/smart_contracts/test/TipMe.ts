import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("TipMe", function () {
  async function setup() {
    const [owner, receiver, sender] = await ethers.getSigners();
    const tipMeFactory = await ethers.getContractFactory("TipMe");
    const tipMe = await tipMeFactory.deploy();
    return { tipMe, owner, receiver, sender };
  }

  describe("TESTS", async function () {
    const { tipMe, owner, receiver, sender } = await loadFixture(setup);
    it("should allow a user to create an account", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      const account = await tipMe.receivers(receiver.address);
      expect(account.exists).to.be.true;
      expect(account.name).to.equal("Receiver1");
    });

    it("should not allow a user to create more than one account", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      await expect(
        tipMe.connect(receiver).createAccount("Duplicate")
      ).to.be.revertedWith("Account already exists");
    });

    it("should allow someone to tip ETH to a receiver", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      const tipAmount = ethers.parseEther("1.0");

      await tipMe
        .connect(sender)
        .tip(receiver.address, "Great content!", { value: tipAmount });

      const account = await tipMe.receivers(receiver.address);
      expect(account.balance).to.equal(tipAmount);
    });

    it("should revert if tipping an unregistered receiver", async function () {
      await expect(
        tipMe
          .connect(sender)
          .tip(receiver.address, "Here you go!", {
            value: ethers.parseEther("0.1"),
          })
      ).to.be.revertedWith("Receiver does not exist");
    });

    it("should revert if tip amount is zero", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      await expect(
        tipMe.connect(sender).tip(receiver.address, "Hi!", { value: 0 })
      ).to.be.revertedWith("Tip amount must be > 0");
    });

    it("should allow a receiver to withdraw their balance", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      const tipAmount = ethers.parseEther("1.0");

      await tipMe
        .connect(sender)
        .tip(receiver.address, "Take my ETH", { value: tipAmount });

      const oldBalance = await ethers.provider.getBalance(receiver.address);

      const tx = await tipMe.connect(receiver).withdraw();
      const receipt = await tx.wait();

      // Gas cost for accurate accounting
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice!;

      const newBalance = await ethers.provider.getBalance(receiver.address);

      // New balance should have increased by `tipAmount - gasUsed`
      expect(newBalance).to.equal(oldBalance + tipAmount - gasUsed);

      // Confirm contract balance stored is now 0
      const account = await tipMe.receivers(receiver.address);
      expect(account.balance).to.equal(0);
    });

    it("should revert withdrawal if user has no registered account", async function () {
      await expect(tipMe.connect(sender).withdraw()).to.be.revertedWith(
        "No account found"
      );
    });

    it("should revert withdrawal if balance is zero", async function () {
      await tipMe.connect(receiver).createAccount("Receiver1");

      await expect(tipMe.connect(receiver).withdraw()).to.be.revertedWith(
        "No balance to withdraw"
      );
    });
  });
});
