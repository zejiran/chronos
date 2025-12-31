import { JSX, splitProps, Show } from "solid-js";
import { css, cx } from "../../../styled-system/css";
import { Loader2 } from "lucide-solid";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: JSX.Element;
  iconPosition?: "left" | "right";
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "loading",
    "icon",
    "iconPosition",
    "children",
    "class",
    "disabled",
  ]);

  const variant = () => local.variant ?? "primary";
  const size = () => local.size ?? "md";
  const iconPosition = () => local.iconPosition ?? "left";

  const baseStyles = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "sm",
    fontWeight: "medium",
    borderRadius: "md",
    transition: "all 150ms",
    cursor: "pointer",
    border: "none",
    outline: "none",
    _focus: {
      boxShadow: "0 0 0 2px {colors.primary}",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  });

  const variantStyles = {
    primary: css({
      backgroundColor: "primary",
      color: "background",
      _hover: {
        backgroundColor: "primaryHover",
      },
    }),
    secondary: css({
      backgroundColor: "muted",
      color: "foreground",
      _hover: {
        backgroundColor: "mutedHover",
      },
    }),
    ghost: css({
      backgroundColor: "transparent",
      color: "foreground",
      _hover: {
        backgroundColor: "hover",
      },
    }),
    danger: css({
      backgroundColor: "error",
      color: "background",
      _hover: {
        opacity: 0.9,
      },
    }),
  };

  const sizeStyles = {
    sm: css({
      paddingTop: "6px",
      paddingBottom: "6px",
      paddingLeft: "12px",
      paddingRight: "12px",
      fontSize: "13px",
      height: "32px",
    }),
    md: css({
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "16px",
      paddingRight: "16px",
      fontSize: "14px",
      height: "36px",
    }),
    lg: css({
      paddingTop: "12px",
      paddingBottom: "12px",
      paddingLeft: "24px",
      paddingRight: "24px",
      fontSize: "15px",
      height: "44px",
    }),
  };

  return (
    <button
      class={cx(
        baseStyles,
        variantStyles[variant()],
        sizeStyles[size()],
        local.class,
      )}
      disabled={local.disabled || local.loading}
      {...rest}
    >
      <Show when={local.loading}>
        <Loader2
          size={16}
          class={css({
            animation: "spin 1s linear infinite",
          })}
        />
      </Show>
      <Show when={!local.loading && local.icon && iconPosition() === "left"}>
        {local.icon}
      </Show>
      {local.children}
      <Show when={!local.loading && local.icon && iconPosition() === "right"}>
        {local.icon}
      </Show>
    </button>
  );
}
