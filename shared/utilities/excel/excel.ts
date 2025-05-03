import * as xlsx from "xlsx"

export class Excel {
  public static convertExcelToArray (file: any, callback: any) {
    let workBook: any = null
    let jsonData: any = null
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      workBook = xlsx.read(data, { type: "binary" })
      jsonData = workBook.SheetNames.reduce((initial: any, name: any) => {
        const sheet = workBook.Sheets[name]
        initial[name] = xlsx.utils.sheet_to_json(sheet)
        return initial
      }, {})
      callback(jsonData)
    }
    reader.readAsBinaryString(file)
  }

  public static convertArrayToFile (data: any[], fileName: string) {
    const reader = new FileReader()
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    const EXCEL_EXTENSION = ".xlsx"
    const worksheet: xlsx.WorkSheet = xlsx.utils.json_to_sheet(data)
    const workBook: xlsx.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ["data"]
    }
    const excelBuffer: any = xlsx.write(workBook, {
      bookType: "xlsx",
      type: "array"
    })
    const file: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
    const a = document.createElement("a")
    a.style.display = "none"
    reader.readAsDataURL(file)
    reader.onload = (response: any) => {
      a.href = response.target.result.toString()
      a.download = `${fileName}${EXCEL_EXTENSION}`
      a.click()
      a.remove()
    }
  }
}
