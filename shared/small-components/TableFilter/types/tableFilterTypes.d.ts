import React from "react"

export type ColumnsType = {
    key?: any;
    field : string;
    header:string
    filter?: boolean
    filterPlaceholder?: string
    body?: (rowData) => any
    style?: any
}

export type TableFilterProps = {
    size? : "small"|"normal"|"large"| undefined
    dataKey: string;
    className? : string;
    dataMenu : any[];
    headerCardName? : string;
    headerTableName? : () => React.ReactNode
    emptyMessage? : string
    rowsPerPage? : number;
    columns : ColumnsType[];
    loading? : boolean;
}
