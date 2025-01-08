import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { IconSquareCheckFilled, IconX } from "@tabler/icons-react";

export default function Toast({
  isOpen,
  message,
  secondaryText,
  variant = "info",
  icon: Icon,
  duration = 5000,
  onClose,
  position = "top-right",
  showCloseButton = true,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      timerRef.current = setTimeout(() => {
        onClose && onClose();
      }, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed flex items-start w-[350px] gap-2.5  z-50 filter  backdrop-blur-xl  text-white p-4 rounded-2xl shadow-[inset_0.1px_0.5px_0.6px_0.5px_rgba(255,255,255,0.2)] text-sm font-medium saturate-200 overflow-hidden
        ${position === "top-right" && "top-6 right-6"}
        ${position === "top-left" && "top-6 left-6"}
        ${position === "bottom-right" && "bottom-6 right-6"}
        ${position === "bottom-left" && "bottom-6 left-6"} 
        ${variant === "success" && "bg-[#151515] "}
        ${variant === "error" && "bg-[#151515] "}
        ${variant === "info" && "bg-[#151515] "}
      `}
    >
      <div className="flex items-start gap-2.5">
        {Icon && (
          <div className="flex-shrink-0">
             <IconSquareCheckFilled
              size={18}
              strokeWidth={1}
              className="relative top-[5px] text-gray-50"
            />
          </div>
        )}
        <div>
          <h1 className="text-lg font-[600] tracking-tight">{message}</h1>
          {secondaryText && (
            <p className="ext-base/5 pr-2 max-w-72  font-[500] tracking-tight text-pretty  text-[#555555]">{secondaryText}</p>
          )}
        </div>
        {showCloseButton && (
          <button
            className="ml-auto text-sm text-gray-200 hover:text-white"
            onClick={onClose}
          >
              <IconX
              size={18}
              strokeWidth={1}
              className="relative top-[5px] text-gray-50"
            />
          </button>
        )}
      </div>
    </div>
  );
}

Toast.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  secondaryText: PropTypes.string,
  variant: PropTypes.oneOf(["success", "error", "info"]),
  icon: PropTypes.elementType,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  position: PropTypes.oneOf([
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
  ]),
  showCloseButton: PropTypes.bool,
};