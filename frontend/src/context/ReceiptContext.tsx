import { createContext, useContext, useState, ReactNode } from "react";

export type ReceiptItem = {
  name: string;
  price: number;
  carbon: number;
  alternative: string;
  saving: number;
};

type ReceiptContextType = {
  receiptItems: ReceiptItem[];
  setReceiptItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;

  totalCarbon: number;
  setTotalCarbon: React.Dispatch<React.SetStateAction<number>>;

  uploaded: string;
  setUploaded: React.Dispatch<React.SetStateAction<string>>;

  done: boolean;
  setDone: React.Dispatch<React.SetStateAction<boolean>>;
};

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [uploaded, setUploaded] = useState("");
  const [done, setDone] = useState(false);

  return (
    <ReceiptContext.Provider
      value={{
        receiptItems,
        setReceiptItems,
        totalCarbon,
        setTotalCarbon,
        uploaded,
        setUploaded,
        done,
        setDone,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const context = useContext(ReceiptContext);

  if (!context) {
    throw new Error("useReceipt must be used inside ReceiptProvider");
  }

  return context;
}