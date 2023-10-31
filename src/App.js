import { ConnectButton } from "@rainbow-me/rainbowkit";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import { useContractRead, useWalletClient } from "wagmi";
import { getContract } from "wagmi/actions";
import MultisigWallet from "./artifacts/contracts/MultisigWallet.sol/MultisigWallet.json";
function App() {
  const multisigWalletContract = {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: MultisigWallet.abi,
  };

  // MultisigWallet Smart contract handling
  const [scBalance, setScBalance] = useState(0);
  const [scPendingTransactions, setScPendingTransactions] = useState([]);
  const [scTotalTransactionCount, setScTotalTransactionCount] = useState(0);
  const [ethToUseForDeposit, setEthToUseForDeposit] = useState(0);
  const [ethToUseForWithdrawal, setEthToUseForWithdrawal] = useState(0);
  const [ethAddrToUseForWithdrawal, setEthAddrToUseForWithdrawal] = useState(0);

  const { data: scOwners } = useContractRead({
    ...multisigWalletContract,
    functionName: "getOwners",
  });
  // Get the total number of withdraw transactions
  const { data: withdrawTxCount } = useContractRead({
    ...multisigWalletContract,
    functionName: "getWithdrawTxCount",
    watch: true,
  });
  console.log(withdrawTxCount)
  // Get the current balance of the multisig wallet
  const { data: contractBalance } = useContractRead({
    ...multisigWalletContract,
    functionName: "balanceOf",
    watch: true,
  });
  // Get the list of transactions
  const { data: withdrawTxes } = useContractRead({
    ...multisigWalletContract,
    functionName: "getWithdrawTxes",
    watch: true,
  });

  useEffect(() => {
    if (contractBalance) {
      let temp = contractBalance / 10 ** 18;
      setScBalance(temp);
    }
    if (withdrawTxCount) {
      setScTotalTransactionCount(withdrawTxCount.toNumber());
    }
    if (withdrawTxes) {
      let pendingTxes = [];
      for (let i = 0; i < withdrawTxes.length; i++) {
        if (!withdrawTxes[i][3]) {
          pendingTxes.push({
            transactionIndex: i,
            to: withdrawTxes[i][0],
            amount: parseInt(ethers.formatEther(withdrawTxes[i][1])),
            approvals: withdrawTxes[i][2].toNumber(),
          });
        }
      }
      setScPendingTransactions(pendingTxes);
    }
  }, [contractBalance, withdrawTxCount, withdrawTxes]);

  const { data: signer } = useWalletClient();
  const contract = getContract({
    ...multisigWalletContract,
    provider: signer,
  });
  // Deposit ETH to the MultisigWallet smart contract
  const depositToEtherWalletContract = async () => {
    await contract.deposit({
      value: ethers.parseEther(ethToUseForDeposit),
    });
    setEthToUseForDeposit(0);
  };
  // Create Withdraw ETH tx in the MultisigWallet smart contract
  const withdrawFromEtherWalletContract = async () => {
    await contract.createWithdrawTx(
      ethAddrToUseForWithdrawal,
      ethers.parseEther(ethToUseForWithdrawal)
    );
    setEthToUseForWithdrawal(0);
    setEthAddrToUseForWithdrawal(0);
  };
  // Approve pending withdraw tx in the MultisigWallet smart contract
  const approvePendingTransaction = async (transactionIndex) => {
    await contract.approveWithdrawTx(transactionIndex);
  };

  return (
    <div className="container flex flex-col  items-center mt-10">
      <div className="flex mb-6">
        <ConnectButton />
      </div>

      <Container>
        <Row>
          <h3 className="text-5xl font-bold mb-20">{"Multisig Wallet Info"}</h3>
        </Row>
        <Row>
          <Col md="auto">Address:</Col>
          <Col>{multisigWalletContract.addressOrName}</Col>
        </Row>
        <Row>
          <Col md="auto">Balance:</Col>
          <Col>{scBalance} ETH</Col>
        </Row>
        <Row>
          <Col md="auto">Total Withdraw Transactions:</Col>
          <Col>{scTotalTransactionCount}</Col>
        </Row>
        <Row>
          <Col md="auto">Owners:</Col>
          <Col>
            <ListGroup>
              {scOwners &&
                scOwners.map((scOwner, i) => {
                  return <ListGroup.Item key={i}>{scOwner}</ListGroup.Item>;
                })}
            </ListGroup>
          </Col>
        </Row>
      </Container>

      <Container>
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Deposit to EtherWallet Smart Contract"}
          </h3>
        </Row>
        <Row>
          <Form>
            <Form.Group className="mb-3" controlId="numberInEthDeposit">
              <Form.Control
                type="text"
                placeholder="Enter the amount in ETH"
                onChange={(e) => setEthToUseForDeposit(e.target.value)}
              />
              <Button variant="primary" onClick={depositToEtherWalletContract}>
                Deposit
              </Button>
            </Form.Group>
          </Form>
        </Row>
      </Container>

      <Container>
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Withdraw from EtherWallet Smart Contract"}
          </h3>
        </Row>
        <Row>
          <Form>
            <Form.Group className="mb-3" controlId="numberInEthWithdraw">
              <Form.Control
                type="text"
                placeholder="Enter the amount in ETH"
                onChange={(e) => setEthToUseForWithdrawal(e.target.value)}
              />
              <Form.Control
                type="text"
                placeholder="Enter the ETH address to withdraw to"
                onChange={(e) => setEthAddrToUseForWithdrawal(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={withdrawFromEtherWalletContract}
              >
                Withdraw
              </Button>
            </Form.Group>
          </Form>
        </Row>
      </Container>

      <Container>
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Pending Withdraw Transactions"}
          </h3>
        </Row>
        <Row>
          <Table striped hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Number of Approvals</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scPendingTransactions.map((tx, i) => {
                return (
                  <tr key={i}>
                    <td>{i}</td>
                    <td>{tx.to}</td>
                    <td>{tx.amount} ETH</td>
                    <td>{tx.approvals}</td>
                    <td>
                      <Button
                        variant="success"
                        onClick={() =>
                          approvePendingTransaction(tx.transactionIndex)
                        }
                      >
                        Approve
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Row>
      </Container>
    </div>
  );
}

export default App;
