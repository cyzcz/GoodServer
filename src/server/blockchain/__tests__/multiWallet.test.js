import { MultiWallet } from '../MultiWallet'
import { Web3Wallet } from '../Web3Wallet'
import { BaseAdminWallet } from '../BaseAdminWallet'
import { CeloAdminWallet } from '../CeloAdminWallet'
import { XdcAdminWallet } from '../XdcAdminWallet'

jest.mock('../../utils/tx-manager', () => ({
  getManager: jest.fn(() => ({}))
}))

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
const VERIFIED_ACCOUNT = '0x1111111111111111111111111111111111111111'

const createIdentityContractStub = rootAddress => ({
  methods: {
    getWhitelistedRoot: jest.fn(() => ({
      call: jest.fn().mockResolvedValue(rootAddress)
    }))
  }
})

describe('MultiWallet.isConnected with uninitialized wallet (#582)', () => {
  test('succeeds when XDC is uninitialized and Celo positively verifies the account', async () => {
    const fuseWallet = new Web3Wallet('AdminWallet', {
      env: 'test',
      fuse: { network_id: 122, httpWeb3Provider: 'http://localhost:8545' }
    })
    fuseWallet.identityContract = createIdentityContractStub(ADDRESS_ZERO)

    const celoWallet = new CeloAdminWallet({ network: 'development' })
    celoWallet.identityContract = createIdentityContractStub(VERIFIED_ACCOUNT)

    const baseWallet = new BaseAdminWallet({ network: 'development' }, celoWallet)

    const xdcWallet = new XdcAdminWallet({ network: 'development' })
    xdcWallet.identityContract = undefined
    const warnSpy = jest.spyOn(xdcWallet.log, 'warn')

    const multiWallet = new MultiWallet({
      122: fuseWallet,
      42220: celoWallet,
      8453: baseWallet,
      50: xdcWallet
    })

    await expect(multiWallet.isConnected(VERIFIED_ACCOUNT)).resolves.toBe(true)
    expect(warnSpy).toHaveBeenCalledWith(
      'isConnected: identity contract unavailable, wallet not initialized',
      expect.objectContaining({
        address: VERIFIED_ACCOUNT,
        wallet: 'XdcAdminWallet'
      })
    )
  })

  test('returns false when XDC is uninitialized and no other wallet positively verifies the account', async () => {
    const fuseWallet = new Web3Wallet('AdminWallet', {
      env: 'test',
      fuse: { network_id: 122, httpWeb3Provider: 'http://localhost:8545' }
    })
    fuseWallet.identityContract = createIdentityContractStub(ADDRESS_ZERO)

    const celoWallet = new CeloAdminWallet({ network: 'development' })
    celoWallet.identityContract = createIdentityContractStub(ADDRESS_ZERO)

    const baseWallet = new BaseAdminWallet({ network: 'development' }, celoWallet)

    const xdcWallet = new XdcAdminWallet({ network: 'development' })
    xdcWallet.identityContract = undefined
    const warnSpy = jest.spyOn(xdcWallet.log, 'warn')

    const multiWallet = new MultiWallet({
      122: fuseWallet,
      42220: celoWallet,
      8453: baseWallet,
      50: xdcWallet
    })

    await expect(multiWallet.isConnected(VERIFIED_ACCOUNT)).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalledWith(
      'isConnected: identity contract unavailable, wallet not initialized',
      expect.objectContaining({
        address: VERIFIED_ACCOUNT,
        wallet: 'XdcAdminWallet'
      })
    )
  })
})
