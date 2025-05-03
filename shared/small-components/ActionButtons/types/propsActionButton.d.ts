export type PropsActionButton = {
    actionEye?: () => void;
    actionPencil?: () => void;
    actionDelete?: () => Promise<void>;
    actionAsignate?: () => void;
    actionCharge?: () => void;
}
