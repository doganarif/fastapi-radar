import { createContext, useContext, useState, ReactNode } from "react";

interface DetailDrawerContextType {
  openDetail: (
    type: "request" | "query" | "exception" | "trace",
    id: string,
  ) => void;
  closeDetail: () => void;
  isOpen: boolean;
  detailType: "request" | "query" | "exception" | "trace" | null;
  detailId: string | null;
}

const DetailDrawerContext = createContext<DetailDrawerContextType | undefined>(
  undefined,
);

export function DetailDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [detailType, setDetailType] = useState<
    "request" | "query" | "exception" | "trace" | null
  >(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const openDetail = (
    type: "request" | "query" | "exception" | "trace",
    id: string,
  ) => {
    setDetailType(type);
    setDetailId(id);
    setIsOpen(true);
  };

  const closeDetail = () => {
    setIsOpen(false);
    // Keep the type and id for animation purposes
    setTimeout(() => {
      setDetailType(null);
      setDetailId(null);
    }, 300);
  };

  return (
    <DetailDrawerContext.Provider
      value={{ openDetail, closeDetail, isOpen, detailType, detailId }}
    >
      {children}
    </DetailDrawerContext.Provider>
  );
}

export function useDetailDrawer() {
  const context = useContext(DetailDrawerContext);
  if (!context) {
    throw new Error(
      "useDetailDrawer must be used within a DetailDrawerProvider",
    );
  }
  return context;
}
