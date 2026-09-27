<script setup lang="ts">
import { validateBooking } from '@/utils/order-booking'
import { canSubmitAppointment } from '@/utils/appointment-access'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAddressStore } from '@/stores/modules/address'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useCartStore, cartItemKey, formatPrice } from '@/stores/modules/cart'
import { requireCartLogin } from '@/utils/cart-access'
import { useMemberStore } from '@/stores/modules/member'
import { calculateDiscounts, evaluateCoupon } from '@/utils/order-discounts'
import { confirmOrder, requestWechatPayment, type WechatPaymentParams } from '@/api/order'
import { userInfoFindOne, getUserSummary } from '@/api/user'
// 下单或微信支付是否进行中
const paying = ref(false)
// 已创建订单的支付参数，取消后继续支付时复用
const paymentParams = ref<WechatPaymentParams | null>(null)
const createdOrderId = ref<number | null>(null)
// 创建结果不明确时阻止再次下单，避免重复占用库存与优惠
const creationUncertain = ref(false)
// 微信已返回支付成功，阻止重复付款
const paymentSucceeded = ref(false)
// 已创建订单后锁定金额和下单选项
const submittedAmount = ref('')
// 保存提交时的抵扣明细，避免刷新积分和优惠券后改变订单展示
const submittedDiscounts = ref<ReturnType<typeof calculateDiscounts> | null>(null)
const orderLocked = computed(
  () => paying.value || !!paymentParams.value || creationUncertain.value || paymentSucceeded.value,
)
// 购物车和结算状态仓库
const cartStore = useCartStore()
// 当前用户信息仓库
const memberStore = useMemberStore()
// 待结算商品和抵扣前商品总额
const { checkoutItems: products, checkoutTotal: productAmount } = storeToRefs(cartStore)
// 是否启用积分抵扣
const usePoints = ref(false)
// 优惠券选择弹层是否显示
const couponVisible = ref(false)
// 已确认使用的用户优惠券 ID
const selectedCouponId = ref<number | null>(null)
// 弹层中待确认的用户优惠券 ID
const pendingCouponId = ref<number | null>(null)
// 用于校验优惠券有效期的当前时间
const now = ref(Date.now())
// 商品总额，单位为分
const totalCents = computed(() => Math.round(Number(productAmount.value) * 100))
// 当前用户可用积分
const pointsBalance = computed(() =>
  Math.max(0, Math.floor(Number(memberStore.profile?.points) || 0)),
)
// 用户优惠券列表及本次订单的可用性校验结果
const couponOptions = computed(() =>
  (memberStore.profile?.userCoupons ?? []).map((record) =>
    evaluateCoupon(record, totalCents.value, now.value),
  ),
)
// 本次订单可使用的优惠券数量
const availableCouponCount = computed(
  () => couponOptions.value.filter((item) => !item.reason).length,
)
// 当前选中且仍可使用的优惠券
const selectedCoupon = computed(() =>
  couponOptions.value.find((item) => item.record.id === selectedCouponId.value && !item.reason),
)
// 优惠券抵扣、积分抵扣和应付金额，单位为分
const amounts = computed(
  () =>
    submittedDiscounts.value ??
    calculateDiscounts(
      totalCents.value,
      selectedCoupon.value?.discountCents ?? 0,
      pointsBalance.value,
      usePoints.value,
    ),
)
// 将分转换为保留两位小数的金额文案
const money = (cents: number) => (cents / 100).toFixed(2)
// 抵扣后的应付金额文案
const payableAmount = computed(() => submittedAmount.value || money(amounts.value.payableCents))
// 使用当前优惠券后最多可抵扣的积分金额
const maxPointsDiscount = computed(
  () =>
    calculateDiscounts(
      totalCents.value,
      selectedCoupon.value?.discountCents ?? 0,
      pointsBalance.value,
      true,
    ).pointsDiscount,
)
// 打开优惠券弹层并回显当前选择
const openCoupons = () => {
  if (orderLocked.value) return
  now.value = Date.now()
  pendingCouponId.value = selectedCoupon.value?.record.id ?? null
  couponVisible.value = true
}
// 校验并确认优惠券选择
const confirmCoupon = () => {
  now.value = Date.now()
  // 查找弹层中待确认的优惠券
  const chosen = couponOptions.value.find((item) => item.record.id === pendingCouponId.value)
  if (pendingCouponId.value !== null && (!chosen || chosen.reason)) {
    uni.showToast({ title: chosen?.reason || '优惠券已不可用', icon: 'none' })
    return
  }
  selectedCouponId.value = pendingCouponId.value
  couponVisible.value = false
}
// 切换积分抵扣状态并刷新有效期校验时间
const togglePoints = (event: { detail: { value: boolean } }) => {
  if (orderLocked.value) return
  now.value = Date.now()
  usePoints.value = event.detail.value
}
// 切换账号时重置优惠券和积分选择
watch(
  () => cartStore.userId,
  () => {
    paymentParams.value = null
    createdOrderId.value = null
    appointmentDate.value = ''
    appointmentTime.value = ''
    submittedAmount.value = ''
    submittedDiscounts.value = null
    creationUncertain.value = false
    paymentSucceeded.value = false
    selectedCouponId.value = null
    pendingCouponId.value = null
    usePoints.value = false
    couponVisible.value = false
  },
)
// 待结算商品总件数
const totalCount = computed(() => products.value.reduce((sum, item) => sum + item.quantity, 0))
// 根据商品安装服务标记生成提示文案
const installationNote = computed(() =>
  products.value.every((item) => item.installationIncluded)
    ? '已含基础安装服务'
    : products.value.some((item) => item.installationIncluded)
    ? '部分商品包含安装服务，详见商品标注'
    : '商品不含安装服务',
)
// 返回商品列表继续选购
const goShopping = () => uni.switchTab({ url: '/pages/product/product' })
// 页面显示时刷新时间并检查登录状态
onShow(() => {
  now.value = Date.now()
  requireCartLogin('/pages/confirmOrder/confirmOrder')
})
// 页面卸载时清理本次结算快照
onUnload(() => cartStore.clearCheckout())

// 地址状态仓库
const addressStore = useAddressStore()
// 当前选中的服务地址
const { selectedAddress } = storeToRefs(addressStore)
// 已选手机号
const selectedPhone = computed(() => {
  // 手机号
  const phone = selectedAddress.value?.phone || ''
  return /^1\d{10}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone
})

// 订单备注弹层是否显示
const remarkVisible = ref(false)
// 已确认的订单备注
const orderRemark = ref('')
// 备注弹层中的编辑草稿
const remarkDraft = ref('')
// 已选择的预约安装日期
const appointmentDate = ref('')
// 已选择的预约安装时段
const appointmentTime = ref('')
// 订单备注入口的展示文案
const remarkLabel = computed(() => orderRemark.value || '选填，给商家留言')

// 跳转收货地址页面
const openAddress = () => {
  if (orderLocked.value) return
  uni.navigateTo({ url: '/pages-sub/my/address/address' })
}

// 跳转预约安装并接收选择结果
const openAppointment = () => {
  if (orderLocked.value) return
  if (!canSubmitAppointment()) return
  uni.navigateTo({
    url:
      '/pages-sub/my/appointment/appointment?appointmentDate=' +
      encodeURIComponent(appointmentDate.value) +
      '&timeSlot=' +
      encodeURIComponent(appointmentTime.value),
    events: {
      // 保存预约页面返回的日期和时段
      appointmentSelected: (data: { appointmentDate: string; timeSlot: string }) => {
        if (orderLocked.value) return
        appointmentDate.value = data.appointmentDate
        appointmentTime.value = data.timeSlot
      },
    },
  })
}

// 订单备注编辑逻辑
const openRemark = () => {
  if (orderLocked.value) return
  remarkDraft.value = orderRemark.value
  remarkVisible.value = true
}
// 确认备注
const confirmRemark = () => {
  orderRemark.value = remarkDraft.value.trim()
  remarkVisible.value = false
}
const openCreatedOrder = () => {
  if (!createdOrderId.value) return
  uni.redirectTo({
    url:
      '/pages-sub/my/productOrderDetail/productOrderDetail?id=' +
      createdOrderId.value +
      '&confirmPayment=1',
    fail: () => uni.showToast({ title: '未能打开订单，请点击查看订单重试', icon: 'none' }),
  })
}
// 创建支付订单，再调用微信支付；取消后复用本次订单参数。
const pay = async () => {
  // 1. 防止重复下单或付款，并检查登录状态和微信支付环境。
  if (paying.value || paymentSucceeded.value || creationUncertain.value) return
  if (!requireCartLogin('/pages/confirmOrder/confirmOrder')) return
  if (typeof wx === 'undefined' || typeof wx.requestPayment !== 'function') {
    uni.showToast({ title: '请在微信小程序中支付', icon: 'none' })
    return
  }
  // 保存发起支付的用户 ID，避免异步返回时更新其他账号。
  const ownerId = cartStore.userId
  if (!paymentParams.value) {
    // 2. 首次支付前校验地址、商品、优惠券和应付金额。
    now.value = Date.now()
    const address = selectedAddress.value
    if (!address?.name?.trim() || !address.phone?.trim() || !address.address?.trim()) {
      uni.showToast({ title: '请选择完整的服务地址', icon: 'none' })
      return
    }
    if (address.name.trim().length > 50 || address.phone.trim().length > 30) {
      uni.showToast({ title: '联系人姓名或电话过长，请修改', icon: 'none' })
      return
    }
    if (!products.value.length) return
    if (selectedCouponId.value !== null && !selectedCoupon.value) {
      uni.showToast({ title: '优惠券已不可用，请重新选择', icon: 'none' })
      return
    }
    if (amounts.value.payableCents <= 0) {
      uni.showToast({ title: '暂不支持零元支付，请调整抵扣', icon: 'none' })
      return
    }
    const bookingError = validateBooking(appointmentDate.value, appointmentTime.value)
    if (bookingError) {
      uni.showToast({ title: bookingError, icon: 'none' })
      return
    }
    // 预约信息独立提交，备注只包含用户留言。
    const remark = orderRemark.value.trim()
    const serviceAddress = [address.address.trim(), address.doorplate?.trim()]
      .filter(Boolean)
      .join(' ')
    if (serviceAddress.length > 191 || remark.length > 191) {
      uni.showToast({ title: '地址或备注过长，请修改', icon: 'none' })
      return
    }
    paying.value = true
    // 保存本次提交的金额明细，支付后刷新用户信息时保持展示一致。
    const discounts = { ...amounts.value }
    try {
      // 4. 按 DTO 创建订单，仅提交购买选项，由后端计算最终金额。
      const result = await confirmOrder({
        contactName: address.name.trim(),
        contactPhone: address.phone.trim(),
        serviceAddress,
        ...(remark ? { remark } : {}),
        appointmentDate: appointmentDate.value,
        timeSlot: appointmentTime.value,
        items: products.value.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          ...(item.specification ? { skuDescription: item.specification } : {}),
        })),
        ...(selectedCoupon.value ? { userCouponId: selectedCoupon.value.record.id } : {}),
        pointsUsed: amounts.value.pointsDiscount / 100,
      })
      if (cartStore.userId !== ownerId) return
      if (result.code !== 200) throw new Error(result.message || '创建订单失败')
      // 5. 校验并缓存微信支付参数，取消支付后复用，避免重复创建订单。
      const params = result.data
      if (
        !Number.isInteger(params?.orderId) ||
        params.orderId <= 0 ||
        !params?.timeStamp ||
        !params.nonceStr ||
        !params.packageValue ||
        !params.paySign ||
        !['RSA', 'MD5', 'HMAC-SHA256'].includes(params.signType)
      )
        throw new Error('支付参数不完整')
      createdOrderId.value = params.orderId
      paymentParams.value = params
      submittedDiscounts.value = discounts
      submittedAmount.value = money(discounts.payableCents)
    } catch (error) {
      if (cartStore.userId !== ownerId) return
      if ((error as { statusCode?: number }).statusCode === 400) {
        // HTTP 400 明确未创建订单；请求层已展示服务端校验提示。
        return
      }
      console.error('创建支付订单失败', error)
      // 后端可能已创建订单，结果未确认时停止自动重试下单。
      creationUncertain.value = true
      uni.showToast({ title: '下单结果未确认，请核对订单后再试', icon: 'none' })
      return
    } finally {
      paying.value = false
    }
  }
  if (!paymentParams.value || cartStore.userId !== ownerId) return
  paying.value = true
  try {
    // 6. 使用服务端签名参数调起微信支付，等待成功或失败回调。
    await requestWechatPayment(paymentParams.value)
    if (cartStore.userId !== ownerId) return
    paymentSucceeded.value = true
    openCreatedOrder()
    // 7. 支付成功后刷新用户资料和统计，积分及优惠券更新由后端完成。
    void (async () => {
      try {
        const [info, summary] = await Promise.all([
          userInfoFindOne(Number(ownerId)),
          getUserSummary(Number(ownerId)),
        ])
        if (cartStore.userId === ownerId && info.code === 200 && summary.code === 200) {
          memberStore.setProfile({
            ...memberStore.profile,
            ...info.data,
            ...summary.data,
            name: info.data.realName,
          })
        }
      } catch (error) {
        console.error('支付后刷新用户信息失败', error)
      }
    })()
  } catch (error) {
    // 8. 区分取消与其他支付失败，保留支付参数供继续支付。
    console.error('微信支付未完成', error)
    const message = (error as { errMsg?: string })?.errMsg || ''
    uni.showToast({
      title: message.includes('cancel') ? '取消支付' : '支付未完成，请重试',
      icon: 'none',
    })
  } finally {
    // 9. 结束支付加载状态，按钮根据支付结果显示对应操作。
    paying.value = false
  }
}
</script>

<template>
  <view class="order-page">
    <view v-if="!products.length" class="empty-order">
      <view>暂无待结算商品</view><button @click="goShopping">去逛逛</button>
    </view>
    <scroll-view v-else class="order-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <!-- 收货地址 -->
        <view class="info-card address-card" @click="openAddress">
          <image
            class="info-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/定位%201.png"
            mode="aspectFit"
          />
          <view class="info-content">
            <view class="contact-line"
              >{{ selectedAddress?.name || '请选择服务地址' }} {{ selectedPhone }}</view
            >
            <view class="address-line">{{ selectedAddress?.address || '暂无服务地址' }}</view>
            <view class="detail-address"
              >详细地址：{{ selectedAddress?.doorplate || '请补充门牌楼层' }}</view
            >
          </view>
          <text class="iconfont icon-youjiantou right-arrow" />
        </view>

        <!-- 预约安装 -->
        <view class="info-card appointment-card" @click="openAppointment">
          <image
            class="info-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/日历%201.png"
            mode="aspectFit"
          />
          <view class="info-content">
            <view class="appointment-title">预约安装</view>
            <view class="appointment-tip">{{
              appointmentDate ? `${appointmentDate} ${appointmentTime}` : '请选择安装时间'
            }}</view>
            <view class="appointment-note">{{ installationNote }}</view>
          </view>
          <text class="iconfont icon-youjiantou right-arrow" />
        </view>

        <!-- 商品确认与订单选项 -->
        <view class="product-card">
          <view class="card-heading">
            <text class="card-title">商品确认</text>
            <text class="item-count">共{{ totalCount }}件</text>
          </view>
          <view class="product-list">
            <view v-for="item in products" :key="cartItemKey(item)" class="product-item">
              <image class="product-image" :src="item.image" mode="aspectFit" />
              <view class="product-info">
                <view class="product-name">{{ item.name }}</view>
                <view class="product-description">{{
                  item.specification || item.description
                }}</view>
                <view class="product-description">{{
                  item.installationIncluded ? '已含基础安装' : '不含安装服务'
                }}</view>
                <view class="product-bottom">
                  <view class="product-price"><text>¥</text>{{ formatPrice(item.price) }}</view>
                  <text class="quantity">X{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="option-row" @click="openCoupons">
            <text class="option-title">优惠券</text>
            <view class="option-value red">{{
              selectedCoupon
                ? `已抵扣 ¥${money(amounts.couponDiscount)}`
                : availableCouponCount
                ? `${availableCouponCount}张可用，未使用`
                : '暂无可用优惠券'
            }}</view>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>
          <view class="option-row">
            <text class="option-title">积分抵扣</text>
            <view class="option-value muted"
              >{{ pointsBalance }}积分，可抵¥{{ money(maxPointsDiscount) }}</view
            >
            <switch
              class="points-switch"
              color="#D92D20"
              :checked="usePoints"
              :disabled="orderLocked || (!usePoints && maxPointsDiscount === 0)"
              @change="togglePoints"
            />
          </view>
          <view class="points-rule">1积分抵1元，可与优惠券叠加使用</view>
          <view class="option-row" @click="openRemark">
            <text class="option-title">订单备注</text>
            <view class="option-value muted remark-value">{{ remarkLabel }}</view>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>
        </view>

        <!-- 订单金额明细 -->
        <view class="amount-card">
          <view class="card-title">金额明细</view>
          <view class="amount-row"
            ><text>商品金额</text><text class="amount-value">¥ {{ productAmount }}</text></view
          >
          <view class="amount-row"
            ><text>优惠券抵扣</text
            ><text class="amount-value discount">-¥ {{ money(amounts.couponDiscount) }}</text></view
          >
          <view class="amount-row"
            ><text>积分抵扣</text
            ><text class="amount-value discount">-¥ {{ money(amounts.pointsDiscount) }}</text></view
          >
          <view class="amount-divider" />
          <view class="amount-row payable-row"
            ><text>实付款</text
            ><text class="amount-value discount">¥ {{ payableAmount }}</text></view
          >
        </view>
      </view>
    </scroll-view>

    <!-- 固定提交订单栏 -->
    <view v-if="products.length" class="submit-bar">
      <view class="submit-total">
        <view
          ><text class="submit-label">实付款</text
          ><text class="submit-price">¥ {{ payableAmount }}</text></view
        >
        <view class="submit-note">{{ installationNote }}</view>
      </view>
      <button
        class="submit-button"
        :loading="paying"
        :disabled="paying || creationUncertain"
        @click="paymentSucceeded ? openCreatedOrder() : pay()"
      >
        {{
          paymentSucceeded
            ? '查看订单'
            : creationUncertain
            ? '请核对订单'
            : paymentParams
            ? '继续支付'
            : '立即支付'
        }}
      </button>
    </view>

    <wd-popup v-model="couponVisible" position="bottom" round safe-area-inset-bottom>
      <view class="coupon-popup">
        <view class="card-title">选择优惠券</view>
        <scroll-view class="coupon-options" scroll-y>
          <view
            class="coupon-option"
            :class="{ chosen: pendingCouponId === null }"
            @click="pendingCouponId = null"
          >
            <text>不使用优惠券</text><text v-if="pendingCouponId === null">已选择</text>
          </view>
          <wd-empty v-if="!couponOptions.length" tip="暂无优惠券" />
          <view
            v-for="item in couponOptions"
            :key="item.record.id"
            class="coupon-option"
            :class="{ chosen: pendingCouponId === item.record.id, unavailable: !!item.reason }"
            @click="!item.reason && (pendingCouponId = item.record.id)"
          >
            <view class="coupon-copy">
              <view>{{ item.record.coupon.name }}</view>
              <view class="coupon-note"
                >{{
                  Number(item.record.coupon.threshold) > 0
                    ? `满¥${item.record.coupon.threshold}可用`
                    : '无门槛'
                }}
                ·
                {{
                  item.record.coupon.scopeType === 'ALL'
                    ? '全场通用'
                    : item.record.coupon.scopeType === 'PRODUCT'
                    ? '商品券'
                    : '装修券'
                }}</view
              >
              <view class="coupon-note">{{
                item.reason || (pendingCouponId === item.record.id ? '已选择' : '可使用')
              }}</view>
            </view>
            <text class="coupon-value">¥{{ formatPrice(Number(item.record.coupon.amount)) }}</text>
          </view>
        </scroll-view>
        <button class="remark-confirm" @click="confirmCoupon">确认</button>
      </view>
    </wd-popup>

    <!-- 订单备注弹层 -->
    <wd-popup
      v-model="remarkVisible"
      position="bottom"
      round
      safe-area-inset-bottom
      custom-style="height: 790rpx;"
    >
      <view class="remark-popup">
        <view class="remark-popup-title">订单备注</view>
        <view class="remark-section-title">给客服或师傅留言</view>
        <view class="remark-description">备注仅用于本次订单，师傅或客服会在服务前查看</view>
        <view class="remark-input-wrap">
          <textarea
            v-model="remarkDraft"
            class="remark-input"
            :maxlength="100"
            placeholder="选填，例如门禁、停车、希望师傅提前联系"
            placeholder-class="remark-placeholder"
          />
          <view class="remark-count">{{ remarkDraft.length }}/100</view>
        </view>
        <button class="remark-confirm" @click="confirmRemark">确认</button>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss">
.points-rule {
  padding-bottom: 16rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
}

.coupon-popup {
  padding: 32rpx 24rpx;
}

.coupon-options {
  max-height: 55vh;
  height: 650rpx;
  margin-top: 24rpx;
}

.coupon-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 24rpx;
  border: 2rpx solid $jfx-border;
  border-radius: 16rpx;
  font-size: 26rpx;
}

.coupon-option.chosen {
  border-color: $jfx-brandColor;
  background: #fff4f3;
}

.coupon-option.unavailable {
  opacity: 0.5;
}

.coupon-copy {
  min-width: 0;
  flex: 1;
  overflow-wrap: break-word;
}

.coupon-note {
  margin-top: 10rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
}

.coupon-value {
  margin-left: 20rpx;
  color: $jfx-brandColor;
}

.empty-order {
  padding: 80rpx 24rpx;
  text-align: center;
}

.empty-order button {
  margin-top: 24rpx;
}

.submit-button[disabled] {
  opacity: 0.5;
}

/* 页面基础布局 */
.order-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.order-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx 24rpx 30rpx;
}

/* 地址与预约信息卡片 */
.info-card,
.product-card,
.amount-card {
  background: #fff;
  border-radius: 18rpx;
}

.info-card {
  display: flex;
  min-height: 126rpx;
  padding: 22rpx 24rpx;
  align-items: center;
  gap: 18rpx;
}

.info-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.right-arrow {
  flex-shrink: 0;
  color: $jfx-font-dec2;
  font-size: 28rpx;
  line-height: 32rpx;
}

.info-content {
  min-width: 0;
  flex: 1;
}

.contact-line,
.appointment-title {
  color: $jfx-font-title;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 35rpx;
}

.address-line {
  margin-top: 5rpx;
  color: $jfx-font-title;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 33rpx;
}

.detail-address,
.appointment-tip,
.appointment-note {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 32rpx;
}

.detail-address {
  margin-top: 4rpx;
}

.appointment-card {
  margin-top: 24rpx;
}

.appointment-title {
  font-size: 26rpx;
}

.appointment-tip {
  margin-top: 3rpx;
  color: $jfx-font-dec;
}

/* 商品确认与订单选项 */
.product-card {
  margin-top: 24rpx;
  padding: 22rpx 24rpx 0;
}

.card-heading {
  display: flex;
  padding-bottom: 17rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid $jfx-border;
}

.card-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.item-count {
  color: $jfx-font-dec2;
  font-size: 24rpx;
}

.product-item {
  display: flex;
  min-height: 164rpx;
  margin-left: 118rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $jfx-border;
}

.product-item:last-child {
  border-bottom: 0;
}

.product-image {
  width: 100rpx;
  height: 100rpx;
  margin-left: -118rpx;
  flex-shrink: 0;
  align-self: center;
  background: #faf9f7;
  border-radius: 14rpx;
}

.product-info {
  display: flex;
  min-width: 0;
  margin-left: 18rpx;
  flex: 1;
  flex-direction: column;
}

.product-name {
  @include ellipsis(2);

  color: $jfx-font-dec;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.product-description {
  @include ellipsis;

  margin-top: 8rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 30rpx;
}

.product-bottom {
  display: flex;
  margin-top: auto;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  color: $jfx-brandColor;
  font-size: 25rpx;
}

.product-price text {
  margin-right: 4rpx;
  font-size: 21rpx;
}

.quantity {
  color: $jfx-font-dec;
  font-size: 22rpx;
}

.option-row {
  display: flex;
  min-height: 76rpx;
  align-items: center;
  border-top: 2rpx solid $jfx-border;
}

.option-title {
  flex-shrink: 0;
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 500;
}

.option-value {
  margin-left: auto;
  font-size: 22rpx;
}

.option-value.red {
  color: $jfx-brandColor;
}

.option-value.muted {
  color: $jfx-font-dec2;
}

.remark-value {
  @include ellipsis;

  max-width: 360rpx;
}

.points-switch {
  margin-left: 18rpx;
  transform: scale(0.72);
  transform-origin: right center;
}

/* 金额明细 */
.amount-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.amount-row {
  display: flex;
  margin-top: 20rpx;
  align-items: center;
  justify-content: space-between;
  color: $jfx-font-dec;
  font-size: 23rpx;
}

.amount-value {
  color: $jfx-font-title;
}

.amount-value.discount {
  color: $jfx-brandColor;
}

.amount-divider {
  height: 2rpx;
  margin-top: 20rpx;
  background: $jfx-border;
}

.payable-row {
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 600;
}

/* 底部订单提交栏 */
.submit-bar {
  display: flex;
  box-sizing: border-box;
  height: calc(140rpx + constant(safe-area-inset-bottom));
  height: calc(140rpx + env(safe-area-inset-bottom));
  padding: 12rpx 24rpx calc(12rpx + constant(safe-area-inset-bottom));
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}

.submit-total {
  min-width: 0;
  flex: 1;
}

.submit-label {
  color: $jfx-font-dec;
  font-size: 24rpx;
}

.submit-price {
  margin-left: 20rpx;
  color: $jfx-brandColor;
  font-size: 30rpx;
}

.submit-note {
  margin-top: 3rpx;
  color: $jfx-font-dec2;
  font-size: 20rpx;
}

.submit-button {
  width: 244rpx;
  height: 62rpx;
  margin: 0;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 62rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

/* 订单备注弹层 */
.remark-popup {
  box-sizing: border-box;
  height: 100%;
  padding: 34rpx 56rpx 30rpx;
  background: #fff;
}

.remark-popup-title {
  color: $jfx-font-title;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 48rpx;
  text-align: center;
}

.remark-section-title {
  margin-top: 44rpx;
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.remark-description {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 34rpx;
}

.remark-input-wrap {
  position: relative;
  box-sizing: border-box;
  height: 250rpx;
  margin-top: 26rpx;
  padding: 24rpx 24rpx 52rpx;
  background: #faf9f7;
  border: 2rpx solid $jfx-border2;
  border-radius: 16rpx;
}

.remark-input {
  width: 100%;
  height: 100%;
  color: $jfx-font-title;
  font-size: 25rpx;
  line-height: 36rpx;
  background: transparent;
}

.remark-placeholder {
  color: $jfx-font-dec2;
}

.remark-count {
  position: absolute;
  right: 24rpx;
  bottom: 18rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 32rpx;
}

.remark-confirm {
  height: 64rpx;
  margin: 80rpx 0 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>
