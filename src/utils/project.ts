import type { ProjectDetailResult } from '@/types/project'
import type { RenovationProject } from '@/types/renovation-business'

// 将后端项目详情转换为页面使用的数据结构。
export const normalizeProject = (data: ProjectDetailResult): RenovationProject => {
  // 1. 校验详情接口必须返回的项目 ID 和状态。
  if (!data || !Number.isSafeInteger(data.id) || data.id <= 0 || !data.status)
    throw new Error('项目详情数据不完整')
  // 2. 优先使用接口报价对象，否则转换 quoteItems 明细。
  const quote =
    data.quote ||
    (data.quoteItems
      ? {
          discount: '0',
          items: data.quoteItems.map((item, index) => ({
            id: String(item.id || `project-${data.id}-${index}`),
            source: 'api' as const,
            productId: item.productId ?? null,
            sourceItemId: item.id,
            businessCategory: item.category,
            category: item.productId == null ? ('service' as const) : ('product' as const),
            name: item.name,
            description: item.description || '',
            image: item.image || '',
            unit: item.unit,
            unitPrice: String(item.unitPrice),
            quantity: String(item.quantity),
          })),
        }
      : undefined)
  // 3. 规范金额和可选字段，生成页面项目对象。
  return {
    id: data.id,
    projectNo: data.projectNo || `项目 ${data.id}`,
    appointmentId: data.appointmentId ?? undefined,
    userId: data.userId,
    employeeId: data.employeeId,
    employeeName: data.employee?.user?.realName?.trim() || data.employeeName,
    planId: data.planId ?? undefined,
    planName: data.plan?.name?.trim() || data.planName,
    name: data.name || '装修项目',
    customerName: data.customerName || '未填写',
    mobile: data.mobile || '',
    serviceAddress: data.serviceAddress || '未填写',
    renovationScope: data.renovationScope,
    remark: data.remark,
    quotedAmount: Number(data.quotedAmount) || 0,
    quote,
    planSource: 'api',
    sourceKind: data.appointmentId ? 'appointment' : undefined,
    status: data.status,
    quoteSubmittedAt: data.quoteSubmittedAt,
    customerConfirmedAt: data.customerConfirmedAt,
    completedAt: data.completedAt,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  }
}
