"use client";

import { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import RPC from "./web3RPC"; // for using web3.js
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
// EVM
import Web3 from "web3";
// Solana
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
// Tezos
//@ts-ignore
import * as tezosCrypto from "@tezos-core-tools/crypto-utils";
import { hex2buf } from "@taquito/utils";
// StarkEx and StarkNet
//@ts-ignore
import starkwareCrypto from "@starkware-industries/starkware-crypto-utils";

// Polkadot
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";

// Near
// import { keyStores, KeyPair, utils } from "near-api-js";
// Will address in future PR

//@ts-ignore
import { ec as elliptic } from "elliptic";

import { Button } from "../components/ui/button";

const clientId =
  "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk"; // get from https://dashboard.web3auth.io

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );

  useEffect(() => {
    const init = async () => {
      try {
        // ETH_Goerli
        const web3auth = new Web3Auth({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x5",
          },
          web3AuthNetwork: "cyan",
        });
        setWeb3auth(web3auth);

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "default",
          },
          adapterSettings: {
            whiteLabel: {
              name: "TokenFlows",
              logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
              logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
              defaultLanguage: "en",
              dark: true, // whether to enable dark mode. defaultValue: false
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        await web3auth.initModal();

        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const getAllAccounts = async () => {
    // EVM chains
    const polygon_address = await getPolygonAddress();
    const bnb_address = await getBnbAddress();

    // Solana
    let solana_address;
    try {
      solana_address = await getSolanaAddress();
    } catch (error) {
      solana_address = "Solana JSON RPC Error";
    }
    // Others
    const tezos_address = await getTezosAddress();
    const starkex_address = await getStarkExAddress();
    const starknet_address = await getStarkNetAddress();
    const polkadot_address = await getPolkadotAddress();
    // const near_address = await getNearAddress();

    uiConsole(
      "Polygon Address: " + polygon_address,
      "BNB Address: " + bnb_address,
      "Solana Address: " + solana_address,
      "Tezos Address: " + tezos_address,
      "StarkEx Address: " + starkex_address,
      "StarkNet Address: " + starknet_address,
      "Polkadot Address: " + polkadot_address
      // "Near Address: " + near_address
    );
  };

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    uiConsole("Logged in Successfully!");
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    uiConsole("ETH Address: " + address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const getPolygonAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();

    const polygonPrivateKeyProvider = new EthereumPrivateKeyProvider({
      config: {
        chainConfig: {
          chainId: "0x13881",
          rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
          displayName: "Polygon Mumbai",
          blockExplorer: "https://mumbai.polygonscan.com/",
          ticker: "MATIC",
          tickerName: "MATIC",
        },
      },
    });
    await polygonPrivateKeyProvider.setupProvider(privateKey);
    const web3 = new Web3(polygonPrivateKeyProvider.provider as any);
    const address = (await web3.eth.getAccounts())[0];
    return address;
  };

  const getBnbAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();

    const bnbPrivateKeyProvider = new EthereumPrivateKeyProvider({
      config: {
        chainConfig: {
          chainId: "0x38",
          rpcTarget: "https://rpc.ankr.com/bsc",
          displayName: "Binance SmartChain Mainnet",
          blockExplorer: "https://bscscan.com/",
          ticker: "BNB",
          tickerName: "BNB",
        },
      },
    });
    await bnbPrivateKeyProvider.setupProvider(privateKey);
    const web3 = new Web3(bnbPrivateKeyProvider.provider as any);
    const address = (await web3.eth.getAccounts())[0];
    return address;
  };

  const getSolanaAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();

    const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
    const ed25519key = getED25519Key(privateKey).sk.toString("hex");

    // Get user's Solana's public address
    const solanaPrivateKeyProvider = new SolanaPrivateKeyProvider({
      config: {
        chainConfig: {
          chainId: "0x3",
          rpcTarget: "https://rpc.ankr.com/solana",
          displayName: "Solana Mainnet",
          blockExplorer: "https://explorer.solana.com/",
          ticker: "SOL",
          tickerName: "Solana",
        },
      },
    });
    await solanaPrivateKeyProvider.setupProvider(ed25519key);
    console.log(solanaPrivateKeyProvider.provider);

    const solanaWallet = new SolanaWallet(
      solanaPrivateKeyProvider.provider as any
    );
    const solana_address = await solanaWallet.requestAccounts();
    return solana_address[0];
  };

  const getTezosAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    const keyPairTezos = tezosCrypto.utils.seedToKeyPair(hex2buf(privateKey));
    const address = keyPairTezos?.pkh;
    return address;
  };

  // Will address this in future PR
  // const getNearAddress = async () => {
  //   if (!provider) {
  //     uiConsole("provider not initialized yet");
  //     return;
  //   }
  //   const rpc = new RPC(provider);
  //   const privateKey = await rpc.getPrivateKey();
  //   const keyPair = KeyPair.fromString(utils.serialize.base_encode(privateKey));
  //   const myKeyStore = new keyStores.InMemoryKeyStore();
  //   await myKeyStore.setKey("testnet", "web3auth-test-account.testnet", keyPair);
  //   const publicKey = utils.PublicKey.fromString(keyPair?.getPublicKey().toString());
  //   const address = Buffer.from(publicKey.data).toString("hex")
  //   return address;
  // };

  const getStarkExAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    const keyPairStarkEx = starkwareCrypto.ec.keyFromPrivate(privateKey, "hex");
    const starkex_account = starkwareCrypto.ec.keyFromPublic(
      keyPairStarkEx.getPublic(true, "hex"),
      "hex"
    );
    const address = starkex_account.pub.getX().toString("hex");
    return address;
  };

  const getStarkNetAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    const keyPairStarkNet = starkwareCrypto.ec.keyFromPrivate(
      privateKey,
      "hex"
    );
    const starknet_account = starkwareCrypto.ec.keyFromPublic(
      keyPairStarkNet.getPublic(true, "hex"),
      "hex"
    );
    const address = starknet_account.pub.getX().toString("hex");
    return address;
  };

  const getPolkadotAddress = async () => {
    await cryptoWaitReady();
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = (await rpc.getPrivateKey()) as string;
    const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });

    const keyPair = keyring.addFromUri("0x" + privateKey);
    const address = keyPair.address;
    return address;
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loggedInView = (
    <>
      <div className="space-y-2">
        <div onClick={getUserInfo}>
          <Button>Get User Info</Button>
        </div>
        <div onClick={authenticateUser}>
          <Button>Get ID Token</Button>
        </div>
        <div onClick={getAccounts}>
          <Button>Get ETH Account</Button>
        </div>
        <div onClick={getAllAccounts}>
          <Button>Get All Accounts</Button>
        </div>
        <div onClick={getBalance}>
          <Button>Get ETH Balance</Button>
        </div>
        <div onClick={sendTransaction}>
          <Button>Send Transaction</Button>
        </div>
        <div onClick={signMessage}>
          <Button>Sign Message</Button>
        </div>
        <div onClick={logout}>
          <Button>Log Out</Button>
        </div>
      </div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <div onClick={login} className="flex justify-end">
      <Button>Login</Button>
    </div>
  );

  return (
    <div className="p-5">
      <div className="grid">{provider ? loggedInView : unloggedInView}</div>
    </div>
  );
}

export default App;
