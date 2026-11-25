import { getIcon, IconType } from "./Icons";

const colorMapping = {
  Accept: {
    base: "bg-green-700",
    hover: "hover:bg-green-500",
  },
  Deny: {
    base: "bg-red-900",
    hover: "hover:bg-red-800",
  },
  Default: {
    base: "bg-blue-700",
    hover: "hover:bg-blue-500",
  },
  Disabled: {
    base: "bg-gray-600",
    hover: "hover:bg-gray-600",
  },
};

interface Props {
  title?: string;
  subTitle?: string;
  isDisabled?: boolean;
  onClick?: () => void;

  color?: "Accept" | "Deny";
  iconLeft?: IconType;
  iconRight?: IconType;
  classNames?: string;

  stretch?: boolean;
  center?: boolean;
}

export default function Button(props: Props) {
  const color = props.isDisabled
    ? colorMapping.Disabled
    : props.color === "Accept"
      ? colorMapping.Accept
      : props.color === "Deny"
        ? colorMapping.Deny
        : colorMapping.Default;

  return (
    <button
      type="button"
      disabled={props.isDisabled}
      className={`flex text-white font-medium px-4 py-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed ${props.center === true ? "justify-center" : ""} ${props.stretch ? "w-full" : "w-fit"} ${color.base} ${color.hover} ${props.classNames ?? ""}`}
      onClick={props.onClick}
    >
      {props.iconLeft && <div className="mr-2">{getIcon(props.iconLeft)}</div>}

      <div className="flex flex-col">
        <div className="font-bold">{props.title}</div>
        <div className="font-light">{props.subTitle}</div>
      </div>

      {props.iconRight && <div className="ml-2">{getIcon(props.iconRight)}</div>}
    </button>
  );
}
