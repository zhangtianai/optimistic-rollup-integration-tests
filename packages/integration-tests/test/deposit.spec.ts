import './setup'
import { Config } from '../src/config'

import { Web3Provider, JsonRpcProvider } from '@ethersproject/providers'
import { ganache } from '@eth-optimism/ovm-toolchain'
import { OptimismProvider, sighashEthSign } from '@eth-optimism/provider'
import { getContractFactory } from '@eth-optimism/rollup-contracts'
import { getContractAddress } from '@ethersproject/address'
import { computeAddress } from '@ethersproject/transactions'

// Commonly used test mnemonic
const mnemonic =
  'abandon abandon abandon abandon abandon abandon ' +
  'abandon abandon abandon abandon abandon about'

// Address derived at m/44'/60'/0'/0 of test mnemonic
const etherbase = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'

describe('Transactions', () => {
  let l1Provider
  let l1Signer
  let l2Provider
  let addressResolver

  before(async () => {
    l1Provider = new JsonRpcProvider('http://l1_chain:9545')
    l1Signer = l1Provider.getSigner()
    const web3 = new Web3Provider(
      ganache.provider({
        mnemonic,
      })
    )

    l2Provider = new OptimismProvider(Config.L2NodeUrlWithPort(), web3)

    // Set up address resolver which we can use to resolve any required contract addresses
    const deployerAddress = computeAddress('0xdf8b81d840b9cafc8cd68cf94f093726b174b5f109eba11a3f2a559e5f9e8bce')
    const addressResolverAddress = getContractAddress({
      from: deployerAddress,
      nonce: 0
    })
    const AddressResolverFactory = getContractFactory('AddressResolver')
    addressResolver = AddressResolverFactory.connect(l1Signer).attach(addressResolverAddress)
  })

  it('should allow us to get the l1ToL2TxQueueAddress', async () => {
    const sleep = m => new Promise(r => setTimeout(r, m))
    // Set up L1ToL2TransactionQueue contract object
    const l1ToL2TransactionQueueAddress = await addressResolver.getAddress('L1ToL2TransactionQueue')
    const L1ToL2TransactionQueueFactory = getContractFactory('L1ToL2TransactionQueue')
    const l1ToL2TransactionQueue = L1ToL2TransactionQueueFactory.connect(l1Signer).attach(l1ToL2TransactionQueueAddress)

    // Send an L1ToL2Transaction
    const txResponse = await l1ToL2TransactionQueue.enqueueL1ToL2Message('0x' + '01'.repeat(20), 500_000, '0x' + '00')
    const txReceipt = await txResponse.wait()
    await sleep(1000)
  }).timeout(100_000_000)
})

