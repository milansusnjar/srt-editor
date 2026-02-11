import { useEffect } from "preact/hooks";
import { ComponentChildren } from "preact";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div class="modal-backdrop" onClick={handleBackdropClick}>
      <div class="modal">
        <div class="modal-header">
          <span>{title}</span>
          <button class="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div class="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
