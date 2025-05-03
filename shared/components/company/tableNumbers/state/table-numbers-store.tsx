import { create } from "zustand"

type TableNumbersModalStoreForm = {
    modalVisible: boolean
    setModalVisible: (input : boolean) => void
}

export const useTableNumbersStore = create<TableNumbersModalStoreForm>((set) => ({
  modalVisible: false,
  setModalVisible: (input) => set((state) => ({ modalVisible: input }))
}))
