import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import { BN, Idl } from '@project-serum/anchor';

import { createFakeWallet } from './gemBank'
import { GemFarmClient } from '@gemworks/gem-farm-ts';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {   SystemProgram } from '@solana/web3.js';
import { programs } from '@metaplex/js';
import * as anchor from "@project-serum/anchor";
const gem_farm = require('./gem_farm.json')
const gem_bank = require('./gem_bank.json')
export async function initGemFarm(
  conn,
  wallet
) {
  const walletToUse = wallet ?? createFakeWallet();
  // console.log("using wallet for gemfarm init: ", walletToUse.publicKey.toBase58())
  const farmIdl = gem_farm;
  // console.log("farmIdl done :", farmIdl)
  const bankIdl = gem_bank;
  // console.log("bankIdl done: ", bankIdl)
  return new GemFarm(conn, walletToUse, farmIdl, bankIdl);
}

export class GemFarm extends GemFarmClient {
  constructor(conn, wallet, farmIdl, bankIdl) {
    const farmProgId = "DHt8RudHrdh9n562t1nmu6n9Rw74w3QMfSonvB2miiQn";
    const bankProgId = "5zz9sqvDCCQvVZUDV759grwPezRV6v1XwqZGqvGZZ7Yc";
    super(conn, wallet, farmIdl, farmProgId, bankIdl, bankProgId);
  }

  async initFarmWallet(
    rewardAMint,
    rewardAType,
    rewardBMint,
    rewardBType,
    farmConfig
  ) {
    const farm = Keypair.generate();
    const bank = Keypair.generate();

    const result = await this.initFarm(
      farm,
      this.wallet.publicKey,
      this.wallet.publicKey,
      bank,
      rewardAMint,
      rewardAType,
      rewardBMint,
      rewardBType,
      farmConfig
    );

    console.log('new farm started!', farm.publicKey.toBase58());
    console.log('bank is:', bank.publicKey.toBase58());

    return { farm, bank, ...result };
  }

  async updateFarmWallet(
    farm,
    newConfig,
    newManager
  ) {
    const result = await this.updateFarm(
      farm,
      this.wallet.publicKey,
      newConfig,
      newManager
    );

    console.log('updated the farm');
    return result;
  }

  async authorizeFunderWallet(farm, funder) {
    const result = await this.authorizeFunder(
      farm,
      this.wallet.publicKey,
      funder
    );

    console.log('authorized funder', funder.toBase58());

    return result;
  }

  async deauthorizeFunderWallet(farm, funder) {
    const result = await this.deauthorizeFunder(
      farm,
      this.wallet.publicKey,
      funder
    );

    console.log('DEauthorized funder', funder.toBase58());

    return result;
  }

  async fundVariableRewardWallet(
    farm,
    rewardMint,
    amount,
    duration
  ) {
    const rewardSource = await this.findATA(rewardMint, this.wallet.publicKey);

    const config = {
      amount: new BN(amount),
      durationSec: new BN(duration),
    };

    const result = this.fundReward(
      farm,
      rewardMint,
      this.wallet.publicKey,
      rewardSource,
      config
    );

    console.log('funded variable reward with mint:', rewardMint.toBase58());

    return result;
  }

  async fundFixedRewardWallet(
    farm,
    rewardMint,
    amount,
    duration,
    baseRate,
    denominator,
    t1RewardRate,
    t1RequiredTenure,
    t2RewardRate,
    t2RequiredTenure,
    t3RewardRate,
    t3RequiredTenure,
  ) {
    const rewardSource = await this.findATA(rewardMint, this.wallet.publicKey);

    const config = {
      schedule: {
        baseRate: new BN(baseRate),
        tier1: t1RewardRate
          ? {
            rewardRate: new BN(t1RewardRate),
            requiredTenure: new BN(t1RequiredTenure),
          }
          : null,
        tier2: t2RewardRate
          ? {
            rewardRate: new BN(t2RewardRate),
            requiredTenure: new BN(t2RequiredTenure),
          }
          : null,
        tier3: t3RewardRate
          ? {
            rewardRate: new BN(t3RewardRate),
            requiredTenure: new BN(t3RequiredTenure),
          }
          : null,
        denominator: new BN(denominator),
      },
      amount: new BN(amount),
      durationSec: new BN(duration),
    };

    const result = await this.fundReward(
      farm,
      rewardMint,
      this.wallet.publicKey,
      rewardSource,
      undefined,
      config
    );

    console.log('funded fixed reward with mint:', rewardMint.toBase58());

    return result;
  }

  async cancelRewardWallet(farm, rewardMint) {
    const result = await this.cancelReward(
      farm,
      this.wallet.publicKey,
      rewardMint,
      this.wallet.publicKey
    );

    console.log('cancelled reward', rewardMint.toBase58());

    return result;
  }

  async lockRewardWallet(farm, rewardMint) {
    const result = await this.lockReward(
      farm,
      this.wallet.publicKey,
      rewardMint
    );

    console.log('locked reward', rewardMint.toBase58());

    return result;
  }

  async refreshFarmerWallet(farm, farmerIdentity) {
    const result = await this.refreshFarmer(farm, farmerIdentity);

    console.log('refreshed farmer', farmerIdentity.toBase58());

    return result;
  }

  async treasuryPayoutWallet(
    farm,
    destination,
    lamports
  ) {
    const result = await this.payoutFromTreasury(
      farm,
      this.wallet.publicKey,
      destination,
      new BN(lamports)
    );

    console.log('paid out from treasury', lamports);

    return result;
  }

  async initFarmerWallet(farm) {
    const result = await this.initFarmer(
      farm,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    console.log('initialized new farmer', this.wallet.publicKey.toBase58());

    return result;
  }

  async stakeWallet(farm) {
    const result = await this.stake(farm, this.wallet.publicKey);

    console.log('begun staking for farmer', this.wallet.publicKey.toBase58());

    return result;
  }

  async unstakeWallet(farm) {
    const result = await this.unstake(farm, this.wallet.publicKey);

    console.log('ended staking for farmer', this.wallet.publicKey.toBase58());

    return result;
  }

  async claimWallet(
    farm,
    rewardAMint,
    rewardBMint
  ) {
    const result = await this.claim(
      farm,
      this.wallet.publicKey,
      rewardAMint,
      rewardBMint
    );

    console.log('claimed rewards for farmer', this.wallet.publicKey.toBase58());

    return result;
  }

  async flashDepositWallet(
    farm,
    gemAmount,
    gemMint,
    gemSource,
    creator
  ) {
    const farmAcc = await this.fetchFarmAcc(farm);
    const bank = farmAcc.bank;

    const [mintProof, bump] = await this.findWhitelistProofPDA(bank, gemMint);
    const [creatorProof, bump2] = await this.findWhitelistProofPDA(
      bank,
      creator
    );
    const metadata = await programs.metadata.Metadata.getPDA(gemMint);

    console.log("flashDeposit doc:",)
    console.log("farm:",farm.toString())
    console.log("this.wallet.publicKey:",this.wallet.publicKey.toString())
    console.log("new BN(gemAmount):",new BN(gemAmount).toString())
    console.log("gemMint:",gemMint.toString())
    console.log("gemSource:",gemSource.toString())
    console.log("mintProof:",mintProof.toString())
    console.log("metadata:",metadata.toString())
    console.log("creatorProof:",creatorProof.toString())

    const result = await this.flashDeposit(
      farm,
      this.wallet.publicKey,
      new BN(gemAmount),
      gemMint,
      gemSource,
      mintProof,
      metadata,
      creatorProof
    );

    console.log('added extra gem for farmer', this.wallet.publicKey.toBase58());

    return result;
  }



  async addToBankWhitelistWallet(
    farm,
    addressToWhitelist,
    whitelistType
  ) {
    const result = await this.addToBankWhitelist(
      farm,
      this.wallet.publicKey,
      addressToWhitelist,
      whitelistType
    );

    console.log(`${addressToWhitelist.toBase58()} added to whitelist`);

    return result;
  }

  async getInitFarmerInstruction(farm, bank, farmerIdentity, farmerPDA, vault) {
    return this.farmProgram.instruction.initFarmer({
      accounts: {
        farm: farm,
        farmer: farmerPDA,
        identity: farmerIdentity,
        payer: farmerIdentity,
        feeAcc: this.feeAccount,
        bank: bank,
        vault,
        gemBank: this.bankProgram.programId,
        systemProgram: SystemProgram.programId,
      }
    });
  }
  async getDepositGemInstruction(bank, //: PublicKey,
                                 vault, //PublicKey,
                                 vaultOwner, //PublicKey | Keypair,
                                 gemAmount, //: BN,
                                 gemMint,   //:  nft.mint
                                 gemSource) { // nft.pubkey
    const [gemBox, gemBoxBump] = await this.findGemBoxPDA(vault, gemMint);
    const [GDR, GDRBump] = await this.findGdrPDA(vault, gemMint);
    const [vaultAuth, vaultAuthBump] = await this.findVaultAuthorityPDA(vault);
    const [gemRarity, gemRarityBump] = await this.findRarityPDA(bank, gemMint);
    const [mintProof, bump] = await this.findWhitelistProofPDA(bank, gemMint);
    const [creatorProof, bump2] = await this.findWhitelistProofPDA(
        bank,
        "Fa82fKmrQXngd2w6jd7WHw78uRYa1hEYx4MweXESHZEQ"
    );
    // for NFTs
    const metadata = await programs.metadata.Metadata.getPDA(gemMint);
    const remainingAccounts = [];
    if (mintProof)
      remainingAccounts.push({
        pubkey: mintProof,
        isWritable: false,
        isSigner: false,
      });
    if (metadata)
      remainingAccounts.push({
        pubkey: metadata,
        isWritable: false,
        isSigner: false,
      });
    // always have the creator proof
    remainingAccounts.push({
      pubkey: creatorProof,
      isWritable: false,
      isSigner: false,
    });
    // const signers = [];
    // signers.push(vaultOwner);
    return this.bankProgram.instruction.depositGem(
        vaultAuthBump,
        gemRarityBump,
        gemAmount,
        {
          accounts: {
            bank,
            vault,
            owner: vaultOwner,
            authority: vaultAuth,
            gemBox,
            gemDepositReceipt: GDR,
            gemSource,
            gemMint,
            gemRarity,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          remainingAccounts
        }
    );
  }
  async getStakeInstruction(
      farm, // : PublicKey,
      bank,
      farmerIdentity, //: PublicKey | Keypair,
      farmerPDA,
      farmAuth,
      farmAuthBump,
      farmerBump,
      farmAccBank,
      vault) {
    return this.farmProgram.instruction.stake(farmAuthBump, farmerBump, {
      accounts: {
        farm,
        farmer: farmerPDA,
        identity: farmerIdentity,
        bank: farmAccBank,
        vault,
        farmAuthority: farmAuth,
        gemBank: this.bankProgram.programId,
      }}
    );
  }


}