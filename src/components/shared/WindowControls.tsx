import { createSignal } from "solid-js";
import { css } from "../../../styled-system/css";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function WindowControls() {
  const [isHovered, setIsHovered] = createSignal(false);
  const appWindow = getCurrentWindow();

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleFullscreen = async () => {
    const isFullscreen = await appWindow.isFullscreen();
    appWindow.setFullscreen(!isFullscreen);
  };

  return (
    <div
      style={{ "-webkit-app-region": "no-drag" }}
      class={css({
        display: "flex",
        alignItems: "center",
        gap: "8px",
        paddingLeft: "4px",
        paddingRight: "8px",
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Close button - Red */}
      <button
        onClick={handleClose}
        class={css({
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#ff5f57",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 100ms ease",
          _hover: {
            filter: "brightness(0.9)",
          },
        })}
        title="Close"
      >
        {isHovered() && (
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path
              d="M1 1L5 5M5 1L1 5"
              stroke="#4a0002"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        )}
      </button>

      {/* Minimize button - Yellow */}
      <button
        onClick={handleMinimize}
        class={css({
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#febc2e",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 100ms ease",
          _hover: {
            filter: "brightness(0.9)",
          },
        })}
        title="Minimize"
      >
        {isHovered() && (
          <svg width="6" height="2" viewBox="0 0 6 2" fill="none">
            <path
              d="M1 1H5"
              stroke="#995700"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        )}
      </button>

      {/* Fullscreen button - Green */}
      <button
        onClick={handleFullscreen}
        class={css({
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#28c840",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 100ms ease",
          _hover: {
            filter: "brightness(0.9)",
          },
        })}
        title="Fullscreen"
      >
        {isHovered() && (
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path
              d="M1 2.5V1.5C1 1.22386 1.22386 1 1.5 1H4.5C4.77614 1 5 1.22386 5 1.5V4.5C5 4.77614 4.77614 5 4.5 5H3.5"
              stroke="#006500"
              stroke-width="1"
              stroke-linecap="round"
            />
            <path
              d="M1 3.5V4.5C1 4.77614 1.22386 5 1.5 5H2.5"
              stroke="#006500"
              stroke-width="1"
              stroke-linecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
