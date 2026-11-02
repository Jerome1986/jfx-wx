import { useMemberStore } from '@/stores/modules/member'
import { userInfoFindOne, getUserSummary } from '@/api/user'

// 关闭订单后刷新实际返还结果，不在前端自行增加积分或释放优惠券。
export const refreshOrderBenefits = async () => {
  const member = useMemberStore()
  const userId = Number(member.profile?.id)
  const token = member.token
  if (!token || !Number.isSafeInteger(userId) || userId <= 0) return
  try {
    const [info, summary] = await Promise.all([userInfoFindOne(userId), getUserSummary(userId)])
    if (member.token !== token || Number(member.profile?.id) !== userId) return
    member.setProfile({
      ...member.profile,
      ...info.data,
      ...summary.data,
      name: info.data.realName,
    })
  } catch {
    // 保留原资料，下次进入订单或个人页面时重试刷新。
  }
}
