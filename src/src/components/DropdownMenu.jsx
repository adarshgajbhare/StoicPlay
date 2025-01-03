import React, { useRef, useEffect } from "react";

const DropdownMenu = ({
  isOpen,
  onClose,
  items,
  position = "right",
  width = "w-64",
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-4 top-12 z-50 flex  w-52 flex-col overflow-hidden rounded   
       bg-[#101010] text-sm/none text-white ring-[1px] ring-white/10"
    >
      {items.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          {sectionIndex > 0 && <div className=" bg-red-600" />}
          <div className="">
            {section.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`flex w-full text-base/4 hover:bg-white/5 items-center justify-between border-b border-white/10  px-3 py-2
                  ${item.destructive ? "text-red-500" : "text-white"}`}
              >
                <span>{item.label}</span>
                {item.icon && <span className="size-5">{item.icon}</span>}
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default DropdownMenu;
