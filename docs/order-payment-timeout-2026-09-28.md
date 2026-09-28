# 待付款超时关闭修改说明（2026-09-28）

## 业务行为

- 用户确认的时限为订单创建后 30 分钟，继续付款不延长。
- 后端每分钟按 ID 分页扫描已到期、未支付、无支付流水的订单，复用已有取消事务。
- 先确认微信关单成功，再条件更新订单为 CANCELED / CLOSED，并在同一事务中返还库存、积分、解除优惠券占用。并发或重复执行不会重复返还。
- 保存 cancelReason 为“支付超时，订单已关闭”。手动取消及历史已关闭订单仍为空，不推断历史原因。
- 微信已支付、网络异常、关单返回订单不存在等未确认关闭情形，保留资源并记录警告，下轮继续检查；持续异常需要人工核查支付结果，不能当作已关闭。
- 列表和详情返回 paymentExpiresAt（创建时间加 30 分钟）、paymentExpired（服务端判断）。前端展示截止时间、超时处理中或关闭原因，不根据本机时间自行更改订单状态。
- 页面进入/返回、付款和取消操作后重新查询；超时详情提供点击刷新。无新增倒计时或持续轮询。
- 关闭结果读取后刷新实际积分及券信息，不在客户端自行返还。
- 结算页继续付款重新获取原订单支付参数，禁止直接沿用旧签名绕过服务端时限。

## 后端修改

| 文件（相对于 jfx-api） | 内容 |
| --- | --- |
| src/order/order-payment-timeout.ts | 30 分钟常量、截止时间及响应字段 |
| src/order/order-completion.task.ts | 增加每分钟待付款关闭任务，复用已有调度模块 |
| src/order/order.service.ts | 抽出共用取消事务入口、扫描超时订单、拒绝超时继续支付、补列表和详情字段 |
| src/order/order.repository.ts | 到期扫描、读取创建时间、保存关闭原因 |
| src/payment/payment.service.ts | 微信下单传原订单 time_expire，过期请求直接拒绝 |
| prisma/schema.prisma | 新增可空 cancelReason 字段 |
| prisma/migrations/20260928000000_add_order_cancel_reason/migration.sql | 新增字段迁移，不修改历史业务记录 |
| src/order/order-payment-timeout.spec.ts | 边界、关单失败、支付竞争、重复返还和分页测试 |
| src/order/order-payment.spec.ts、order-detail.spec.ts | 补固定截止时间及返回字段断言 |
| src/payment/payment-retry.spec.ts | 验证微信截止参数及过期拒绝 |

## 前端修改

| 文件（相对于 jfx-web） | 内容 |
| --- | --- |
| src/types/product-order.d.ts | 补截止时间、服务端超时标记及关闭原因类型 |
| src/pages-sub/my/productOrder/productOrder.vue | 展示截止/关闭原因、屏蔽超时付款入口、操作后刷新 |
| src/pages-sub/my/productOrderDetail/productOrderDetail.vue | 区分超时处理中与已关闭，展示原因并支持刷新 |
| src/pages/confirmOrder/confirmOrder.vue | 继续付款重新校验已有订单，拒绝后跳转原订单核对 |
| src/utils/order-benefits.ts | 刷新用户实际积分和优惠券，防止账号切换后覆盖资料 |
| tests/order-detail.cjs、tests/order-payment.cjs | 补超时入口、权益刷新、旧支付参数不可继续使用的验证 |

## 验证

- 前端 111 项测试通过，pnpm tsc 和 pnpm build:mp-weixin 通过。
- 后端超时、取消、支付、订单详情、安装确认及微信关单/重试共 7 组、127 项测试通过；pnpm build 通过。
- Prisma 客户端已重新生成；数据库迁移尚未执行，没有操作真实订单，没有发起真实支付或微信关单。
- 未做真机及真实微信端到端验收。前端保留原有插件兼容提示和构建依赖循环警告。

## 上线顺序与注意事项

1. 在目标数据库完成备份并确认其他待执行迁移，进入 jfx-api 执行 pnpm exec prisma migrate deploy，再执行 pnpm exec prisma generate 和 pnpm build。
2. 发布并重启后端。已有超过 30 分钟的待付款订单也会进入扫描；检查“超时关单未完成，下轮重试”日志，持续失败时核查微信订单状态。
3. 发布小程序，验证付款截止前/后、手动取消、支付成功回调延迟、微信关单故障、券及积分返还。
4. 本轮没有更改原有 1 分钱测试支付及回调金额校验配置，不能据此视为正式支付已验收。

微信 time_expire 表示支付结束时间，不等于关单；仍需后端调用关单接口。微信对距离下单不足 1 分钟的结束时间有自动调整行为，因此服务端时限校验和关单任务共同兜底，不能只依赖微信截止参数。依据：[微信支付小程序下单文档](https://pay.wechatpay.cn/doc/v3/merchant/4012791897)。
