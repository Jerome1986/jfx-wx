import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ServiceAddress } from '@/types/address'

export type { ServiceAddress } from '@/types/address'

const defaultAddresses: ServiceAddress[] = [
  {
    id: 1,
    name: '张先生',
    phone: '138****5628',
    locationName: '湖北省武汉市洪山区珞瑜路',
    address: '湖北省武汉市洪山区珞瑜路88号',
    doorplate: '2栋1单元303',
  },
  {
    id: 2,
    name: '张先生',
    phone: '138****5628',
    locationName: '湖北省武汉市洪山区珞瑜路',
    address: '湖北省武汉市洪山区珞瑜路88号',
    doorplate: '2栋1单元303',
  },
  {
    id: 3,
    name: '张先生',
    phone: '138****5628',
    locationName: '湖北省武汉市洪山区珞瑜路',
    address: '湖北省武汉市洪山区珞瑜路88号',
    doorplate: '2栋1单元303',
  },
]

export const useAddressStore = defineStore(
  'address',
  () => {
    // 地址数据和当前选择
    const addresses = ref<ServiceAddress[]>(defaultAddresses)
    const selectedId = ref(1)
    const selectedAddress = computed(
      () => addresses.value.find((item) => item.id === selectedId.value) || addresses.value[0],
    )

    // 新增地址并设为当前地址
    const addAddress = (payload: Omit<ServiceAddress, 'id'>) => {
      const id = addresses.value.reduce((max, item) => Math.max(max, item.id), 0) + 1
      addresses.value.push({ id, ...payload })
      selectedId.value = id
      return id
    }

    // 更新指定地址
    const updateAddress = (id: number, payload: Omit<ServiceAddress, 'id'>) => {
      const index = addresses.value.findIndex((item) => item.id === id)
      if (index < 0) return false
      addresses.value[index] = { id, ...payload }
      return true
    }

    // 删除地址并修正当前选择
    const removeAddress = (id: number) => {
      const index = addresses.value.findIndex((item) => item.id === id)
      if (index < 0) return false
      addresses.value.splice(index, 1)
      if (selectedId.value === id) selectedId.value = addresses.value[0]?.id || 0
      return true
    }

    // 切换当前服务地址
    const selectAddress = (id: number) => {
      if (addresses.value.some((item) => item.id === id)) selectedId.value = id
    }

    return {
      addresses,
      selectedId,
      selectedAddress,
      addAddress,
      updateAddress,
      removeAddress,
      selectAddress,
    }
  },
  { persist: true },
)
