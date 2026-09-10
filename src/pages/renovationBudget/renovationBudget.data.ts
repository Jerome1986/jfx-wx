import type { BenefitItem, CalculationNote } from '@/types/renovation-budget'

// 用户可获得的服务内容
export const benefitList: BenefitItem[] = [
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/gujia.png',
    title: '总体估价',
    description: '按城市、面积、户型\n快速计算预算区间',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/mingxi.png',
    title: '费用明细',
    description: '主材、辅材、人工\n分享展示更清晰',
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
    content: '预算会收城市、面积、户型、房屋新旧和装修范围影响。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/zhucai.png',
    content: '主材品牌、施工工艺和增项需求会在符合后形成正式报价。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/anquandunpai.png',
    content: '手机号仅用于报价沟通，信息会按平台隐私规则保护。',
  },
]
