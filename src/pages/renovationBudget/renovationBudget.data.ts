import type { BenefitItem, CalculationNote } from '@/types/renovation-budget'

// 用户可获得的服务内容
export const benefitList: BenefitItem[] = [
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/gujia.png',
    title: '上门测量',
    description: '顾问联系确认时间\n现场核实房屋情况',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/mingxi.png',
    title: '费用明细',
    description: '主材、辅材、人工\n预估报价清晰可查',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/jianyi.png',
    title: '服务建议',
    description: '匹配量房、报价\n施工与售后保障',
  },
]

// 计算说明列表
export const calculationNotes: CalculationNote[] = [
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/house.png',
    content: '房屋信息用于顾问了解需求和安排后续上门测量。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/zhucai.png',
    content: '主材品牌、施工工艺和现场情况确认后形成预估报价。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/anquandunpai.png',
    content: '手机号仅用于报价沟通，信息会按平台隐私规则保护。',
  },
]
