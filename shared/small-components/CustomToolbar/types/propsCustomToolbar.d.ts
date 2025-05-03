/* eslint-disable no-undef */
export type PropsCustomToolbar = {
    className?: string;
    start? : React.ReactNode;
    startStatus?: boolean;
    startNew?: () => void;
    customLabelStartNew? : string;
    starUpload?: (e) => void;
    end? : React.ReactNode;
    endStatus?: boolean;
    center?: React.ReactNode;
    multiComponet?: React.ReactNode;
    downloadExcel?: () => void;
    downloadPdf?: () => void;
    downloadWord?: () => void;
}
