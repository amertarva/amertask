export interface GoogleDocsUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  title: string;
  description: string;
  isLoading?: boolean;
}
