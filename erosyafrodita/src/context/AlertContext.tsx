import React, { createContext, useContext, useState } from "react";

type AlertType = "info" | "success" | "error" | "warning";

interface AlertState {
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
}

interface AlertContextType {
    showAlert: (title: string, message: string, type?: AlertType) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, type?: AlertType, confirmText?: string) => void;
    hideAlert: () => void;
    alertState: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    });

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: undefined,
        });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: AlertType = "warning", confirmText: string = "Confirmar") => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
            confirmText,
        });
    };

    const hideAlert = () => {
        setAlertState((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert, alertState }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert debe usarse dentro de AlertProvider");
    }
    return context;
};
