import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '../../generated/prisma/client'
import { OrderService } from './order.service'

describe('建单与微信预下单失败边界', () => {
  const actor = { userId: 7, type: 'user' as const, role: 'CUSTOMER' as const }
  function setup(error?: Error) {
    const order = { id: 15, orderNo: 'existing-order', payableAmount: new Prisma.Decimal('123.45'), createdAt: new Date() }
    const prepare = jest.fn().mockResolvedValue({ openid: 'test-openid' })
    const createWithResources = jest.fn().mockResolvedValue(order)
    const wxPay = error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue({ paySign: 'signed' })
    const transaction = jest.fn(async fn => fn({}))
    const service = new OrderService({ createWithResources } as never, { prepare } as never, { wxPay } as never, { $transaction: transaction } as never)
    return { service, prepare, createWithResources, wxPay, transaction }
  }
  it.each([new BadRequestException('provider 400'), new ConflictException('provider 409'), new ServiceUnavailableException('provider 503'), new Error('timeout')])('已提交后 %s 返回已有订单而非建单错误', async error => {
    const app = setup(error)
    const result = await app.service.confrimOrder({} as never, actor)
    expect(result).toMatchObject({ orderId: 15, paymentReady: false })
    expect(app.createWithResources).toHaveBeenCalledTimes(1)
    expect(app.transaction).toHaveBeenCalledTimes(1)
    expect(app.wxPay).toHaveBeenCalledWith('商品订单', 'existing-order', 'test-openid', 12345, expect.any(Date))
  })
  it('建单前参数错误仍失败，不调用微信', async () => {
    const app = setup()
    app.prepare.mockRejectedValue(new BadRequestException('invalid booking'))
    await expect(app.service.confrimOrder({} as never, actor)).rejects.toBeInstanceOf(BadRequestException)
    expect(app.createWithResources).not.toHaveBeenCalled()
    expect(app.wxPay).not.toHaveBeenCalled()
  })
  it('正常预下单保持原返回结构', async () => {
    const app = setup()
    await expect(app.service.confrimOrder({} as never, actor)).resolves.toEqual({ orderId: 15, paySign: 'signed' })
  })
})
