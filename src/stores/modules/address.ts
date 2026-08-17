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

    const setAddresses = (items: ServiceAddress[]) => {
      addresses.value = items
      if (!items.some((item) => item.id === selectedId.value)) {
        selectedId.value = items[0]?.id || 0
      }
    }

    // 新增地址并设为当前地址
    const addAddress = (payload: ServiceAddress) => {
      addresses.value.push(payload)
      selectedId.value = payload.id
      return payload.id
    }

    // 更新指定地址
    const updateAddress = (id: number, payload: ServiceAddress) => {
      const index = addresses.value.findIndex((item) => item.id === id)
      if (index < 0) return false
      addresses.value[index] = { ...payload, id }
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
      setAddresses,
      addAddress,
      updateAddress,
      removeAddress,
      selectAddress,
    }
  },
  { persist: true },
)
