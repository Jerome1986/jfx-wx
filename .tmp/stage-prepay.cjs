const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const target = path.resolve('../jfx-api/src/order/order.service.ts')
const original = fs.readFileSync(target, 'utf8')
const start = original.indexOf('      // 支付接入位置：事务已提交')
const end = original.indexOf('\n    } catch (error)', start)
if (start < 0 || end < 0) throw Error('Missing method boundary')
const replacement = `      // 本地订单已提交；预下单失败也必须返回订单 ID，客户端只能重试原订单付款。
      try {
        const payRes = await this.wxPayRepo.wxPay(
          '商品订单', order.orderNo, order.openid,
          order.payableAmount.mul(100).toNumber(), paymentExpiresAt(order.createdAt),
        )
        return { ...payRes, orderId: order.id }
      } catch {
        this.logger.warn(\`订单 \${order.id} 已创建，微信预下单未成功，等待原订单重试\`)
        return {
          orderId: order.id,
          paymentReady: false as const,
          paymentMessage: '订单已创建，支付暂不可用，请在订单中继续支付',
        }
      }`
fs.writeFileSync('.tmp/order.service.ts', original.slice(0, start) + replacement + original.slice(end))
fs.writeFileSync('.tmp/prepay-source.sha', crypto.createHash('sha256').update(original).digest('hex'))
