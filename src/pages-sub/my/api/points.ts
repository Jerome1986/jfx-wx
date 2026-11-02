import type { PointsApiType, PointsRecordPage, ScoreSummary } from '@/types/points'
import { request } from '@/utils/http'

/** 分页获取当前用户近六个月的积分明细 */
export const getPointRecords = (data: { type: PointsApiType; pageNum: number; pageSize: number }) =>
  request<PointsRecordPage>({
    method: 'GET',
    url: '/user/pointRecord',
    data,
  })

/** 获取当前用户的积分统计 */
export const getScoreSummary = () =>
  request<ScoreSummary>({
    method: 'GET',
    url: '/user/scoreSummary',
  })
