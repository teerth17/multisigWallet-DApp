const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { PANIC_CODES } = require("@nomicfoundation/hardhat-chai-matchers/panic");

describe("EtherWallet", function () {
  const amount = ethers.parseEther("0");
  async function deployFixture() {
    const [owner1, owner2, owner3, otherAccount] = await ethers.getSigners();
    const quorumRequired = 2;

    const MultiSigWallet = await hre.ethers.getContractFactory(
      "MultisigWallet"
    );
    const multisigWallet = await MultiSigWallet.deploy(
      [owner1.address, owner2.address, owner3.address],
      quorumRequired
    );

    return { multisigWallet, owner1, owner2, owner3, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy and set the owners and quorum", async () => {
      const { multisigWallet, owner1, owner2, owner3, otherAccount } =
        await loadFixture(deployFixture);

      const owners = await multisigWallet.getOwners();
      assert.equal(owners[0], owner1.address);
      assert.equal(owners[1], owner2.address);
      assert.equal(owners[2], owner3.address);

      //   expect(owners).to.have.same.deep.members([
      //     owner1.address,
      //     owner2.address,
      //     owner3.address,
      //   ]);

      expect(await multisigWallet.quorumRequired()).to.equal(2);
    });
  });

  describe("Withdraw", function () {
    it("Should Create Withdraw Tx", async () => {
      const { multisigWallet, owner1 } = await loadFixture(deployFixture);

      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      const withdrawTxes = await multisigWallet.getWithdrawTxes();
      const actualTx = withdrawTxes[0];

      expect(actualTx.to).to.be.equal(owner1.address);
      expect(actualTx.amount).to.be.equal(amount);
      expect(actualTx.approvals).to.be.equal(0);
      expect(actualTx.sent).to.be.equal(false);
    });

    it("Should revert the tx when withdraw is called by other person", async () => {
      const { multisigWallet, otherAccount } = await loadFixture(deployFixture);

      await expect(
        multisigWallet
          .connect(otherAccount)
          .createWithdrawTx(otherAccount, amount)
      ).to.be.revertedWith("not owner");
    });
  });

  describe("Approve Withdraw transaction", function () {
    it("Should approve existing withdraw transaction", async () => {
      const { multisigWallet, owner1 } = await loadFixture(deployFixture);

      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      const approveTx = await multisigWallet.approveWithdrawTx(0);
      await approveTx.wait();

      const withdrawTxes = await multisigWallet.getWithdrawTxes();
      const actualTx = withdrawTxes[0];

      expect(actualTx.to).to.be.equal(owner1.address);
      expect(actualTx.amount).to.be.equal(amount);
      expect(actualTx.approvals).to.be.equal(1);
      expect(actualTx.sent).to.be.equal(false);
    });
    it("Should send the existing withdraw transaction after majority approval", async () => {
      const { multisigWallet, owner1, owner2, owner3 } = await loadFixture(
        deployFixture
      );
      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      let approveTx = await multisigWallet.approveWithdrawTx(0);
      await approveTx.wait();

      approveTx = await multisigWallet.connect(owner2).approveWithdrawTx(0);
      await approveTx.wait();

      const withdrawTxes = await multisigWallet.getWithdrawTxes();
      const actualTx = withdrawTxes[0];

      expect(actualTx.to).to.equal(owner1.address);
      expect(actualTx.amount).to.equal(amount);
      expect(actualTx.approvals).to.equal(2);
      expect(actualTx.sent).to.equal(true);
    });

    it("Should revert the tx when approve is called by someone other than the owner", async function () {
      const { multisigWallet, owner1, otherAccount } = await loadFixture(
        deployFixture
      );

      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      await expect(
        multisigWallet.connect(otherAccount).approveWithdrawTx(0)
      ).to.be.revertedWith("not owner");
    });

    it("Should revert the tx when approve is called for a transaction that does not exist", async function () {
      const { multisigWallet, owner1 } = await loadFixture(deployFixture);

      await expect(
        multisigWallet.connect(owner1).approveWithdrawTx(0)
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it("Should revert the tx when approve is called for a transaction that has already been approved by the caller", async function () {
      const { multisigWallet, owner1 } = await loadFixture(deployFixture);

      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      const approveTx = await multisigWallet.approveWithdrawTx(0);
      await approveTx.wait();

      await expect(
        multisigWallet.connect(owner1).approveWithdrawTx(0)
      ).to.be.revertedWithCustomError(multisigWallet, "TxAlreadyApproved");
    });

    it("Should revert the tx when approve is called for a transaction that has already been sent", async function () {
      const { multisigWallet, owner1, owner2, owner3 } = await loadFixture(
        deployFixture
      );

      const withdrawTx = await multisigWallet.createWithdrawTx(
        owner1.address,
        amount
      );
      await withdrawTx.wait();

      let approveTx = await multisigWallet.approveWithdrawTx(0);
      await approveTx.wait();

      approveTx = await multisigWallet.connect(owner2).approveWithdrawTx(0);
      await approveTx.wait();

      await expect(
        multisigWallet.connect(owner3).approveWithdrawTx(0)
      ).to.be.revertedWithCustomError(multisigWallet, "TxAlreadySent");
    });
  });
  describe("Check Balance", function () {
    it("Should check default balance of the MultisigWallet contract", async function () {
      const { multisigWallet } = await loadFixture(deployFixture);

      const balance = await multisigWallet.balanceOf();

      expect(balance.toString()).to.equal(amount);
    });

    it("Should check balance of the MultisigWallet contract after depositing some Ether", async function () {
      const { multisigWallet } = await loadFixture(deployFixture);

      const tx = await multisigWallet.deposit({
        value: ethers.parseEther("1"),
      });
      await tx.wait();

      const balance = await multisigWallet.balanceOf();

      expect(balance.toString()).to.equal(ethers.parseEther("1"));
    });
  });
  describe("Deposit", function () {
    it("Should deposit Ether to the contract", async function () {
      try {
        const { multisigWallet } = await loadFixture(deployFixture);

        const tx = await multisigWallet.deposit({
          value: ethers.parseEther("1"),
        });
        await tx.wait();

        // const balance = await ethers.provider.getBalance(
        //   multisigWallet.address
        // );
        const balance = await multisigWallet.balanceOf();

        expect(balance.toString()).to.equal(ethers.parseEther("1"));
      } catch (error) {
        console.log(error);
      }
    });
  });
});
